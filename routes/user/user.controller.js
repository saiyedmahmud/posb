const prisma = require("../../utils/prisma");
require("dotenv").config();

const bcrypt = require("bcrypt");
const saltRounds = 10;

const jwt = require("jsonwebtoken");
const {getPagination} = require("../../utils/query");
const secret = process.env.JWT_SECRET;

const login = async (req, res) => {
  try {
    const allUser = await prisma.user.findMany();
    const user = allUser.find(
      (u) =>
        u.username === req.body.username &&
        bcrypt.compareSync(req.body.password, u.password)
    );
    // get permission from user roles
    const permissions = await prisma.role.findUnique({
      where: {
        id: user.roleId,
      },
      include: {
        rolePermission: {
          include: {
            permission: true,
          },
        },
      },
    });
    // store all permissions name to an array
    const permissionNames = permissions.rolePermission.map(
      (rp) => rp.permission.name
    );

    if (user) {
      const token = jwt.sign(
        {sub: user.id, permissions: permissionNames},
        secret,
        {
          expiresIn: "24h",
        }
      );
      const {password, ...userWithoutPassword} = user;
      return res.status(200).json({
        ...userWithoutPassword,
        token,
      });
    }
    return res
      .status(400)
      .json({message: "Username or password is incorrect"});
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

const register = async (req, res) => {
  try {
    const joinDate = new Date(req.body.joinDate).toISOString().split("T")[0];
    const leaveDate = new Date(req.body.leaveDate).toISOString().split("T")[0];

    //valid the email address with regex
    const email = req.body.email;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({message: "Invalid email address"});
    }


    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const createUser = await prisma.user.create({
      data: {
        username: req.body.username,
        password: hash,
        role: {
          connect: {
            id: Number(req.body.roleId),
          },
        },
        email: emailRegex,
        salary: parseInt(req.body.salary),
        joinDate: new Date(joinDate),
        leaveDate: new Date(leaveDate),
        idNo: req.body.idNo,
        department: req.body.department,
        phone: req.body.phone,
        address: req.body.address,
        bloodGroup: req.body.bloodGroup,
        image: req.body.image,
        status: req.body.status,
        designation: {
          connect: {
            id: Number(req.body.designationId),
          },
        },
      },
    });
    const {password, ...userWithoutPassword} = createUser;
    return res.status(201).json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

const getAllUser = async (req, res) => {
  const {skip, limit} = getPagination(req.query);
  if (req.query.query === "all") {
    try {
      const allUser = await prisma.user.findMany({
        include: {
          saleInvoice: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregations = await prisma.user.aggregate({
        _count: {
          id: true,
        },
      });

      return res.status(200).json({
        getAllUser: allUser
          .map((u) => {
            const {password, ...userWithoutPassword} = u;
            return userWithoutPassword;
          })
          .sort((a, b) => a.id - b.id),
        totalUser: aggregations._count.id,
      });
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else if (req.query.status === "false") {
    const {skip, limit} = getPagination(req.query);

    try {
      const allUser = await prisma.user.findMany({
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          saleInvoice: true,
        },
      });

      const aggregations = await prisma.user.aggregate({
        where: {
          status: false,
        },
        _count: {
          id: true,
        },
      });

      return res.status(200).json({
        getAllUser: allUser
          .map((u) => {
            const {password, ...userWithoutPassword} = u;
            return userWithoutPassword;
          })
          .sort((a, b) => a.id - b.id),
        totalUser: aggregations._count.id,
      });
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  } else {
    const {skip, limit} = getPagination(req.query);
    try {
      const allUser = await prisma.user.findMany({
        where: {
          status: true,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          saleInvoice: true,
        },
      });

      const aggregations = await prisma.user.aggregate({
        where: {
          status: true,
        },
        _count: {
          id: true,
        },
      });

      return res.status(200).json({
        getAllUser: allUser
          .map((u) => {
            const {password, ...userWithoutPassword} = u;
            return userWithoutPassword;
          })
          .sort((a, b) => a.id - b.id),
        totalUser: aggregations._count.id,
      });
    } catch (error) {
      return res.status(500).json({message: error.message});
    }
  }
};

const getSingleUser = async (req, res) => {
  const singleUser = await prisma.user.findUnique({
    where: {
      id: Number(req.params.id),
    },
    include: {
      saleInvoice: true,
    },
  });
  const id = parseInt(req.params.id);

  // only allow admins and owner to access other user records
  if (id !== req.auth.sub && !req.auth.permissions.includes("readSingle-user")) {
    return res
      .status(401)
      .json({message: "Unauthorized. You are not an admin"});
  }

  if (!singleUser) return;
  const {password, ...userWithoutPassword} = singleUser;
  return res.status(200).json(userWithoutPassword);
};

const updateSingleUser = async (req, res) => {
  const id = parseInt(req.params.id);
  // only allow admins and owner to edit other user records

  if (id !== req.auth.sub && !req.auth.permissions.includes("update-user")) {
    return res.status(401).json({
      message: "Unauthorized. You can only edit your own record.",
    });
  }
  try {
    // admin can change all fields
    if (req.auth.permissions.includes("update-user")) {
      if (req.body.joinDate) {
        req.body.joinDate = new Date(req.body.joinDate)
          .toISOString()
          .split("T")[0];
      }
      if (req.body.leaveDate) {
        req.body.leaveDate = new Date(req.body.leaveDate)
          .toISOString()
          .split("T")[0];
      }
      //update user for password
      if (req.body.password) {
        const hash = await bcrypt.hash(req.body.password, saltRounds);
        await prisma.user.update({
          where: {
            id: Number(req.params.id),
          },
          data: {
            password: hash,
          },
        });
        return res
          .status(200)
          .json({message: "Password updated successfully"});
      } else {
        const updateUser = await prisma.user.update({
          where: {
            id: Number(req.params.id),
          },
          data: req.body,
        });

        const {password, ...userWithoutPassword} = updateUser;
        return res.status(200).json(userWithoutPassword);
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({message: error.message});
  }
};

const deleteSingleUser = async (req, res) => {
  // const id = parseInt(req.params.id);
  // only allow admins to delete other user records
  if (!req.auth.permissions.includes("delete-user")) {
    return res
      .status(401)
      .json({message: "Unauthorized. Only admin can delete."});
  }
  try {
    const deleteUser = await prisma.user.update({
      where: {
        id: Number(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });

    if (!deleteUser)
      return res.status(404).json({message: "User not deleted"});

    return res.status(200).json({message: "User deleted successfully"});
  } catch (error) {
    return res.status(500).json({message: error.message});
  }
};

module.exports = {
  login,
  register,
  getAllUser,
  getSingleUser,
  updateSingleUser,
  deleteSingleUser,
};
