const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { requiereAuth } = require("../middleware/auth");
const authController = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/registro",
  [
    body("nombre").trim().isLength({ min: 1, max: 80 }).withMessage("El nombre es obligatorio."),
    body("apellido").trim().isLength({ min: 1, max: 80 }).withMessage("El apellido es obligatorio."),
    body("email").isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
    body("contrasena").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres."),
    body("ciudad").optional().trim()
  ],
  validate,
  authController.registrar
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
    body("contrasena").notEmpty().withMessage("La contraseña es obligatoria.")
  ],
  validate,
  authController.login
);

router.post("/logout", requiereAuth, authController.logout);

module.exports = router;
