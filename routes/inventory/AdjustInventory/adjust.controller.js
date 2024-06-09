const prisma = require("../../../utils/prisma");

const createAdjustInventory = async (req, res) => {
  try {
    const adjustType = req.body.adjustType;
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // create purchase invoice
    const createdInvoice = await prisma.adjustInvoice.create({
      data: {
        date: new Date(date),
        adjustType: adjustType,
        note: req.body.note,
        // map and save all products from request body array of products to database
        adjustInvoiceProduct: {
          create: req.body.adjustInvoiceProduct.map((product) => ({
            product: {
              connect: {
                id: parseInt(product.productId),
              },
            },
            productQuantity: Number(product.productQuantity),
          })),
        },
      },
    });
    // iterate through all products of this purchase invoice and add product quantity, update product purchase price to database
    for (const item of req.body.adjustInvoiceProduct) {
      await prisma.product.update({
        where: {
          id: Number(item.productId),
        },
        data: {
          productQuantity: {
            [adjustType]: Number(item.productQuantity),
          },
        },
      });
    }
    return res.status(201).json({
      createdInvoice,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAdjustInventory,
}
