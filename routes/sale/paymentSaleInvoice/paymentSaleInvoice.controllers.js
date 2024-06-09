const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSinglePaymentSaleInvoice = async (req, res) => {
  try {
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // received paid amount against sale invoice using a transaction
    const transaction1 = await prisma.transaction.create({
      data: {
        date: new Date(date),
        debitId: 1,
        creditId: 4,
        amount: parseFloat(req.body.amount),
        particulars: `Received payment of Sale Invoice #${req.body.saleInvoiceNo}`,
        type: "sale",
        relatedId: parseInt(req.body.saleInvoiceNo),
      },
    });
    // discount given using a transaction
    let transaction2;
    if (req.body.discount > 0) {
      transaction2 = await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 14,
          creditId: 4,
          amount: parseFloat(req.body.discount),
          particulars: `Discount given of Sale Invoice #${req.body.saleInvoiceNo}`,
          type: "sale",
          relatedId: parseInt(req.body.saleInvoiceNo),
        },
      });
    }
    // decrease sale invoice profit by discount value
    await prisma.saleInvoice.update({
      where: {
        id: parseInt(req.body.saleInvoiceNo),
      },
      data: {
        profit: {
          decrement: parseFloat(req.body.discount),
        },
      },
    });
    res.status(200).json({ transaction1, transaction2 });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAllPaymentSaleInvoice = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allPaymentSaleInvoice = await prisma.transaction.findMany({
        where: {
          type: "sale",
        },
        orderBy: {
          id: "desc",
        },
      });
      return res.status(200).json(allPaymentSaleInvoice);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "info") {
    const aggregations = await prisma.transaction.aggregate({
      where: {
        type: "sale",
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
      const getAllPaymentSaleInvoice = await prisma.transaction.findMany({
        where: {
          type: "sale",
        },
        orderBy: {
          id: "desc",
        },
        skip: Number(skip),
        take: Number(limit),
      });
      const aggregations = await prisma.transaction.aggregate({
        where: {
          type: "sale",
        },
        _count: {
          id: true,
        },
        _sum: {
          amount: true,
        },
      });
      return res.status(200).json({getAllPaymentSaleInvoice,totalPaymentSaleInvoice: aggregations._count.id, totalAmount: aggregations._sum.amount });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

module.exports = {
  createSinglePaymentSaleInvoice,
  getAllPaymentSaleInvoice,
};
