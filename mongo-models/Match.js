const mongoose = require("mongoose");
Schema = mongoose.Schema;
ObjectId = mongoose.Schema.Types.ObjectId;

var MatchSchema = new Schema ({
    scheduledDate: Date,
    team1Id: ObjectId,
    team2Id: ObjectId,
    playedDate: {type: Date, default: null},
    winnerId: {type: ObjectId, default: null},
    roundsPlayed: {type: Number, default: 0},
    team1PlayerStats: [{
        playerId: ObjectId,
        playerName: String,
        kills: Number,
        assists: Number,
        deaths: Number
    }],
    team2PlayerStats: [{
        playerId: ObjectId,
        playerName: String,
        kills: Number,
        assists: Number,
        deaths: Number
    }]
}, {
    versionKey: false
});

var Match = mongoose.model('Matches', MatchSchema, 'Matches');

module.exports = { Match: Match }