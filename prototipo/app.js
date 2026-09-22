// SkillSwap — frontend conectado a la API real (Node/Express + PostgreSQL).
// Toda la persistencia vive en el backend; aquí solo se guarda el JWT (localStorage) y el estado de navegación.

const CATEGORIES = ["Todas", "Idiomas", "Informática", "Arte", "Matemáticas"];

const state = {
  view: "explore",
  category: "Todas",
  search: "",
  reqTab: "received",
  viewingUserId: null,
  activeConvUserId: null,
  currentUser: null
};

// ---------- Helpers ----------
function fullName(u) { return `${u.nombre} ${u.apellido || ""}`.trim(); }
function initials(name) {
  return name.split(" ").filter(Boolean).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" }) + " · " +
         d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.add("hidden"), 2600);
}
function isMine(id) { return state.currentUser && id === state.currentUser.id; }

// ---------- Auth ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("login-form").classList.toggle("hidden", tab !== "login");
    document.getElementById("register-form").classList.toggle("hidden", tab !== "register");
  });
});

document.getElementById("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const contrasena = document.getElementById("login-password").value;
  try {
    const data = await api.login({ email, contrasena });
    setToken(data.token);
    state.currentUser = data.usuario;
    await enterApp();
  } catch (err) {
    toast(err.message);
  }
});

document.getElementById("register-form").addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = document.getElementById("reg-nombre").value.trim();
  const apellido = document.getElementById("reg-apellido").value.trim();
  const ciudad = document.getElementById("reg-city").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const contrasena = document.getElementById("reg-password").value;
  try {
    const data = await api.registro({ nombre, apellido, ciudad, email, contrasena });
    setToken(data.token);
    state.currentUser = data.usuario;
    toast("Cuenta creada. ¡Bienvenido/a a SkillSwap!");
    await enterApp();
  } catch (err) {
    toast(err.message);
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await api.logout();
  clearToken();
  state.currentUser = null;
  document.getElementById("app-screen").classList.add("hidden");
  document.getElementById("auth-screen").classList.remove("hidden");
});

document.getElementById("user-avatar").addEventListener("click", () => {
  state.view = "profile"; state.viewingUserId = null;
  document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
  render();
});

async function enterApp() {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");
  document.getElementById("user-avatar").textContent = initials(fullName(state.currentUser));
  state.view = "explore"; state.viewingUserId = null; state.activeConvUserId = null;
  document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.view === "explore"));
  await render();
}

// ---------- Nav ----------
document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.view = btn.dataset.view;
    state.viewingUserId = null;
    render();
  });
});

// ---------- Render router ----------
async function render() {
  updateBadges();
  const main = document.getElementById("main-content");
  main.innerHTML = `<div class="empty-state">Cargando...</div>`;
  try {
    if (state.view === "explore") await renderExplore(main);
    else if (state.view === "requests") await renderRequests(main);
    else if (state.view === "messages") await renderMessages(main);
    else if (state.view === "publish") renderPublish(main);
    else if (state.view === "profile") await renderProfile(main, state.viewingUserId || state.currentUser.id);
  } catch (err) {
    main.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

async function updateBadges() {
  try {
    const recibidas = await api.listarSolicitudes("recibidas");
    const pendientes = recibidas.filter(r => r.estado === "pendiente").length;
    const reqBadge = document.getElementById("req-badge");
    reqBadge.textContent = pendientes;
    reqBadge.classList.toggle("hidden", pendientes === 0);
  } catch (e) { /* silencioso: el badge no es crítico */ }
  document.getElementById("msg-badge").classList.add("hidden");
}

// ---------- Explore ----------
async function renderExplore(main) {
  main.innerHTML = `
    <div class="view-header">
      <h2>Explorar habilidades</h2>
      <p>Encuentra a alguien que enseñe lo que quieres aprender.</p>
    </div>
    <div class="search-bar">
      <span>🔍</span>
      <input id="search-input" type="text" placeholder="Buscar habilidades, ej: 'diseño', 'inglés'" value="${state.search}">
    </div>
    <div class="category-chips">
      ${CATEGORIES.map(c => `<button class="chip ${state.category === c ? "active" : ""}" data-cat="${c}">${c}</button>`).join("")}
    </div>
    <div id="skill-grid" class="card-grid"><div class="empty-state">Cargando...</div></div>
  `;

  let debounceTimer;
  document.getElementById("search-input").addEventListener("input", e => {
    state.search = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderSkillGrid, 300);
  });
  main.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      state.category = chip.dataset.cat;
      main.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === chip));
      renderSkillGrid();
    });
  });

  await renderSkillGrid();

  async function renderSkillGrid() {
    const grid = document.getElementById("skill-grid");
    try {
      const results = (await api.buscarHabilidades({ q: state.search, categoria: state.category }))
        .filter(s => s.usuarioId !== state.currentUser.id);

      if (results.length === 0) {
        grid.innerHTML = `<div class="empty-state">No se encontraron habilidades con ese filtro.</div>`;
        return;
      }
      grid.innerHTML = results.map(s => {
        const ownerName = `${s.usuario.nombre} ${s.usuario.apellido}`;
        return `
          <div class="skill-card">
            <div class="card-top">
              <div class="avatar-sm" data-user="${s.usuarioId}">${initials(ownerName)}</div>
              <div>
                <div class="card-user-name" data-user="${s.usuarioId}">${ownerName}</div>
                <div class="card-user-city">${s.usuario.ciudad || ""}</div>
              </div>
            </div>
            <span class="tag">${s.categoria}</span>
            <div class="skill-title">${s.nombre}</div>
            <div class="skill-desc">${s.descripcion}</div>
            <div class="card-actions">
              <button class="btn-primary" style="margin-top:0" data-request="${s.id}">Solicitar intercambio</button>
            </div>
          </div>
        `;
      }).join("");

      grid.querySelectorAll("[data-user]").forEach(el => {
        el.addEventListener("click", () => {
          state.view = "profile"; state.viewingUserId = el.dataset.user;
          document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
          render();
        });
      });
      grid.querySelectorAll("[data-request]").forEach(el => {
        const skill = results.find(r => r.id === el.dataset.request);
        el.addEventListener("click", () => openRequestModal(skill));
      });
    } catch (err) {
      grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
    }
  }
}

async function openRequestModal(skill) {
  let misHabilidades = [];
  try {
    misHabilidades = await api.buscarHabilidades({ usuarioId: state.currentUser.id });
  } catch (err) {
    toast(err.message);
  }
  const owner = `${skill.usuario.nombre} ${skill.usuario.apellido}`;
  const opciones = misHabilidades.length
    ? misHabilidades.map(h => `<option>${h.nombre}</option>`)
    : [`<option value="">No has publicado habilidades todavía</option>`];

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>Solicitar intercambio con ${owner}</h3>
      <div class="sub">Quieres aprender: <strong>${skill.nombre}</strong></div>
      <label style="font-size:13px;color:var(--gray)">¿Qué le ofreces a cambio?</label>
      <select id="offer-select">${opciones.join("")}</select>
      <label style="font-size:13px;color:var(--gray)">Mensaje</label>
      <textarea id="offer-msg" placeholder="Escribe un mensaje breve...">Hola ${skill.usuario.nombre}, me interesa aprender ${skill.nombre}. ¿Hacemos el intercambio?</textarea>
      <div class="modal-actions">
        <button class="btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn-primary" style="margin-top:0" id="modal-send">Enviar solicitud</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#modal-cancel").onclick = () => overlay.remove();
  overlay.querySelector("#modal-send").onclick = async () => {
    const habilidadOfrecida = overlay.querySelector("#offer-select").value;
    const mensaje = overlay.querySelector("#offer-msg").value.trim();
    if (!habilidadOfrecida) { toast("Publica al menos una habilidad antes de solicitar un intercambio."); return; }
    try {
      await api.enviarSolicitud({ habilidadDeseadaId: skill.id, habilidadOfrecida, mensaje });
      overlay.remove();
      toast("Solicitud enviada a " + owner);
    } catch (err) {
      toast(err.message);
    }
  };
}

// ---------- Requests ----------
async function renderRequests(main) {
  main.innerHTML = `
    <div class="view-header">
      <h2>Solicitudes de intercambio</h2>
      <p>Gestiona las solicitudes que envías y recibes.</p>
    </div>
    <div class="req-tabs">
      <button class="chip ${state.reqTab === "received" ? "active" : ""}" data-tab="received">Recibidas</button>
      <button class="chip ${state.reqTab === "sent" ? "active" : ""}" data-tab="sent">Enviadas</button>
    </div>
    <div id="req-list" class="req-list"><div class="empty-state">Cargando...</div></div>
  `;
  main.querySelectorAll("[data-tab]").forEach(b => {
    b.addEventListener("click", () => { state.reqTab = b.dataset.tab; renderRequests(main); });
  });

  const list = document.getElementById("req-list");
  const tipo = state.reqTab === "received" ? "recibidas" : "enviadas";

  let items, intercambios;
  try {
    [items, intercambios] = await Promise.all([api.listarSolicitudes(tipo), api.listarIntercambios()]);
  } catch (err) {
    list.innerHTML = `<div class="empty-state">${err.message}</div>`;
    return;
  }

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state">No tienes solicitudes ${tipo}.</div>`;
    return;
  }

  const intercambioPorSolicitud = {};
  intercambios.forEach(i => { intercambioPorSolicitud[i.solicitudId] = i; });

  list.innerHTML = items.map(r => {
    const soyRecibidas = state.reqTab === "received";
    const otherId = soyRecibidas ? r.usuarioOrigenId : r.usuarioDestinoId;
    const otherObj = soyRecibidas ? r.origen : r.destino;
    const otherName = `${otherObj.nombre} ${otherObj.apellido}`;
    const ofrece = r.habilidadOfrecida;
    const quiere = r.habilidadDeseadaNombre;
    const statusLabel = { pendiente: "Pendiente", aceptada: "Aceptada", rechazada: "Rechazada", cancelada: "Cancelada" }[r.estado];
    const statusClass = { pendiente: "status-pending", aceptada: "status-accepted", rechazada: "status-rejected", cancelada: "status-rejected" }[r.estado];
    const intercambio = intercambioPorSolicitud[r.id];

    let acciones = "";
    if (soyRecibidas && r.estado === "pendiente") {
      acciones = `
        <button class="btn-primary" style="margin-top:0" data-accept="${r.id}">Aceptar</button>
        <button class="btn-danger" data-reject="${r.id}">Rechazar</button>
      `;
    } else if (r.estado === "aceptada" && intercambio) {
      if (intercambio.estado === "en_curso") {
        acciones = `
          <button class="btn-secondary" data-chat="${otherId}">Mensaje</button>
          <button class="btn-secondary" data-complete="${intercambio.id}">Marcar completado</button>
        `;
      } else if (intercambio.estado === "completada") {
        acciones = intercambio.yaCalifique
          ? `<button class="btn-secondary" data-chat="${otherId}">Mensaje</button><span class="status-pill status-pending">Esperando calificación del otro usuario</span>`
          : `
          <button class="btn-secondary" data-chat="${otherId}">Mensaje</button>
          <button class="btn-secondary" data-rate="${otherId}" data-exchange="${intercambio.id}">Calificar</button>
        `;
      } else if (intercambio.estado === "finalizada") {
        acciones = `<button class="btn-secondary" data-chat="${otherId}">Mensaje</button><span class="status-pill status-accepted">Finalizado ★</span>`;
      }
    }

    return `
      <div class="req-card">
        <div class="avatar-sm">${initials(otherName)}</div>
        <div class="req-info">
          <div class="name-row">${otherName} <span class="status-pill ${statusClass}">${statusLabel}</span></div>
          <div class="detail">Ofrece: <strong>${ofrece}</strong> · Quiere: <strong>${quiere}</strong></div>
          <div class="detail" style="color:var(--gray-light)">"${r.mensaje}"</div>
        </div>
        <div class="req-actions">${acciones}</div>
      </div>
    `;
  }).join("");

  list.querySelectorAll("[data-accept]").forEach(b => b.addEventListener("click", async () => {
    try { await api.aceptarSolicitud(b.dataset.accept); toast("Solicitud aceptada. ¡Ya pueden chatear!"); renderRequests(main); }
    catch (err) { toast(err.message); }
  }));
  list.querySelectorAll("[data-reject]").forEach(b => b.addEventListener("click", async () => {
    try { await api.rechazarSolicitud(b.dataset.reject); toast("Solicitud rechazada."); renderRequests(main); }
    catch (err) { toast(err.message); }
  }));
  list.querySelectorAll("[data-complete]").forEach(b => b.addEventListener("click", async () => {
    try { await api.completarIntercambio(b.dataset.complete); toast("Intercambio marcado como completado. ¡Ya pueden calificarse!"); renderRequests(main); }
    catch (err) { toast(err.message); }
  }));
  list.querySelectorAll("[data-chat]").forEach(b => b.addEventListener("click", () => {
    state.view = "messages"; state.activeConvUserId = b.dataset.chat;
    document.querySelectorAll(".nav-link").forEach(x => x.classList.toggle("active", x.dataset.view === "messages"));
    render();
  }));
  list.querySelectorAll("[data-rate]").forEach(b => b.addEventListener("click", () =>
    openRatingModal(b.dataset.rate, b.dataset.exchange, main)
  ));
}

function openRatingModal(otherUserId, intercambioId, refreshMain) {
  let score = 5;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>Calificar intercambio</h3>
      <div class="sub">¿Cómo fue tu experiencia?</div>
      <div class="star-picker" id="stars">
        ${[1,2,3,4,5].map(n => `<span data-n="${n}" class="${n <= score ? "filled" : ""}">★</span>`).join("")}
      </div>
      <textarea id="rate-comment" placeholder="Deja un comentario (opcional)"></textarea>
      <div class="modal-actions">
        <button class="btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn-primary" style="margin-top:0" id="modal-save">Enviar calificación</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const starEls = overlay.querySelectorAll("#stars span");
  starEls.forEach(s => s.addEventListener("click", () => {
    score = parseInt(s.dataset.n);
    starEls.forEach(x => x.classList.toggle("filled", parseInt(x.dataset.n) <= score));
  }));
  overlay.querySelector("#modal-cancel").onclick = () => overlay.remove();
  overlay.querySelector("#modal-save").onclick = async () => {
    const comentario = overlay.querySelector("#rate-comment").value.trim();
    try {
      await api.calificar({ intercambioId, puntuacion: score, comentario });
      overlay.remove();
      toast("¡Gracias por tu calificación!");
      if (refreshMain) renderRequests(refreshMain);
    } catch (err) {
      toast(err.message);
    }
  };
}

// ---------- Messages ----------
async function renderMessages(main) {
  main.innerHTML = `
    <div class="view-header">
      <h2>Mensajes</h2>
      <p>Conversa con las personas con quienes tienes intercambios.</p>
    </div>
    <div class="messages-layout">
      <div class="conv-list" id="conv-list"><div class="empty-state">Cargando...</div></div>
      <div class="chat-panel" id="chat-panel"></div>
    </div>
  `;

  let conversaciones;
  try {
    conversaciones = await api.listarConversaciones();
  } catch (err) {
    document.getElementById("conv-list").innerHTML = `<div class="empty-state">${err.message}</div>`;
    return;
  }

  if (!state.activeConvUserId && conversaciones.length) state.activeConvUserId = conversaciones[0].usuarioId;

  const convList = document.getElementById("conv-list");
  convList.innerHTML = conversaciones.length === 0
    ? `<div class="empty-state">Aún no tienes conversaciones. Acepta una solicitud para empezar a chatear.</div>`
    : conversaciones.map(c => {
        const name = `${c.nombre} ${c.apellido}`;
        return `
          <div class="conv-item ${c.usuarioId === state.activeConvUserId ? "active" : ""}" data-conv="${c.usuarioId}">
            <div class="avatar-sm">${initials(name)}</div>
            <div>
              <div class="conv-name">${name}</div>
              <div class="conv-preview">${c.ultimoMensaje}</div>
            </div>
          </div>
        `;
      }).join("");

  convList.querySelectorAll("[data-conv]").forEach(el => {
    el.addEventListener("click", () => { state.activeConvUserId = el.dataset.conv; renderMessages(main); });
  });

  await renderChatPanel();

  async function renderChatPanel() {
    const panel = document.getElementById("chat-panel");
    if (!state.activeConvUserId) {
      panel.innerHTML = `<div class="chat-empty">Selecciona una conversación</div>`;
      return;
    }
    let otherInfo, msgs;
    try {
      [otherInfo, msgs] = await Promise.all([
        api.perfilPublico(state.activeConvUserId),
        api.historialConversacion(state.activeConvUserId)
      ]);
    } catch (err) {
      panel.innerHTML = `<div class="chat-empty">${err.message}</div>`;
      return;
    }
    const otherName = fullName(otherInfo);
    panel.innerHTML = `
      <div class="chat-header">
        <div class="avatar-sm">${initials(otherName)}</div>
        <div>
          <div class="name">${otherName}</div>
          <div class="sub">${otherInfo.ciudad || ""}</div>
        </div>
      </div>
      <div class="chat-body" id="chat-body">
        ${msgs.length === 0 ? `<div class="chat-empty">Aún no hay mensajes. ¡Saluda!</div>` :
          msgs.map(m => `<div class="msg-bubble ${m.remitenteId === state.currentUser.id ? "msg-me" : "msg-them"}">${m.contenido}</div>`).join("")}
      </div>
      <div class="chat-input-row">
        <input id="chat-input" type="text" placeholder="Escribe un mensaje...">
        <button id="chat-send">Enviar</button>
      </div>
    `;
    const body = document.getElementById("chat-body");
    body.scrollTop = body.scrollHeight;

    async function send() {
      const input = document.getElementById("chat-input");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      try {
        await api.enviarMensaje(state.activeConvUserId, text);
        await renderMessages(main);
      } catch (err) {
        toast(err.message);
      }
    }
    document.getElementById("chat-send").addEventListener("click", send);
    document.getElementById("chat-input").addEventListener("keydown", e => { if (e.key === "Enter") send(); });
  }
}

// ---------- Publish ----------
function renderPublish(main) {
  main.innerHTML = `
    <div class="view-header">
      <h2>Publicar una habilidad</h2>
      <p>Comparte algo que sabes hacer y que otros quieran aprender.</p>
    </div>
    <div class="form-card">
      <form id="publish-form">
        <label>Título de la habilidad</label>
        <input id="p-title" type="text" placeholder="Ej: Guitarra para principiantes" required>
        <label>Categoría</label>
        <select id="p-category">
          ${CATEGORIES.filter(c => c !== "Todas").map(c => `<option>${c}</option>`).join("")}
        </select>
        <label>Nivel</label>
        <select id="p-level">
          <option>Principiante</option>
          <option>Intermedio</option>
          <option>Avanzado</option>
        </select>
        <label>Descripción</label>
        <textarea id="p-desc" placeholder="Cuenta brevemente qué enseñas y a quién va dirigido" required></textarea>
        <button type="submit" class="btn-primary">Publicar habilidad</button>
      </form>
    </div>
  `;
  document.getElementById("publish-form").addEventListener("submit", async e => {
    e.preventDefault();
    const nombre = document.getElementById("p-title").value.trim();
    const categoria = document.getElementById("p-category").value;
    const nivel = document.getElementById("p-level").value;
    const descripcion = document.getElementById("p-desc").value.trim();
    try {
      await api.publicarHabilidad({ nombre, categoria, nivel, descripcion });
      toast("Habilidad publicada correctamente.");
      state.view = "profile"; state.viewingUserId = null;
      document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
      render();
    } catch (err) {
      toast(err.message);
    }
  });
}

// ---------- Profile ----------
async function renderProfile(main, userId) {
  let user;
  try {
    user = await api.perfilPublico(userId);
  } catch (err) {
    main.innerHTML = `<div class="empty-state">${err.message}</div>`;
    return;
  }
  const mine = isMine(userId);
  const name = fullName(user);

  main.innerHTML = `
    ${!mine ? `<button class="btn-text" id="back-btn">← Volver</button>` : ""}
    <div class="profile-card">
      <div class="avatar-lg">${initials(name)}</div>
      <div class="profile-info">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">
          <div>
            <h3>${name}</h3>
            <div class="profile-city">${user.ciudad || ""}</div>
          </div>
          ${mine ? `<button class="btn-secondary" id="edit-btn">Editar</button>` :
            `<button class="btn-primary" style="margin-top:0" id="msg-btn">Enviar mensaje</button>`}
        </div>
        <p class="profile-bio">${user.descripcion || ""}</p>
        <div class="skill-pills">
          ${user.habilidades.length ? user.habilidades.map(s => `<span class="skill-pill">${s.nombre}</span>`).join("") : `<span style="color:var(--gray-light);font-size:13px">Sin habilidades publicadas aún</span>`}
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-box"><div class="num">${user.intercambiosCompletados}</div><div class="label">Intercambios</div></div>
      <div class="stat-box"><div class="num">${user.calificacionPromedio}</div><div class="label">Calificación</div></div>
      <div class="stat-box"><div class="num">${user.habilidades.length}</div><div class="label">Habilidades</div></div>
    </div>

    <div class="section-title">Calificaciones recibidas</div>
    <div class="rating-list">
      ${user.calificaciones.length === 0 ? `<div class="empty-state">Aún no tiene calificaciones.</div>` :
        user.calificaciones.map(r => `
          <div class="rating-item">
            <div class="stars">${"★".repeat(r.puntuacion)}${"☆".repeat(5 - r.puntuacion)}</div>
            ${r.comentario ? `<div class="comment">"${r.comentario}"</div>` : ""}
            <div class="meta">${r.calificadorNombre} · ${fmtTime(r.fecha)}</div>
          </div>
        `).join("")}
    </div>
  `;

  const back = document.getElementById("back-btn");
  if (back) back.addEventListener("click", () => {
    state.view = "explore"; state.viewingUserId = null;
    document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.view === "explore"));
    render();
  });

  const msgBtn = document.getElementById("msg-btn");
  if (msgBtn) msgBtn.addEventListener("click", () => {
    state.view = "messages"; state.activeConvUserId = userId;
    document.querySelectorAll(".nav-link").forEach(b => b.classList.toggle("active", b.dataset.view === "messages"));
    render();
  });

  const editBtn = document.getElementById("edit-btn");
  if (editBtn) editBtn.addEventListener("click", () => openEditProfileModal(user));
}

function openEditProfileModal(user) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <h3>Editar perfil</h3>
      <label style="font-size:13px;color:var(--gray)">Ciudad</label>
      <input id="edit-city" type="text" value="${user.ciudad || ""}">
      <label style="font-size:13px;color:var(--gray)">Biografía</label>
      <textarea id="edit-bio">${user.descripcion || ""}</textarea>
      <div class="modal-actions">
        <button class="btn-secondary" id="modal-cancel">Cancelar</button>
        <button class="btn-primary" style="margin-top:0" id="modal-save">Guardar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector("#modal-cancel").onclick = () => overlay.remove();
  overlay.querySelector("#modal-save").onclick = async () => {
    const ciudad = overlay.querySelector("#edit-city").value.trim();
    const descripcion = overlay.querySelector("#edit-bio").value.trim();
    try {
      await api.actualizarMiPerfil({ ciudad, descripcion });
      overlay.remove();
      toast("Perfil actualizado.");
      render();
    } catch (err) {
      toast(err.message);
    }
  };
}

// ---------- Boot ----------
(async function boot() {
  const token = getToken();
  if (!token) return;
  try {
    state.currentUser = await api.me();
    await enterApp();
  } catch (err) {
    clearToken();
  }
})();
