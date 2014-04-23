"use strict";

/*jslint white: true, todo: true */
/*global require: true, module: true */

var options = {
    return_dnssec_status: true,
    timeout: 5000
},

    getdns = require('getdns'),
    Deferred = require('Deferred'),
    api;

function DNSLookup() {
    this.context = getdns.createContext(options);

    return this;
}

DNSLookup.prototype.lookup = function(domainname, type) {
    var deferred = new Deferred(),
        type = type || getdns.RRTYPE_A;

    this.context.lookup(domainname, type, function(error, result) {
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