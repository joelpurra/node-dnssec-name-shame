"use strict";

/*jslint white: true, todo: true */
/*global require: true, process: true, __dirname: true, console: true */

var configuration = require("configvention"),
    port = configuration.get("PORT"),
    mongoUri = configuration.get("MONGOLAB_URI"),
    siteRootRelativePath = configuration.get("site-root"),

    dumpedDataVersion = 0,
    relativePathToRootFromThisFile = "..",

    getdns = require('getdns'),
    t = require("../lib/DNSLookup.js").DNSLookup,
    DNSLookup = new t(),
    express = require('express'),
    path = require("path"),
    extend = require("extend"),

    callWithFirstInArray = require("../lib/callWithFirstInArray.js"),

    resolvePath = function() {
        var args = [].slice.call(arguments),
            parts = [__dirname].concat(args);

        return path.resolve.apply(path, parts);
    },
    resolvePathFromProjectRoot = function() {
        var args = [].slice.call(arguments),
            parts = [relativePathToRootFromThisFile].concat(args);

        return resolvePath.apply(null, parts);
    },

    // Path to static resources like index.html, css etcetera
    siteRootPath = resolvePathFromProjectRoot.apply(null, siteRootRelativePath.split("/")),

    database = require("./data/data-layer-wrapper.js")({
        uri: mongoUri
    }),

    app = express();

app.use(express.logger());

app.get("/name-shame/", function(request, response, next) {
    function checkAndClean(str, disallowedRx, allowedRx) {
        if (disallowedRx.test(str) || !allowedRx.test(str)) {
            return null;
        }

        return str;
    }

    function checkAndCleanDomainname(domainname) {
        // TOOD: write regexp for domain names
        var clean = checkAndClean(domainname, /[^a-z0-9\-\.]/i, /^[a-z0-9\-]{1,64}\.[a-z]+$/i);

        return clean;
    }

    function handleError(error) {
        throw error;
    }

    var domainname = checkAndCleanDomainname(request.query.domainname);

    if (!domainname) {
        response.send(422);
        response.end();
        return;
    }

    database.Domains.getOrCreate(domainname)
        .fail(handleError)
        .done(function(domain) {
            DNSLookup.lookup(domain.name)
                .fail(handleError)
                .done(function(records) {
                    function createDNSLookupObjectForDatabase(domain, generatedAt, records) {
                        var obj = {
                            domain: domain._id,
                            generatedAt: generatedAt,
                            records: records
                        };

                        return obj;
                    }

                    function recordIsSecure(record) {
                        return record.dnssec_status === getdns.DNSSEC_SECURE;
                    }

                    // getFirstSecureResponse from https://github.com/getdnsapi/tnw2014/blob/master/node/getdns-crypto-example/app.js
                    // response util - get a secure response of a particular type
                    var getFirstSecureResponse = function(result, type) {
                        var replies_tree = result.replies_tree;
                        // validate that there is a reply with an answer
                        if (!replies_tree || !replies_tree.length || !replies_tree[0].answer || !replies_tree[0].answer.length) {
                            return "empty answer list for type " + type;
                        }
                        var reply = replies_tree[0];
                        // ensure the reply is secure
                        if (reply.dnssec_status != getdns.DNSSEC_SECURE) {
                            return "insecure reply for type " + type;
                        }
                        var answers = reply.answer;
                        // get the records of that type
                        answers = answers.filter(function(answer) {
                            return answer.type == type;
                        });
                        if (!answers.length) {
                            return "no answers of type " + type;
                        }
                        return answers[0];
                    };

                    function stripDNSLookupObjectForFrontend(records) {
                        var record = getFirstSecureResponse(records, getdns.RRTYPE_A),

                            // Strings are considered errors, everything else is considered a secure record
                            isSecure = (typeof record !== "string"),

                            result = {
                                isSecure: isSecure
                            };

                        return result;
                    }

                    function createResultsObjectForFrontend(domain, dnsLookupObject) {
                        var meta = {
                            domain: domain.name,
                            generatedAt: dnsLookupObject.generatedAt
                        },
                            stripped = stripDNSLookupObjectForFrontend(dnsLookupObject.records),
                            result = extend({}, meta, stripped);

                        return result;
                    }

                    function send(result) {
                        response.json(result);
                        response.end();
                    }

                    function sendResults(fromCache) {
                        var result = createResultsObjectForFrontend(domain, toCache);

                        send(result);
                    }

                    var generatedAt = new Date().valueOf(),
                        toCache = createDNSLookupObjectForDatabase(domain, generatedAt, records);

                    database.DNSLookupHistory.insert(toCache)
                        .fail(handleError)
                        .done(callWithFirstInArray(sendResults));
                });
        });
});

app.use(express.static(siteRootPath));

app.listen(port, function() {
    console.log("Listening on port", port);
    console.log("Serving site root from folder", siteRootPath);
});