const mongoose = require('mongoose');


const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']); // Use Cloudflare and Google DNS servers for better reliability

function connectDB() {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('Connected to MongoDB!');
        })
        .catch((err) => {
            console.error('Error connecting to MongoDB:', err);
            process.exit(1); // Exit with failure
        })
}



module.exports = connectDB;