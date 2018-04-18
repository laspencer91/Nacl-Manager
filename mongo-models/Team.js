const mongoose = require("mongoose");
Schema = mongoose.Schema;
ObjectId = mongoose.Schema.Types.ObjectId;

var TeamSchema = new Schema ({
    name: {type: String, lowercase: true},
    shortName: {type: String, lowercase: true},
    playerIdList: [ObjectId]
}, {
    versionKey: false
});

var Team = mongoose.model('Teams', TeamSchema, 'Teams');

module.exports = { Team: Team }