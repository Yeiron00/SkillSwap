const express = require("express");
const { param } = require("express-validator");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const intercambiosController = require("../controllers/intercambios.controller");

const router = express.Router();

router.get("/", requiereAuth, intercambiosController.listar);

router.put(
  "/:id/completar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  intercambiosController.completar
);

router.put(
  "/:id/cancelar",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  intercambiosController.cancelar
);

module.exports = router;
