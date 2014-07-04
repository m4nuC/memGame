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

        $(el).on('click',eventHandler);
        return el;
    };

    var eventHandler = function(e) {
        el = e.target;
        if ( el.className.indexOf('turned-over') > -1) {
            el.className = 'cell';
            $.publish("cellClicked", el);
        }
    }
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
            grid._gameRestart();
            this._refreshScoreDisplay(this.score);
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

        gameBoard : document.getElementById( 'game-board' ),

        init: function() {
            this._registerListeners();
            this.gameBoard.innerHTML  = "";
            this.gameBoard.appendChild(_generateGrid());
            this._setCellFocus();
        },

        _registerListeners: function() {
            $.subscribe( "cellClicked", this, this._cellClickedCB );
            $(document).keydown( this._keyEvents.bind(this) );
        },

        _gameRestart: function() {
            this.currentCell = this.flippedCell = null;
            this.gameBoard.innerHTML  = "";
            this.gameBoard.appendChild(_generateGrid());
        },

        _keyEvents: function( event ) {
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
                // enter
                case 13:
                    $( '#cell-' + this.focusedCellID).click();
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
                        self._setCellFocus();
                } else {
                    timeoutID = setTimeout(function() {
                        self._cancelMoves();
                    }, 700);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzRmNzc0MzI3LmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIENlbGwgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgY3JlYXRpbmcgYSBzaW5nbGUgY2VsbCBvYmplY3RcbiAqL1xuXG5cbnZhciBjZWxsID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIF9jcmVhdGVDZWxsID0gZnVuY3Rpb24oIGNvbG9yLCBpZCApIHtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIGVsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgZWwuc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyMnICsgY29sb3I7XG4gICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicsIGNvbG9yICk7XG4gICAgICAgIGVsLmlkID0gXCJjZWxsLVwiICsgaWQ7XG5cbiAgICAgICAgJChlbCkub24oJ2NsaWNrJyxldmVudEhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcblxuICAgIHZhciBldmVudEhhbmRsZXIgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGVsID0gZS50YXJnZXQ7XG4gICAgICAgIGlmICggZWwuY2xhc3NOYW1lLmluZGV4T2YoJ3R1cm5lZC1vdmVyJykgPiAtMSkge1xuICAgICAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwnO1xuICAgICAgICAgICAgJC5wdWJsaXNoKFwiY2VsbENsaWNrZWRcIiwgZWwpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24oY29sb3IsIGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gX2NyZWF0ZUNlbGwoIGNvbG9yLCBpZCk7XG4gICAgICAgICAgICAvL1xuICAgICAgICB9XG4gICAgfVxuXG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNlbGw7XG4iLCIvKipcbiAqIEVudHJ5IHBvaW50IGZvciB0aGUgYnJvd3NlcmlmeSBidWlsZCBzY3JpcHRcbiAqXG4gKi9cblxudmFyIGdhbWUgPSByZXF1aXJlKCcuL2dhbWUuanMnKTtcbi8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgZ2FtZVxuZ2FtZS5pbml0KCk7XG5cbiIsIi8qKlxuICogR2FtZSBPYmplY3RcbiAqIDEgLSBNYW5hZ2VzIGdhbWUgc2NvcGU6IHBhaXJGb3VuZCwgU2NvcmVzXG4gKiAyIC0gU3Bhd24gR3JpZFxuICovXG52YXIgc2NvcmVzTW9kZWwgPSByZXF1aXJlKCcuL3Njb3JlLm1vZGVsLmpzJyk7XG52YXIgZ3JpZCA9IHJlcXVpcmUoJy4vZ3JpZC5qcycpO1xucmVxdWlyZSgnLi9wdWJTdWIuanMnKTtcbnJlcXVpcmUoJy4vcG9seWZpbGxzLmpzJyk7XG5cblxudmFyIGdhbWUgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBTdG9yZXMgdGhlIHNjb3JlIHByaXZhdGx5XG4gICAgdmFyIF9zY29yZXMgPSBudWxsO1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBwYWlyRm91bmQ6IDAsXG5cbiAgICAgICAgc2NvcmU6IDAsXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlckV2ZW50cygpO1xuXG4gICAgICAgICAgICAvLyBTdG9yZSBET00gZWxlbWVudHNcbiAgICAgICAgICAgIHRoaXMuc2NvcmVEaXNwbGF5ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Njb3JlLWNvdW50Jyk7XG5cbiAgICAgICAgICAgIC8vIEdlbmVyYXRlIHJhbmRvbSBjb2xvciBncmlkXG4gICAgICAgICAgICBncmlkLmluaXQoKTtcblxuICAgICAgICAgICAgLy8gRmV0Y2ggdGhlIHNjb3Jlc1xuICAgICAgICAgICAgIHNjb3Jlc01vZGVsLmZldGNoKClcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5fc2V0U2NvcmVzIClcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5fcG9wdWxhdFNjb3JlcyApXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuc3RhcnQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3RlckV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlSW5jXCIsIHNlbGYsIHNlbGYuX3Njb3JlQWRkT25lICk7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInNjb3JlRGVjXCIsIHNlbGYsIHNlbGYuX3Njb3JlUmVtb3ZlT25lICk7XG4gICAgICAgICAgICAkLnN1YnNjcmliZShcInBhaXJGb3VuZFwiLCBzZWxmLCBzZWxmLl9wYWlyRm91bmRDQiApO1xuXG4gICAgICAgICAgICAkKCcjcmVzdGFydCcpLmNsaWNrKCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuX3Jlc3RhcnRHYW1lKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cuX0dMT0JBTFMuZGVidWcgJiYgY29uc29sZS5sb2coJ0dBTUUgU1RBUlRJTkcnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2V0U2NvcmVzOiBmdW5jdGlvbiggc2NvcmVzICkge1xuICAgICAgICAgICAgX3Njb3JlcyA9IHNjb3JlcztcbiAgICAgICAgfSxcblxuICAgICAgICBfcG9wdWxhdFNjb3JlczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgaHRtbCA9IFwiXCI7XG4gICAgICAgICAgICB2YXIgc2NvcmVDb3VudCA9IF9zY29yZXMuaGlnaFNjb3Jlcy5sZW5ndGg7XG4gICAgICAgICAgICBpZiAoIHNjb3JlQ291bnQgPiAwICkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NvcmVDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwdHMgPSBfc2NvcmVzLmhpZ2hTY29yZXNbaV0ucG9pbnRzO1xuICAgICAgICAgICAgICAgICAgICBodG1sICs9ICc8cD4nICsgX3Njb3Jlcy5oaWdoU2NvcmVzW2ldLm5hbWUgKyAnOiAnICsgcHRzICsgJyBwb2ludCc7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gcHRzID4gMSA/ICdzIDwvcD4nIDogJzwvcD4nO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGh0bWwgPSAnPHA+IE5vIGhpZ2ggU2NvcmUgWWV0IDwvcD4nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaGlnaFNjb3JlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdoaWdoLXNjb3JlcycpO1xuICAgICAgICAgICAgaGlnaFNjb3Jlcy5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9wYWlyRm91bmRDQjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnBhaXJGb3VuZCArKztcbiAgICAgICAgICAgIHRoaXMucGFpckZvdW5kID09PSA4ICYmIHRoaXMuX2dhbWVDb21wbGV0ZWQoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfcmVzdGFydEdhbWU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSA9IDA7XG4gICAgICAgICAgICBncmlkLl9nYW1lUmVzdGFydCgpO1xuICAgICAgICAgICAgdGhpcy5fcmVmcmVzaFNjb3JlRGlzcGxheSh0aGlzLnNjb3JlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2NvcmVBZGRPbmU6IGZ1bmN0aW9uKCBwb2ludCApIHtcbiAgICAgICAgICAgIHRoaXMuc2NvcmUgKys7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zY29yZVJlbW92ZU9uZTogZnVuY3Rpb24oIHBvaW50ICkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSAhPT0gMCAmJiB0aGlzLnNjb3JlLS07XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICAgfSxcblxuICAgICAgICBfcmVmcmVzaFNjb3JlRGlzcGxheTogZnVuY3Rpb24oIHNjb3JlICkge1xuICAgICAgICAgICAgc2NvcmUgPSBzY29yZSB8fCAwO1xuICAgICAgICAgICAgdGhpcy5zY29yZURpc3BsYXkuaW5uZXJUZXh0ID0gc2NvcmU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dhbWVDb21wbGV0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG5ld0dhbWUgPSBjb25maXJtKCdXZWxsIGRvbmUgU2lyIVxcbkRvIHlvdSB3YW5uYSBnbyBhZ2Fpbj8nKTtcbiAgICAgICAgICAgIG5ld0dhbWUgJiYgdGhpcy5fcmVzdGFydEdhbWUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfaXNIaWdoU2NvcmU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgX3Njb3Jlcy5pc0hpZ2hTY29yZSh0aGlzLnNjb3JlKSAmJiB0aGlzLl9uZXdIaWdoU2NvcmUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfbmV3SGlnaFNjb3JlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gcHJvbXB0KFwiQ29uZ3JhdHMsIHlvdSBoYXZlIG1hZGUgaXQgdG8gdGhlIGhpZ2ggc2NvcmUuXFxuUGxlYXNlIGVudGVyIHlvdXIgbmFtZVwiLCBcIkdhbmRhbGZcIik7XG4gICAgICAgICAgICBfc2NvcmVzXG4gICAgICAgICAgICAgICAgLmFkZEhpZ2hTY29yZShuYW1lLCB0aGlzLnNjb3JlKVxuICAgICAgICAgICAgICAgIC5zYXZlKClcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5fcG9wdWxhdFNjb3JlcyApO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcbm1vZHVsZS5leHBvcnRzID0gZ2FtZTtcbiIsIi8qKlxuICogR3JpZCBPYmplY3RcbiAqIDEgLSBDcmVhdGUgYSByYW5kb20gZ3JpZCBmcm9tIHRoZSBjb25maWd1cmF0aW9uIG9iamVjdFxuICogMiAtIFJlZ2lzdGVyIGtleWJvYXJkIGNvbnRyb2xzXG4gKi9cblxuLy8gQ29uZmlndXJhdGlvbiBPYmplY3RcbnZhciBjb25maWcgPSB7XG4gICAgXCJzaXplXCI6IDQsXG4gICAgXCJjb2xvcnNcIjogWyBcIkREMjMyRFwiLCBcIkUwREMyRVwiLCBcIjQ2RTYyRFwiLCBcIjM3RTRCN1wiLCBcIjMwNzlFMFwiLCBcIjVBMUFFMFwiLCBcIkZCMThENlwiLCBcIkZCNDIxQlwiIF1cbn07XG5cbnZhciBjZWxsID0gcmVxdWlyZSgnLi9jZWxsLmpzJyk7XG5cbnZhciB0aW1lb3V0SUQgPSBudWxsO1xuXG52YXIgZ3JpZCA9IChmdW5jdGlvbigpIHtcblxuICAgIF9nZXRTaHVmZmVsZWRDb2xvcnMgPSBmdW5jdGlvbiggY29sb3JzICkge1xuICAgICAgICB2YXIgc2h1ZmZlbGVkQ29sb3JzID0gW107XG4gICAgICAgIGNvbG9ycyA9IGNvbG9ycy5jb25jYXQoIGNvbG9ycy5zbGljZSgpICk7XG4gICAgICAgIHZhciBsZW5ndGggPSBjb2xvcnMubGVuZ3RoO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICB2YXIgcmFuZCA9IE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAgbGVuZ3RoICk7XG4gICAgICAgICAgICBzaHVmZmVsZWRDb2xvcnMucHVzaCggY29sb3JzLnNwbGljZShyYW5kLCAxKVswXSApO1xuICAgICAgICAgICAgbGVuZ3RoID0gY29sb3JzLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoIGxlbmd0aCE9IDAgKVxuICAgICAgICByZXR1cm4gc2h1ZmZlbGVkQ29sb3JzO1xuICAgIH07XG5cbiAgICBfZ2VuZXJhdGVHcmlkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBjb2xvcnMgPSBfZ2V0U2h1ZmZlbGVkQ29sb3JzKCBjb25maWcuY29sb3JzICk7XG4gICAgICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnICk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZ3RoID0gY29sb3JzLmxlbmd0aCA7IGkgPCBsZ3RoIDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY3VyckNlbGwgPSBjZWxsLmNyZWF0ZSggY29sb3JzW2ldLCBpKzEgKTtcbiAgICAgICAgICAgIGVsLmFwcGVuZENoaWxkKCBjdXJyQ2VsbCApO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGN1cnJlbnRDZWxsOiBudWxsLFxuXG4gICAgICAgIGZsaXBwZWRDZWxsOiBudWxsLFxuXG4gICAgICAgIGZvY3VzZWRDZWxsSUQ6IDEsXG5cbiAgICAgICAgZ2FtZUJvYXJkIDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdnYW1lLWJvYXJkJyApLFxuXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUJvYXJkLmlubmVySFRNTCAgPSBcIlwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQm9hcmQuYXBwZW5kQ2hpbGQoX2dlbmVyYXRlR3JpZCgpKTtcbiAgICAgICAgICAgIHRoaXMuX3NldENlbGxGb2N1cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZWdpc3Rlckxpc3RlbmVyczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLnN1YnNjcmliZSggXCJjZWxsQ2xpY2tlZFwiLCB0aGlzLCB0aGlzLl9jZWxsQ2xpY2tlZENCICk7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS5rZXlkb3duKCB0aGlzLl9rZXlFdmVudHMuYmluZCh0aGlzKSApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9nYW1lUmVzdGFydDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRDZWxsID0gdGhpcy5mbGlwcGVkQ2VsbCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmdhbWVCb2FyZC5pbm5lckhUTUwgID0gXCJcIjtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUJvYXJkLmFwcGVuZENoaWxkKF9nZW5lcmF0ZUdyaWQoKSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2tleUV2ZW50czogZnVuY3Rpb24oIGV2ZW50ICkge1xuICAgICAgICAgICAgdmFyIGMgPSBldmVudC5rZXlDb2RlO1xuICAgICAgICAgICAgc3dpdGNoKGMpIHtcbiAgICAgICAgICAgICAgICAvLyBsZWZ0XG4gICAgICAgICAgICAgICAgY2FzZSAzNzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb2N1c2VkQ2VsbElEID0gdGhpcy5mb2N1c2VkQ2VsbElEID09PSAxID8gMTYgOiB0aGlzLmZvY3VzZWRDZWxsSUQgLSAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvLyB0b3BcbiAgICAgICAgICAgICAgICBjYXNlIDM4OlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzZWRDZWxsSUQgPSB0aGlzLmZvY3VzZWRDZWxsSUQgPCA1ID8gdGhpcy5mb2N1c2VkQ2VsbElEICsgMTIgOiB0aGlzLmZvY3VzZWRDZWxsSUQgLSA0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvLyByaWdodFxuICAgICAgICAgICAgICAgIGNhc2UgMzk6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNlZENlbGxJRCA9IHRoaXMuZm9jdXNlZENlbGxJRCA9PT0gMTYgPyAxIDogdGhpcy5mb2N1c2VkQ2VsbElEICsgMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gYm90dG9tXG4gICAgICAgICAgICAgICAgY2FzZSA0MDpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb2N1c2VkQ2VsbElEID0gdGhpcy5mb2N1c2VkQ2VsbElEID4gMTIgPyB0aGlzLmZvY3VzZWRDZWxsSUQgLSAxMiA6IHRoaXMuZm9jdXNlZENlbGxJRCArIDQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIGVudGVyXG4gICAgICAgICAgICAgICAgY2FzZSAxMzpcbiAgICAgICAgICAgICAgICAgICAgJCggJyNjZWxsLScgKyB0aGlzLmZvY3VzZWRDZWxsSUQpLmNsaWNrKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9zZXRDZWxsRm9jdXMoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfc2V0Q2VsbEZvY3VzOiBmdW5jdGlvbiggY29udGV4dCApIHtcbiAgICAgICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IGRvY3VtZW50O1xuICAgICAgICAgICAgJCgnLmNlbGwnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAkKCAnI2NlbGwtJyArIHRoaXMuZm9jdXNlZENlbGxJRCwgY29udGV4dCkuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NlbGxDbGlja2VkQ0I6IGZ1bmN0aW9uKCBjZWxsICkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgICAgICAgIC8vIElmIHRpbWVvdXQgYWxyZWFkeSBleGlzdCB0aGVuIHdlIG5lZWQgdG8gcmVzZXQgdGhlIHBhc3QgbW92ZVxuICAgICAgICAgICAgdGltZW91dElEICYmIHNlbGYuX2NhbmNlbE1vdmVzKCk7XG5cbiAgICAgICAgICAgIHNlbGYuY3VycmVudENlbGwgPSBjZWxsO1xuXG4gICAgICAgICAgICBpZiAoIHNlbGYuZmxpcHBlZENlbGwgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCAgc2VsZi5mbGlwcGVkQ2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGwuZ2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLnB1Ymxpc2goIFwic2NvcmVJbmNcIiApO1xuICAgICAgICAgICAgICAgICAgICAgICAgJC5wdWJsaXNoKCBcInBhaXJGb3VuZFwiICk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmZsaXBwZWRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3NldENlbGxGb2N1cygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRpbWVvdXRJRCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9jYW5jZWxNb3ZlcygpO1xuICAgICAgICAgICAgICAgICAgICB9LCA3MDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5mbGlwcGVkQ2VsbCA9IGNlbGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2NhbmNlbE1vdmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENlbGwuY2xhc3NOYW1lID0gdGhpcy5mbGlwcGVkQ2VsbC5jbGFzc05hbWUgPSAnY2VsbCB0dXJuZWQtb3Zlcic7XG4gICAgICAgICAgICAkLnB1Ymxpc2goIFwic2NvcmVEZWNcIiApO1xuICAgICAgICAgICAgdGhpcy5mbGlwcGVkQ2VsbCA9IHRoaXMuY3VycmVudENlbGwgPSBudWxsO1xuICAgICAgICAgICAgdGltZW91dElEICYmIHdpbmRvdy5jbGVhclRpbWVvdXQoIHRpbWVvdXRJRCApO1xuICAgICAgICAgICAgdGltZW91dElEID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuX3NldENlbGxGb2N1cygpO1xuICAgICAgICB9XG4gICAgfVxufSkoKTtcblxubW9kdWxlLmV4cG9ydHMgPSBncmlkO1xuIiwiaWYgKCFGdW5jdGlvbi5wcm90b3R5cGUuYmluZCkge1xuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uIChvVGhpcykge1xuICAgIGlmICh0eXBlb2YgdGhpcyAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAvLyBjbG9zZXN0IHRoaW5nIHBvc3NpYmxlIHRvIHRoZSBFQ01BU2NyaXB0IDVcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGdW5jdGlvbi5wcm90b3R5cGUuYmluZCAtIHdoYXQgaXMgdHJ5aW5nIHRvIGJlIGJvdW5kIGlzIG5vdCBjYWxsYWJsZVwiKTtcbiAgICB9XG5cbiAgICB2YXIgYUFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLCBcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsIFxuICAgICAgICBmTk9QID0gZnVuY3Rpb24gKCkge30sXG4gICAgICAgIGZCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZlRvQmluZC5hcHBseSh0aGlzIGluc3RhbmNlb2YgZk5PUCAmJiBvVGhpc1xuICAgICAgICAgICAgICAgICA/IHRoaXNcbiAgICAgICAgICAgICAgICAgOiBvVGhpcyxcbiAgICAgICAgICAgICAgICAgYUFyZ3MuY29uY2F0KEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfTtcblxuICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XG4gICAgZkJvdW5kLnByb3RvdHlwZSA9IG5ldyBmTk9QKCk7XG5cbiAgICByZXR1cm4gZkJvdW5kO1xuICB9O1xufVxuXG4iLCIvLyBCYXNlZCBvZiBodHRwOi8vd3d3LmJlbm5hZGVsLmNvbS9ibG9nLzIwMzctc2ltcGxlLXB1YmxpY2F0aW9uLWFuZC1zdWJzY3JpcHRpb24tZnVuY3Rpb25hbGl0eS1wdWItc3ViLXdpdGgtanF1ZXJ5Lmh0bVxuXG4oZnVuY3Rpb24oICQgKXtcblxuICAgIC8vIENyZWF0ZSBhIGNvbGxlY3Rpb24gb2Ygc3Vic2NyaXB0aW9ucyB3aGljaCBhcmUganVzdCBhXG4gICAgLy8gY29tYmluYXRpb24gb2YgZXZlbnQgdHlwZXMgYW5kIGV2ZW50IGNhbGxiYWNrc1xuICAgIC8vIHRoYXQgY2FuIGJlIGFsZXJ0ZWQgdG8gcHVibGlzaGVkIGV2ZW50cy5cbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHt9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHN1YnNjcmliZSBleHRlbnNpb25zLiBUaGlzIHdpbGwgdGFrZSB0aGVcbiAgICAvLyBzdWJzY3JpYmVyIChjb250ZXh0IGZvciBjYWxsYmFjayBleGVjdXRpb24pLCB0aGVcbiAgICAvLyBldmVudCB0eXBlLCBhbmQgYSBjYWxsYmFjayB0byBleGVjdXRlLlxuICAgICQuc3Vic2NyaWJlID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgc3Vic2NyaWJlciwgY2FsbGJhY2sgKXtcbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoaXMgZXZlbnQgdHlwZSBoYXMgYSBjb2xsZWN0aW9uXG4gICAgICAgIC8vIG9mIHN1YnNjcmliZXJzIHlldC5cbiAgICAgICAgaWYgKCEoZXZlbnRUeXBlIGluIHN1YnNjcmlwdGlvbnMpKXtcblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgY29sbGVjdGlvbiBmb3IgdGhpcyBldmVudCB0eXBlLlxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0gPSBbXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB0eXBlIG9mIGNhbGxiYWNrIGlzIGEgc3RyaW5nLlxuICAgICAgICAvLyBJZiBpdCBpcywgd2UgYXJlIGdvaW5nIHRvIGNvbnZlcnQgaXQgdG8gYSBtZXRob2RcbiAgICAgICAgLy8gY2FsbC5cbiAgICAgICAgaWYgKHR5cGVvZiggY2FsbGJhY2sgKSA9PSBcInN0cmluZ1wiKXtcblxuICAgICAgICAgICAgLy8gQ29udmVydCB0aGUgY2FsbGJhY2sgbmFtZSB0byBhIHJlZmVyZW5jZSB0b1xuICAgICAgICAgICAgLy8gdGhlIGNhbGxiYWNrIG9uIHRoZSBzdWJzY3JpYmVyIG9iamVjdC5cbiAgICAgICAgICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlclsgY2FsbGJhY2sgXTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHRoaXMgc3Vic2NyaWJlciBmb3IgdGhlIGdpdmVuIGV2ZW50IHR5cGUuLlxuICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXS5wdXNoKHtcbiAgICAgICAgICAgIHN1YnNjcmliZXI6IHN1YnNjcmliZXIsXG4gICAgICAgICAgICBjYWxsYmFjazogY2FsbGJhY2tcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSB1bnN1YnNjcmliZSBleHRlbnNpb25zLiBUaGlzIGFsbG93cyBhXG4gICAgLy8gc3Vic2NyaWJlciB0byB1bmJpbmQgaXRzIHByZXZpb3VzbHktYm91bmQgY2FsbGJhY2suXG4gICAgJC51bnN1YnNjcmliZSA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIGNhbGxiYWNrICl7XG4gICAgICAgIC8vIENoZWNrIHRvIG1ha2Ugc3VyZSB0aGUgZXZlbnQgdHlwZSBjb2xsZWN0aW9uXG4gICAgICAgIC8vIGN1cnJlbnRseSBleGlzdHMuXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgICEoZXZlbnRUeXBlIGluIHN1YnNjcmlwdGlvbnMpIHx8XG4gICAgICAgICAgICAhc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0ubGVuZ3RoXG4gICAgICAgICAgICApe1xuXG4gICAgICAgICAgICAvLyBSZXR1cm4gb3V0IC0gaWYgdGhlcmUncyBubyBzdWJzY3JpYmVyXG4gICAgICAgICAgICAvLyBjb2xsZWN0aW9uIGZvciB0aGlzIGV2ZW50IHR5cGUsIHRoZXJlJ3NcbiAgICAgICAgICAgIC8vIG5vdGhpbmcgZm9yIHVzIHRvIHVuYmluZC5cbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTWFwIHRoZSBjdXJyZW50IHN1YnNjcmlwdGlvbiBjb2xsZWN0aW9uIHRvIGEgbmV3XG4gICAgICAgIC8vIG9uZSB0aGF0IGRvZXNuJ3QgaGF2ZSB0aGUgZ2l2ZW4gY2FsbGJhY2suXG4gICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdID0gJC5tYXAoXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBzdWJzY3JpcHRpb24gKXtcbiAgICAgICAgICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBjYWxsYmFjayBtYXRjaGVzIHRoZVxuICAgICAgICAgICAgICAgIC8vIG9uZSB3ZSBhcmUgdW5zdWJzY3JpYmluZy4gSWYgaXQgZG9lcywgd2VcbiAgICAgICAgICAgICAgICAvLyBhcmUgZ29pbmcgdG8gd2FudCB0byByZW1vdmUgaXQgZnJvbSB0aGVcbiAgICAgICAgICAgICAgICAvLyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24uY2FsbGJhY2sgPT0gY2FsbGJhY2spe1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiBudWxsIHRvIHJlbW92ZSB0aGlzIG1hdGNoaW5nXG4gICAgICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGZyb20gdGhlIHN1YnNyaWJlcnMuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiggbnVsbCApO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGdpdmVuIHN1YnNjcmlwdGlvbiB0byBrZWVwXG4gICAgICAgICAgICAgICAgICAgIC8vIGl0IGluIHRoZSBzdWJzY3JpYmVycyBjb2xsZWN0aW9uLlxuICAgICAgICAgICAgICAgICAgICByZXR1cm4oIHN1YnNjcmlwdGlvbiApO1xuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgcHVibGlzaCBleHRlbnNpb24uIFRoaXMgdGFrZXMgdGhlXG4gICAgLy8gcHVibGlzaGluZyBvYmplY3QsIHRoZSB0eXBlIG9mIGV2ZW50LCBhbmQgYW55XG4gICAgLy8gYWRkaXRpb25hbCBkYXRhIHRoYXQgbmVlZCB0byBiZSBwdWJsaXNoZWQgd2l0aCB0aGVcbiAgICAvLyBldmVudC5cbiAgICAkLnB1Ymxpc2ggPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBkYXRhICl7XG4gICAgICAgIGRhdGEgPSBkYXRhID8gW2RhdGFdIDogW11cbiAgICAgICAgLy8gTG9vcCBvdmVyIHRoZSBzdWJzcmliZXJzIGZvciB0aGlzIGV2ZW50IHR5cGVcbiAgICAgICAgLy8gYW5kIGludm9rZSB0aGVpciBjYWxsYmFja3MuXG4gICAgICAgICQuZWFjaChcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLFxuICAgICAgICAgICAgZnVuY3Rpb24oIGluZGV4LCBzdWJzY3JpcHRpb24gKXtcblxuICAgICAgICAgICAgICAgIC8vIEludm9rZSB0aGUgY2FsbGJhY2sgaW4gdGhlIHN1YnNjcmlwdGlvblxuICAgICAgICAgICAgICAgIC8vIGNvbnRleHQgYW5kIHN0b3JlIHRoZSByZXN1bHQgb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgaW4gdGhlIGV2ZW50LlxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5jYWxsYmFjay5hcHBseSggc3Vic2NyaXB0aW9uLnN1YnNjcmliZXIsIGRhdGEpO1xuXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBldmVudCBvYmplY3QuIFRoaXMgZXZlbnQgb2JqZWN0IG1heSBoYXZlXG4gICAgICAgIC8vIGJlZW4gYXVnbWVudGVkIGJ5IGFueSBvbmUgb2YgdGhlIHN1YnNyY2liZXJzLlxuICAgICAgICByZXR1cm4oIGV2ZW50ICk7XG4gICAgfTtcblxuXG59KSggalF1ZXJ5ICk7XG5cbiIsIi8qKlxuICogU2NvcmUgT2JqZWN0XG4gKiBSZXNwb25zaWJsZSBmb3IgZmV0Y2hpbmcgaGlnaCBzY29yZXMgYW5kIHN5bmNpbmcgdGhlbSB0byBzZXJ2ZXJcbiAqIEdldCBpbmplY3RlZCB3aXRoIHRoZSBET00gbWFuaXB1bGF0aW9uIGxpYnJhcnlcbiAqL1xuXG52YXIgc2NvcmVNb2RlbCA9IChmdW5jdGlvbihET01saWIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvLyBTdG9yZXMgY3VycmVudFxuICAgICAgICBjdXJyZW50U2NvcmU6IG51bGwsXG5cbiAgICAgICAgLy8gU3RvcmVzIHRoZSBjdXJyZW50IGhpZ2ggc2NvcmVzIHVzaW5nIFwicGxheWVyTmFtZTp2YWx1ZVwiIGZvcm1hdFxuICAgICAgICBoaWdoU2NvcmVzOiBbXSxcblxuICAgICAgICAvLyBSZXR1cm5zIGEgcHJvbWlzZVxuICAgICAgICBmZXRjaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gRE9NbGliLmdldEpTT04oIF9HTE9CQUxTLmJhc2VVUkwgKyBcIi9zY29yZXNcIilcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5fc2V0SGlnaFNjb3Jlcy5iaW5kKHRoaXMpICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IEpTT04uc3RyaW5naWZ5KHRoaXMuaGlnaFNjb3Jlcyk7XG4gICAgICAgICAgICByZXR1cm4gRE9NbGliLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IF9HTE9CQUxTLmJhc2VVUkwgKyBcIi9zY29yZXNcIixcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogXCJkYXRhPVwiICsgZGF0YVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcblxuICAgICAgICBfc2V0SGlnaFNjb3JlczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmVzID0gZGF0YTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9pc0hpZ2hTY29yZTogZnVuY3Rpb24oIHNjb3JlICkge1xuICAgICAgICAgICAgdmFyIGwgPSB0aGlzLmhpZ2hTY29yZXMubGVuZ3RoO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGlnaFNjb3Jlc1tsLTFdIDw9IHNjb3JlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZEhpZ2hTY29yZTogZnVuY3Rpb24obmFtZSwgc2NvcmUpIHtcbiAgICAgICAgICAgIHZhciBuZXdTY29yZSA9IHtcIm5hbWVcIjogbmFtZSwgXCJwb2ludHNcIjogc2NvcmV9O1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmVzLmxlbmd0aCA+IDQgJiYgdGhpcy5oaWdoU2NvcmVzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5oaWdoU2NvcmVzLnB1c2gobmV3U2NvcmUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG4gICAgfVxufSkoICQgKTtcblxubW9kdWxlLmV4cG9ydHMgPSBzY29yZU1vZGVsO1xuIl19
