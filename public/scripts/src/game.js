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
                .then(this._populateScores )
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
            window._GLOBALS.debug && console.log('GAME STARTING');
        },

        _populateScores: function( scores ) {
            _scores = scores;
            var html = "";
            window._GLOBALS.debug && console.log('POPULATE SCORES');
            for( var name in _scores ) {
                var pts = _scores[name];
                html += '<p>' + name + ': ' + pts + ' point';
                html += pts > 1 ? 's </p>' : '</p>';
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
            this._refreshScoreDisplay(this.score);
            $('.cell').addClass("turned-over");
            $.publish('gameRestart');
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
        },

        _gameCompleted: function() {
            var newGame = confirm('Well done Sir!\n Do you wanna go again?');
            newGame && this._restartGame();
        },

        _isHighScore: function() {
            _scores.isHighScore(this.score) && this._newHighScore();
        },

        _newHighScore: function() {
            var name = prompt("Congrats, you have made it to the high score.\n Please enter your name", "Gandalf");
            _scores
                .addHighScore(name, this.score)
                .save()
                ._populateScores();
        }
    }
})();
module.exports = game;
