(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Cell Object
 * Responsible for creating a single cell object
 */


var cell = (function() {

    var _createCell = function( color, id ) {
        var el = document.createElement('div');
        el.className = 'cell turned-over';
        el.style.backgroundColor = '#' + color;
        el.setAttribute('data-color', color );
        el.id = "cell-" + id;

        $(el).on('click', function() {
            if ( el.className.indexOf('turned-over') > -1 ) {
                el.className = 'cell';
                $.publish("cellClicked", el);
            }
        });
        return el;
    };

    return {
        create: function(color, id) {
            return _createCell( color, id);
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
            window._GLOBALS.debug && console.log('GAME STARTING');
        },

        _setScores: function( scores ) {
            _scores = scores;
        },

        _populatScores: function() {
            var html = "";
            var scoreCount = _scores.highScores.length;
            window._GLOBALS.debug && console.log('POPULATE SCORES');
            if ( scoreCount > 0 ) {
                for (var i = 0; i < scoreCount; i++) {
                    var pts = _scores.highScores[i].points;
                    html += '<p>' + _scores.highScores[i].name + ': ' + pts + ' point';
                    html += pts > 1 ? 's </p>' : '</p>';
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
            this._refreshScoreDisplay(this.score);
            $('.cell').addClass("turned-over");
            $.publish('gameRestart');
                this._newHighScore();

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
            var newGame = confirm('Well done Sir!\nDo you wanna go again?');
            newGame && this._restartGame();
        },

        _isHighScore: function() {
            _scores.isHighScore(this.score) && this._newHighScore();
        },

        _newHighScore: function() {
            var name = prompt("Congrats, you have made it to the high score.\nPlease enter your name", "Gandalf");
            _scores
                .addHighScore(name, this.score)
                .save()
                .then( this._populatScores );
        }
    }
})();
module.exports = game;

},{"./grid.js":4,"./polyfills.js":5,"./pubSub.js":6,"./score.model.js":7}],4:[function(require,module,exports){
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

var timeoutID = null;

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
            var currCell = cell.create( colors[i], i+1 );
            el.appendChild( currCell );
        };
        return el;
    };

    return {
        currentCell: null,

        flippedCell: null,


        init: function() {
            this._registerListeners();

            document.getElementById( 'game-board' )
                    .appendChild( _generateGrid() );
        },

        _registerListeners: function() {
             $.subscribe("cellClicked", this, this._cellClickedCB);
             $.subscribe("gameRestart", this, this._gameRestart);
        },

        _gameRestart: function() {
            this.currentCell = null;
        },

        _clearCurrentMove: function() {
        },

        _cellClickedCB: function( cell ) {
            var self = this;
              // If timeout already exist then we need to reset the past move
            timeoutID && self._cancelMoves();

            self.currentCell = cell;

            if ( self.flippedCell ) {
                if (  self.flippedCell.getAttribute('data-color') ===
                        cell.getAttribute('data-color') ) {
                        $.publish("scoreInc");
                        $.publish("pairFound");
                        self.flippedCell = null;
                } else {
                    timeoutID = setTimeout(function() {
                        self._cancelMoves();
                    }, 1000);
                }
            } else {
                self.flippedCell = cell;
            }
        },

        _cancelMoves: function() {
            this.currentCell.className = this.flippedCell.className = 'cell turned-over';
            $.publish("scoreDec");
            this.flippedCell = this.currentCell = null;
            timeoutID && window.clearTimeout(timeoutID);
            timeoutID = null;
        }
    }
})();

module.exports = grid;

},{"./cell.js":1}],5:[function(require,module,exports){
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1), 
        fToBind = this, 
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


},{}],6:[function(require,module,exports){
// Based of http://www.bennadel.com/blog/2037-simple-publication-and-subscription-functionality-pub-sub-with-jquery.htm

// Define the publish and subscribe jQuery extensions.
// These will allow for pub-sub without the overhead
// of DOM-related eventing.
(function( $ ){

    // Create a collection of subscriptions which are just a
    // combination of event types and event callbacks
    // that can be alerted to published events.
    var subscriptions = {};


    // Create the subscribe extensions. This will take the
    // subscriber (context for callback execution), the
    // event type, and a callback to execute.
    $.subscribe = function( eventType, subscriber, callback ){
        // Check to see if this event type has a collection
        // of subscribers yet.
        if (!(eventType in subscriptions)){

            // Create a collection for this event type.
            subscriptions[ eventType ] = [];

        }

        // Check to see if the type of callback is a string.
        // If it is, we are going to convert it to a method
        // call.
        if (typeof( callback ) == "string"){

            // Convert the callback name to a reference to
            // the callback on the subscriber object.
            callback = subscriber[ callback ];

        }

        // Add this subscriber for the given event type..
        subscriptions[ eventType ].push({
            subscriber: subscriber,
            callback: callback
        });
    };


    // Create the unsubscribe extensions. This allows a
    // subscriber to unbind its previously-bound callback.
    $.unsubscribe = function( eventType, callback ){
        // Check to make sure the event type collection
        // currently exists.
        if (
            !(eventType in subscriptions) ||
            !subscriptions[ eventType ].length
            ){

            // Return out - if there's no subscriber
            // collection for this event type, there's
            // nothing for us to unbind.
            return;

        }

        // Map the current subscription collection to a new
        // one that doesn't have the given callback.
        subscriptions[ eventType ] = $.map(
            subscriptions[ eventType ],
            function( subscription ){
                // Check to see if this callback matches the
                // one we are unsubscribing. If it does, we
                // are going to want to remove it from the
                // collection.
                if (subscription.callback == callback){

                    // Return null to remove this matching
                    // callback from the subsribers.
                    return( null );

                } else {

                    // Return the given subscription to keep
                    // it in the subscribers collection.
                    return( subscription );

                }
            }
        );
    };


    // Create the publish extension. This takes the
    // publishing object, the type of event, and any
    // additional data that need to be published with the
    // event.
    $.publish = function( eventType, data ){
        data = data ? [data] : []
        // Loop over the subsribers for this event type
        // and invoke their callbacks.
        $.each(
            subscriptions[ eventType ],
            function( index, subscription ){

                // Invoke the callback in the subscription
                // context and store the result of the
                // callback in the event.
                subscription.callback.apply( subscription.subscriber, data);

            }
        );

        // Return the event object. This event object may have
        // been augmented by any one of the subsrcibers.
        return( event );
    };


})( jQuery );


},{}],7:[function(require,module,exports){
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
            console.log(data);

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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzU1ZDRkMjBmLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ2VsbCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBhIHNpbmdsZSBjZWxsIG9iamVjdFxuICovXG5cblxudmFyIGNlbGwgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgX2NyZWF0ZUNlbGwgPSBmdW5jdGlvbiggY29sb3IsIGlkICkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyBjb2xvcjtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJywgY29sb3IgKTtcbiAgICAgICAgZWwuaWQgPSBcImNlbGwtXCIgKyBpZDtcblxuICAgICAgICAkKGVsKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggZWwuY2xhc3NOYW1lLmluZGV4T2YoJ3R1cm5lZC1vdmVyJykgPiAtMSApIHtcbiAgICAgICAgICAgICAgICBlbC5jbGFzc05hbWUgPSAnY2VsbCc7XG4gICAgICAgICAgICAgICAgJC5wdWJsaXNoKFwiY2VsbENsaWNrZWRcIiwgZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKGNvbG9yLCBpZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jcmVhdGVDZWxsKCBjb2xvciwgaWQpO1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfVxuICAgIH1cblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjZWxsO1xuIiwiLyoqXG4gKiBFbnRyeSBwb2ludCBmb3IgdGhlIGJyb3dzZXJpZnkgYnVpbGQgc2NyaXB0XG4gKlxuICovXG5cbnZhciBnYW1lID0gcmVxdWlyZSgnLi9nYW1lLmpzJyk7XG4vLyBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGdhbWVcbmdhbWUuaW5pdCgpO1xuXG4iLCIvKipcbiAqIEdhbWUgT2JqZWN0XG4gKiAxIC0gc2VydmVzIGFzIGdsb2JhbCBzY29wZSBmb3I6IGN1cnJlbnRUaWxlLCBTY29yZSwgVHVybnNcbiAqIDIgLSBTcGF3biBHcmlkXG4gKiAzIC0gR2VuZXJhdGUgTWVkaWF0b3IgT2JqZWN0XG4gKiA0IC1cbiAqL1xudmFyIHNjb3Jlc01vZGVsID0gcmVxdWlyZSgnLi9zY29yZS5tb2RlbC5qcycpO1xudmFyIGdyaWQgPSByZXF1aXJlKCcuL2dyaWQuanMnKTtcbnJlcXVpcmUoJy4vcHViU3ViLmpzJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxscy5qcycpO1xuXG5cbnZhciBnYW1lID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gU3RvcmVzIHRoZSBzY29yZSBwcml2YXRseVxuICAgIHZhciBfc2NvcmVzID0gbnVsbDtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgcGFpckZvdW5kOiAwLFxuXG4gICAgICAgIHNjb3JlOiAwLFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJFdmVudHMoKTtcblxuICAgICAgICAgICAgLy8gU3RvcmUgRE9NIGVsZW1lbnRzXG4gICAgICAgICAgICB0aGlzLnNjb3JlRGlzcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY29yZS1jb3VudCcpO1xuXG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSByYW5kb20gY29sb3IgZ3JpZFxuICAgICAgICAgICAgZ3JpZC5pbml0KCk7XG5cbiAgICAgICAgICAgIC8vIEZldGNoIHRoZSBzY29yZXNcbiAgICAgICAgICAgICBzY29yZXNNb2RlbC5mZXRjaCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3NldFNjb3JlcyApXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3BvcHVsYXRTY29yZXMgKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLnN0YXJ0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVnaXN0ZXJFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJzY29yZUluY1wiLCBzZWxmLCBzZWxmLl9zY29yZUFkZE9uZSApO1xuICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJzY29yZURlY1wiLCBzZWxmLCBzZWxmLl9zY29yZVJlbW92ZU9uZSApO1xuICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJwYWlyRm91bmRcIiwgc2VsZiwgc2VsZi5fcGFpckZvdW5kQ0IgKTtcblxuICAgICAgICAgICAgJCgnI3Jlc3RhcnQnKS5jbGljayggZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZXN0YXJ0R2FtZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93Ll9HTE9CQUxTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdHQU1FIFNUQVJUSU5HJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldFNjb3JlczogZnVuY3Rpb24oIHNjb3JlcyApIHtcbiAgICAgICAgICAgIF9zY29yZXMgPSBzY29yZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3BvcHVsYXRTY29yZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGh0bWwgPSBcIlwiO1xuICAgICAgICAgICAgdmFyIHNjb3JlQ291bnQgPSBfc2NvcmVzLmhpZ2hTY29yZXMubGVuZ3RoO1xuICAgICAgICAgICAgd2luZG93Ll9HTE9CQUxTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdQT1BVTEFURSBTQ09SRVMnKTtcbiAgICAgICAgICAgIGlmICggc2NvcmVDb3VudCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY29yZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHB0cyA9IF9zY29yZXMuaGlnaFNjb3Jlc1tpXS5wb2ludHM7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxwPicgKyBfc2NvcmVzLmhpZ2hTY29yZXNbaV0ubmFtZSArICc6ICcgKyBwdHMgKyAnIHBvaW50JztcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSBwdHMgPiAxID8gJ3MgPC9wPicgOiAnPC9wPic7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaHRtbCA9ICc8cD4gTm8gaGlnaCBTY29yZSBZZXQgPC9wPidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBoaWdoU2NvcmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpZ2gtc2NvcmVzJyk7XG4gICAgICAgICAgICBoaWdoU2NvcmVzLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3BhaXJGb3VuZENCOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMucGFpckZvdW5kICsrO1xuICAgICAgICAgICAgdGhpcy5wYWlyRm91bmQgPT09IDggJiYgdGhpcy5fZ2FtZUNvbXBsZXRlZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZXN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG4gICAgICAgICAgICAkKCcuY2VsbCcpLmFkZENsYXNzKFwidHVybmVkLW92ZXJcIik7XG4gICAgICAgICAgICAkLnB1Ymxpc2goJ2dhbWVSZXN0YXJ0Jyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmV3SGlnaFNjb3JlKCk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVBZGRPbmU6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmUgKys7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zY29yZVJlbW92ZU9uZTogZnVuY3Rpb24oIHBvaW50ICkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSAhPT0gMCAmJiB0aGlzLnNjb3JlLS07XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICAgfSxcblxuICAgICAgICBfcmVmcmVzaFNjb3JlRGlzcGxheTogZnVuY3Rpb24oIHNjb3JlICkge1xuICAgICAgICAgICAgc2NvcmUgPSBzY29yZSB8fCAwO1xuICAgICAgICAgICAgdGhpcy5zY29yZURpc3BsYXkuaW5uZXJUZXh0ID0gc2NvcmU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dhbWVDb21wbGV0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG5ld0dhbWUgPSBjb25maXJtKCdXZWxsIGRvbmUgU2lyIVxcbkRvIHlvdSB3YW5uYSBnbyBhZ2Fpbj8nKTtcbiAgICAgICAgICAgIG5ld0dhbWUgJiYgdGhpcy5fcmVzdGFydEdhbWUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNIaWdoU2NvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3Njb3Jlcy5pc0hpZ2hTY29yZSh0aGlzLnNjb3JlKSAmJiB0aGlzLl9uZXdIaWdoU2NvcmUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbmV3SGlnaFNjb3JlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gcHJvbXB0KFwiQ29uZ3JhdHMsIHlvdSBoYXZlIG1hZGUgaXQgdG8gdGhlIGhpZ2ggc2NvcmUuXFxuUGxlYXNlIGVudGVyIHlvdXIgbmFtZVwiLCBcIkdhbmRhbGZcIik7XG4gICAgICAgICAgICBfc2NvcmVzXG4gICAgICAgICAgICAgICAgLmFkZEhpZ2hTY29yZShuYW1lLCB0aGlzLnNjb3JlKVxuICAgICAgICAgICAgICAgIC5zYXZlKClcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5fcG9wdWxhdFNjb3JlcyApO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZTtcbiIsIi8qKlxuICogR3JpZCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyB0aGUgZ3JpZCBmcm9tIGEgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqL1xuXG4vLyBDb25maWd1cmF0aW9uIE9iamVjdFxudmFyIGNvbmZpZyA9IHtcbiAgICBcInNpemVcIjogNCxcbiAgICBcImNvbG9yc1wiOiBbIFwiREQyMzJEXCIsIFwiRTBEQzJFXCIsIFwiNDZFNjJEXCIsIFwiMzdFNEI3XCIsIFwiMzA3OUUwXCIsIFwiNUExQUUwXCIsIFwiRkIxOEQ2XCIsIFwiRkI0MjFCXCIgXVxufTtcblxudmFyIGNlbGwgPSByZXF1aXJlKCcuL2NlbGwuanMnKTtcblxudmFyIHRpbWVvdXRJRCA9IG51bGw7XG5cbnZhciBncmlkID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgX2dldFNodWZmZWxlZENvbG9ycyA9IGZ1bmN0aW9uKCBjb2xvcnMgKSB7XG4gICAgICAgIHZhciBzaHVmZmVsZWRDb2xvcnMgPSBbXTtcbiAgICAgICAgY29sb3JzID0gY29sb3JzLmNvbmNhdCggY29sb3JzLnNsaWNlKCkgKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciByYW5kID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogIGxlbmd0aCk7XG4gICAgICAgICAgICBzaHVmZmVsZWRDb2xvcnMucHVzaChjb2xvcnMuc3BsaWNlKHJhbmQsIDEpWzBdKTtcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCBsZW5ndGghPSAwIClcbiAgICAgICAgcmV0dXJuIHNodWZmZWxlZENvbG9ycztcbiAgICB9O1xuXG4gICAgX2dlbmVyYXRlR3JpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29sb3JzID0gX2dldFNodWZmZWxlZENvbG9ycyggY29uZmlnLmNvbG9ycyApO1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGd0aCA9IGNvbG9ycy5sZW5ndGggOyBpIDwgbGd0aCA7IGkrKykge1xuICAgICAgICAgICAgdmFyIGN1cnJDZWxsID0gY2VsbC5jcmVhdGUoIGNvbG9yc1tpXSwgaSsxICk7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZCggY3VyckNlbGwgKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjdXJyZW50Q2VsbDogbnVsbCxcblxuICAgICAgICBmbGlwcGVkQ2VsbDogbnVsbCxcblxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcnMoKTtcblxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdnYW1lLWJvYXJkJyApXG4gICAgICAgICAgICAgICAgICAgIC5hcHBlbmRDaGlsZCggX2dlbmVyYXRlR3JpZCgpICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAkLnN1YnNjcmliZShcImNlbGxDbGlja2VkXCIsIHRoaXMsIHRoaXMuX2NlbGxDbGlja2VkQ0IpO1xuICAgICAgICAgICAgICQuc3Vic2NyaWJlKFwiZ2FtZVJlc3RhcnRcIiwgdGhpcywgdGhpcy5fZ2FtZVJlc3RhcnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nYW1lUmVzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDZWxsID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBfY2xlYXJDdXJyZW50TW92ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NlbGxDbGlja2VkQ0I6IGZ1bmN0aW9uKCBjZWxsICkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICAvLyBJZiB0aW1lb3V0IGFscmVhZHkgZXhpc3QgdGhlbiB3ZSBuZWVkIHRvIHJlc2V0IHRoZSBwYXN0IG1vdmVcbiAgICAgICAgICAgIHRpbWVvdXRJRCAmJiBzZWxmLl9jYW5jZWxNb3ZlcygpO1xuXG4gICAgICAgICAgICBzZWxmLmN1cnJlbnRDZWxsID0gY2VsbDtcblxuICAgICAgICAgICAgaWYgKCBzZWxmLmZsaXBwZWRDZWxsICkge1xuICAgICAgICAgICAgICAgIGlmICggIHNlbGYuZmxpcHBlZENlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJykgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5wdWJsaXNoKFwic2NvcmVJbmNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLnB1Ymxpc2goXCJwYWlyRm91bmRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZsaXBwZWRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aW1lb3V0SUQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fY2FuY2VsTW92ZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZsaXBwZWRDZWxsID0gY2VsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfY2FuY2VsTW92ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2VsbC5jbGFzc05hbWUgPSB0aGlzLmZsaXBwZWRDZWxsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgICAgICQucHVibGlzaChcInNjb3JlRGVjXCIpO1xuICAgICAgICAgICAgdGhpcy5mbGlwcGVkQ2VsbCA9IHRoaXMuY3VycmVudENlbGwgPSBudWxsO1xuICAgICAgICAgICAgdGltZW91dElEICYmIHdpbmRvdy5jbGVhclRpbWVvdXQodGltZW91dElEKTtcbiAgICAgICAgICAgIHRpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdyaWQ7XG4iLCJpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlXCIpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIFxuICAgICAgICBmVG9CaW5kID0gdGhpcywgXG4gICAgICAgIGZOT1AgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QICYmIG9UaGlzXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcblxuICAgIHJldHVybiBmQm91bmQ7XG4gIH07XG59XG5cbiIsIi8vIEJhc2VkIG9mIGh0dHA6Ly93d3cuYmVubmFkZWwuY29tL2Jsb2cvMjAzNy1zaW1wbGUtcHVibGljYXRpb24tYW5kLXN1YnNjcmlwdGlvbi1mdW5jdGlvbmFsaXR5LXB1Yi1zdWItd2l0aC1qcXVlcnkuaHRtXG5cbi8vIERlZmluZSB0aGUgcHVibGlzaCBhbmQgc3Vic2NyaWJlIGpRdWVyeSBleHRlbnNpb25zLlxuLy8gVGhlc2Ugd2lsbCBhbGxvdyBmb3IgcHViLXN1YiB3aXRob3V0IHRoZSBvdmVyaGVhZFxuLy8gb2YgRE9NLXJlbGF0ZWQgZXZlbnRpbmcuXG4oZnVuY3Rpb24oICQgKXtcblxuICAgIC8vIENyZWF0ZSBhIGNvbGxlY3Rpb24gb2Ygc3Vic2NyaXB0aW9ucyB3aGljaCBhcmUganVzdCBhXG4gICAgLy8gY29tYmluYXRpb24gb2YgZXZlbnQgdHlwZXMgYW5kIGV2ZW50IGNhbGxiYWNrc1xuICAgIC8vIHRoYXQgY2FuIGJlIGFsZXJ0ZWQgdG8gcHVibGlzaGVkIGV2ZW50cy5cbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHt9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHN1YnNjcmliZSBleHRlbnNpb25zLiBUaGlzIHdpbGwgdGFrZSB0aGVcbiAgICAvLyBzdWJzY3JpYmVyIChjb250ZXh0IGZvciBjYWxsYmFjayBleGVjdXRpb24pLCB0aGVcbiAgICAvLyBldmVudCB0eXBlLCBhbmQgYSBjYWxsYmFjayB0byBleGVjdXRlLlxuICAgICQuc3Vic2NyaWJlID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgc3Vic2NyaWJlciwgY2FsbGJhY2sgKXtcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgZXZlbnQgdHlwZSBoYXMgYSBjb2xsZWN0aW9uXG4gICAgICAgIC8vIG9mIHN1YnNjcmliZXJzIHlldC5cbiAgICAgICAgaWYgKCEoZXZlbnRUeXBlIGluIHN1YnNjcmlwdGlvbnMpKXtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29sbGVjdGlvbiBmb3IgdGhpcyBldmVudCB0eXBlLlxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0gPSBbXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB0eXBlIG9mIGNhbGxiYWNrIGlzIGEgc3RyaW5nLlxuICAgICAgICAvLyBJZiBpdCBpcywgd2UgYXJlIGdvaW5nIHRvIGNvbnZlcnQgaXQgdG8gYSBtZXRob2RcbiAgICAgICAgLy8gY2FsbC5cbiAgICAgICAgaWYgKHR5cGVvZiggY2FsbGJhY2sgKSA9PSBcInN0cmluZ1wiKXtcblxuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgY2FsbGJhY2sgbmFtZSB0byBhIHJlZmVyZW5jZSB0b1xuICAgICAgICAgICAgLy8gdGhlIGNhbGxiYWNrIG9uIHRoZSBzdWJzY3JpYmVyIG9iamVjdC5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlclsgY2FsbGJhY2sgXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHRoaXMgc3Vic2NyaWJlciBmb3IgdGhlIGdpdmVuIGV2ZW50IHR5cGUuLlxuICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXS5wdXNoKHtcbiAgICAgICAgICAgIHN1YnNjcmliZXI6IHN1YnNjcmliZXIsXG4gICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSB1bnN1YnNjcmliZSBleHRlbnNpb25zLiBUaGlzIGFsbG93cyBhXG4gICAgLy8gc3Vic2NyaWJlciB0byB1bmJpbmQgaXRzIHByZXZpb3VzbHktYm91bmQgY2FsbGJhY2suXG4gICAgJC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIGNhbGxiYWNrICl7XG4gICAgICAgIC8vIENoZWNrIHRvIG1ha2Ugc3VyZSB0aGUgZXZlbnQgdHlwZSBjb2xsZWN0aW9uXG4gICAgICAgIC8vIGN1cnJlbnRseSBleGlzdHMuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICEoZXZlbnRUeXBlIGluIHN1YnNjcmlwdGlvbnMpIHx8XG4gICAgICAgICAgICAhc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0ubGVuZ3RoXG4gICAgICAgICAgICApe1xuXG4gICAgICAgICAgICAvLyBSZXR1cm4gb3V0IC0gaWYgdGhlcmUncyBubyBzdWJzY3JpYmVyXG4gICAgICAgICAgICAvLyBjb2xsZWN0aW9uIGZvciB0aGlzIGV2ZW50IHR5cGUsIHRoZXJlJ3NcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgZm9yIHVzIHRvIHVuYmluZC5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFwIHRoZSBjdXJyZW50IHN1YnNjcmlwdGlvbiBjb2xsZWN0aW9uIHRvIGEgbmV3XG4gICAgICAgIC8vIG9uZSB0aGF0IGRvZXNuJ3QgaGF2ZSB0aGUgZ2l2ZW4gY2FsbGJhY2suXG4gICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdID0gJC5tYXAoXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBzdWJzY3JpcHRpb24gKXtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBjYWxsYmFjayBtYXRjaGVzIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9uZSB3ZSBhcmUgdW5zdWJzY3JpYmluZy4gSWYgaXQgZG9lcywgd2VcbiAgICAgICAgICAgICAgICAvLyBhcmUgZ29pbmcgdG8gd2FudCB0byByZW1vdmUgaXQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24uY2FsbGJhY2sgPT0gY2FsbGJhY2spe1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBudWxsIHRvIHJlbW92ZSB0aGlzIG1hdGNoaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGZyb20gdGhlIHN1YnNyaWJlcnMuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiggbnVsbCApO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGdpdmVuIHN1YnNjcmlwdGlvbiB0byBrZWVwXG4gICAgICAgICAgICAgICAgICAgIC8vIGl0IGluIHRoZSBzdWJzY3JpYmVycyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4oIHN1YnNjcmlwdGlvbiApO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgcHVibGlzaCBleHRlbnNpb24uIFRoaXMgdGFrZXMgdGhlXG4gICAgLy8gcHVibGlzaGluZyBvYmplY3QsIHRoZSB0eXBlIG9mIGV2ZW50LCBhbmQgYW55XG4gICAgLy8gYWRkaXRpb25hbCBkYXRhIHRoYXQgbmVlZCB0byBiZSBwdWJsaXNoZWQgd2l0aCB0aGVcbiAgICAvLyBldmVudC5cbiAgICAkLnB1Ymxpc2ggPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBkYXRhICl7XG4gICAgICAgIGRhdGEgPSBkYXRhID8gW2RhdGFdIDogW11cbiAgICAgICAgLy8gTG9vcCBvdmVyIHRoZSBzdWJzcmliZXJzIGZvciB0aGlzIGV2ZW50IHR5cGVcbiAgICAgICAgLy8gYW5kIGludm9rZSB0aGVpciBjYWxsYmFja3MuXG4gICAgICAgICQuZWFjaChcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLFxuICAgICAgICAgICAgZnVuY3Rpb24oIGluZGV4LCBzdWJzY3JpcHRpb24gKXtcblxuICAgICAgICAgICAgICAgIC8vIEludm9rZSB0aGUgY2FsbGJhY2sgaW4gdGhlIHN1YnNjcmlwdGlvblxuICAgICAgICAgICAgICAgIC8vIGNvbnRleHQgYW5kIHN0b3JlIHRoZSByZXN1bHQgb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgaW4gdGhlIGV2ZW50LlxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseSggc3Vic2NyaXB0aW9uLnN1YnNjcmliZXIsIGRhdGEpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBldmVudCBvYmplY3QuIFRoaXMgZXZlbnQgb2JqZWN0IG1heSBoYXZlXG4gICAgICAgIC8vIGJlZW4gYXVnbWVudGVkIGJ5IGFueSBvbmUgb2YgdGhlIHN1YnNyY2liZXJzLlxuICAgICAgICByZXR1cm4oIGV2ZW50ICk7XG4gICAgfTtcblxuXG59KSggalF1ZXJ5ICk7XG5cbiIsIi8qKlxuICogU2NvcmUgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgZmV0Y2hpbmcgaGlnaCBzY29yZXMgYW5kIHN5bmNpbmcgdGhlbSB0byBzZXJ2ZXJcbiAqIEdldCBpbmplY3RlZCB3aXRoIHRoZSBET00gbWFuaXB1bGF0aW9uIGxpYnJhcnlcbiAqL1xuXG52YXIgc2NvcmVNb2RlbCA9IChmdW5jdGlvbihET01saWIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBTdG9yZXMgY3VycmVudFxuICAgICAgICBjdXJyZW50U2NvcmU6IG51bGwsXG5cbiAgICAgICAgLy8gU3RvcmVzIHRoZSBjdXJyZW50IGhpZ2ggc2NvcmVzIHVzaW5nIFwicGxheWVyTmFtZTp2YWx1ZVwiIGZvcm1hdFxuICAgICAgICBoaWdoU2NvcmVzOiBbXSxcblxuICAgICAgICAvLyBSZXR1cm5zIGEgcHJvbWlzZVxuICAgICAgICBmZXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gRE9NbGliLmdldEpTT04oIF9HTE9CQUxTLmJhc2VVUkwgKyBcIi9zY29yZXNcIilcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5fc2V0SGlnaFNjb3Jlcy5iaW5kKHRoaXMpICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04uc3RyaW5naWZ5KHRoaXMuaGlnaFNjb3Jlcyk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcblxuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IFwiZGF0YT1cIiArIGRhdGFcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3JlcyA9IGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNIaWdoU2NvcmU6IGZ1bmN0aW9uKCBzY29yZSApIHtcbiAgICAgICAgICAgIHZhciBsID0gdGhpcy5oaWdoU2NvcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZ2hTY29yZXNbbC0xXSA8PSBzY29yZTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRIaWdoU2NvcmU6IGZ1bmN0aW9uKG5hbWUsIHNjb3JlKSB7XG4gICAgICAgICAgICB2YXIgbmV3U2NvcmUgPSB7XCJuYW1lXCI6IG5hbWUsIFwicG9pbnRzXCI6IHNjb3JlfTtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3Jlcy5sZW5ndGggPiA0ICYmIHRoaXMuaGlnaFNjb3Jlcy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3Jlcy5wdXNoKG5ld1Njb3JlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgIH1cbn0pKCAkICk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NvcmVNb2RlbDtcbiJdfQ==
