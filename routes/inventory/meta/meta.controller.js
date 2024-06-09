const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleMeta = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many meta at once
      const deletedAccount = await prisma.meta.deleteMany({
        where: {
          id: {
            in: req.body.map((id) => parseInt(id)),
          },
        },
      });
      return res.status(200).json(deletedAccount);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many meta from an array of objects
      const createdMeta = await prisma.meta.createMany({
        data: req.body.map((meta) => {
          return {
            title: meta.title,
            tag: meta.tag,
            description: meta.description,
            image: meta.image,
            status: meta.status,
          };
        }),
        skipDuplicates: true,
      });
      return res.status(201).json(createdMeta);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      // create single meta from an object

      const createdMeta = await prisma.meta.create({
        data: {
          title: req.body.title,
          tag: req.body.tag,
          description: req.body.description,
          image: req.body.image,
          status: req.body.status,
        },
      });

      return res.status(201).json(createdMeta);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getAllMeta = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all Meta
      const allMeta = await prisma.meta.findMany({
        orderBy: {
          id: "asc",
        },
      });
      return res.status(200).json(allMeta);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "info") {
    // get all meta info
    const aggregations = await prisma.meta.aggregate({
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
      // get all meta
      const allMeta = await prisma.meta.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });
      return res.status(200).json(allMeta);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all meta paginated
      const allMeta = await prisma.meta.findMany({
        orderBy: {
          id: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        where: {
          status: true,
        },
      });
      return res.status(200).json(allMeta);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

const getSingleMeta = async (req, res) => {
  try {
    const singleMeta = await prisma.meta.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });
    return res.status(200).json(singleMeta);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSingleMeta = async (req, res) => {
  try {
    const updatedMeta = await prisma.meta.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        title: req.body.title,
        description: req.body.description,
        image: req.body.image,
      },
    });
    return res.status(200).json(updatedMeta);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSingleMeta = async (req, res) => {
  try {
    const deletedMeta = await prisma.meta.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    return res.status(200).json(deletedMeta);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleMeta,
  getAllMeta,
  getSingleMeta,
  updateSingleMeta,
  deleteSingleMeta,
};
