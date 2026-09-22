const express = require("express");
const { body } = require("express-validator");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { calificacion } = require("../utils/serializers");

const router = express.Router();

// RF-12: calificar a otro usuario al cierre de un intercambio (diagrama de secuencia "Calificación Post-Intercambio")
router.post(
  "/",
  requiereAuth,
  [
    body("intercambioId").isUUID().withMessage("Debes indicar el intercambio."),
    body("puntuacion").isInt({ min: 1, max: 5 }).withMessage("La puntuación debe ser un entero entre 1 y 5."),
    body("comentario").optional().trim().isLength({ max: 1000 })
  ],
  validate,
  async (req, res, next) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const { intercambioId, puntuacion, comentario } = req.body;

      const { rows } = await client.query(
        `SELECT i.*, s.usuario_origen_id, s.usuario_destino_id
         FROM intercambios i JOIN solicitudes s ON s.id = i.solicitud_id
         WHERE i.id = $1 FOR UPDATE`,
        [intercambioId]
      );
      const i = rows[0];
      if (!i) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Intercambio no encontrado." }); }

      const esOrigen = i.usuario_origen_id === req.usuarioId;
      const esDestino = i.usuario_destino_id === req.usuarioId;
      if (!esOrigen && !esDestino) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "No participas en este intercambio." });
      }
      if (!["completada", "finalizada"].includes(i.estado)) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "El intercambio debe estar completado antes de calificar." });
      }
      const usuarioCalificadoId = esOrigen ? i.usuario_destino_id : i.usuario_origen_id;

      const previa = await client.query(
        "SELECT id FROM calificaciones WHERE intercambio_id = $1 AND usuario_calificador_id = $2",
        [intercambioId, req.usuarioId]
      );
      if (previa.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Ya calificaste este intercambio." });
      }

      const insertada = await client.query(
        `INSERT INTO calificaciones (intercambio_id, usuario_calificado_id, usuario_calificador_id, puntuacion, comentario)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [intercambioId, usuarioCalificadoId, req.usuarioId, puntuacion, comentario || ""]
      );

      // Si ambas partes ya calificaron, el intercambio pasa a "finalizada" (calificada), como indica el diagrama de estado.
      const totalCalificaciones = await client.query(
        "SELECT COUNT(*)::int AS total FROM calificaciones WHERE intercambio_id = $1",
        [intercambioId]
      );
      if (totalCalificaciones.rows[0].total >= 2) {
        await client.query("UPDATE intercambios SET estado = 'finalizada' WHERE id = $1", [intercambioId]);
      }

      await client.query("COMMIT");
      res.status(201).json(calificacion(insertada.rows[0]));
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  }
);

module.exports = router;
