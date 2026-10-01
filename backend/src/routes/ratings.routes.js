const express = require("express");
const { body } = require("express-validator");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const calificacionesController = require("../controllers/calificaciones.controller");

const router = express.Router();

router.post(
  "/",
  requiereAuth,
  [
    body("intercambioId").isUUID().withMessage("Debes indicar el intercambio."),
    body("puntuacion").isInt({ min: 1, max: 5 }).withMessage("La puntuación debe ser un entero entre 1 y 5."),
    body("comentario").optional().trim().isLength({ max: 1000 })
  ],
  validate,
  calificacionesController.calificar
);

module.exports = router;
