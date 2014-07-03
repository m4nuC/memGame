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
            return DOMlib.ajax({
                    method: "PUT",
                    url: _GLOBALS.baseURL + "/scores",
                    data: this.highScore
                })
        },

        _setHighScores: function( data ) {
            this.highScore = data;
            return data;
        },

        // @TODO Deal with case where new score is equal to lower high score.
        _isHighScore: function( score ) {
            var smaller = 8;
            for( var name in this.highScore ) {
                var s = this.highScore[name];
                if ( s < score ) {
                    return true;
                }
            }
            return false;
        },


        addHighScore: function(name, score) {
            this.highScore.push({ name: score });
            this._deleteSmallest();
        },

        _deleteSmallest: function() {
            var smaller = 8;
            var smallerName = null;
            for( var name in this.highScore ) {
                var s = this.highScore[name];
                if ( s < smaller ) {
                    smaller = s;
                    smallerName = name;
                // In case of equality we'll remove the night that is the higher in the alphabet
                } else if( s === smaller ) {
                     smallerName = name >= smallerName ? name : smallerName;
                }
            }
            delete this.highScore[smallerName];
        }
    }
})( $ );

module.exports = scoreModel;
