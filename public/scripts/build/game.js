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
 * 1 - Create a random grid from the configuration object
 * 2 - Register keyboard controls
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
            var rand = Math.floor( Math.random() *  length );
            shuffeledColors.push( colors.splice(rand, 1)[0] );
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

        focusedCellID: 1,

        init: function() {
            this._registerListeners();
            document.getElementById( 'game-board' )
                    .appendChild( _generateGrid() );
            this._setCellFocus();
        },

        _registerListeners: function() {
            $.subscribe( "cellClicked", this, this._cellClickedCB );
            $.subscribe( "gameRestart", this, this._gameRestart );
            $(document).keydown( this._moveFocusedCell.bind(this) );
        },

        _gameRestart: function() {
            this.currentCell = null;
        },

        _moveFocusedCell: function( event ) {
            var c = event.keyCode;
            switch(c) {
                // left
                case 37:
                    this.focusedCellID = this.focusedCellID === 1 ? 16 : this.focusedCellID - 1;
                    break;
                // top
                case 38:
                    this.focusedCellID = this.focusedCellID < 5 ? this.focusedCellID + 12 : this.focusedCellID - 4;
                    break;
                // right
                case 39:
                    this.focusedCellID = this.focusedCellID === 16 ? 1 : this.focusedCellID + 1;
                    break;
                // bottom
                case 40:
                    this.focusedCellID = this.focusedCellID > 12 ? this.focusedCellID - 12 : this.focusedCellID + 4;
                    break;
            }

            this._setCellFocus();
        },

        _setCellFocus: function( context ) {
            context = context || document;
            $('.cell').removeClass('active');
            $( '#cell-' + this.focusedCellID, context).addClass('active');
            return this;
        },

        _cellClickedCB: function( cell ) {
            var self = this;

              // If timeout already exist then we need to reset the past move
            timeoutID && self._cancelMoves();

            self.currentCell = cell;

            if ( self.flippedCell ) {
                if (  self.flippedCell.getAttribute('data-color') ===
                        cell.getAttribute('data-color') ) {
                        $.publish( "scoreInc" );
                        $.publish( "pairFound" );
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
            $.publish( "scoreDec" );
            this.flippedCell = this.currentCell = null;
            timeoutID && window.clearTimeout( timeoutID );
            timeoutID = null;
            this._setCellFocus();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzM2YThlZDUyLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENlbGwgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgYSBzaW5nbGUgY2VsbCBvYmplY3RcbiAqL1xuXG5cbnZhciBjZWxsID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIF9jcmVhdGVDZWxsID0gZnVuY3Rpb24oIGNvbG9yLCBpZCApIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgY29sb3I7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicsIGNvbG9yICk7XG4gICAgICAgIGVsLmlkID0gXCJjZWxsLVwiICsgaWQ7XG5cbiAgICAgICAgJChlbCkub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIGVsLmNsYXNzTmFtZS5pbmRleE9mKCd0dXJuZWQtb3ZlcicpID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwnO1xuICAgICAgICAgICAgICAgICQucHVibGlzaChcImNlbGxDbGlja2VkXCIsIGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihjb2xvciwgaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBfY3JlYXRlQ2VsbCggY29sb3IsIGlkKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2VsbDtcbiIsIi8qKlxuICogRW50cnkgcG9pbnQgZm9yIHRoZSBicm93c2VyaWZ5IGJ1aWxkIHNjcmlwdFxuICpcbiAqL1xuXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS5qcycpO1xuLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBnYW1lXG5nYW1lLmluaXQoKTtcblxuIiwiLyoqXG4gKiBHYW1lIE9iamVjdFxuICogMSAtIE1hbmFnZXMgZ2FtZSBzY29wZTogcGFpckZvdW5kLCBTY29yZXNcbiAqIDIgLSBTcGF3biBHcmlkXG4gKi9cbnZhciBzY29yZXNNb2RlbCA9IHJlcXVpcmUoJy4vc2NvcmUubW9kZWwuanMnKTtcbnZhciBncmlkID0gcmVxdWlyZSgnLi9ncmlkLmpzJyk7XG5yZXF1aXJlKCcuL3B1YlN1Yi5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMuanMnKTtcblxuXG52YXIgZ2FtZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8vIFN0b3JlcyB0aGUgc2NvcmUgcHJpdmF0bHlcbiAgICB2YXIgX3Njb3JlcyA9IG51bGw7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHBhaXJGb3VuZDogMCxcblxuICAgICAgICBzY29yZTogMCxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyRXZlbnRzKCk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIERPTSBlbGVtZW50c1xuICAgICAgICAgICAgdGhpcy5zY29yZURpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NvcmUtY291bnQnKTtcblxuICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIGNvbG9yIGdyaWRcbiAgICAgICAgICAgIGdyaWQuaW5pdCgpO1xuXG4gICAgICAgICAgICAvLyBGZXRjaCB0aGUgc2NvcmVzXG4gICAgICAgICAgICAgc2NvcmVzTW9kZWwuZmV0Y2goKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9zZXRTY29yZXMgKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9wb3B1bGF0U2NvcmVzIClcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5zdGFydCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVJbmNcIiwgc2VsZiwgc2VsZi5fc2NvcmVBZGRPbmUgKTtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVEZWNcIiwgc2VsZiwgc2VsZi5fc2NvcmVSZW1vdmVPbmUgKTtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwicGFpckZvdW5kXCIsIHNlbGYsIHNlbGYuX3BhaXJGb3VuZENCICk7XG5cbiAgICAgICAgICAgICQoJyNyZXN0YXJ0JykuY2xpY2soIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVzdGFydEdhbWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5fR0xPQkFMUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnR0FNRSBTVEFSVElORycpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRTY29yZXM6IGZ1bmN0aW9uKCBzY29yZXMgKSB7XG4gICAgICAgICAgICBfc2NvcmVzID0gc2NvcmVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9wb3B1bGF0U2NvcmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gXCJcIjtcbiAgICAgICAgICAgIHZhciBzY29yZUNvdW50ID0gX3Njb3Jlcy5oaWdoU2NvcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHdpbmRvdy5fR0xPQkFMUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnUE9QVUxBVEUgU0NPUkVTJyk7XG4gICAgICAgICAgICBpZiAoIHNjb3JlQ291bnQgPiAwICkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NvcmVDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwdHMgPSBfc2NvcmVzLmhpZ2hTY29yZXNbaV0ucG9pbnRzO1xuICAgICAgICAgICAgICAgICAgICBodG1sICs9ICc8cD4nICsgX3Njb3Jlcy5oaWdoU2NvcmVzW2ldLm5hbWUgKyAnOiAnICsgcHRzICsgJyBwb2ludCc7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gcHRzID4gMSA/ICdzIDwvcD4nIDogJzwvcD4nO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGh0bWwgPSAnPHA+IE5vIGhpZ2ggU2NvcmUgWWV0IDwvcD4nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaGlnaFNjb3JlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaWdoLXNjb3JlcycpO1xuICAgICAgICAgICAgaGlnaFNjb3Jlcy5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9wYWlyRm91bmRDQjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnBhaXJGb3VuZCArKztcbiAgICAgICAgICAgIHRoaXMucGFpckZvdW5kID09PSA4ICYmIHRoaXMuX2dhbWVDb21wbGV0ZWQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVzdGFydEdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSA9IDA7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICAgICAgJCgnLmNlbGwnKS5hZGRDbGFzcyhcInR1cm5lZC1vdmVyXCIpO1xuICAgICAgICAgICAgJC5wdWJsaXNoKCdnYW1lUmVzdGFydCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuX25ld0hpZ2hTY29yZSgpO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3Njb3JlQWRkT25lOiBmdW5jdGlvbiggcG9pbnQgKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlICsrO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVSZW1vdmVPbmU6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmUgIT09IDAgJiYgdGhpcy5zY29yZS0tO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgX3JlZnJlc2hTY29yZURpc3BsYXk6IGZ1bmN0aW9uKCBzY29yZSApIHtcbiAgICAgICAgICAgIHNjb3JlID0gc2NvcmUgfHwgMDtcbiAgICAgICAgICAgIHRoaXMuc2NvcmVEaXNwbGF5LmlubmVyVGV4dCA9IHNjb3JlO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nYW1lQ29tcGxldGVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBuZXdHYW1lID0gY29uZmlybSgnV2VsbCBkb25lIFNpciFcXG5EbyB5b3Ugd2FubmEgZ28gYWdhaW4/Jyk7XG4gICAgICAgICAgICBuZXdHYW1lICYmIHRoaXMuX3Jlc3RhcnRHYW1lKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2lzSGlnaFNjb3JlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIF9zY29yZXMuaXNIaWdoU2NvcmUodGhpcy5zY29yZSkgJiYgdGhpcy5fbmV3SGlnaFNjb3JlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX25ld0hpZ2hTY29yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHByb21wdChcIkNvbmdyYXRzLCB5b3UgaGF2ZSBtYWRlIGl0IHRvIHRoZSBoaWdoIHNjb3JlLlxcblBsZWFzZSBlbnRlciB5b3VyIG5hbWVcIiwgXCJHYW5kYWxmXCIpO1xuICAgICAgICAgICAgX3Njb3Jlc1xuICAgICAgICAgICAgICAgIC5hZGRIaWdoU2NvcmUobmFtZSwgdGhpcy5zY29yZSlcbiAgICAgICAgICAgICAgICAuc2F2ZSgpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3BvcHVsYXRTY29yZXMgKTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGdhbWU7XG4iLCIvKipcbiAqIEdyaWQgT2JqZWN0XG4gKiAxIC0gQ3JlYXRlIGEgcmFuZG9tIGdyaWQgZnJvbSB0aGUgY29uZmlndXJhdGlvbiBvYmplY3RcbiAqIDIgLSBSZWdpc3RlciBrZXlib2FyZCBjb250cm9sc1xuICovXG5cbi8vIENvbmZpZ3VyYXRpb24gT2JqZWN0XG52YXIgY29uZmlnID0ge1xuICAgIFwic2l6ZVwiOiA0LFxuICAgIFwiY29sb3JzXCI6IFsgXCJERDIzMkRcIiwgXCJFMERDMkVcIiwgXCI0NkU2MkRcIiwgXCIzN0U0QjdcIiwgXCIzMDc5RTBcIiwgXCI1QTFBRTBcIiwgXCJGQjE4RDZcIiwgXCJGQjQyMUJcIiBdXG59O1xuXG52YXIgY2VsbCA9IHJlcXVpcmUoJy4vY2VsbC5qcycpO1xuXG52YXIgdGltZW91dElEID0gbnVsbDtcblxudmFyIGdyaWQgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICBfZ2V0U2h1ZmZlbGVkQ29sb3JzID0gZnVuY3Rpb24oIGNvbG9ycyApIHtcbiAgICAgICAgdmFyIHNodWZmZWxlZENvbG9ycyA9IFtdO1xuICAgICAgICBjb2xvcnMgPSBjb2xvcnMuY29uY2F0KCBjb2xvcnMuc2xpY2UoKSApO1xuICAgICAgICB2YXIgbGVuZ3RoID0gY29sb3JzLmxlbmd0aDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgdmFyIHJhbmQgPSBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogIGxlbmd0aCApO1xuICAgICAgICAgICAgc2h1ZmZlbGVkQ29sb3JzLnB1c2goIGNvbG9ycy5zcGxpY2UocmFuZCwgMSlbMF0gKTtcbiAgICAgICAgICAgIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCBsZW5ndGghPSAwIClcbiAgICAgICAgcmV0dXJuIHNodWZmZWxlZENvbG9ycztcbiAgICB9O1xuXG4gICAgX2dlbmVyYXRlR3JpZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY29sb3JzID0gX2dldFNodWZmZWxlZENvbG9ycyggY29uZmlnLmNvbG9ycyApO1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnZGl2JyApO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGd0aCA9IGNvbG9ycy5sZW5ndGggOyBpIDwgbGd0aCA7IGkrKykge1xuICAgICAgICAgICAgdmFyIGN1cnJDZWxsID0gY2VsbC5jcmVhdGUoIGNvbG9yc1tpXSwgaSsxICk7XG4gICAgICAgICAgICBlbC5hcHBlbmRDaGlsZCggY3VyckNlbGwgKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGVsO1xuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjdXJyZW50Q2VsbDogbnVsbCxcblxuICAgICAgICBmbGlwcGVkQ2VsbDogbnVsbCxcblxuICAgICAgICBmb2N1c2VkQ2VsbElEOiAxLFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZ2FtZS1ib2FyZCcgKVxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kQ2hpbGQoIF9nZW5lcmF0ZUdyaWQoKSApO1xuICAgICAgICAgICAgdGhpcy5fc2V0Q2VsbEZvY3VzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKCBcImNlbGxDbGlja2VkXCIsIHRoaXMsIHRoaXMuX2NlbGxDbGlja2VkQ0IgKTtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKCBcImdhbWVSZXN0YXJ0XCIsIHRoaXMsIHRoaXMuX2dhbWVSZXN0YXJ0ICk7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5rZXlkb3duKCB0aGlzLl9tb3ZlRm9jdXNlZENlbGwuYmluZCh0aGlzKSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nYW1lUmVzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDZWxsID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICBfbW92ZUZvY3VzZWRDZWxsOiBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgICAgICAgICB2YXIgYyA9IGV2ZW50LmtleUNvZGU7XG4gICAgICAgICAgICBzd2l0Y2goYykge1xuICAgICAgICAgICAgICAgIC8vIGxlZnRcbiAgICAgICAgICAgICAgICBjYXNlIDM3OlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzZWRDZWxsSUQgPSB0aGlzLmZvY3VzZWRDZWxsSUQgPT09IDEgPyAxNiA6IHRoaXMuZm9jdXNlZENlbGxJRCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHRvcFxuICAgICAgICAgICAgICAgIGNhc2UgMzg6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNlZENlbGxJRCA9IHRoaXMuZm9jdXNlZENlbGxJRCA8IDUgPyB0aGlzLmZvY3VzZWRDZWxsSUQgKyAxMiA6IHRoaXMuZm9jdXNlZENlbGxJRCAtIDQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHJpZ2h0XG4gICAgICAgICAgICAgICAgY2FzZSAzOTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb2N1c2VkQ2VsbElEID0gdGhpcy5mb2N1c2VkQ2VsbElEID09PSAxNiA/IDEgOiB0aGlzLmZvY3VzZWRDZWxsSUQgKyAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBib3R0b21cbiAgICAgICAgICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzZWRDZWxsSUQgPSB0aGlzLmZvY3VzZWRDZWxsSUQgPiAxMiA/IHRoaXMuZm9jdXNlZENlbGxJRCAtIDEyIDogdGhpcy5mb2N1c2VkQ2VsbElEICsgNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3NldENlbGxGb2N1cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRDZWxsRm9jdXM6IGZ1bmN0aW9uKCBjb250ZXh0ICkge1xuICAgICAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgZG9jdW1lbnQ7XG4gICAgICAgICAgICAkKCcuY2VsbCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICQoICcjY2VsbC0nICsgdGhpcy5mb2N1c2VkQ2VsbElELCBjb250ZXh0KS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfY2VsbENsaWNrZWRDQjogZnVuY3Rpb24oIGNlbGwgKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgLy8gSWYgdGltZW91dCBhbHJlYWR5IGV4aXN0IHRoZW4gd2UgbmVlZCB0byByZXNldCB0aGUgcGFzdCBtb3ZlXG4gICAgICAgICAgICB0aW1lb3V0SUQgJiYgc2VsZi5fY2FuY2VsTW92ZXMoKTtcblxuICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbCA9IGNlbGw7XG5cbiAgICAgICAgICAgIGlmICggc2VsZi5mbGlwcGVkQ2VsbCApIHtcbiAgICAgICAgICAgICAgICBpZiAoICBzZWxmLmZsaXBwZWRDZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQucHVibGlzaCggXCJzY29yZUluY1wiICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLnB1Ymxpc2goIFwicGFpckZvdW5kXCIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRJRCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9jYW5jZWxNb3ZlcygpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBjZWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIF9jYW5jZWxNb3ZlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDZWxsLmNsYXNzTmFtZSA9IHRoaXMuZmxpcHBlZENlbGwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICAgICAgJC5wdWJsaXNoKCBcInNjb3JlRGVjXCIgKTtcbiAgICAgICAgICAgIHRoaXMuZmxpcHBlZENlbGwgPSB0aGlzLmN1cnJlbnRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRpbWVvdXRJRCAmJiB3aW5kb3cuY2xlYXJUaW1lb3V0KCB0aW1lb3V0SUQgKTtcbiAgICAgICAgICAgIHRpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLl9zZXRDZWxsRm9jdXMoKTtcbiAgICAgICAgfVxuICAgIH1cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ3JpZDtcbiIsImlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcbiAgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgPSBmdW5jdGlvbiAob1RoaXMpIHtcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XG4gICAgICAvLyBpbnRlcm5hbCBJc0NhbGxhYmxlIGZ1bmN0aW9uXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGVcIik7XG4gICAgfVxuXG4gICAgdmFyIGFBcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSwgXG4gICAgICAgIGZUb0JpbmQgPSB0aGlzLCBcbiAgICAgICAgZk5PUCA9IGZ1bmN0aW9uICgpIHt9LFxuICAgICAgICBmQm91bmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1AgJiYgb1RoaXNcbiAgICAgICAgICAgICAgICAgPyB0aGlzXG4gICAgICAgICAgICAgICAgIDogb1RoaXMsXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH07XG5cbiAgICBmTk9QLnByb3RvdHlwZSA9IHRoaXMucHJvdG90eXBlO1xuICAgIGZCb3VuZC5wcm90b3R5cGUgPSBuZXcgZk5PUCgpO1xuXG4gICAgcmV0dXJuIGZCb3VuZDtcbiAgfTtcbn1cblxuIiwiLy8gQmFzZWQgb2YgaHR0cDovL3d3dy5iZW5uYWRlbC5jb20vYmxvZy8yMDM3LXNpbXBsZS1wdWJsaWNhdGlvbi1hbmQtc3Vic2NyaXB0aW9uLWZ1bmN0aW9uYWxpdHktcHViLXN1Yi13aXRoLWpxdWVyeS5odG1cblxuKGZ1bmN0aW9uKCAkICl7XG5cbiAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIG9mIHN1YnNjcmlwdGlvbnMgd2hpY2ggYXJlIGp1c3QgYVxuICAgIC8vIGNvbWJpbmF0aW9uIG9mIGV2ZW50IHR5cGVzIGFuZCBldmVudCBjYWxsYmFja3NcbiAgICAvLyB0aGF0IGNhbiBiZSBhbGVydGVkIHRvIHB1Ymxpc2hlZCBldmVudHMuXG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSB7fTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBzdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyB3aWxsIHRha2UgdGhlXG4gICAgLy8gc3Vic2NyaWJlciAoY29udGV4dCBmb3IgY2FsbGJhY2sgZXhlY3V0aW9uKSwgdGhlXG4gICAgLy8gZXZlbnQgdHlwZSwgYW5kIGEgY2FsbGJhY2sgdG8gZXhlY3V0ZS5cbiAgICAkLnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIHN1YnNjcmliZXIsIGNhbGxiYWNrICl7XG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGV2ZW50IHR5cGUgaGFzIGEgY29sbGVjdGlvblxuICAgICAgICAvLyBvZiBzdWJzY3JpYmVycyB5ZXQuXG4gICAgICAgIGlmICghKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSl7XG5cbiAgICAgICAgICAgIC8vIENyZWF0ZSBhIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZS5cbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdID0gW107XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGUgdHlwZSBvZiBjYWxsYmFjayBpcyBhIHN0cmluZy5cbiAgICAgICAgLy8gSWYgaXQgaXMsIHdlIGFyZSBnb2luZyB0byBjb252ZXJ0IGl0IHRvIGEgbWV0aG9kXG4gICAgICAgIC8vIGNhbGwuXG4gICAgICAgIGlmICh0eXBlb2YoIGNhbGxiYWNrICkgPT0gXCJzdHJpbmdcIil7XG5cbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGNhbGxiYWNrIG5hbWUgdG8gYSByZWZlcmVuY2UgdG9cbiAgICAgICAgICAgIC8vIHRoZSBjYWxsYmFjayBvbiB0aGUgc3Vic2NyaWJlciBvYmplY3QuXG4gICAgICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJbIGNhbGxiYWNrIF07XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGlzIHN1YnNjcmliZXIgZm9yIHRoZSBnaXZlbiBldmVudCB0eXBlLi5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0ucHVzaCh7XG4gICAgICAgICAgICBzdWJzY3JpYmVyOiBzdWJzY3JpYmVyLFxuICAgICAgICAgICAgY2FsbGJhY2s6IGNhbGxiYWNrXG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgdW5zdWJzY3JpYmUgZXh0ZW5zaW9ucy4gVGhpcyBhbGxvd3MgYVxuICAgIC8vIHN1YnNjcmliZXIgdG8gdW5iaW5kIGl0cyBwcmV2aW91c2x5LWJvdW5kIGNhbGxiYWNrLlxuICAgICQudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBtYWtlIHN1cmUgdGhlIGV2ZW50IHR5cGUgY29sbGVjdGlvblxuICAgICAgICAvLyBjdXJyZW50bHkgZXhpc3RzLlxuICAgICAgICBpZiAoXG4gICAgICAgICAgICAhKGV2ZW50VHlwZSBpbiBzdWJzY3JpcHRpb25zKSB8fFxuICAgICAgICAgICAgIXN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLmxlbmd0aFxuICAgICAgICAgICAgKXtcblxuICAgICAgICAgICAgLy8gUmV0dXJuIG91dCAtIGlmIHRoZXJlJ3Mgbm8gc3Vic2NyaWJlclxuICAgICAgICAgICAgLy8gY29sbGVjdGlvbiBmb3IgdGhpcyBldmVudCB0eXBlLCB0aGVyZSdzXG4gICAgICAgICAgICAvLyBub3RoaW5nIGZvciB1cyB0byB1bmJpbmQuXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1hcCB0aGUgY3VycmVudCBzdWJzY3JpcHRpb24gY29sbGVjdGlvbiB0byBhIG5ld1xuICAgICAgICAvLyBvbmUgdGhhdCBkb2Vzbid0IGhhdmUgdGhlIGdpdmVuIGNhbGxiYWNrLlxuICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9ICQubWFwKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggc3Vic2NyaXB0aW9uICl7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgY2FsbGJhY2sgbWF0Y2hlcyB0aGVcbiAgICAgICAgICAgICAgICAvLyBvbmUgd2UgYXJlIHVuc3Vic2NyaWJpbmcuIElmIGl0IGRvZXMsIHdlXG4gICAgICAgICAgICAgICAgLy8gYXJlIGdvaW5nIHRvIHdhbnQgdG8gcmVtb3ZlIGl0IGZyb20gdGhlXG4gICAgICAgICAgICAgICAgLy8gY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uLmNhbGxiYWNrID09IGNhbGxiYWNrKXtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gbnVsbCB0byByZW1vdmUgdGhpcyBtYXRjaGluZ1xuICAgICAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBmcm9tIHRoZSBzdWJzcmliZXJzLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4oIG51bGwgKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIHRoZSBnaXZlbiBzdWJzY3JpcHRpb24gdG8ga2VlcFxuICAgICAgICAgICAgICAgICAgICAvLyBpdCBpbiB0aGUgc3Vic2NyaWJlcnMgY29sbGVjdGlvbi5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBzdWJzY3JpcHRpb24gKTtcblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHB1Ymxpc2ggZXh0ZW5zaW9uLiBUaGlzIHRha2VzIHRoZVxuICAgIC8vIHB1Ymxpc2hpbmcgb2JqZWN0LCB0aGUgdHlwZSBvZiBldmVudCwgYW5kIGFueVxuICAgIC8vIGFkZGl0aW9uYWwgZGF0YSB0aGF0IG5lZWQgdG8gYmUgcHVibGlzaGVkIHdpdGggdGhlXG4gICAgLy8gZXZlbnQuXG4gICAgJC5wdWJsaXNoID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgZGF0YSApe1xuICAgICAgICBkYXRhID0gZGF0YSA/IFtkYXRhXSA6IFtdXG4gICAgICAgIC8vIExvb3Agb3ZlciB0aGUgc3Vic3JpYmVycyBmb3IgdGhpcyBldmVudCB0eXBlXG4gICAgICAgIC8vIGFuZCBpbnZva2UgdGhlaXIgY2FsbGJhY2tzLlxuICAgICAgICAkLmVhY2goXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBpbmRleCwgc3Vic2NyaXB0aW9uICl7XG5cbiAgICAgICAgICAgICAgICAvLyBJbnZva2UgdGhlIGNhbGxiYWNrIGluIHRoZSBzdWJzY3JpcHRpb25cbiAgICAgICAgICAgICAgICAvLyBjb250ZXh0IGFuZCBzdG9yZSB0aGUgcmVzdWx0IG9mIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGluIHRoZSBldmVudC5cbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb24uY2FsbGJhY2suYXBwbHkoIHN1YnNjcmlwdGlvbi5zdWJzY3JpYmVyLCBkYXRhKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIFJldHVybiB0aGUgZXZlbnQgb2JqZWN0LiBUaGlzIGV2ZW50IG9iamVjdCBtYXkgaGF2ZVxuICAgICAgICAvLyBiZWVuIGF1Z21lbnRlZCBieSBhbnkgb25lIG9mIHRoZSBzdWJzcmNpYmVycy5cbiAgICAgICAgcmV0dXJuKCBldmVudCApO1xuICAgIH07XG5cblxufSkoIGpRdWVyeSApO1xuXG4iLCIvKipcbiAqIFNjb3JlIE9iamVjdFxuICogUmVzcG9uc2libGUgZm9yIGZldGNoaW5nIGhpZ2ggc2NvcmVzIGFuZCBzeW5jaW5nIHRoZW0gdG8gc2VydmVyXG4gKiBHZXQgaW5qZWN0ZWQgd2l0aCB0aGUgRE9NIG1hbmlwdWxhdGlvbiBsaWJyYXJ5XG4gKi9cblxudmFyIHNjb3JlTW9kZWwgPSAoZnVuY3Rpb24oRE9NbGliKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgLy8gU3RvcmVzIGN1cnJlbnRcbiAgICAgICAgY3VycmVudFNjb3JlOiBudWxsLFxuXG4gICAgICAgIC8vIFN0b3JlcyB0aGUgY3VycmVudCBoaWdoIHNjb3JlcyB1c2luZyBcInBsYXllck5hbWU6dmFsdWVcIiBmb3JtYXRcbiAgICAgICAgaGlnaFNjb3JlczogW10sXG5cbiAgICAgICAgLy8gUmV0dXJucyBhIHByb21pc2VcbiAgICAgICAgZmV0Y2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5nZXRKU09OKCBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3NldEhpZ2hTY29yZXMuYmluZCh0aGlzKSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBKU09OLnN0cmluZ2lmeSh0aGlzLmhpZ2hTY29yZXMpO1xuICAgICAgICAgICAgcmV0dXJuIERPTWxpYi5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBfR0xPQkFMUy5iYXNlVVJMICsgXCIvc2NvcmVzXCIsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IFwiZGF0YT1cIiArIGRhdGFcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgX3NldEhpZ2hTY29yZXM6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3JlcyA9IGRhdGE7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNIaWdoU2NvcmU6IGZ1bmN0aW9uKCBzY29yZSApIHtcbiAgICAgICAgICAgIHZhciBsID0gdGhpcy5oaWdoU2NvcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZ2hTY29yZXNbbC0xXSA8PSBzY29yZTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRIaWdoU2NvcmU6IGZ1bmN0aW9uKG5hbWUsIHNjb3JlKSB7XG4gICAgICAgICAgICB2YXIgbmV3U2NvcmUgPSB7XCJuYW1lXCI6IG5hbWUsIFwicG9pbnRzXCI6IHNjb3JlfTtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3Jlcy5sZW5ndGggPiA0ICYmIHRoaXMuaGlnaFNjb3Jlcy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuaGlnaFNjb3Jlcy5wdXNoKG5ld1Njb3JlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuICAgIH1cbn0pKCAkICk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2NvcmVNb2RlbDtcbiJdfQ==
