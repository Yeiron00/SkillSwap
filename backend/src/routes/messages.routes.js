const express = require("express");
const { body, param } = require("express-validator");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const mensajesController = require("../controllers/mensajes.controller");

const router = express.Router();

router.get("/conversaciones", requiereAuth, mensajesController.listarConversaciones);

router.get(
  "/:usuarioId",
  requiereAuth,
  [param("usuarioId").isUUID()],
  validate,
  mensajesController.historial
);

router.post(
  "/",
  requiereAuth,
  [
    body("destinatarioId").isUUID().withMessage("Debes indicar el destinatario."),
    body("contenido").trim().isLength({ min: 1, max: 2000 }).withMessage("El mensaje no puede estar vacío.")
  ],
  validate,
  mensajesController.enviar
);

module.exports = router;
