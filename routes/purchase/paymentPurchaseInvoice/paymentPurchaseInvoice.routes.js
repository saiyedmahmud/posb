const express = require("express");
const {
  createPaymentPurchaseInvoice,
  getAllPaymentPurchaseInvoice,
} = require("./paymentPurchaseInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const paymentSupplierRoutes = express.Router();

paymentSupplierRoutes.post(
  "/",
  authorize("create-paymentPurchaseInvoice"),
  createPaymentPurchaseInvoice
);
paymentSupplierRoutes.get(
  "/",
  authorize("readAll-paymentPurchaseInvoice"),
  getAllPaymentPurchaseInvoice
);

module.exports = paymentSupplierRoutes;
