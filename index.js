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

const partsCollection = client.db('manufacturer').collection('parts');

async function run() {
    try {
        await client.connect();
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
      
    }
    finally {

    }
}
run().catch(console.dir)
app.listen(port, () => {
    console.log('listening from ', port);
})