var {ObjectId} = require('mongodb');
const mongoose = require('mongoose');

var { Player }                = require('../mongo-models/Player.js');
var { Match, CreateNewMatch } = require('../mongo-models/Match.js');
var { Team }                  = require('../mongo-models/Team.js');
var { MatchDate }             = require('../mongo-models/MatchDate.js');

const LOGGER = require('../gen-utils/logging.js');
const ARRAYS = require('../gen-utils/arrayUtil.js');

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

var createMatch = (matchNum, team1Name, team2Name, featured) => {
    findTeamByName(team1Name, (team1Found) => {
        if (!team1Found) {
            console.log(team1Name + " was not found to be a team in the database. retry.");
            mongoose.connection.close();
            return;
        }
        findTeamByName(team2Name, (team2Found) => {
            if (!team2Found) {
                console.log(team2Name + " was not found to be a team in the database. retry.");
                mongoose.connection.close();
                return;
            }
            Match.findOne({$or: [{team1Id: team1Found, team2Id: team2Found, matchNumber: matchNum}, {team1Id: team2Found, team2Id: team1Found, matchNumber: matchNum}]}, (err, doc) => {
                if (err) return console.error(err);
                if (doc) { console.log("This match already exists!"); mongoose.connection.close(); return; }

                findMatchDate(matchNum, (matchScheduleFound) => {
                    if (matchScheduleFound === null) {
                        console.log("This match number does not have a scheduled date. User creatematchdate to schedule this.");
                        mongoose.connection.close();
                        return;
                    }
                    let newMatch = CreateNewMatch(matchScheduleFound.matchDate, team1Found, team2Found, matchNum, featured);
                    saveMatch(newMatch, () => mongoose.connection.close())
                })
            });
        });
    });
}

var createMatchDate = (matchNum, date) => {
    findMatchDate(matchNum, (matchDateFound) => {
        if (matchDateFound !== null) {
            console.log("This match number has already been scheduled");
            mongoose.connection.close();
            return;
        }

        let newMatchDate = new MatchDate({matchNumber: matchNum, matchDate: new Date(date + config.defaultMatchTime)});
        newMatchDate.save((err, doc) => {
            if (err) return console.error(err);
            console.log(`Match number ${newMatchDate.matchNumber} saved for a play date of ${newMatchDate.matchDate}`);
            mongoose.connection.close();
            return;
        });
    })
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

// Saves a team into the database
var saveMatch = (match, callback) => {
    match.save((err, team) => {
        if (err) return console.error(err);
        console.log("Save Successful For This Match Between" + match.team1Name + " and " + match.team2Name);

        if (callback) { callback(); }
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
                callback(matchFound, team1Found, team2Found) });
        })
    })
}

var findMatchDate = (matchNum, callback) => {
    MatchDate.findOne({matchNumber: matchNum}, (err, matchDateFound) => {
        if (err) return console.error(err);
        callback(matchDateFound);
    })
}

var findPlayerByName = (playerName, callback) => {
    Player.findOne({name: playerName}, (err, playerFound) => {
        if (err) return console.error(err);

        callback(playerFound);
    })
}

var findPlayersByIdArray = (ids, callback) => {
    Player.find({}).where("_id").in(ids).exec((err, docs) => {
        if (err) return console.error(err);
    
        callback(JSON.parse(JSON.stringify(docs)));
    });
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

module.exports = {savePlayer, findPlayerByName, createPlayer, 
                 createTeam, changeTeam, findMatch, 
                 findPlayersByIdArray, saveMatch, createMatch,
                 createMatchDate}