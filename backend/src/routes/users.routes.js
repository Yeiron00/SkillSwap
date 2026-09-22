const express = require("express");
const { body, param } = require("express-validator");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { usuarioPublico, habilidad, calificacion } = require("../utils/serializers");

const router = express.Router();

// RF-03: obtener mi perfil
router.get("/me", requiereAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1", [req.usuarioId]);
    if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado." });
    res.json(usuarioPublico(rows[0]));
  } catch (err) {
    next(err);
  }
});

// RF-03: editar mi perfil
router.put(
  "/me",
  requiereAuth,
  [
    body("nombre").optional().trim().isLength({ min: 1, max: 80 }),
    body("apellido").optional().trim().isLength({ min: 1, max: 80 }),
    body("ciudad").optional().trim().isLength({ max: 120 }),
    body("descripcion").optional().trim().isLength({ max: 1000 }),
    body("fotoPerfil").optional({ nullable: true }).isURL().withMessage("La foto de perfil debe ser una URL válida.")
  ],
  validate,
  async (req, res, next) => {
    try {
      const campos = ["nombre", "apellido", "ciudad", "descripcion"];
      const columnas = { nombre: "nombre", apellido: "apellido", ciudad: "ciudad", descripcion: "descripcion", fotoPerfil: "foto_perfil" };
      const sets = [];
      const valores = [];
      let i = 1;
      for (const key of [...campos, "fotoPerfil"]) {
        if (req.body[key] !== undefined) {
          sets.push(`${columnas[key]} = $${i++}`);
          valores.push(req.body[key]);
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: "No se enviaron campos para actualizar." });
      valores.push(req.usuarioId);
      const { rows } = await db.query(
        `UPDATE usuarios SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
        valores
      );
      res.json(usuarioPublico(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

// RF-06: ver el perfil público de otro usuario, con sus habilidades y calificaciones
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Id de usuario inválido.")],
  validate,
  async (req, res, next) => {
    try {
      const { rows } = await db.query("SELECT * FROM usuarios WHERE id = $1 AND activo = true", [req.params.id]);
      if (!rows[0]) return res.status(404).json({ error: "Usuario no encontrado." });

      const habilidades = await db.query(
        "SELECT * FROM habilidades WHERE usuario_id = $1 ORDER BY fecha_publicacion DESC",
        [req.params.id]
      );
      const calificaciones = await db.query(
        `SELECT c.*, u.nombre AS calificador_nombre
         FROM calificaciones c JOIN usuarios u ON u.id = c.usuario_calificador_id
         WHERE c.usuario_calificado_id = $1 ORDER BY c.fecha DESC`,
        [req.params.id]
      );
      const promedio = await db.query(
        `SELECT COALESCE(AVG(puntuacion), 0)::numeric(3,1) AS promedio, COUNT(*)::int AS total
         FROM calificaciones WHERE usuario_calificado_id = $1`,
        [req.params.id]
      );
      const intercambios = await db.query(
        `SELECT COUNT(*)::int AS total FROM intercambios i
         JOIN solicitudes s ON s.id = i.solicitud_id
         WHERE (s.usuario_origen_id = $1 OR s.usuario_destino_id = $1)
           AND i.estado IN ('completada', 'finalizada')`,
        [req.params.id]
      );

      res.json({
        ...usuarioPublico(rows[0]),
        habilidades: habilidades.rows.map(habilidad),
        calificaciones: calificaciones.rows.map(c => ({ ...calificacion(c), calificadorNombre: c.calificador_nombre })),
        calificacionPromedio: Number(promedio.rows[0].promedio),
        calificacionTotal: promedio.rows[0].total,
        intercambiosCompletados: intercambios.rows[0].total
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
