const prompt   = require('prompt');
const colors   = require("colors/safe");
var columnify  = require('columnify')

const mongoose = require('mongoose');
var { Player } = require('../mongo-models/Player.js');
var matchSchema = require('../mongo-models/Match.js');

var dbUtil = require('../db-utils/database.js');
var ArrUtil = require('../gen-utils/arrayUtil.js');

/**
 * Begin command prompt for Match Stat Reporting. Uses the match, and two team schemas
 * to operate.
 * @param {Object} match Mongoose schema of a Match object 
 * @param {Object} team1 Mongoose schema of team 1 object
 * @param {Object} team2 Mongoose Schema of team 2 object
 */
function start(match, team1, team2) 
{
    // Read line init
    prompt.message = "Input";
    prompt.start();

    var info = CreateMatchReportInfo();

    printPromptMessage(`How Many Rounds Did Each Team Win? \n(1 - ${match.team1Name}  |  2 - ${match.team2Name})`);
    prompt.get(teamWinReplySchema , function (err, result) {
        if (err) return console.error(err);

        let winningTeam;
        if (parseInt(result.Team_1_Rounds) > parseInt(result.Team_2_Rounds)) winningTeam = team1; else winningTeam = team2;
        console.log("Team " + winningTeam.name.toUpperCase() + ' won.\n');

        printPromptMessage(`PLAYER LISTING..`);
        printTeamPlayers(team1, team2, (team1Players, team2Players) => {

            printPromptMessage("\n\nWould you like to report stats for the players of this match? (Y or N)");
            prompt.get(yesOrNoSchema , function (err, reportAns) {

                if (reportAns.Answer.toUpperCase() === 'Y') {
                    printPromptMessage(`\nEnter information for ` + team1.name.toUpperCase());

                    prompt.get(CreatePlayerStatsSchema(team1Players), function (err, team1Stats) {
                        printPromptMessage(`\nEnter information for ` + team2.name.toUpperCase());

                        prompt.get(CreatePlayerStatsSchema(team2Players), function (err, team2Stats) {
                            let team1StatsFormatted = getFormattedTeamStatsArray(team1Stats);
                            let team2StatsFormatted = getFormattedTeamStatsArray(team2Stats);
                            let team1OutputInfo = columnify(CreateColumnFinalStats(team1StatsFormatted), { minWidth: 20 }); 
                            let team2OutputInfo = columnify(CreateColumnFinalStats(team2StatsFormatted), { minWidth: 20 }); 

                            printPromptMessage(`\n${team1.name.toUpperCase()}`);
                            console.log(team1OutputInfo);
                            printPromptMessage(`\n${team2.name.toUpperCase()}`);
                            console.log(team2OutputInfo);

                            confirmInformation(team1, team2, result, () => {
                                match.playedDate = Date.now();
                                match.winnerId = winningTeam._id;
                                match.team1Rounds = result.Team_1_Rounds;
                                match.team2Rounds = result.Team_2_Rounds;
                                addPlayerStatsToMatchTeam(match.team1PlayerStats, team1Players, team1StatsFormatted);
                                addPlayerStatsToMatchTeam(match.team2PlayerStats, team2Players, team2StatsFormatted);

                                dbUtil.saveMatch(match, () => {
                                    mongoose.connection.close();
                                    return;
                                });
                            });
                        });
                    });
                }
                else {
                    // Save info without player info
                    confirmInformation(team1, team2, result, () => {
                        match.playedDate = Date.now();
                        match.winnerId = winningTeam._id;
                        match.team1Rounds = result.Team_1_Rounds;
                        match.team2Rounds = result.Team_2_Rounds;

                        dbUtil.saveMatch(match, () => {
                            mongoose.connection.close();
                            return;
                        });
                    });
                }
            });
        });
    });
}

/**
 * Add formatted array input of player stats into a Match Schema Model
 * @param {Array} teamPlayerStats Array from a match mongoose schema
 * @param {Array} teamPlayers List of players that must exist for the value to be added to this team
 * @param {Array} formattedInputStats An array containing information to be input into Mongoose Match Schema
 */
function addPlayerStatsToMatchTeam(teamStatsArray, teamPlayers, formattedInputStats) {
    for (let i = 0; i < formattedInputStats.length; i++) {
        let singleStats = formattedInputStats[i];
        let id = undefined;
        teamPlayers.forEach(e => {if (e.name === singleStats[0]) id = e._id;})
        if (id === undefined) {
            console.log("Playername not found in this teams players list.. wierd..");
            continue;
        }
        teamStatsArray.push(matchSchema.CreatePlayerStats(id, singleStats[0], singleStats[1], singleStats[2], singleStats[3]));
    }
}

function confirmInformation(team1, team2, result, yesFunc) {
    console.log(colors.magenta(`\n${team1.name.toUpperCase()} rounds won: ${result.Team_1_Rounds}`));
    console.log(colors.magenta(`${team2.name.toUpperCase()} rounds won: ${result.Team_2_Rounds}`));
    console.log("\nIs this information correct? Note that unknown names, duplicates, and entries with errors have been filtered out.")

    prompt.get(yesOrNoSchema, function (err, infoCorrectAns) {
        if (infoCorrectAns.Answer.toUpperCase() === 'Y') {
            yesFunc()
        }
        else {console.log("Info NOT submitted."); mongoose.connection.close(); return; }
    });
}

function CreateColumnFinalStats(teamStatsFormatted) {
    let output = [];
    for (let i = 0; i < teamStatsFormatted.length; i++) {
        output.push({
            name: teamStatsFormatted[i][0],
            kills: teamStatsFormatted[i][1],
            assists: teamStatsFormatted[i][2],
            deaths: teamStatsFormatted[i][3]
        })
    }
    return output;
}

/**
 * Takes in team stats as filled out by prompt and formats them into a list
 * of arrays with the indicies. [Name, Kills, Assists, Deaths];
 * @param {Object} teamStatsFilledSchema 
 */
function getFormattedTeamStatsArray(teamStatsFilledSchema) {
    let teamStatsFormatted = [];
    teamStatsFormatted.push(teamStatsFilledSchema.player_1.split(" "));
    teamStatsFormatted.push(teamStatsFilledSchema.player_2.split(" "));
    teamStatsFormatted.push(teamStatsFilledSchema.player_3.split(" "));
    teamStatsFormatted.push(teamStatsFilledSchema.player_4.split(" "));
    teamStatsFormatted.push(teamStatsFilledSchema.player_5.split(" "));

    // Filter Duplicates And Blanks
    let dupes = []; 
    teamStatsFormatted = teamStatsFormatted.filter(e => {
        if (e.length <= 1) return false;

        if (dupes.indexOf(e[0]) === -1) {
            dupes.push(e[0]);
            return true;
        }
        return false;
    });

    return teamStatsFormatted;
}

/**
 * Print the team players using columfy so that they are neatly printed
 * @param {Schema} team1 Mongoose Team 1 Schema Object 
 * @param {Schema} team2 Mongoose Team 2 Scheam Object
 * @param {*} callback Function to be called when this function completes
 */
function printTeamPlayers(team1, team2, callback) {
    dbUtil.findPlayersByIdArray(team1.playerIdList, team1Players => {
        dbUtil.findPlayersByIdArray(team2.playerIdList, team2Players => {
            var team1ComboList = [];
            var team1TeamName = "";
            var team1PlayerNameOut = "";
            var team2TeamName = "";
            var team2PlayerNameOut = "";

            for (let c = 0; c < team1Players.length; c++) {
                if (team1Players[c] === undefined) { team1PlayerNameOut = ""; team1TeamName = ""; }
                    else {team1PlayerNameOut = team1Players[c].name; team1TeamName = "[" + team1.name.toUpperCase() + "]"; }
                if (team2Players[c] === undefined) { team2PlayerNameOut = ""; team2TeamName = ""; }   
                    else {team2PlayerNameOut = team2Players[c].name; team2TeamName = "[" + team2.name.toUpperCase() + "]"; }

                team1ComboList.push({[team1TeamName]: team1PlayerNameOut, [team2TeamName]: team2PlayerNameOut})
            }
            var columns = columnify(team1ComboList, { minWidth: 20 });   
            console.log(columns);
            callback(team1Players, team2Players);
    }); });
}

function printPromptMessage(message) { console.log(colors.green(message)); }

function CreateMatchReportInfo() {
    return {
        winningTeam: null,
        playedDate: null,
        team1Rounds: null,
        team2Rounds: null,
        team1Stats: [],
        team2Stats: []
    }
}

//
// SCHEMAS
//
var teamWinReplySchema = {
    properties: {
      Team_1_Rounds: {
        pattern: /^[0-9][0-9]?$/,
        message: 'Input must be between 0-20',
        required: true
      },
      Team_2_Rounds: {
        pattern: /^[0-9][0-9]?$/,
        message: 'Input must be between 0-20',
        required: true
      },
    }
  };

/**
 * Creates a valid prompt schema for gathering player data using provided player data.
 * @param {Array} teamPlayers Array of players with a name: String property 
 */
function CreatePlayerStatsSchema(teamPlayers) {
    // Create combined list of player names
    var listOfPlayerNames = [];
    for (let i = 0; i < teamPlayers.length; i++) { listOfPlayerNames.push(teamPlayers[i].name); }

    // Create and return the properties object
    let statsReportProp = undefined;
    let nameOptions = listOfPlayerNames.join("|");
    let regex = new RegExp(`((${nameOptions})\\s[0-5]?[0-9]\\s[0-5]?[0-9]\\s[0-5]?[0-9]$)|(^0)`);

    statsReportProp = {
        pattern: regex,
        message: 'Answer must be in the format "playername kills assists deaths" or you can use "0" to skip a player.\n'
               + '         In addition, the name must match a player on that team.\n'
               + '         (' + nameOptions + ')',
        required: true
    }

    return { 
        properties: {
            player_1: statsReportProp,
            player_2: statsReportProp,
            player_3: statsReportProp,
            player_4: statsReportProp,
            player_5: statsReportProp
        }
    }
};

var yesOrNoSchema = {
    properties: {
        Answer: {
        pattern: /^[ynYN]?$/,
        message: 'Answer must be either y or n',
        required: true
        }
    }
};

  module.exports = { start };