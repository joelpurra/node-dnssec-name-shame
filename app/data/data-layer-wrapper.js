"use strict";

/*global require: true, module: true */

const Promise = require("bluebird"),
    MongoDBManagment = require("../../lib/mongodb-bluebird.js"),

    // TODO: simplify this code, to avoid generating functions?
    generate = function(options) {
        let generateDomains = function() {
                // TODO: class inheritance/aliasing, prototype chain stuffs
                const Domains = new MongoDBManagment.Server(options.uri)
                    .getDatabase(options.databaseName)
                    .getCollection("domains");

                Domains.getOrCreate = Promise.method(function(domainname) {
                    const domainToFind = {
                        name: domainname,
                    };

                    return Domains.findOne(domainToFind)
                        .then(function(domain) {
                            if (domain) {
                                return domain;
                            }

                            return Domains.insertOne(domainToFind);
                        });
                });

                return Domains;
            },

            generateDNSLookupHistory = function() {
                // TODO: class inheritance/aliasing, prototype chain stuffs
                const DNSLookupHistory = new MongoDBManagment.Server(options.uri)
                    .getDatabase(options.databaseName)
                    .getCollection("dnslookuphistory");

                return DNSLookupHistory;
            },

            extractDatabaseName = function(uri) {
                // TODO: replace with some uri library
                const uriParts = uri.split("/"),
                    dbName = uriParts[uriParts.length - 1].split("?")[0];

                return dbName;
            },

            prepareOptions = function() {
                options.databaseName = extractDatabaseName(options.uri);
            },

            generateApi = function() {
                const generatedApi = {
                    Domains: generateDomains(),
                    DNSLookupHistory: generateDNSLookupHistory(),
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
