var {MongoClient, ObjectId} = require('mongodb');
const mongoose = require('mongoose');

var dbUtil = require('./db-utils/database');

var { Player } = require('./mongo-models/Player.js');
var { Match } = require('./mongo-models/Match.js');
var { Team } = require('./mongo-models/Team.js');
var options = require( "yargs" ).argv;

// Route from commandline
let cmdParams = options._;
let command = cmdParams[0];

// Setup function mapping
let functionMap = new Map()
        .set("createplayer", () => {
            if (cmdParams.length < 3) {
                console.log("Error: You need to specify a player name and team name.");
                return;
            }
            dbUtil.createPlayer(cmdParams[1], cmdParams[2]);
        }).set("createplayers", () => {
            if (cmdParams.length < 3) {
                console.log("Error: You need to specify a team name followed by a list of players.");
                return;
            }
            for (let i = 2; i < cmdParams.length; i++) {
                dbUtil.createPlayer(cmdParams[i], cmdParams[1]);
            }
        }).set("createteam", () => {
            if (cmdParams.length < 3) {
                console.log("Error: You need to specify a player name and team name.");
                return;
            }
            dbUtil.createTeam(cmdParams[1], cmdParams[2]);
        });

// Connection and Application Start
var start = () => {
    const uri = "mongodb+srv://laspencer:forever1@blitz-nacl-za7h2.mongodb.net/test";
    mongoose.connect(uri);
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        console.log("Connected to database!");
        let action = functionMap.get(command);
        action();
    });
}

if (functionMap.has(command)) {
    start();
} else {
    console.log("Unrecognized Command ", command);
    return;
}