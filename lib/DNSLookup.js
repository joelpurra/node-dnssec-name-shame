"use strict";

/*jslint white: true, todo: true */
/*global require: true, module: true */

var options = {
    return_dnssec_status: true,
    timeout: 5000
},

    lookupExtensions = {
        return_both_v4_and_v6: true
    },

    getdns = require("getdns"),
    Deferred = require("Deferred"),
    api;

function DNSLookup() {
    this.context = getdns.createContext(options);

    return this;
}

DNSLookup.prototype.lookup = function(domainname) {
    var deferred = new Deferred();

    this.context.getAddress(domainname, lookupExtensions, function(error, result) {
        if (error) {
            deferred.reject(error);
        }

        deferred.resolve(result);
    }.bind(this));

    return deferred.promise();
};

api = {
    DNSLookup: DNSLookup
};

module.exports = api;