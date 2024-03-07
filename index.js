const express = require("express");
const app = express();
require("dotenv").config();
const Products = require("./models/productsModel");
const productsRoutes = require("./routes/productsRoutes");

const PORT = process.env.PORT || 3000;
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/", productsRoutes);

require("./config/database").connect();

app.get("/pro", async (req, res) => {
  try {
    const allProducts = await Products.find();

    res.json(allProducts);
  } catch (error) {
    // Handle errors
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT} port`);
});
