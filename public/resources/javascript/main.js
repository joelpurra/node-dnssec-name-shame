(function($) {
    /* global createjs:false, history:false, jQuery:false */

    /* eslint-disable no-unused-vars */

    $(function() {
        // TODO: share constants?
        var STATUS_SECURE = "secure",
            STATUS_INSECURE = "insecure",
            STATUS_UNKNOWN = "unknown",

            $document = $(document),
            $body = $("body"),
            $nameShameForm = $("#name-shame-form"),
            $domainnameInput = $("[name=domainname]", $nameShameForm),

            stateCounter = 0,

            // See also lib/laundry.js.
            // TODO: use require() to get this file.
            laundry = (function() {
                "use strict";

                // TOOD: write/find better regexp for domain names?
                var disallowedDomainRx = /[^a-z0-9\-.]/i,
                    allowedDomainRx = /^([a-z0-9-]{1,64}\.)+[a-z]+$/i,

                    checkAndClean = function(str, disallowedRx, allowedRx) {
                        if (disallowedRx.test(str) || !allowedRx.test(str)) {
                            return null;
                        }

                        return str;
                    },

                    checkAndCleanDomainname = function(domainname) {
                        var clean = checkAndClean(domainname, disallowedDomainRx, allowedDomainRx);

                        return clean;
                    },

                    cleanDomainnameFromDNASUrl = function(url) {
                        var path = url || "",
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

                return api;
            }()),

            handleLookupFail = function(clientState) {
                clientState = clientState || {};

                $nameShameForm.trigger("dnas.lookup.fail", [clientState]);
            },

            handleLookupDone = function(data, clientState) {
                clientState = clientState || {};

                $nameShameForm.trigger("dnas.lookup.done", [data, clientState]);

                if (data.status === STATUS_SECURE) {
                    $nameShameForm.trigger("dnas.lookup.is-secure", [data, clientState]);
                } else if (data.status === STATUS_UNKNOWN) {
                    $nameShameForm.trigger("dnas.lookup.is-unknown", [data, clientState]);
                } else {
                    $nameShameForm.trigger("dnas.lookup.is-insecure", [data, clientState]);
                }
            },

            domainLookupXHRFail = function(jqXHR, textStatus, errorThrown) {
                // TODO: show error to the user?
                /* eslint-disable no-console */
                console.error("domainLookupXHRFail", jqXHR, textStatus, errorThrown);
                /* eslint-enable no-console */

                handleLookupFail({
                    firstTime: true,
                });
            },

            domainLookupXHRDone = function(data, textStatus, jqXHR) {
                data = data || {};
                data.domainname = (data && data.domainname) || "";
                data.domainname = laundry.checkAndCleanDomainname(data.domainname);

                handleLookupDone(data, {
                    firstTime: true,
                });
            },

            checkDomain = function(domainname) {
                var promise = $.getJSON("/name-shame/", {
                    domainname: domainname,
                });

                return promise;
            },

            checkDomainAndUpdateUi = function(domainname) {
                var promise = checkDomain(domainname)
                    .fail(domainLookupXHRFail)
                    .done(domainLookupXHRDone);

                return promise;
            },

            checkDomainInUiForm = function(domainname) {
                $domainnameInput.val(domainname);

                var promise = checkDomainAndUpdateUi(domainname);

                return promise;
            },

            getLinkFromAnchorClick = function(evt) {
                var $target = $(evt.target),
                    $link = $target
                        .filter("[href]")
                        .add($(evt.target).parents("[href]"))
                        .first();

                return $link;
            };

        (function() {
            var onSubmit = function(event) {
                event.preventDefault();

                var domainname = $domainnameInput.val();

                checkDomainAndUpdateUi(domainname);

                return false;
            };

            $nameShameForm.on("submit", onSubmit);
        }());

        (function() {
            var getDomainFromInternalDomainUrl = function(url) {
                    var domain = url.split("/")[2];

                    return domain;
                },
                doAjaxOnLinkClick = function(event) {
                    event.preventDefault();

                    var $link = getLinkFromAnchorClick(event),
                        url = $link.attr("href"),
                        domain = getDomainFromInternalDomainUrl(url),
                        highlightClickedItemWithResult = function(data, textStatus, jqXHR) {
                            // TODO: make this a dynamic lookup, so that multiple or dynamic lists can have green ticks and red crosses.
                            // This would make a manual lookup of google.com show in the lists below.
                            var successClass = "success",
                                unknownClass = "unknown",
                                failClass = "fail",
                                allThreeClasses = successClass + " " + unknownClass + " " + failClass,
                                resultClass;

                            if (data.status === STATUS_SECURE) {
                                resultClass = successClass;
                            } else if (data.status === STATUS_UNKNOWN) {
                                resultClass = unknownClass;
                            } else {
                                resultClass = failClass;
                            }

                            $link.parents("li")
                                .first()
                                .removeClass(allThreeClasses)
                                .addClass(resultClass);
                        };

                    checkDomainInUiForm(domain)
                        .done(highlightClickedItemWithResult);

                    return false;
                };

            $document.on("click", ".has-domains-to-check a:not([rel='external'])", doAjaxOnLinkClick);
        }());

        // TODO: change function scope/location.
        function clearResults() {
            var angryOrHappyImage = "angry";

            $("#results-container")
                .find(".results-image")
                .hide()
                .end()
                .find(".results-image." + angryOrHappyImage)
                .show()
                .end()
                .addClass("none-yet");

            $("#results-blocks")
                .addClass("none-yet");
        }

        (function() {
            $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
                // Happy/unknown/angry, success/unknown/failure images/text.
                var successOrFailImage,
                    angryOrHappyImage,
                    statusText;

                if (data.status === STATUS_SECURE) {
                    successOrFailImage = "success";
                    angryOrHappyImage = "happy";
                    statusText = "";
                } else if (data.status === STATUS_UNKNOWN) {
                    successOrFailImage = "unknown";
                    angryOrHappyImage = "unknown";
                    statusText = "?";
                } else {
                    // Presumably STATUS_INSECURE.
                    successOrFailImage = "failure";
                    angryOrHappyImage = "angry";
                    statusText = "not";
                }

                $("#results-container")
                    .find(".results-image")
                    .hide()
                    .end()
                    .find(".results-image." + angryOrHappyImage)
                    .show()
                    .end()
                    .removeClass("none-yet");

                $("#results-blocks")
                    .find(".results-image")
                    .hide()
                    .end()
                    .find(".results-image." + successOrFailImage)
                    .show()
                    .end()
                    .removeClass("none-yet");

                // Results text.
                $("#results-domain-name").text(data.domainname);
                $("#results-success-or-fail").text(statusText);
            });
        }());

        (function() {
            $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
                var $types = $("#results-container-types"),
                    keys = Object.keys(data.recordTypesStatus);

                keys.forEach(function(recordTypeStatus) {
                    var recordStatus = data.recordTypesStatus[recordTypeStatus],
                        $statusElement = $(".results-container-type.results-container-type-" + recordTypeStatus, $types),
                        successClass = "success",
                        unknownClass = "unknown",
                        failClass = "fail",
                        allThreeClasses = successClass + " " + unknownClass + " " + failClass,
                        resultClass;

                    if (recordStatus === STATUS_SECURE) {
                        resultClass = successClass;
                    } else if (recordStatus === STATUS_INSECURE) {
                        resultClass = failClass;
                    } else {
                        resultClass = unknownClass;
                    }

                    $statusElement
                        .removeClass(allThreeClasses)
                        .addClass(resultClass);
                });
            });
        }());

        (function() {
            $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
                var tweetResultsText,
                    tweetLinkText = "Tweet to #",
                    tweetSiteUrl = "https://dnssec-name-and-shame.com/domain/" + data.domainname;

                if (data.status === STATUS_SECURE) {
                    tweetResultsText = "#praise " + data.domainname + " has successfully implemented #DNSSEC!";
                    tweetLinkText += "praise";
                } else if (data.status === STATUS_UNKNOWN) {
                    tweetResultsText = "#whoknow " + data.domainname + " has maybe implemented #DNSSEC?";
                    tweetLinkText += "unknown";
                } else {
                    tweetResultsText = "#shame " + data.domainname + " has NOT implemented #DNSSEC!";
                    tweetLinkText += "shame";
                }

                tweetLinkText += " " + data.domainname + "!";

                $("#results-tweet-link")
                    .attr("href", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetResultsText) + "&url=" + encodeURIComponent(tweetSiteUrl) + "&via=dnssecnameshame&related=joelpurra,tompcuddy&hashtags=internet,dns,security")
                    .text(tweetLinkText);
            });
        }());

        (function() {
            var
                playSound = function(name) {
                    var instance = createjs.Sound.play(name);
                };

            (function() {
                createjs.Sound.registerSound("/resources/audio/164089_2975503-lq.mp3", "fail");
                createjs.Sound.registerSound("/resources/audio/109662_945474-lq.mp3", "done");
            }());

            $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
                if (clientState.firstTime !== true) {
                    // Don't play sound when using the browser's back button etcetera.
                    return;
                }

                if (data.status === STATUS_SECURE) {
                    playSound("done");
                } else if (data.status === STATUS_UNKNOWN) {
                    playSound("unknown");
                } else {
                    playSound("fail");
                }
            });
        }());

        (function() {
            // HACK: Server error! Sleep and then resubmit the form.
            // TODO: check if the user changed the domain in the input box?
            var errorsInARow = 0,
                sleepDefault = 1000;

            $nameShameForm.on("dnas.lookup.fail", function(evt, clientState) {
                var sleepThisTime = Math.pow(2, errorsInARow++) * sleepDefault;

                /* eslint-disable no-console */
                console.error("Server failure, waiting to resubmit form.", "errorsInARow", errorsInARow, "sleepThisTime", sleepThisTime);
                /* eslint-enable no-console */

                setTimeout(function() {
                    $nameShameForm.submit();
                }, sleepThisTime);
            });

            $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
                errorsInARow = 0;
            });
        }());

        function getStateTitle() {
            return document.title + " (" + (stateCounter++) + ")";
        }

        function setPageTitle(title) {
            title = (!title || title === "") ? "DNSSEC name and shame!" : title;

            document.title = title;
        }

        function pushClearState() {
            var state = null,
                url = "/";

            history.pushState(state, getStateTitle(), url);
        }

        function loadFrontpageIfNotAlreadyThere() {
            if (document.location.pathname !== "/") {
                clearResults();

                setPageTitle();

                pushClearState();
            }

            $body.scrollTop(0);
        }

        (function() {
            $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
                if (clientState.firstTime !== true) {
                    // Don't replace the URL when using the browser's back button etcetera.
                    return;
                }

                var fromUrl = laundry.cleanDomainnameFromDNASUrl(document.location.href),
                    state = data,
                    title,
                    url = "/domain/" + data.domainname;

                if (data.status === STATUS_SECURE) {
                    title = "Praise " + data.domainname + " for implementing DNSSEC!";
                } else if (data.status === STATUS_UNKNOWN) {
                    title = "Who knows if " + data.domainname + " has implemented DNSSEC?";
                } else {
                    title = "Shame " + data.domainname + " for not implementing DNSSEC!";
                }

                setPageTitle(title);

                // The state should already be loaded according to the
                // document.location -- so don't pushState it again, just
                // replaceState with the most recent data.
                if (fromUrl === data.domainname) {
                    history.replaceState(state, getStateTitle(), url);
                } else {
                    history.pushState(state, getStateTitle(), url);
                }
            });

            window.onpopstate = function(event) {
                var data;

                if (event.state && event.state.domain) {
                    data = event.state;

                    $domainnameInput.val(event.state.domain);

                    handleLookupDone(data, {
                        firstTime: false,
                    });
                } else {
                    loadFrontpageIfNotAlreadyThere();
                }
            };
        }());

        (function() {
            $(function() {
                var domainname = laundry.cleanDomainnameFromDNASUrl(document.location.href);

                if (!domainname) {
                    loadFrontpageIfNotAlreadyThere();
                } else {
                    $domainnameInput.val(domainname);
                    $nameShameForm.submit();
                }
            });
        }());

        (function() {
            function dontGoToHere(evt) {
                var $link = getLinkFromAnchorClick(evt),
                    url = $link.attr("href");

                // Links to the front page, but clickable domain checks excluded.
                if ((url === "/" || url === "https://dnssec-name-and-shame.com/") && !$link.parents(".has-domains-to-check").length) {
                    evt.preventDefault();

                    loadFrontpageIfNotAlreadyThere();

                    return false;
                }
            }

            $("a").on("click", dontGoToHere);
        }());
    });
}(jQuery));
