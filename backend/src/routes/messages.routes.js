const express = require("express");
const { body, param } = require("express-validator");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { mensaje } = require("../utils/serializers");

const router = express.Router();

// RF-11: listar mis conversaciones (una fila por interlocutor, con el último mensaje)
router.get("/conversaciones", requiereAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
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
      [req.usuarioId]
    );
    res.json(rows.map(r => ({
      usuarioId: r.interlocutor_id,
      nombre: r.nombre,
      apellido: r.apellido,
      ciudad: r.ciudad,
      ultimoMensaje: r.ultimo_mensaje,
      fecha: r.fecha_envio
    })));
  } catch (err) {
    next(err);
  }
});

// RF-11: historial de conversación con un usuario específico
router.get(
  "/:usuarioId",
  requiereAuth,
  [param("usuarioId").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { rows } = await db.query(
        `SELECT * FROM mensajes
         WHERE (remitente_id = $1 AND destinatario_id = $2)
            OR (remitente_id = $2 AND destinatario_id = $1)
         ORDER BY fecha_envio ASC`,
        [req.usuarioId, req.params.usuarioId]
      );
      await db.query(
        "UPDATE mensajes SET leido = true WHERE remitente_id = $1 AND destinatario_id = $2 AND leido = false",
        [req.params.usuarioId, req.usuarioId]
      );
      res.json(rows.map(mensaje));
    } catch (err) {
      next(err);
    }
  }
);

// RF-11: enviar un mensaje
router.post(
  "/",
  requiereAuth,
  [
    body("destinatarioId").isUUID().withMessage("Debes indicar el destinatario."),
    body("contenido").trim().isLength({ min: 1, max: 2000 }).withMessage("El mensaje no puede estar vacío.")
  ],
  validate,
  async (req, res, next) => {
    try {
      const { destinatarioId, contenido } = req.body;
      if (destinatarioId === req.usuarioId) {
        return res.status(400).json({ error: "No puedes enviarte un mensaje a ti mismo." });
      }
      const destino = await db.query("SELECT id FROM usuarios WHERE id = $1", [destinatarioId]);
      if (!destino.rows[0]) return res.status(404).json({ error: "Destinatario no encontrado." });

      const { rows } = await db.query(
        `INSERT INTO mensajes (remitente_id, destinatario_id, contenido)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.usuarioId, destinatarioId, contenido]
      );
      res.status(201).json(mensaje(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
