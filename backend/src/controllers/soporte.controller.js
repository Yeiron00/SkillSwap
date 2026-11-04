const Soporte = require("../models/Soporte.model");
const { respuestaBot } = require("../views/soporte.view");

// Chatbot de soporte: responde preguntas frecuentes sobre el uso de la plataforma.
function responder(req, res) {
  const resultado = Soporte.buscarRespuesta(req.body.mensaje);
  res.json(respuestaBot(resultado));
}

// Preguntas sugeridas para mostrar al abrir el chat.
function sugerencias(req, res) {
  res.json({ sugerencias: Soporte.sugerenciasIniciales() });
}

module.exports = { responder, sugerencias };
