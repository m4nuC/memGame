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

        score: 0,

        init: function() {
            this._registerEvents();

            // Store the score display el
            this.scoreDisplay = document.getElementById('score-count');

            // Init the grid
            grid.init();

            // Fetch the scores
             _scores = scoresModel.fetch();

            // Once Initial Scores are fetched start the game
            _scores.then( this.start );

        },

        start: function() {
            window._GLOBALS.debug && console.log('GAME STARTING');
        },

        _registerEvents: function() {
            var self = this;
            $.subscribe("scoreInc", self, self._scoreAddOne );
            $.subscribe("scoreDec", self, self._scoreRemoveOne );
            $('#restart').click( function(e) {
                e.preventDefault();
                self._restartGame();
            });
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
            timeoutID && self._cancelMoves() && window.clearTimeout(timeoutID);

            self.currentCell = cell;

            if ( self.flippedCell ) {
                if (  self.flippedCell.getAttribute('data-color') ===
                        cell.getAttribute('data-color') ) {
                        $.publish("scoreInc");
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
            //
        },

        _setHighScores: function( data ) {
            this.highScore = data
        }
    }
})( $ );

module.exports = scoreModel;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlX2U1MWUyOGM2LmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENlbGwgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgYSBzaW5nbGUgY2VsbCBvYmplY3RcbiAqL1xuXG5cbnZhciBjZWxsID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIF9jcmVhdGVDZWxsID0gZnVuY3Rpb24oIGNvbG9yLCBpZCApIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgY29sb3I7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicsIGNvbG9yICk7XG4gICAgICAgIGVsLmlkID0gXCJjZWxsLVwiICsgaWQ7XG5cbiAgICAgICAgJChlbCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIGVsLmNsYXNzTmFtZS5pbmRleE9mKCd0dXJuZWQtb3ZlcicpID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwnO1xuICAgICAgICAgICAgICAgICQucHVibGlzaChcImNlbGxDbGlja2VkXCIsIGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihjb2xvciwgaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBfY3JlYXRlQ2VsbCggY29sb3IsIGlkKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2VsbDtcbiIsIi8qKlxuICogRW50cnkgcG9pbnQgZm9yIHRoZSBicm93c2VyaWZ5IGJ1aWxkIHNjcmlwdFxuICpcbiAqL1xuXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS5qcycpO1xuLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBnYW1lXG5nYW1lLmluaXQoKTtcblxuIiwiLyoqXG4gKiBHYW1lIE9iamVjdFxuICogMSAtIHNlcnZlcyBhcyBnbG9iYWwgc2NvcGUgZm9yOiBjdXJyZW50VGlsZSwgU2NvcmUsIFR1cm5zXG4gKiAyIC0gU3Bhd24gR3JpZFxuICogMyAtIEdlbmVyYXRlIE1lZGlhdG9yIE9iamVjdFxuICogNCAtXG4gKi9cbnZhciBzY29yZXNNb2RlbCA9IHJlcXVpcmUoJy4vc2NvcmUubW9kZWwuanMnKTtcbnZhciBncmlkID0gcmVxdWlyZSgnLi9ncmlkLmpzJyk7XG5yZXF1aXJlKCcuL3B1YlN1Yi5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMuanMnKTtcblxuXG52YXIgZ2FtZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8vIFN0b3JlcyB0aGUgc2NvcmUgcHJpdmF0bHlcbiAgICB2YXIgX3Njb3JlcyA9IG51bGw7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHNjb3JlRGlzcGxheTogbnVsbCxcblxuICAgICAgICBzY29yZTogMCxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyRXZlbnRzKCk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBzY29yZSBkaXNwbGF5IGVsXG4gICAgICAgICAgICB0aGlzLnNjb3JlRGlzcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY29yZS1jb3VudCcpO1xuXG4gICAgICAgICAgICAvLyBJbml0IHRoZSBncmlkXG4gICAgICAgICAgICBncmlkLmluaXQoKTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggdGhlIHNjb3Jlc1xuICAgICAgICAgICAgIF9zY29yZXMgPSBzY29yZXNNb2RlbC5mZXRjaCgpO1xuXG4gICAgICAgICAgICAvLyBPbmNlIEluaXRpYWwgU2NvcmVzIGFyZSBmZXRjaGVkIHN0YXJ0IHRoZSBnYW1lXG4gICAgICAgICAgICBfc2NvcmVzLnRoZW4oIHRoaXMuc3RhcnQgKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5fR0xPQkFMUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnR0FNRSBTVEFSVElORycpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3RlckV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlSW5jXCIsIHNlbGYsIHNlbGYuX3Njb3JlQWRkT25lICk7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlRGVjXCIsIHNlbGYsIHNlbGYuX3Njb3JlUmVtb3ZlT25lICk7XG4gICAgICAgICAgICAkKCcjcmVzdGFydCcpLmNsaWNrKCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Jlc3RhcnRHYW1lKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVzdGFydEdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSA9IDA7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICAgICAgJCgnLmNlbGwnKS5hZGRDbGFzcyhcInR1cm5lZC1vdmVyXCIpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAkLnB1Ymxpc2goJ2dhbWVSZXN0YXJ0Jyk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVBZGRPbmU6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmUgKys7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3Njb3JlUmVtb3ZlT25lOiBmdW5jdGlvbiggcG9pbnQgKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlICE9PSAwICYmIHRoaXMuc2NvcmUtLTtcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG4gICAgICAgICB9LFxuXG4gICAgICAgIF9yZWZyZXNoU2NvcmVEaXNwbGF5OiBmdW5jdGlvbiggc2NvcmUgKSB7XG4gICAgICAgICAgICBzY29yZSA9IHNjb3JlIHx8IDA7XG4gICAgICAgICAgICB0aGlzLnNjb3JlRGlzcGxheS5pbm5lclRleHQgPSBzY29yZTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWU7XG4iLCIvKipcbiAqIEdyaWQgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgdGhlIGdyaWQgZnJvbSBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKi9cblxuLy8gQ29uZmlndXJhdGlvbiBPYmplY3RcbnZhciBjb25maWcgPSB7XG4gICAgXCJzaXplXCI6IDQsXG4gICAgXCJjb2xvcnNcIjogWyBcIkREMjMyRFwiLCBcIkUwREMyRVwiLCBcIjQ2RTYyRFwiLCBcIjM3RTRCN1wiLCBcIjMwNzlFMFwiLCBcIjVBMUFFMFwiLCBcIkZCMThENlwiLCBcIkZCNDIxQlwiIF1cbn07XG5cbnZhciBjZWxsID0gcmVxdWlyZSgnLi9jZWxsLmpzJyk7XG5cbnZhciB0aW1lb3V0SUQgPSBudWxsO1xuXG52YXIgZ3JpZCA9IChmdW5jdGlvbigpIHtcblxuICAgIF9nZXRTaHVmZmVsZWRDb2xvcnMgPSBmdW5jdGlvbiggY29sb3JzICkge1xuICAgICAgICB2YXIgc2h1ZmZlbGVkQ29sb3JzID0gW107XG4gICAgICAgIGNvbG9ycyA9IGNvbG9ycy5jb25jYXQoIGNvbG9ycy5zbGljZSgpICk7XG4gICAgICAgIHZhciBsZW5ndGggPSBjb2xvcnMubGVuZ3RoO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgcmFuZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICBsZW5ndGgpO1xuICAgICAgICAgICAgc2h1ZmZlbGVkQ29sb3JzLnB1c2goY29sb3JzLnNwbGljZShyYW5kLCAxKVswXSk7XG4gICAgICAgICAgICBsZW5ndGggPSBjb2xvcnMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICggbGVuZ3RoIT0gMCApXG4gICAgICAgIHJldHVybiBzaHVmZmVsZWRDb2xvcnM7XG4gICAgfTtcblxuICAgIF9nZW5lcmF0ZUdyaWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbG9ycyA9IF9nZXRTaHVmZmVsZWRDb2xvcnMoIGNvbmZpZy5jb2xvcnMgKTtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxndGggPSBjb2xvcnMubGVuZ3RoIDsgaSA8IGxndGggOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjdXJyQ2VsbCA9IGNlbGwuY3JlYXRlKCBjb2xvcnNbaV0sIGkrMSApO1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoIGN1cnJDZWxsICk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3VycmVudENlbGw6IG51bGwsXG5cbiAgICAgICAgZmxpcHBlZENlbGw6IG51bGwsXG5cblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZ2FtZS1ib2FyZCcgKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kQ2hpbGQoIF9nZW5lcmF0ZUdyaWQoKSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3Rlckxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJjZWxsQ2xpY2tlZFwiLCB0aGlzLCB0aGlzLl9jZWxsQ2xpY2tlZENCKTtcbiAgICAgICAgICAgICAkLnN1YnNjcmliZShcImdhbWVSZXN0YXJ0XCIsIHRoaXMsIHRoaXMuX2dhbWVSZXN0YXJ0KTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2FtZVJlc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NsZWFyQ3VycmVudE1vdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jZWxsQ2xpY2tlZENCOiBmdW5jdGlvbiggY2VsbCApIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgLy8gSWYgdGltZW91dCBhbHJlYWR5IGV4aXN0IHRoZW4gd2UgbmVlZCB0byByZXNldCB0aGUgcGFzdCBtb3ZlXG4gICAgICAgICAgICB0aW1lb3V0SUQgJiYgc2VsZi5fY2FuY2VsTW92ZXMoKSAmJiB3aW5kb3cuY2xlYXJUaW1lb3V0KHRpbWVvdXRJRCk7XG5cbiAgICAgICAgICAgIHNlbGYuY3VycmVudENlbGwgPSBjZWxsO1xuXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmxpcHBlZENlbGwgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAgc2VsZi5mbGlwcGVkQ2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLnB1Ymxpc2goXCJzY29yZUluY1wiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRJRCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9jYW5jZWxNb3ZlcygpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBjZWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9jYW5jZWxNb3ZlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDZWxsLmNsYXNzTmFtZSA9IHRoaXMuZmxpcHBlZENlbGwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICAgICAgJC5wdWJsaXNoKFwic2NvcmVEZWNcIik7XG4gICAgICAgICAgICB0aGlzLmZsaXBwZWRDZWxsID0gdGhpcy5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgICAgICB0aW1lb3V0SUQgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBncmlkO1xuIiwiaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsIFxuICAgICAgICBmTk9QID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUCAmJiBvVGhpc1xuICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgOiBvVGhpcyxcbiAgICAgICAgICAgICAgICAgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfTtcblxuICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuXG4iLCIvLyBCYXNlZCBvZiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzIwMzctc2ltcGxlLXB1YmxpY2F0aW9uLWFuZC1zdWJzY3JpcHRpb24tZnVuY3Rpb25hbGl0eS1wdWItc3ViLXdpdGgtanF1ZXJ5Lmh0bVxuXG4vLyBEZWZpbmUgdGhlIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSBqUXVlcnkgZXh0ZW5zaW9ucy5cbi8vIFRoZXNlIHdpbGwgYWxsb3cgZm9yIHB1Yi1zdWIgd2l0aG91dCB0aGUgb3ZlcmhlYWRcbi8vIG9mIERPTS1yZWxhdGVkIGV2ZW50aW5nLlxuKGZ1bmN0aW9uKCAkICl7XG5cbiAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIG9mIHN1YnNjcmlwdGlvbnMgd2hpY2ggYXJlIGp1c3QgYVxuICAgIC8vIGNvbWJpbmF0aW9uIG9mIGV2ZW50IHR5cGVzIGFuZCBldmVudCBjYWxsYmFja3NcbiAgICAvLyB0aGF0IGNhbiBiZSBhbGVydGVkIHRvIHB1Ymxpc2hlZCBldmVudHMuXG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB7fTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBzdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyB3aWxsIHRha2UgdGhlXG4gICAgLy8gc3Vic2NyaWJlciAoY29udGV4dCBmb3IgY2FsbGJhY2sgZXhlY3V0aW9uKSwgdGhlXG4gICAgLy8gZXZlbnQgdHlwZSwgYW5kIGEgY2FsbGJhY2sgdG8gZXhlY3V0ZS5cbiAgICAkLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIHN1YnNjcmliZXIsIGNhbGxiYWNrICl7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGV2ZW50IHR5cGUgaGFzIGEgY29sbGVjdGlvblxuICAgICAgICAvLyBvZiBzdWJzY3JpYmVycyB5ZXQuXG4gICAgICAgIGlmICghKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSl7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZS5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdID0gW107XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdHlwZSBvZiBjYWxsYmFjayBpcyBhIHN0cmluZy5cbiAgICAgICAgLy8gSWYgaXQgaXMsIHdlIGFyZSBnb2luZyB0byBjb252ZXJ0IGl0IHRvIGEgbWV0aG9kXG4gICAgICAgIC8vIGNhbGwuXG4gICAgICAgIGlmICh0eXBlb2YoIGNhbGxiYWNrICkgPT0gXCJzdHJpbmdcIil7XG5cbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGNhbGxiYWNrIG5hbWUgdG8gYSByZWZlcmVuY2UgdG9cbiAgICAgICAgICAgIC8vIHRoZSBjYWxsYmFjayBvbiB0aGUgc3Vic2NyaWJlciBvYmplY3QuXG4gICAgICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJbIGNhbGxiYWNrIF07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGlzIHN1YnNjcmliZXIgZm9yIHRoZSBnaXZlbiBldmVudCB0eXBlLi5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0ucHVzaCh7XG4gICAgICAgICAgICBzdWJzY3JpYmVyOiBzdWJzY3JpYmVyLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgdW5zdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyBhbGxvd3MgYVxuICAgIC8vIHN1YnNjcmliZXIgdG8gdW5iaW5kIGl0cyBwcmV2aW91c2x5LWJvdW5kIGNhbGxiYWNrLlxuICAgICQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBtYWtlIHN1cmUgdGhlIGV2ZW50IHR5cGUgY29sbGVjdGlvblxuICAgICAgICAvLyBjdXJyZW50bHkgZXhpc3RzLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSB8fFxuICAgICAgICAgICAgIXN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLmxlbmd0aFxuICAgICAgICAgICAgKXtcblxuICAgICAgICAgICAgLy8gUmV0dXJuIG91dCAtIGlmIHRoZXJlJ3Mgbm8gc3Vic2NyaWJlclxuICAgICAgICAgICAgLy8gY29sbGVjdGlvbiBmb3IgdGhpcyBldmVudCB0eXBlLCB0aGVyZSdzXG4gICAgICAgICAgICAvLyBub3RoaW5nIGZvciB1cyB0byB1bmJpbmQuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hcCB0aGUgY3VycmVudCBzdWJzY3JpcHRpb24gY29sbGVjdGlvbiB0byBhIG5ld1xuICAgICAgICAvLyBvbmUgdGhhdCBkb2Vzbid0IGhhdmUgdGhlIGdpdmVuIGNhbGxiYWNrLlxuICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9ICQubWFwKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggc3Vic2NyaXB0aW9uICl7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgY2FsbGJhY2sgbWF0Y2hlcyB0aGVcbiAgICAgICAgICAgICAgICAvLyBvbmUgd2UgYXJlIHVuc3Vic2NyaWJpbmcuIElmIGl0IGRvZXMsIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGdvaW5nIHRvIHdhbnQgdG8gcmVtb3ZlIGl0IGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uLmNhbGxiYWNrID09IGNhbGxiYWNrKXtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gbnVsbCB0byByZW1vdmUgdGhpcyBtYXRjaGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBmcm9tIHRoZSBzdWJzcmliZXJzLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4oIG51bGwgKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBnaXZlbiBzdWJzY3JpcHRpb24gdG8ga2VlcFxuICAgICAgICAgICAgICAgICAgICAvLyBpdCBpbiB0aGUgc3Vic2NyaWJlcnMgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBzdWJzY3JpcHRpb24gKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHB1Ymxpc2ggZXh0ZW5zaW9uLiBUaGlzIHRha2VzIHRoZVxuICAgIC8vIHB1Ymxpc2hpbmcgb2JqZWN0LCB0aGUgdHlwZSBvZiBldmVudCwgYW5kIGFueVxuICAgIC8vIGFkZGl0aW9uYWwgZGF0YSB0aGF0IG5lZWQgdG8gYmUgcHVibGlzaGVkIHdpdGggdGhlXG4gICAgLy8gZXZlbnQuXG4gICAgJC5wdWJsaXNoID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgZGF0YSApe1xuICAgICAgICBkYXRhID0gZGF0YSA/IFtkYXRhXSA6IFtdXG4gICAgICAgIC8vIExvb3Agb3ZlciB0aGUgc3Vic3JpYmVycyBmb3IgdGhpcyBldmVudCB0eXBlXG4gICAgICAgIC8vIGFuZCBpbnZva2UgdGhlaXIgY2FsbGJhY2tzLlxuICAgICAgICAkLmVhY2goXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBpbmRleCwgc3Vic2NyaXB0aW9uICl7XG5cbiAgICAgICAgICAgICAgICAvLyBJbnZva2UgdGhlIGNhbGxiYWNrIGluIHRoZSBzdWJzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAvLyBjb250ZXh0IGFuZCBzdG9yZSB0aGUgcmVzdWx0IG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGluIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoIHN1YnNjcmlwdGlvbi5zdWJzY3JpYmVyLCBkYXRhKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZXZlbnQgb2JqZWN0LiBUaGlzIGV2ZW50IG9iamVjdCBtYXkgaGF2ZVxuICAgICAgICAvLyBiZWVuIGF1Z21lbnRlZCBieSBhbnkgb25lIG9mIHRoZSBzdWJzcmNpYmVycy5cbiAgICAgICAgcmV0dXJuKCBldmVudCApO1xuICAgIH07XG5cblxufSkoIGpRdWVyeSApO1xuXG4iLCIvKipcbiAqIFNjb3JlIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGZldGNoaW5nIGhpZ2ggc2NvcmVzIGFuZCBzeW5jaW5nIHRoZW0gdG8gc2VydmVyXG4gKiBHZXQgaW5qZWN0ZWQgd2l0aCB0aGUgRE9NIG1hbmlwdWxhdGlvbiBsaWJyYXJ5XG4gKi9cblxudmFyIHNjb3JlTW9kZWwgPSAoZnVuY3Rpb24oRE9NbGliKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gU3RvcmVzIGN1cnJlbnRcbiAgICAgICAgY3VycmVudFNjb3JlOiBudWxsLFxuXG4gICAgICAgIC8vIFN0b3JlcyB0aGUgY3VycmVudCBoaWdoIHNjb3JlcyB1c2luZyBcInBsYXllck5hbWU6dmFsdWVcIiBmb3JtYXRcbiAgICAgICAgaGlnaFNjb3JlOiB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5nZXRKU09OKCBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3NldEhpZ2hTY29yZXMgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmUgPSBkYXRhXG4gICAgICAgIH1cbiAgICB9XG59KSggJCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjb3JlTW9kZWw7XG4iXX0=
