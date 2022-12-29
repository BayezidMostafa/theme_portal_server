const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT | 5000;
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json())

// Default gateway
app.get('/', (req, res) => {
    res.send('Theme Portal Server in up!')
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async () => {
    try{
        const themeCollection = client.db('TPData').collection('themes');
        app.get('/themes', async (req, res) => {
            const size = Number(req.query.size);
            const query = {};
            const cursor = themeCollection.find(query).sort({_id:-1}).limit(size);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/themes/:id', async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await themeCollection.findOne(filter)
            res.send(result);
        })
    }
    catch{}
    finally{}
}
run().catch(er => {
    console.error(err)
})


// Port Listener
app.listen(port, () => {
    console.log(`Theme portal server is running on port number: ${port}`);
})