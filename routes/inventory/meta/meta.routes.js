const express = require("express");
const {
  createSingleMeta,
  getAllMeta,
  getSingleMeta,
  updateSingleMeta,
  deleteSingleMeta,
} = require("./meta.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const metaRoutes = express.Router();

metaRoutes.post("/", authorize("create-meta"), createSingleMeta);
metaRoutes.get("/", authorize("readAll-meta"), getAllMeta);
metaRoutes.get("/:id", authorize("readSingle-meta"), getSingleMeta);
metaRoutes.put("/:id", authorize("update-meta"), updateSingleMeta);
metaRoutes.patch("/:id", authorize("delete-meta"), deleteSingleMeta);

module.exports = metaRoutes;
