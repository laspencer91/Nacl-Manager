const prompt   = require('prompt');
const colors   = require("colors/safe");
var columnify  = require('columnify')

const mongoose = require('mongoose');
var { Player } = require('../mongo-models/Player.js');

var dbUtil = require('../db-utils/database');

function start(match, team1, team2) {
    // Read line init
    prompt.message = "Input";
    prompt.start();

    var info = CreateMatchReportInfo();

    printPromptMessage(`How Many Rounds Did Each Team Win? \n(1 - ${match.team1Name}  |  2 - ${match.team2Name})`);
    prompt.get(teamWinReplySchema , function (err, result) {
        if (err) return console.error(err);
        info.team1Rounds = parseInt(result.Team_1_Rounds);
        info.team2Rounds = parseInt(result.Team_2_Rounds);
        if (info.team1Rounds > info.team2Rounds) info.winningTeam = 1; else info.winningTeam = 2;
        
        console.log("Team " + info.winningTeam + ' won.\n');
        printTeamPlayers(team1, team2);
    });
}

function printTeamPlayers(team1, team2) {
    dbUtil.findPlayersByIdArray(team1.playerIdList, team1Players => {
        dbUtil.findPlayersByIdArray(team2.playerIdList, team2Players => {
            var team1ComboList = [];
            var team1TeamName = "";
            var team1PlayerNameOut = "";
            var team2TeamName = "";
            var team2PlayerNameOut = "";

            for (let c = 0; c < team1Players.length; c++) {
                if (team1Players[c] === undefined) { team1PlayerNameOut = ""; team1TeamName = ""; }
                    else {team1PlayerNameOut = team1Players[c].name; team1TeamName = team1.shortName.toUpperCase(); }
                if (team2Players[c] === undefined) { team2PlayerNameOut = ""; team2TeamName = ""; }   
                    else {team2PlayerNameOut = team2Players[c].name; team2TeamName = team2.shortName.toUpperCase(); }

                team1ComboList.push({team1Name: team1TeamName, team1players: team1PlayerNameOut, 
                                     team2Name: team2TeamName, team2players: team2PlayerNameOut})
            }
            var columns = columnify(team1ComboList, { minWidth: 20 });   
            console.log(columns) 
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

  module.exports = { start };