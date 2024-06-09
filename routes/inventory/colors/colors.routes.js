const colorsRoutes = require("express").Router();
const {
  createSingleColors,
  getSingleColors,
  getAllColors,
  updateSingleColors,
  deleteSingleColors,
} = require("./colors.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

colorsRoutes.post("/", authorize("create-color"), createSingleColors);
colorsRoutes.get("/", authorize("readAll-color"), getAllColors);
colorsRoutes.get("/:id", authorize("readSingle-color"), getSingleColors);
colorsRoutes.put("/:id", authorize("update-color"), updateSingleColors);
colorsRoutes.patch("/:id", authorize("delete-attribute"), deleteSingleColors);

module.exports = colorsRoutes;
