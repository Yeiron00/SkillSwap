const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const soporteController = require("../controllers/soporte.controller");

const router = express.Router();

// Rutas públicas: el soporte también debe poder usarse desde la pantalla de inicio de sesión.
router.get("/sugerencias", soporteController.sugerencias);

router.post(
  "/mensaje",
  [body("mensaje").isString().trim().isLength({ min: 1, max: 500 }).withMessage("El mensaje debe tener entre 1 y 500 caracteres.")],
  validate,
  soporteController.responder
);

module.exports = router;
