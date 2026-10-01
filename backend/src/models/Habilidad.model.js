// Modelo: acceso a datos de la tabla `habilidades`.

const db = require("../db");

const Habilidad = {
  async buscar({ q, categoria, usuarioId }, executor = db) {
    const condiciones = [];
    const valores = [];
    let i = 1;

    if (q) {
      condiciones.push(`(h.nombre ILIKE $${i} OR h.descripcion ILIKE $${i})`);
      valores.push(`%${q}%`);
      i++;
    }
    if (categoria && categoria !== "Todas") {
      condiciones.push(`h.categoria = $${i}`);
      valores.push(categoria);
      i++;
    }
    if (usuarioId) {
      condiciones.push(`h.usuario_id = $${i}`);
      valores.push(usuarioId);
      i++;
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
    const { rows } = await executor.query(
      `SELECT h.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.ciudad AS usuario_ciudad
       FROM habilidades h JOIN usuarios u ON u.id = h.usuario_id
       ${where}
       ORDER BY h.fecha_publicacion DESC`,
      valores
    );
    return rows;
  },

  async buscarPorUsuario(usuarioId, executor = db) {
    const { rows } = await executor.query(
      "SELECT * FROM habilidades WHERE usuario_id = $1 ORDER BY fecha_publicacion DESC",
      [usuarioId]
    );
    return rows;
  },

  async buscarPorId(id, executor = db) {
    const { rows } = await executor.query("SELECT * FROM habilidades WHERE id = $1", [id]);
    return rows[0] || null;
  },

  async crear({ usuarioId, nombre, descripcion, categoria, nivel, tipo }, executor = db) {
    const { rows } = await executor.query(
      `INSERT INTO habilidades (usuario_id, nombre, descripcion, categoria, nivel, tipo)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuarioId, nombre, descripcion, categoria, nivel || "Principiante", tipo || "ofrecida"]
    );
    return rows[0];
  },

  async actualizar(id, columnas, executor = db) {
    const entradas = Object.entries(columnas);
    const sets = entradas.map(([col], i) => `${col} = $${i + 1}`);
    const valores = entradas.map(([, val]) => val);
    valores.push(id);
    const { rows } = await executor.query(
      `UPDATE habilidades SET ${sets.join(", ")} WHERE id = $${valores.length} RETURNING *`,
      valores
    );
    return rows[0];
  },

  async eliminar(id, executor = db) {
    await executor.query("DELETE FROM habilidades WHERE id = $1", [id]);
  },

  async categoriasDeUsuario(usuarioId, executor = db) {
    const { rows } = await executor.query(
      "SELECT DISTINCT categoria FROM habilidades WHERE usuario_id = $1",
      [usuarioId]
    );
    return rows.map(r => r.categoria);
  },

  async usuariosConCategoriasCompartidas(usuarioId, categorias, executor = db) {
    const { rows } = await executor.query(
      `SELECT u.id, u.nombre, u.apellido, u.ciudad, u.descripcion,
              COUNT(DISTINCT h.categoria)::int AS categorias_compartidas,
              ARRAY_AGG(DISTINCT h.nombre) AS habilidades
       FROM usuarios u
       JOIN habilidades h ON h.usuario_id = u.id
       WHERE u.id <> $1 AND h.categoria = ANY($2::text[])
       GROUP BY u.id
       ORDER BY categorias_compartidas DESC, u.nombre ASC
       LIMIT 20`,
      [usuarioId, categorias]
    );
    return rows;
  }
};

module.exports = Habilidad;
