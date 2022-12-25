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

app.listen(port, () => {
    console.log(`Theme portal server is running on port number: ${port}`);
})