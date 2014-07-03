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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlX2M2ZGVlMDNjLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENlbGwgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgYSBzaW5nbGUgY2VsbCBvYmplY3RcbiAqL1xuXG5cbnZhciBjZWxsID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIF9jcmVhdGVDZWxsID0gZnVuY3Rpb24oIGNvbG9yLCBpZCApIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgY29sb3I7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicsIGNvbG9yICk7XG4gICAgICAgIGVsLmlkID0gXCJjZWxsLVwiICsgaWQ7XG5cbiAgICAgICAgJChlbCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIGVsLmNsYXNzTmFtZS5pbmRleE9mKCd0dXJuZWQtb3ZlcicpID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwnO1xuICAgICAgICAgICAgICAgICQucHVibGlzaChcImNlbGxDbGlja2VkXCIsIGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihjb2xvciwgaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBfY3JlYXRlQ2VsbCggY29sb3IsIGlkKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2VsbDtcbiIsIi8qKlxuICogRW50cnkgcG9pbnQgZm9yIHRoZSBicm93c2VyaWZ5IGJ1aWxkIHNjcmlwdFxuICpcbiAqL1xuXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS5qcycpO1xuLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBnYW1lXG5nYW1lLmluaXQoKTtcblxuIiwiLyoqXG4gKiBHYW1lIE9iamVjdFxuICogMSAtIHNlcnZlcyBhcyBnbG9iYWwgc2NvcGUgZm9yOiBjdXJyZW50VGlsZSwgU2NvcmUsIFR1cm5zXG4gKiAyIC0gU3Bhd24gR3JpZFxuICogMyAtIEdlbmVyYXRlIE1lZGlhdG9yIE9iamVjdFxuICogNCAtXG4gKi9cbnZhciBzY29yZXNNb2RlbCA9IHJlcXVpcmUoJy4vc2NvcmUubW9kZWwuanMnKTtcbnZhciBncmlkID0gcmVxdWlyZSgnLi9ncmlkLmpzJyk7XG5yZXF1aXJlKCcuL3B1YlN1Yi5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMuanMnKTtcblxuXG52YXIgZ2FtZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8vIFN0b3JlcyB0aGUgc2NvcmUgcHJpdmF0bHlcbiAgICB2YXIgX3Njb3JlcyA9IG51bGw7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHNjb3JlRGlzcGxheTogbnVsbCxcblxuICAgICAgICBwYWlyRm91bmQ6IDAsXG5cbiAgICAgICAgc2NvcmU6IDAsXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlckV2ZW50cygpO1xuXG4gICAgICAgICAgICAvLyBTdG9yZSBET00gZWxlbWVudHNcbiAgICAgICAgICAgIHRoaXMuc2NvcmVEaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlLWNvdW50Jyk7XG5cbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIHJhbmRvbSBjb2xvciBncmlkXG4gICAgICAgICAgICBncmlkLmluaXQoKTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggdGhlIHNjb3Jlc1xuICAgICAgICAgICAgIHNjb3Jlc01vZGVsLmZldGNoKClcbiAgICAgICAgICAgICAgICAudGhlbih0aGlzLl9wb3B1bGF0ZVNjb3JlcyApXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuc3RhcnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3RlckV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlSW5jXCIsIHNlbGYsIHNlbGYuX3Njb3JlQWRkT25lICk7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlRGVjXCIsIHNlbGYsIHNlbGYuX3Njb3JlUmVtb3ZlT25lICk7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInBhaXJGb3VuZFwiLCBzZWxmLCBzZWxmLl9wYWlyRm91bmRDQiApO1xuXG4gICAgICAgICAgICAkKCcjcmVzdGFydCcpLmNsaWNrKCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Jlc3RhcnRHYW1lKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cuX0dMT0JBTFMuZGVidWcgJiYgY29uc29sZS5sb2coJ0dBTUUgU1RBUlRJTkcnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcG9wdWxhdGVTY29yZXM6IGZ1bmN0aW9uKCBzY29yZXMgKSB7XG4gICAgICAgICAgICBfc2NvcmVzID0gc2NvcmVzO1xuICAgICAgICAgICAgdmFyIGh0bWwgPSBcIlwiO1xuICAgICAgICAgICAgd2luZG93Ll9HTE9CQUxTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdQT1BVTEFURSBTQ09SRVMnKTtcbiAgICAgICAgICAgIGZvciggdmFyIG5hbWUgaW4gX3Njb3JlcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgcHRzID0gX3Njb3Jlc1tuYW1lXTtcbiAgICAgICAgICAgICAgICBodG1sICs9ICc8cD4nICsgbmFtZSArICc6ICcgKyBwdHMgKyAnIHBvaW50JztcbiAgICAgICAgICAgICAgICBodG1sICs9IHB0cyA+IDEgPyAncyA8L3A+JyA6ICc8L3A+JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBoaWdoU2NvcmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpZ2gtc2NvcmVzJyk7XG4gICAgICAgICAgICBoaWdoU2NvcmVzLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3BhaXJGb3VuZENCOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMucGFpckZvdW5kICsrO1xuICAgICAgICAgICAgdGhpcy5wYWlyRm91bmQgPT09IDggJiYgdGhpcy5fZ2FtZUNvbXBsZXRlZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZXN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG4gICAgICAgICAgICAkKCcuY2VsbCcpLmFkZENsYXNzKFwidHVybmVkLW92ZXJcIik7XG4gICAgICAgICAgICAkLnB1Ymxpc2goJ2dhbWVSZXN0YXJ0Jyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3Njb3JlQWRkT25lOiBmdW5jdGlvbiggcG9pbnQgKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlICsrO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVSZW1vdmVPbmU6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmUgIT09IDAgJiYgdGhpcy5zY29yZS0tO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgX3JlZnJlc2hTY29yZURpc3BsYXk6IGZ1bmN0aW9uKCBzY29yZSApIHtcbiAgICAgICAgICAgIHNjb3JlID0gc2NvcmUgfHwgMDtcbiAgICAgICAgICAgIHRoaXMuc2NvcmVEaXNwbGF5LmlubmVyVGV4dCA9IHNjb3JlO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nYW1lQ29tcGxldGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBuZXdHYW1lID0gY29uZmlybSgnV2VsbCBkb25lIFNpciFcXG4gRG8geW91IHdhbm5hIGdvIGFnYWluPycpO1xuICAgICAgICAgICAgbmV3R2FtZSAmJiB0aGlzLl9yZXN0YXJ0R2FtZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9pc0hpZ2hTY29yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfc2NvcmVzLmlzSGlnaFNjb3JlKHRoaXMuc2NvcmUpICYmIHRoaXMuX25ld0hpZ2hTY29yZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9uZXdIaWdoU2NvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG5hbWUgPSBwcm9tcHQoXCJDb25ncmF0cywgeW91IGhhdmUgbWFkZSBpdCB0byB0aGUgaGlnaCBzY29yZS5cXG4gUGxlYXNlIGVudGVyIHlvdXIgbmFtZVwiLCBcIkdhbmRhbGZcIik7XG4gICAgICAgICAgICBfc2NvcmVzXG4gICAgICAgICAgICAgICAgLmFkZEhpZ2hTY29yZShuYW1lLCB0aGlzLnNjb3JlKVxuICAgICAgICAgICAgICAgIC5zYXZlKClcbiAgICAgICAgICAgICAgICAuX3BvcHVsYXRlU2NvcmVzKCk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lO1xuIiwiLyoqXG4gKiBHcmlkIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIHRoZSBncmlkIGZyb20gYSBjb25maWd1cmF0aW9uIG9iamVjdFxuICovXG5cbi8vIENvbmZpZ3VyYXRpb24gT2JqZWN0XG52YXIgY29uZmlnID0ge1xuICAgIFwic2l6ZVwiOiA0LFxuICAgIFwiY29sb3JzXCI6IFsgXCJERDIzMkRcIiwgXCJFMERDMkVcIiwgXCI0NkU2MkRcIiwgXCIzN0U0QjdcIiwgXCIzMDc5RTBcIiwgXCI1QTFBRTBcIiwgXCJGQjE4RDZcIiwgXCJGQjQyMUJcIiBdXG59O1xuXG52YXIgY2VsbCA9IHJlcXVpcmUoJy4vY2VsbC5qcycpO1xuXG52YXIgdGltZW91dElEID0gbnVsbDtcblxudmFyIGdyaWQgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBfZ2V0U2h1ZmZlbGVkQ29sb3JzID0gZnVuY3Rpb24oIGNvbG9ycyApIHtcbiAgICAgICAgdmFyIHNodWZmZWxlZENvbG9ycyA9IFtdO1xuICAgICAgICBjb2xvcnMgPSBjb2xvcnMuY29uY2F0KCBjb2xvcnMuc2xpY2UoKSApO1xuICAgICAgICB2YXIgbGVuZ3RoID0gY29sb3JzLmxlbmd0aDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIHJhbmQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAgbGVuZ3RoKTtcbiAgICAgICAgICAgIHNodWZmZWxlZENvbG9ycy5wdXNoKGNvbG9ycy5zcGxpY2UocmFuZCwgMSlbMF0pO1xuICAgICAgICAgICAgbGVuZ3RoID0gY29sb3JzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIGxlbmd0aCE9IDAgKVxuICAgICAgICByZXR1cm4gc2h1ZmZlbGVkQ29sb3JzO1xuICAgIH07XG5cbiAgICBfZ2VuZXJhdGVHcmlkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb2xvcnMgPSBfZ2V0U2h1ZmZlbGVkQ29sb3JzKCBjb25maWcuY29sb3JzICk7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZ3RoID0gY29sb3JzLmxlbmd0aCA7IGkgPCBsZ3RoIDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3VyckNlbGwgPSBjZWxsLmNyZWF0ZSggY29sb3JzW2ldLCBpKzEgKTtcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKCBjdXJyQ2VsbCApO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGN1cnJlbnRDZWxsOiBudWxsLFxuXG4gICAgICAgIGZsaXBwZWRDZWxsOiBudWxsLFxuXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3Rlckxpc3RlbmVycygpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2dhbWUtYm9hcmQnIClcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZENoaWxkKCBfZ2VuZXJhdGVHcmlkKCkgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVnaXN0ZXJMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICQuc3Vic2NyaWJlKFwiY2VsbENsaWNrZWRcIiwgdGhpcywgdGhpcy5fY2VsbENsaWNrZWRDQik7XG4gICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJnYW1lUmVzdGFydFwiLCB0aGlzLCB0aGlzLl9nYW1lUmVzdGFydCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dhbWVSZXN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENlbGwgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jbGVhckN1cnJlbnRNb3ZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgfSxcblxuICAgICAgICBfY2VsbENsaWNrZWRDQjogZnVuY3Rpb24oIGNlbGwgKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgIC8vIElmIHRpbWVvdXQgYWxyZWFkeSBleGlzdCB0aGVuIHdlIG5lZWQgdG8gcmVzZXQgdGhlIHBhc3QgbW92ZVxuICAgICAgICAgICAgdGltZW91dElEICYmIHNlbGYuX2NhbmNlbE1vdmVzKCk7XG5cbiAgICAgICAgICAgIHNlbGYuY3VycmVudENlbGwgPSBjZWxsO1xuXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmxpcHBlZENlbGwgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAgc2VsZi5mbGlwcGVkQ2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLnB1Ymxpc2goXCJzY29yZUluY1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQucHVibGlzaChcInBhaXJGb3VuZFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRJRCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9jYW5jZWxNb3ZlcygpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBjZWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9jYW5jZWxNb3ZlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDZWxsLmNsYXNzTmFtZSA9IHRoaXMuZmxpcHBlZENlbGwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICAgICAgJC5wdWJsaXNoKFwic2NvcmVEZWNcIik7XG4gICAgICAgICAgICB0aGlzLmZsaXBwZWRDZWxsID0gdGhpcy5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgICAgICB0aW1lb3V0SUQgJiYgd2luZG93LmNsZWFyVGltZW91dCh0aW1lb3V0SUQpO1xuICAgICAgICAgICAgdGltZW91dElEID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ3JpZDtcbiIsImlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGVcIik7XG4gICAgfVxuXG4gICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLCBcbiAgICAgICAgZk5PUCA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1AgJiYgb1RoaXNcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cblxuIiwiLy8gQmFzZWQgb2YgaHR0cDovL3d3dy5iZW5uYWRlbC5jb20vYmxvZy8yMDM3LXNpbXBsZS1wdWJsaWNhdGlvbi1hbmQtc3Vic2NyaXB0aW9uLWZ1bmN0aW9uYWxpdHktcHViLXN1Yi13aXRoLWpxdWVyeS5odG1cblxuLy8gRGVmaW5lIHRoZSBwdWJsaXNoIGFuZCBzdWJzY3JpYmUgalF1ZXJ5IGV4dGVuc2lvbnMuXG4vLyBUaGVzZSB3aWxsIGFsbG93IGZvciBwdWItc3ViIHdpdGhvdXQgdGhlIG92ZXJoZWFkXG4vLyBvZiBET00tcmVsYXRlZCBldmVudGluZy5cbihmdW5jdGlvbiggJCApe1xuXG4gICAgLy8gQ3JlYXRlIGEgY29sbGVjdGlvbiBvZiBzdWJzY3JpcHRpb25zIHdoaWNoIGFyZSBqdXN0IGFcbiAgICAvLyBjb21iaW5hdGlvbiBvZiBldmVudCB0eXBlcyBhbmQgZXZlbnQgY2FsbGJhY2tzXG4gICAgLy8gdGhhdCBjYW4gYmUgYWxlcnRlZCB0byBwdWJsaXNoZWQgZXZlbnRzLlxuICAgIHZhciBzdWJzY3JpcHRpb25zID0ge307XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaWJlIGV4dGVuc2lvbnMuIFRoaXMgd2lsbCB0YWtlIHRoZVxuICAgIC8vIHN1YnNjcmliZXIgKGNvbnRleHQgZm9yIGNhbGxiYWNrIGV4ZWN1dGlvbiksIHRoZVxuICAgIC8vIGV2ZW50IHR5cGUsIGFuZCBhIGNhbGxiYWNrIHRvIGV4ZWN1dGUuXG4gICAgJC5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBzdWJzY3JpYmVyLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBldmVudCB0eXBlIGhhcyBhIGNvbGxlY3Rpb25cbiAgICAgICAgLy8gb2Ygc3Vic2NyaWJlcnMgeWV0LlxuICAgICAgICBpZiAoIShldmVudFR5cGUgaW4gc3Vic2NyaXB0aW9ucykpe1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9IFtdO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHR5cGUgb2YgY2FsbGJhY2sgaXMgYSBzdHJpbmcuXG4gICAgICAgIC8vIElmIGl0IGlzLCB3ZSBhcmUgZ29pbmcgdG8gY29udmVydCBpdCB0byBhIG1ldGhvZFxuICAgICAgICAvLyBjYWxsLlxuICAgICAgICBpZiAodHlwZW9mKCBjYWxsYmFjayApID09IFwic3RyaW5nXCIpe1xuXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBjYWxsYmFjayBuYW1lIHRvIGEgcmVmZXJlbmNlIHRvXG4gICAgICAgICAgICAvLyB0aGUgY2FsbGJhY2sgb24gdGhlIHN1YnNjcmliZXIgb2JqZWN0LlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyWyBjYWxsYmFjayBdO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhpcyBzdWJzY3JpYmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQgdHlwZS4uXG4gICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLnB1c2goe1xuICAgICAgICAgICAgc3Vic2NyaWJlcjogc3Vic2NyaWJlcixcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHVuc3Vic2NyaWJlIGV4dGVuc2lvbnMuIFRoaXMgYWxsb3dzIGFcbiAgICAvLyBzdWJzY3JpYmVyIHRvIHVuYmluZCBpdHMgcHJldmlvdXNseS1ib3VuZCBjYWxsYmFjay5cbiAgICAkLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgY2FsbGJhY2sgKXtcbiAgICAgICAgLy8gQ2hlY2sgdG8gbWFrZSBzdXJlIHRoZSBldmVudCB0eXBlIGNvbGxlY3Rpb25cbiAgICAgICAgLy8gY3VycmVudGx5IGV4aXN0cy5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIShldmVudFR5cGUgaW4gc3Vic2NyaXB0aW9ucykgfHxcbiAgICAgICAgICAgICFzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXS5sZW5ndGhcbiAgICAgICAgICAgICl7XG5cbiAgICAgICAgICAgIC8vIFJldHVybiBvdXQgLSBpZiB0aGVyZSdzIG5vIHN1YnNjcmliZXJcbiAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZSwgdGhlcmUnc1xuICAgICAgICAgICAgLy8gbm90aGluZyBmb3IgdXMgdG8gdW5iaW5kLlxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYXAgdGhlIGN1cnJlbnQgc3Vic2NyaXB0aW9uIGNvbGxlY3Rpb24gdG8gYSBuZXdcbiAgICAgICAgLy8gb25lIHRoYXQgZG9lc24ndCBoYXZlIHRoZSBnaXZlbiBjYWxsYmFjay5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0gPSAkLm1hcChcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLFxuICAgICAgICAgICAgZnVuY3Rpb24oIHN1YnNjcmlwdGlvbiApe1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGNhbGxiYWNrIG1hdGNoZXMgdGhlXG4gICAgICAgICAgICAgICAgLy8gb25lIHdlIGFyZSB1bnN1YnNjcmliaW5nLiBJZiBpdCBkb2VzLCB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBnb2luZyB0byB3YW50IHRvIHJlbW92ZSBpdCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbi5jYWxsYmFjayA9PSBjYWxsYmFjayl7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIG51bGwgdG8gcmVtb3ZlIHRoaXMgbWF0Y2hpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgZnJvbSB0aGUgc3Vic3JpYmVycy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBudWxsICk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgZ2l2ZW4gc3Vic2NyaXB0aW9uIHRvIGtlZXBcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaW4gdGhlIHN1YnNjcmliZXJzIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiggc3Vic2NyaXB0aW9uICk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBwdWJsaXNoIGV4dGVuc2lvbi4gVGhpcyB0YWtlcyB0aGVcbiAgICAvLyBwdWJsaXNoaW5nIG9iamVjdCwgdGhlIHR5cGUgb2YgZXZlbnQsIGFuZCBhbnlcbiAgICAvLyBhZGRpdGlvbmFsIGRhdGEgdGhhdCBuZWVkIHRvIGJlIHB1Ymxpc2hlZCB3aXRoIHRoZVxuICAgIC8vIGV2ZW50LlxuICAgICQucHVibGlzaCA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIGRhdGEgKXtcbiAgICAgICAgZGF0YSA9IGRhdGEgPyBbZGF0YV0gOiBbXVxuICAgICAgICAvLyBMb29wIG92ZXIgdGhlIHN1YnNyaWJlcnMgZm9yIHRoaXMgZXZlbnQgdHlwZVxuICAgICAgICAvLyBhbmQgaW52b2tlIHRoZWlyIGNhbGxiYWNrcy5cbiAgICAgICAgJC5lYWNoKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggaW5kZXgsIHN1YnNjcmlwdGlvbiApe1xuXG4gICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSBjYWxsYmFjayBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgLy8gY29udGV4dCBhbmQgc3RvcmUgdGhlIHJlc3VsdCBvZiB0aGVcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBpbiB0aGUgZXZlbnQuXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KCBzdWJzY3JpcHRpb24uc3Vic2NyaWJlciwgZGF0YSk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGV2ZW50IG9iamVjdC4gVGhpcyBldmVudCBvYmplY3QgbWF5IGhhdmVcbiAgICAgICAgLy8gYmVlbiBhdWdtZW50ZWQgYnkgYW55IG9uZSBvZiB0aGUgc3Vic3JjaWJlcnMuXG4gICAgICAgIHJldHVybiggZXZlbnQgKTtcbiAgICB9O1xuXG5cbn0pKCBqUXVlcnkgKTtcblxuIiwiLyoqXG4gKiBTY29yZSBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBmZXRjaGluZyBoaWdoIHNjb3JlcyBhbmQgc3luY2luZyB0aGVtIHRvIHNlcnZlclxuICogR2V0IGluamVjdGVkIHdpdGggdGhlIERPTSBtYW5pcHVsYXRpb24gbGlicmFyeVxuICovXG5cbnZhciBzY29yZU1vZGVsID0gKGZ1bmN0aW9uKERPTWxpYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFN0b3JlcyBjdXJyZW50XG4gICAgICAgIGN1cnJlbnRTY29yZTogbnVsbCxcblxuICAgICAgICAvLyBTdG9yZXMgdGhlIGN1cnJlbnQgaGlnaCBzY29yZXMgdXNpbmcgXCJwbGF5ZXJOYW1lOnZhbHVlXCIgZm9ybWF0XG4gICAgICAgIGhpZ2hTY29yZToge1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFJldHVybnMgYSBwcm9taXNlXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBET01saWIuZ2V0SlNPTiggX0dMT0JBTFMuYmFzZVVSTCArIFwiL3Njb3Jlc1wiKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9zZXRIaWdoU2NvcmVzICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gRE9NbGliLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUFVUXCIsXG4gICAgICAgICAgICAgICAgICAgIHVybDogX0dMT0JBTFMuYmFzZVVSTCArIFwiL3Njb3Jlc1wiLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0aGlzLmhpZ2hTY29yZVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmUgPSBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gQFRPRE8gRGVhbCB3aXRoIGNhc2Ugd2hlcmUgbmV3IHNjb3JlIGlzIGVxdWFsIHRvIGxvd2VyIGhpZ2ggc2NvcmUuXG4gICAgICAgIF9pc0hpZ2hTY29yZTogZnVuY3Rpb24oIHNjb3JlICkge1xuICAgICAgICAgICAgdmFyIHNtYWxsZXIgPSA4O1xuICAgICAgICAgICAgZm9yKCB2YXIgbmFtZSBpbiB0aGlzLmhpZ2hTY29yZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IHRoaXMuaGlnaFNjb3JlW25hbWVdO1xuICAgICAgICAgICAgICAgIGlmICggcyA8IHNjb3JlICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cblxuICAgICAgICBhZGRIaWdoU2NvcmU6IGZ1bmN0aW9uKG5hbWUsIHNjb3JlKSB7XG4gICAgICAgICAgICB0aGlzLmhpZ2hTY29yZS5wdXNoKHsgbmFtZTogc2NvcmUgfSk7XG4gICAgICAgICAgICB0aGlzLl9kZWxldGVTbWFsbGVzdCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9kZWxldGVTbWFsbGVzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc21hbGxlciA9IDg7XG4gICAgICAgICAgICB2YXIgc21hbGxlck5hbWUgPSBudWxsO1xuICAgICAgICAgICAgZm9yKCB2YXIgbmFtZSBpbiB0aGlzLmhpZ2hTY29yZSApIHtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IHRoaXMuaGlnaFNjb3JlW25hbWVdO1xuICAgICAgICAgICAgICAgIGlmICggcyA8IHNtYWxsZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNtYWxsZXIgPSBzO1xuICAgICAgICAgICAgICAgICAgICBzbWFsbGVyTmFtZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgLy8gSW4gY2FzZSBvZiBlcXVhbGl0eSB3ZSdsbCByZW1vdmUgdGhlIG5pZ2h0IHRoYXQgaXMgdGhlIGhpZ2hlciBpbiB0aGUgYWxwaGFiZXRcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYoIHMgPT09IHNtYWxsZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgICBzbWFsbGVyTmFtZSA9IG5hbWUgPj0gc21hbGxlck5hbWUgPyBuYW1lIDogc21hbGxlck5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuaGlnaFNjb3JlW3NtYWxsZXJOYW1lXTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCAkICk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NvcmVNb2RlbDtcbiJdfQ==
