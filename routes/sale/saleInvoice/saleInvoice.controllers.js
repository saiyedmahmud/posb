const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleSaleInvoice = async (req, res) => {
  try {

    // get all product asynchronously
    const allProducts = await Promise.all(
      req.body.saleInvoiceProduct.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: {
            id: item.productId,
          },
        });
        return product;
      })
    );

    //calculate the product total price with their vat
    let totalSalePrice = 0;
      const productSalePriceWithVat = req.body.saleInvoiceProduct.map(
      (item, index) => {
        const productVat = allProducts[index]?.productVat;
        const productTotalPrice =
          parseFloat(item.productSalePrice) * parseFloat(item.productQuantity);
        const productTotalPriceWithVat =
          productTotalPrice + (productTotalPrice * productVat) / 100;
        return productTotalPriceWithVat;
      }
    );
    //all vat
    const productVat = await prisma.productVat.findMany({
      where: {
        id: { in: req.body.vatId },
      },
    });

   const totalVat = productVat.reduce((acc,crr)=> acc+crr.percentage,0);

    // calculate total sale price
    productSalePriceWithVat.forEach((item) => {
      totalSalePrice += item ;
    });

    // Check if any product is out of stock
    const stockQuantities = allProducts.map((p) => p.productQuantity);
    const saleQuantities = req.body.saleInvoiceProduct.map(
      (item) => item.productQuantity
    );
    if (stockQuantities.some((qty, i) => qty < saleQuantities[i])) {
      return res.status(400).json({message: "Product out of stock"});
    }
    // iterate over all product and calculate total purchase price
    let totalPurchasePrice = 0;
    req.body.saleInvoiceProduct.forEach((item, index) => {
      totalPurchasePrice +=
        allProducts[index].productPurchasePrice * item.productQuantity;
    });

    //due amount
  const due = totalSalePrice + (totalSalePrice*totalVat)/100 - parseFloat(req.body.discount) - parseFloat(req.body.paidAmount);
    // convert all incoming date to a specific format.
    const date = new Date(req.body.date).toISOString().split("T")[0];
    // create sale invoice
    const createdInvoice = await prisma.saleInvoice.create({
      data: {
        date: new Date(date),
        totalAmount: totalSalePrice + (totalSalePrice*totalVat)/100,
        discount: parseFloat(req.body.discount)? parseFloat(req.body.discount):0,
        paidAmount: parseFloat(req.body.paidAmount),
        profit:
          totalSalePrice - parseFloat(req.body.discount) - totalPurchasePrice,
        dueAmount:due,
        saleInvoiceVat:{
          create: req.body.vatId.map((item)=>({
            productVat:{
              connect:{
                id: Number(item)
              }
            },
          })),
        },
        customer: {
          connect: {
            id: Number(req.body.customerId),
          },
        },
        user: {
          connect: {
            id: Number(req.body.userId),
          },
        },
        note: req.body.note,
        address: req.body.address,
        orderStatus: req.body.orderStatus ? req.body.orderStatus : "pending",
        // map and save all products from request body array of products
        saleInvoiceProduct: {
          create: req.body.saleInvoiceProduct.map((product) => ({
            product: {
              connect: {
                id: Number(product.productId),
              },
            },
            productQuantity: Number(product.productQuantity),
            productSalePrice: parseFloat(product.productSalePrice),
          })),
        },
      },
    });
    // new transactions will be created as journal entry for paid amount
    if (req.body.paidAmount > 0) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 1,
          creditId: 8,
          amount: parseFloat(req.body.paidAmount),
          particulars: `Cash receive on Sale Invoice #${createdInvoice.id}`,
          type: "sale",
          relatedId: createdInvoice.id,
        },
      });
    }
    // if sale on due another transactions will be created as journal entry
    const dueAmount =
      totalSalePrice+(totalSalePrice*totalVat)/100 -
      parseFloat(req.body.discount) -
      parseFloat(req.body.paidAmount);

    if (dueAmount > 0) {
      await prisma.transaction.create({
        data: {
          date: new Date(date),
          debitId: 4,
          creditId: 8,
          amount: dueAmount,
          particulars: `Due on Sale Invoice #${createdInvoice.id}`,
          type: "sale",
          relatedId: createdInvoice.id,
        },
      });
    }
    // cost of sales will be created as journal entry
    await prisma.transaction.create({
      data: {
        date: new Date(date),
        debitId: 9,
        creditId: 3,
        amount: totalPurchasePrice,
        particulars: `Cost of sales on Sale Invoice #${createdInvoice.id}`,
        type: "sale",
        relatedId: createdInvoice.id,
      },
    });

    const productPrice = req.body.saleInvoiceProduct.map(
      (item, index) => {
        return parseFloat(item.productSalePrice) * parseFloat(item.productQuantity);
      })
    const totalProductPrice = productPrice.reduce((acc,curr)=> acc+curr,0);
    const amount = totalSalePrice + (totalSalePrice*totalVat)/100 - totalProductPrice;
    // vat created
    await prisma.transaction.create({
      data: {
        date: new Date(date),
        debitId: 1,
        creditId: 15,
        amount: parseFloat(amount),
        particulars: `Vat Collected on Sale Invoice #${createdInvoice.id}`,
        type: "vat",
        relatedId: createdInvoice.id,
      },
    });
    // iterate through all products of this sale invoice and decrease product quantity
    for (const item of req.body.saleInvoiceProduct) {
      await prisma.product.update({
        where: {
          id: Number(item.productId),
        },
        data: {
          productQuantity: {
            decrement: Number(item.productQuantity),
          },
        },
      });
    }
    return res.status(201).json({
      createdInvoice,
    });
  } catch (error) {
    return res.status(400).json({message: error.message});
  }
};

const getAllSaleInvoice = async (req, res) => {
  if (req.query.query === "info") {
    const aggregations = await prisma.saleInvoice.aggregate({
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
        discount: true,
        dueAmount: true,
        paidAmount: true,
        profit: true,
      },
    });
    return res.status(200).json(aggregations);
  } else if (req.query.query === "search") {
    try {
      const allSaleInvoice = await prisma.saleInvoice.findMany({
        //remove search
        where: {
          OR: [
            {
              id: {
                equals: Number(req.query.sale),
              },
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        include: {
          saleInvoiceProduct: true,
        },
      });
      return res.status(200).json(allSaleInvoice);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else if (req.query.query === "search-order") {
    try {
      const allOrder = await prisma.saleInvoice.findMany({
        //remove search
        where: {
          OR: [
            {
              orderStatus: {
                contains: req.query.status,
                mode: "default",
              },
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        include: {
          saleInvoiceProduct: true,
        },
      });
      return res.status(200).json(allOrder);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } else {
    const { skip, limit } = getPagination(req.query);
    try {
      let aggregations, saleInvoices;
      if (req.query.user) {
        if (req.query.count) {
          [aggregations, saleInvoices] = await prisma.$transaction([
            // get info of selected parameter data
            prisma.saleInvoice.aggregate({
              _count: {
                id: true,
              },
              _sum: {
                totalAmount: true,
                discount: true,
                dueAmount: true,
                paidAmount: true,
                profit: true,
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
                userId: Number(req.query.user),
              },
            }),
            // get saleInvoice paginated and by start and end date
            prisma.saleInvoice.findMany({
              orderBy: [
                {
                  id: "desc",
                },
              ],
              skip: Number(skip),
              take: Number(limit),
              include: {
                saleInvoiceProduct: {
                  include: {
                    product: true,
                  },
                },
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
                userId: Number(req.query.user),
              },
            }),
          ]);
        } else {
          [aggregations, saleInvoices] = await prisma.$transaction([
            // get info of selected parameter data
            prisma.saleInvoice.aggregate({
              _count: {
                id: true,
              },
              _sum: {
                totalAmount: true,
                discount: true,
                dueAmount: true,
                paidAmount: true,
                profit: true,
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
                userId: Number(req.query.user),
              },
            }),
            // get saleInvoice paginated and by start and end date
            prisma.saleInvoice.findMany({
              orderBy: [
                {
                  id: "desc",
                },
              ],
              include: {
                saleInvoiceProduct: {
                  include: {
                    product: true,
                  },
                },
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
                userId: Number(req.query.user),
              },
            }),
          ]);
        }
      } else {
        if (req.query.count) {
          [aggregations, saleInvoices] = await prisma.$transaction([
            // get info of selected parameter data
            prisma.saleInvoice.aggregate({
              _count: {
                id: true,
              },
              _sum: {
                totalAmount: true,
                discount: true,
                dueAmount: true,
                paidAmount: true,
                profit: true,
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
              },
            }),
            // get saleInvoice paginated and by start and end date
            prisma.saleInvoice.findMany({
              orderBy: [
                {
                  id: "desc",
                },
              ],
              skip: Number(skip),
              take: Number(limit),
              include: {
                saleInvoiceProduct: {
                  include: {
                    product: true,
                  },
                },
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
              },
            }),
          ]);
        } else {
          [aggregations, saleInvoices] = await prisma.$transaction([
            // get info of selected parameter data
            prisma.saleInvoice.aggregate({
              _count: {
                id: true,
              },
              _sum: {
                totalAmount: true,
                discount: true,
                dueAmount: true,
                paidAmount: true,
                profit: true,
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
              },
            }),
            // get saleInvoice paginated and by start and end date
            prisma.saleInvoice.findMany({
              orderBy: [
                {
                  id: "desc",
                },
              ],
              include: {
                saleInvoiceProduct: {
                  include: {
                    product: true,
                  },
                },
                customer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
              where: {
                date: {
                  gte: new Date(req.query.startdate),
                  lte: new Date(req.query.enddate),
                },
              },
            }),
          ]);
        }
      }
      // modify data to actual data of sale invoice's current value by adjusting with transactions and returns
      const transactions = await prisma.transaction.findMany({
        where: {
          type: "sale",
          relatedId: {
            in: saleInvoices.map((item) => item.id),
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
      });
      // the return that paid back to customer on return invoice
      const transactions2 = await prisma.transaction.findMany({
        where: {
          type: "sale_return",
          relatedId: {
            in: saleInvoices.map((item) => item.id),
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
      });
      // calculate the discount given amount at the time of make the payment
      const transactions3 = await prisma.transaction.findMany({
        where: {
          type: "sale",
          relatedId: {
            in: saleInvoices.map((item) => item.id),
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
      const returnSaleInvoice = await prisma.returnSaleInvoice.findMany({
        where: {
          saleInvoiceId: {
            in: saleInvoices.map((item) => item.id),
          },
        },
      });
      // calculate paid amount and due amount of individual sale invoice from transactions and returnSaleInvoice and attach it to saleInvoices
      const allSaleInvoice = saleInvoices.map((item) => {
        const paidAmount = transactions
          .filter((transaction) => transaction.relatedId === item.id)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const paidAmountReturn = transactions2
          .filter((transaction) => transaction.relatedId === item.id)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const discountGiven = transactions3
          .filter((transaction) => transaction.relatedId === item.id)
          .reduce((acc, curr) => acc + curr.amount, 0);
        const returnAmount = returnSaleInvoice
          .filter(
            (returnSaleInvoice) => returnSaleInvoice.saleInvoiceId === item.id
          )
          .reduce((acc, curr) => acc + curr.totalAmount, 0);
        const totalUnitMeasurement = item.saleInvoiceProduct.reduce(
          (acc, curr) =>
            acc +
            Number(curr.product.unitMeasurement) *
              Number(curr.productQuantity),
          0
        );
        return {
          ...item,
          paidAmount: paidAmount,
          discount: item.discount + discountGiven,
          dueAmount:
            item.totalAmount -
            item.discount -
            paidAmount -
            returnAmount +
            paidAmountReturn -
            discountGiven,
          totalUnitMeasurement: totalUnitMeasurement,
        };
      });
      // calculate total paidAmount and dueAmount from allSaleInvoice and attach it to aggregations
      const totalPaidAmount = allSaleInvoice.reduce(
        (acc, curr) => acc + curr.paidAmount,
        0
      );
      const totalDueAmount = allSaleInvoice.reduce(
        (acc, curr) => acc + curr.dueAmount,
        0
      );
      const totalUnitMeasurement = allSaleInvoice.reduce(
        (acc, curr) => acc + curr.totalUnitMeasurement,
        0
      );
      const totalUnitQuantity = allSaleInvoice
        .map((item) =>
          item.saleInvoiceProduct.map((item) => item.productQuantity)
        )
        .flat()
        .reduce((acc, curr) => acc + curr, 0);
      const totalDiscountGiven = allSaleInvoice.reduce(
        (acc, curr) => acc + curr.discount,
        0
      );

      aggregations._sum.paidAmount = totalPaidAmount;
      aggregations._sum.discount = totalDiscountGiven;
      aggregations._sum.dueAmount = totalDueAmount;
      aggregations._sum.totalUnitMeasurement = totalUnitMeasurement;
      aggregations._sum.totalUnitQuantity = totalUnitQuantity;
      return res.status(200).json({
        aggregations,
        allSaleInvoice,
      });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }
};

const getSingleSaleInvoice = async (req, res) => {
  try {
    const singleSaleInvoice = await prisma.saleInvoice.findUnique({
      where: {
        id: Number(req.params.id),
      },
      include: {
        saleInvoiceProduct: {
          include: {
            product: true,
          },
        },
        saleInvoiceVat:{
          include:{
            productVat:true
          }
        },
        customer: {
          select:{
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          }
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
    // view the transactions of the sale invoice
    const transactions = await prisma.transaction.findMany({
      where: {
        relatedId: Number(req.params.id),
        OR: [
          {
            type: "sale",
          },
          {
            type: "sale_return",
          },
          {
            type: "vat",
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
    // transactions of the paid amount
    const transactions2 = await prisma.transaction.findMany({
      where: {
        type: "sale",
        relatedId: Number(req.params.id),
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
    // for total return amount
    const returnSaleInvoice = await prisma.returnSaleInvoice.findMany({
      where: {
        saleInvoiceId: Number(req.params.id),
      },
      include: {
        returnSaleInvoiceProduct: {
          include: {
            product: true,
          },
        },
      },
    });
    // calculate the discount given amount at the time of make the payment
    const transactions3 = await prisma.transaction.findMany({
      where: {
        type: "sale",
        relatedId: Number(req.params.id),
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
    // calculate the total amount return back to customer for return sale invoice from transactions
    // transactions of the paid amount
    const transactions4 = await prisma.transaction.findMany({
      where: {
        type: "sale_return",
        relatedId: Number(req.params.id),
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

    const transactions5 = await prisma.transaction.findMany({
      where: {
        type: "vat",
        relatedId: Number(req.params.id),
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

    const paidAmountReturn = transactions4.reduce(
      (acc, curr) => acc + curr.amount,
      0
    );
    let status = "UNPAID";
    // sum total amount of consolable transactions
    const totalPaidAmount = transactions2.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // sum of total discount given amount at the time of make the payment
    const totalDiscountAmount = transactions3.reduce(
      (acc, item) => acc + item.amount,
      0
    );
    // check if total transaction amount is equal to totalAmount - discount - return invoice amount
    const totalReturnAmount = returnSaleInvoice.reduce(
      (acc, item) => acc + item.totalAmount,
      0
    );
    //total vat amount
    const totalVatAmount = transactions5.reduce(
      (acc, item) => acc + item.amount,
      0
    );

    if(singleSaleInvoice?.totalAmount === undefined){
      return res.status(200).json({message:"This invoice is not valid"})
    }
    const dueAmount =
      singleSaleInvoice.totalAmount -
      singleSaleInvoice.discount -
      totalPaidAmount -
      totalDiscountAmount -
      totalReturnAmount +
      paidAmountReturn;


    if (dueAmount === 0) {
      status = "PAID";
    }
    // calculate total unit_measurement
    const totalUnitMeasurement = singleSaleInvoice.saleInvoiceProduct.reduce(
      (acc, item) =>
        acc + Number(item.product.unitMeasurement) * item.productQuantity,
      0
    );

    return res.status(200).json({
      status,
      totalPaidAmount,
      totalReturnAmount,
      dueAmount,
      totalVatAmount,
      totalUnitMeasurement,
      singleSaleInvoice,
      returnSaleInvoice,
      transactions,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateSaleStatus = async (req, res) => {
  try {
    const updateSaleStatus = await prisma.saleInvoice.update({
      where: {
        id: Number(req.body.invoiceId),
      },
      data: {
        orderStatus: req.body.orderStatus,
      },
    });
    return res.status(200).json(updateSaleStatus);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createSingleSaleInvoice,
  getAllSaleInvoice,
  getSingleSaleInvoice,
  updateSaleStatus,
};
