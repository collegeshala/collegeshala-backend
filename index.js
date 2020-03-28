const express = require("express");
const dotenv = require("dotenv");
const app = express();
const routes = require("./routes");

dotenv.config();

app.use(express.json());

// app.use("/app/v1", routes);

const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`App running on port ${port}`));