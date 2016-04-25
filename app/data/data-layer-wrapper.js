"use strict";

/*jslint white: true, todo: true */
/*global require: true, module: true */

var Promise = require("bluebird"),
    MongoDBManagment = require("../../lib/mongodb-deferred.js"),
    callWithFirstInArray = require("../../lib/callWithFirstInArray.js"),

    // TODO: simplify this code, to avoid generating functions?
    generate = function(options) {
        var generateDomains = function() {
                // TODO: class inheritance/aliasing, prototype chain stuffs
                var Domains = new MongoDBManagment.Server(options.uri)
                    .getDatabase(options.databaseName)
                    .getCollection("domains");

                Domains.getOrCreate = function(domainname) {
                    var domainToFind = {
                        name: domainname
                    };

                    return Promise.resolve(this.findOne(domainToFind))
                        .then(function(domain) {
                            if (domain) {
                                return domain;
                            } else {
                                return Promise.resolve(this.insert(domainToFind))
                                    // Only return first item in the array.
                                    .get(0);
                            }
                        }.bind(this));
                }.bind(Domains);

                return Domains;
            },

            generateDNSLookupHistory = function() {
                // TODO: class inheritance/aliasing, prototype chain stuffs
                var DNSLookupHistory = new MongoDBManagment.Server(options.uri)
                    .getDatabase(options.databaseName)
                    .getCollection("dnslookuphistory");

                return DNSLookupHistory;
            },

            extractDatabaseName = function(uri) {
                // TODO: replace with some uri library
                var uriParts = uri.split("/"),
                    dbName = uriParts[uriParts.length - 1].split("?")[0];

                return dbName;
            },

            prepareOptions = function() {
                options.databaseName = extractDatabaseName(options.uri);
            },

            generateApi = function() {
                var generatedApi = {
                    Domains: generateDomains(),
                    DNSLookupHistory: generateDNSLookupHistory()
                };

                return generatedApi;
            },

            init = function() {
                prepareOptions();
                api = generateApi();
            },

            api;

        init();

        return api;
    },

    api = generate;

module.exports = api;