const mongoose = require('mongoose');

const productsSchema = new mongoose.Schema({
  
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date,
  
});

const Products = mongoose.model('Products', productsSchema);

module.exports = Products;
