"use strict";

/*global require: true, module: true */
/*eslint camelcase: 0, no-underscore-dangle: 0 */

const getdns = require("getdns"),
    Promise = require("bluebird"),
    getDnsHelpers = require("../lib/getdns-helpers.js"),

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
    const self = this;

    return new Promise(function(resolve, reject) {
        const recordTypeCode = getDnsHelpers.getRecordTypeCode(recordType);
        let transactionId = null;

        if (self._context === null) {
            throw new Error("No getdns context available.");
        }

        // TODO: won't use Promise.promisify() as the transaction id is returned synchronously.
        // The transaction id is only used to cancel requests though, afaik.
        // eslint-disable-next-line no-unused-vars
        transactionId = self._context.lookup(domainname, recordTypeCode, lookupExtensions, function(error, result, /* eslint-disable no-unused-vars */doneTransactionId/* eslint-enable no-unused-vars */) {
            if (error) {
                reject(error);

                return;
            }

            resolve(result);
        });
    });
};

module.exports = DNSLookup;
