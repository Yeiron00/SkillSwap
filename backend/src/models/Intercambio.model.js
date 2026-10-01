// Modelo: acceso a datos de la tabla `intercambios`.

const db = require("../db");

const Intercambio = {
  async crear({ solicitudId, estado = "en_curso" }, executor = db) {
    const { rows } = await executor.query(
      "INSERT INTO intercambios (solicitud_id, estado) VALUES ($1, $2) RETURNING *",
      [solicitudId, estado]
    );
    return rows[0];
  },

  // Trae el intercambio junto con los participantes de la solicitud asociada (para autorización).
  async buscarConParticipantes(id, executor = db) {
    const { rows } = await executor.query(
      `SELECT i.*, s.usuario_origen_id, s.usuario_destino_id
       FROM intercambios i JOIN solicitudes s ON s.id = i.solicitud_id
       WHERE i.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  // Igual que arriba pero bloqueando la fila para una transacción (calificar, completar con concurrencia).
  async buscarConParticipantesParaActualizar(id, client) {
    const { rows } = await client.query(
      `SELECT i.*, s.usuario_origen_id, s.usuario_destino_id
       FROM intercambios i JOIN solicitudes s ON s.id = i.solicitud_id
       WHERE i.id = $1 FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  },

  async listarPorUsuario(usuarioId, executor = db) {
    const { rows } = await executor.query(
      `SELECT i.*, s.usuario_origen_id, s.usuario_destino_id, s.habilidad_ofrecida,
              h.nombre AS habilidad_deseada_nombre,
              (c.id IS NOT NULL) AS ya_califique
       FROM intercambios i
       JOIN solicitudes s ON s.id = i.solicitud_id
       JOIN habilidades h ON h.id = s.habilidad_deseada_id
       LEFT JOIN calificaciones c ON c.intercambio_id = i.id AND c.usuario_calificador_id = $1
       WHERE s.usuario_origen_id = $1 OR s.usuario_destino_id = $1
       ORDER BY i.fecha_inicio DESC`,
      [usuarioId]
    );
    return rows;
  },

  async actualizarEstado(id, estado, { finalizarFecha = true } = {}, executor = db) {
    const { rows } = await executor.query(
      finalizarFecha
        ? "UPDATE intercambios SET estado = $2, fecha_fin = now() WHERE id = $1 RETURNING *"
        : "UPDATE intercambios SET estado = $2 WHERE id = $1 RETURNING *",
      [id, estado]
    );
    return rows[0];
  }
};

module.exports = Intercambio;
