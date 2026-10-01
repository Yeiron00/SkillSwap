// Modelo: acceso a datos de la tabla `solicitudes`.

const db = require("../db");

const Solicitud = {
  async crear({ usuarioOrigenId, usuarioDestinoId, habilidadOfrecida, habilidadDeseadaId, mensaje }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO solicitudes (usuario_origen_id, usuario_destino_id, habilidad_ofrecida, habilidad_deseada_id, mensaje)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [usuarioOrigenId, usuarioDestinoId, habilidadOfrecida, habilidadDeseadaId, mensaje || ""]
    );
    return rows[0];
  },

  async buscarPorId(id, executor = db) {
    const { rows } = await executor.query("SELECT * FROM solicitudes WHERE id = $1", [id]);
    return rows[0] || null;
  },

  // Bloquea la fila para la transacción (usar siempre dentro de BEGIN/COMMIT con un `client`).
  async buscarPorIdParaActualizar(id, client) {
    const { rows } = await client.query("SELECT * FROM solicitudes WHERE id = $1 FOR UPDATE", [id]);
    return rows[0] || null;
  },

  async listarPorUsuario(usuarioId, tipo, executor = db) {
    const columna = tipo === "recibidas" ? "usuario_destino_id" : "usuario_origen_id";
    const { rows } = await executor.query(
      `SELECT s.*, h.nombre AS habilidad_deseada_nombre,
              uo.nombre AS origen_nombre, uo.apellido AS origen_apellido,
              ud.nombre AS destino_nombre, ud.apellido AS destino_apellido
       FROM solicitudes s
       JOIN habilidades h ON h.id = s.habilidad_deseada_id
       JOIN usuarios uo ON uo.id = s.usuario_origen_id
       JOIN usuarios ud ON ud.id = s.usuario_destino_id
       WHERE s.${columna} = $1
       ORDER BY s.fecha_envio DESC`,
      [usuarioId]
    );
    return rows;
  },

  async actualizarEstado(id, estado, executor = db) {
    const { rows } = await executor.query(
      "UPDATE solicitudes SET estado = $2 WHERE id = $1 RETURNING *",
      [id, estado]
    );
    return rows[0];
  }
};

module.exports = Solicitud;
