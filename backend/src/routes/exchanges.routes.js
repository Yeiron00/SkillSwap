const express = require("express");
const { param } = require("express-validator");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { intercambio } = require("../utils/serializers");

const router = express.Router();

async function cargarIntercambioDelUsuario(intercambioId, usuarioId) {
  const { rows } = await db.query(
    `SELECT i.*, s.usuario_origen_id, s.usuario_destino_id
     FROM intercambios i JOIN solicitudes s ON s.id = i.solicitud_id
     WHERE i.id = $1`,
    [intercambioId]
  );
  const row = rows[0];
  if (!row) return { row: null, autorizado: false };
  const autorizado = row.usuario_origen_id === usuarioId || row.usuario_destino_id === usuarioId;
  return { row, autorizado };
}

// Listar mis intercambios (activos e históricos)
router.get("/", requiereAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, s.usuario_origen_id, s.usuario_destino_id, s.habilidad_ofrecida,
              h.nombre AS habilidad_deseada_nombre,
              (c.id IS NOT NULL) AS ya_califique
       FROM intercambios i
       JOIN solicitudes s ON s.id = i.solicitud_id
       JOIN habilidades h ON h.id = s.habilidad_deseada_id
       LEFT JOIN calificaciones c ON c.intercambio_id = i.id AND c.usuario_calificador_id = $1
       WHERE s.usuario_origen_id = $1 OR s.usuario_destino_id = $1
       ORDER BY i.fecha_inicio DESC`,
      [req.usuarioId]
    );
    res.json(rows.map(r => ({
      ...intercambio(r),
      usuarioOrigenId: r.usuario_origen_id,
      usuarioDestinoId: r.usuario_destino_id,
      habilidadOfrecida: r.habilidad_ofrecida,
      habilidadDeseadaNombre: r.habilidad_deseada_nombre,
      yaCalifique: r.ya_califique
    })));
  } catch (err) {
    next(err);
  }
});

// Marcar el intercambio como completado (en_curso -> completada: "pendiente de calificación")
router.put(
  "/:id/completar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { row, autorizado } = await cargarIntercambioDelUsuario(req.params.id, req.usuarioId);
      if (!row) return res.status(404).json({ error: "Intercambio no encontrado." });
      if (!autorizado) return res.status(403).json({ error: "No participas en este intercambio." });
      if (row.estado !== "en_curso") {
        return res.status(409).json({ error: `El intercambio ya está en estado "${row.estado}".` });
      }
      const { rows } = await db.query(
        "UPDATE intercambios SET estado = 'completada', fecha_fin = now() WHERE id = $1 RETURNING *",
        [req.params.id]
      );
      res.json(intercambio(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

// Cancelar el intercambio en curso (ramas "cancelada por acuerdo mutuo" / "por incumplimiento")
router.put(
  "/:id/cancelar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const motivo = req.body?.motivo === "incumplimiento" ? "cancelada_incumplimiento" : "cancelada_mutuo";
      const { row, autorizado } = await cargarIntercambioDelUsuario(req.params.id, req.usuarioId);
      if (!row) return res.status(404).json({ error: "Intercambio no encontrado." });
      if (!autorizado) return res.status(403).json({ error: "No participas en este intercambio." });
      if (row.estado !== "en_curso") {
        return res.status(409).json({ error: `El intercambio ya está en estado "${row.estado}".` });
      }
      const { rows } = await db.query(
        "UPDATE intercambios SET estado = $2, fecha_fin = now() WHERE id = $1 RETURNING *",
        [req.params.id, motivo]
      );
      res.json(intercambio(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
