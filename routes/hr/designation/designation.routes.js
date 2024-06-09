const express = require("express");
const {
  createSingleDesignation,
  getAllDesignation,
  getSingleDesignation,
  updateSingleDesignation,
  deleteSingleDesignation,
} = require("./designation.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const designationRoutes = express.Router();

designationRoutes.post(
  "/",
  authorize("create-designation"),
  createSingleDesignation
);
designationRoutes.get("/", authorize("readAll-designation"), getAllDesignation);
designationRoutes.get(
  "/:id",
  authorize("readSingle-designation"),
  getSingleDesignation
);
designationRoutes.put(
  "/:id",
  authorize("update-designation"),
  updateSingleDesignation
);
designationRoutes.patch(
  "/:id",
  authorize("delete-designation"),
  deleteSingleDesignation
);

module.exports = designationRoutes;
