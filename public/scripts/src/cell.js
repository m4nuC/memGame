/**
 * Cell Object
 * Responsible for creating a single cell object
 */


var cell = (function() {

    var _createCell = function( color ) {
        var el = document.createElement('div');
        el.className = 'cell turned-over';
        el.style.backgroundColor = '#' + color;
        el.setAttribute('data', 'color' );
        return el;
    };

    return {
        create: function(color) {
            return _createCell( color);
            //
        }
    }

})();

module.exports = cell;
