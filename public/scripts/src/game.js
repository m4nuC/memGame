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

        score: 0,

        init: function() {
            this._registerListeners();

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

        _registerListeners: function() {
            $.subscribe("scoreInc", this, this._scoreAdd );
        },

        _scoreAdd: function( point ) {
            console.log(this.score);
            this.score ++;
            console.log(this.score);

        }
    }
})();
module.exports = game;
