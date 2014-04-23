"use strict";

/*jslint white: true, todo: true */
/*global module: true */

var deepCleanKeysFromDots = function(obj) {
    var isObject = function(obj) {
        var result = (typeof obj === 'object' || typeof obj === 'function') && (obj !== null);

        return result;
    };

    if (isObject(obj)) {
        Object.keys(obj).forEach(function(key) {
            var clean = key.replace(/\./g, "___dot___");

            obj[clean] = deepCleanKeysFromDots(obj[key]);

            if (clean !== key) {
                delete obj[key];
            }
        });
    }

    return obj;
},

    api = deepCleanKeysFromDots;

module.exports = api;