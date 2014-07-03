(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Cell Object
 * Responsible for creating a single cell object
 */


var cell = (function() {

    var _createCell = function( color ) {
        var el = document.createElement('div');
        el.className = 'cell turned-over';
        el.style.backgroundColor = '#' + color;
        el.setAttribute('data', 'color' );
        return el;
    };

    return {
        create: function(color) {
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
            window._GLOBALS.debug && console.log('GAME STARTING');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlX2M3OTY5NTM2LmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9zY29yZS5tb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ2VsbCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBhIHNpbmdsZSBjZWxsIG9iamVjdFxuICovXG5cblxudmFyIGNlbGwgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgX2NyZWF0ZUNlbGwgPSBmdW5jdGlvbiggY29sb3IgKSB7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSAnY2VsbCB0dXJuZWQtb3Zlcic7XG4gICAgICAgIGVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjJyArIGNvbG9yO1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEnLCAnY29sb3InICk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihjb2xvcikge1xuICAgICAgICAgICAgcmV0dXJuIF9jcmVhdGVDZWxsKCBjb2xvcik7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9XG4gICAgfVxuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNlbGw7XG4iLCIvKipcbiAqIEVudHJ5IHBvaW50IGZvciB0aGUgYnJvd3NlcmlmeSBidWlsZCBzY3JpcHRcbiAqXG4gKi9cblxudmFyIGdhbWUgPSByZXF1aXJlKCcuL2dhbWUuanMnKTtcbi8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgZ2FtZVxuZ2FtZS5pbml0KCk7XG5cbiIsIi8qKlxuICogR2FtZSBPYmplY3RcbiAqIDEgLSBzZXJ2ZXMgYXMgZ2xvYmFsIHNjb3BlIGZvcjogY3VycmVudFRpbGUsIFNjb3JlLCBUdXJuc1xuICogMiAtIFNwYXduIEdyaWRcbiAqIDMgLSBHZW5lcmF0ZSBNZWRpYXRvciBPYmplY3RcbiAqIDQgLVxuICovXG52YXIgc2NvcmVzTW9kZWwgPSByZXF1aXJlKCcuL3Njb3JlLm1vZGVsLmpzJyk7XG52YXIgZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZC5qcycpO1xuXG52YXIgZ2FtZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8vIFN0b3JlcyB0aGUgc2NvcmUgcHJpdmF0bHlcbiAgICB2YXIgX3Njb3JlcyA9IG51bGw7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfc2NvcmVzID0gc2NvcmVzTW9kZWwuZmV0Y2goKTtcblxuICAgICAgICAgICAgLy8gSW5pdCB0aGUgZ3JpZFxuICAgICAgICAgICAgZ3JpZC5pbml0KCk7XG5cbiAgICAgICAgICAgIC8vIE9uY2UgSW5pdGlhbCBTY29yZXMgYXJlIGZldGNoZWQgc3RhcnQgdGhlIGdhbWVcbiAgICAgICAgICAgIF9zY29yZXMudGhlbiggdGhpcy5zdGFydCApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5fR0xPQkFMUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnR0FNRSBTVEFSVElORycpO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZTtcbiIsIi8qKlxuICogR3JpZCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyB0aGUgZ3JpZCBmcm9tIGEgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqL1xuXG4vLyBDb25maWd1cmF0aW9uIE9iamVjdFxudmFyIGNvbmZpZyA9IHtcbiAgICBcInNpemVcIjogNCxcbiAgICBcImNvbG9yc1wiOiBbIFwiREQyMzJEXCIsIFwiRTBEQzJFXCIsIFwiNDZFNjJEXCIsIFwiMzdFNEI3XCIsIFwiMzA3OUUwXCIsIFwiNUExQUUwXCIsIFwiRkIxOEQ2XCIsIFwiRkI0MjFCXCIgXVxufTtcblxudmFyIGNlbGwgPSByZXF1aXJlKCcuL2NlbGwuanMnKTtcblxudmFyIGdyaWQgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBfZ2V0U2h1ZmZlbGVkQ29sb3JzID0gZnVuY3Rpb24oIGNvbG9ycyApIHtcbiAgICAgICAgdmFyIHNodWZmZWxlZENvbG9ycyA9IFtdO1xuICAgICAgICBjb2xvcnMgPSBjb2xvcnMuY29uY2F0KCBjb2xvcnMuc2xpY2UoKSApO1xuICAgICAgICB2YXIgbGVuZ3RoID0gY29sb3JzLmxlbmd0aDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIHJhbmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAgbGVuZ3RoKTtcbiAgICAgICAgICAgIHNodWZmZWxlZENvbG9ycy5wdXNoKGNvbG9ycy5zcGxpY2UocmFuZCwgMSlbMF0pO1xuICAgICAgICAgICAgbGVuZ3RoID0gY29sb3JzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIGxlbmd0aCE9IDAgKVxuICAgICAgICByZXR1cm4gc2h1ZmZlbGVkQ29sb3JzO1xuICAgIH07XG5cbiAgICBfZ2VuZXJhdGVHcmlkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb2xvcnMgPSBfZ2V0U2h1ZmZlbGVkQ29sb3JzKCBjb25maWcuY29sb3JzICk7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZ3RoID0gY29sb3JzLmxlbmd0aCA7IGkgPCBsZ3RoIDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3VyckNlbGwgPSBjZWxsLmNyZWF0ZSggY29sb3JzW2ldKTtcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKCBjdXJyQ2VsbCApO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdnYW1lLWJvYXJkJyApXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmRDaGlsZCggX2dlbmVyYXRlR3JpZCgpICk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdyaWQ7XG4iLCIvKipcbiAqIFNjb3JlIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGZldGNoaW5nIGhpZ2ggc2NvcmVzIGFuZCBzeW5jaW5nIHRoZW0gdG8gc2VydmVyXG4gKiBHZXQgaW5qZWN0ZWQgd2l0aCB0aGUgRE9NIG1hbmlwdWxhdGlvbiBsaWJyYXJ5XG4gKi9cblxudmFyIHNjb3JlTW9kZWwgPSAoZnVuY3Rpb24oRE9NbGliKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gU3RvcmVzIGN1cnJlbnRcbiAgICAgICAgY3VycmVudFNjb3JlOiBudWxsLFxuXG4gICAgICAgIC8vIFN0b3JlcyB0aGUgY3VycmVudCBoaWdoIHNjb3JlcyB1c2luZyBcInBsYXllck5hbWU6dmFsdWVcIiBmb3JtYXRcbiAgICAgICAgaGlnaFNjb3JlOiB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5nZXRKU09OKCBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3NldEhpZ2hTY29yZXMgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmUgPSBkYXRhXG4gICAgICAgIH1cbiAgICB9XG59KSggJCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjb3JlTW9kZWw7XG4iXX0=
