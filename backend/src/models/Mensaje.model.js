// Modelo: acceso a datos de la tabla `mensajes`.

const db = require("../db");

const Mensaje = {
  async crear({ remitenteId, destinatarioId, contenido }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO mensajes (remitente_id, destinatario_id, contenido)
       VALUES ($1, $2, $3) RETURNING *`,
      [remitenteId, destinatarioId, contenido]
    );
    return rows[0];
  },

  async conversacion(usuarioId, otroUsuarioId, executor = db) {
    const { rows } = await executor.query(
      `SELECT * FROM mensajes
       WHERE (remitente_id = $1 AND destinatario_id = $2)
          OR (remitente_id = $2 AND destinatario_id = $1)
       ORDER BY fecha_envio ASC`,
      [usuarioId, otroUsuarioId]
    );
    return rows;
  },

  async marcarLeidos(remitenteId, destinatarioId, executor = db) {
    await executor.query(
      "UPDATE mensajes SET leido = true WHERE remitente_id = $1 AND destinatario_id = $2 AND leido = false",
      [remitenteId, destinatarioId]
    );
  },

  async listarConversaciones(usuarioId, executor = db) {
    const { rows } = await executor.query(
      `SELECT DISTINCT ON (interlocutor_id) interlocutor_id, u.nombre, u.apellido, u.ciudad,
              m.contenido AS ultimo_mensaje, m.fecha_envio
       FROM (
         SELECT CASE WHEN remitente_id = $1 THEN destinatario_id ELSE remitente_id END AS interlocutor_id,
                contenido, fecha_envio
         FROM mensajes
         WHERE remitente_id = $1 OR destinatario_id = $1
       ) m
       JOIN usuarios u ON u.id = m.interlocutor_id
       ORDER BY interlocutor_id, fecha_envio DESC`,
      [usuarioId]
    );
    return rows;
  }
};

module.exports = Mensaje;
