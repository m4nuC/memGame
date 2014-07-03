/**
 * Cell Object
 * Responsible for creating a single cell object
 */


var cell = (function() {

    var _createCell = function( color ) {
        var el = document.createElement('div');
        el.className = 'cell';
        el.style.backgroundColor = '#' + color;
        el.setAttribute('data', 'color' );
        return el;
    };

    return {
        create: function(color) {
            console.log(color);
            return _createCell( color);
            //
        }
    }

})();

module.exports = cell;
