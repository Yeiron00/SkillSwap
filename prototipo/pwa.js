// PWA: registra el service worker y muestra el botón "Instalar app" cuando el navegador lo permite.

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => { /* la app funciona igual sin SW */ });
  });
}

let eventoInstalacion = null;
const botonInstalar = document.getElementById("install-btn");

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  eventoInstalacion = e;
  botonInstalar.classList.remove("hidden");
});

botonInstalar.addEventListener("click", async () => {
  if (!eventoInstalacion) return;
  eventoInstalacion.prompt();
  await eventoInstalacion.userChoice;
  eventoInstalacion = null;
  botonInstalar.classList.add("hidden");
});

window.addEventListener("appinstalled", () => {
  eventoInstalacion = null;
  botonInstalar.classList.add("hidden");
});
