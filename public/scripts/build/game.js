(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Cell Object
 * Responsible for creating a single cell object
 */


var cell = (function() {

    var _createCell = function( color ) {
        var el = document.createElement('div');
        el.className = 'cell';
        el.style.backgroundColor = '#' + color;
        el.setAttribute('data', 'color' );
        return el;
    };

    return {
        create: function(color) {
            console.log(color);
            return _createCell( color);
            //
        }
    }

})();

module.exports = cell;

},{}],2:[function(require,module,exports){
/**
 * Entry point for the browserify build script
 *
 */

var game = require('./game.js');
// Create an instance of the game
game.init();


},{"./game.js":3}],3:[function(require,module,exports){
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

},{"./grid.js":4,"./score.model.js":5}],4:[function(require,module,exports){
/**
 * Grid Object
 * Responsible for creating the grid from a configuration object
 */

// Configuration Object
var config = {
    "size": 4,
    "colors": [ "DD232D", "E0DC2E", "46E62D", "37E4B7", "3079E0", "5A1AE0", "FB18D6", "FB421B" ]
};

var cell = require('./cell.js');

var grid = (function() {

    _getShuffeledColors = function( colors ) {
        var shuffeledColors = [];
        colors = colors.concat( colors.slice() );
        var length = colors.length;
        do {
            var rand = Math.floor(Math.random() *  length);
            shuffeledColors.push(colors.splice(rand, 1)[0]);
            length = colors.length;
        }
        while ( length!= 0 )
        return shuffeledColors;
    };

    _generateGrid = function() {
        var colors = _getShuffeledColors( config.colors );
        var el = document.createElement( 'div' );
        for (var i = 0, lgth = colors.length ; i < lgth ; i++) {
            var currCell = cell.create( colors[i]);
            el.appendChild( currCell );
        };
        return el;
    };

    return {
        init: function() {
            document.getElementById( 'game-board' )
                    .appendChild( _generateGrid() );
        }
    }
})();

module.exports = grid;

},{"./cell.js":1}],5:[function(require,module,exports){
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
            this.highScore = data
        }
    }
})( $ );

module.exports = scoreModel;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzM5Njk1NmRiLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9zY29yZS5tb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDZWxsIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIGEgc2luZ2xlIGNlbGwgb2JqZWN0XG4gKi9cblxuXG52YXIgY2VsbCA9IChmdW5jdGlvbigpIHtcblxuICAgIHZhciBfY3JlYXRlQ2VsbCA9IGZ1bmN0aW9uKCBjb2xvciApIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsJztcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgY29sb3I7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YScsICdjb2xvcicgKTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKGNvbG9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjb2xvcik7XG4gICAgICAgICAgICByZXR1cm4gX2NyZWF0ZUNlbGwoIGNvbG9yKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2VsbDtcbiIsIi8qKlxuICogRW50cnkgcG9pbnQgZm9yIHRoZSBicm93c2VyaWZ5IGJ1aWxkIHNjcmlwdFxuICpcbiAqL1xuXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS5qcycpO1xuLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBnYW1lXG5nYW1lLmluaXQoKTtcblxuIiwiLyoqXG4gKiBHYW1lIE9iamVjdFxuICogMSAtIHNlcnZlcyBhcyBnbG9iYWwgc2NvcGUgZm9yOiBjdXJyZW50VGlsZSwgU2NvcmUsIFR1cm5zXG4gKiAyIC0gU3Bhd24gR3JpZFxuICogMyAtIEdlbmVyYXRlIE1lZGlhdG9yIE9iamVjdFxuICogNCAtXG4gKi9cbnZhciBzY29yZXNNb2RlbCA9IHJlcXVpcmUoJy4vc2NvcmUubW9kZWwuanMnKTtcbnZhciBncmlkID0gcmVxdWlyZSgnLi9ncmlkLmpzJyk7XG5cbnZhciBnYW1lID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gU3RvcmVzIHRoZSBzY29yZSBwcml2YXRseVxuICAgIHZhciBfc2NvcmVzID0gbnVsbDtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF9zY29yZXMgPSBzY29yZXNNb2RlbC5mZXRjaCgpO1xuXG4gICAgICAgICAgICAvLyBJbml0IHRoZSBncmlkXG4gICAgICAgICAgICBncmlkLmluaXQoKTtcblxuICAgICAgICAgICAgLy8gT25jZSBJbml0aWFsIFNjb3JlcyBhcmUgZmV0Y2hlZCBzdGFydCB0aGUgZ2FtZVxuICAgICAgICAgICAgX3Njb3Jlcy50aGVuKCB0aGlzLnN0YXJ0ICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0dBTUUgU1RBUlRJTkcnKTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWU7XG4iLCIvKipcbiAqIEdyaWQgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgdGhlIGdyaWQgZnJvbSBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKi9cblxuLy8gQ29uZmlndXJhdGlvbiBPYmplY3RcbnZhciBjb25maWcgPSB7XG4gICAgXCJzaXplXCI6IDQsXG4gICAgXCJjb2xvcnNcIjogWyBcIkREMjMyRFwiLCBcIkUwREMyRVwiLCBcIjQ2RTYyRFwiLCBcIjM3RTRCN1wiLCBcIjMwNzlFMFwiLCBcIjVBMUFFMFwiLCBcIkZCMThENlwiLCBcIkZCNDIxQlwiIF1cbn07XG5cbnZhciBjZWxsID0gcmVxdWlyZSgnLi9jZWxsLmpzJyk7XG5cbnZhciBncmlkID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgX2dldFNodWZmZWxlZENvbG9ycyA9IGZ1bmN0aW9uKCBjb2xvcnMgKSB7XG4gICAgICAgIHZhciBzaHVmZmVsZWRDb2xvcnMgPSBbXTtcbiAgICAgICAgY29sb3JzID0gY29sb3JzLmNvbmNhdCggY29sb3JzLnNsaWNlKCkgKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciByYW5kID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogIGxlbmd0aCk7XG4gICAgICAgICAgICBzaHVmZmVsZWRDb2xvcnMucHVzaChjb2xvcnMuc3BsaWNlKHJhbmQsIDEpWzBdKTtcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCBsZW5ndGghPSAwIClcbiAgICAgICAgcmV0dXJuIHNodWZmZWxlZENvbG9ycztcbiAgICB9O1xuXG4gICAgX2dlbmVyYXRlR3JpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29sb3JzID0gX2dldFNodWZmZWxlZENvbG9ycyggY29uZmlnLmNvbG9ycyApO1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGd0aCA9IGNvbG9ycy5sZW5ndGggOyBpIDwgbGd0aCA7IGkrKykge1xuICAgICAgICAgICAgdmFyIGN1cnJDZWxsID0gY2VsbC5jcmVhdGUoIGNvbG9yc1tpXSk7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZCggY3VyckNlbGwgKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZ2FtZS1ib2FyZCcgKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kQ2hpbGQoIF9nZW5lcmF0ZUdyaWQoKSApO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBncmlkO1xuIiwiLyoqXG4gKiBTY29yZSBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBmZXRjaGluZyBoaWdoIHNjb3JlcyBhbmQgc3luY2luZyB0aGVtIHRvIHNlcnZlclxuICogR2V0IGluamVjdGVkIHdpdGggdGhlIERPTSBtYW5pcHVsYXRpb24gbGlicmFyeVxuICovXG5cbnZhciBzY29yZU1vZGVsID0gKGZ1bmN0aW9uKERPTWxpYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFN0b3JlcyBjdXJyZW50XG4gICAgICAgIGN1cnJlbnRTY29yZTogbnVsbCxcblxuICAgICAgICAvLyBTdG9yZXMgdGhlIGN1cnJlbnQgaGlnaCBzY29yZXMgdXNpbmcgXCJwbGF5ZXJOYW1lOnZhbHVlXCIgZm9ybWF0XG4gICAgICAgIGhpZ2hTY29yZToge1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFJldHVybnMgYSBwcm9taXNlXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBET01saWIuZ2V0SlNPTiggX0dMT0JBTFMuYmFzZVVSTCArIFwiL3Njb3Jlc1wiKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9zZXRIaWdoU2NvcmVzICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRIaWdoU2NvcmVzOiBmdW5jdGlvbiggZGF0YSApIHtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3JlID0gZGF0YVxuICAgICAgICB9XG4gICAgfVxufSkoICQgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzY29yZU1vZGVsO1xuIl19
