"use strict";

/*jslint white: true, todo: true */
/*global require: true, process: true, __dirname: true, console: true */

var configuration = require("configvention"),
    // Keep "PORT" for servers with PORT defined in an environment variable
    httpServerPort = configuration.get("PORT") || configuration.get("http-server-port"),
    httpServerIp = configuration.get("http-server-ip"),
    mongoUri = configuration.get("MONGOLAB_URI"),
    siteRootRelativePath = configuration.get("site-root"),

    dumpedDataVersion = 0,
    relativePathToRootFromThisFile = "..",

    getdns = require('getdns'),
    t = require("../lib/DNSLookup.js").DNSLookup,
    DNSLookup = new t(),
    express = require('express'),
    st = require("st"),
    path = require("path"),
    extend = require("extend"),
    express_enforces_ssl = require('express-enforces-ssl'),

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

    mount = st({
        path: siteRootPath,
        url: "/",
        index: 'index.html'
    }),

    database = require("./data/data-layer-wrapper.js")({
        uri: mongoUri
    }),

    app = express();

app.enable('trust proxy');

if (configuration.get("redirect-to-https") === true) {
    app.use(express_enforces_ssl());
}


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
        var clean = checkAndClean(domainname, /[^a-z0-9\-\.]/i, /^([a-z0-9\-]{1,64}\.)+[a-z]+$/i);

        return clean;
    }

    function handleError(error) {
        // TODO: log this error in a better way
        //throw error;
        console.error("handleError", error);

        // TODO: make a prettier error message, maybe with some limited information
        response.send(500);
        response.end();
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

                    // TODO: break out helper functions
                    // Based on getFirstSecureResponse from https://github.com/getdnsapi/tnw2014/blob/master/node/getdns-crypto-example/app.js
                    var getSecureRecordsOfType = function(result, type) {
                        var replies_tree = result.replies_tree;

                        // validate that there is a reply
                        if (!replies_tree || !replies_tree.length) {
                            return "empty reply list";
                        }
                        var secureOfType = [];

                        replies_tree.forEach(function(reply) {
                            var answers = reply.answer;

                            // ensure the reply is secure
                            if (reply.dnssec_status != getdns.DNSSEC_SECURE) {
                                return;
                            }

                            if (!answers || !answers.length) {
                                return;
                            }

                            // get the records of that type
                            secureOfType = secureOfType.concat(answers.filter(function(answer) {
                                return answer.type == type;
                            }));
                        });

                        if (!secureOfType.length) {
                            return "no secure answers of type " + type;
                        }

                        return secureOfType;
                    };

                    // TODO: break out helper functions

                    function getFirstSecureRecordOfType(result, type) {
                        var records = getSecureRecordsOfType(result, type);

                        if (typeof records === "string") {
                            return records;
                        }

                        return records[0];
                    }

                    // TODO: break out helper functions

                    function hasSecureRecordOfType(result, type) {
                        var record = getFirstSecureRecordOfType(result, type);

                        return (typeof record !== "string");
                    }

                    function stripDNSLookupObjectForFrontend(records) {
                        var typeAorAAAAIsSecure = hasSecureRecordOfType(records, getdns.RRTYPE_A) || hasSecureRecordOfType(records, getdns.RRTYPE_AAAA),
                            result = {
                                isSecure: typeAorAAAAIsSecure
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

app.use(mount)

app.listen(httpServerPort, httpServerIp, function() {
    console.log("Listening on port", httpServerPort);
    console.log("Bound to interface with ip", httpServerIp);
    console.log("Serving site root from folder", siteRootPath);
});