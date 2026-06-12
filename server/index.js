import { WebSocket, WebSocketServer } from "ws";

const PORT = 8080;
const sessions = new Map();
const wss = new WebSocketServer({ port: PORT });

function generateCode() {
  let code = Math.floor(100000 + Math.random() * 900000).toString();

  while (sessions.has(code)) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  }

  return code;
}

function sendJson(ws, payload) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function cleanupSession(code) {
  const session = sessions.get(code);

  if (!session) {
    return;
  }

  if (!session.agent && !session.browser) {
    sessions.delete(code);
  }
}

function closeConnection(ws, code, reason) {
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close(1000, reason);
  }
}

function handleDisconnect(ws) {
  if (ws.cleanedUp) {
    return;
  }

  ws.cleanedUp = true;

  const { code, role } = ws;

  if (!code || !role) {
    return;
  }

  const session = sessions.get(code);

  if (!session) {
    return;
  }

  if (role === "agent") {
    if (session.agent === ws) {
      session.agent = null;
    }

    if (session.browser) {
      sendJson(session.browser, { type: "agent_disconnected" });
      closeConnection(session.browser, "Agent disconnected");
      session.browser = null;
    }

    console.log(`Agent disconnected for code ${code}`);
  }

  if (role === "browser") {
    if (session.browser === ws) {
      session.browser = null;
    }

    if (session.agent) {
      sendJson(session.agent, { type: "browser_disconnected" });
    }

    console.log(`Browser disconnected for code ${code}`);
  }

  cleanupSession(code);
}

function registerAgent(ws) {
  const code = generateCode();

  ws.role = "agent";
  ws.code = code;

  sessions.set(code, {
    agent: ws,
    browser: null
  });

  sendJson(ws, { type: "code", code });
  console.log(`Agent registered with code ${code}`);
}

function joinBrowser(ws, code) {
  const session = sessions.get(code);

  if (!session || !session.agent) {
    sendJson(ws, { type: "error", message: "Invalid code" });
    return;
  }

  if (session.browser) {
    sendJson(ws, { type: "error", message: "Invalid code" });
    return;
  }

  ws.role = "browser";
  ws.code = code;
  session.browser = ws;

  sendJson(ws, { type: "joined" });
  sendJson(session.agent, { type: "browser_connected" });
  console.log(`Browser joined session ${code}`);
}

function forwardToPartner(ws, rawMessage) {
  const session = sessions.get(ws.code);

  if (!session) {
    return;
  }

  const partner = ws.role === "agent" ? session.browser : session.agent;

  if (partner?.readyState === WebSocket.OPEN) {
    partner.send(rawMessage);
  }
}

wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.role = null;
  ws.code = null;
  ws.cleanedUp = false;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message, isBinary) => {
    if (ws.role && ws.code) {
      forwardToPartner(ws, isBinary ? message : message.toString());
      return;
    }

    let payload;

    try {
      payload = JSON.parse(message.toString());
    } catch {
      sendJson(ws, { type: "error", message: "Invalid message" });
      return;
    }

    if (payload?.type === "register") {
      registerAgent(ws);
      return;
    }

    if (payload?.type === "join" && typeof payload.code === "string") {
      joinBrowser(ws, payload.code);
      return;
    }

    sendJson(ws, { type: "error", message: "Invalid message" });
  });

  ws.on("close", () => {
    handleDisconnect(ws);
  });

  ws.on("error", () => {
    handleDisconnect(ws);
  });
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) {
      ws.terminate();
      continue;
    }

    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeat);
});

console.log(`Relay server listening on ws://localhost:${PORT}`);
