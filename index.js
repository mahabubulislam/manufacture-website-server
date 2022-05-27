const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const { use } = require('express/lib/router');
const ObjectId = require('mongodb').ObjectId
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.orcrk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



async function run() {
    try {
        await client.connect();
        const partsCollection = client.db('manufacturer').collection('parts');
        const reviewsCollection = client.db('manufacturer').collection('reviews');
        const ordersCollection = client.db('manufacturer').collection('orders');
        const usersCollection = client.db('manufacturer').collection('users');
        // products load
        app.get('/parts', async (req, res) => {
            const parts = await partsCollection.find().toArray();
            res.send(parts.reverse())
        })

        // load single products
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsCollection.findOne(query)
            res.send(result)
        })

        // update my profile
        app.put('/my-profile/:email', async (req, res) => {
            const email = req.params.email;
            const filter = {email:email}
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: user
              };
            const reslut = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(reslut);

        })

        //   add reviews
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            res.send(result);
        })

        // load reviews
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewsCollection.find().toArray();
            res.send(reviews.reverse());
        });

        // add orders
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await ordersCollection.insertOne(orders);
            res.send(result);
        });

        // load order for single user user
        app.get('/myorders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders)
        });
    }
    finally {

    }
}
run().catch(console.dir)
app.listen(port, () => {
    console.log('listening from ', port);
})