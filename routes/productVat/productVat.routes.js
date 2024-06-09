const express = require('express');
const productVatRoutes = express.Router();
const {createProductVat,
  productVatDetails,
  getAllProductVat,
  updateSingleProductVat,
  deleteSingleProductVat
} = require('./productVat.controller');
const authorize = require("../../utils/authorize");

productVatRoutes.post('/',authorize("create-vat"), createProductVat);
productVatRoutes.get('/statement',authorize("readSingle-vat"), productVatDetails);
productVatRoutes.get("/",authorize("readAll-vat"),getAllProductVat);
productVatRoutes.put("/:id",authorize("update-vat"),updateSingleProductVat)
productVatRoutes.patch("/:id",authorize("delete-vat"),deleteSingleProductVat)

module.exports = productVatRoutes;