const prisma = require("../../utils/prisma");

const createProductVat = async (req, res) => {
  try {
    if(req.query.query === "deletemany"){
      const deletedProductVat = await prisma.productVat.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      return res.json(deletedProductVat);
    }else if(req.query.query === "createmany") {
      const createdVat = await prisma.productVat.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdVat);
    }else{
      const createdProductVat = await prisma.productVat.create({
        data: {
          title: req.body.title,
          percentage: parseFloat(req.body.percentage),
        },
      });
      return res.status(201).json(createdProductVat);
    }
  }catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

const productVatDetails = async (req, res) => {
  try {

    const totalVatGiven = await prisma.transaction.findMany({
      where: {
        AND: [
          {
            debitId: 16,
          },
          {
            creditId: 1,
          },
        ],
      },
    });

    const totalVatReceived = await prisma.transaction.findMany({
      where: {
        AND: [
          {
            debitId: 1,
          },
          {
            creditId: 15,
          }
        ],
      }
    });

    //calculate total vat balance
    const totalVatBalance = totalVatReceived.reduce((acc, item) => {
      return acc + item.amount;
    },0);

    //calculate total vat balance
    const totalVatBalanceGiven = totalVatGiven.reduce((acc, item) => {
      return acc + item.amount;
    },0);

    const totalVat = totalVatBalance - totalVatBalanceGiven;

    return res.status(200).json({totalVatGiven:totalVatBalanceGiven, totalVatReceived:totalVatBalance,totalVat});

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

const getAllProductVat = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all attribute
      const getAllProductVat = await prisma.productVat.findMany({
        orderBy: {
          id: "asc",
        },
      });
      return res.status(200).json(getAllProductVat);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "info") {
    // get all attribute info
    const aggregations = await prisma.productVat.aggregate({
      _count: {
        id: true,
      },
      where: {
        status: true,
      },
    });
    return res.status(200).json(aggregations);
  }else if(req.query.status === "true"){
    try {
      const getAllProductVat = await prisma.productVat.findMany({
        where: {
          status: true,
        },
        orderBy: {
          id: "asc",
        },
      });

      const aggregations = await prisma.productVat.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({getAllProductVat, totalProductVat : aggregations._count.id});
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: error.message });
    }
  }else if(req.query.status === "false"){
    try {
      const getAllProductVat = await prisma.productVat.findMany({
        where: {
          status: false,
        },
        orderBy: {
          id: "asc",
        },
      });
      const aggregations = await prisma.productVat.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllProductVat, totalProductVat : aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const updateSingleProductVat = async (req, res) => {
  try {
    const updatedProductVat = await prisma.productVat.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: req.body
    });
    return res.status(200).json(updatedProductVat);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleProductVat = async (req, res) => {
  try {
    const deletedProductVat = await prisma.productVat.update({
      where: {
        id: parseInt(req.params.id),
      },
      data:{
        status:req.body.status
      }
    });
    return res.status(200).json(deletedProductVat);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createProductVat,
  productVatDetails,
  getAllProductVat,
  updateSingleProductVat,
  deleteSingleProductVat
}