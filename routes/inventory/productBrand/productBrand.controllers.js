const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const { getObjectSignedUrl } = require("../../../utils/s3");

const createSingleProductBrand = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many product_brand at once
      const deletedProductBrand = await prisma.productBrand.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      return res.status(200).json(deletedProductBrand);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many product_Brand from an array of objects
      const createdProductBrand = await prisma.productBrand.createMany({
        data:req.body,
        skipDuplicates: true,
      });
      return res.status(201).json(createdProductBrand);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      // create single product_brand from an object
      const createdProductBrand = await prisma.productBrand.create({
        data: {
          name: req.body.name,
        },
      });
      return res.status(201).json(createdProductBrand);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getAllProductBrand = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all product_brand
      const getAllProductBrand = await prisma.productBrand.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          product: true,
        },
      });
      return res.status(200).json(getAllProductBrand);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "search") {
    try {
      const allBrand = await prisma.productBrand.findMany({
        where: {
          OR: [
            {
              name: {
                contains: req.query.key,
                mode: "insensitive",
              },
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        include: {
          product: true,
        },
      });
      return res.status(200).json(allBrand);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "true") {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_brand paginated
      const getAllProductBrand = await prisma.productBrand.findMany({
        where: {
          status: true,
        },
        orderBy: {
          id: "asc",
        },
        include: {
          product: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregations = await prisma.productBrand.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({getAllProductBrand, totalProductBrand: aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.status === "false") {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_brand paginated
      const getAllProductBrand = await prisma.productBrand.findMany({
        where: {
          status: false,
        },
        orderBy: {
          id: "asc",
        },
        include: {
          product: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      const aggregations = await prisma.productBrand.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllProductBrand,totalProductBrand:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all product_brand paginated
      const getAllProductBrand = await prisma.productBrand.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          product: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregations = await prisma.productBrand.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllProductBrand,totalProductBrand:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleProductBrand = async (req, res) => {
  try {
    const singleProductBrand = await prisma.productBrand.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        product: true,
      },
    });
    //adding image url to product_brand
    for (let product of singleProductBrand.product) {
      if (product.imageName) {
        product.imageUrl = await getObjectSignedUrl(product.imageName);
      }
    }
    return res.status(200).json(singleProductBrand);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleProductBrand = async (req, res) => {
  try {
    const updatedProductBrand = await prisma.productBrand.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.status(200).json(updatedProductBrand);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleProductBrand = async (req, res) => {
  try {
    const deletedProductBrand = await prisma.productBrand.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(deletedProductBrand);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleProductBrand,
  getAllProductBrand,
  getSingleProductBrand,
  updateSingleProductBrand,
  deleteSingleProductBrand,
};
