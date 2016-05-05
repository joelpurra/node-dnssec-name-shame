"use strict";

/*global require: true, module: true */

var mongo = require("mongodb"),

    toObjectID = function(id) {
        if (!(id instanceof mongo.ObjectID)) {
            return new mongo.ObjectID(id);
        }

        return id;
    };

module.exports = toObjectID;
