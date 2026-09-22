const express = require("express");
const { body, param, query } = require("express-validator");
const db = require("../db");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { solicitud } = require("../utils/serializers");

const router = express.Router();

// RF-08: enviar una solicitud de intercambio sobre una habilidad de otro usuario
router.post(
  "/",
  requiereAuth,
  [
    body("habilidadDeseadaId").isUUID().withMessage("Debes indicar la habilidad que deseas."),
    body("habilidadOfrecida").trim().isLength({ min: 1, max: 120 }).withMessage("Debes indicar qué ofreces a cambio."),
    body("mensaje").optional().trim().isLength({ max: 1000 })
  ],
  validate,
  async (req, res, next) => {
    try {
      const { habilidadDeseadaId, habilidadOfrecida, mensaje } = req.body;
      const hab = await db.query("SELECT * FROM habilidades WHERE id = $1", [habilidadDeseadaId]);
      if (!hab.rows[0]) return res.status(404).json({ error: "La habilidad indicada no existe." });
      const destinoId = hab.rows[0].usuario_id;
      if (destinoId === req.usuarioId) {
        return res.status(400).json({ error: "No puedes enviarte una solicitud a ti mismo." });
      }

      const { rows } = await db.query(
        `INSERT INTO solicitudes (usuario_origen_id, usuario_destino_id, habilidad_ofrecida, habilidad_deseada_id, mensaje)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.usuarioId, destinoId, habilidadOfrecida, habilidadDeseadaId, mensaje || ""]
      );
      res.status(201).json(solicitud(rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

// RF-09: listar solicitudes recibidas o enviadas
router.get(
  "/",
  requiereAuth,
  [query("tipo").optional().isIn(["recibidas", "enviadas"])],
  validate,
  async (req, res, next) => {
    try {
      const tipo = req.query.tipo || "recibidas";
      const columna = tipo === "recibidas" ? "usuario_destino_id" : "usuario_origen_id";
      const { rows } = await db.query(
        `SELECT s.*, h.nombre AS habilidad_deseada_nombre,
                uo.nombre AS origen_nombre, uo.apellido AS origen_apellido,
                ud.nombre AS destino_nombre, ud.apellido AS destino_apellido
         FROM solicitudes s
         JOIN habilidades h ON h.id = s.habilidad_deseada_id
         JOIN usuarios uo ON uo.id = s.usuario_origen_id
         JOIN usuarios ud ON ud.id = s.usuario_destino_id
         WHERE s.${columna} = $1
         ORDER BY s.fecha_envio DESC`,
        [req.usuarioId]
      );
      res.json(rows.map(r => ({
        ...solicitud(r),
        habilidadDeseadaNombre: r.habilidad_deseada_nombre,
        origen: { nombre: r.origen_nombre, apellido: r.origen_apellido },
        destino: { nombre: r.destino_nombre, apellido: r.destino_apellido }
      })));
    } catch (err) {
      next(err);
    }
  }
);

// RF-09: aceptar una solicitud recibida -> crea el intercambio (diagrama de estado: pendiente -> aceptada/en curso)
router.put(
  "/:id/aceptar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    const client = await db.pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query("SELECT * FROM solicitudes WHERE id = $1 FOR UPDATE", [req.params.id]);
      const s = rows[0];
      if (!s) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Solicitud no encontrada." }); }
      if (s.usuario_destino_id !== req.usuarioId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Solo el destinatario puede aceptar la solicitud." });
      }
      if (s.estado !== "pendiente") {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: `La solicitud ya está en estado "${s.estado}".` });
      }
      const actualizada = await client.query(
        "UPDATE solicitudes SET estado = 'aceptada' WHERE id = $1 RETURNING *",
        [req.params.id]
      );
      const intercambio = await client.query(
        "INSERT INTO intercambios (solicitud_id, estado) VALUES ($1, 'en_curso') RETURNING *",
        [req.params.id]
      );
      await client.query("COMMIT");
      res.json({ solicitud: solicitud(actualizada.rows[0]), intercambio: intercambio.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  }
);

// RF-09: rechazar una solicitud recibida
router.put(
  "/:id/rechazar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { rows } = await db.query("SELECT * FROM solicitudes WHERE id = $1", [req.params.id]);
      const s = rows[0];
      if (!s) return res.status(404).json({ error: "Solicitud no encontrada." });
      if (s.usuario_destino_id !== req.usuarioId) {
        return res.status(403).json({ error: "Solo el destinatario puede rechazar la solicitud." });
      }
      if (s.estado !== "pendiente") {
        return res.status(409).json({ error: `La solicitud ya está en estado "${s.estado}".` });
      }
      const actualizada = await db.query(
        "UPDATE solicitudes SET estado = 'rechazada' WHERE id = $1 RETURNING *",
        [req.params.id]
      );
      res.json(solicitud(actualizada.rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

// El solicitante puede cancelar mientras esté pendiente (rama "Cancelada por solicitante" del diagrama de estado)
router.put(
  "/:id/cancelar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  async (req, res, next) => {
    try {
      const { rows } = await db.query("SELECT * FROM solicitudes WHERE id = $1", [req.params.id]);
      const s = rows[0];
      if (!s) return res.status(404).json({ error: "Solicitud no encontrada." });
      if (s.usuario_origen_id !== req.usuarioId) {
        return res.status(403).json({ error: "Solo quien envió la solicitud puede cancelarla." });
      }
      if (s.estado !== "pendiente") {
        return res.status(409).json({ error: `La solicitud ya está en estado "${s.estado}".` });
      }
      const actualizada = await db.query(
        "UPDATE solicitudes SET estado = 'cancelada' WHERE id = $1 RETURNING *",
        [req.params.id]
      );
      res.json(solicitud(actualizada.rows[0]));
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
