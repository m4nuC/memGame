/**
 * Game Object
 * 1 - serves as global scope for: currentTile, Score, Turns
 * 2 - Spawn Grid
 * 3 - Generate Mediator Object
 * 4 -
 */
var scoresModel = require('./score.model.js');
var grid = require('./grid.js');

var game = (function() {

    // Stores the score privatly
    var _scores = null;
    return {
        init: function() {
            _scores = scoresModel.fetch();

            // Init the grid
            grid.init();

            // Once Initial Scores are fetched start the game
            _scores.then( this.start );
        },

        start: function() {
            console.log('GAME STARTING');
        }
    }
})();
module.exports = game;
