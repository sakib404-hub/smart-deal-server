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

app.get("/about", (req, res) => {
  res.send("This is the Server for the About Page!");
});

app.get("/about/details", (req, res) => {
  res.send("This is From the About Details Sever!");
});

app.listen(port, () => {
  console.log(`This Sever is listeing from port number : ${port}`);
});
