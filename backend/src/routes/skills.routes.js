const express = require("express");
const { body, param, query } = require("express-validator");
const { requiereAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const habilidadesController = require("../controllers/habilidades.controller");

const router = express.Router();

const NIVELES = ["Principiante", "Intermedio", "Avanzado"];

router.get(
  "/",
  [
    query("q").optional().trim(),
    query("categoria").optional().trim(),
    query("usuarioId").optional().isUUID()
  ],
  validate,
  habilidadesController.buscar
);

router.post(
  "/",
  requiereAuth,
  [
    body("nombre").trim().isLength({ min: 1, max: 120 }).withMessage("El nombre es obligatorio."),
    body("descripcion").trim().isLength({ min: 1 }).withMessage("La descripción es obligatoria."),
    body("categoria").trim().isLength({ min: 1, max: 60 }).withMessage("La categoría es obligatoria."),
    body("nivel").optional().isIn(NIVELES).withMessage(`El nivel debe ser uno de: ${NIVELES.join(", ")}`),
    body("tipo").optional().isIn(["ofrecida", "deseada"])
  ],
  validate,
  habilidadesController.publicar
);

router.put(
  "/:id",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  habilidadesController.actualizar
);

router.delete(
  "/:id",
  requiereAuth,
  [param("id").isUUID()],
  validate,
  habilidadesController.eliminar
);

module.exports = router;
