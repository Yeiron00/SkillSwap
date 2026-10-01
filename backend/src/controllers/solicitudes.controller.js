const db = require("../db");
const Habilidad = require("../models/Habilidad.model");
const Solicitud = require("../models/Solicitud.model");
const Intercambio = require("../models/Intercambio.model");
const { solicitud, solicitudListado } = require("../views/solicitud.view");

// RF-08: enviar una solicitud de intercambio sobre una habilidad de otro usuario
async function enviar(req, res, next) {
  try {
    const { habilidadDeseadaId, habilidadOfrecida, mensaje } = req.body;
    const hab = await Habilidad.buscarPorId(habilidadDeseadaId);
    if (!hab) return res.status(404).json({ error: "La habilidad indicada no existe." });

    const destinoId = hab.usuario_id;
    if (destinoId === req.usuarioId) {
      return res.status(400).json({ error: "No puedes enviarte una solicitud a ti mismo." });
    }

    const nueva = await Solicitud.crear({
      usuarioOrigenId: req.usuarioId,
      usuarioDestinoId: destinoId,
      habilidadOfrecida,
      habilidadDeseadaId,
      mensaje
    });
    res.status(201).json(solicitud(nueva));
  } catch (err) {
    next(err);
  }
}

// RF-09: listar solicitudes recibidas o enviadas
async function listar(req, res, next) {
  try {
    const tipo = req.query.tipo || "recibidas";
    const resultados = await Solicitud.listarPorUsuario(req.usuarioId, tipo);
    res.json(resultados.map(solicitudListado));
  } catch (err) {
    next(err);
  }
}

// RF-09: aceptar una solicitud recibida -> crea el intercambio
// (diagrama de estado: pendiente -> aceptada / se crea intercambio en "en_curso")
async function aceptar(req, res, next) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const s = await Solicitud.buscarPorIdParaActualizar(req.params.id, client);
    if (!s) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Solicitud no encontrada." }); }
    if (s.usuario_destino_id !== req.usuarioId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Solo el destinatario puede aceptar la solicitud." });
    }
    if (s.estado !== "pendiente") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `La solicitud ya está en estado "${s.estado}".` });
    }

    const actualizada = await Solicitud.actualizarEstado(req.params.id, "aceptada", client);
    const intercambio = await Intercambio.crear({ solicitudId: req.params.id }, client);

    await client.query("COMMIT");
    res.json({ solicitud: solicitud(actualizada), intercambio });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

// RF-09: rechazar una solicitud recibida
async function rechazar(req, res, next) {
  try {
    const s = await Solicitud.buscarPorId(req.params.id);
    if (!s) return res.status(404).json({ error: "Solicitud no encontrada." });
    if (s.usuario_destino_id !== req.usuarioId) {
      return res.status(403).json({ error: "Solo el destinatario puede rechazar la solicitud." });
    }
    if (s.estado !== "pendiente") {
      return res.status(409).json({ error: `La solicitud ya está en estado "${s.estado}".` });
    }
    const actualizada = await Solicitud.actualizarEstado(req.params.id, "rechazada");
    res.json(solicitud(actualizada));
  } catch (err) {
    next(err);
  }
}

// El solicitante puede cancelar mientras esté pendiente (rama "Cancelada por solicitante" del diagrama de estado)
async function cancelar(req, res, next) {
  try {
    const s = await Solicitud.buscarPorId(req.params.id);
    if (!s) return res.status(404).json({ error: "Solicitud no encontrada." });
    if (s.usuario_origen_id !== req.usuarioId) {
      return res.status(403).json({ error: "Solo quien envió la solicitud puede cancelarla." });
    }
    if (s.estado !== "pendiente") {
      return res.status(409).json({ error: `La solicitud ya está en estado "${s.estado}".` });
    }
    const actualizada = await Solicitud.actualizarEstado(req.params.id, "cancelada");
    res.json(solicitud(actualizada));
  } catch (err) {
    next(err);
  }
}

module.exports = { enviar, listar, aceptar, rechazar, cancelar };
