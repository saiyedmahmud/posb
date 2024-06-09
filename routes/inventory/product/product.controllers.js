const {getPagination} = require("../../../utils/query");
require("dotenv").config();
const fs = require("fs");
const prisma = require("../../../utils/prisma");
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST;

const createSingleProduct = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product at once
      const deletedProduct = await prisma.product.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => Number(id)),
          },
        },
      });
      return res.status(200).json(deletedProduct);
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else if (req.query.query === "createmany") {
    try {
      const createdProduct = await prisma.product.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdProduct);
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else {
    try {
      // create one product from an object
      const files = req.files ? req.files : [];
      const createdProduct = await prisma.product.create({
        data: {
          name: req.body.name,
          thumbnailImage: files[0]?.filename ? files[0]?.filename : undefined,
          productSubCategory: req.body.productSubCategoryId
            ? {
              connect: {
                id: Number(req.body.productSubCategoryId),
              },
            }
            : undefined,
          productBrand: req.body.productBrandId
            ? {
              connect: {
                id: Number(req.body.productBrandId),
              },
            }
            : undefined,
          description: req.body.description,
          productColor: {
            create: req.body.colors
              ? req.body.colors?.split(",").map((color) => ({
                color: {
                  connect: {
                    id: Number(color),
                  },
                },
              }))
              : undefined,
          },
          sku: req.body.sku,
          productQuantity: parseInt(req.body.productQuantity),
          productPurchasePrice: parseFloat(req.body.productPurchasePrice),
          productSalePrice: parseFloat(req.body.productSalePrice),
          unitType: req.body.unitType,
          unitMeasurement: parseFloat(req.body.unitMeasurement)
            ? parseFloat(req.body.unitMeasurement)
            : undefined,
          reorderQuantity: parseInt(req.body.reorderQuantity) || undefined,
          status: req.body.status,
          productVat: parseFloat(req.body.productVat) || undefined,
        },
      });

      createdProduct.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${files[0]?.filename}`;
      return res.status(201).json(createdProduct);
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  }
};

const getAllProduct = async (req, res) => {
  if (req.query.query === "all") {
    try {
      const allProduct = await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
        include: {
          productSubCategory: {
            select: {
              name: true,
            },
          },
          reviewRating: {
            select: {
              id: true,
              customer: {
                select: {
                  name: true,
                  id: true,
                },
              },
              createdAt: true,
              review: true,
              rating: true,
            },
          },
          productBrand: true,
        },
      });
      allProduct.forEach(function (product) {
        product.totalRating =
          Object.values(product.reviewRating).reduce(
            (t, {rating}) => t + rating,
            0
          ) / product.reviewRating.length;
      });
      // attach signed url to each product

      await Promise.all(
        allProduct.map(async (product) => {
          if (product.thumbnailImage) {
            product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
          }
        })
      );

      return res.status(200).json(allProduct);
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else if (req.query.query === "info") {
    try {
      const aggregations = await prisma.product.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json(aggregations);
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else if (req.query.query === "search") {
    try {
      const allProduct = await prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: req.query.prod,
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: req.query.prod,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        include: {
          productSubCategory: {
            select: {
              name: true,
            },
          },
          productColor: {
            select: {
              color: true,
            },
          },
          reviewRating: true,
        },
      });

      // attach signed url to each product
      await Promise.all(
        allProduct.map(async (product) => {
          if (product.thumbnailImage) {
            product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
          }
        })
      );

      const restProduct = allProduct.map(
        ({productPurchasePrice, ...product}) => product
      );
      return res.status(200).json(restProduct);
    } catch (error) {
      console.log(error);
      return res.status(500).json({message: error.message});
    }
  } else if (req.query.status === "false") {
    try {
      const {skip, limit} = getPagination(req.query);
      const allProduct = await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
        where: {
          status: false,
        },
        include: {
          productSubCategory: {
            select: {
              name: true,
            },
          },
        },
        skip: Number(skip),
        take: Number(limit),
      });
      // attach signed url to each product
      await Promise.all(
        allProduct.map(async (product) => {
          if (product.thumbnailImage) {
            product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
          }
        })
      );

      const aggregations = await prisma.product.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({
        getAllProduct: allProduct,
        totalProduct: aggregations._count.id,
      });
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else {
    const {skip, limit} = getPagination(req.query);
    try {
      const allProduct = await prisma.product.findMany({
        orderBy: {
          id: "desc",
        },
        where: {
          status: true,
        },
        include: {
          productSubCategory: {
            select: {
              id: true,
              name: true,
            },
          },
          productBrand: {
            select: {
              id: true,
              name: true,
            },
          },
          productColor: {
            select: {
              id: true,
              color: true,
            },
          },
        },
        skip: Number(skip),
        take: Number(limit),
      });
      // attach signed url to each product
      await Promise.all(
        allProduct.map(async (product) => {
          if (product.thumbnailImage) {
            product.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${product.thumbnailImage}`;
          }
        })
      );

      const aggregations = await prisma.product.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({
        getAllProduct: allProduct,
        totalProduct: aggregations._count.id,
      });
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const singleProduct = await prisma.product.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        productColor: {
          select: {
            color: true,
          },
        },
        reviewRating: true,
      },
    });
    if (singleProduct && singleProduct.thumbnailImage) {
      singleProduct.thumbnailImageUrl = `${HOST}:${PORT}/product-image/${singleProduct.thumbnailImage}`;
    }
    return res.status(200).json(singleProduct);
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

const updateSingleProduct = async (req, res) => {
  try {

    if (req.body.productSubCategoryId) {
      req.body.productSubCategoryId = parseInt(req.body.productSubCategoryId);
    }
    if (req.body.productBrandId) {
      req.body.productBrandId = parseInt(req.body.productBrandId);
    }
    if (req.body.productQuantity) {
      req.body.productQuantity = parseInt(req.body.productQuantity);
    }
    if (req.body.productPurchasePrice) {
      req.body.productPurchasePrice = parseFloat(req.body.productPurchasePrice);
    }
    if (req.body.productSalePrice) {
      req.body.productSalePrice = parseFloat(req.body.productSalePrice);
    }
    if (req.body.unitMeasurement) {
      req.body.unitMeasurement = parseFloat(req.body.unitMeasurement);
    }
    if (req.body.reorderQuantity) {
      req.body.reorderQuantity = parseInt(req.body.reorderQuantity);
    }
    if (req.body.productVat) {
      req.body.productVat = parseFloat(req.body.productVat);
    }
    const files = req.files;
    const updateProduct = await prisma.product.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        name: req.body.name ? req.body.name : undefined,
        thumbnailImage: files[0]?.filename ? files[0]?.filename : undefined,
        productSubCategory: req.body.productSubCategoryId
          ? {
            connect: {
              id: Number(req.body.productSubCategoryId),
            },
          }
          : undefined,
        productBrand: req.body.productBrandId
          ? {
            connect: {
              id: Number(req.body.productBrandId),
            },
          }
          : undefined,
        description: req.body.description,
        productColor: {
          create: req.body.colors
            ? req.body.colors?.split(",").map((color) => ({
              color: {
                connect: {
                  id: Number(color),
                },
              },
            })) : undefined,
        },
        sku: req.body.sku,
        productQuantity: parseInt(req.body.productQuantity) ? parseInt(req.body.productQuantity) : undefined,
        productPurchasePrice: parseFloat(req.body.productPurchasePrice) ? parseFloat(req.body.productPurchasePrice) : undefined,
        productSalePrice: parseFloat(req.body.productSalePrice)? parseFloat(req.body.productSalePrice) : undefined,
        unitType: req.body.unitType ? req.body.unitType : undefined,
        unitMeasurement: parseFloat(req.body.unitMeasurement)
          ? parseFloat(req.body.unitMeasurement)
          : undefined,
        reorderQuantity: parseInt(req.body.reorderQuantity) || undefined,
        status: req.body.status ? req.body.status : undefined,
        productVat: parseFloat(req.body.productVat) || undefined,
      },
    });

    return res.status(200).json(updateProduct);

  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

const deleteSingleProduct = async (req, res) => {
  try {
    const deletedProduct = await prisma.product.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    if (deletedProduct && deletedProduct.thumbnailImage) {
      let path = `./routes/inventory/product/uploads/${deletedProduct.thumbnailImage}`;
      fs.unlink(path, (err) => {
        if (err) {
          return err;
        }
      });
    }
    return res.status(200).json(deletedProduct);
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

module.exports = {
  createSingleProduct,
  getAllProduct,
  getSingleProduct,
  updateSingleProduct,
  deleteSingleProduct,
};
