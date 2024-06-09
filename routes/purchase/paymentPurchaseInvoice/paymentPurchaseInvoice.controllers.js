const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

// create a transaction
// pay amount against purchase invoice
// pay amount against supplier : ALL IN ONE TRANSACTION DB QUERY
const createPaymentPurchaseInvoice = async (req, res) => {
  try {
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // paid amount against purchase invoice using a transaction
    const transaction1 = await prisma.transaction.create({
      data: {
        date: new Date(date),
        debitId: 5,
        creditId: 1,
        amount: parseFloat(req.body.amount),
        particulars: `Due pay of Purchase Invoice #${req.body.purchaseInvoiceNo}`,
        type: "purchase",
        relatedId: parseInt(req.body.purchaseInvoiceNo),
      },
    });
    // discount earned using a transaction
    let transaction2;
    if (req.body.discount > 0) {
      transaction2 = await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 5,
          creditId: 13,
          amount: parseFloat(req.body.discount),
          particulars: `Discount earned of Purchase Invoice #${req.body.purchaseInvoiceNo}`,
          type: "purchase",
          related_id: parseInt(req.body.purchaseInvoiceNo),
        },
      });
    }
    return res.status(201).json({ transaction1, transaction2 });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAllPaymentPurchaseInvoice = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allPaymentPurchaseInvoice = await prisma.transaction.findMany({
        where: {
          type: "purchase",
        },
        orderBy: {
          id: "desc",
        },
      });
      return res.status(200).json(allPaymentPurchaseInvoice);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "info") {
    const aggregations = await prisma.transaction.aggregate({
      where: {
        type: "purchase",
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });
    return res.status(200).json(aggregations);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const getAllPaymentPurchaseInvoice = await prisma.transaction.findMany({
        where: {
          type: "purchase",
        },
        orderBy: {
          id: "desc",
        },
        skip: Number(skip),
        take: Number(limit),
      });

      const aggregations = await prisma.transaction.aggregate({
        where: {
          type: "purchase",
        },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });
      return res.status(200).json({getAllPaymentPurchaseInvoice,totalPaymentPurchaseInvoice: aggregations._count.id,totalAmount: aggregations._sum.amount});
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

module.exports = {
  createPaymentPurchaseInvoice,
  getAllPaymentPurchaseInvoice,
};
