const adjustInventoryRoutes = require("express").Router();

const { createAdjustInventory } = require("./adjust.controller");
const authorize = require("../../../utils/authorize");

adjustInventoryRoutes.post(
  "/",
  authorize("create-adjust"),
  createAdjustInventory
);

module.exports = adjustInventoryRoutes;
