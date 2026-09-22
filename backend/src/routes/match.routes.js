const express = require("express");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");

const router = express.Router();

// RF-07: emparejar usuarios con intereses compatibles.
// Heurística simple: usuarios que publican habilidades en categorías donde yo también publico
// (interés compartido), ordenados por cantidad de categorías en común.
router.get("/", requiereAuth, async (req, res, next) => {
  try {
    const misCategorias = await db.query(
      "SELECT DISTINCT categoria FROM habilidades WHERE usuario_id = $1",
      [req.usuarioId]
    );
    const categorias = misCategorias.rows.map(r => r.categoria);
    if (categorias.length === 0) {
      return res.json([]);
    }

    const { rows } = await db.query(
      `SELECT u.id, u.nombre, u.apellido, u.ciudad, u.descripcion,
              COUNT(DISTINCT h.categoria)::int AS categorias_compartidas,
              ARRAY_AGG(DISTINCT h.nombre) AS habilidades
       FROM usuarios u
       JOIN habilidades h ON h.usuario_id = u.id
       WHERE u.id <> $1 AND h.categoria = ANY($2::text[])
       GROUP BY u.id
       ORDER BY categorias_compartidas DESC, u.nombre ASC
       LIMIT 20`,
      [req.usuarioId, categorias]
    );

    const total = categorias.length;
    res.json(rows.map(r => ({
      id: r.id,
      nombre: r.nombre,
      apellido: r.apellido,
      ciudad: r.ciudad,
      descripcion: r.descripcion,
      habilidades: r.habilidades,
      porcentajeCompatibilidad: Math.round((r.categorias_compartidas / total) * 100)
    })));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
