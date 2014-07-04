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
            if ( _scores.isHighScore(this.score) ) {
                this._newHighScore();
            } else {
                var newGame = confirm('Well done!\nDo you wanna go again?');
                newGame && this._restartGame();
            }
        },

        _newHighScore: function() {
            var name = prompt("Congrats, you have made it to the high score.\nPlease enter your name", "Gandalf");
            _scores
                .addHighScore(name, this.score)
                .save()
                .then( this._populatScores )
                .then( function() {
                    var newGame = confirm('One More?');
                    newGame && this._restartGame();
                }.bind(this));
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

        isHighScore: function( score ) {
            var l = this.highScores.length;
            return this.highScores[l-1].points <= score;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9jZWxsLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9mYWtlXzVmOGZkMTQwLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9nYW1lLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9ncmlkLmpzIiwiL1VzZXJzL29tYnJlL3d3dy9hY2NlZG9NZW1HYW1lL3B1YmxpYy9zY3JpcHRzL3NyYy9wb2x5ZmlsbHMuanMiLCIvVXNlcnMvb21icmUvd3d3L2FjY2Vkb01lbUdhbWUvcHVibGljL3NjcmlwdHMvc3JjL3B1YlN1Yi5qcyIsIi9Vc2Vycy9vbWJyZS93d3cvYWNjZWRvTWVtR2FtZS9wdWJsaWMvc2NyaXB0cy9zcmMvc2NvcmUubW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQ2VsbCBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBjcmVhdGluZyBhIHNpbmdsZSBjZWxsIG9iamVjdFxuICovXG5cblxudmFyIGNlbGwgPSAoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgX2NyZWF0ZUNlbGwgPSBmdW5jdGlvbiggY29sb3IsIGlkICkge1xuICAgICAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gJ2NlbGwgdHVybmVkLW92ZXInO1xuICAgICAgICBlbC5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIycgKyBjb2xvcjtcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKCdkYXRhLWNvbG9yJywgY29sb3IgKTtcbiAgICAgICAgZWwuaWQgPSBcImNlbGwtXCIgKyBpZDtcblxuICAgICAgICAkKGVsKS5vbignY2xpY2snLGV2ZW50SGFuZGxlcik7XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgdmFyIGV2ZW50SGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZWwgPSBlLnRhcmdldDtcbiAgICAgICAgaWYgKCBlbC5jbGFzc05hbWUuaW5kZXhPZigndHVybmVkLW92ZXInKSA+IC0xKSB7XG4gICAgICAgICAgICBlbC5jbGFzc05hbWUgPSAnY2VsbCc7XG4gICAgICAgICAgICAkLnB1Ymxpc2goXCJjZWxsQ2xpY2tlZFwiLCBlbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlOiBmdW5jdGlvbihjb2xvciwgaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBfY3JlYXRlQ2VsbCggY29sb3IsIGlkKTtcbiAgICAgICAgICAgIC8vXG4gICAgICAgIH1cbiAgICB9XG5cbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2VsbDtcbiIsIi8qKlxuICogRW50cnkgcG9pbnQgZm9yIHRoZSBicm93c2VyaWZ5IGJ1aWxkIHNjcmlwdFxuICpcbiAqL1xuXG52YXIgZ2FtZSA9IHJlcXVpcmUoJy4vZ2FtZS5qcycpO1xuLy8gQ3JlYXRlIGFuIGluc3RhbmNlIG9mIHRoZSBnYW1lXG5nYW1lLmluaXQoKTtcblxuIiwiLyoqXG4gKiBHYW1lIE9iamVjdFxuICogMSAtIE1hbmFnZXMgZ2FtZSBzY29wZTogcGFpckZvdW5kLCBTY29yZXNcbiAqIDIgLSBTcGF3biBHcmlkXG4gKi9cbnZhciBzY29yZXNNb2RlbCA9IHJlcXVpcmUoJy4vc2NvcmUubW9kZWwuanMnKTtcbnZhciBncmlkID0gcmVxdWlyZSgnLi9ncmlkLmpzJyk7XG5yZXF1aXJlKCcuL3B1YlN1Yi5qcycpO1xucmVxdWlyZSgnLi9wb2x5ZmlsbHMuanMnKTtcblxuXG52YXIgZ2FtZSA9IChmdW5jdGlvbigpIHtcblxuICAgIC8vIFN0b3JlcyB0aGUgc2NvcmUgcHJpdmF0bHlcbiAgICB2YXIgX3Njb3JlcyA9IG51bGw7XG5cbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHBhaXJGb3VuZDogMCxcblxuICAgICAgICBzY29yZTogMCxcblxuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyRXZlbnRzKCk7XG5cbiAgICAgICAgICAgIC8vIFN0b3JlIERPTSBlbGVtZW50c1xuICAgICAgICAgICAgdGhpcy5zY29yZURpc3BsYXkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2NvcmUtY291bnQnKTtcblxuICAgICAgICAgICAgLy8gR2VuZXJhdGUgcmFuZG9tIGNvbG9yIGdyaWRcbiAgICAgICAgICAgIGdyaWQuaW5pdCgpO1xuXG4gICAgICAgICAgICAvLyBGZXRjaCB0aGUgc2NvcmVzXG4gICAgICAgICAgICAgc2NvcmVzTW9kZWwuZmV0Y2goKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9zZXRTY29yZXMgKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9wb3B1bGF0U2NvcmVzIClcbiAgICAgICAgICAgICAgICAudGhlbiggdGhpcy5zdGFydCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVJbmNcIiwgc2VsZiwgc2VsZi5fc2NvcmVBZGRPbmUgKTtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwic2NvcmVEZWNcIiwgc2VsZiwgc2VsZi5fc2NvcmVSZW1vdmVPbmUgKTtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKFwicGFpckZvdW5kXCIsIHNlbGYsIHNlbGYuX3BhaXJGb3VuZENCICk7XG5cbiAgICAgICAgICAgICQoJyNyZXN0YXJ0JykuY2xpY2soIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVzdGFydEdhbWUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5fR0xPQkFMUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnR0FNRSBTVEFSVElORycpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRTY29yZXM6IGZ1bmN0aW9uKCBzY29yZXMgKSB7XG4gICAgICAgICAgICBfc2NvcmVzID0gc2NvcmVzO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9wb3B1bGF0U2NvcmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBodG1sID0gXCJcIjtcbiAgICAgICAgICAgIHZhciBzY29yZUNvdW50ID0gX3Njb3Jlcy5oaWdoU2NvcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIGlmICggc2NvcmVDb3VudCA+IDAgKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY29yZUNvdW50OyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHB0cyA9IF9zY29yZXMuaGlnaFNjb3Jlc1tpXS5wb2ludHM7XG4gICAgICAgICAgICAgICAgICAgIGh0bWwgKz0gJzxwPicgKyBfc2NvcmVzLmhpZ2hTY29yZXNbaV0ubmFtZSArICc6ICcgKyBwdHMgKyAnIHBvaW50JztcbiAgICAgICAgICAgICAgICAgICAgaHRtbCArPSBwdHMgPiAxID8gJ3MgPC9wPicgOiAnPC9wPic7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaHRtbCA9ICc8cD4gTm8gaGlnaCBTY29yZSBZZXQgPC9wPidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBoaWdoU2NvcmVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2hpZ2gtc2NvcmVzJyk7XG4gICAgICAgICAgICBoaWdoU2NvcmVzLmlubmVySFRNTCA9IGh0bWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3BhaXJGb3VuZENCOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMucGFpckZvdW5kICsrO1xuICAgICAgICAgICAgdGhpcy5wYWlyRm91bmQgPT09IDggJiYgdGhpcy5fZ2FtZUNvbXBsZXRlZCgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9yZXN0YXJ0R2FtZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlID0gMDtcbiAgICAgICAgICAgIGdyaWQuX2dhbWVSZXN0YXJ0KCk7XG4gICAgICAgICAgICB0aGlzLl9yZWZyZXNoU2NvcmVEaXNwbGF5KHRoaXMuc2NvcmUpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zY29yZUFkZE9uZTogZnVuY3Rpb24oIHBvaW50ICkge1xuICAgICAgICAgICAgdGhpcy5zY29yZSArKztcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3Njb3JlUmVtb3ZlT25lOiBmdW5jdGlvbiggcG9pbnQgKSB7XG4gICAgICAgICAgICB0aGlzLnNjb3JlICE9PSAwICYmIHRoaXMuc2NvcmUtLTtcbiAgICAgICAgICAgIHRoaXMuX3JlZnJlc2hTY29yZURpc3BsYXkodGhpcy5zY29yZSk7XG4gICAgICAgICB9LFxuXG4gICAgICAgIF9yZWZyZXNoU2NvcmVEaXNwbGF5OiBmdW5jdGlvbiggc2NvcmUgKSB7XG4gICAgICAgICAgICBzY29yZSA9IHNjb3JlIHx8IDA7XG4gICAgICAgICAgICB0aGlzLnNjb3JlRGlzcGxheS5pbm5lclRleHQgPSBzY29yZTtcbiAgICAgICAgfSxcblxuICAgICAgICBfZ2FtZUNvbXBsZXRlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIF9zY29yZXMuaXNIaWdoU2NvcmUodGhpcy5zY29yZSkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fbmV3SGlnaFNjb3JlKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBuZXdHYW1lID0gY29uZmlybSgnV2VsbCBkb25lIVxcbkRvIHlvdSB3YW5uYSBnbyBhZ2Fpbj8nKTtcbiAgICAgICAgICAgICAgICBuZXdHYW1lICYmIHRoaXMuX3Jlc3RhcnRHYW1lKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgX25ld0hpZ2hTY29yZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHByb21wdChcIkNvbmdyYXRzLCB5b3UgaGF2ZSBtYWRlIGl0IHRvIHRoZSBoaWdoIHNjb3JlLlxcblBsZWFzZSBlbnRlciB5b3VyIG5hbWVcIiwgXCJHYW5kYWxmXCIpO1xuICAgICAgICAgICAgX3Njb3Jlc1xuICAgICAgICAgICAgICAgIC5hZGRIaWdoU2NvcmUobmFtZSwgdGhpcy5zY29yZSlcbiAgICAgICAgICAgICAgICAuc2F2ZSgpXG4gICAgICAgICAgICAgICAgLnRoZW4oIHRoaXMuX3BvcHVsYXRTY29yZXMgKVxuICAgICAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0dhbWUgPSBjb25maXJtKCdPbmUgTW9yZT8nKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3R2FtZSAmJiB0aGlzLl9yZXN0YXJ0R2FtZSgpO1xuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xubW9kdWxlLmV4cG9ydHMgPSBnYW1lO1xuIiwiLyoqXG4gKiBHcmlkIE9iamVjdFxuICogMSAtIENyZWF0ZSBhIHJhbmRvbSBncmlkIGZyb20gdGhlIGNvbmZpZ3VyYXRpb24gb2JqZWN0XG4gKiAyIC0gUmVnaXN0ZXIga2V5Ym9hcmQgY29udHJvbHNcbiAqL1xuXG4vLyBDb25maWd1cmF0aW9uIE9iamVjdFxudmFyIGNvbmZpZyA9IHtcbiAgICBcInNpemVcIjogNCxcbiAgICBcImNvbG9yc1wiOiBbIFwiREQyMzJEXCIsIFwiRTBEQzJFXCIsIFwiNDZFNjJEXCIsIFwiMzdFNEI3XCIsIFwiMzA3OUUwXCIsIFwiNUExQUUwXCIsIFwiRkIxOEQ2XCIsIFwiRkI0MjFCXCIgXVxufTtcblxudmFyIGNlbGwgPSByZXF1aXJlKCcuL2NlbGwuanMnKTtcblxudmFyIHRpbWVvdXRJRCA9IG51bGw7XG5cbnZhciBncmlkID0gKGZ1bmN0aW9uKCkge1xuXG4gICAgX2dldFNodWZmZWxlZENvbG9ycyA9IGZ1bmN0aW9uKCBjb2xvcnMgKSB7XG4gICAgICAgIHZhciBzaHVmZmVsZWRDb2xvcnMgPSBbXTtcbiAgICAgICAgY29sb3JzID0gY29sb3JzLmNvbmNhdCggY29sb3JzLnNsaWNlKCkgKTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGNvbG9ycy5sZW5ndGg7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHZhciByYW5kID0gTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqICBsZW5ndGggKTtcbiAgICAgICAgICAgIHNodWZmZWxlZENvbG9ycy5wdXNoKCBjb2xvcnMuc3BsaWNlKHJhbmQsIDEpWzBdICk7XG4gICAgICAgICAgICBsZW5ndGggPSBjb2xvcnMubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlICggbGVuZ3RoIT0gMCApXG4gICAgICAgIHJldHVybiBzaHVmZmVsZWRDb2xvcnM7XG4gICAgfTtcblxuICAgIF9nZW5lcmF0ZUdyaWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGNvbG9ycyA9IF9nZXRTaHVmZmVsZWRDb2xvcnMoIGNvbmZpZy5jb2xvcnMgKTtcbiAgICAgICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2RpdicgKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxndGggPSBjb2xvcnMubGVuZ3RoIDsgaSA8IGxndGggOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjdXJyQ2VsbCA9IGNlbGwuY3JlYXRlKCBjb2xvcnNbaV0sIGkrMSApO1xuICAgICAgICAgICAgZWwuYXBwZW5kQ2hpbGQoIGN1cnJDZWxsICk7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBlbDtcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3VycmVudENlbGw6IG51bGwsXG5cbiAgICAgICAgZmxpcHBlZENlbGw6IG51bGwsXG5cbiAgICAgICAgZm9jdXNlZENlbGxJRDogMSxcblxuICAgICAgICBnYW1lQm9hcmQgOiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2dhbWUtYm9hcmQnICksXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3Rlckxpc3RlbmVycygpO1xuICAgICAgICAgICAgdGhpcy5nYW1lQm9hcmQuaW5uZXJIVE1MICA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLmdhbWVCb2FyZC5hcHBlbmRDaGlsZChfZ2VuZXJhdGVHcmlkKCkpO1xuICAgICAgICAgICAgdGhpcy5fc2V0Q2VsbEZvY3VzKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3JlZ2lzdGVyTGlzdGVuZXJzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQuc3Vic2NyaWJlKCBcImNlbGxDbGlja2VkXCIsIHRoaXMsIHRoaXMuX2NlbGxDbGlja2VkQ0IgKTtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLmtleWRvd24oIHRoaXMuX2tleUV2ZW50cy5iaW5kKHRoaXMpICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX2dhbWVSZXN0YXJ0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENlbGwgPSB0aGlzLmZsaXBwZWRDZWxsID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuZ2FtZUJvYXJkLmlubmVySFRNTCAgPSBcIlwiO1xuICAgICAgICAgICAgdGhpcy5nYW1lQm9hcmQuYXBwZW5kQ2hpbGQoX2dlbmVyYXRlR3JpZCgpKTtcbiAgICAgICAgfSxcblxuICAgICAgICBfa2V5RXZlbnRzOiBmdW5jdGlvbiggZXZlbnQgKSB7XG4gICAgICAgICAgICB2YXIgYyA9IGV2ZW50LmtleUNvZGU7XG4gICAgICAgICAgICBzd2l0Y2goYykge1xuICAgICAgICAgICAgICAgIC8vIGxlZnRcbiAgICAgICAgICAgICAgICBjYXNlIDM3OlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzZWRDZWxsSUQgPSB0aGlzLmZvY3VzZWRDZWxsSUQgPT09IDEgPyAxNiA6IHRoaXMuZm9jdXNlZENlbGxJRCAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHRvcFxuICAgICAgICAgICAgICAgIGNhc2UgMzg6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZm9jdXNlZENlbGxJRCA9IHRoaXMuZm9jdXNlZENlbGxJRCA8IDUgPyB0aGlzLmZvY3VzZWRDZWxsSUQgKyAxMiA6IHRoaXMuZm9jdXNlZENlbGxJRCAtIDQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIHJpZ2h0XG4gICAgICAgICAgICAgICAgY2FzZSAzOTpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb2N1c2VkQ2VsbElEID0gdGhpcy5mb2N1c2VkQ2VsbElEID09PSAxNiA/IDEgOiB0aGlzLmZvY3VzZWRDZWxsSUQgKyAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBib3R0b21cbiAgICAgICAgICAgICAgICBjYXNlIDQwOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvY3VzZWRDZWxsSUQgPSB0aGlzLmZvY3VzZWRDZWxsSUQgPiAxMiA/IHRoaXMuZm9jdXNlZENlbGxJRCAtIDEyIDogdGhpcy5mb2N1c2VkQ2VsbElEICsgNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gZW50ZXJcbiAgICAgICAgICAgICAgICBjYXNlIDEzOlxuICAgICAgICAgICAgICAgICAgICAkKCAnI2NlbGwtJyArIHRoaXMuZm9jdXNlZENlbGxJRCkuY2xpY2soKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX3NldENlbGxGb2N1cygpO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRDZWxsRm9jdXM6IGZ1bmN0aW9uKCBjb250ZXh0ICkge1xuICAgICAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgZG9jdW1lbnQ7XG4gICAgICAgICAgICAkKCcuY2VsbCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICQoICcjY2VsbC0nICsgdGhpcy5mb2N1c2VkQ2VsbElELCBjb250ZXh0KS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcblxuICAgICAgICBfY2VsbENsaWNrZWRDQjogZnVuY3Rpb24oIGNlbGwgKSB7XG4gICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgLy8gSWYgdGltZW91dCBhbHJlYWR5IGV4aXN0IHRoZW4gd2UgbmVlZCB0byByZXNldCB0aGUgcGFzdCBtb3ZlXG4gICAgICAgICAgICB0aW1lb3V0SUQgJiYgc2VsZi5fY2FuY2VsTW92ZXMoKTtcblxuICAgICAgICAgICAgc2VsZi5jdXJyZW50Q2VsbCA9IGNlbGw7XG5cbiAgICAgICAgICAgIGlmICggc2VsZi5mbGlwcGVkQ2VsbCApIHtcbiAgICAgICAgICAgICAgICBpZiAoICBzZWxmLmZsaXBwZWRDZWxsLmdldEF0dHJpYnV0ZSgnZGF0YS1jb2xvcicpID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgY2VsbC5nZXRBdHRyaWJ1dGUoJ2RhdGEtY29sb3InKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQucHVibGlzaCggXCJzY29yZUluY1wiICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkLnB1Ymxpc2goIFwicGFpckZvdW5kXCIgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmxpcHBlZENlbGwgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5fc2V0Q2VsbEZvY3VzKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGltZW91dElEID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2NhbmNlbE1vdmVzKCk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDcwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmZsaXBwZWRDZWxsID0gY2VsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBfY2FuY2VsTW92ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2VsbC5jbGFzc05hbWUgPSB0aGlzLmZsaXBwZWRDZWxsLmNsYXNzTmFtZSA9ICdjZWxsIHR1cm5lZC1vdmVyJztcbiAgICAgICAgICAgICQucHVibGlzaCggXCJzY29yZURlY1wiICk7XG4gICAgICAgICAgICB0aGlzLmZsaXBwZWRDZWxsID0gdGhpcy5jdXJyZW50Q2VsbCA9IG51bGw7XG4gICAgICAgICAgICB0aW1lb3V0SUQgJiYgd2luZG93LmNsZWFyVGltZW91dCggdGltZW91dElEICk7XG4gICAgICAgICAgICB0aW1lb3V0SUQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fc2V0Q2VsbEZvY3VzKCk7XG4gICAgICAgIH1cbiAgICB9XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGdyaWQ7XG4iLCJpZiAoIUZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kKSB7XG4gIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gKG9UaGlzKSB7XG4gICAgaWYgKHR5cGVvZiB0aGlzICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgIC8vIGNsb3Nlc3QgdGhpbmcgcG9zc2libGUgdG8gdGhlIEVDTUFTY3JpcHQgNVxuICAgICAgLy8gaW50ZXJuYWwgSXNDYWxsYWJsZSBmdW5jdGlvblxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kIC0gd2hhdCBpcyB0cnlpbmcgdG8gYmUgYm91bmQgaXMgbm90IGNhbGxhYmxlXCIpO1xuICAgIH1cblxuICAgIHZhciBhQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksIFxuICAgICAgICBmVG9CaW5kID0gdGhpcywgXG4gICAgICAgIGZOT1AgPSBmdW5jdGlvbiAoKSB7fSxcbiAgICAgICAgZkJvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBmVG9CaW5kLmFwcGx5KHRoaXMgaW5zdGFuY2VvZiBmTk9QICYmIG9UaGlzXG4gICAgICAgICAgICAgICAgID8gdGhpc1xuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxuICAgICAgICAgICAgICAgICBhQXJncy5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9O1xuXG4gICAgZk5PUC5wcm90b3R5cGUgPSB0aGlzLnByb3RvdHlwZTtcbiAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcblxuICAgIHJldHVybiBmQm91bmQ7XG4gIH07XG59XG5cbiIsIi8vIEJhc2VkIG9mIGh0dHA6Ly93d3cuYmVubmFkZWwuY29tL2Jsb2cvMjAzNy1zaW1wbGUtcHVibGljYXRpb24tYW5kLXN1YnNjcmlwdGlvbi1mdW5jdGlvbmFsaXR5LXB1Yi1zdWItd2l0aC1qcXVlcnkuaHRtXG5cbihmdW5jdGlvbiggJCApe1xuXG4gICAgLy8gQ3JlYXRlIGEgY29sbGVjdGlvbiBvZiBzdWJzY3JpcHRpb25zIHdoaWNoIGFyZSBqdXN0IGFcbiAgICAvLyBjb21iaW5hdGlvbiBvZiBldmVudCB0eXBlcyBhbmQgZXZlbnQgY2FsbGJhY2tzXG4gICAgLy8gdGhhdCBjYW4gYmUgYWxlcnRlZCB0byBwdWJsaXNoZWQgZXZlbnRzLlxuICAgIHZhciBzdWJzY3JpcHRpb25zID0ge307XG5cblxuICAgIC8vIENyZWF0ZSB0aGUgc3Vic2NyaWJlIGV4dGVuc2lvbnMuIFRoaXMgd2lsbCB0YWtlIHRoZVxuICAgIC8vIHN1YnNjcmliZXIgKGNvbnRleHQgZm9yIGNhbGxiYWNrIGV4ZWN1dGlvbiksIHRoZVxuICAgIC8vIGV2ZW50IHR5cGUsIGFuZCBhIGNhbGxiYWNrIHRvIGV4ZWN1dGUuXG4gICAgJC5zdWJzY3JpYmUgPSBmdW5jdGlvbiggZXZlbnRUeXBlLCBzdWJzY3JpYmVyLCBjYWxsYmFjayApe1xuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhpcyBldmVudCB0eXBlIGhhcyBhIGNvbGxlY3Rpb25cbiAgICAgICAgLy8gb2Ygc3Vic2NyaWJlcnMgeWV0LlxuICAgICAgICBpZiAoIShldmVudFR5cGUgaW4gc3Vic2NyaXB0aW9ucykpe1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgYSBjb2xsZWN0aW9uIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXSA9IFtdO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayB0byBzZWUgaWYgdGhlIHR5cGUgb2YgY2FsbGJhY2sgaXMgYSBzdHJpbmcuXG4gICAgICAgIC8vIElmIGl0IGlzLCB3ZSBhcmUgZ29pbmcgdG8gY29udmVydCBpdCB0byBhIG1ldGhvZFxuICAgICAgICAvLyBjYWxsLlxuICAgICAgICBpZiAodHlwZW9mKCBjYWxsYmFjayApID09IFwic3RyaW5nXCIpe1xuXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBjYWxsYmFjayBuYW1lIHRvIGEgcmVmZXJlbmNlIHRvXG4gICAgICAgICAgICAvLyB0aGUgY2FsbGJhY2sgb24gdGhlIHN1YnNjcmliZXIgb2JqZWN0LlxuICAgICAgICAgICAgY2FsbGJhY2sgPSBzdWJzY3JpYmVyWyBjYWxsYmFjayBdO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhpcyBzdWJzY3JpYmVyIGZvciB0aGUgZ2l2ZW4gZXZlbnQgdHlwZS4uXG4gICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLnB1c2goe1xuICAgICAgICAgICAgc3Vic2NyaWJlcjogc3Vic2NyaWJlcixcbiAgICAgICAgICAgIGNhbGxiYWNrOiBjYWxsYmFja1xuICAgICAgICB9KTtcbiAgICB9O1xuXG5cbiAgICAvLyBDcmVhdGUgdGhlIHVuc3Vic2NyaWJlIGV4dGVuc2lvbnMuIFRoaXMgYWxsb3dzIGFcbiAgICAvLyBzdWJzY3JpYmVyIHRvIHVuYmluZCBpdHMgcHJldmlvdXNseS1ib3VuZCBjYWxsYmFjay5cbiAgICAkLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oIGV2ZW50VHlwZSwgY2FsbGJhY2sgKXtcbiAgICAgICAgLy8gQ2hlY2sgdG8gbWFrZSBzdXJlIHRoZSBldmVudCB0eXBlIGNvbGxlY3Rpb25cbiAgICAgICAgLy8gY3VycmVudGx5IGV4aXN0cy5cbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgIShldmVudFR5cGUgaW4gc3Vic2NyaXB0aW9ucykgfHxcbiAgICAgICAgICAgICFzdWJzY3JpcHRpb25zWyBldmVudFR5cGUgXS5sZW5ndGhcbiAgICAgICAgICAgICl7XG5cbiAgICAgICAgICAgIC8vIFJldHVybiBvdXQgLSBpZiB0aGVyZSdzIG5vIHN1YnNjcmliZXJcbiAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24gZm9yIHRoaXMgZXZlbnQgdHlwZSwgdGhlcmUnc1xuICAgICAgICAgICAgLy8gbm90aGluZyBmb3IgdXMgdG8gdW5iaW5kLlxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBNYXAgdGhlIGN1cnJlbnQgc3Vic2NyaXB0aW9uIGNvbGxlY3Rpb24gdG8gYSBuZXdcbiAgICAgICAgLy8gb25lIHRoYXQgZG9lc24ndCBoYXZlIHRoZSBnaXZlbiBjYWxsYmFjay5cbiAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0gPSAkLm1hcChcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbnNbIGV2ZW50VHlwZSBdLFxuICAgICAgICAgICAgZnVuY3Rpb24oIHN1YnNjcmlwdGlvbiApe1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIHRvIHNlZSBpZiB0aGlzIGNhbGxiYWNrIG1hdGNoZXMgdGhlXG4gICAgICAgICAgICAgICAgLy8gb25lIHdlIGFyZSB1bnN1YnNjcmliaW5nLiBJZiBpdCBkb2VzLCB3ZVxuICAgICAgICAgICAgICAgIC8vIGFyZSBnb2luZyB0byB3YW50IHRvIHJlbW92ZSBpdCBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbi5jYWxsYmFjayA9PSBjYWxsYmFjayl7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUmV0dXJuIG51bGwgdG8gcmVtb3ZlIHRoaXMgbWF0Y2hpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgZnJvbSB0aGUgc3Vic3JpYmVycy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuKCBudWxsICk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldHVybiB0aGUgZ2l2ZW4gc3Vic2NyaXB0aW9uIHRvIGtlZXBcbiAgICAgICAgICAgICAgICAgICAgLy8gaXQgaW4gdGhlIHN1YnNjcmliZXJzIGNvbGxlY3Rpb24uXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiggc3Vic2NyaXB0aW9uICk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfTtcblxuXG4gICAgLy8gQ3JlYXRlIHRoZSBwdWJsaXNoIGV4dGVuc2lvbi4gVGhpcyB0YWtlcyB0aGVcbiAgICAvLyBwdWJsaXNoaW5nIG9iamVjdCwgdGhlIHR5cGUgb2YgZXZlbnQsIGFuZCBhbnlcbiAgICAvLyBhZGRpdGlvbmFsIGRhdGEgdGhhdCBuZWVkIHRvIGJlIHB1Ymxpc2hlZCB3aXRoIHRoZVxuICAgIC8vIGV2ZW50LlxuICAgICQucHVibGlzaCA9IGZ1bmN0aW9uKCBldmVudFR5cGUsIGRhdGEgKXtcbiAgICAgICAgZGF0YSA9IGRhdGEgPyBbZGF0YV0gOiBbXVxuICAgICAgICAvLyBMb29wIG92ZXIgdGhlIHN1YnNyaWJlcnMgZm9yIHRoaXMgZXZlbnQgdHlwZVxuICAgICAgICAvLyBhbmQgaW52b2tlIHRoZWlyIGNhbGxiYWNrcy5cbiAgICAgICAgJC5lYWNoKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uc1sgZXZlbnRUeXBlIF0sXG4gICAgICAgICAgICBmdW5jdGlvbiggaW5kZXgsIHN1YnNjcmlwdGlvbiApe1xuXG4gICAgICAgICAgICAgICAgLy8gSW52b2tlIHRoZSBjYWxsYmFjayBpbiB0aGUgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgICAgICAgLy8gY29udGV4dCBhbmQgc3RvcmUgdGhlIHJlc3VsdCBvZiB0aGVcbiAgICAgICAgICAgICAgICAvLyBjYWxsYmFjayBpbiB0aGUgZXZlbnQuXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmNhbGxiYWNrLmFwcGx5KCBzdWJzY3JpcHRpb24uc3Vic2NyaWJlciwgZGF0YSk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBSZXR1cm4gdGhlIGV2ZW50IG9iamVjdC4gVGhpcyBldmVudCBvYmplY3QgbWF5IGhhdmVcbiAgICAgICAgLy8gYmVlbiBhdWdtZW50ZWQgYnkgYW55IG9uZSBvZiB0aGUgc3Vic3JjaWJlcnMuXG4gICAgICAgIHJldHVybiggZXZlbnQgKTtcbiAgICB9O1xuXG5cbn0pKCBqUXVlcnkgKTtcblxuIiwiLyoqXG4gKiBTY29yZSBPYmplY3RcbiAqIFJlc3BvbnNpYmxlIGZvciBmZXRjaGluZyBoaWdoIHNjb3JlcyBhbmQgc3luY2luZyB0aGVtIHRvIHNlcnZlclxuICogR2V0IGluamVjdGVkIHdpdGggdGhlIERPTSBtYW5pcHVsYXRpb24gbGlicmFyeVxuICovXG5cbnZhciBzY29yZU1vZGVsID0gKGZ1bmN0aW9uKERPTWxpYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIC8vIFN0b3JlcyBjdXJyZW50XG4gICAgICAgIGN1cnJlbnRTY29yZTogbnVsbCxcblxuICAgICAgICAvLyBTdG9yZXMgdGhlIGN1cnJlbnQgaGlnaCBzY29yZXMgdXNpbmcgXCJwbGF5ZXJOYW1lOnZhbHVlXCIgZm9ybWF0XG4gICAgICAgIGhpZ2hTY29yZXM6IFtdLFxuXG4gICAgICAgIC8vIFJldHVybnMgYSBwcm9taXNlXG4gICAgICAgIGZldGNoOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBET01saWIuZ2V0SlNPTiggX0dMT0JBTFMuYmFzZVVSTCArIFwiL3Njb3Jlc1wiKVxuICAgICAgICAgICAgICAgIC50aGVuKCB0aGlzLl9zZXRIaWdoU2NvcmVzLmJpbmQodGhpcykgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gSlNPTi5zdHJpbmdpZnkodGhpcy5oaWdoU2NvcmVzKTtcbiAgICAgICAgICAgIHJldHVybiBET01saWIuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgICAgIHVybDogX0dMT0JBTFMuYmFzZVVSTCArIFwiL3Njb3Jlc1wiLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBcImRhdGE9XCIgKyBkYXRhXG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRIaWdoU2NvcmVzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB0aGlzLmhpZ2hTY29yZXMgPSBkYXRhO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNIaWdoU2NvcmU6IGZ1bmN0aW9uKCBzY29yZSApIHtcbiAgICAgICAgICAgIHZhciBsID0gdGhpcy5oaWdoU2NvcmVzLmxlbmd0aDtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZ2hTY29yZXNbbC0xXS5wb2ludHMgPD0gc2NvcmU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkSGlnaFNjb3JlOiBmdW5jdGlvbihuYW1lLCBzY29yZSkge1xuICAgICAgICAgICAgdmFyIG5ld1Njb3JlID0ge1wibmFtZVwiOiBuYW1lLCBcInBvaW50c1wiOiBzY29yZX07XG4gICAgICAgICAgICB0aGlzLmhpZ2hTY29yZXMubGVuZ3RoID4gNCAmJiB0aGlzLmhpZ2hTY29yZXMucG9wKCk7XG4gICAgICAgICAgICB0aGlzLmhpZ2hTY29yZXMucHVzaChuZXdTY29yZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSxcbiAgICB9XG59KSggJCApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNjb3JlTW9kZWw7XG4iXX0=
