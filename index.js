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

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unAuthorization access' })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        await client.connect();
        const partsCollection = client.db('manufacturer').collection('parts');
        const reviewsCollection = client.db('manufacturer').collection('reviews');
        const ordersCollection = client.db('manufacturer').collection('orders');
        const paymentCollection = client.db('manufacturer').collection('payments');
        const usersCollection = client.db('manufacturer').collection('users');
        const usersInfoCollection = client.db('manufacturer').collection('users-info');
        // get products 
        app.get('/parts', async (req, res) => {
            const parts = await partsCollection.find().toArray();
            res.send(parts.reverse())
        })

        // add product
        app.post('/parts', async (req, res) => {
            const part = req.body;
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
            const result = await usersInfoCollection.updateOne(filter, updateDoc, options);
            res.send(result);

        })
        // get all user
        app.get('/users', async (req, res) => {
            const users = await usersCollection.find().toArray();
            res.send(users);
        })

        app.get('/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin });
        })



        app.put('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })
        //    add user in database
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email: email };
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ result, token });
        })



        // delete user
        app.delete('/users/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await usersCollection.deleteOne(filter);
            res.send(result)
        })


        // get my profile
        app.get('/my-profile/:email', verifyJWT, async (req, res) => {
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

        // get reviews
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


        // add orders
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await ordersCollection.insertOne(orders);
            res.send(result);
        });


        // get all orders

        app.get('/orders', async (req, res) => {
            const orders = await ordersCollection.find().toArray();
            res.send(orders)
        });

        app.delete('/orders/:id', async (req, res)=>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await ordersCollection.deleteOne(filter);
            res.send(result)
        })

        // load order for single user user
        app.get('/myorders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders)
        });


        // update orders payment status
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            console.log(id);
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedOrder = await paymentCollection.updateOne(filter, updateDoc);
            res.send(updatedOrder)
        })
    }
    finally {

    }
}
run().catch(console.dir)
app.listen(port, () => {
    console.log('listening from ', port);
})