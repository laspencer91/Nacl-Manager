const mongoose = require('mongoose');

var logAndEnd = (log) => {
    console.log(log);
    mongoose.connection.close();
}

module.exports = { logAndEnd }