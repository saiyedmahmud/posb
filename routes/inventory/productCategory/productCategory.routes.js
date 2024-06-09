const express = require("express");
const {
  createSingleProductCategory,
  getAllProductCategory,
  getSingleProductCategory,
  updateSingleProductCategory,
  deleteSingleProductCategory,
} = require("./productCategory.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const productCategoryRoutes = express.Router();

productCategoryRoutes.post(
  "/",
  authorize("create-productCategory"),
  createSingleProductCategory
);
productCategoryRoutes.get(
  "/",
  authorize("readAll-productCategory"),
  getAllProductCategory
);
productCategoryRoutes.get(
  "/:id",
  authorize("readSingle-productCategory"),
  getSingleProductCategory
);
productCategoryRoutes.put(
  "/:id",
  authorize("update-productCategory"),
  updateSingleProductCategory
);
productCategoryRoutes.patch(
  "/:id",
  authorize("delete-productCategory"),
  deleteSingleProductCategory
);

module.exports = productCategoryRoutes;
