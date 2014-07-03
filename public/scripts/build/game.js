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
            this._registerListeners();

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
            $.subscribe("scoreInc", this, this._scoreAddOne );
            $.subscribe("scoreDec", this, this._scoreRemoveOne );
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

var grid = (function() {

    currentCell: null,

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
        init: function() {
            this._registerListeners();

            document.getElementById( 'game-board' )
                    .appendChild( _generateGrid() );
        },

        _registerListeners: function() {
             $.subscribe("cellClicked", this, this._cellClickedCB);
        },

        _cellClickedCB: function( cell ) {
            var self = this;
            if ( self.currentCell ) {
                if ( cell.getAttribute('data-color') ===
                        self.currentCell.getAttribute('data-color') ) {
                        $.publish("scoreInc");
                        self.currentCell = null;
                } else {
                    setTimeout(function() {
                        console.log(self.currentCell);
                        cell.className = self.currentCell.className = 'cell turned-over';
                        $.publish("scoreDec");
                        self.currentCell = null;
                    }, 800);
                }
            } else {
                self.currentCell = cell;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlX2NiMDY3ODQ0LmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENlbGwgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgYSBzaW5nbGUgY2VsbCBvYmplY3RcbiAqL1xuXG5cbnZhciBjZWxsID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIF9jcmVhdGVDZWxsID0gZnVuY3Rpb24oIGNvbG9yLCBpZCApIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgY29sb3I7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicsIGNvbG9yICk7XG4gICAgICAgIGVsLmlkID0gXCJjZWxsLVwiICsgaWQ7XG5cbiAgICAgICAgJChlbCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIGVsLmNsYXNzTmFtZS5pbmRleE9mKCd0dXJuZWQtb3ZlcicpID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwnO1xuICAgICAgICAgICAgICAgICQucHVibGlzaChcImNlbGxDbGlja2VkXCIsIGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihjb2xvciwgaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBfY3JlYXRlQ2VsbCggY29sb3IsIGlkKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2VsbDtcbiIsIi8qKlxuICogRW50cnkgcG9pbnQgZm9yIHRoZSBicm93c2VyaWZ5IGJ1aWxkIHNjcmlwdFxuICpcbiAqL1xuXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS5qcycpO1xuLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBnYW1lXG5nYW1lLmluaXQoKTtcblxuIiwiLyoqXG4gKiBHYW1lIE9iamVjdFxuICogMSAtIHNlcnZlcyBhcyBnbG9iYWwgc2NvcGUgZm9yOiBjdXJyZW50VGlsZSwgU2NvcmUsIFR1cm5zXG4gKiAyIC0gU3Bhd24gR3JpZFxuICogMyAtIEdlbmVyYXRlIE1lZGlhdG9yIE9iamVjdFxuICogNCAtXG4gKi9cbnZhciBzY29yZXNNb2RlbCA9IHJlcXVpcmUoJy4vc2NvcmUubW9kZWwuanMnKTtcbnZhciBncmlkID0gcmVxdWlyZSgnLi9ncmlkLmpzJyk7XG5yZXF1aXJlKCcuL3B1YlN1Yi5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMuanMnKTtcblxuXG52YXIgZ2FtZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8vIFN0b3JlcyB0aGUgc2NvcmUgcHJpdmF0bHlcbiAgICB2YXIgX3Njb3JlcyA9IG51bGw7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHNjb3JlRGlzcGxheTogbnVsbCxcblxuICAgICAgICBzY29yZTogMCxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIHRoZSBzY29yZSBkaXNwbGF5IGVsXG4gICAgICAgICAgICB0aGlzLnNjb3JlRGlzcGxheSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzY29yZS1jb3VudCcpO1xuXG4gICAgICAgICAgICAvLyBJbml0IHRoZSBncmlkXG4gICAgICAgICAgICBncmlkLmluaXQoKTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggdGhlIHNjb3Jlc1xuICAgICAgICAgICAgIF9zY29yZXMgPSBzY29yZXNNb2RlbC5mZXRjaCgpO1xuXG4gICAgICAgICAgICAvLyBPbmNlIEluaXRpYWwgU2NvcmVzIGFyZSBmZXRjaGVkIHN0YXJ0IHRoZSBnYW1lXG4gICAgICAgICAgICBfc2NvcmVzLnRoZW4oIHRoaXMuc3RhcnQgKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5fR0xPQkFMUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnR0FNRSBTVEFSVElORycpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3RlckV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlSW5jXCIsIHRoaXMsIHRoaXMuX3Njb3JlQWRkT25lICk7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlRGVjXCIsIHRoaXMsIHRoaXMuX3Njb3JlUmVtb3ZlT25lICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3Njb3JlQWRkT25lOiBmdW5jdGlvbiggcG9pbnQgKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlICsrO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIF9zY29yZVJlbW92ZU9uZTogZnVuY3Rpb24oIHBvaW50ICkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSAhPT0gMCAmJiB0aGlzLnNjb3JlLS07XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICAgfSxcblxuICAgICAgICBfcmVmcmVzaFNjb3JlRGlzcGxheTogZnVuY3Rpb24oIHNjb3JlICkge1xuICAgICAgICAgICAgc2NvcmUgPSBzY29yZSB8fCAwO1xuICAgICAgICAgICAgdGhpcy5zY29yZURpc3BsYXkuaW5uZXJUZXh0ID0gc2NvcmU7XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lO1xuIiwiLyoqXG4gKiBHcmlkIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIHRoZSBncmlkIGZyb20gYSBjb25maWd1cmF0aW9uIG9iamVjdFxuICovXG5cbi8vIENvbmZpZ3VyYXRpb24gT2JqZWN0XG52YXIgY29uZmlnID0ge1xuICAgIFwic2l6ZVwiOiA0LFxuICAgIFwiY29sb3JzXCI6IFsgXCJERDIzMkRcIiwgXCJFMERDMkVcIiwgXCI0NkU2MkRcIiwgXCIzN0U0QjdcIiwgXCIzMDc5RTBcIiwgXCI1QTFBRTBcIiwgXCJGQjE4RDZcIiwgXCJGQjQyMUJcIiBdXG59O1xuXG52YXIgY2VsbCA9IHJlcXVpcmUoJy4vY2VsbC5qcycpO1xuXG52YXIgZ3JpZCA9IChmdW5jdGlvbigpIHtcblxuICAgIGN1cnJlbnRDZWxsOiBudWxsLFxuXG4gICAgX2dldFNodWZmZWxlZENvbG9ycyA9IGZ1bmN0aW9uKCBjb2xvcnMgKSB7XG4gICAgICAgIHZhciBzaHVmZmVsZWRDb2xvcnMgPSBbXTtcbiAgICAgICAgY29sb3JzID0gY29sb3JzLmNvbmNhdCggY29sb3JzLnNsaWNlKCkgKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciByYW5kID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogIGxlbmd0aCk7XG4gICAgICAgICAgICBzaHVmZmVsZWRDb2xvcnMucHVzaChjb2xvcnMuc3BsaWNlKHJhbmQsIDEpWzBdKTtcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCBsZW5ndGghPSAwIClcbiAgICAgICAgcmV0dXJuIHNodWZmZWxlZENvbG9ycztcbiAgICB9O1xuXG4gICAgX2dlbmVyYXRlR3JpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29sb3JzID0gX2dldFNodWZmZWxlZENvbG9ycyggY29uZmlnLmNvbG9ycyApO1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGd0aCA9IGNvbG9ycy5sZW5ndGggOyBpIDwgbGd0aCA7IGkrKykge1xuICAgICAgICAgICAgdmFyIGN1cnJDZWxsID0gY2VsbC5jcmVhdGUoIGNvbG9yc1tpXSwgaSsxICk7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZCggY3VyckNlbGwgKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZ2FtZS1ib2FyZCcgKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kQ2hpbGQoIF9nZW5lcmF0ZUdyaWQoKSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3Rlckxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJjZWxsQ2xpY2tlZFwiLCB0aGlzLCB0aGlzLl9jZWxsQ2xpY2tlZENCKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY2VsbENsaWNrZWRDQjogZnVuY3Rpb24oIGNlbGwgKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoIHNlbGYuY3VycmVudENlbGwgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBjZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQucHVibGlzaChcInNjb3JlSW5jXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNlbGYuY3VycmVudENlbGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5jbGFzc05hbWUgPSBzZWxmLmN1cnJlbnRDZWxsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgICAgICAgICAgICAgICAgICQucHVibGlzaChcInNjb3JlRGVjXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRDZWxsID0gY2VsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ3JpZDtcbiIsImlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGVcIik7XG4gICAgfVxuXG4gICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLCBcbiAgICAgICAgZk5PUCA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1AgJiYgb1RoaXNcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cblxuIiwiLy8gQmFzZWQgb2YgaHR0cDovL3d3dy5iZW5uYWRlbC5jb20vYmxvZy8yMDM3LXNpbXBsZS1wdWJsaWNhdGlvbi1hbmQtc3Vic2NyaXB0aW9uLWZ1bmN0aW9uYWxpdHktcHViLXN1Yi13aXRoLWpxdWVyeS5odG1cblxuLy8gRGVmaW5lIHRoZSBwdWJsaXNoIGFuZCBzdWJzY3JpYmUgalF1ZXJ5IGV4dGVuc2lvbnMuXG4vLyBUaGVzZSB3aWxsIGFsbG93IGZvciBwdWItc3ViIHdpdGhvdXQgdGhlIG92ZXJoZWFkXG4vLyBvZiBET00tcmVsYXRlZCBldmVudGluZy5cbihmdW5jdGlvbiggJCApe1xuXG4gICAgLy8gQ3JlYXRlIGEgY29sbGVjdGlvbiBvZiBzdWJzY3JpcHRpb25zIHdoaWNoIGFyZSBqdXN0IGFcbiAgICAvLyBjb21iaW5hdGlvbiBvZiBldmVudCB0eXBlcyBhbmQgZXZlbnQgY2FsbGJhY2tzXG4gICAgLy8gdGhhdCBjYW4gYmUgYWxlcnRlZCB0byBwdWJsaXNoZWQgZXZlbnRzLlxuICAgIHZhciBzdWJzY3JpcHRpb25zID0ge307XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaWJlIGV4dGVuc2lvbnMuIFRoaXMgd2lsbCB0YWtlIHRoZVxuICAgIC8vIHN1YnNjcmliZXIgKGNvbnRleHQgZm9yIGNhbGxiYWNrIGV4ZWN1dGlvbiksIHRoZVxuICAgIC8vIGV2ZW50IHR5cGUsIGFuZCBhIGNhbGxiYWNrIHRvIGV4ZWN1dGUuXG4gICAgJC5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBzdWJzY3JpYmVyLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBldmVudCB0eXBlIGhhcyBhIGNvbGxlY3Rpb25cbiAgICAgICAgLy8gb2Ygc3Vic2NyaWJlcnMgeWV0LlxuICAgICAgICBpZiAoIShldmVudFR5cGUgaW4gc3Vic2NyaXB0aW9ucykpe1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9IFtdO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHR5cGUgb2YgY2FsbGJhY2sgaXMgYSBzdHJpbmcuXG4gICAgICAgIC8vIElmIGl0IGlzLCB3ZSBhcmUgZ29pbmcgdG8gY29udmVydCBpdCB0byBhIG1ldGhvZFxuICAgICAgICAvLyBjYWxsLlxuICAgICAgICBpZiAodHlwZW9mKCBjYWxsYmFjayApID09IFwic3RyaW5nXCIpe1xuXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBjYWxsYmFjayBuYW1lIHRvIGEgcmVmZXJlbmNlIHRvXG4gICAgICAgICAgICAvLyB0aGUgY2FsbGJhY2sgb24gdGhlIHN1YnNjcmliZXIgb2JqZWN0LlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyWyBjYWxsYmFjayBdO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhpcyBzdWJzY3JpYmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQgdHlwZS4uXG4gICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLnB1c2goe1xuICAgICAgICAgICAgc3Vic2NyaWJlcjogc3Vic2NyaWJlcixcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHVuc3Vic2NyaWJlIGV4dGVuc2lvbnMuIFRoaXMgYWxsb3dzIGFcbiAgICAvLyBzdWJzY3JpYmVyIHRvIHVuYmluZCBpdHMgcHJldmlvdXNseS1ib3VuZCBjYWxsYmFjay5cbiAgICAkLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgY2FsbGJhY2sgKXtcbiAgICAgICAgLy8gQ2hlY2sgdG8gbWFrZSBzdXJlIHRoZSBldmVudCB0eXBlIGNvbGxlY3Rpb25cbiAgICAgICAgLy8gY3VycmVudGx5IGV4aXN0cy5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIShldmVudFR5cGUgaW4gc3Vic2NyaXB0aW9ucykgfHxcbiAgICAgICAgICAgICFzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXS5sZW5ndGhcbiAgICAgICAgICAgICl7XG5cbiAgICAgICAgICAgIC8vIFJldHVybiBvdXQgLSBpZiB0aGVyZSdzIG5vIHN1YnNjcmliZXJcbiAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZSwgdGhlcmUnc1xuICAgICAgICAgICAgLy8gbm90aGluZyBmb3IgdXMgdG8gdW5iaW5kLlxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYXAgdGhlIGN1cnJlbnQgc3Vic2NyaXB0aW9uIGNvbGxlY3Rpb24gdG8gYSBuZXdcbiAgICAgICAgLy8gb25lIHRoYXQgZG9lc24ndCBoYXZlIHRoZSBnaXZlbiBjYWxsYmFjay5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0gPSAkLm1hcChcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLFxuICAgICAgICAgICAgZnVuY3Rpb24oIHN1YnNjcmlwdGlvbiApe1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGNhbGxiYWNrIG1hdGNoZXMgdGhlXG4gICAgICAgICAgICAgICAgLy8gb25lIHdlIGFyZSB1bnN1YnNjcmliaW5nLiBJZiBpdCBkb2VzLCB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBnb2luZyB0byB3YW50IHRvIHJlbW92ZSBpdCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbi5jYWxsYmFjayA9PSBjYWxsYmFjayl7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIG51bGwgdG8gcmVtb3ZlIHRoaXMgbWF0Y2hpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgZnJvbSB0aGUgc3Vic3JpYmVycy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBudWxsICk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgZ2l2ZW4gc3Vic2NyaXB0aW9uIHRvIGtlZXBcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaW4gdGhlIHN1YnNjcmliZXJzIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiggc3Vic2NyaXB0aW9uICk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBwdWJsaXNoIGV4dGVuc2lvbi4gVGhpcyB0YWtlcyB0aGVcbiAgICAvLyBwdWJsaXNoaW5nIG9iamVjdCwgdGhlIHR5cGUgb2YgZXZlbnQsIGFuZCBhbnlcbiAgICAvLyBhZGRpdGlvbmFsIGRhdGEgdGhhdCBuZWVkIHRvIGJlIHB1Ymxpc2hlZCB3aXRoIHRoZVxuICAgIC8vIGV2ZW50LlxuICAgICQucHVibGlzaCA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIGRhdGEgKXtcbiAgICAgICAgZGF0YSA9IGRhdGEgPyBbZGF0YV0gOiBbXVxuICAgICAgICAvLyBMb29wIG92ZXIgdGhlIHN1YnNyaWJlcnMgZm9yIHRoaXMgZXZlbnQgdHlwZVxuICAgICAgICAvLyBhbmQgaW52b2tlIHRoZWlyIGNhbGxiYWNrcy5cbiAgICAgICAgJC5lYWNoKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggaW5kZXgsIHN1YnNjcmlwdGlvbiApe1xuXG4gICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSBjYWxsYmFjayBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgLy8gY29udGV4dCBhbmQgc3RvcmUgdGhlIHJlc3VsdCBvZiB0aGVcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBpbiB0aGUgZXZlbnQuXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KCBzdWJzY3JpcHRpb24uc3Vic2NyaWJlciwgZGF0YSk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGV2ZW50IG9iamVjdC4gVGhpcyBldmVudCBvYmplY3QgbWF5IGhhdmVcbiAgICAgICAgLy8gYmVlbiBhdWdtZW50ZWQgYnkgYW55IG9uZSBvZiB0aGUgc3Vic3JjaWJlcnMuXG4gICAgICAgIHJldHVybiggZXZlbnQgKTtcbiAgICB9O1xuXG5cbn0pKCBqUXVlcnkgKTtcblxuIiwiLyoqXG4gKiBTY29yZSBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBmZXRjaGluZyBoaWdoIHNjb3JlcyBhbmQgc3luY2luZyB0aGVtIHRvIHNlcnZlclxuICogR2V0IGluamVjdGVkIHdpdGggdGhlIERPTSBtYW5pcHVsYXRpb24gbGlicmFyeVxuICovXG5cbnZhciBzY29yZU1vZGVsID0gKGZ1bmN0aW9uKERPTWxpYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFN0b3JlcyBjdXJyZW50XG4gICAgICAgIGN1cnJlbnRTY29yZTogbnVsbCxcblxuICAgICAgICAvLyBTdG9yZXMgdGhlIGN1cnJlbnQgaGlnaCBzY29yZXMgdXNpbmcgXCJwbGF5ZXJOYW1lOnZhbHVlXCIgZm9ybWF0XG4gICAgICAgIGhpZ2hTY29yZToge1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vIFJldHVybnMgYSBwcm9taXNlXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBET01saWIuZ2V0SlNPTiggX0dMT0JBTFMuYmFzZVVSTCArIFwiL3Njb3Jlc1wiKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9zZXRIaWdoU2NvcmVzICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRIaWdoU2NvcmVzOiBmdW5jdGlvbiggZGF0YSApIHtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3JlID0gZGF0YVxuICAgICAgICB9XG4gICAgfVxufSkoICQgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzY29yZU1vZGVsO1xuIl19
