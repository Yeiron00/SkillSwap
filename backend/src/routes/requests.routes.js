const express = require("express");
const { body, param, query } = require("express-validator");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const solicitudesController = require("../controllers/solicitudes.controller");

const router = express.Router();

router.post(
  "/",
  requiereAuth,
  [
    body("habilidadDeseadaId").isUUID().withMessage("Debes indicar la habilidad que deseas."),
    body("habilidadOfrecida").trim().isLength({ min: 1, max: 120 }).withMessage("Debes indicar qué ofreces a cambio."),
    body("mensaje").optional().trim().isLength({ max: 1000 })
  ],
  validate,
  solicitudesController.enviar
);

router.get(
  "/",
  requiereAuth,
  [query("tipo").optional().isIn(["recibidas", "enviadas"])],
  validate,
  solicitudesController.listar
);

router.put(
  "/:id/aceptar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  solicitudesController.aceptar
);

router.put(
  "/:id/rechazar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  solicitudesController.rechazar
);

router.put(
  "/:id/cancelar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  solicitudesController.cancelar
);

module.exports = router;
