/**
 * Game Object
 * 1 - Manages game scope: pairFound, Scores
 * 2 - Spawn Grid
 */
var scoresModel = require('./score.model.js');
var grid = require('./grid.js');
require('./pubSub.js');
require('./polyfills.js');


var game = (function() {

    // Stores the score privatly
    var _scores = null;

    return {

        pairFound: 0,

        score: 0,

        init: function() {
            this._registerEvents();

            // Store DOM elements
            this.scoreDisplay = document.getElementById('score-count');

            // Generate random color grid
            grid.init();

            // Fetch the scores
             scoresModel.fetch()
                .then( this._setScores )
                .then( this._populatScores )
                .then( this.start);
        },

        _registerEvents: function() {
            var self = this;
            $.subscribe("scoreInc", self, self._scoreAddOne );
            $.subscribe("scoreDec", self, self._scoreRemoveOne );
            $.subscribe("pairFound", self, self._pairFoundCB );

            $('#restart').click( function(e) {
                e.preventDefault();
                self._restartGame();
            });
        },

        start: function() {
            //window._GLOBALS.debug && console.log('GAME STARTING');
        },

        _setScores: function( scores ) {
            _scores = scores;
        },

        _populatScores: function() {
            var html = "";
            var scoreCount = _scores.highScores.length;
            if ( scoreCount > 0 ) {
                for (var i = 0; i < scoreCount; i++) {
                    var pts = _scores.highScores[i].points;
                    html += '<p><span class="name">' + _scores.highScores[i].name + ':</span><span class="points">' + pts + ' point';
                    html += pts > 1 ? 's </span></p>' : '</span></p>';
                };
            } else {
                html = '<p> No high Score Yet </p>'
            }
            var highScores = document.getElementById('high-scores');
            highScores.innerHTML = html;
        },

        _pairFoundCB: function() {
            this.pairFound ++;
            this.pairFound === 8 && this._gameCompleted();
        },

        _restartGame: function() {
            this.score = 0;
            grid._gameRestart();
            this._refreshScoreDisplay(this.score);
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
           this.scoreDisplay.innerHTML = score;
        },

        _gameCompleted: function() {
            if ( _scores.isHighScore(this.score) ) {
                this._newHighScore();
            } else {
                var newGame = confirm('Well done!\nDo you wanna go again?');
                newGame && this._restartGame();
            }
        },

        _newHighScore: function() {
            var name = prompt("Congrats, you have made it to the high score.\nPlease enter your name", "Gandalf");
            _scores
                .addHighScore(name, this.score)
                .save()
                .then( this._populatScores )
                .then( function() {
                    var newGame = confirm('One More?');
                    newGame && this._restartGame();
                }.bind(this));
        }
    }
})();
module.exports = game;
