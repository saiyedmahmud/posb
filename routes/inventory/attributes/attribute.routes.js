const express = require("express");
const {
  createSingleAttribute,
  getSingleAttribute,
  getAllAttribute,
  updateSingleAttribute,
  deleteSingleAttribute,
} = require("../attributes/attribute.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const attributeRoutes = express.Router();

attributeRoutes.post("/", authorize("create-attribute"), createSingleAttribute);
attributeRoutes.get("/", authorize("readAll-attribute"), getAllAttribute);
attributeRoutes.get(
  "/:id",
  authorize("readSingle-attribute"),
  getSingleAttribute
);
attributeRoutes.put(
  "/:id",
  authorize("update-attribute"),
  updateSingleAttribute
);
attributeRoutes.patch(
  "/:id",
  authorize("delete-attribute"),
  deleteSingleAttribute
);

module.exports = attributeRoutes;
