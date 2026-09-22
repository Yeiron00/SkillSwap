// Configuración de entorno del frontend.
// En local (localhost/127.0.0.1) apunta al backend local. En producción, reemplaza
// la URL de abajo por la de tu backend desplegado (Render/Railway/etc.), p. ej.:
//   window.SKILLSWAP_API_BASE = "https://skillswap-backend.onrender.com/api";

(function () {
  const esLocal = ["localhost", "127.0.0.1"].includes(location.hostname);
  window.SKILLSWAP_API_BASE = esLocal
    ? "http://localhost:4000/api"
    : "https://REEMPLAZA-CON-TU-BACKEND.onrender.com/api";
})();
