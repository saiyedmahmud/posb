const express = require("express");
const {
  createSinglePurchaseInvoice,
  getAllPurchaseInvoice,
  getSinglePurchaseInvoice,
} = require("./purchaseInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const purchaseInvoiceRoutes = express.Router();

purchaseInvoiceRoutes.post(
  "/",
  authorize("create-purchaseInvoice"),
  createSinglePurchaseInvoice
);
purchaseInvoiceRoutes.get(
  "/",
  authorize("readAll-purchaseInvoice"),
  getAllPurchaseInvoice
);
purchaseInvoiceRoutes.get(
  "/:id",
  authorize("readSingle-purchaseInvoice"),
  getSinglePurchaseInvoice
);

module.exports = purchaseInvoiceRoutes;
