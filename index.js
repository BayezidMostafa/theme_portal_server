const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT | 5000;
require('dotenv').config();
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Middleware
app.use(cors());
app.use(express.json())

// Default gateway
app.get('/', (req, res) => {
    res.send('Theme Portal Server in up!')
})


const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// JWT Auth Middleware
const verifyJWTAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_ACCESS_TOKEN, (error, decoded) => {
        if (error) {
            res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next()
    })
}

const run = async () => {
    try{
        const themeCollection = client.db('TPData').collection('themes');
        const usersCollection = client.db('TPData').collection('users');
        // Admin Verifications
        const verifyAdmin = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = {
                email: decodedEmail
            }
            const user = await usersCollection.findOne(query)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next()
        }
        // Developer verifications
        const verifyDeveloper = async (req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail }
            const user = await usersCollection.findOne(query)
            if (user?.role !== 'developer') {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
            next()
        }
        // JWT AUTHORIZATION
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email }
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign(user, process.env.SECRET_ACCESS_TOKEN, { expiresIn: '5d' })

            return res.send({ result, token })
        })
        app.get('/themes', async (req, res) => {
            const size = Number(req.query.size);
            const query = {};
            const cursor = themeCollection.find(query).sort({_id:-1}).limit(size);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/themes/:id', verifyJWTAuth, async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)}
            const result = await themeCollection.findOne(filter)
            res.send(result);
        })
        app.put('/users', verifyJWTAuth, async (req, res) => {
            const user = req.body;
            const { name, email, role } = user;
            const filter = {
                name,
                email,
                role
            }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    name,
                    email,
                    role
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        app.get('/users', verifyJWTAuth, async(req, res) => {
            const query = {};
            const result = await usersCollection.find(query).toArray();
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