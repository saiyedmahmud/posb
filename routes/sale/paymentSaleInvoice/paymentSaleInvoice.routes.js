const express = require("express");
const {
  createSinglePaymentSaleInvoice,
  getAllPaymentSaleInvoice,
} = require("./paymentSaleInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const paymentSaleInvoiceRoutes = express.Router();

paymentSaleInvoiceRoutes.post(
  "/",
  authorize("create-paymentSaleInvoice"),
  createSinglePaymentSaleInvoice
);
paymentSaleInvoiceRoutes.get(
  "/",
  authorize("readAll-paymentSaleInvoice"),
  getAllPaymentSaleInvoice
);

module.exports = paymentSaleInvoiceRoutes;
