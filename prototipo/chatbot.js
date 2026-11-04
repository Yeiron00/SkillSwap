// Widget del chatbot de soporte. Se monta solo, flotando en la esquina inferior derecha,
// y funciona tanto en la pantalla de inicio de sesión como dentro de la app.

(function () {
  const STORAGE_KEY = "skillswap_bot_historial";
  const SALUDO = "¡Hola! Soy el asistente de SkillSwap. ¿En qué te puedo ayudar?";
  const SUGERENCIAS_RESPALDO = [
    "¿Cómo publico una habilidad?",
    "¿Cómo solicito un intercambio?",
    "¿Cómo califico a otro usuario?",
    "¿Cómo instalo la app en mi celular?"
  ];

  let historial = cargarHistorial();
  let abierto = false;

  function cargarHistorial() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || []; } catch (e) { return []; }
  }
  function guardarHistorial() {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(historial.slice(-40))); } catch (e) { /* sin almacenamiento: no es crítico */ }
  }

  function crear(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  // ---------- Estructura ----------
  const fab = crear("button", "bot-fab");
  fab.type = "button";
  fab.setAttribute("aria-label", "Abrir asistente de ayuda");
  fab.innerHTML =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 20l1.4-4.9A8.5 8.5 0 1 1 21 11.5z"/></svg>';

  const panel = crear("section", "bot-panel hidden");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Asistente de ayuda de SkillSwap");

  const cabecera = crear("header", "bot-header");
  const titulo = crear("div", "bot-title");
  titulo.appendChild(crear("strong", "", "Asistente SkillSwap"));
  titulo.appendChild(crear("span", "", "Preguntas frecuentes y soporte"));
  const cerrar = crear("button", "bot-close", "×");
  cerrar.type = "button";
  cerrar.setAttribute("aria-label", "Cerrar asistente");
  cabecera.append(titulo, cerrar);

  const cuerpo = crear("div", "bot-body");
  cuerpo.setAttribute("aria-live", "polite");
  const chips = crear("div", "bot-chips");

  const formulario = crear("form", "bot-form");
  const entrada = crear("input", "bot-input");
  entrada.type = "text";
  entrada.placeholder = "Escribe tu pregunta...";
  entrada.maxLength = 500;
  entrada.autocomplete = "off";
  const enviar = crear("button", "bot-send", "Enviar");
  enviar.type = "submit";
  formulario.append(entrada, enviar);

  panel.append(cabecera, cuerpo, chips, formulario);
  document.body.append(fab, panel);

  // ---------- Pintado ----------
  function pintarMensaje(msg) {
    const burbuja = crear("div", "bot-msg " + (msg.autor === "usuario" ? "bot-msg-user" : "bot-msg-bot"), msg.texto);
    cuerpo.appendChild(burbuja);
    cuerpo.scrollTop = cuerpo.scrollHeight;
    return burbuja;
  }

  function pintarSugerencias(lista) {
    chips.replaceChildren();
    (lista || []).slice(0, 4).forEach(texto => {
      const chip = crear("button", "bot-chip", texto);
      chip.type = "button";
      chip.addEventListener("click", () => preguntar(texto));
      chips.appendChild(chip);
    });
  }

  function agregar(autor, texto) {
    const msg = { autor, texto };
    historial.push(msg);
    guardarHistorial();
    return pintarMensaje(msg);
  }

  // ---------- Conversación ----------
  async function preguntar(texto) {
    const pregunta = texto.trim();
    if (!pregunta) return;
    agregar("usuario", pregunta);
    entrada.value = "";
    pintarSugerencias([]);

    const escribiendo = pintarMensaje({ autor: "bot", texto: "Escribiendo…" });
    escribiendo.classList.add("bot-typing");
    enviar.disabled = true;
    try {
      const r = await api.soporteMensaje(pregunta);
      escribiendo.remove();
      agregar("bot", r.respuesta);
      pintarSugerencias(r.sugerencias);
    } catch (err) {
      escribiendo.remove();
      agregar("bot", "No pude conectarme con el servidor en este momento. Revisa tu conexión e inténtalo de nuevo en unos segundos.");
      pintarSugerencias(SUGERENCIAS_RESPALDO);
    } finally {
      enviar.disabled = false;
      entrada.focus();
    }
  }

  async function abrirPanel() {
    abierto = true;
    panel.classList.remove("hidden");
    fab.classList.add("bot-fab-hidden");
    if (cuerpo.childElementCount === 0) {
      if (historial.length === 0) historial.push({ autor: "bot", texto: SALUDO });
      historial.forEach(pintarMensaje);
      let sugerencias = SUGERENCIAS_RESPALDO;
      try { sugerencias = (await api.soporteSugerencias()).sugerencias; } catch (e) { /* usa el respaldo */ }
      pintarSugerencias(sugerencias);
    }
    entrada.focus();
  }

  function cerrarPanel() {
    abierto = false;
    panel.classList.add("hidden");
    fab.classList.remove("bot-fab-hidden");
    fab.focus();
  }

  fab.addEventListener("click", abrirPanel);
  cerrar.addEventListener("click", cerrarPanel);
  formulario.addEventListener("submit", e => { e.preventDefault(); preguntar(entrada.value); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && abierto) cerrarPanel(); });
})();
