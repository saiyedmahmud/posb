const { getPagination } = require("../../../utils/query");
const prisma = require("../../../utils/prisma");

const createSingleColors = async (req, res) => {
	if (req.query.query === "deletemany") {
		try {
			// delete many Colors at once
			const deletedColors = await prisma.colors.deleteMany({
				where: {
					id: {
						in: req.body.map((id) => parseInt(id)),
					},
				},
			});
			return res.status(200).json(deletedColors);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else if (req.query.query === "createmany") {
		try {
			// create many Colors from an array of objects
			const createdColors = await prisma.colors.createMany({
				data: req.body,
				skipDuplicates: true,
			});
			return res.status(201).json(createdColors);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else {
		try {
			// create single Colors from an object
			const createdColors = await prisma.colors.create({
				data: {
					name: req.body.name,
					colorCode: req.body.colorCode,
				},
			});
			return res.status(201).json(createdColors);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}
};

const getAllColors = async (req, res) => {
	if (req.query.query === "all") {
		try {
			// get all Colors
			const allColors = await prisma.colors.findMany({
				orderBy: {
					id: "asc",
				},
				where:{
					status:true
				}
			});
			return res.status(200).json(allColors);
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else if (req.query.query === "info") {
		// get all Colors info
		const aggregations = await prisma.colors.aggregate({
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
			// get all Colors
			const allColors = await prisma.colors.findMany({
				orderBy: {
					id: "asc",
				},
				where: {
					status: false,
				},
				skip: parseInt(skip),
				take: parseInt(limit),
			});

			const aggregations = await prisma.colors.aggregate({
				_count: {
					id: true,
				},
				where: {
					status: false,
				},
			});
			return res.status(200).json({
				getAllProductColor: allColors,
				totalProductColor: aggregations._count.id,
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	} else {
		const { skip, limit } = getPagination(req.query);
		try {
			// get all Colors paginated
			const allColors = await prisma.colors.findMany({
				orderBy: {
					id: "asc",
				},
				skip: parseInt(skip),
				take: parseInt(limit),
				where: {
					status: true,
				},
			});
			const aggregations = await prisma.colors.aggregate({
				_count: {
					id: true,
				},
				where: {
					status: true,
				},
			});

			return res.status(200).json({
				getAllProductColor: allColors,
				totalProductColor: aggregations._count.id,
			});
		} catch (error) {
			return res.status(500).json({ message: error.message });
		}
	}
};

const getSingleColors = async (req, res) => {
	try {
		const singleColors = await prisma.colors.findUnique({
			where: {
				id: parseInt(req.params.id),
			},
			include: {
				productColor: {
					include: {
						product: true,
					},
				},
			},
		});
		return res.status(200).json(singleColors);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const updateSingleColors = async (req, res) => {
	try {
		const updatedColors = await prisma.colors.update({
			where: {
				id: parseInt(req.params.id),
			},
			data: {
				name: req.body.name,
				colorCode: req.body.colorCode,
			},
		});
		return res.status(200).json(updatedColors);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

const deleteSingleColors = async (req, res) => {
	try {
		const deletedColors = await prisma.colors.update({
			where: {
				id: parseInt(req.params.id),
			},
			data: {
				status: req.body.status,
			},
		});
		return res.status(200).json(deletedColors);
	} catch (error) {
		return res.status(500).json({ message: error.message });
	}
};

module.exports = {
	createSingleColors,
	getAllColors,
	getSingleColors,
	updateSingleColors,
	deleteSingleColors,
};
