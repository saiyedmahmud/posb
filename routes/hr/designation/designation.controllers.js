const {getPagination} = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleDesignation = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many designation at once
      const deletedDesignation = await prisma.designation.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
      return res.json(deletedDesignation);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else if (req.query.query === "createmany") {
    try {
      // create many designation from an array of objects
      const createdDesignation = await prisma.designation.createMany({
        data: req.body,
        skipDuplicates: true,
      });
      return res.json(createdDesignation);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else {
    try {
      // create single designation from an object
      const createdDesignation = await prisma.designation.create({
        data: {
          name: req.body.name,
        },
      });
      return res.json(createdDesignation);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  }
};

const getAllDesignation = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all designation
      const getAllDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "asc",
        },
        where:{
          status: true,
        },
        include: {
          employee: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              salary: true,
              designation: true,
              joinDate: true,
              leaveDate: true,
              phone: true,
              idNo: true,
              address: true,
              bloodGroup: true,
              image: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      const aggregation = await prisma.designation.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        }
      });

      return res.json({getAllDesignation, totalDesignation: aggregation._count.id});
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else if (req.query.query === "info") {
    try {
      const aggregation = await prisma.designation.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        }
      });
      return res.status(200).json(aggregation);
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else if (req.query.status === "true") {
    try {
      const {skip, limit} = getPagination(req.query);
      // get all designation paginated
      const getAllDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              salary: true,
              designation: true,
              joinDate: true,
              leaveDate: true,
              phone: true,
              idNo: true,
              address: true,
              bloodGroup: true,
              image: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      const aggregation = await prisma.designation.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        }
      });
      return res.status(200).json({getAllDesignation, totalDesignation: aggregation._count.id});
    } catch (error) {
      return res.status(400).json(error.message);
    }
  } else if (req.query.status === "false") {
    try {
      const {skip, limit} = getPagination(req.query);
      // get all designation paginated
      const getAllDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "asc",
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              salary: true,
              designation: true,
              joinDate: true,
              leaveDate: true,
              phone: true,
              idNo: true,
              address: true,
              bloodGroup: true,
              image: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      const aggregation = await prisma.designation.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        }
      });
      return res.status(200).json({getAllDesignation, totalDesignation: aggregation._count.id});
    } catch (error) {
      return res.status(400).json(error.message);
    }
  }else {
    const {skip, limit} = getPagination(req.query);
    try {
      // get all designation paginated
      const getAllDesignation = await prisma.designation.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              salary: true,
              designation: true,
              joinDate: true,
              leaveDate: true,
              phone: true,
              idNo: true,
              address: true,
              bloodGroup: true,
              image: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregation = await prisma.designation.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        }
      });
      return res.status(200).json({getAllDesignation, totalDesignation: aggregation._count.id});
    } catch (error) {
      return res.status(400).json(error.message);
    }
  }
};

const getSingleDesignation = async (req, res) => {
  try {
    const singleDesignation = await prisma.designation.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        employee: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            salary: true,
            designation: true,
            joinDate: true,
            leaveDate: true,
            phone: true,
            idNo: true,
            address: true,
            bloodGroup: true,
            image: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    return res.json(singleDesignation);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const updateSingleDesignation = async (req, res) => {
  try {
    const updatedDesignation = await prisma.designation.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
      },
    });
    return res.json(updatedDesignation);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

const deleteSingleDesignation = async (req, res) => {
  try {
    const deletedDesignation = await prisma.designation.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      }
    });
    return res.json(deletedDesignation);
  } catch (error) {
    return res.status(400).json(error.message);
  }
};

module.exports = {
  createSingleDesignation,
  getAllDesignation,
  getSingleDesignation,
  updateSingleDesignation,
  deleteSingleDesignation,
};
