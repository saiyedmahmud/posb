const express = require("express");
const crypto = require("crypto"); // for generating random names
const multer = require("multer");
const {
  createSingleProduct,
  getAllProduct,
  getSingleProduct,
  updateSingleProduct,
  deleteSingleProduct,
} = require("./product.controllers");
const authorize = require("../../../utils/authorize"); // authentication middleware

const productRoutes = express.Router();
const productImageRoutes = express.Router();

// generate random file name for extra security on naming
const generateFileName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

// store files upload folder in disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "routes/inventory/product/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = generateFileName();
    cb(null, uniqueSuffix + ".jpg");
  },
});
// multer middleware
const upload = multer({ storage: storage });

productRoutes.post(
  "/",
  authorize("create-product"),
  upload.array("images", 1) ? upload.array("images", 1) : undefined,
  createSingleProduct
);
productRoutes.get("/", authorize("readAll-product"), getAllProduct);
productRoutes.get("/:id", authorize("readSingle-product"), getSingleProduct);
productRoutes.put(
  "/:id",
  authorize("update-product"),
  upload.array("images", 1 ? upload.array("images", 1) : undefined),
  updateSingleProduct
);
productRoutes.patch("/:id", authorize("delete-product"), deleteSingleProduct);

// to serve image from disk
productImageRoutes.get("/:id", (req, res) => {
  res.sendFile(__dirname + "/uploads/" + req.params.id, (err) => {
    if (err) {
      res.status(404).send("Not found");
    }
  });
});

module.exports = {productRoutes, productImageRoutes}
