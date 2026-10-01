const express = require("express");
const { body, param } = require("express-validator");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const usuariosController = require("../controllers/usuarios.controller");

const router = express.Router();

router.get("/me", requiereAuth, usuariosController.obtenerMiPerfil);

router.put(
  "/me",
  requiereAuth,
  [
    body("nombre").optional().trim().isLength({ min: 1, max: 80 }),
    body("apellido").optional().trim().isLength({ min: 1, max: 80 }),
    body("ciudad").optional().trim().isLength({ max: 120 }),
    body("descripcion").optional().trim().isLength({ max: 1000 }),
    body("fotoPerfil").optional({ nullable: true }).isURL().withMessage("La foto de perfil debe ser una URL válida.")
  ],
  validate,
  usuariosController.actualizarMiPerfil
);

router.get(
  "/:id",
  [param("id").isUUID().withMessage("Id de usuario inválido.")],
  validate,
  usuariosController.obtenerPerfilPublico
);

module.exports = router;
