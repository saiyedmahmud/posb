const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleAttribute = async (req, res) => {
	if (req.query.query === "deletemany") {
		try {
			// delete many attribute at once
			const deletedAttribute = await prisma.productAttribute.deleteMany({
				where: {
					id: {
						in: req.body.map((id) => parseInt(id)),
					},
				},
			});
			return res.json(deletedAttribute);
		} catch (error) {
			return res.status(400).json({ message: error.message });
		}
	} else if (req.query.query === "createmany") {
		try {
			// create many attribute from an array of objects
			const createdAttribute = await prisma.productAttribute.createMany({
				data: req.body.map((attribute) => {
					return {
						name: attribute.name,
					};
				}),
				skipDuplicates: true,
			});
			return res.status(201).json(createdAttribute);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else {
		try {
			// create single attribute from an object
			const createdAttribute = await prisma.productAttribute.create({
				data: {
					name: req.body.name,
				},
			});
			return res.status(201).json(createdAttribute);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}
};

const getAllAttribute = async (req, res) => {
	if (req.query.query === "all") {
		try {
			// get all attribute
			const allAttribute = await prisma.productAttribute.findMany({
				orderBy: {
					id: "asc",
				},
				include: {
					productAttributeValue: true,
				},
			});
			return res.status(200).json(allAttribute);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else if (req.query.query === "info") {
		// get all attribute info
		const aggregations = await prisma.productAttribute.aggregate({
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
			// get all attribute
			const allAttribute = await prisma.productAttribute.findMany({
				orderBy: {
					id: "asc",
				},
				where: {
					status: false,
				},
				skip: parseInt(skip),
				take: parseInt(limit),
			});
			const aggregations = await prisma.productAttribute.aggregate({
				_count: {
					id: true,
				},
				where: {
					status: false,
				},
			});
			return res.status(200).json({
				getAllAttribute: allAttribute,
				totalAttribute: aggregations._count.id,
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else {
		const { skip, limit } = getPagination(req.query);
		try {
			// get all attribute paginated
			const allAttribute = await prisma.productAttribute.findMany({
				orderBy: {
					id: "asc",
				},
				skip: parseInt(skip),
				take: parseInt(limit),
				where: {
					status: true,
				},
			});
			const aggregations = await prisma.productAttribute.aggregate({
				_count: {
					id: true,
				},
				where: {
					status: true,
				},
			});
			return res.status(200).json({
				getAllAttribute: allAttribute,
				totalAttribute: aggregations._count.id,
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}
};

const getSingleAttribute = async (req, res) => {
	try {
		const singleAttribute = await prisma.productAttribute.findUnique({
			where: {
				id: parseInt(req.params.id),
			},
			include: {
				productAttributeValue: true,
			},
		});
		return res.status(200).json(singleAttribute);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const updateSingleAttribute = async (req, res) => {
	try {
		const updatedAttribute = await prisma.productAttribute.update({
			where: {
				id: parseInt(req.params.id),
			},
			data: {
				name: req.body.name,
			},
		});
		return res.status(200).json(updatedAttribute);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const deleteSingleAttribute = async (req, res) => {
	try {
		const deletedAttribute = await prisma.productAttribute.update({
			where: {
				id: parseInt(req.params.id),
			},
			data: {
				status: req.body.status,
			},
		});
		return res.status(200).json(deletedAttribute);
	} catch (error) {
		return res.status(400).json({ message: error.message });
	}
};

module.exports = {
	createSingleAttribute,
	getAllAttribute,
	getSingleAttribute,
	updateSingleAttribute,
	deleteSingleAttribute,
};
