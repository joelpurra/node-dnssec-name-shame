var configuration = require("configvention"),
    urlUtil = require("url"),

    redirectRequestToHttps = function(req, res) {
        var secureRoot = configuration.get("https-url-root"),
            secureUrl = urlUtil.resolve(secureRoot, req.originalUrl);

        // From https://github.com/aredo/express-enforces-ssl
        if (req.method === "GET") {
            res.redirect(301, secureUrl);
        } else {
            res.send(403, "Please use HTTPS when submitting data to this server.");
        }
    },

    configuredHttpsRedirect = function() {
        var middleware = function(req, res, next) {
            if (req.secure !== true && configuration.get("redirect-to-https") === true) {
                redirectRequestToHttps(req, res);
            } else {
                next();
            }
        };

        return middleware;
    };

module.exports = configuredHttpsRedirect;