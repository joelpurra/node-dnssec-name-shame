"use strict";

/*jslint white: true, todo: true */
/*global require: true, process: true, __dirname: true */

var configuration = require("configvention"),
    logger = require("../lib/logger.js")("web"),
    // Keep "PORT" for servers with PORT defined in an environment variable
    httpServerPort = configuration.get("PORT") || configuration.get("http-server-port"),
    httpServerIp = configuration.get("http-server-ip"),
    mongoUri = configuration.get("MONGOLAB_URI"),
    siteRootRelativePath = configuration.get("site-root"),

    relativePathToRootFromThisFile = "..",

    express = require("express"),
    helmet = require("helmet"),
    st = require("st"),
    path = require("path"),
    configuredHttpsRedirect = require("../lib/configuredHttpsRedirect.js"),

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
        index: "index.html"
    }),

    database = require("./data/data-layer-wrapper.js")({
        uri: mongoUri
    }),

    DNSSECNameAndShameLookerUpper = require("../lib/dnssec-name-and-shame-looker-upper.js"),

    MeddelareExpress = require("meddelare-express"),
    meddelareExpress = new MeddelareExpress(),

    app = express();

app.use(express.logger());

app.use(helmet());
app.use(helmet.hsts({
    maxAge: 15724800000,
    includeSubdomains: true,
    force: configuration.get("enable-hsts") === true
}));

app.use(configuredHttpsRedirect());


app.use("/meddelare/", meddelareExpress.getRouter());


// TODO: refactor function scope/location.
function checkAndClean(str, disallowedRx, allowedRx) {
    if (disallowedRx.test(str) || !allowedRx.test(str)) {
        return null;
    }

    return str;
}

// TODO: refactor function scope/location.
function checkAndCleanDomainname(domainname) {
    // TOOD: write regexp for domain names
    var clean = checkAndClean(domainname, /[^a-z0-9\-\.]/i, /^([a-z0-9\-]{1,64}\.)+[a-z]+$/i);

    return clean;
}

// TODO: refactor function scope/location.
function checkAndCleanDomainnameOrDie(response, domainname) {
    var clean = checkAndCleanDomainname(domainname);

    if (!clean) {
        response.sendStatus(422);
        response.end();

        return null;
    }

    return clean;
}

app.get("/name-shame/", function(request, response, next) {
    function handleError(error) {
        // TODO: log this error in a better way.
        //throw error;
        logger.error("handleError", error);

        // TODO: make a prettier error message, maybe with some limited information.
        response.sendStatus(500);
        response.end();
    }

    function sendResults(dnssecNameAndShameResponse) {
        response.json(dnssecNameAndShameResponse);
        response.end();
    }

    var domainname = checkAndCleanDomainnameOrDie(response, request.query.domainname),
        dnssecNameAndShameLookerUpperOptions = {},
        dnssecNameAndShameLookerUpper = new DNSSECNameAndShameLookerUpper(database, domainname, dnssecNameAndShameLookerUpperOptions);

    dnssecNameAndShameLookerUpper.fetchResponse()
        .error(handleError)
        .then(sendResults);
});

// TODO: group as middleware.
app.get("/domain/", function(request, response, next) {
    response.redirect(301, "/");
});

// TODO: group as middleware.
app.get("/domain/:domainname", function(request, response, next, domainname) {
    var clean = checkAndCleanDomainnameOrDie(response, request.query.domainname);

    // The domain name is now clean, or this won't be reached.
    next();
});

app.get("/domain/*", function(request, response, next) {
    // These domains will be handled on the client side.
    // TODO: use a template and fill in values in the returned HTML.
    request.url = "/";

    next();
});

app.use(mount);

app.listen(httpServerPort, httpServerIp, function() {
    logger.info("Listening on port", httpServerPort);
    logger.info("Bound to interface with ip", httpServerIp);
    logger.info("Serving site root from folder", siteRootPath);
});