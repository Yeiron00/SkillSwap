const express = require("express");
const { requiereAuth } = require("../middleware/auth");
const emparejamientoController = require("../controllers/emparejamiento.controller");

const router = express.Router();

router.get("/", requiereAuth, emparejamientoController.listar);

module.exports = router;
