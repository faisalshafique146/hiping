import { useEffect, useState } from "react";
import TerminalView from "./components/TerminalView.jsx";

const WS_URL = "ws://localhost:3000";

function CenterScreen({ children }) {
  return <div className="app-shell app-shell-center">{children}</div>;
}

export default function App() {
  const [connection, setConnection] = useState({
    status: "connecting",
    ws: null
  });

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    let closedByCleanup = false;

    ws.onopen = () => {
      setConnection({
        status: "connected",
        ws
      });
    };

    const handleFailure = () => {
      if (closedByCleanup) {
        return;
      }

      setConnection((current) => ({
        status: "error",
        ws: current.ws === ws ? null : current.ws
      }));
    };

    ws.onerror = handleFailure;
    ws.onclose = handleFailure;

    return () => {
      closedByCleanup = true;

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, []);

  if (connection.status === "error") {
    return (
      <CenterScreen>
        <div className="status-stack">
          <p className="status-copy">Connection lost. Is the agent running?</p>
          <button className="reload-button" type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </CenterScreen>
    );
  }

  if (connection.status === "connecting" || !connection.ws) {
    return (
      <CenterScreen>
        <p className="status-copy">Connecting...</p>
      </CenterScreen>
    );
  }

  return (
    <main className="app-shell">
      <TerminalView ws={connection.ws} />
    </main>
  );
}
