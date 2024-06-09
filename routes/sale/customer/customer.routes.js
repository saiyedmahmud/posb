const express = require("express");
const {
  customerLogin,
  resetPassword,
  createSingleCustomer,
  getAllCustomer,
  getSingleCustomer,
  updateSingleCustomer,
  deleteSingleCustomer,
  forgotPassword,
} = require("./customer.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const customerRoutes = express.Router();
customerRoutes.post("/login", customerLogin);
customerRoutes.patch(
  "/reset-password/:id",
  authorize("update-profile"),
  resetPassword
);
customerRoutes.patch("/forgot-password", forgotPassword);
customerRoutes.post("/", createSingleCustomer);
customerRoutes.get("/", authorize("readAll-customer"), getAllCustomer);
customerRoutes.get(
  "/:id",
  authorize("readSingle-customer", "read-profile"),
  getSingleCustomer
);
customerRoutes.put("/:id", authorize("update-customer"), updateSingleCustomer);
customerRoutes.patch(
  "/:id",
  authorize("delete-customer", "delete-profile"),
  deleteSingleCustomer
);

module.exports = customerRoutes;
