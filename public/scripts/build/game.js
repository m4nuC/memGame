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
             $.subscribe("gameRestart", this, this._gameRestart);
        },

        _gameRestart: function() {
            self.currentCell = null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzQ0ZjM0MzA3LmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ2VsbCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBhIHNpbmdsZSBjZWxsIG9iamVjdFxuICovXG5cblxudmFyIGNlbGwgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgX2NyZWF0ZUNlbGwgPSBmdW5jdGlvbiggY29sb3IsIGlkICkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyBjb2xvcjtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJywgY29sb3IgKTtcbiAgICAgICAgZWwuaWQgPSBcImNlbGwtXCIgKyBpZDtcblxuICAgICAgICAkKGVsKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggZWwuY2xhc3NOYW1lLmluZGV4T2YoJ3R1cm5lZC1vdmVyJykgPiAtMSApIHtcbiAgICAgICAgICAgICAgICBlbC5jbGFzc05hbWUgPSAnY2VsbCc7XG4gICAgICAgICAgICAgICAgJC5wdWJsaXNoKFwiY2VsbENsaWNrZWRcIiwgZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uKGNvbG9yLCBpZCkge1xuICAgICAgICAgICAgcmV0dXJuIF9jcmVhdGVDZWxsKCBjb2xvciwgaWQpO1xuICAgICAgICAgICAgLy9cbiAgICAgICAgfVxuICAgIH1cblxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBjZWxsO1xuIiwiLyoqXG4gKiBFbnRyeSBwb2ludCBmb3IgdGhlIGJyb3dzZXJpZnkgYnVpbGQgc2NyaXB0XG4gKlxuICovXG5cbnZhciBnYW1lID0gcmVxdWlyZSgnLi9nYW1lLmpzJyk7XG4vLyBDcmVhdGUgYW4gaW5zdGFuY2Ugb2YgdGhlIGdhbWVcbmdhbWUuaW5pdCgpO1xuXG4iLCIvKipcbiAqIEdhbWUgT2JqZWN0XG4gKiAxIC0gc2VydmVzIGFzIGdsb2JhbCBzY29wZSBmb3I6IGN1cnJlbnRUaWxlLCBTY29yZSwgVHVybnNcbiAqIDIgLSBTcGF3biBHcmlkXG4gKiAzIC0gR2VuZXJhdGUgTWVkaWF0b3IgT2JqZWN0XG4gKiA0IC1cbiAqL1xudmFyIHNjb3Jlc01vZGVsID0gcmVxdWlyZSgnLi9zY29yZS5tb2RlbC5qcycpO1xudmFyIGdyaWQgPSByZXF1aXJlKCcuL2dyaWQuanMnKTtcbnJlcXVpcmUoJy4vcHViU3ViLmpzJyk7XG5yZXF1aXJlKCcuL3BvbHlmaWxscy5qcycpO1xuXG5cbnZhciBnYW1lID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gU3RvcmVzIHRoZSBzY29yZSBwcml2YXRseVxuICAgIHZhciBfc2NvcmVzID0gbnVsbDtcblxuICAgIHJldHVybiB7XG5cbiAgICAgICAgc2NvcmVEaXNwbGF5OiBudWxsLFxuXG4gICAgICAgIHNjb3JlOiAwLFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJFdmVudHMoKTtcblxuICAgICAgICAgICAgLy8gU3RvcmUgdGhlIHNjb3JlIGRpc3BsYXkgZWxcbiAgICAgICAgICAgIHRoaXMuc2NvcmVEaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlLWNvdW50Jyk7XG5cbiAgICAgICAgICAgIC8vIEluaXQgdGhlIGdyaWRcbiAgICAgICAgICAgIGdyaWQuaW5pdCgpO1xuXG4gICAgICAgICAgICAvLyBGZXRjaCB0aGUgc2NvcmVzXG4gICAgICAgICAgICAgX3Njb3JlcyA9IHNjb3Jlc01vZGVsLmZldGNoKCk7XG5cbiAgICAgICAgICAgIC8vIE9uY2UgSW5pdGlhbCBTY29yZXMgYXJlIGZldGNoZWQgc3RhcnQgdGhlIGdhbWVcbiAgICAgICAgICAgIF9zY29yZXMudGhlbiggdGhpcy5zdGFydCApO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgd2luZG93Ll9HTE9CQUxTLmRlYnVnICYmIGNvbnNvbGUubG9nKCdHQU1FIFNUQVJUSU5HJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVJbmNcIiwgc2VsZiwgc2VsZi5fc2NvcmVBZGRPbmUgKTtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVEZWNcIiwgc2VsZiwgc2VsZi5fc2NvcmVSZW1vdmVPbmUgKTtcbiAgICAgICAgICAgICQoJyNyZXN0YXJ0JykuY2xpY2soIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVzdGFydEdhbWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZXN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlID0gMDtcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG4gICAgICAgICAgICAkKCcuY2VsbCcpLmFkZENsYXNzKFwidHVybmVkLW92ZXJcIik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQucHVibGlzaCgnZ2FtZVJlc3RhcnQnKTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIF9zY29yZUFkZE9uZTogZnVuY3Rpb24oIHBvaW50ICkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSArKztcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG5cbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVSZW1vdmVPbmU6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmUgIT09IDAgJiYgdGhpcy5zY29yZS0tO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgX3JlZnJlc2hTY29yZURpc3BsYXk6IGZ1bmN0aW9uKCBzY29yZSApIHtcbiAgICAgICAgICAgIHNjb3JlID0gc2NvcmUgfHwgMDtcbiAgICAgICAgICAgIHRoaXMuc2NvcmVEaXNwbGF5LmlubmVyVGV4dCA9IHNjb3JlO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZTtcbiIsIi8qKlxuICogR3JpZCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyB0aGUgZ3JpZCBmcm9tIGEgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqL1xuXG4vLyBDb25maWd1cmF0aW9uIE9iamVjdFxudmFyIGNvbmZpZyA9IHtcbiAgICBcInNpemVcIjogNCxcbiAgICBcImNvbG9yc1wiOiBbIFwiREQyMzJEXCIsIFwiRTBEQzJFXCIsIFwiNDZFNjJEXCIsIFwiMzdFNEI3XCIsIFwiMzA3OUUwXCIsIFwiNUExQUUwXCIsIFwiRkIxOEQ2XCIsIFwiRkI0MjFCXCIgXVxufTtcblxudmFyIGNlbGwgPSByZXF1aXJlKCcuL2NlbGwuanMnKTtcblxudmFyIGdyaWQgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBjdXJyZW50Q2VsbDogbnVsbCxcblxuICAgIF9nZXRTaHVmZmVsZWRDb2xvcnMgPSBmdW5jdGlvbiggY29sb3JzICkge1xuICAgICAgICB2YXIgc2h1ZmZlbGVkQ29sb3JzID0gW107XG4gICAgICAgIGNvbG9ycyA9IGNvbG9ycy5jb25jYXQoIGNvbG9ycy5zbGljZSgpICk7XG4gICAgICAgIHZhciBsZW5ndGggPSBjb2xvcnMubGVuZ3RoO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgcmFuZCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqICBsZW5ndGgpO1xuICAgICAgICAgICAgc2h1ZmZlbGVkQ29sb3JzLnB1c2goY29sb3JzLnNwbGljZShyYW5kLCAxKVswXSk7XG4gICAgICAgICAgICBsZW5ndGggPSBjb2xvcnMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICggbGVuZ3RoIT0gMCApXG4gICAgICAgIHJldHVybiBzaHVmZmVsZWRDb2xvcnM7XG4gICAgfTtcblxuICAgIF9nZW5lcmF0ZUdyaWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbG9ycyA9IF9nZXRTaHVmZmVsZWRDb2xvcnMoIGNvbmZpZy5jb2xvcnMgKTtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxndGggPSBjb2xvcnMubGVuZ3RoIDsgaSA8IGxndGggOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjdXJyQ2VsbCA9IGNlbGwuY3JlYXRlKCBjb2xvcnNbaV0sIGkrMSApO1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoIGN1cnJDZWxsICk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3Rlckxpc3RlbmVycygpO1xuXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2dhbWUtYm9hcmQnIClcbiAgICAgICAgICAgICAgICAgICAgLmFwcGVuZENoaWxkKCBfZ2VuZXJhdGVHcmlkKCkgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVnaXN0ZXJMaXN0ZW5lcnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICQuc3Vic2NyaWJlKFwiY2VsbENsaWNrZWRcIiwgdGhpcywgdGhpcy5fY2VsbENsaWNrZWRDQik7XG4gICAgICAgICAgICAgJC5zdWJzY3JpYmUoXCJnYW1lUmVzdGFydFwiLCB0aGlzLCB0aGlzLl9nYW1lUmVzdGFydCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dhbWVSZXN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHNlbGYuY3VycmVudENlbGwgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9jZWxsQ2xpY2tlZENCOiBmdW5jdGlvbiggY2VsbCApIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIGlmICggc2VsZi5jdXJyZW50Q2VsbCApIHtcbiAgICAgICAgICAgICAgICBpZiAoIGNlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJykgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRDZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5wdWJsaXNoKFwic2NvcmVJbmNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2VsZi5jdXJyZW50Q2VsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjZWxsLmNsYXNzTmFtZSA9IHNlbGYuY3VycmVudENlbGwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5wdWJsaXNoKFwic2NvcmVEZWNcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmN1cnJlbnRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfSwgODAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuY3VycmVudENlbGwgPSBjZWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBncmlkO1xuIiwiaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsIFxuICAgICAgICBmTk9QID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUCAmJiBvVGhpc1xuICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgOiBvVGhpcyxcbiAgICAgICAgICAgICAgICAgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfTtcblxuICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuXG4iLCIvLyBCYXNlZCBvZiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzIwMzctc2ltcGxlLXB1YmxpY2F0aW9uLWFuZC1zdWJzY3JpcHRpb24tZnVuY3Rpb25hbGl0eS1wdWItc3ViLXdpdGgtanF1ZXJ5Lmh0bVxuXG4vLyBEZWZpbmUgdGhlIHB1Ymxpc2ggYW5kIHN1YnNjcmliZSBqUXVlcnkgZXh0ZW5zaW9ucy5cbi8vIFRoZXNlIHdpbGwgYWxsb3cgZm9yIHB1Yi1zdWIgd2l0aG91dCB0aGUgb3ZlcmhlYWRcbi8vIG9mIERPTS1yZWxhdGVkIGV2ZW50aW5nLlxuKGZ1bmN0aW9uKCAkICl7XG5cbiAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIG9mIHN1YnNjcmlwdGlvbnMgd2hpY2ggYXJlIGp1c3QgYVxuICAgIC8vIGNvbWJpbmF0aW9uIG9mIGV2ZW50IHR5cGVzIGFuZCBldmVudCBjYWxsYmFja3NcbiAgICAvLyB0aGF0IGNhbiBiZSBhbGVydGVkIHRvIHB1Ymxpc2hlZCBldmVudHMuXG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB7fTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBzdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyB3aWxsIHRha2UgdGhlXG4gICAgLy8gc3Vic2NyaWJlciAoY29udGV4dCBmb3IgY2FsbGJhY2sgZXhlY3V0aW9uKSwgdGhlXG4gICAgLy8gZXZlbnQgdHlwZSwgYW5kIGEgY2FsbGJhY2sgdG8gZXhlY3V0ZS5cbiAgICAkLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIHN1YnNjcmliZXIsIGNhbGxiYWNrICl7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGV2ZW50IHR5cGUgaGFzIGEgY29sbGVjdGlvblxuICAgICAgICAvLyBvZiBzdWJzY3JpYmVycyB5ZXQuXG4gICAgICAgIGlmICghKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSl7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZS5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdID0gW107XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdHlwZSBvZiBjYWxsYmFjayBpcyBhIHN0cmluZy5cbiAgICAgICAgLy8gSWYgaXQgaXMsIHdlIGFyZSBnb2luZyB0byBjb252ZXJ0IGl0IHRvIGEgbWV0aG9kXG4gICAgICAgIC8vIGNhbGwuXG4gICAgICAgIGlmICh0eXBlb2YoIGNhbGxiYWNrICkgPT0gXCJzdHJpbmdcIil7XG5cbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGNhbGxiYWNrIG5hbWUgdG8gYSByZWZlcmVuY2UgdG9cbiAgICAgICAgICAgIC8vIHRoZSBjYWxsYmFjayBvbiB0aGUgc3Vic2NyaWJlciBvYmplY3QuXG4gICAgICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJbIGNhbGxiYWNrIF07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGlzIHN1YnNjcmliZXIgZm9yIHRoZSBnaXZlbiBldmVudCB0eXBlLi5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0ucHVzaCh7XG4gICAgICAgICAgICBzdWJzY3JpYmVyOiBzdWJzY3JpYmVyLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgdW5zdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyBhbGxvd3MgYVxuICAgIC8vIHN1YnNjcmliZXIgdG8gdW5iaW5kIGl0cyBwcmV2aW91c2x5LWJvdW5kIGNhbGxiYWNrLlxuICAgICQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBtYWtlIHN1cmUgdGhlIGV2ZW50IHR5cGUgY29sbGVjdGlvblxuICAgICAgICAvLyBjdXJyZW50bHkgZXhpc3RzLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSB8fFxuICAgICAgICAgICAgIXN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLmxlbmd0aFxuICAgICAgICAgICAgKXtcblxuICAgICAgICAgICAgLy8gUmV0dXJuIG91dCAtIGlmIHRoZXJlJ3Mgbm8gc3Vic2NyaWJlclxuICAgICAgICAgICAgLy8gY29sbGVjdGlvbiBmb3IgdGhpcyBldmVudCB0eXBlLCB0aGVyZSdzXG4gICAgICAgICAgICAvLyBub3RoaW5nIGZvciB1cyB0byB1bmJpbmQuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hcCB0aGUgY3VycmVudCBzdWJzY3JpcHRpb24gY29sbGVjdGlvbiB0byBhIG5ld1xuICAgICAgICAvLyBvbmUgdGhhdCBkb2Vzbid0IGhhdmUgdGhlIGdpdmVuIGNhbGxiYWNrLlxuICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9ICQubWFwKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggc3Vic2NyaXB0aW9uICl7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgY2FsbGJhY2sgbWF0Y2hlcyB0aGVcbiAgICAgICAgICAgICAgICAvLyBvbmUgd2UgYXJlIHVuc3Vic2NyaWJpbmcuIElmIGl0IGRvZXMsIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGdvaW5nIHRvIHdhbnQgdG8gcmVtb3ZlIGl0IGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uLmNhbGxiYWNrID09IGNhbGxiYWNrKXtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gbnVsbCB0byByZW1vdmUgdGhpcyBtYXRjaGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBmcm9tIHRoZSBzdWJzcmliZXJzLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4oIG51bGwgKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBnaXZlbiBzdWJzY3JpcHRpb24gdG8ga2VlcFxuICAgICAgICAgICAgICAgICAgICAvLyBpdCBpbiB0aGUgc3Vic2NyaWJlcnMgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBzdWJzY3JpcHRpb24gKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHB1Ymxpc2ggZXh0ZW5zaW9uLiBUaGlzIHRha2VzIHRoZVxuICAgIC8vIHB1Ymxpc2hpbmcgb2JqZWN0LCB0aGUgdHlwZSBvZiBldmVudCwgYW5kIGFueVxuICAgIC8vIGFkZGl0aW9uYWwgZGF0YSB0aGF0IG5lZWQgdG8gYmUgcHVibGlzaGVkIHdpdGggdGhlXG4gICAgLy8gZXZlbnQuXG4gICAgJC5wdWJsaXNoID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgZGF0YSApe1xuICAgICAgICBkYXRhID0gZGF0YSA/IFtkYXRhXSA6IFtdXG4gICAgICAgIC8vIExvb3Agb3ZlciB0aGUgc3Vic3JpYmVycyBmb3IgdGhpcyBldmVudCB0eXBlXG4gICAgICAgIC8vIGFuZCBpbnZva2UgdGhlaXIgY2FsbGJhY2tzLlxuICAgICAgICAkLmVhY2goXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBpbmRleCwgc3Vic2NyaXB0aW9uICl7XG5cbiAgICAgICAgICAgICAgICAvLyBJbnZva2UgdGhlIGNhbGxiYWNrIGluIHRoZSBzdWJzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAvLyBjb250ZXh0IGFuZCBzdG9yZSB0aGUgcmVzdWx0IG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGluIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoIHN1YnNjcmlwdGlvbi5zdWJzY3JpYmVyLCBkYXRhKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZXZlbnQgb2JqZWN0LiBUaGlzIGV2ZW50IG9iamVjdCBtYXkgaGF2ZVxuICAgICAgICAvLyBiZWVuIGF1Z21lbnRlZCBieSBhbnkgb25lIG9mIHRoZSBzdWJzcmNpYmVycy5cbiAgICAgICAgcmV0dXJuKCBldmVudCApO1xuICAgIH07XG5cblxufSkoIGpRdWVyeSApO1xuXG4iLCIvKipcbiAqIFNjb3JlIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGZldGNoaW5nIGhpZ2ggc2NvcmVzIGFuZCBzeW5jaW5nIHRoZW0gdG8gc2VydmVyXG4gKiBHZXQgaW5qZWN0ZWQgd2l0aCB0aGUgRE9NIG1hbmlwdWxhdGlvbiBsaWJyYXJ5XG4gKi9cblxudmFyIHNjb3JlTW9kZWwgPSAoZnVuY3Rpb24oRE9NbGliKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gU3RvcmVzIGN1cnJlbnRcbiAgICAgICAgY3VycmVudFNjb3JlOiBudWxsLFxuXG4gICAgICAgIC8vIFN0b3JlcyB0aGUgY3VycmVudCBoaWdoIHNjb3JlcyB1c2luZyBcInBsYXllck5hbWU6dmFsdWVcIiBmb3JtYXRcbiAgICAgICAgaGlnaFNjb3JlOiB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5nZXRKU09OKCBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3NldEhpZ2hTY29yZXMgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKCBkYXRhICkge1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmUgPSBkYXRhXG4gICAgICAgIH1cbiAgICB9XG59KSggJCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjb3JlTW9kZWw7XG4iXX0=
