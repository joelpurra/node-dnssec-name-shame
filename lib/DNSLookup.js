"use strict";

/*jslint white: true, todo: true */
/*global require: true, module: true */

var getdns = require("getdns"),
    Promise = require("bluebird"),
    getDnsHelpers = require("../lib/getDnsHelpers.js"),

    options = {
        return_dnssec_status: true,
        timeout: 5000,
    },

    lookupExtensions = {
        // TODO: re-enable despite making several types of lookups?
        // return_both_v4_and_v6: true
    };

function DNSLookup() {
    // TODO: document that the DNSLookup object needs to be destroyed in order to clean up the getdns context.
    this._context = getdns.createContext(options);

    return this;
}

DNSLookup.prototype.destroy = function() {
    this._context.destroy();
    this._context = null;
};

DNSLookup.prototype.lookup = function(domainname, recordType) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var recordTypeCode = getDnsHelpers.getRecordTypeCode(recordType),
            transactionId = null;

        if (self._context === null) {
            throw new Error("No getdns context available.");
        }

        // TODO: won't use Promise.promisify() as the transaction id is returned synchronously.
        // The transaction id is only used to cancel requests though, afaik.
        transactionId = self._context.lookup(domainname, recordTypeCode, lookupExtensions, function(error, result, doneTransactionId) {
            if (error) {
                reject(error);

                return;
            }

            resolve(result);
        });
    });
};

module.exports = DNSLookup;