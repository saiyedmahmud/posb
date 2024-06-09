const rateLimit = require("express-rate-limit");
const compression = require("compression");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

/* variables */
// express app instance
const app = express();

// holds all the allowed origins for cors access
let allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:4000",
	"http://localhost:5000",
];

// limit the number of requests from a single IP address
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // Limit each IP to 20 requests per `window` (here, per 15 minutes)
	standardHeaders: false, // Disable rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/* Middleware */
// for compressing the response body
app.use(compression());
// helmet: secure express app by setting various HTTP headers. And serve cross origin resources.
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
// morgan: log requests to console in dev environment
app.use(morgan("dev"));
// allows cors access from allowedOrigins array
app.use(
	cors({
		origin: function (origin, callback) {
			// allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) === -1) {
				let msg =
					"The CORS policy for this site does not " +
					"allow access from the specified Origin.";
				return callback(new Error(msg), false);
			}
			return callback(null, true);
		},
	})
);

// parse requests of content-type - application/json
app.use(express.json({ extended: true }));

const {
	productImageRoutes,
	productRoutes,
} = require("./routes/inventory/product/product.routes");
/* Routes */
app.use(
	"/payment-purchase-invoice",
	require("./routes/purchase/paymentPurchaseInvoice/paymentPurchaseInvoice.routes")
);
app.use(
	"/payment-sale-invoice",
	require("./routes/sale/paymentSaleInvoice/paymentSaleInvoice.routes")
);
app.use(
	"/purchase-invoice",
	require("./routes/purchase/purchaseInvoice/purchaseInvoice.routes")
);
app.use(
	"/return-purchase-invoice",
	require("./routes/purchase/returnPurchaseInvoice/returnPurchaseInvoice.routes")
);
app.use(
	"/role-permission",
	require("./routes/hr/rolePermission/rolePermission.routes")
);
app.use(
	"/sale-invoice",
	require("./routes/sale/saleInvoice/saleInvoice.routes")
);
app.use(
	"/return-sale-invoice",
	require("./routes/sale/returnSaleInvoice/returnSaleInvoice.routes")
);
app.use(
	"/transaction",
	require("./routes/accounting/transaction/transaction.routes")
);
app.use("/permission", require("./routes/hr/permission/permission.routes"));
app.use("/dashboard", require("./routes/dashboard/dashboard.routes"));
app.use("/user", limiter, require("./routes/user/user.routes"));
app.use("/customer", require("./routes/sale/customer/customer.routes"));
app.use("/supplier", require("./routes/purchase/supplier/supplier.routes"));
app.use("/product", productRoutes);
app.use("/product-image", productImageRoutes);
app.use("/role", require("./routes/hr/role/role.routes"));
app.use("/designation", require("./routes/hr/designation/designation.routes"));
app.use(
	"/product-category",
	require("./routes/inventory/productCategory/productCategory.routes")
);
app.use("/account", require("./routes/accounting/account/account.routes"));
app.use("/setting", require("./routes/setting/setting.routes"));
app.use("/email", require("./routes/email/email.routes"));
app.use(
	"/product-sub-category",
	require("./routes/inventory/productSubCategory/productSubCategory.routes")
);
app.use(
	"/product-brand",
	require("./routes/inventory/productBrand/productBrand.routes")
);
app.use("/product-color", require("./routes/inventory/colors/colors.routes"));
app.use(
	"/adjust-inventory",
	require("./routes/inventory/AdjustInventory/adjust.routes")
);
app.use(
	"/product-attribute",
	require("./routes/inventory/attributes/attribute.routes")
);
app.use(
	"/product-attribute-value",
	require("./routes/inventory/attributeValue/attributeValue.routes")
);
app.use("/product-colors", require("./routes/inventory/colors/colors.routes"));
app.use("/product-meta", require("./routes/inventory/meta/meta.routes"));
app.use("/product-vat", require("./routes/productVat/productVat.routes"));

module.exports = app;
