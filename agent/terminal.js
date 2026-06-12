import pty from "node-pty";

export function createTerminal({ cols = 80, rows = 24 } = {}) {
  const terminal = pty.spawn("powershell.exe", [], {
    name: "xterm-color",
    cols,
    rows,
    cwd: process.cwd(),
    env: process.env
  });

  return {
    pty: terminal,
    write(data) {
      terminal.write(data);
    },
    resize(nextCols, nextRows) {
      terminal.resize(nextCols, nextRows);
    },
    onData(callback) {
      return terminal.onData(callback);
    },
    onExit(callback) {
      return terminal.onExit(callback);
    },
    kill() {
      terminal.kill();
    }
  };
}
