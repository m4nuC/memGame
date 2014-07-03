/**
 * Game Object
 * 1 - serves as global scope for: currentTile, Score, Turns
 * 2 - Spawn Grid
 * 3 - Generate Mediator Object
 * 4 -
 */
var scoresModel = require('./score.model.js');
var grid = require('./grid.js');
require('./pubSub.js');
require('./polyfills.js');


var game = (function() {

    // Stores the score privatly
    var _scores = null;

    return {

        scoreDisplay: null,

        score: 0,

        init: function() {
            this._registerListeners();

            // Store the score display el
            this.scoreDisplay = document.getElementById('score-count');

            // Init the grid
            grid.init();

            // Fetch the scores
             _scores = scoresModel.fetch();

            // Once Initial Scores are fetched start the game
            _scores.then( this.start );

        },

        start: function() {
            window._GLOBALS.debug && console.log('GAME STARTING');
        },

        _registerEvents: function() {
            $.subscribe("scoreInc", this, this._scoreAddOne );
            $.subscribe("scoreDec", this, this._scoreRemoveOne );
        },

        _scoreAddOne: function( point ) {
            this.score ++;
            this._refreshScoreDisplay(this.score);

        },

        _scoreRemoveOne: function( point ) {
            this.score !== 0 && this.score--;
            this._refreshScoreDisplay(this.score);
         },

        _refreshScoreDisplay: function( score ) {
            score = score || 0;
            this.scoreDisplay.innerText = score;
        }
    }
})();
module.exports = game;
