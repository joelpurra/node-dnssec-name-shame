$(function() {
    var $document = $(document),
        $nameShameForm = $("#name-shame-form"),
        $domainnameInput = $("[name=domainname]", $nameShameForm),

        domainLookupFail = function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error("domainLookupFail", jqXHR, textStatus, errorThrown);

            $nameShameForm.trigger("dnas.lookup.fail");
        },

        domainLookupDone = function(data, textStatus, jqXHR) {
            console.log("domainLookupDone", data, textStatus, jqXHR);

            $nameShameForm.trigger("dnas.lookup.done", data);

            if (data.isSecure === true) {
                $nameShameForm.trigger("dnas.lookup.is-secure", data);
            } else {
                $nameShameForm.trigger("dnas.lookup.is-insecure", data);
            }
        },

        checkDomain = function(domainname) {
            var promise = $.getJSON("/name-shame/", {
                domainname: domainname
            });

            return promise;
        },

        checkDomainAndUpdateUi = function(domainname) {
            var promise = checkDomain(domainname)
                .fail(domainLookupFail)
                .done(domainLookupDone);

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

    (function() {
        $nameShameForm.on("dnas.lookup.done", function(evt, data) {
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
        $nameShameForm.on("dnas.lookup.done", function(evt, data) {
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
            createjs.Sound.registerSound("resources/audio/164089_2975503-lq.mp3", "fail");
            createjs.Sound.registerSound("resources/audio/109662_945474-lq.mp3", "done");
        }());

        $nameShameForm.on("dnas.lookup.done", function(evt, data) {
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

        $nameShameForm.on("dnas.lookup.fail", function(evt, data) {
            var sleepThisTime = Math.pow(2, errorsInARow++) * sleepDefault;

            console.error("Server failure, waiting to resubmit form.", "errorsInARow", errorsInARow, "sleepThisTime", sleepThisTime);

            setTimeout(function() {
                $nameShameForm.submit();
            }, sleepThisTime);
        });

        $nameShameForm.on("dnas.lookup.done", function(evt, data) {
            errorsInARow = 0;
        });
    }());
});