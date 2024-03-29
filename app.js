var {MongoClient, ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const colors   = require("colors/safe");

config = require("./configuration/config.json");

var repMatchCli = require('./cli/report-match-cli.js');
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
        }).set("changeteam", () => {
            if (cmdParams.length < 3) {
                console.log("Error: You need to specify a player name and team name to move the player to.");
                return;
            }
            dbUtil.changeTeam(cmdParams[1], cmdParams[2]);
        }).set("reportmatch", () => {
            // Report match 3 negi 300
            if (cmdParams.length < 4) {
                console.log("Error: You need to specify the command in the format 'reportmatch week# negi spartans'");
                return;
            }
            dbUtil.findMatch(cmdParams[1], cmdParams[2], cmdParams[3], (match, team1, team2) => {
                if (!match) { console.log("A match could not be found for the given match number and team names"); return;}
                if (match.playedDate != null) { console.log("This match has already been reported."); return;}

                 console.log(`Match found. Id: ${match.matchNumber}, ${match.team1Name}, vs: ${match.team2Name}\n`);
                 repMatchCli.start(match, team1, team2);
            });
        }).set("creatematch", () => {
            // Report match 3 negi 300
            if (cmdParams.length < 5) {
                console.log("Error: You need to specify the command in the format 'creatematch match# negi spartans featured?(0 or 1)'");
                return;
            }
            dbUtil.createMatch(cmdParams[1], cmdParams[2], cmdParams[3], cmdParams[4]);
        }).set("creatematchdate", () => {
            // Report match 3 negi 300
            if (cmdParams.length < 2) {
                console.log("Error: You need to specify the command in the format 'creatematchdate match# date(YYYY-MM-DD)'");
                return;
            }
            dbUtil.createMatchDate(cmdParams[1], cmdParams[2]);
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