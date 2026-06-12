import { createTerminal } from "./terminal.js";

const terminal = createTerminal();

terminal.onData((data) => {
  process.stdout.write(data);
});

terminal.onExit(() => {
  process.exit(0);
});

setTimeout(() => {
  terminal.write("dir\r");
}, 500);

setTimeout(() => {
  terminal.kill();
}, 3000);
