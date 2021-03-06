"use strict";

/*global require: true, module: true */
/*eslint camelcase: "off", no-underscore-dangle: "off" */

// TODO: check promise usage best practices.

const logger = require("../lib/logger.js")("DNSSECNameAndShameLookerUpper"),
    Promise = require("bluebird"),
    extend = require("extend"),
    DNSLookup = require("../lib/dns-lookup.js"),
    dnsLookup = new DNSLookup(),
    getDnsHelpers = require("../lib/getdns-helpers.js"),

    // TODO: share constants?
    STATUS_SECURE = "secure",
    STATUS_INSECURE = "insecure",
    STATUS_UNKNOWN = "unknown";

function DNSSECNameAndShameLookerUpper(database, domainname, options) {
    // TODO: improve error handling.
    if (!database) {
        throw new Error();
    }

    // TODO: improve error handling.
    if (!domainname) {
        throw new Error();
    }

    this.database = database;
    this.domainname = domainname;
    this.options = extend({}, DNSSECNameAndShameLookerUpper.defaultOptions, options);
    this.domain = null;
}

DNSSECNameAndShameLookerUpper.defaultOptions = {
    recordTypes: [
        "a",
        "aaaa",
        "cname",
        "mx",
        "soa",
    ],
};

DNSSECNameAndShameLookerUpper.prototype._handleError = function(error) {
    // TODO: log this error in a better way
    logger.error("_handleError", error);

    throw error;
};

DNSSECNameAndShameLookerUpper.prototype._addDNSLookupMetadata = function(records) {
    const generatedAt = new Date().valueOf(),
        obj = {
            domainname: this.domainname,
            generatedAt: generatedAt,
            records: records,
        };

    return obj;
};

DNSSECNameAndShameLookerUpper.prototype._saveRecordsToDatabase = function(dnsLookupWithMetadata) {
    return this.database.DNSLookupHistory.insertOne(dnsLookupWithMetadata);
};

DNSSECNameAndShameLookerUpper.prototype._stripDNSLookupObjectForFrontend = function(records) {
    const recordTypesStatus = getDnsHelpers.getRecordTypesStatus(records, this.options.recordTypes),
        hasRecords = getDnsHelpers.areAnyRecordTypesExistant(recordTypesStatus),
        isSecure = getDnsHelpers.areAllRecordTypesSecureOrNonExistant(recordTypesStatus),
        result = {
            recordTypesStatus: recordTypesStatus,
            hasRecords: hasRecords,
            isSecure: isSecure,
        };

    return result;
};

DNSSECNameAndShameLookerUpper.prototype._getStrippedRecordsStatus = function(strippedRecordTypesStatus) {
    let result = STATUS_UNKNOWN;
    const hasAnyRecords = Object.keys(strippedRecordTypesStatus).some(function(recordType) {
            return (strippedRecordTypesStatus[recordType] === STATUS_SECURE || strippedRecordTypesStatus[recordType] === STATUS_INSECURE);
        }),
        isAllSecureOrNonExistant = Object.keys(strippedRecordTypesStatus).every(function(recordType) {
            return (strippedRecordTypesStatus[recordType] === STATUS_SECURE || strippedRecordTypesStatus[recordType] === STATUS_UNKNOWN);
        });

    if (hasAnyRecords === true && isAllSecureOrNonExistant === true) {
        result = STATUS_SECURE;
    } else if (hasAnyRecords === false && isAllSecureOrNonExistant === true) {
        result = STATUS_UNKNOWN;
    } else {
        result = STATUS_INSECURE;
    }

    return result;
};

DNSSECNameAndShameLookerUpper.prototype._getDNSSECStatusString = function(status) {
    if (status === true) {
        return STATUS_SECURE;
    } else if (status === false) {
        return STATUS_INSECURE;
    }

    return STATUS_UNKNOWN;
};

DNSSECNameAndShameLookerUpper.prototype._createResultsObjectForFrontend = function(dnsLookupWithMetadata) {
    const self = this,
        strippedRecords = Object.keys(dnsLookupWithMetadata.records).reduce(function(obj, recordType) {
            const record = dnsLookupWithMetadata.records[recordType],
                all = self._stripDNSLookupObjectForFrontend(record),
                current = all.recordTypesStatus[recordType],
                statusString = self._getDNSSECStatusString(current);

            obj.recordTypesStatus[recordType] = statusString;

            return obj;
        }, {
            recordTypesStatus: {},
        }),
        status = this._getStrippedRecordsStatus(strippedRecords.recordTypesStatus),
        meta = {
            domainname: dnsLookupWithMetadata.domainname,
            generatedAt: dnsLookupWithMetadata.generatedAt,
            status: status,
        },
        result = extend({}, meta, strippedRecords);

    return result;
};

DNSSECNameAndShameLookerUpper.prototype._performDNSLookups = function() {
    const self = this,
        lookups = this.options.recordTypes.reduce(function(obj, recordType) {
            obj[recordType] = dnsLookup.lookup(self.domain.name, recordType);

            return obj;
        }, {});

    return Promise.props(lookups);
};

DNSSECNameAndShameLookerUpper.prototype._getOrCreateDomainName = function() {
    return this.database.Domains.getOrCreate(this.domainname)
        .then(function(domain) {
            if (!domain) {
                throw new Error("Could not get domain object.");
            }

            return domain;
        });
};

DNSSECNameAndShameLookerUpper.prototype.fetchResponse = function() {
    // TODO: make sure that `this` class/object can't be used to start multiple lookups in parallel?
    // Doing so wouldn't be useful, as the domain name is already set. State machine, or just keeping the promise?
    const self = this;

    return this._getOrCreateDomainName()
        .tap(function(domain) {
            self.domain = domain;
        })
        .then(self._performDNSLookups.bind(self))
        .then(self._addDNSLookupMetadata.bind(self))
        // TODO: make saving to the database a parallel operation, instead of a serial?
        .tap(self._saveRecordsToDatabase.bind(self))
        .then(self._createResultsObjectForFrontend.bind(self))
        .catch(self._handleError.bind(self));
};

module.exports = DNSSECNameAndShameLookerUpper;
