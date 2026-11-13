// SkillSwap — aplicación de escritorio (Electron).
// Abre el mismo frontend de /prototipo en una ventana propia, sin navegador,
// y se conecta al backend desplegado en Render (o al local si se indica).

const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

const FRONTEND = path.join(__dirname, "..", "prototipo", "index.html");
const API_HOST = "skillswap-qdfo.onrender.com";

function crearVentana() {
  const ventana = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 380,
    minHeight: 600,
    title: "SkillSwap",
    icon: path.join(__dirname, "..", "prototipo", "icons", "icon-512.png"),
    backgroundColor: "#ffffff",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  ventana.loadFile(FRONTEND);
  ventana.once("ready-to-show", () => ventana.show());

  // Los enlaces externos se abren en el navegador del sistema, no dentro de la app.
  ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  return ventana;
}

// El backend en Render solo acepta peticiones desde la página web (CORS).
// La app de escritorio carga el frontend desde archivos locales, así que para las
// respuestas de nuestra propia API se autoriza ese origen. Solo afecta a esta ventana.
function permitirApiPropia() {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`https://${API_HOST}/*`] },
    (detalles, responder) => {
      const cabeceras = { ...detalles.responseHeaders };
      for (const clave of Object.keys(cabeceras)) {
        if (clave.toLowerCase() === "access-control-allow-origin") delete cabeceras[clave];
      }
      cabeceras["Access-Control-Allow-Origin"] = ["*"];
      responder({ responseHeaders: cabeceras });
    }
  );
}

app.whenReady().then(() => {
  permitirApiPropia();
  const ventana = crearVentana();

  // Modo prueba: `npm run probar` inicia sesión con un usuario de ejemplo y cierra la app.
  if (process.argv.includes("--probar")) {
    ventana.webContents.once("did-finish-load", async () => {
      try {
        const r = await ventana.webContents.executeJavaScript(`
          api.login({ email: "laura@skillswap.co", contrasena: "123456" })
            .then(d => "OK: sesión iniciada como " + d.usuario.nombre)
            .catch(e => "ERROR: " + e.message)
        `);
        console.log(r);
        if (process.env.SKILLSWAP_CAPTURA) {
          const fs = require("fs");
          await new Promise(res => setTimeout(res, 1500));
          fs.writeFileSync(process.env.SKILLSWAP_CAPTURA, (await ventana.webContents.capturePage()).toPNG());
        }
        app.exit(r.startsWith("OK") ? 0 : 1);
      } catch (e) {
        console.log("ERROR:", e.message);
        app.exit(1);
      }
    });
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
