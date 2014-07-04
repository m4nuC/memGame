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
        highScores: [],

        // Returns a promise
        fetch: function() {
            return DOMlib.getJSON( _GLOBALS.baseURL + "/scores")
                .then( this._setHighScores.bind(this) );
        },

        save: function() {
            var data = JSON.stringify(this.highScores);
            return DOMlib.ajax({
                    method: "POST",
                    url: _GLOBALS.baseURL + "/scores",
                    data: "data=" + data
            })
        },

        _setHighScores: function(data) {
            this.highScores = data;
            return this;
        },

        _isHighScore: function( score ) {
            var l = this.highScores.length;
            return this.highScores[l-1] <= score;
        },

        addHighScore: function(name, score) {
            var newScore = {"name": name, "points": score};
            this.highScores.length > 4 && this.highScores.pop();
            this.highScores.push(newScore);
            return this;
        },
    }
})( $ );

module.exports = scoreModel;
