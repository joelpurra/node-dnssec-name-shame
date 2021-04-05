"use strict";

/*global require: true */

const configuration = require("configvention"),
    // Keep "PORT" for servers with PORT defined in an environment variable
    httpServerPort = configuration.get("PORT") || configuration.get("http-server-port"),
    httpServerIp = configuration.get("http-server-ip"),
    siteRootRelativePath = configuration.get("site-root"),
    mongoUri = configuration.get("MONGOLAB_URI"),
    enableHsts = configuration.get("enable-hsts") === true,

    logger = require("../lib/logger.js")("web"),
    bunyanMiddleware = require("bunyan-middleware"),
    bunyanMiddlewareOptions = {
        logger: logger,
    },
    bunyanMiddlewareLogger = bunyanMiddleware(bunyanMiddlewareOptions),

    path = require("path"),
    // Path to static resources like index.html, css etcetera
    siteRootPath = path.resolve(siteRootRelativePath),

    express = require("express"),
    helmet = require("helmet"),
    st = require("st"),
    configuredHttpsRedirect = require("../lib/configured-https-redirect.js"),

    favicon = require("serve-favicon"),
    faviconPath = path.join(siteRootPath, "/resources/image/icon/favicon.ico"),

    stMountOptions = {
        path: siteRootPath,
        url: "/",
        index: "index.html",
    },
    mount = st(stMountOptions),

    hstsOptions = {
        maxAge: 15724800000,
        includeSubDomains: true,
        force: enableHsts,
    },

    database = require("./data/data-layer-wrapper.js")({
        uri: mongoUri,
    }),

    laundry = require("../lib/laundry.js"),

    checkAndCleanDomainnameOrDie = function(response, domainname) {
        const clean = laundry.checkAndCleanDomainname(domainname);

        if (!clean) {
            response.sendStatus(422)
                .end();

            return null;
        }

        return clean;
    },

    DNSSECNameAndShameLookerUpper = require("../lib/dnssec-name-and-shame-looker-upper.js"),

    app = express();

// Changes JSON indentation for all JSON responses.
// TODO: set only in a sub-app.
app.set("json spaces", 2);

app.use(bunyanMiddlewareLogger);

app.use(helmet());
app.use(helmet.hsts(hstsOptions));

app.use(configuredHttpsRedirect());

app.use(favicon(faviconPath));

// TODO: group as middleware.
app.get("/name-shame/", function(request, response, next) {
    const dirtyDomainname = request.query.domainname,
        cleanDomainname = checkAndCleanDomainnameOrDie(response, dirtyDomainname);

    if (cleanDomainname) {
        next();
    }
});

// TODO: group as middleware.
app.get("/name-shame/", function(request, response, next) {
    const handleError = function(error) {
            next(error);
        },

        sendResults = function(dnssecNameAndShameResponse) {
            response.json(dnssecNameAndShameResponse)
                .end();
        },

        // Real domain name validation done above.
        domainname = laundry.checkAndCleanDomainname(request.query.domainname),

        dnssecNameAndShameLookerUpperOptions = {},
        dnssecNameAndShameLookerUpper = new DNSSECNameAndShameLookerUpper(database, domainname, dnssecNameAndShameLookerUpperOptions);

    dnssecNameAndShameLookerUpper.fetchResponse()
        .then(sendResults)
        .catch(handleError);
});

// TODO: group as middleware.
app.get("/domain/", function(request, response, /* eslint-disable no-unused-vars */next/* eslint-enable no-unused-vars */) {
    response.redirect(301, "/");
});

// TODO: group as middleware.
app.get("/domain/:dirtyDomainname", function(request, response, next, dirtyDomainname) {
    const cleanDomainname = checkAndCleanDomainnameOrDie(response, dirtyDomainname);

    if (cleanDomainname) {
        next();
    }
});

app.get("/domain/*", function(request, response, next) {
    // These domains will be handled on the client side.
    // TODO: use a template and fill in values in the returned HTML.
    request.url = "/";

    next();
});

app.use(function(error, request, response, /* eslint-disable no-unused-vars */next/* eslint-enable no-unused-vars */) {
    // TODO: log this error in a better way.
    logger.error("handleError", error);

    // TODO: make a prettier error message, maybe with some limited information.
    response.sendStatus(500)
        .end();
});

app.use(mount);

app.listen(httpServerPort, httpServerIp, function() {
    logger.info("Listening on port", httpServerPort);
    logger.info("Bound to interface with ip", httpServerIp);
    logger.info("Serving site root from folder", siteRootPath);
});
