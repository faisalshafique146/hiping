import { WebSocket } from "ws";
import { createTerminal } from "./terminal.js";

const RELAY_URL = process.env.RELAY_URL || "ws://localhost:8080";
const RECONNECT_DELAY_MS = 5000;

let relay = null;
let terminal = null;
let reconnectTimer = null;
let shuttingDown = false;

function formatCode(code) {
  const digits = String(code).replace(/\D/g, "").padStart(6, "0").slice(0, 6).split("");
  return `${digits.slice(0, 3).join(" ")} - ${digits.slice(3).join(" ")}`;
}

function printReadyCode(code) {
  console.log("╔══════════════════════════╗");
  console.log("║  HiPing is ready!        ║");
  console.log(`║  Code: ${formatCode(code).padEnd(15)}║`);
  console.log("║  Waiting for browser...  ║");
  console.log("╚══════════════════════════╝");
}

function killTerminal() {
  if (!terminal) {
    return;
  }

  terminal.kill();
  terminal = null;
}

function cleanupRelay() {
  if (!relay) {
    return;
  }

  relay.removeAllListeners();
  relay = null;
}

function scheduleReconnect() {
  if (shuttingDown || reconnectTimer) {
    return;
  }

  console.log("Relay disconnected. Reconnecting in 5s...");

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToRelay();
  }, RECONNECT_DELAY_MS);
}

function startTerminal() {
  if (terminal) {
    return;
  }

  console.log("Browser connected! Starting terminal...");
  terminal = createTerminal({ cols: 80, rows: 24 });

  terminal.onData((data) => {
    if (relay?.readyState === WebSocket.OPEN) {
      relay.send(String(data));
    }
  });

  terminal.onExit(() => {
    console.log("Terminal exited");
    terminal = null;

    if (relay?.readyState === WebSocket.OPEN || relay?.readyState === WebSocket.CONNECTING) {
      relay.close();
    }
  });
}

function handleRelayMessage(rawMessage) {
  const message = typeof rawMessage === "string" ? rawMessage : rawMessage.toString();

  try {
    const payload = JSON.parse(message);

    if (payload?.type === "code" && payload.code) {
      printReadyCode(payload.code);
      return;
    }

    if (payload?.type === "browser_connected") {
      startTerminal();
      return;
    }

    if (payload?.type === "browser_disconnected") {
      console.log("Browser disconnected. Waiting for new connection...");
      killTerminal();
      return;
    }

    if (payload?.type === "resize" && terminal) {
      terminal.resize(payload.cols, payload.rows);
      return;
    }
  } catch {
    // Raw terminal input is forwarded as-is after pairing.
  }

  if (terminal) {
    terminal.write(message);
  }
}

function connectToRelay() {
  if (shuttingDown) {
    return;
  }

  cleanupRelay();

  const socket = new WebSocket(RELAY_URL);
  relay = socket;

  socket.on("open", () => {
    socket.send(JSON.stringify({ type: "register" }));
  });

  socket.on("message", (data) => {
    handleRelayMessage(data);
  });

  const handleDisconnect = () => {
    if (relay !== socket) {
      return;
    }

    killTerminal();
    cleanupRelay();
    scheduleReconnect();
  };

  socket.on("close", handleDisconnect);
  socket.on("error", handleDisconnect);
}

function shutdown() {
  shuttingDown = true;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  killTerminal();

  if (relay?.readyState === WebSocket.OPEN || relay?.readyState === WebSocket.CONNECTING) {
    relay.close();
  }

  cleanupRelay();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

connectToRelay();
