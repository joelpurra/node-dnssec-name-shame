"use strict";

const configuration = require("configvention"),
    urlUtil = require("url"),

    shouldRedirectRequestToHttps = function(req) {
        // Relies on the custom/injected X-Forwarded-Proto HTTP header.
        // https://serverfault.com/questions/257616/requestheader-with-apache-environment-variable
        const shouldRedirect = (req.secure !== true && req.get("X-Forwarded-Proto") === "http") && configuration.get("redirect-to-https") === true;

        return shouldRedirect;
    },

    redirectRequestToHttps = function(req, res) {
        const secureRoot = configuration.get("https-url-root"),
            secureUrl = urlUtil.resolve(secureRoot, req.originalUrl);

        // From https://github.com/aredo/express-enforces-ssl
        if (req.method === "GET") {
            res.redirect(301, secureUrl);
        } else {
            res.send(403, "Please use HTTPS when submitting data to this server.");
        }
    },

    configuredHttpsRedirect = function() {
        const middleware = function(req, res, next) {
            if (shouldRedirectRequestToHttps(req)) {
                redirectRequestToHttps(req, res);
            } else {
                next();
            }
        };

        return middleware;
    };

module.exports = configuredHttpsRedirect;
