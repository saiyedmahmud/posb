const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleReturnSaleInvoice = async (req, res) => {
  // calculate total sale price
  let totalSalePrice = 0;
  req.body.returnSaleInvoiceProduct.forEach((item) => {
    totalSalePrice +=
      parseFloat(item.productSalePrice) * parseFloat(item.productQuantity);
  });
  // get all product asynchronously
  const allProduct = await Promise.all(
    req.body.returnSaleInvoiceProduct.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });
      return product;
    })
  );
  // iterate over all product and calculate total purchase price
  let totalPurchasePrice = 0;
  req.body.returnSaleInvoiceProduct.forEach((item, index) => {
    totalPurchasePrice +=
      allProduct[index].productPurchasePrice * item.productQuantity;
  });
  try {
    // ==========================START calculate the due amount of sale invoice ==========================
    // calculate the due before return sale invoice creation
    const singleSaleInvoice = await prisma.saleInvoice.findUnique({
      where: {
        id: Number(req.body.saleInvoiceId),
      },
      include: {
        saleInvoiceProduct: {
          include: {
            product: true,
          },
        },
        customer: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    // transactions of the paid amount
    const transactions2 = await prisma.transaction.findMany({
      where: {
        type: "sale",
        relatedId: Number(req.body.saleInvoiceId),
        OR: [
          {
            debitId: 1,
          },
          {
            debitId: 2,
          },
        ],
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    // transaction of the total return amount
    const returnSaleInvoice = await prisma.returnSaleInvoice.findMany({
      where: {
        saleInvoiceId: Number(req.body.saleInvoiceId),
      },
      include: {
        returnSaleInvoiceProduct: {
          include: {
            product: true,
          },
        },
      },
    });
    // calculate the discount given amount at the time of make the payment
    const transactions3 = await prisma.transaction.findMany({
      where: {
        type: "sale",
        relatedId: Number(req.body.saleInvoiceId),
        debitId: 14,
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    // calculate the total amount return back to customer for return sale invoice from transactions
    // transactions of the paid amount
    const transactions4 = await prisma.transaction.findMany({
      where: {
        type: "sale_return",
        relatedId: Number(req.body.saleInvoiceId),
        OR: [
          {
            creditId: 1,
          },
          {
            creditId: 2,
          },
        ],
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    const paidAmountReturn = transactions4.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );

    // sum total amount of all transactions
    const totalPaidAmount = transactions2.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // sum of total discount given amount at the time of make the payment
    const totalDiscountAmount = transactions3.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // check if total transaction amount is equal to totalAmount - discount - return invoice amount
    const totalReturnAmount = returnSaleInvoice.reduce(
      (acc, item) => acc + item.totalAmount,
      0
    );

    const dueAmount =
      singleSaleInvoice.totalAmount -
      singleSaleInvoice.discount -
      totalPaidAmount -
      totalDiscountAmount -
      totalReturnAmount +
      paidAmountReturn;
    // ==========================END calculate the due amount of sale invoice ==========================
    // convert all incoming date to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // create return sale invoice
    const createdReturnSaleInvoice = await prisma.returnSaleInvoice.create({
      data: {
        date: new Date(date),
        totalAmount: totalSalePrice,
        saleInvoice: {
          connect: {
            id: Number(req.body.saleInvoiceId),
          },
        },
        note: req.body.note,
        // map and save all products from request body array of products to database
        returnSaleInvoiceProduct: {
          create: req.body.returnSaleInvoiceProduct.map((product) => ({
            product: {
              connect: {
                id: Number(product.productId),
              },
            },
            productQuantity: Number(product.productQuantity),
            productSalePrice: parseFloat(product.productSalePrice),
          })),
        },
      },
    });

    // return transaction Account Receivable - for due amount
    if (dueAmount >= totalSalePrice) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 8,
          creditId: 4,
          amount: parseFloat(totalSalePrice),
          particulars: `Account Receivable on Sale return invoice #${createdReturnSaleInvoice.id} of sale invoice #${req.body.saleInvoiceId}`,
          type: "sale_return",
          relatedId: Number(req.body.saleInvoiceId),
        },
      });
    }
    // dueAmount is less than total Accounts Receivable - for cash amount
    // two transaction will be created for cash and due adjustment
    // TODO: dynamic credit id like bank, cash, etc
    if (dueAmount < totalSalePrice) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 8,
          creditId: 4,
          amount: parseFloat(dueAmount),
          particulars: `Account Receivable on Sale return invoice #${createdReturnSaleInvoice.id} of sale invoice #${req.body.saleInvoiceId}`,
          type: "sale_return",
          relatedId: Number(req.body.saleInvoiceId),
        },
      });
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 8,
          creditId: 1,
          amount: parseFloat(totalSalePrice - dueAmount),
          particulars: `Cash paid on Sale return invoice #${createdReturnSaleInvoice.id} of sale invoice #${req.body.saleInvoiceId}`,
          type: "sale_return",
          relatedId: Number(req.body.saleInvoiceId),
        },
      });
    }
    // goods received on return sale transaction create
    await prisma.transaction.create({
      data: {
        date: new Date(date),
        debitId: 3,
        creditId: 9,
        amount: parseFloat(totalPurchasePrice),
        particulars: `Cost of sales reduce on Sale return Invoice #${createdReturnSaleInvoice.id} of sale invoice #${req.body.saleInvoiceId}`,
        type: "sale_return",
        relatedId: req.body.saleInvoiceId,
      },
    });
    // iterate through all products of this return sale invoice and increase the product quantity,
    req.body.returnSaleInvoiceProduct.forEach(async (item) => {
      await prisma.product.update({
        where: {
          id: Number(item.productId),
        },
        data: {
          productQuantity: {
            increment: Number(item.productQuantity),
          },
        },
      });
    });
    // decrease sale invoice profit by return sale invoice's calculated profit profit
    const returnSaleInvoiceProfit = totalSalePrice - totalPurchasePrice;
    await prisma.saleInvoice.update({
      where: {
        id: Number(req.body.saleInvoiceId),
      },
      data: {
        profit: {
          decrement: returnSaleInvoiceProfit,
        },
      },
    });
    return res.status(200).json({ createdReturnSaleInvoice });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllReturnSaleInvoice = async (req, res) => {
  if (req.query.query === "info") {
    // get sale invoice info
    const aggregations = await prisma.returnSaleInvoice.aggregate({
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
      // get all sale invoice
      const allSaleInvoice = await prisma.returnSaleInvoice.findMany({
        include: {
          saleInvoice: true,
        },
      });
      return res.status(200).json(allSaleInvoice);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "group") {
    try {
      // get all sale invoice
      const allSaleInvoice = await prisma.returnSaleInvoice.groupBy({
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
      return res.status(200).json(allSaleInvoice);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      const [aggregations, allSaleInvoice] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.returnSaleInvoice.aggregate({
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
        // get returnsaleInvoice paginated and by start and end date
        prisma.returnSaleInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            saleInvoice: true,
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
      return res.status(200).json({ aggregations, allSaleInvoice });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get sale invoice with pagination and info
      const [aggregations, allSaleInvoice] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.returnSaleInvoice.aggregate({
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
        // get returnsaleInvoice paginated and by start and end date
        prisma.returnSaleInvoice.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          include: {
            saleInvoice: true,
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
      return res.status(200).json({ aggregations, allSaleInvoice });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleReturnSaleInvoice = async (req, res) => {
  try {
    const singleProduct = await prisma.returnSaleInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        returnSaleInvoiceProduct: {
          include: {
            product: true,
          },
        },
        saleInvoice: true,
      },
    });
    return res.status(200).json(singleProduct);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleReturnSaleInvoice = async (req, res) => {
  try {
    const updatedProduct = await prisma.returnSaleInvoice.update({
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

// on delete purchase invoice, decrease product quantity, customer due amount decrease, transaction create
const deleteSingleReturnSaleInvoice = async (req, res) => {
  try {
    // get purchase invoice details
    const returnSaleInvoice = await prisma.returnSaleInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        returnSaleInvoiceProduct: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
    // product quantity decrease
    returnSaleInvoice.returnSaleInvoiceProduct.forEach(async (item) => {
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
    const [deleteSaleInvoice] = await prisma.$transaction([
      // purchase invoice delete
      prisma.returnSaleInvoice.update({
        where: {
          id: Number(req.params.id),
        },
        data: {
          status: req.body.status,
        },
      }),
    ]);
    return res.status(200).json({
      deleteSaleInvoice,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleReturnSaleInvoice,
  getAllReturnSaleInvoice,
  getSingleReturnSaleInvoice,
  updateSingleReturnSaleInvoice,
  deleteSingleReturnSaleInvoice,
};
