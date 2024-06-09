const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createRolePermission = async (req, res) => {
  try {
    if (req.query.query === "deletemany") {
      const deletedRolePermission = await prisma.rolePermission.deleteMany({
        where: {
          id: {
            in: req.body,
          },
        },
      });
     return res.json(deletedRolePermission);
    } else {
      // convert all incoming data to a specific format.
      const data = req.body.permissionId.map((permissionId) => {
        return {
          roleId: req.body.roleId,
          permissionId: permissionId,
        };
      });
      const createdRolePermission = await prisma.rolePermission.createMany({
        data: data,
        skipDuplicates: true,
      });
     return res.status(200).json(createdRolePermission);
    }
  } catch (error) {
   return res.status(400).json(error.message);
  }
};

// TODO: not in use and should be removed in future
const getAllRolePermission = async (req, res) => {
  if (req.query.query === "all") {
    const allRolePermission = await prisma.rolePermission.findMany({
      orderBy: [
        {
          id: "asc",
        },
      ],
      include: {
        role: true,
        permission: true,
      },
    });
   return res.json(allRolePermission);
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      const allRolePermission = await prisma.rolePermission.findMany({
        orderBy: [
          {
            id: "asc",
          },
        ],
        skip: Number(skip),
        take: Number(limit),
        include: {
          role: true,
          permission: true,
        },
      });

     return res.json(allRolePermission);
    } catch (error) {
     return res.status(400).json(error.message);
    }
  }
};

// TODO: not in use and should be removed in future
const getSingleRolePermission = async (req, res) => {
  try {
    const singleRolePermission = await prisma.rolePermission.findUnique({
      where: {
        id: Number(req.params.id),
      },
    });
   return res.json(singleRolePermission);
  } catch (error) {
   return res.status(400).json(error.message);
  }
};

// TODO: not in use and should be removed in future
const updateRolePermission = async (req, res) => {
  try {
    // convert all incoming data to a specific format.
    const data = req.body.permission_id.map((permission_id) => {
      return {
        role_id: req.body.role_id,
        permission_id: permission_id,
      };
    });
    const updatedRolePermission = await prisma.rolePermission.createMany({
      data: data,
      skipDuplicates: true,
    });
  return  res.json(updatedRolePermission);
  } catch (error) {
   return res.status(400).json(error.message);
  }
};

// delete and update account as per RolePermission
// TODO: not in use and should be removed in future
const deleteSingleRolePermission = async (req, res) => {
  try {
    const deletedRolePermission = await prisma.rolePermission.delete({
      where: {
        id: Number(req.params.id),
      },
    });
   return res.status(200).json(deletedRolePermission);
  } catch (error) {
   return res.status(400).json(error.message);
  }
};

module.exports = {
  createRolePermission,
  getAllRolePermission,
  getSingleRolePermission,
  updateRolePermission,
  deleteSingleRolePermission,
};
