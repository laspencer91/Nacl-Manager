const mongoose = require("mongoose");
Schema = mongoose.Schema;
ObjectId = mongoose.Schema.Types.ObjectId;

var PlayerSchema = new Schema ({
    name: {type: String, lowercase: true},
    teamId: ObjectId
}, {
  versionKey: false
});

var Player = mongoose.model('Players', PlayerSchema, 'Players');

module.exports = { Player: Player }