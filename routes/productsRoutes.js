const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Define route to fetch data from third-party API and initialize database
router.get('/initialize-database', productsController.initializeDatabase);

// List All Transactions with Search and Pagination
router.get('/transactions', productsController.listTransactions);


// Statistics API
router.get('/statistics', productsController.getStatistics);

// Bar Chart API
router.get('/bar-chart', productsController.getBarChartData);

// Pie Chart API
router.get('/pie-chart', productsController.getPieChartData);


router.get('/products', productsController.getProducts);

module.exports = router;
