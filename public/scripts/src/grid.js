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
