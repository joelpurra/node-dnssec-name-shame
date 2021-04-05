"use strict";

/*global require: true, module: true */

// Some code based on getFirstSecureResponse from https://github.com/getdnsapi/tnw2014/blob/master/node/getdns-crypto-example/app.js

const getdns = require("getdns"),

    getRecordTypeCode = function(recordType) {
        let rrtype = null;

        if (typeof recordType === "string") {
            rrtype = "RRTYPE_" + recordType.toUpperCase();
            recordType = getdns[rrtype];
        }

        if (typeof recordType === "undefined") {
            throw new Error("recordType is undefined.");
        }

        // TODO: validate the code by performing a reverse lookup?
        return recordType;
    },

    getReplyTreeListOrDie = function(result) {
        let repliesTree = null;

        if (!result) {
            throw new Error("No result.");
        }

        repliesTree = result.replies_tree;

        // Validate that there is a reply.
        if (!repliesTree) {
            throw new Error("no reply list");
        }

        return repliesTree;
    },

    getUnverifiedRecordsOfType = function(result, recordType) {
        const repliesTree = getReplyTreeListOrDie(result),
            recordTypeCode = getRecordTypeCode(recordType);

        let recordsOfType = [];

        repliesTree.forEach(function(reply) {
            const answers = reply.answer;

            if (!answers || !answers.length) {
                return null;
            }

            // get the records of that recordTypeCode
            recordsOfType = recordsOfType.concat(answers.filter(function(answer) {
                return answer.type === recordTypeCode;
            }));
        });

        return recordsOfType;
    },

    getFirstUnverifiedRecordOfType = function(result, recordType) {
        const records = getUnverifiedRecordsOfType(result, recordType);

        if (records && records.length > 0) {
            return records[0];
        }

        return null;
    },

    hasUnverifiedRecordOfType = function(result, recordType) {
        const record = getFirstUnverifiedRecordOfType(result, recordType);

        // TODO: checking the type would be better?
        return !!record;
    },

    getSecureRecordsOfType = function(result, recordType) {
        const repliesTree = getReplyTreeListOrDie(result),
            recordTypeCode = getRecordTypeCode(recordType);

        let recordsOfType = [];

        repliesTree.forEach(function(reply) {
            const answers = reply.answer;

            // ensure the reply is secure
            if (reply.dnssec_status !== getdns.DNSSEC_SECURE) {
                return null;
            }

            if (!answers || !answers.length) {
                return null;
            }

            // get the records of that recordTypeCode
            recordsOfType = recordsOfType.concat(answers.filter(function(answer) {
                return answer.type === recordTypeCode;
            }));
        });

        return recordsOfType;
    },

    getFirstSecureRecordOfType = function(result, recordType) {
        const records = getSecureRecordsOfType(result, recordType);

        if (records && records.length > 0) {
            return records[0];
        }

        return null;
    },

    hasSecureRecordOfType = function(result, recordType) {
        const record = getFirstSecureRecordOfType(result, recordType);

        // TODO: checking the type would be better?
        return !!record;
    },

    getRecordTypeStatus = function(records, recordType) {
        if (hasSecureRecordOfType(records, recordType) === true) {
            // Secure record.
            return true;
        } else if (hasUnverifiedRecordOfType(records, recordType) === true) {
            // Insecure record.
            return false;
        }

        // No record of type recordType.
        return null;
    },

    getRecordTypesStatus = function(records, recordTypes) {
        return recordTypes.reduce(function(obj, recordType) {
            obj[recordType] = getRecordTypeStatus(records, recordType);

            return obj;
        }, {});
    },

    areAnyRecordTypesExistant = function(recordTypesStatus) {
        const hasNonNullRecords = Object.keys(recordTypesStatus).some(function(recordTypeStatus) {
            return (recordTypesStatus[recordTypeStatus] !== null);
        });

        return hasNonNullRecords;
    },

    areAllRecordTypesSecureOrNonExistant = function(recordTypesStatus) {
        const hasNonNullRecords = areAnyRecordTypesExistant(recordTypesStatus),
            allSecureOrNonExistant = Object.keys(recordTypesStatus).every(function(recordTypeStatus) {
                return (recordTypesStatus[recordTypeStatus] === true || recordTypesStatus[recordTypeStatus] === null);
            });

        return hasNonNullRecords && allSecureOrNonExistant;
    },

    api = {
        getUnverifiedRecordsOfType: getUnverifiedRecordsOfType,
        getFirstUnverifiedRecordOfType: getFirstUnverifiedRecordOfType,
        hasUnverifiedRecordOfType: hasUnverifiedRecordOfType,

        getSecureRecordsOfType: getSecureRecordsOfType,
        getFirstSecureRecordOfType: getFirstSecureRecordOfType,
        hasSecureRecordOfType: hasSecureRecordOfType,

        getRecordTypeCode: getRecordTypeCode,
        getRecordTypeStatus: getRecordTypeStatus,
        getRecordTypesStatus: getRecordTypesStatus,
        areAnyRecordTypesExistant: areAnyRecordTypesExistant,
        areAllRecordTypesSecureOrNonExistant: areAllRecordTypesSecureOrNonExistant,
    };

module.exports = api;
