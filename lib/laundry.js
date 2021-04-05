"use strict";

/*global module: true */

// TOOD: write/find better regexp for domain names?
const disallowedDomainRx = /[^a-z0-9\-.]/i,
    allowedDomainRx = /^([a-z0-9-]{1,64}\.)+[a-z]+$/i,

    checkAndClean = function(str, disallowedRx, allowedRx) {
        if (disallowedRx.test(str) || !allowedRx.test(str)) {
            return null;
        }

        return str;
    },

    checkAndCleanDomainname = function(domainname) {
        const clean = checkAndClean(domainname, disallowedDomainRx, allowedDomainRx);

        return clean;
    },

    cleanDomainnameFromDNASUrl = function(url) {
        let path = url || "",
            domainnameRx = /\/domain\/([^/]+)$/,
            domainname;

        if (!path || !domainnameRx.test(path)) {
            return null;
        }

        path.match(domainnameRx);
        domainname = checkAndCleanDomainname(RegExp.$1);

        if (!domainname) {
            return null;
        }

        return domainname;
    },

    api = {
        checkAndClean: checkAndClean,
        checkAndCleanDomainname: checkAndCleanDomainname,
        cleanDomainnameFromDNASUrl: cleanDomainnameFromDNASUrl,
    };

module.exports = api;
