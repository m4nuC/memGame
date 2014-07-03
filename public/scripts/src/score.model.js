/**
 * Score Object
 * Responsible for fetching high scores and syncing them to server
 * Get injected with the DOM manipulation library
 */

var scoreModel = (function(DOMlib) {
    return {
        // Stores current
        currentScore: null,

        // Stores the current high scores using "playerName:value" format
        highScore: {
        },

        // Returns a promise
        fetch: function() {
            return DOMlib.getJSON( _GLOBALS.baseURL + "/scores")
                .then( this._setHighScores );
        },

        save: function() {
            //
        },

        _setHighScores: function( data ) {
            this.highScore = data;
            return data;
        }
    }
})( $ );

module.exports = scoreModel;
