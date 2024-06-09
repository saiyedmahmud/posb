const express = require("express");
const {
  createSingleAttributeValue,
  getAllAttributeValue,
  getSingleAttributeValue,
  updateSingleAttributeValue,
  deleteSingleAttributeValue,
} = require("./attributeValue.controller");
const authorize = require("../../../utils/authorize"); // authentication middleware

const attributeValueRoutes = express.Router();

attributeValueRoutes.post(
  "/",
  authorize("create-attribute"),
  createSingleAttributeValue
);
attributeValueRoutes.get(
  "/",
  authorize("readAll-attribute"),
  getAllAttributeValue
);
attributeValueRoutes.get(
  "/:id",
  authorize("readSingle-attribute"),
  getSingleAttributeValue
);
attributeValueRoutes.put(
  "/:id",
  authorize("update-attribute"),
  updateSingleAttributeValue
);
attributeValueRoutes.patch(
  "/:id",
  authorize("delete-attribute"),
  deleteSingleAttributeValue
);

module.exports = attributeValueRoutes;
