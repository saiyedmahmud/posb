const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");
const Email = require("../../../utils/email");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;

//random string generator
function makePassword(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += characters[Math.floor(Math.random() * characters.length)];
  }
  return password;
}
//customer login
const customerLogin = async (req, res) => {
  try {
    const allCustomer = await prisma.customer.findMany();
    const customer = allCustomer.find(
      (c) =>
        c.email === req.body.email &&
        bcrypt.compareSync(req.body.password, c.password)
    );
    const allUser = await prisma.customerPermissions.findMany({
      where: {
        AND: {
          user: "customer",
        },
      },
      select: {
        permissions: true,
      },
    });

    const endpointString = allUser.map((permission) => permission.permissions);

    if (customer) {
      const token = jwt.sign(
        { sub: customer.id, permissions: endpointString },
        secret,
        {
          expiresIn: "24h",
        }
      );
      const { password, ...customerWithoutPassword } = customer;
      return res.status(200).json({
        ...customerWithoutPassword,
        token,
      });
    }
    return res.status(400).json({ message: "Email or password is incorrect" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//reset password
const resetPassword = async (req, res) => {
  try {
    //token id and given id is match
    const accessToken = Number(req.auth.sub);
    const customerId = Number(req.params.id);

    if (accessToken !== customerId) {
      return res.status(200).json("you are unauthorized");
    }
    //get the customer by id
    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });
    //matching old pass
    const oldPass = bcrypt.compareSync(
      req.body.oldPassword,
      customer.password
    );
    //check true of false
    if (oldPass === false) {
      return res.status(200).json("Old password not match");
    }
    const hash = await bcrypt.hash(req.body.password, saltRounds);
    const updatePass = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        password: hash,
      },
    });
    const { password, ...customerWithoutPassword } = updatePass;
    return res.status(200).json({
      ...customerWithoutPassword,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email;
    const customer = await prisma.customer.findUnique({
      where: {
        email: email,
      },
    });

    if (!customer) {
      return res.status(404).json({ message: "Email Not Found" });
    }
    const token = bcrypt.hashSync(email + Date.now(), 10);
    Email.email(
      email,
      "Reset Password",
      "",
      `Click on the link to reset your password: ${process.env.CLIENT_URL}/reset-password?token=${token}`
    );
    return res.status(200).json({ message: "Email Sent" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error.message });
  }
};

//create new customer
const createSingleCustomer = async (req, res) => {
  if (req.query.query === "deletemany") {
    try {
      // delete many customer at once
      const deletedAccount = await prisma.customer.deleteMany({
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
      // create many customer from an array of objects
      const hash = await bcrypt.hash(makePassword(10), saltRounds);
      const createdCustomer = await prisma.customer.createMany({
        data: req.body.map((customer) => {
          return {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            password: hash,
          };
        }),
        skipDuplicates: true,
      });
      return res.status(201).json(createdCustomer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    try {
      // create single customer from an object
      const generatePass = makePassword(10);
      const hash = await bcrypt.hash(generatePass, saltRounds);
      const email = req.body.email;
      const createdCustomer = await prisma.customer.create({
        data: {
          name: req.body.name,
          email: email,
          phone: req.body.phone,
          address: req.body.address,
          password: hash,
        },
      });

      await Email.email(
        email,
        "user info",
        "user info",
        `hello ${req.body.name}, Here is you login credential<br>
        name: ${req.body.name}<br>
        email: ${email}<br>
        address: ${req.body.address}<br>
        pass: ${generatePass}<br>
        `
      );

      const { password, ...customerWithoutPassword } = createdCustomer;
      return res
        .status(201)
        .json({ message: "Email sent", data: customerWithoutPassword });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

//get all customer
const getAllCustomer = async (req, res) => {
  if (req.query.query === "all") {
    try {
      // get all customer
      const allCustomer = await prisma.customer.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          saleInvoice: true,
        },
      });
      return res.status(200).json(allCustomer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "info") {
    // get all customer info
    const aggregations = await prisma.customer.aggregate({
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
      // get all customer
      const allCustomer = await prisma.customer.findMany({
        orderBy: {
          id: "asc",
        },
        include: {
          saleInvoice: true,
        },
        where: {
          status: false,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
      });

      const aggregations = await prisma.customer.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: false,
        },
      });
      return res.status(200).json({getAllCustomer:allCustomer,totalCustomer:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else if (req.query.query === "search") {
    try {
      const allCustomer = await prisma.customer.findMany({
        where: {
          OR: [
            {
              name: {
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
          saleInvoice: true,
        },
      });
      return res.status(200).json(allCustomer);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      // get all customer paginated
      const allCustomer = await prisma.customer.findMany({
        orderBy: {
          id: "asc",
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          saleInvoice: true,
        },
        where: {
          status: true,
        },
      });
      const aggregations = await prisma.customer.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: true,
        },
      });
      return res.status(200).json({getAllCustomer:allCustomer,totalCustomer:aggregations._count.id});
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
};

//get single customer
const getSingleCustomer = async (req, res) => {
  try {
    const singleCustomer = await prisma.customer.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        saleInvoice: true,
      },
    });

    // get individual customer's due amount by calculating: sale invoice's total_amount - return sale invoices - transactions
    const allSaleInvoiceTotalAmount = await prisma.saleInvoice.aggregate({
      _sum: {
        totalAmount: true,
        discount: true,
      },
      where: {
        customerId: parseInt(req.params.id),
      },
    });
    // all invoice of a customer with return sale invoice nested
    const customersAllInvoice = await prisma.customer.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        saleInvoice: {
          include: {
            returnSaleInvoice: {
              where: {
                status: true,
              },
            },
          },
        },
      },
    });
    // get all return sale invoice of a customer
    const allReturnSaleInvoice = customersAllInvoice.saleInvoice.map(
      (invoice) => {
        return invoice.returnSaleInvoice;
      }
    );
    // calculate total return sale invoice amount
    const TotalReturnSaleInvoice = allReturnSaleInvoice.reduce(
      (acc, invoice) => {
        const returnSaleInvoiceTotalAmount = invoice.reduce((acc, invoice) => {
          return acc + invoice.totalAmount;
        }, 0);
        return acc + returnSaleInvoiceTotalAmount;
      },
      0
    );
    // get all saleInvoice id
    const allSaleInvoiceId = customersAllInvoice.saleInvoice.map(
      (saleInvoice) => {
        return saleInvoice.id;
      }
    );
    // get all transactions related to saleInvoice
    const allSaleTransaction = await prisma.transaction.findMany({
      where: {
        type: "sale",
        relatedId: {
          in: allSaleInvoiceId,
        },
        OR: [
          {
            debitId: 1,
          },
          {
            debitId: 2,
          },
        ],
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    // get all transactions related to return saleInvoice
    const allReturnSaleTransaction = await prisma.transaction.findMany({
      where: {
        type: "sale_return",
        relatedId: {
          in: allSaleInvoiceId,
        },
        OR: [
          {
            creditId: 1,
          },
          {
            creditId: 2,
          },
        ],
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    // calculate the discount given amount at the time of make the payment
    const discountGiven = await prisma.transaction.findMany({
      where: {
        type: "sale",
        relatedId: {
          in: allSaleInvoiceId,
        },
        debitId: 14,
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    const totalPaidAmount = allSaleTransaction.reduce((acc, cur) => {
      return acc + cur.amount;
    }, 0);
    const paidAmountReturn = allReturnSaleTransaction.reduce((acc, cur) => {
      return acc + cur.amount;
    }, 0);
    const totalDiscountGiven = discountGiven.reduce((acc, cur) => {
      return acc + cur.amount;
    }, 0);
    //get all transactions related to saleInvoiceId
    const allTransaction = await prisma.transaction.findMany({
      where: {
        relatedId: {
          in: allSaleInvoiceId,
        },
      },
      include: {
        debit: {
          select: {
            name: true,
          },
        },
        credit: {
          select: {
            name: true,
          },
        },
      },
    });
    const dueAmount =
      parseFloat(allSaleInvoiceTotalAmount._sum.totalAmount) -
      parseFloat(allSaleInvoiceTotalAmount._sum.discount) -
      parseFloat(totalPaidAmount) -
      parseFloat(totalDiscountGiven) -
      parseFloat(TotalReturnSaleInvoice) +
      parseFloat(paidAmountReturn);

    // include due_amount in singleCustomer
    singleCustomer.dueAmount = dueAmount ? dueAmount : 0;
    singleCustomer.allReturnSaleInvoice = allReturnSaleInvoice.flat();
    singleCustomer.allTransaction = allTransaction;
    //==================== UPDATE customer's purchase invoice information START====================
    // async is used for not blocking the main thread
    const updatedInvoices = singleCustomer.saleInvoice.map(async (item) => {
      const paidAmount = allSaleTransaction
        .filter((transaction) => transaction.relatedId === item.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const paidAmountReturn = allReturnSaleTransaction
        .filter((transaction) => transaction.relatedId === item.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const singleDiscountGiven = discountGiven
        .filter((transaction) => transaction.relatedId === item.id)
        .reduce((acc, curr) => acc + curr.amount, 0);
      const returnAmount = allReturnSaleInvoice
        .flat()
        .filter(
          (returnSaleInvoice) => returnSaleInvoice.saleInvoiceId === item.id
        )
        .reduce((acc, curr) => acc + curr.totalAmount, 0);
      return {
        ...item,
        paidAmount: paidAmount,
        discount: item.discount + singleDiscountGiven,
        dueAmount:
          item.totalAmount -
          item.discount -
          paidAmount -
          returnAmount +
          paidAmountReturn -
          singleDiscountGiven,
      };
    });
    singleCustomer.saleInvoice = await Promise.all(updatedInvoices);
    //==================== UPDATE customer's sale invoice information END====================

    return res.status(200).json(singleCustomer);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//update customer
const updateSingleCustomer = async (req, res) => {
  try {
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
      },
    });
    const { password, ...customerWithoutPassword } = updatedCustomer;
    return res.status(200).json(customerWithoutPassword);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//delete single customer
const deleteSingleCustomer = async (req, res) => {
  try {
    const deletedCustomer = await prisma.customer.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        status: req.body.status,
      },
    });
    const { password, ...customerWithoutPassword } = deletedCustomer;
    return res.status(200).json(customerWithoutPassword);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSingleCustomer,
  getAllCustomer,
  getSingleCustomer,
  updateSingleCustomer,
  deleteSingleCustomer,
  customerLogin,
  resetPassword,
  forgotPassword,
};
