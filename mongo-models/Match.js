const mongoose = require("mongoose");
Schema = mongoose.Schema;
ObjectId = mongoose.Schema.Types.ObjectId;

var MatchSchema = new Schema ({
    scheduledDate: Date,
    team1Id: ObjectId,
    team2Id: ObjectId,
    team1Name: String, 
    team2Name: String,
    playedDate: {type: Date, default: null},
    winnerId: {type: ObjectId, default: null},
    team1Rounds: {type: Number, default: 0},
    team2Rounds: {type: Number, default: 0},
    matchNumber: Number,
    featured: Boolean,
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

function CreateNewMatch(date, team1, team2, matchNum, isFeatured) {
    featuredMatch = (isFeatured === "1" || isFeatured === true)
    return new Match({scheduledDate: date, team1Id: team1._id, team2Id: team2._id, team1Name: team1.name, team2Name: team2.name, matchNumber: matchNum, featured: featuredMatch});
}

/**
 * Creates a valid object to be stored in the teamPlayerStatsArrays for this schema
 * @param {String} id Mongoose _id 
 * @param {String} name Players Name
 * @param {Number} kills Number of kills
 * @param {Number} assists Number of assists
 * @param {Number} deaths Number of deaths 
 */
function CreatePlayerStats(id, name, kills, assists, deaths) {
    return {
        playerId: id,
        playerName: name,
        kills: kills,
        assists: assists,
        deaths: deaths
    }
}

var Match = mongoose.model('Matches', MatchSchema, 'Matches');

module.exports = { Match, CreatePlayerStats, CreateNewMatch }