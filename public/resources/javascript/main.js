$(function() {
    var $document = $(document),
        $nameShameForm = $("#name-shame-form"),
        $domainnameInput = $("[name=domainname]", $nameShameForm),

        playSound = function(name) {
            var instance = createjs.Sound.play(name);
        },

        domainLookupFail = function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error(jqXHR, textStatus, errorThrown);

            // HACK: Server error, resubmit the form
            $nameShameForm.submit();
        },

        domainLookupDone = function(data, textStatus, jqXHR) {
            console.log(data, textStatus, jqXHR);

            // Happy/angry, success/failure images
            var successOrFailImage,
                angryOrHappyImage,
                tweetResultsText;

            if (data.isSecure === true) {
                playSound("done");
                successOrFailImage = "success";
                angryOrHappyImage = "happy";
                tweetResultsText = "#win " + data.domain + " has successfully implemented #DNSSEC!";
            } else {
                playSound("fail");
                successOrFailImage = "failure";
                angryOrHappyImage = "angry";
                tweetResultsText = "#shame " + data.domain + " has NOT implemented #DNSSEC!";
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

            // Tweet button
            var tweetSiteUrl = "http://dnssec-name-and-shame.com/";

            $("#results-tweet-link")
                .attr("href", "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetResultsText) + "&url=" + encodeURIComponent(tweetSiteUrl) + "&hashtags=internet,dns,security")
                .text("Tweet results for " + data.domain);
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
        createjs.Sound.registerSound("resources/audio/164089_2975503-lq.mp3", "fail");
        createjs.Sound.registerSound("resources/audio/109662_945474-lq.mp3", "done");
    }());

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
                    url = $target.attr("href"),
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

                        $target.parent("li")
                            .removeClass(bothClasses)
                            .addClass(resultClass);
                    };

                checkDomainInUiForm(domain)
                    .done(highlightClickedItemWithResult);

                return false;
            };

        $document.on("click", ".has-domains-to-check a", doAjaxOnLinkClick);
    }());
});