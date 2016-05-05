"use strict";

/*global module: true */

var callWithFirstInArray = function(fn, context) {
    context = context || null;

    var wrapped = function(array) {
        return fn.call(context, array[0]);
    };

    return wrapped;
};

module.exports = callWithFirstInArray;
