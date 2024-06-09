const express = require("express");
const {
  createSingleReturnPurchaseInvoice,
  getAllReturnPurchaseInvoice,
  getSingleReturnPurchaseInvoice,
  updateSingleReturnPurchaseInvoice,
  deleteSingleReturnPurchaseInvoice,
} = require("./returnPurchaseInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const returnPurchaseInvoiceRoutes = express.Router();

returnPurchaseInvoiceRoutes.post(
  "/",
  authorize("create-returnPurchaseInvoice"),
  createSingleReturnPurchaseInvoice
);
returnPurchaseInvoiceRoutes.get(
  "/",
  authorize("readAll-returnPurchaseInvoice"),
  getAllReturnPurchaseInvoice
);
returnPurchaseInvoiceRoutes.get(
  "/:id",
  authorize("readSingle-returnPurchaseInvoice"),
  getSingleReturnPurchaseInvoice
);
// returnPurchaseInvoiceRoutes.put("/:id", authorize("updatePurchaseInvoice"), updateSinglePurchaseInvoice); // purchase invoice is not updatable
returnPurchaseInvoiceRoutes.patch(
  "/:id",
  authorize("delete-returnPurchaseInvoice"),
  deleteSingleReturnPurchaseInvoice
);

module.exports = returnPurchaseInvoiceRoutes;
