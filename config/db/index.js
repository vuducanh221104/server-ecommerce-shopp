const mongoose = require('mongoose');
require('dotenv').config();

async function connect() {
    try {
        await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('CONNTECTED TO DATABASE');
    } catch (err) {
        console.error('Error connecting to database:', err.message);
        process.exit(1);
    }
}

module.exports = { connect };
