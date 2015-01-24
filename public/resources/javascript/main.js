$(function() {
    var $document = $(document),
        $nameShameForm = $("#name-shame-form"),
        $domainnameInput = $("[name=domainname]", $nameShameForm),

        handleLookupFail = function(clientState) {
            clientState = clientState || {};

            $nameShameForm.trigger("dnas.lookup.fail", [clientState]);
        },

        handleLookupDone = function(data, clientState) {
            clientState = clientState || {};

            $nameShameForm.trigger("dnas.lookup.done", [data, clientState]);

            if (data.isSecure === true) {
                $nameShameForm.trigger("dnas.lookup.is-secure", [data, clientState]);
            } else {
                $nameShameForm.trigger("dnas.lookup.is-insecure", [data, clientState]);
            }
        },

        domainLookupXHRFail = function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error("domainLookupXHRFail", jqXHR, textStatus, errorThrown);

            handleLookupFail({
                firstTime: true
            });
        },

        domainLookupXHRDone = function(data, textStatus, jqXHR) {
            console.log("domainLookupXHRDone", data, textStatus, jqXHR);

            handleLookupDone(data, {
                firstTime: true
            });
        },

        checkDomain = function(domainname) {
            var promise = $.getJSON("/name-shame/", {
                domainname: domainname
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
        var getDomainFromUrl = function(url) {
                var domain = url.split("://")[1].split("/")[0];

                return domain;
            },
            doAjaxOnLinkClick = function(event) {
                event.preventDefault();

                var $target = $(event.target),
                    $link = $target
                    .filter("[href]")
                    .add($(event.target).parents("[href]"))
                    .first(),
                    url = $link.attr("href"),
                    domain = getDomainFromUrl(url),
                    highlightClickedItemWithResult = function(data, textStatus, jqXHR) {
                        // TODO: make this a dynamic lookup, so that multiple or dynamic lists can have green ticks and red crosses.
                        // This would make a manual lookup of google.com show in the lists below.
                        var successClass = "success",
                            failClass = "fail",
                            bothClasses = successClass + " " + failClass,
                            resultClass;

                        if (data.isSecure === true) {
                            resultClass = successClass;
                        } else {
                            resultClass = failClass;
                        }

                        $link.parents("li")
                            .first()
                            .removeClass(bothClasses)
                            .addClass(resultClass);
                    };

                checkDomainInUiForm(domain)
                    .done(highlightClickedItemWithResult);

                return false;
            };

        $document.on("click", ".has-domains-to-check a", doAjaxOnLinkClick);
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
            // Happy/angry, success/failure images
            var successOrFailImage,
                angryOrHappyImage;

            if (data.isSecure === true) {
                successOrFailImage = "success";
                angryOrHappyImage = "happy";
            } else {
                successOrFailImage = "failure";
                angryOrHappyImage = "angry";
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

            // Results text
            $("#results-domain-name").text(data.domain);
            $("#results-success-or-fail").text(data.isSecure === true ? "Yes!" : "No!");
        });
    }());

    (function() {
        $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
            var tweetResultsText;

            if (data.isSecure === true) {
                tweetResultsText = "#win " + data.domain + " has successfully implemented #DNSSEC!";
            } else {
                tweetResultsText = "#shame " + data.domain + " has NOT implemented #DNSSEC!";
            }

            // Tweet button
            var tweetSiteUrl = "http://dnssec-name-and-shame.com/";

            $("#results-tweet-link")
                .attr("href", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetResultsText) + "&url=" + encodeURIComponent(tweetSiteUrl) + "&hashtags=internet,dns,security")
                .text("Tweet results for " + data.domain);

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

            if (data.isSecure === true) {
                playSound("done");
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

            console.error("Server failure, waiting to resubmit form.", "errorsInARow", errorsInARow, "sleepThisTime", sleepThisTime);

            setTimeout(function() {
                $nameShameForm.submit();
            }, sleepThisTime);
        });

        $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
            errorsInARow = 0;
        });
    }());

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
    function cleanDomainnameFromDNASUrl(url) {
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
    }

    var stateCounter = 0;

    function pushClearState() {
        var state = null,
            title = "Front page (" + stateCounter + ")",
            url = "/";

        history.pushState(state, title, url);
    }

    function loadFrontpageIfNotAlreadyThere() {
        if (document.location.href !== "/") {
            clearResults();

            pushClearState();
        }
    }

    (function() {
        $nameShameForm.on("dnas.lookup.done", function(evt, data, clientState) {
            if (clientState.firstTime !== true) {
                // Don't replace the URL when using the browser's back button etcetera.
                return;
            }

            var fromUrl = cleanDomainnameFromDNASUrl(document.location.href);

            var state = data,
                title = "Domain lookup: " + data.domain + " (" + stateCounter + ")",
                url = "/domain/" + data.domain;

            // The state should already be loaded according to the
            // document.location -- so don't pushState it again, just
            // replaceState with the most recent data.
            if (fromUrl === data.domain) {
                history.replaceState(state, title, url);
            } else {
                history.pushState(state, title, url);
            }
        });

        window.onpopstate = function(event) {
            var data;

            if (event.state && event.state.domain) {
                data = event.state;

                $domainnameInput.val(event.state.domain);

                handleLookupDone(data, {
                    firstTime: false
                });
            } else {
                loadFrontpageIfNotAlreadyThere();
            }
        };
    }());

    (function() {
        $(function() {
            var domainname = cleanDomainnameFromDNASUrl(document.location.href);

            if (!domainname) {
                loadFrontpageIfNotAlreadyThere();
            } else {
                $domainnameInput.val(domainname);
                $nameShameForm.submit();
            }
        });
    }());
});