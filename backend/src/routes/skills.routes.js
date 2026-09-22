const express = require("express");
const { body, param, query } = require("express-validator");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { habilidad } = require("../utils/serializers");

const router = express.Router();

const NIVELES = ["Principiante", "Intermedio", "Avanzado"];

// RF-05: buscar habilidades (con filtro de texto y categoría). Excluye las del usuario autenticado si envía token.
router.get(
  "/",
  [
    query("q").optional().trim(),
    query("categoria").optional().trim(),
    query("usuarioId").optional().isUUID()
  ],
  validate,
  async (req, res, next) => {
    try {
      const { q, categoria, usuarioId } = req.query;
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
      const { rows } = await db.query(
        `SELECT h.*, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido, u.ciudad AS usuario_ciudad
         FROM habilidades h JOIN usuarios u ON u.id = h.usuario_id
         ${where}
         ORDER BY h.fecha_publicacion DESC`,
        valores
      );
      res.json(rows.map(r => ({
        ...habilidad(r),
        usuario: { nombre: r.usuario_nombre, apellido: r.usuario_apellido, ciudad: r.usuario_ciudad }
      })));
    } catch (err) {
      next(err);
    }
  }
);

// RF-04: publicar una habilidad propia
router.post(
  "/",
  requiereAuth,
  [
    body("nombre").trim().isLength({ min: 1, max: 120 }).withMessage("El nombre es obligatorio."),
    body("descripcion").trim().isLength({ min: 1 }).withMessage("La descripción es obligatoria."),
    body("categoria").trim().isLength({ min: 1, max: 60 }).withMessage("La categoría es obligatoria."),
    body("nivel").optional().isIn(NIVELES).withMessage(`El nivel debe ser uno de: ${NIVELES.join(", ")}`),
    body("tipo").optional().isIn(["ofrecida", "deseada"])
  ],
  validate,
  async (req, res, next) => {
    try {
      const { nombre, descripcion, categoria, nivel, tipo } = req.body;
      const { rows } = await db.query(
        `INSERT INTO habilidades (usuario_id, nombre, descripcion, categoria, nivel, tipo)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.usuarioId, nombre, descripcion, categoria, nivel || "Principiante", tipo || "ofrecida"]
      );
      res.status(201).json(habilidad(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

// Editar una habilidad propia
router.put(
  "/:id",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const existente = await db.query("SELECT * FROM habilidades WHERE id = $1", [req.params.id]);
      if (!existente.rows[0]) return res.status(404).json({ error: "Habilidad no encontrada." });
      if (existente.rows[0].usuario_id !== req.usuarioId) {
        return res.status(403).json({ error: "No puedes editar una habilidad que no es tuya." });
      }
      const campos = ["nombre", "descripcion", "categoria", "nivel"];
      const sets = [];
      const valores = [];
      let i = 1;
      for (const key of campos) {
        if (req.body[key] !== undefined) {
          sets.push(`${key} = $${i++}`);
          valores.push(req.body[key]);
        }
      }
      if (sets.length === 0) return res.status(400).json({ error: "No se enviaron campos para actualizar." });
      valores.push(req.params.id);
      const { rows } = await db.query(
        `UPDATE habilidades SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
        valores
      );
      res.json(habilidad(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

// Eliminar una habilidad propia
router.delete(
  "/:id",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const existente = await db.query("SELECT usuario_id FROM habilidades WHERE id = $1", [req.params.id]);
      if (!existente.rows[0]) return res.status(404).json({ error: "Habilidad no encontrada." });
      if (existente.rows[0].usuario_id !== req.usuarioId) {
        return res.status(403).json({ error: "No puedes eliminar una habilidad que no es tuya." });
      }
      await db.query("DELETE FROM habilidades WHERE id = $1", [req.params.id]);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
