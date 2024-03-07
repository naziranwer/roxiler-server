const axios = require("axios");
const Products = require("../models/productsModel");

exports.initializeDatabase = async (req, res) => {
  try {
    // Fetch data from third-party API
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    const products = response.data;

    // Initialize database with seed data
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

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;
    const skip = (page - 1) * perPage;

    // Find total count of transactions matching the search query
    const totalCount = await Products.countDocuments({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    });

    // Find transactions matching the search query with pagination
    const transactions = await Products.find({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
      ],
    })
      .skip(skip)
      .limit(perPage);

    // Calculate total pages based on total count and items per page
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
    // Parse selected month from request query parameters
    const selectedMonth = req.query.month;
    let monthIndex;

    // Determine month index based on provided month value
    if (isNaN(selectedMonth)) {
      // If provided month is a string, convert it to month index
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
          // dateOfSale: { $gte: startDate, $lte: endDate }
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

    // Count total number of sold items of selected month
    const totalSoldItems = await Products.countDocuments({
      sold: true,

      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
      },
    });

    // Count total number of not sold items of selected month
    const totalNotSoldItems = await Products.countDocuments({
      sold: false,

      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
      },
    });

    // Send response with statistics
    res.json({
      totalSaleAmount:
        totalSaleAmount.length > 0 ? totalSaleAmount[0].totalSaleAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (error) {
    // Handle errors
    console.error("Error fetching statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBarChartData = async (req, res) => {
  try {
    // Parse selected month from request query parameters
    const selectedMonth = req.query.month;
    let monthIndex;

    // Determine month index based on provided month value
    if (isNaN(selectedMonth)) {
      // If provided month is a string, convert it to month index
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

    // Define price ranges
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

    // Initialize an object to store the count of items in each price range
    const priceRangeCounts = {};

    // Loop through each price range and count the number of items in that range
    for (const range of priceRanges) {
      const count = await Products.countDocuments({
        price: { $gte: range.min, $lte: range.max },
        // dateOfSale: { $gte: startDate, $lte: endDate },
        $expr: {
          $eq: [{ $month: "$dateOfSale" }, monthIndex + 1],
        },
      });
      priceRangeCounts[`${range.min}-${range.max}`] = count;
    }

    // Send response with bar chart data
    res.json({ priceRangeCounts });
  } catch (error) {
    // Handle errors
    console.error("Error fetching bar chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPieChartData = async (req, res) => {
  try {
    // Parse selected month from request query parameters
    const selectedMonth = req.query.month;
    let monthIndex;

    // Determine month index based on provided month value
    if (isNaN(selectedMonth)) {
      // If provided month is a string, convert it to month index
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

    // Calculate the start and end date of the selected month
    const startDate = new Date(new Date().getFullYear(), monthIndex, 1);
    const endDate = new Date(new Date().getFullYear(), monthIndex + 1, 0);

    // Aggregate to find unique categories and count of items in each category
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

    // Send response with pie chart data
    res.json({ categoryCounts });
  } catch (error) {
    // Handle errors
    console.error("Error fetching pie chart data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProducts = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 10;

    // Search parameter
    const search = req.query.search || "";

    // Month query
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

    // MongoDB query object to match search text and month on title, description, and price
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            // { price: { $regex: search, $options: 'i' } }
          ],
          $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] }, 
        }
      : { $expr: { $eq: [{ $month: "$dateOfSale" }, monthIndex + 1] } }; 

    
    console.log("query parameter", query);
    const products = await Products.find(query)
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Count total number of products for pagination
    const totalProducts = await Products.countDocuments(query);

    // Send response with products and pagination metadata
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
