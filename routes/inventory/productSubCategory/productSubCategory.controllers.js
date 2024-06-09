const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;

const createSingleProductSubCategory = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product_sub_category at once
      const deletedProductSubCategory =
        await prisma.productSubCategory.deleteMany({
          where: {
            id: {
              in: req.body.map((id) => parseInt(id)),
            },
          },
        });
      return res.status(200).json(deletedProductSubCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many product_sub_category from an array of objects
      const createdProductSubCategory =
        await prisma.productSubCategory.createMany({
          data: req.body,
          skipDuplicates: true,
        });
      return res.status(201).json(createdProductSubCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      // create single product_category from an object
      const createdProductSubCategory =
        await prisma.productSubCategory.create({
          data: {
            name: req.body.name,
            productCategory:{
              connect:{
                id:parseInt(req.body.productCategoryId)
              },
            }
          },
        });
      return res.status(201).json(createdProductSubCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getAllProductSubCategory = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all product_sub_category
      const getAllProductSubCategory =
        await prisma.productSubCategory.findMany({
          orderBy: {
            id: "asc",
          },
          include: {
            product: true,
          },
        });
      // attach thumbnail_image_url to product_sub_category
      await Promise.all(
        getAllProductSubCategory.map(async (productSubCategory) => {
          await Promise.all(
            productSubCategory.product.map(async (product) => {
              product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
            })
          );
        })
      );
      return res.status(200).json(getAllProductSubCategory);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }else if(req.query.query === "info"){
    try {
      const aggregations = await prisma.productSubCategory.aggregate({
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
  } else if(req.query.status === "true"){
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_sub_category paginated
      const getAllProductSubCategory =
        await prisma.productSubCategory.findMany({
          orderBy: {
            id: "asc",
          },
          include: {
            product: true,
          },
          where:{
            status: true
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });
      // attach thumbnail_image_url to product_sub_category
      await Promise.all(
        getAllProductSubCategory.map(async (productSubCategory) => {
          await Promise.all(
            productSubCategory.product.map(async (product) => {
              product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
            })
          );
        })
      );

      const aggregations = await prisma.productSubCategory.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({getAllProductSubCategory,totalProductSubCategory:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if(req.query.status === "false"){
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_sub_category paginated
      const getAllProductSubCategory =
        await prisma.productSubCategory.findMany({
          orderBy: {
            id: "asc",
          },
          include: {
            product: true,
          },
          where:{
            status: false
          },
          skip: parseInt(skip),
          take: parseInt(limit),
        });
      // attach thumbnail_image_url to product_sub_category
      await Promise.all(
        getAllProductSubCategory.map(async (productSubCategory) => {
          await Promise.all(
            productSubCategory.product.map(async (product) => {
              product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
            })
          );
        })
      );
      const aggregations = await prisma.productSubCategory.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllProductSubCategory,totalProductSubCategory:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleProductSubCategory = async (req, res) => {
  try {
    const singleProductSubCategory =
      await prisma.productSubCategory.findUnique({
        where: {
          id: parseInt(req.params.id),
        },
        include: {
          product: true,
        },
      });
    // attach thumbnail_image_url to product_sub_category

    await Promise.all(
      singleProductSubCategory.product.map(async (product) => {
        product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
      })
    );

    return res.status(200).json(singleProductSubCategory);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleProductSubCategory = async (req, res) => {
  try {
    const updatedProductSubCategory = await prisma.productSubCategory.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.status(200).json(updatedProductSubCategory);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleProductSubCategory = async (req, res) => {
  try {
    const deletedProductCategory = await prisma.productSubCategory.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(deletedProductCategory);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleProductSubCategory,
  getAllProductSubCategory,
  getSingleProductSubCategory,
  updateSingleProductSubCategory,
  deleteSingleProductSubCategory,
};
