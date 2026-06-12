import { WebSocketServer } from "ws";
import { createTerminal } from "./terminal.js";

const PORT = 3000;
const wss = new WebSocketServer({ port: PORT });

let activeSession = null;

wss.on("connection", (socket) => {
  if (activeSession) {
    socket.close(1008, "Only one client allowed");
    return;
  }

  console.log("Client connected");

  const terminal = createTerminal({ cols: 80, rows: 24 });
  let cleanedUp = false;

  activeSession = { socket, terminal };

  const cleanup = () => {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (activeSession?.socket === socket) {
      activeSession = null;
    }

    terminal.kill();
  };

  terminal.onData((data) => {
    if (socket.readyState === socket.OPEN) {
      socket.send(String(data));
    }
  });

  terminal.onExit(() => {
    if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) {
      socket.close();
    }
  });

  socket.on("message", (message) => {
    const raw = message.toString();

    try {
      const payload = JSON.parse(raw);

      if (payload?.type === "resize") {
        terminal.resize(payload.cols, payload.rows);
        return;
      }
    } catch {
      // Non-JSON payloads are treated as terminal input.
    }

    terminal.write(raw);
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    cleanup();
  });

  socket.on("error", () => {
    cleanup();
  });
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
