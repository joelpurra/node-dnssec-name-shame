"use strict";

/*jslint white: true, todo: true */
/*global module: true */

var callWithFirstInArray = function(fn, context) {
    context = context || null;

    var wrapped = function(array) {
        return fn.call(context, array[0]);
    };

    return wrapped;
},

    api = callWithFirstInArray;

module.exports = api;