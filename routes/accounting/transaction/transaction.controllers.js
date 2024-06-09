const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleTransaction = async (req, res) => {
  try {
    // convert all incoming data to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    const createdTransaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        debit: {
          connect: {
            id: Number(req.body.debitId),
          },
        },
        credit: {
          connect: {
            id: Number(req.body.creditId),
          },
        },
        particulars: req.body.particulars,
        amount: parseFloat(req.body.amount),
      },
    });
    return res.status(200).json(createdTransaction);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getAllTransaction = async (req, res) => {
  if (req.query.query === "info") {
    const aggregations = await prisma.transaction.aggregate({
      where: {
        status: true,
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });
    return res.status(200).json(aggregations);
  } else if (req.query.query === "all") {
    const allTransaction = await prisma.transaction.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
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
    return res.status(200).json(allTransaction);
  } else if (req.query.query === "inactive") {
    const { skip, limit } = getPagination(req.query);
    try {
      const [aggregations, allTransaction] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.transaction.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            amount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: false,
          },
        }),
        // get transaction paginated and by start and end date
        prisma.transaction.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: false,
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
        }),
      ]);
      return res.status(200).json({ aggregations, allTransaction });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "search") {
    try {
      const allTransaction = await prisma.transaction.findMany({
        where: {
          OR: [
            {
              id: {
                equals: Number(req.query.transaction),
              },
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        include: {
          credit: true,
          debit: true,
        },
      });

      return res.status(200).json(allTransaction);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const [aggregations, allTransaction] = await prisma.$transaction([
        // get info of selected parameter data
        prisma.transaction.aggregate({
          _count: {
            id: true,
          },
          _sum: {
            amount: true,
          },
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: true,
          },
        }),
        // get transaction paginated and by start and end date
        prisma.transaction.findMany({
          orderBy: [
            {
              id: "desc",
            },
          ],
          skip: Number(skip),
          take: Number(limit),
          where: {
            date: {
              gte: new Date(req.query.startdate),
              lte: new Date(req.query.enddate),
            },
            status: true,
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
        }),
      ]);
      return res.status(200).json({ aggregations, allTransaction });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleTransaction = async (req, res) => {
  try {
    const singleTransaction = await prisma.transaction.findUnique({
      where: {
        id: Number(req.params.id),
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

    if (!singleTransaction)
      return res.status(400).json({ message: "Transaction not found" });
    return res.status(200).json(singleTransaction);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// TODO: update account as per transaction
const updateSingleTransaction = async (req, res) => {
  try {
    //find the transaction by id if not found return error
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    if (!transaction)
      return res.status(400).json({ message: "Transaction not found" });

    const date = new Date(req.body.date).toISOString().split("T")[0];
    const updatedTransaction = await prisma.transaction.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        date: new Date(date),
        particulars: req.body.particulars,
        type: "transaction",
        relatedId: 0,
        amount: parseFloat(req.body.amount),
      },
    });

    if (!updatedTransaction)
      return res.status(400).json({ message: "Transaction update failed" });

    return res
      .status(200)
      .json({ message: "Transaction updated successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// delete and update account as per transaction
const deleteSingleTransaction = async (req, res) => {
  try {
    //find the transaction by id if not found return error
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
    if (!transaction)
      return res.status(400).json({ message: "Transaction not found" });

    const deletedTransaction = await prisma.transaction.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });

    if (!deletedTransaction)
      return res.status(400).json({ message: "Transaction delete failed" });

    return res
      .status(200)
      .json({ message: "Transaction deleted successfully" });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleTransaction,
  getAllTransaction,
  getSingleTransaction,
  updateSingleTransaction,
  deleteSingleTransaction,
};
