const Intercambio = require("../models/Intercambio.model");
const { intercambio, intercambioListado } = require("../views/intercambio.view");

function estaAutorizado(row, usuarioId) {
  return row.usuario_origen_id === usuarioId || row.usuario_destino_id === usuarioId;
}

// Listar mis intercambios (activos e históricos)
async function listar(req, res, next) {
  try {
    const resultados = await Intercambio.listarPorUsuario(req.usuarioId);
    res.json(resultados.map(intercambioListado));
  } catch (err) {
    next(err);
  }
}

// Marcar el intercambio como completado (en_curso -> completada: "pendiente de calificación")
async function completar(req, res, next) {
  try {
    const row = await Intercambio.buscarConParticipantes(req.params.id);
    if (!row) return res.status(404).json({ error: "Intercambio no encontrado." });
    if (!estaAutorizado(row, req.usuarioId)) return res.status(403).json({ error: "No participas en este intercambio." });
    if (row.estado !== "en_curso") {
      return res.status(409).json({ error: `El intercambio ya está en estado "${row.estado}".` });
    }
    const actualizado = await Intercambio.actualizarEstado(req.params.id, "completada");
    res.json(intercambio(actualizado));
  } catch (err) {
    next(err);
  }
}

// Cancelar el intercambio en curso (ramas "cancelada por acuerdo mutuo" / "por incumplimiento")
async function cancelar(req, res, next) {
  try {
    const motivo = req.body?.motivo === "incumplimiento" ? "cancelada_incumplimiento" : "cancelada_mutuo";
    const row = await Intercambio.buscarConParticipantes(req.params.id);
    if (!row) return res.status(404).json({ error: "Intercambio no encontrado." });
    if (!estaAutorizado(row, req.usuarioId)) return res.status(403).json({ error: "No participas en este intercambio." });
    if (row.estado !== "en_curso") {
      return res.status(409).json({ error: `El intercambio ya está en estado "${row.estado}".` });
    }
    const actualizado = await Intercambio.actualizarEstado(req.params.id, motivo);
    res.json(intercambio(actualizado));
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, completar, cancelar };
