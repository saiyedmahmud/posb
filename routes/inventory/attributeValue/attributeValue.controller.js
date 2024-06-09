const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleAttributeValue = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many attributeValue at once
      const deletedAttributeValue = await prisma.productAttributeValue.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      return res.status(200).json(deletedAttributeValue);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many attribute from an array of objects
      const createdAttributeValue =
        await prisma.productAttributeValue.createMany({
          data: req.body,
          skipDuplicates: true,
        });
      return res.status(201).json(createdAttributeValue);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      // create single attribute from an object
      const createdAttributeValue = await prisma.productAttributeValue.create({
        data: {
          productAttribute:{
            connect:{
              id:req.body.productAttributeId
            }
          },
          name: req.body.name,
        },
      });
      return res.status(201).json(createdAttributeValue);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getAllAttributeValue = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all attribute
      const allAttributeValue = await prisma.productAttributeValue.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          productAttribute: {
            select: {
              name: true,
            },
          },
        },
      });
      return res.status(200).json(allAttributeValue);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "info") {
    // get all attribute info
    const aggregations = await prisma.productAttributeValue.aggregate({
      _count: {
        id: true,
      },
      where: {
        status: true,
      },
    });
    return res.status(200).json(aggregations);
  } else if (req.query.status === "false") {
    try {
      const { skip, limit } = getPagination(req.query);
      // get all attribute
      const getAllAttributeValue = await prisma.productAttributeValue.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregations = await prisma.productAttributeValue.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllAttributeValue,totalAttributeValue:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all attribute paginated
      const getAllAttributeValue = await prisma.productAttributeValue.findMany({
        orderBy: {
          id: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        where: {
          status: true,
        },
      });
      const aggregations = await prisma.productAttributeValue.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({getAllAttributeValue,totalAttributeValue:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleAttributeValue = async (req, res) => {
  try {
    const singleAttributeValue = await prisma.productAttributeValue.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(singleAttributeValue);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleAttributeValue = async (req, res) => {
  try {
    const updatedAttributeValue = await prisma.productAttributeValue.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.status(200).json(updatedAttributeValue);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleAttributeValue = async (req, res) => {
  try {
    const deletedAttributeValue = await prisma.productAttributeValue.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(deletedAttributeValue);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleAttributeValue,
  getAllAttributeValue,
  getSingleAttributeValue,
  updateSingleAttributeValue,
  deleteSingleAttributeValue,
};
