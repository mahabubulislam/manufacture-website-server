const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
        const paymentCollection = client.db('manufacturer').collection('payments');
        const usersCollection = client.db('manufacturer').collection('users');
        const usersInfoCollection = client.db('manufacturer').collection('users-info');
        // products load
        app.get('/parts', async (req, res) => {
            const parts = await partsCollection.find().toArray();
            res.send(parts.reverse())
        })
        // add product
        app.post('/parts', async (req, res) => {
            const part = req.body;
            console.log(part);
            const result = await partsCollection.insertOne(part);
            res.send(result)
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
            const filter = { email: email }
            const userInfo = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: userInfo
            };
            const reslut = await usersInfoCollection.updateOne(filter, updateDoc, options);
            res.send(reslut);

        })
        // user collection
        app.put('/users/:id', async (req, res) => {
            const email = req.params.email
            const filter = { email: email };
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const reslut = await usersInfoCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn: '1d'});
            res.send({reslut, token});


        })
        // load my profile
        app.get('/my-profile/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await usersInfoCollection.findOne(query)
            res.send(result)

        })
        // payment intend
        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret });
        })
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewsCollection.find().toArray();
            res.send(reviews.reverse());
        });
        //   add reviews
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewsCollection.insertOne(reviews);
            res.send(result);
        })

        // load reviews


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
        app.get('/orders', async (req, res) => {
            const orders = await ordersCollection.find().toArray();
            res.send(orders)
        });
        // update orders payment status
        // app.patch('/orders/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const {transactionId} = req.body;
        //     const filter = { _id: ObjectId(id) };
        //     console.log(id, filter);
        //     // console.log(payment);
        //     const updateDoc = {
        //         $set:{
        //             paid: true,
        //             transactionId: transactionId
        //         }
        //     }
        //     console.log(updateDoc);
        //     // const paidOrder = await paymentCollection.insertOne()
        //     const updatedOrder = await ordersCollection.updateOne(filter,updateDoc);
        //     console.log(updatedOrder);
        //     res.send(updatedOrder)
        // })
        app.patch("/orders/payment/:id", async (req, res) => {
            const id = req.params.id;
            const { transactionId } = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    status: "pending",
                    transactionId: transactionId,
                },
            };
            const result = await ordersCollection.updateOne(filter, updatedDoc);
            console.log(result);
            res.send(result);
        });


    }
    finally {

    }
}
run().catch(console.dir)
app.listen(port, () => {
    console.log('listening from ', port);
})