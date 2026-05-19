require("dotenv").config();
const { connect } = require("mongoose");
const app = require("./src/app");
const connectDB = require("./src/config/db");

// Connect to the database
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
