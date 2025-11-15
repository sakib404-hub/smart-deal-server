const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5025;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("The Sever is Running!");
});

app.listen(port, () => {
  console.log(`This Sever is listeing from port number : ${port}`);
});
