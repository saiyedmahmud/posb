const express = require("express");
const {
  createSingleReturnSaleInvoice,
  getAllReturnSaleInvoice,
  getSingleReturnSaleInvoice,
  updateSingleReturnSaleInvoice,
  deleteSingleReturnSaleInvoice,
} = require("./returnSaleInvoice.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const returnSaleInvoiceRoutes = express.Router();

returnSaleInvoiceRoutes.post(
  "/",
  authorize("create-returnSaleInvoice"),
  createSingleReturnSaleInvoice
);
returnSaleInvoiceRoutes.get(
  "/",
  authorize("readAll-returnSaleInvoice"),
  getAllReturnSaleInvoice
);
returnSaleInvoiceRoutes.get(
  "/:id",
  authorize("readSingle-returnSaleInvoice"),
  getSingleReturnSaleInvoice
);
returnSaleInvoiceRoutes.patch(
  "/:id",
  authorize("delete-returnSaleInvoice"),
  deleteSingleReturnSaleInvoice
);

module.exports = returnSaleInvoiceRoutes;
