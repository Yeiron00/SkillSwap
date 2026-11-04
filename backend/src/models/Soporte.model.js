// Modelo: base de conocimiento del chatbot de soporte y búsqueda sobre ella.
// Es un bot basado en reglas (sin servicios externos ni costo): normaliza el texto del usuario,
// puntúa cada entrada por palabras clave y devuelve la mejor coincidencia.
// Para agregar una respuesta nueva basta con añadir una entrada a FAQS.

const FAQS = [
  {
    id: "que-es",
    pregunta: "¿Qué es SkillSwap?",
    palabras: ["que es", "skillswap", "para que sirve", "de que trata", "como funciona", "plataforma"],
    respuesta:
      "SkillSwap es una plataforma para intercambiar habilidades y conocimientos entre personas, sin dinero de por medio. " +
      "Publicas lo que sabes enseñar, buscas lo que quieres aprender y pactas un intercambio con otro usuario."
  },
  {
    id: "registro",
    pregunta: "¿Cómo me registro?",
    palabras: ["registro", "registrar", "registrarme", "crear cuenta", "nueva cuenta", "inscribir", "unirme", "sign up"],
    respuesta:
      "En la pantalla inicial elige la pestaña «Registrarse», completa nombre, apellido, ciudad, correo y una contraseña de al menos 6 caracteres, " +
      "y pulsa «Crear cuenta». Entrarás a la plataforma automáticamente."
  },
  {
    id: "login",
    pregunta: "No puedo iniciar sesión",
    palabras: ["iniciar sesion", "login", "entrar", "ingresar", "no puedo entrar", "acceder", "correo o contrasena incorrectos"],
    respuesta:
      "Verifica que el correo y la contraseña estén bien escritos (la contraseña distingue mayúsculas y minúsculas). " +
      "Si aún no tienes cuenta, primero debes registrarte. Si la página tarda en responder, espera unos segundos y vuelve a intentar: " +
      "el servidor gratuito se «duerme» tras un rato sin uso."
  },
  {
    id: "contrasena",
    pregunta: "Olvidé mi contraseña",
    palabras: ["olvide", "olvido", "recuperar", "restablecer", "cambiar contrasena", "contrasena perdida", "clave"],
    respuesta:
      "En esta versión todavía no existe la recuperación automática de contraseña. " +
      "Puedes crear una cuenta nueva con otro correo o contactar al equipo de desarrollo del proyecto para que te ayude."
  },
  {
    id: "publicar",
    pregunta: "¿Cómo publico una habilidad?",
    palabras: ["publicar", "publico", "ofrecer", "ofrezco", "subir habilidad", "agregar habilidad", "anadir habilidad", "ensenar", "mi habilidad"],
    respuesta:
      "Ve a la sección «Publicar», escribe el título, elige categoría y nivel, describe qué enseñas y pulsa «Publicar habilidad». " +
      "Aparecerá en el catálogo para los demás usuarios y en tu perfil."
  },
  {
    id: "buscar",
    pregunta: "¿Cómo busco una habilidad?",
    palabras: ["buscar", "busco", "encontrar", "explorar", "catalogo", "filtrar", "categoria", "aprender"],
    respuesta:
      "En «Explorar» puedes escribir en el buscador (por ejemplo «inglés» o «diseño») y filtrar por categoría con los botones de arriba. " +
      "Pulsa el nombre o el avatar de una persona para ver su perfil completo."
  },
  {
    id: "solicitar",
    pregunta: "¿Cómo solicito un intercambio?",
    palabras: ["solicitar", "pedir intercambio", "pido intercambio", "proponer", "intercambio", "intercambiar", "quiero aprender", "enviar solicitud", "envio solicitud", "mandar solicitud"],
    respuesta:
      "En «Explorar», pulsa «Solicitar intercambio» en la habilidad que quieres aprender, elige cuál de tus habilidades ofreces a cambio y envía el mensaje. " +
      "Necesitas tener al menos una habilidad publicada. La otra persona verá tu solicitud en su sección «Solicitudes»."
  },
  {
    id: "gestionar-solicitudes",
    pregunta: "¿Cómo acepto o rechazo una solicitud?",
    palabras: ["aceptar", "rechazar", "acepto", "rechazo", "solicitudes recibidas", "me llego una solicitud", "pendiente"],
    respuesta:
      "Entra a «Solicitudes» → pestaña «Recibidas». Cada solicitud pendiente tiene los botones «Aceptar» y «Rechazar». " +
      "Al aceptar se crea el intercambio y ambos pueden escribirse por mensajes."
  },
  {
    id: "completar",
    pregunta: "¿Cómo marco un intercambio como completado?",
    palabras: ["completar", "completado", "terminar", "terminado", "termine", "finalizar", "finalizado", "marco", "marcar", "marque", "ya hicimos", "marcar completado", "estado del intercambio"],
    respuesta:
      "Cuando ya hicieron el intercambio, entra a «Solicitudes» y pulsa «Marcar completado» en esa solicitud aceptada. " +
      "El estado pasa a «completada» y se habilita la calificación. Cuando ambos califican, el intercambio queda «finalizado»."
  },
  {
    id: "calificar",
    pregunta: "¿Cómo califico a otro usuario?",
    palabras: ["calificar", "calificacion", "valorar", "puntuar", "estrellas", "resena", "opinion", "comentario"],
    respuesta:
      "Después de marcar el intercambio como completado, aparece el botón «Calificar» en «Solicitudes». " +
      "Elige de 1 a 5 estrellas y, si quieres, deja un comentario. Solo puedes calificar una vez por intercambio y la nota se refleja en el perfil de la otra persona."
  },
  {
    id: "mensajes",
    pregunta: "¿Cómo envío mensajes?",
    palabras: ["mensaje", "mensajes", "chatear", "chat", "escribir", "escribo", "escribirle", "hablar", "hablarle", "contactar usuario", "conversacion"],
    respuesta:
      "Entra a «Mensajes» para ver tus conversaciones, o pulsa «Mensaje» en una solicitud aceptada o «Enviar mensaje» en el perfil de un usuario. " +
      "Escribe en la caja de abajo y pulsa «Enviar»."
  },
  {
    id: "perfil",
    pregunta: "¿Cómo edito mi perfil?",
    palabras: ["perfil", "editar perfil", "cambiar ciudad", "biografia", "descripcion", "mi cuenta", "datos personales", "foto"],
    respuesta:
      "Pulsa tu avatar (las iniciales, arriba a la derecha) para abrir tu perfil y luego «Editar». " +
      "Puedes cambiar tu ciudad y tu biografía."
  },
  {
    id: "salir",
    pregunta: "¿Cómo cierro sesión?",
    palabras: ["cerrar sesion", "cierro sesion", "cierro", "salir", "salgo", "logout", "desconectar", "sign out"],
    respuesta: "Pulsa «Salir» en la esquina superior derecha. Tu sesión se cierra y vuelves a la pantalla de inicio."
  },
  {
    id: "costo",
    pregunta: "¿Cuánto cuesta usar SkillSwap?",
    palabras: ["costo", "cuesta", "precio", "pagar", "pago", "gratis", "dinero", "cobran", "cobro"],
    respuesta:
      "SkillSwap es totalmente gratuito y no maneja pagos ni dinero: los intercambios son de conocimiento por conocimiento."
  },
  {
    id: "instalar",
    pregunta: "¿Cómo instalo la app en mi celular?",
    palabras: ["instalar", "instalo", "app", "aplicacion", "celular", "movil", "android", "iphone", "ios", "pantalla de inicio", "descargar"],
    respuesta:
      "SkillSwap es una app web instalable (PWA). En Android/Chrome pulsa el botón «Instalar app» que aparece abajo o el menú ⋮ → «Instalar aplicación». " +
      "En iPhone (Safari) pulsa el botón Compartir → «Añadir a pantalla de inicio». En computador, Chrome/Edge muestran un ícono de instalación en la barra de direcciones."
  },
  {
    id: "privacidad",
    pregunta: "¿Mis datos están seguros?",
    palabras: ["seguro", "seguridad", "privacidad", "datos", "proteccion", "contrasena segura", "cifrada", "confianza"],
    respuesta:
      "Tu contraseña se guarda cifrada (nunca en texto plano), la sesión usa tokens seguros y la comunicación viaja por HTTPS. " +
      "Los demás usuarios solo ven tu información pública de perfil."
  },
  {
    id: "error",
    pregunta: "La página no carga o da error",
    palabras: ["error", "no carga", "no funciona", "falla", "lento", "tarda", "se queda cargando", "problema", "bug"],
    respuesta:
      "Si tarda en cargar, espera unos segundos y recarga: el servidor gratuito se «duerme» tras un rato sin uso y la primera petición lo despierta. " +
      "Revisa tu conexión a internet. Si el problema continúa, cuéntalo al equipo de desarrollo del proyecto indicando qué estabas haciendo."
  }
];

const SALUDOS = {
  palabras: ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "saludos", "que tal"],
  respuesta: "¡Hola! Soy el asistente de SkillSwap. Pregúntame cómo registrarte, publicar habilidades, pedir intercambios, calificar o instalar la app."
};

const DESPEDIDAS = {
  palabras: ["gracias", "chao", "adios", "hasta luego", "listo", "perfecto", "vale", "ok gracias"],
  respuesta: "¡Con gusto! Si necesitas algo más, aquí estaré."
};

const SUGERENCIAS_INICIALES = [
  "¿Cómo publico una habilidad?",
  "¿Cómo solicito un intercambio?",
  "¿Cómo califico a otro usuario?",
  "¿Cómo instalo la app en mi celular?"
];

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "a", "en", "y", "o", "u", "que", "se",
  "me", "mi", "mis", "tu", "tus", "su", "sus", "es", "son", "por", "para", "con", "sin", "lo", "le", "les", "como",
  "cual", "cuando", "donde", "esta", "este", "esto", "hay", "puedo", "quiero", "necesito", "ayuda", "favor", "porfa"
]);

function normalizar(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(textoNormalizado) {
  return textoNormalizado.split(" ").filter(t => t && !STOPWORDS.has(t));
}

// Coincidencia de una palabra clave con las palabras del usuario:
// 2 = exacta, 1 = mismo prefijo de 5 letras (tolera conjugaciones: «publicando» ~ «publicar»), 0 = ninguna.
function coincidePalabra(clave, tokensUsuario) {
  if (tokensUsuario.includes(clave)) return 2;
  if (clave.length >= 5 && tokensUsuario.some(t => t.length >= 5 && t.slice(0, 5) === clave.slice(0, 5))) return 1;
  return 0;
}

// Puntaje: una frase clave vale más que una palabra suelta. Una frase puntúa si aparece tal cual en el texto
// o si todas sus palabras significativas aparecen (aunque haya otras en medio: «crear una cuenta» ~ «crear cuenta»).
function puntuar(textoNormalizado, tokensUsuario, palabras) {
  let puntaje = 0;
  for (const clave of palabras) {
    if (clave.includes(" ")) {
      if (textoNormalizado.includes(clave)) {
        puntaje += 3;
        continue;
      }
      const significativas = tokens(clave);
      if (significativas.length >= 2) {
        const coincidencias = significativas.map(w => coincidePalabra(w, tokensUsuario));
        if (coincidencias.every(c => c > 0)) puntaje += coincidencias.every(c => c === 2) ? 3 : 2;
      }
    } else {
      puntaje += coincidePalabra(clave, tokensUsuario);
    }
  }
  return puntaje;
}

const UMBRAL_MINIMO = 2;

const Soporte = {
  sugerenciasIniciales() {
    return SUGERENCIAS_INICIALES;
  },

  buscarRespuesta(mensajeUsuario) {
    const texto = normalizar(mensajeUsuario);
    const tokensUsuario = tokens(texto);

    const esSoloSaludo = tokensUsuario.length <= 3 && puntuar(texto, tokensUsuario, SALUDOS.palabras) > 0;
    if (esSoloSaludo) return { tipo: "saludo", respuesta: SALUDOS.respuesta, sugerencias: SUGERENCIAS_INICIALES };

    const ranking = FAQS
      .map(faq => ({ faq, puntaje: puntuar(texto, tokensUsuario, faq.palabras) }))
      .filter(r => r.puntaje > 0)
      .sort((a, b) => b.puntaje - a.puntaje);

    if (ranking.length && ranking[0].puntaje >= UMBRAL_MINIMO) {
      const mejor = ranking[0].faq;
      const relacionadas = ranking.slice(1, 4).map(r => r.faq.pregunta);
      const complemento = SUGERENCIAS_INICIALES.filter(s => s !== mejor.pregunta && !relacionadas.includes(s));
      return { tipo: "faq", id: mejor.id, respuesta: mejor.respuesta, sugerencias: [...relacionadas, ...complemento].slice(0, 3) };
    }

    if (puntuar(texto, tokensUsuario, DESPEDIDAS.palabras) > 0) {
      return { tipo: "despedida", respuesta: DESPEDIDAS.respuesta, sugerencias: [] };
    }

    return {
      tipo: "desconocido",
      respuesta:
        "No estoy seguro de haber entendido tu pregunta. Prueba con otras palabras o elige una de estas opciones. " +
        "Si necesitas ayuda de una persona, contacta al equipo de desarrollo del proyecto.",
      sugerencias: SUGERENCIAS_INICIALES
    };
  }
};

module.exports = Soporte;
