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

        score: 0,

        init: function() {
            this._registerListeners();

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

        _registerListeners: function() {
            $.subscribe("scoreInc", this, this._scoreAdd );
        },

        _scoreAdd: function( point ) {
            console.log(this.score);
            this.score ++;
            console.log(this.score);

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
                        cell.className = self.currentCell.className = 'cell turned-over';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzQ4ZTk0NDYuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL2dhbWUuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL2dyaWQuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3BvbHlmaWxscy5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvcHViU3ViLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9zY29yZS5tb2RlbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBDZWxsIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIGEgc2luZ2xlIGNlbGwgb2JqZWN0XG4gKi9cblxuXG52YXIgY2VsbCA9IChmdW5jdGlvbigpIHtcblxuICAgIHZhciBfY3JlYXRlQ2VsbCA9IGZ1bmN0aW9uKCBjb2xvciwgaWQgKSB7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICBlbC5jbGFzc05hbWUgPSAnY2VsbCB0dXJuZWQtb3Zlcic7XG4gICAgICAgIGVsLnN0eWxlLmJhY2tncm91bmRDb2xvciA9ICcjJyArIGNvbG9yO1xuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InLCBjb2xvciApO1xuICAgICAgICBlbC5pZCA9IFwiY2VsbC1cIiArIGlkO1xuXG4gICAgICAgICQoZWwpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCBlbC5jbGFzc05hbWUuaW5kZXhPZigndHVybmVkLW92ZXInKSA+IC0xICkge1xuICAgICAgICAgICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsJztcbiAgICAgICAgICAgICAgICAkLnB1Ymxpc2goXCJjZWxsQ2xpY2tlZFwiLCBlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24oY29sb3IsIGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gX2NyZWF0ZUNlbGwoIGNvbG9yLCBpZCk7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9XG4gICAgfVxuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNlbGw7XG4iLCIvKipcbiAqIEVudHJ5IHBvaW50IGZvciB0aGUgYnJvd3NlcmlmeSBidWlsZCBzY3JpcHRcbiAqXG4gKi9cblxudmFyIGdhbWUgPSByZXF1aXJlKCcuL2dhbWUuanMnKTtcbi8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgZ2FtZVxuZ2FtZS5pbml0KCk7XG5cbiIsIi8qKlxuICogR2FtZSBPYmplY3RcbiAqIDEgLSBzZXJ2ZXMgYXMgZ2xvYmFsIHNjb3BlIGZvcjogY3VycmVudFRpbGUsIFNjb3JlLCBUdXJuc1xuICogMiAtIFNwYXduIEdyaWRcbiAqIDMgLSBHZW5lcmF0ZSBNZWRpYXRvciBPYmplY3RcbiAqIDQgLVxuICovXG52YXIgc2NvcmVzTW9kZWwgPSByZXF1aXJlKCcuL3Njb3JlLm1vZGVsLmpzJyk7XG52YXIgZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZC5qcycpO1xucmVxdWlyZSgnLi9wdWJTdWIuanMnKTtcbnJlcXVpcmUoJy4vcG9seWZpbGxzLmpzJyk7XG5cblxudmFyIGdhbWUgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBTdG9yZXMgdGhlIHNjb3JlIHByaXZhdGx5XG4gICAgdmFyIF9zY29yZXMgPSBudWxsO1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBzY29yZTogMCxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgICAgIC8vIEluaXQgdGhlIGdyaWRcbiAgICAgICAgICAgIGdyaWQuaW5pdCgpO1xuXG4gICAgICAgICAgICAvLyBGZXRjaCB0aGUgc2NvcmVzXG4gICAgICAgICAgICAgX3Njb3JlcyA9IHNjb3Jlc01vZGVsLmZldGNoKCk7XG5cbiAgICAgICAgICAgIC8vIE9uY2UgSW5pdGlhbCBTY29yZXMgYXJlIGZldGNoZWQgc3RhcnQgdGhlIGdhbWVcbiAgICAgICAgICAgIF9zY29yZXMudGhlbiggdGhpcy5zdGFydCApO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93Ll9HTE9CQUxTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdHQU1FIFNUQVJUSU5HJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVJbmNcIiwgdGhpcywgdGhpcy5fc2NvcmVBZGQgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVBZGQ6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc2NvcmUpO1xuICAgICAgICAgICAgdGhpcy5zY29yZSArKztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRoaXMuc2NvcmUpO1xuXG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lO1xuIiwiLyoqXG4gKiBHcmlkIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGNyZWF0aW5nIHRoZSBncmlkIGZyb20gYSBjb25maWd1cmF0aW9uIG9iamVjdFxuICovXG5cbi8vIENvbmZpZ3VyYXRpb24gT2JqZWN0XG52YXIgY29uZmlnID0ge1xuICAgIFwic2l6ZVwiOiA0LFxuICAgIFwiY29sb3JzXCI6IFsgXCJERDIzMkRcIiwgXCJFMERDMkVcIiwgXCI0NkU2MkRcIiwgXCIzN0U0QjdcIiwgXCIzMDc5RTBcIiwgXCI1QTFBRTBcIiwgXCJGQjE4RDZcIiwgXCJGQjQyMUJcIiBdXG59O1xuXG52YXIgY2VsbCA9IHJlcXVpcmUoJy4vY2VsbC5qcycpO1xuXG52YXIgZ3JpZCA9IChmdW5jdGlvbigpIHtcblxuICAgIGN1cnJlbnRDZWxsOiBudWxsLFxuXG4gICAgX2dldFNodWZmZWxlZENvbG9ycyA9IGZ1bmN0aW9uKCBjb2xvcnMgKSB7XG4gICAgICAgIHZhciBzaHVmZmVsZWRDb2xvcnMgPSBbXTtcbiAgICAgICAgY29sb3JzID0gY29sb3JzLmNvbmNhdCggY29sb3JzLnNsaWNlKCkgKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciByYW5kID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogIGxlbmd0aCk7XG4gICAgICAgICAgICBzaHVmZmVsZWRDb2xvcnMucHVzaChjb2xvcnMuc3BsaWNlKHJhbmQsIDEpWzBdKTtcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCBsZW5ndGghPSAwIClcbiAgICAgICAgcmV0dXJuIHNodWZmZWxlZENvbG9ycztcbiAgICB9O1xuXG4gICAgX2dlbmVyYXRlR3JpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29sb3JzID0gX2dldFNodWZmZWxlZENvbG9ycyggY29uZmlnLmNvbG9ycyApO1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGd0aCA9IGNvbG9ycy5sZW5ndGggOyBpIDwgbGd0aCA7IGkrKykge1xuICAgICAgICAgICAgdmFyIGN1cnJDZWxsID0gY2VsbC5jcmVhdGUoIGNvbG9yc1tpXSwgaSsxICk7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZCggY3VyckNlbGwgKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyTGlzdGVuZXJzKCk7XG5cbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZ2FtZS1ib2FyZCcgKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kQ2hpbGQoIF9nZW5lcmF0ZUdyaWQoKSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3Rlckxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJjZWxsQ2xpY2tlZFwiLCB0aGlzLCB0aGlzLl9jZWxsQ2xpY2tlZENCKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfY2VsbENsaWNrZWRDQjogZnVuY3Rpb24oIGNlbGwgKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICBpZiAoIHNlbGYuY3VycmVudENlbGwgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBjZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQucHVibGlzaChcInNjb3JlSW5jXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuY2xhc3NOYW1lID0gc2VsZi5jdXJyZW50Q2VsbC5jbGFzc05hbWUgPSAnY2VsbCB0dXJuZWQtb3Zlcic7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfSwgODAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudENlbGwgPSBjZWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBncmlkO1xuIiwiaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsIFxuICAgICAgICBmTk9QID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUCAmJiBvVGhpc1xuICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgOiBvVGhpcyxcbiAgICAgICAgICAgICAgICAgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfTtcblxuICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuXG4iLCIvLyBCYXNlZCBvZiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzIwMzctc2ltcGxlLXB1YmxpY2F0aW9uLWFuZC1zdWJzY3JpcHRpb24tZnVuY3Rpb25hbGl0eS1wdWItc3ViLXdpdGgtanF1ZXJ5Lmh0bVxuXG4vLyBEZWZpbmUgdGhlIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSBqUXVlcnkgZXh0ZW5zaW9ucy5cbi8vIFRoZXNlIHdpbGwgYWxsb3cgZm9yIHB1Yi1zdWIgd2l0aG91dCB0aGUgb3ZlcmhlYWRcbi8vIG9mIERPTS1yZWxhdGVkIGV2ZW50aW5nLlxuKGZ1bmN0aW9uKCAkICl7XG5cbiAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIG9mIHN1YnNjcmlwdGlvbnMgd2hpY2ggYXJlIGp1c3QgYVxuICAgIC8vIGNvbWJpbmF0aW9uIG9mIGV2ZW50IHR5cGVzIGFuZCBldmVudCBjYWxsYmFja3NcbiAgICAvLyB0aGF0IGNhbiBiZSBhbGVydGVkIHRvIHB1Ymxpc2hlZCBldmVudHMuXG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB7fTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBzdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyB3aWxsIHRha2UgdGhlXG4gICAgLy8gc3Vic2NyaWJlciAoY29udGV4dCBmb3IgY2FsbGJhY2sgZXhlY3V0aW9uKSwgdGhlXG4gICAgLy8gZXZlbnQgdHlwZSwgYW5kIGEgY2FsbGJhY2sgdG8gZXhlY3V0ZS5cbiAgICAkLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIHN1YnNjcmliZXIsIGNhbGxiYWNrICl7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGV2ZW50IHR5cGUgaGFzIGEgY29sbGVjdGlvblxuICAgICAgICAvLyBvZiBzdWJzY3JpYmVycyB5ZXQuXG4gICAgICAgIGlmICghKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSl7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZS5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdID0gW107XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdHlwZSBvZiBjYWxsYmFjayBpcyBhIHN0cmluZy5cbiAgICAgICAgLy8gSWYgaXQgaXMsIHdlIGFyZSBnb2luZyB0byBjb252ZXJ0IGl0IHRvIGEgbWV0aG9kXG4gICAgICAgIC8vIGNhbGwuXG4gICAgICAgIGlmICh0eXBlb2YoIGNhbGxiYWNrICkgPT0gXCJzdHJpbmdcIil7XG5cbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGNhbGxiYWNrIG5hbWUgdG8gYSByZWZlcmVuY2UgdG9cbiAgICAgICAgICAgIC8vIHRoZSBjYWxsYmFjayBvbiB0aGUgc3Vic2NyaWJlciBvYmplY3QuXG4gICAgICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJbIGNhbGxiYWNrIF07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGlzIHN1YnNjcmliZXIgZm9yIHRoZSBnaXZlbiBldmVudCB0eXBlLi5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0ucHVzaCh7XG4gICAgICAgICAgICBzdWJzY3JpYmVyOiBzdWJzY3JpYmVyLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgdW5zdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyBhbGxvd3MgYVxuICAgIC8vIHN1YnNjcmliZXIgdG8gdW5iaW5kIGl0cyBwcmV2aW91c2x5LWJvdW5kIGNhbGxiYWNrLlxuICAgICQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBtYWtlIHN1cmUgdGhlIGV2ZW50IHR5cGUgY29sbGVjdGlvblxuICAgICAgICAvLyBjdXJyZW50bHkgZXhpc3RzLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSB8fFxuICAgICAgICAgICAgIXN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLmxlbmd0aFxuICAgICAgICAgICAgKXtcblxuICAgICAgICAgICAgLy8gUmV0dXJuIG91dCAtIGlmIHRoZXJlJ3Mgbm8gc3Vic2NyaWJlclxuICAgICAgICAgICAgLy8gY29sbGVjdGlvbiBmb3IgdGhpcyBldmVudCB0eXBlLCB0aGVyZSdzXG4gICAgICAgICAgICAvLyBub3RoaW5nIGZvciB1cyB0byB1bmJpbmQuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hcCB0aGUgY3VycmVudCBzdWJzY3JpcHRpb24gY29sbGVjdGlvbiB0byBhIG5ld1xuICAgICAgICAvLyBvbmUgdGhhdCBkb2Vzbid0IGhhdmUgdGhlIGdpdmVuIGNhbGxiYWNrLlxuICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9ICQubWFwKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggc3Vic2NyaXB0aW9uICl7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgY2FsbGJhY2sgbWF0Y2hlcyB0aGVcbiAgICAgICAgICAgICAgICAvLyBvbmUgd2UgYXJlIHVuc3Vic2NyaWJpbmcuIElmIGl0IGRvZXMsIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGdvaW5nIHRvIHdhbnQgdG8gcmVtb3ZlIGl0IGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uLmNhbGxiYWNrID09IGNhbGxiYWNrKXtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gbnVsbCB0byByZW1vdmUgdGhpcyBtYXRjaGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBmcm9tIHRoZSBzdWJzcmliZXJzLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4oIG51bGwgKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBnaXZlbiBzdWJzY3JpcHRpb24gdG8ga2VlcFxuICAgICAgICAgICAgICAgICAgICAvLyBpdCBpbiB0aGUgc3Vic2NyaWJlcnMgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBzdWJzY3JpcHRpb24gKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHB1Ymxpc2ggZXh0ZW5zaW9uLiBUaGlzIHRha2VzIHRoZVxuICAgIC8vIHB1Ymxpc2hpbmcgb2JqZWN0LCB0aGUgdHlwZSBvZiBldmVudCwgYW5kIGFueVxuICAgIC8vIGFkZGl0aW9uYWwgZGF0YSB0aGF0IG5lZWQgdG8gYmUgcHVibGlzaGVkIHdpdGggdGhlXG4gICAgLy8gZXZlbnQuXG4gICAgJC5wdWJsaXNoID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgZGF0YSApe1xuICAgICAgICBkYXRhID0gZGF0YSA/IFtkYXRhXSA6IFtdXG4gICAgICAgIC8vIExvb3Agb3ZlciB0aGUgc3Vic3JpYmVycyBmb3IgdGhpcyBldmVudCB0eXBlXG4gICAgICAgIC8vIGFuZCBpbnZva2UgdGhlaXIgY2FsbGJhY2tzLlxuICAgICAgICAkLmVhY2goXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBpbmRleCwgc3Vic2NyaXB0aW9uICl7XG5cbiAgICAgICAgICAgICAgICAvLyBJbnZva2UgdGhlIGNhbGxiYWNrIGluIHRoZSBzdWJzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAvLyBjb250ZXh0IGFuZCBzdG9yZSB0aGUgcmVzdWx0IG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGluIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoIHN1YnNjcmlwdGlvbi5zdWJzY3JpYmVyLCBkYXRhKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZXZlbnQgb2JqZWN0LiBUaGlzIGV2ZW50IG9iamVjdCBtYXkgaGF2ZVxuICAgICAgICAvLyBiZWVuIGF1Z21lbnRlZCBieSBhbnkgb25lIG9mIHRoZSBzdWJzcmNpYmVycy5cbiAgICAgICAgcmV0dXJuKCBldmVudCApO1xuICAgIH07XG5cblxufSkoIGpRdWVyeSApO1xuXG4iLCIvKipcbiAqIFNjb3JlIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGZldGNoaW5nIGhpZ2ggc2NvcmVzIGFuZCBzeW5jaW5nIHRoZW0gdG8gc2VydmVyXG4gKiBHZXQgaW5qZWN0ZWQgd2l0aCB0aGUgRE9NIG1hbmlwdWxhdGlvbiBsaWJyYXJ5XG4gKi9cblxudmFyIHNjb3JlTW9kZWwgPSAoZnVuY3Rpb24oRE9NbGliKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gU3RvcmVzIGN1cnJlbnRcbiAgICAgICAgY3VycmVudFNjb3JlOiBudWxsLFxuXG4gICAgICAgIC8vIFN0b3JlcyB0aGUgY3VycmVudCBoaWdoIHNjb3JlcyB1c2luZyBcInBsYXllck5hbWU6dmFsdWVcIiBmb3JtYXRcbiAgICAgICAgaGlnaFNjb3JlOiB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5nZXRKU09OKCBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3NldEhpZ2hTY29yZXMgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmUgPSBkYXRhXG4gICAgICAgIH1cbiAgICB9XG59KSggJCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjb3JlTW9kZWw7XG4iXX0=
