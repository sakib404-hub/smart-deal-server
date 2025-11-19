const express = require("express");
const app = express();
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./firebase_admin_key.json");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5025;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

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

// concept of middleware

const logger = (req, res, next) => {
  console.log("Logging Information, I am from MiddleWare!");
  next();
};

const varifyFirebaseToken = async (req, res, next) => {
  //checking if we have got the headers
  if (!req.headers.authorization) {
    //status code 401 for unauthorized access
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
  //getting the token with spliting the bearer
  const token = req.headers.authorization.split(" ")[1];

  //checking if we have got the token or not
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
  //? Means we have the token we need to just varify it
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    // console.log("after the token validation, ", userInfo);
    req.token_email = userInfo.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
};

// const varifyToken = (req, res, next) => {
//   if (!req.headers.authorization) {
//     return res.status(401).send({ message: "UnAuthorized Access!" });
//   }
//   const token = req.headers.authorization.split(" ")[1];
//   if (!token) {
//     return res.status(401).send({ message: "UnAuthorized Access!" });
//   }
//   // verifying the token
//   try{
//     const userInformation = await admin.auth().verifyIdToken(token);
//     next();
//   }catch{
//     return res.status(401).send({message : 'Unauthorized Access!'});
//   }
//   next();
// };

const verifyAuthTokenByAxios = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
  try {
    const userInfo = await admin.auth().verifyIdToken(token);
    req.token_email = userInfo.email;
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized Access!" });
  }
};

const run = async () => {
  try {
    await client.connect();
    //creating the Database
    const myDB = client.db("myDB");
    const productsCollection = myDB.collection("products");
    const bidsCollection = myDB.collection("bids");
    const userCollection = myDB.collection("user");

    app.get("/users", async (req, res) => {
      const query = {};
      const cursor = userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const query = {
        email,
      };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.status(409).send({ message: "User already exists" });
      }
      const result = await userCollection.insertOne(req.body);
      res.status(201).send(result);
    });

    app.get("/bids", logger, varifyFirebaseToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email !== req.token_email) {
        if (email !== req.token_email) {
          return res.status(403).send({ message: "Forbidden Access!" });
        }
        query.email = email;
      }
      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    // bids by product
    app.get("/bids/productBy/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = {
        productId,
      };
      const sortBy = {
        price: 1,
      };
      const cursor = bidsCollection.find(query).sort(sortBy);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const newBid = req.body;
      const result = await bidsCollection.insertOne(newBid);
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const sortBy = {
        price_max: 1,
      };
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = productsCollection.find(query).sort(sortBy);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/latest-products", async (req, res) => {
      const query = {};
      const sortBy = {
        created_at: 1,
      };
      const cursor = productsCollection.find(query).sort(sortBy).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // app.get("/productsSorted", async (req, res) => {
    //   const fields = {
    //     title: 1,
    //     price_min: 1,
    //     price_max: 1,
    //   };
    //   const sortBy = {
    //     price_min: -1,
    //   };
    //   const query = {};
    //   const cursor = productsCollection
    //     .find(query)
    //     .sort(sortBy)
    //     .skip(2)
    //     .limit(10)
    //     .project(fields);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    //fetching the single data from the server
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    // posting the products
    app.post("/products", verifyAuthTokenByAxios, async (req, res) => {
      const newProducts = req.body;
      const result = await productsCollection.insertOne(newProducts);
      res.send(result);
    });

    //updation of a product
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const updatedProduct = req.body;
      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };
      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    //delete from the server
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
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
