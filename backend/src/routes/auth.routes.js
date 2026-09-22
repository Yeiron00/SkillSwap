const express = require("express");
const bcrypt = require("bcryptjs");
const { body } = require("express-validator");
const db = require("../db");
const { firmarToken } = require("../utils/jwt");
const { validate } = require("../middleware/validate");
const { requiereAuth } = require("../middleware/auth");
const { usuarioPublico } = require("../utils/serializers");

const router = express.Router();

// RF-01: Registro de usuarios
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
  async (req, res, next) => {
    try {
      const { nombre, apellido, email, contrasena, ciudad } = req.body;

      const existente = await db.query("SELECT id FROM usuarios WHERE email = $1", [email]);
      if (existente.rowCount > 0) {
        return res.status(409).json({ error: "Ya existe una cuenta con ese correo." });
      }

      const hash = await bcrypt.hash(contrasena, 10);
      const { rows } = await db.query(
        `INSERT INTO usuarios (nombre, apellido, email, contrasena_hash, ciudad)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [nombre, apellido, email, hash, ciudad || ""]
      );
      const usuario = rows[0];
      const token = firmarToken({ sub: usuario.id });
      res.status(201).json({ token, usuario: usuarioPublico(usuario) });
    } catch (err) {
      next(err);
    }
  }
);

// RF-02: Inicio de sesión
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Correo electrónico inválido.").normalizeEmail(),
    body("contrasena").notEmpty().withMessage("La contraseña es obligatoria.")
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, contrasena } = req.body;
      const { rows } = await db.query("SELECT * FROM usuarios WHERE email = $1 AND activo = true", [email]);
      const usuario = rows[0];
      if (!usuario) {
        return res.status(401).json({ error: "Correo o contraseña incorrectos." });
      }
      const coincide = await bcrypt.compare(contrasena, usuario.contrasena_hash);
      if (!coincide) {
        return res.status(401).json({ error: "Correo o contraseña incorrectos." });
      }
      const token = firmarToken({ sub: usuario.id });
      res.json({ token, usuario: usuarioPublico(usuario) });
    } catch (err) {
      next(err);
    }
  }
);

// RF-02: Cierre de sesión (JWT es stateless: el cliente simplemente descarta el token)
router.post("/logout", requiereAuth, (req, res) => {
  res.json({ mensaje: "Sesión cerrada." });
});

module.exports = router;
