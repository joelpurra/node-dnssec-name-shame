const bunyan = require("bunyan"),
    baseOptions = {
        // TODO: read base name from configuration?
        name: "dnssec-name-and-shame",
        // TODO: make src line logging optional, and disable in production.
        src: true,
    },
    baseLogger = bunyan.createLogger(baseOptions),
    createLogger = function(name) {
        const childOptions = {
                child: name,
            },
            childLogger = baseLogger.child(childOptions);

        return childLogger;
    };

module.exports = createLogger;
