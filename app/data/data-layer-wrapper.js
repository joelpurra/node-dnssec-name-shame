"use strict";

/*jslint white: true, todo: true */
/*global require: true, module: true */

var Deferred = require("Deferred"),
    MongoDBManagment = require("../../lib/mongodb-deferred.js"),
    callWithFirstInArray = require("../../lib/callWithFirstInArray.js"),

    // TODO: simplify this code, to avoid generating functions?
    generate = function(options) {
        var generateDomains = function() {
                // TODO: class inheritance/aliasing, prototype chain stuffs
                var Domains = new MongoDBManagment.Server(options.uri).getDatabase(options.databaseName).getCollection("domains");

                Domains.getOrCreate = function(domainname) {
                    var deferred = new Deferred(),
                        domainToFind = {
                            name: domainname
                        };

                    this.findOne(domainToFind)
                        .fail(deferred.reject)
                        .done(function(domain) {
                            if (domain) {
                                deferred.resolve(domain);
                            } else {
                                this.insert(domainToFind)
                                    .fail(deferred.reject)
                                    .done(callWithFirstInArray(deferred.resolve));
                            }
                        }.bind(this));

                    return deferred.promise();
                }.bind(Domains);

                return Domains;
            },

            generateDNSLookupHistory = function() {
                // TODO: class inheritance/aliasing, prototype chain stuffs
                var DNSLookupHistory = new MongoDBManagment.Server(options.uri).getDatabase(options.databaseName).getCollection("dnslookuphistory");

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