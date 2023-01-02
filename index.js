require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT | 5000;
const jwt = require('jsonwebtoken')

// Middleware
app.use(cors());
app.use(express.json())



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
    try {
        const themeCollection = client.db('TPData').collection('themes');
        const usersCollection = client.db('TPData').collection('users');
        const ordersCollection = client.db('TPData').collection('orders');
        const wishlistCollection = client.db('TPData').collection('wishlist');
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
            const cursor = themeCollection.find(query).sort({ _id: -1 }).limit(size);
            const result = await cursor.toArray();
            res.send(result);
        })
        app.get('/themes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await themeCollection.findOne(filter)
            res.send(result);
        })
        app.put('/users', async (req, res) => {
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
        app.get('/users/:email', verifyJWTAuth, async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
        })
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ admin: user?.role === 'admin' });
        })
        app.get('/users/developer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ developer: user?.role === 'developer' });
        })
        app.put('/order', async (req, res) => {
            const order = req.body;
            const {
                booking_id,
                userEmail,
                title,
                thumb,
                price,
                live_preview
            } = order;
            const filter = {
                booking_id,
                userEmail,
                title,
                thumb,
                price,
                live_preview
            }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    booking_id,
                    userEmail,
                    title,
                    thumb,
                    price,
                    live_preview
                }
            }
            const result = await ordersCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })
        app.get('/orders/:email', verifyJWTAuth, async (req, res) => {
            const email = req.params.email;
            const filter = {
                userEmail: email
            }
            const result = await ordersCollection.find(filter).toArray();
            res.send(result);
        })
        app.get('/order/:id', verifyJWTAuth, async (req, res) => {
            const id = req.params.id;
            const filter = { booking_id: id }
            const result = await ordersCollection.findOne(filter);
            res.send(result)
        })
        app.delete('/deleteorder/:id', verifyJWTAuth, async(req, res) => {
            const id = req.params.id;
            const filter = {booking_id: id};
            const result = await ordersCollection.deleteOne(filter);
            res.send(result);
        })
        app.put('/wishlist', async (req, res) => {
            const wishlist = req.body;
            const {
                booking_id,
                userEmail,
                title,
                thumb,
                price,
                live_preview
            } = wishlist;
            const filter = {
                booking_id,
                userEmail,
                title,
                thumb,
                price,
                live_preview
            }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    booking_id,
                    userEmail,
                    title,
                    thumb,
                    price,
                    live_preview
                }
            }
            const result = await wishlistCollection.updateOne(filter, updatedDoc, options)
            res.send(result);
        })
        app.get('/wishlists/:email', verifyJWTAuth, async (req, res) => {
            const email = req.params.email;
            const filter = {
                userEmail: email
            }
            const result = await wishlistCollection.find(filter).toArray();
            res.send(result);
        })
        // app.get('/developers/:role', async(req, res) => {
        //     const role = req.params.role;
        //     const filter = {
        //         role
        //     }
        //     const result = await usersCollection.find()
        // })

    }
    catch { }
    finally { }
}
run().catch(er => {
    console.error(err)
})

// Default gateway
app.get('/', (req, res) => {
    res.send('Theme Portal Server in up!')
})


// Port Listener
app.listen(port, () => {
    console.log(`Theme portal server is running on port number: ${port}`);
})