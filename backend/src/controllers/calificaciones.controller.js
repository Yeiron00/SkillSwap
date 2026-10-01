const db = require("../db");
const Intercambio = require("../models/Intercambio.model");
const Calificacion = require("../models/Calificacion.model");
const { calificacion } = require("../views/calificacion.view");

// RF-12: calificar a otro usuario al cierre de un intercambio
// (diagrama de secuencia "Calificación Post-Intercambio")
async function calificar(req, res, next) {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const { intercambioId, puntuacion, comentario } = req.body;

    const i = await Intercambio.buscarConParticipantesParaActualizar(intercambioId, client);
    if (!i) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Intercambio no encontrado." }); }

    const esOrigen = i.usuario_origen_id === req.usuarioId;
    const esDestino = i.usuario_destino_id === req.usuarioId;
    if (!esOrigen && !esDestino) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "No participas en este intercambio." });
    }
    if (!["completada", "finalizada"].includes(i.estado)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "El intercambio debe estar completado antes de calificar." });
    }
    const usuarioCalificadoId = esOrigen ? i.usuario_destino_id : i.usuario_origen_id;

    const previa = await Calificacion.buscarDeCalificador(intercambioId, req.usuarioId, client);
    if (previa) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Ya calificaste este intercambio." });
    }

    const nueva = await Calificacion.crear(
      { intercambioId, usuarioCalificadoId, usuarioCalificadorId: req.usuarioId, puntuacion, comentario },
      client
    );

    // Si ambas partes ya calificaron, el intercambio pasa a "finalizada" (calificada), como indica el diagrama de estado.
    const totalCalificaciones = await Calificacion.contarPorIntercambio(intercambioId, client);
    if (totalCalificaciones >= 2) {
      await Intercambio.actualizarEstado(intercambioId, "finalizada", { finalizarFecha: false }, client);
    }

    await client.query("COMMIT");
    res.status(201).json(calificacion(nueva));
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { calificar };
