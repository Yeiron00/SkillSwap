// Modelo: acceso a datos de la tabla `usuarios`. Sin lógica de negocio ni de HTTP —
// solo consultas SQL. Cada método acepta un `executor` opcional (la conexión `db` por
// defecto, o un `client` de una transacción) para poder participar en transacciones
// controladas por el controlador que lo invoque.

const db = require("../db");

const Usuario = {
  async crear({ nombre, apellido, email, contrasenaHash, ciudad }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO usuarios (nombre, apellido, email, contrasena_hash, ciudad)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nombre, apellido, email, contrasenaHash, ciudad || ""]
    );
    return rows[0];
  },

  async buscarPorEmail(email, executor = db) {
    const { rows } = await executor.query(
      "SELECT * FROM usuarios WHERE email = $1 AND activo = true",
      [email]
    );
    return rows[0] || null;
  },

  async buscarPorId(id, executor = db) {
    const { rows } = await executor.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    return rows[0] || null;
  },

  async buscarPublicoPorId(id, executor = db) {
    const { rows } = await executor.query(
      "SELECT * FROM usuarios WHERE id = $1 AND activo = true",
      [id]
    );
    return rows[0] || null;
  },

  async actualizarPerfil(id, columnas, executor = db) {
    const entradas = Object.entries(columnas);
    const sets = entradas.map(([col], i) => `${col} = $${i + 1}`);
    const valores = entradas.map(([, val]) => val);
    valores.push(id);
    const { rows } = await executor.query(
      `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${valores.length} RETURNING *`,
      valores
    );
    return rows[0];
  },

  async contarIntercambiosCompletados(usuarioId, executor = db) {
    const { rows } = await executor.query(
      `SELECT COUNT(*)::int AS total FROM intercambios i
       JOIN solicitudes s ON s.id = i.solicitud_id
       WHERE (s.usuario_origen_id = $1 OR s.usuario_destino_id = $1)
         AND i.estado IN ('completada', 'finalizada')`,
      [usuarioId]
    );
    return rows[0].total;
  }
};

module.exports = Usuario;
