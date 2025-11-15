const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5025;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@crud-operation.iftbw43.mongodb.net/?appName=CRUD-operation`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    await client.connect();
    //creating the Database
    const myDB = client.db("myDB");
    const productsCollection = myDB.collection("products");

    // posting the products
    app.post("/products", async (req, res) => {
      const newProducts = req.body;
      const result = await productsCollection.insertOne(newProducts);
      res.send(result);
    });

    //delete from the server
    app.delete("/products", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: id,
      };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    //sending ping for the successfull connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully Connected to the MongoDB!");
  } catch (error) {
    console.log(error);
  }
};
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("The Sever is Running!");
});

app.listen(port, () => {
  console.log(`This Sever is listeing from port number : ${port}`);
});
