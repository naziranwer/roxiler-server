const axios = require("axios");
const Products = require("../models/productsModel");

exports.initializeDatabase = async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const products = response.data;

    await Products.insertMany(products);

    res.json({ message: "Database initialized with seed data" });
  } catch (error) {
    console.error("Error initializing database:", error);
    res.status(500).json({ error: "Failed to initialize database" });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const searchQuery = req.query.search;
    const searchRegex = new RegExp(searchQuery, "i");

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const skip = (page - 1) * perPage;

    const totalCount = await Products.countDocuments({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    });

    const transactions = await Products.find({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    })
      .skip(skip)
      .limit(perPage);

    const totalPages = Math.ceil(totalCount / perPage);

    res.json({
      transactions: transactions,
      pagination: {
        totalItems: totalCount,
        totalPages: totalPages,
        currentPage: page,
        itemsPerPage: perPage,
      },
    });
  } catch (error) {
    console.error("Error listing transactions:", error);
    res.status(400).json({ error: "Failed to list transactions" });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const selectedMonth = req.query.month;
    let monthIndex;

    if (isNaN(selectedMonth)) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      monthIndex = monthNames.indexOf(selectedMonth);
    } else {
      monthIndex = parseInt(selectedMonth) - 1;
    }

    const totalSaleAmount = await Products.aggregate([
      {
        $match: {
          sold: true,

          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: "$price" },
        },
      },
    ]);

    const totalSoldItems = await Products.countDocuments({
      sold: true,

      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
      },
    });

    const totalNotSoldItems = await Products.countDocuments({
      sold: false,

      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
      },
    });

    res.json({
      totalSaleAmount:
        totalSaleAmount.length > 0 ? totalSaleAmount[0].totalSaleAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBarChartData = async (req, res) => {
  try {
    const selectedMonth = req.query.month;
    let monthIndex;

    if (isNaN(selectedMonth)) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      monthIndex = monthNames.indexOf(selectedMonth);
    } else {
      monthIndex = parseInt(selectedMonth) - 1;
    }

    const priceRanges = [
      { min: 0, max: 100 },
      { min: 101, max: 200 },
      { min: 201, max: 300 },
      { min: 301, max: 400 },
      { min: 401, max: 500 },
      { min: 501, max: 600 },
      { min: 601, max: 700 },
      { min: 701, max: 800 },
      { min: 801, max: 900 },
      { min: 901, max: Infinity },
    ];

    const priceRangeCounts = {};

    for (const range of priceRanges) {
      const count = await Products.countDocuments({
        price: { $gte: range.min, $lte: range.max },

        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
        },
      });
      priceRangeCounts[`${range.min}-${range.max}`] = count;
    }

    res.json({ priceRangeCounts });
  } catch (error) {
    console.error("Error fetching bar chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPieChartData = async (req, res) => {
  try {
    const selectedMonth = req.query.month;
    let monthIndex;

    if (isNaN(selectedMonth)) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      monthIndex = monthNames.indexOf(selectedMonth);
    } else {
      monthIndex = parseInt(selectedMonth) - 1;
    }

    const categoryCounts = await Products.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
          },
        },
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ categoryCounts });
  } catch (error) {
    // Handle errors
    console.error("Error fetching pie chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    const search = req.query.search || "";

    const selectedMonth = req.query.month;
    let monthIndex;

    if (isNaN(selectedMonth)) {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      monthIndex = monthNames.indexOf(selectedMonth);
    } else {
      monthIndex = parseInt(selectedMonth) - 1;
    }

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ],
          $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] },
        }
      : { $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] } };

    console.log("query parameter", query);
    const products = await Products.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalProducts = await Products.countDocuments(query);

    res.json({
      products,
      pagination: {
        page,
        perPage,
        totalPages: Math.ceil(totalProducts / perPage),
        totalProducts,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getCombinedData = async (req, res) => {
  try {
    const { month } = req.query;

    const statistics = await getStatistics(req, res);
    const barChartData = await getBarChartData(req, res);
    const pieChartData = await getPieChartData(req, res);

    res.json({
      statistics,
      barChartData,
      pieChartData,
    });
  } catch (error) {
    console.error("Error getting combined data:", error);
    res.status(500).json({ error: "Failed to get combined data" });
  }
};
