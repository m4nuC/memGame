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
