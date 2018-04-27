const mongoose = require("mongoose");
Schema = mongoose.Schema;
ObjectId = mongoose.Schema.Types.ObjectId;

var MatchDateSchema = new Schema ({
    matchNumber: Number,
    matchDate: Date
}, {
  versionKey: false
});

var MatchDate = mongoose.model('MatchDates', MatchDateSchema, 'MatchDates');

module.exports = { MatchDate }