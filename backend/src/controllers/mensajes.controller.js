const Usuario = require("../models/Usuario.model");
const Mensaje = require("../models/Mensaje.model");
const { mensaje, conversacionResumen } = require("../views/mensaje.view");

// RF-11: listar mis conversaciones (una fila por interlocutor, con el último mensaje)
async function listarConversaciones(req, res, next) {
  try {
    const resultados = await Mensaje.listarConversaciones(req.usuarioId);
    res.json(resultados.map(conversacionResumen));
  } catch (err) {
    next(err);
  }
}

// RF-11: historial de conversación con un usuario específico
async function historial(req, res, next) {
  try {
    const mensajes = await Mensaje.conversacion(req.usuarioId, req.params.usuarioId);
    await Mensaje.marcarLeidos(req.params.usuarioId, req.usuarioId);
    res.json(mensajes.map(mensaje));
  } catch (err) {
    next(err);
  }
}

// RF-11: enviar un mensaje
async function enviar(req, res, next) {
  try {
    const { destinatarioId, contenido } = req.body;
    if (destinatarioId === req.usuarioId) {
      return res.status(400).json({ error: "No puedes enviarte un mensaje a ti mismo." });
    }
    const destino = await Usuario.buscarPorId(destinatarioId);
    if (!destino) return res.status(404).json({ error: "Destinatario no encontrado." });

    const nuevo = await Mensaje.crear({ remitenteId: req.usuarioId, destinatarioId, contenido });
    res.status(201).json(mensaje(nuevo));
  } catch (err) {
    next(err);
  }
}

module.exports = { listarConversaciones, historial, enviar };
