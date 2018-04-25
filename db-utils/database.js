var {ObjectId} = require('mongodb');
const mongoose = require('mongoose');

var { Player } = require('../mongo-models/Player.js');
var { Match }  = require('../mongo-models/Match.js');
var { Team }   = require('../mongo-models/Team.js');
const LOGGER   = require('../gen-utils/logging.js');
const ARRAYS   = require('../gen-utils/arrayUtil.js');

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
                        addPlayerToTeam(savedPlayer, teamFound, true);
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

// Create a team after making sure that the shortname and long name do not already exist
var changeTeam = (tPlayerName, tTeamName) => {
    findPlayerByName(tPlayerName, (playerFound) => {
        if (!playerFound) {
            LOGGER.logAndEnd(tPlayerName + " was not found. Try again."); return;
        }
        Team.findById(playerFound.teamId, (err, oldTeam) => {
            if (err) return console.error(err);

            findTeamByName(tTeamName, (teamFound) => {
                if (!teamFound) {
                    LOGGER.logAndEnd(`The team ${tTeamName} was not found. Try again`); return;
                }
                removePlayerFromTeam(playerFound, oldTeam, false);
                addPlayerToTeam(playerFound, teamFound, false);

                saveTeam(oldTeam);
                saveTeam(teamFound);
                savePlayer(playerFound);
            });
        });
    })
}

function addPlayerToTeam(player, team, save) {
    player.teamId = team._id; 
    player.joinTeamDate = Date.now();
    team.playerIdList.push(player._id);

    if (save) { savePlayer(player, () => saveTeam(team)); }
}
function removePlayerFromTeam(player, team, save) {
    player.teamHistory.push({teamId: player._id, teamName: team.name, leaveDate: Date.now()}); // Save curr team in hist
    ARRAYS.remove(team.playerIdList, player._id);

    if (save) { savePlayer(player, () => saveTeam(team)); }
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

/**
 * Searches for a match with the given match number and the two team names
 * @param {Number} matchNum 
 * @param {String} team1 
 * @param {String} team2 
 * @param {Function} callback Provides the match found as an argument 
 */
var findMatch = (matchNum, team1, team2, callback) => {
    findTeamByName(team1, (team1Found) => {
        if (!team1Found) { LOGGER.logAndEnd(`The team ${team1} could not be found. Try again.`); return ;}

        findTeamByName(team2, (team2Found) => {
            if (!team2Found) { LOGGER.logAndEnd(`The team ${team2} could not be found. Try again.`); return ;}
            
            Match.findOne({
                $and: [
                        {matchNumber: matchNum}, 
                        {$or: [{team1Id: team1Found._id}, {team1Id: team2Found._id}]},
                        {$or: [{team2Id: team1Found._id}, {team2Id: team2Found._id}]}
                ]
            }, (err, matchFound) => { 
                if(err) return console.error(err); 
                callback(matchFound) });
        })
    })
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

module.exports = {savePlayer, findPlayerByName, createPlayer, createTeam, changeTeam, findMatch}