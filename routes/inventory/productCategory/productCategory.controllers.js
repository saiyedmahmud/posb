const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;
const createSingleProductCategory = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product_category at once
      const deletedProductCategory = await prisma.productCategory.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      return res.status(200).json(deletedProductCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many product_category from an array of objects
      const createdProductCategory = await prisma.productCategory.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdProductCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      // create single product_category from an object
      const createdProductCategory = await prisma.productCategory.create({
        data: {
          name: req.body.name,
        },
      });
      return res.status(201).json(createdProductCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getAllProductCategory = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all product_category
      const getAllProductCategory = await prisma.productCategory.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          productSubCategory: {
            include: {
              product: true,
            },
          },
        },
      });
      return res.status(200).json(getAllProductCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if(req.query.query === "info"){
    try {
      const aggregations = await prisma.productCategory.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json(aggregations);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }else if(req.query.status === "true"){
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_category paginated
      const getAllProductCategory = await prisma.productCategory.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregations = await prisma.productCategory.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({getAllProductCategory,totalProductCategory:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }else if(req.query.status === "false"){
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_category paginated
      const getAllProductCategory = await prisma.productCategory.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      const aggregations = await prisma.productCategory.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllProductCategory,totalProductCategory:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleProductCategory = async (req, res) => {
  try {
    const singleProductCategory = await prisma.productCategory.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        productSubCategory: {
          include: {
            product: true,
          },
        },
      },
    });

    await Promise.all(
      singleProductCategory.productSubCategory.map(async (sub_category) => {
        await Promise.all(
          sub_category.product.map(async (product) => {
            if (product.thumbnailImage) {
              product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
            }
          })
        );
      })
    );
    return res.status(200).json(singleProductCategory);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleProductCategory = async (req, res) => {
  try {
    const updatedProductCategory = await prisma.productCategory.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.status(200).json(updatedProductCategory);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleProductCategory = async (req, res) => {
  try {
    const deletedProductCategory = await prisma.productCategory.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      }
    });
    return res.status(200).json(deletedProductCategory);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleProductCategory,
  getAllProductCategory,
  getSingleProductCategory,
  updateSingleProductCategory,
  deleteSingleProductCategory,
};
