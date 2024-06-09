const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleReturnPurchaseInvoice = async (req, res) => {
  // calculate total purchase price
  let totalPurchasePrice = 0;
  req.body.returnPurchaseInvoiceProduct.forEach((item) => {
    totalPurchasePrice +=
      parseFloat(item.productPurchasePrice) *
      parseFloat(item.productQuantity);
  });
  try {
    // ============ DUE AMOUNT CALCULATION START==============================================
    // get single purchase invoice information with products
    const singlePurchaseInvoice = await prisma.purchaseInvoice.findUnique({
      where: {
        id: Number(req.body.purchaseInvoiceId),
      },
    });
    // transactions of the paid amount
    const transactions2 = await prisma.transaction.findMany({
      where: {
        type: "purchase",
        relatedId: Number(req.body.purchaseInvoiceId),
        OR: [
          {
            creditId: 1,
          },
          {
            creditId: 2,
          },
        ],
      },
    });
    // transactions of the discount earned amount
    const transactions3 = await prisma.transaction.findMany({
      where: {
        type: "purchase",
        relatedId: Number(req.body.purchaseInvoiceId),
        creditId: 13,
      },
    });
    // transactions of the return purchase invoice's amount
    const transactions4 = await prisma.transaction.findMany({
      where: {
        type: "purchase_return",
        relatedId: Number(req.body.purchaseInvoiceId),
        OR: [
          {
            debitId: 1,
          },
          {
            debitId: 2,
          },
        ],
      },
    });
    // get return purchase invoice information with products of this purchase invoice
    const returnPurchaseInvoice = await prisma.returnPurchaseInvoice.findMany({
      where: {
        purchaseInvoiceId: Number(req.body.purchaseInvoiceId),
      },
      include: {
        returnPurchaseInvoiceProduct: {
          include: {
            product: true,
          },
        },
      },
    });
    // sum of total paid amount
    const totalPaidAmount = transactions2.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // sum of total discount earned amount
    const totalDiscountAmount = transactions3.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // sum of total return purchase invoice amount
    const paidAmountReturn = transactions4.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );
    // sum total amount of all return purchase invoice related to this purchase invoice
    const totalReturnAmount = returnPurchaseInvoice.reduce(
      (acc, item) => acc + item.totalAmount,
      0
    );

    const dueAmount =
      singlePurchaseInvoice.totalAmount -
      singlePurchaseInvoice.discount -
      totalPaidAmount -
      totalDiscountAmount -
      totalReturnAmount +
      paidAmountReturn;
    // ============ DUE AMOUNT CALCULATION END===============================================
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // create return purchase invoice
    const createdReturnPurchaseInvoice =
      await prisma.returnPurchaseInvoice.create({
        data: {
          date: new Date(date),
          totalAmount: totalPurchasePrice,
          purchaseInvoice: {
            connect: {
              id: Number(req.body.purchaseInvoiceId),
            },
          },
          note: req.body.note,
          // map and save all products from request body array of products to database
          returnPurchaseInvoiceProduct: {
            create: req.body.returnPurchaseInvoiceProduct.map((product) => ({
              product: {
                connect: {
                  id: Number(product.productId),
                },
              },
              productQuantity: Number(product.productQuantity),
              productPurchasePrice: parseFloat(
                product.productPurchasePrice
              ),
            })),
          },
        },
      });

    // receive payment from supplier on return purchase transaction create
    if (dueAmount >= totalPurchasePrice) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 5,
          creditId: 3,
          amount: parseFloat(totalPurchasePrice),
          particulars: `Account payable (due) reduced on Purchase return invoice #${createdReturnPurchaseInvoice.id} of purchase invoice #${req.body.purchaseInvoiceId}`,
          type: "purchase_return",
          relatedId: Number(req.body.purchaseInvoiceId),
        },
      });
    }
    if (dueAmount < totalPurchasePrice) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 5,
          creditId: 3,
          amount: parseFloat(dueAmount),
          particulars: `Account payable (due) reduced on Purchase return invoice #${createdReturnPurchaseInvoice.id} of purchase invoice #${req.body.purchaseInvoiceId}`,
          type: "purchase_return",
          relatedId: Number(req.body.purchaseInvoiceId),
        },
      });
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 1,
          creditId: 3,
          amount: parseFloat(totalPurchasePrice - dueAmount),
          particulars: `Cash receive on Purchase return invoice #${createdReturnPurchaseInvoice.id} of purchase invoice #${req.body.purchaseInvoiceId}`,
          type: "purchase_return",
          relatedId: Number(req.body.purchaseInvoiceId),
        },
      });
    }
    // iterate through all products of this return purchase invoice and less the product quantity,
    req.body.returnPurchaseInvoiceProduct.forEach(async (item) => {
      await prisma.product.update({
        where: {
          id: Number(item.productId),
        },
        data: {
          productQuantity: {
            decrement: Number(item.productQuantity),
          },
        },
      });
    });
    return res.status(200).json({
      createdReturnPurchaseInvoice,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
const getAllReturnPurchaseInvoice = async (req, res) => {
  if (req.query.query === "info") {
    // get purchase invoice info
    const aggregations = await prisma.returnPurchaseInvoice.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    });
    return res.status(200).json(aggregations);
  } else if (req.query.query === "all") {
    try {
      // get all purchase invoice
      const allPurchaseInvoice = await prisma.returnPurchaseInvoice.findMany({
        include: {
          purchaseInvoice: true,
        },
      });
      return res.status(200).json(allPurchaseInvoice);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "group") {
    try {
      // get all purchase invoice
      const allPurchaseInvoice = await prisma.returnPurchaseInvoice.groupBy({
        orderBy: {
          date: "asc",
        },
        by: ["date"],
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
      });
      return res.status(200).json(allPurchaseInvoice);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const [aggregations, allPurchaseInvoice] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.returnPurchaseInvoice.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            totalAmount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: false,
          },
        }),
        // get returnPurchaseInvoice paginated and by start and end date
        prisma.returnPurchaseInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            purchaseInvoice: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: false,
          },
        }),
      ]);
      return res.status(200).json({ aggregations, allPurchaseInvoice });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get purchase invoice with pagination and info
      const [aggregations, allPurchaseInvoice] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.returnPurchaseInvoice.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            totalAmount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: true,
          },
        }),
        // get returnPurchaseInvoice paginated and by start and end date
        prisma.returnPurchaseInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            purchaseInvoice: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: true,
          },
        }),
      ]);
      return res.status(200).json({ aggregations, allPurchaseInvoice });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleReturnPurchaseInvoice = async (req, res) => {
  try {
    const singleProduct = await prisma.returnPurchaseInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        returnPurchaseInvoiceProduct: {
          include: {
            product: true,
          },
        },
        purchaseInvoice: true,
      },
    });
    return res.status(200).json(singleProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleReturnPurchaseInvoice = async (req, res) => {
  try {
    const updatedProduct = await prisma.returnPurchaseInvoice.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: req.body.name,
        quantity: Number(req.body.quantity),
        purchasePrice: Number(req.body.purchasePrice),
        salePrice: Number(req.body.salePrice),
        note: req.body.note,
      },
    });
    return res.status(200).json(updatedProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// on delete purchase invoice, decrease product quantity, supplier due amount decrease, transaction create
const deleteSingleReturnPurchaseInvoice = async (req, res) => {
  try {
    // get purchase invoice details
    const returnPurchaseInvoice = await prisma.returnPurchaseInvoice.findUnique(
      {
        where: {
          id: Number(req.params.id),
        },
        include: {
          returnPurchaseInvoiceProduct: {
            include: {
              product: true,
            },
          },
          supplier: true,
        },
      }
    );
    // product quantity decrease
    returnPurchaseInvoice.returnPurchaseInvoiceProduct.forEach(async (item) => {
      await prisma.product.update({
        where: {
          id: Number(item.productId),
        },
        data: {
          productQuantity: {
            decrement: Number(item.productQuantity),
          },
        },
      });
    });
    // all operations in one transaction
    const [deletePurchaseInvoice, supplier, transaction] =
      await prisma.$transaction([
        // purchase invoice delete
        prisma.returnPurchaseInvoice.update({
          where: {
            id: Number(req.params.id),
          },
          data: {
            status: req.body.status,
          },
        }),
      ]);
    return res.status(200).json({
      deletePurchaseInvoice,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleReturnPurchaseInvoice,
  getAllReturnPurchaseInvoice,
  getSingleReturnPurchaseInvoice,
  updateSingleReturnPurchaseInvoice,
  deleteSingleReturnPurchaseInvoice,
};
