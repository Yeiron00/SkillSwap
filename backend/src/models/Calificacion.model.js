// Modelo: acceso a datos de la tabla `calificaciones`.

const db = require("../db");

const Calificacion = {
  async crear({ intercambioId, usuarioCalificadoId, usuarioCalificadorId, puntuacion, comentario }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO calificaciones (intercambio_id, usuario_calificado_id, usuario_calificador_id, puntuacion, comentario)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [intercambioId, usuarioCalificadoId, usuarioCalificadorId, puntuacion, comentario || ""]
    );
    return rows[0];
  },

  async buscarDeCalificador(intercambioId, calificadorId, executor = db) {
    const { rows } = await executor.query(
      "SELECT id FROM calificaciones WHERE intercambio_id = $1 AND usuario_calificador_id = $2",
      [intercambioId, calificadorId]
    );
    return rows[0] || null;
  },

  async contarPorIntercambio(intercambioId, executor = db) {
    const { rows } = await executor.query(
      "SELECT COUNT(*)::int AS total FROM calificaciones WHERE intercambio_id = $1",
      [intercambioId]
    );
    return rows[0].total;
  },

  async listarPorUsuarioCalificado(usuarioId, executor = db) {
    const { rows } = await executor.query(
      `SELECT c.*, u.nombre AS calificador_nombre
       FROM calificaciones c JOIN usuarios u ON u.id = c.usuario_calificador_id
       WHERE c.usuario_calificado_id = $1 ORDER BY c.fecha DESC`,
      [usuarioId]
    );
    return rows;
  },

  async promedioYTotal(usuarioId, executor = db) {
    const { rows } = await executor.query(
      `SELECT COALESCE(AVG(puntuacion), 0)::numeric(3,1) AS promedio, COUNT(*)::int AS total
       FROM calificaciones WHERE usuario_calificado_id = $1`,
      [usuarioId]
    );
    return { promedio: Number(rows[0].promedio), total: rows[0].total };
  }
};

module.exports = Calificacion;
