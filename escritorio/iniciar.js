// Lanza la app de Electron. Quita ELECTRON_RUN_AS_NODE, que algunos terminales
// (por ejemplo el de ciertas extensiones de VS Code) dejan activado y hace que
// Electron se comporte como Node sin abrir la ventana.
const { spawn } = require("child_process");
const electron = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const hijo = spawn(electron, [__dirname, ...process.argv.slice(2)], { stdio: "inherit", env });
hijo.on("close", codigo => process.exit(codigo ?? 0));
