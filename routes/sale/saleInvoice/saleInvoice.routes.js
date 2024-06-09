const express = require("express");
const {
  createSingleSaleInvoice,
  getAllSaleInvoice,
  getSingleSaleInvoice,
  updateSaleStatus,
} = require("./saleInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const saleInvoiceRoutes = express.Router();

saleInvoiceRoutes.post(
  "/",
  authorize("create-saleInvoice"),
  createSingleSaleInvoice
);
saleInvoiceRoutes.get("/", authorize("readAll-saleInvoice"), getAllSaleInvoice);
saleInvoiceRoutes.get(
  "/:id",
  authorize("readSingle-saleInvoice"),
  getSingleSaleInvoice
);
saleInvoiceRoutes.patch(
  "/order",
  authorize("update-saleInvoice"),
  updateSaleStatus
);

module.exports = saleInvoiceRoutes;
