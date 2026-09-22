// Cliente de la API de SkillSwap (backend Node/Express + PostgreSQL).
// Sustituye el localStorage-como-backend por llamadas fetch reales.

const API_BASE = window.SKILLSWAP_API_BASE || "http://localhost:4000/api";
const TOKEN_KEY = "skillswap_token";

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error("No se pudo conectar con el servidor. ¿Está corriendo el backend en " + API_BASE + "?");
  }

  let data = null;
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch (e) { data = null; } }

  if (!res.ok) {
    const msg = (data && data.error) || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  // Auth (RF-01, RF-02)
  registro: (payload) => apiFetch("/auth/registro", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }).catch(() => {}),

  // Perfil (RF-03, RF-06)
  me: () => apiFetch("/usuarios/me"),
  actualizarMiPerfil: (payload) => apiFetch("/usuarios/me", { method: "PUT", body: JSON.stringify(payload) }),
  perfilPublico: (id) => apiFetch(`/usuarios/${id}`),

  // Habilidades (RF-04, RF-05)
  buscarHabilidades: ({ q, categoria, usuarioId } = {}) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (categoria && categoria !== "Todas") p.set("categoria", categoria);
    if (usuarioId) p.set("usuarioId", usuarioId);
    const qs = p.toString();
    return apiFetch(`/habilidades${qs ? "?" + qs : ""}`);
  },
  publicarHabilidad: (payload) => apiFetch("/habilidades", { method: "POST", body: JSON.stringify(payload) }),

  // Emparejamiento (RF-07)
  emparejamiento: () => apiFetch("/emparejamiento"),

  // Solicitudes (RF-08, RF-09)
  enviarSolicitud: (payload) => apiFetch("/solicitudes", { method: "POST", body: JSON.stringify(payload) }),
  listarSolicitudes: (tipo) => apiFetch(`/solicitudes?tipo=${tipo}`),
  aceptarSolicitud: (id) => apiFetch(`/solicitudes/${id}/aceptar`, { method: "PUT" }),
  rechazarSolicitud: (id) => apiFetch(`/solicitudes/${id}/rechazar`, { method: "PUT" }),

  // Intercambios (ciclo de vida)
  listarIntercambios: () => apiFetch("/intercambios"),
  completarIntercambio: (id) => apiFetch(`/intercambios/${id}/completar`, { method: "PUT" }),

  // Mensajería (RF-11)
  listarConversaciones: () => apiFetch("/mensajes/conversaciones"),
  historialConversacion: (usuarioId) => apiFetch(`/mensajes/${usuarioId}`),
  enviarMensaje: (destinatarioId, contenido) =>
    apiFetch("/mensajes", { method: "POST", body: JSON.stringify({ destinatarioId, contenido }) }),

  // Calificaciones (RF-12)
  calificar: (payload) => apiFetch("/calificaciones", { method: "POST", body: JSON.stringify(payload) })
};
