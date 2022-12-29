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


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const run = async () => {
    try{
        const themeCollection = client.db('TPData').collection('themes');
        app.get('/themes', async(req, res) => {
            const query = {}
            const result = await themeCollection.find(query).toArray();
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