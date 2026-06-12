import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const terminalTheme = {
  background: "#08080E",
  foreground: "#E8E8F0",
  cursor: "#00D4FF",
  cursorAccent: "#08080E",
  selectionBackground: "#00D4FF33",
  black: "#1A1A2E",
  red: "#FF4466",
  green: "#00FF88",
  yellow: "#FFD060",
  blue: "#00D4FF",
  magenta: "#BB88FF",
  cyan: "#00D4FF",
  white: "#E8E8F0",
  brightBlack: "#4A4A6A",
  brightRed: "#FF6688",
  brightGreen: "#33FFAA",
  brightYellow: "#FFE080",
  brightBlue: "#33DDFF",
  brightMagenta: "#CC99FF",
  brightCyan: "#33DDFF",
  brightWhite: "#FFFFFF"
};

export default function TerminalView({ ws }) {
  const terminalRef = useRef(null);

  useEffect(() => {
    const container = terminalRef.current;

    if (!container || !ws) {
      return undefined;
    }

    const fitAddon = new FitAddon();
    const terminal = new Terminal({
      theme: terminalTheme,
      fontFamily: "'JetBrains Mono','Cascadia Code',monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 1000,
      allowTransparency: true
    });

    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    const syncSize = () => {
      fitAddon.fit();

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "resize",
            cols: terminal.cols,
            rows: terminal.rows
          })
        );
      }
    };

    const dataDisposable = terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    const previousMessageHandler = ws.onmessage;

    ws.onmessage = (event) => {
      terminal.write(String(event.data));
    };

    window.addEventListener("resize", syncSize);
    syncSize();

    return () => {
      window.removeEventListener("resize", syncSize);
      dataDisposable.dispose();
      ws.onmessage = previousMessageHandler;
      terminal.dispose();
    };
  }, [ws]);

  return <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />;
}
