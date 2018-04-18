var {ObjectId} = require('mongodb');
const mongoose = require('mongoose');

var { Player } = require('../mongo-models/Player.js');
var { Match }  = require('../mongo-models/Match.js');
var { Team }   = require('../mongo-models/Team.js');
const LOGGER   = require('../gen-utils/logging.js');

// Create a player after making sure the team specified exists and the player does not exist
var createPlayer = (pName, pTeam) => {
    findTeamByName(pTeam, (teamFound) => {
        if (teamFound) {
            findPlayerByName(pName, (playerFound) => {
                if (playerFound) {
                    console.log("Player name already exists. Need unique name...");
                }
                else {
                    let p = new Player({name: pName, teamId: teamFound._id});
                    savePlayer(p, (savedPlayer) => {
                        teamFound.playerIdList.push(savedPlayer._id);
                        saveTeam(teamFound);
                    });
                }
            });
        }
        else {
            LOGGER.logAndEnd(`The team ${pTeam} was not found in the database`);
        }
    });
}

// Create a team after making sure that the shortname and long name do not already exist
var createTeam = (tName, tShortname) => {
    findTeamByName(tName, (teamFound) => {
        if (teamFound) {
            LOGGER.logAndEnd("This teamname already exists. Must be unique.")
        }
        findTeamByName(tShortname, (shortTeamnameFound) => {
            if (shortTeamnameFound) {
                LOGGER.logAndEnd("This shortname already exists. Must be unique.");
            }
            else {
                let t = new Team({name: tName, shortName: tShortname, playerIdList: []});
                saveTeam(t);
            }
        });
    });
}

// Saves a player object into the database
var savePlayer = (player, callback) => {
    player.save((err, player) => {
        if (err) return console.error(err);
        console.log("Save Successful For " + player.name);

        if (callback) { callback(player); }
    });
}

// Saves a team into the database
var saveTeam = (team) => {
    team.save((err, team) => {
        if (err) return console.error(err);
        console.log("Save Successful For " + team.name + " with shortname " + team.shortName);
    });
}

var findPlayerByName = (playerName, callback) => {
    Player.findOne({name: playerName}, (err, playerFound) => {
        if (err) return console.error(err);

        callback(playerFound);
    })
}

var findTeamByName = (teamName, callback) => {
    Team.findOne({$or: [
        {name: teamName},
        {shortName: teamName}
    ]}, (err, teamFound) => {
        if (err) return console.error(err);
        callback(teamFound)
    });
}

module.exports = {savePlayer, findPlayerByName, createPlayer, createTeam}