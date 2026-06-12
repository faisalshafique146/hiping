import { spawn } from "node:child_process";

const processes = [
  { name: "agent", args: ["run", "dev:agent"] },
  { name: "server", args: ["run", "dev:server"] },
  { name: "client", args: ["run", "dev:client"] },
];

const children = [];
let shuttingDown = false;

function prefixStream(stream, prefix) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.length > 0) {
        console.log(`[${prefix}] ${line}`);
      }
    }
  });

  stream.on("end", () => {
    if (buffer.length > 0) {
      console.log(`[${prefix}] ${buffer}`);
    }
  });
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }

  setTimeout(() => process.exit(exitCode), 500);
}

for (const proc of processes) {
  const child = spawn("npm", proc.args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  children.push(child);
  prefixStream(child.stdout, proc.name);
  prefixStream(child.stderr, proc.name);

  child.on("exit", (code) => {
    if (!shuttingDown && code && code !== 0) {
      console.error(`[${proc.name}] exited with code ${code}`);
      shutdown(code);
    }
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
