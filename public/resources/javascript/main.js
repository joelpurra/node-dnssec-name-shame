$(function() {
    var $document = $(document),
        $nameShameForm = $("#name-shame-form"),
        $domainnameInput = $("[name=domainname]", $nameShameForm),

        playSound = function(name) {
            var instance = createjs.Sound.play(name);
        },

        // http://stackoverflow.com/questions/1219860/html-encoding-in-javascript-jquery
        // http://stackoverflow.com/a/1219983/907779
        htmlEncode = function(value) {
            //create a in-memory div, set it's inner text(which jQuery automatically encodes)
            //then grab the encoded contents back out.  The div never exists on the page.
            return $('<div/>').text(value).html();
        },

        htmlDecode = function(value) {
            return $('<div/>').html(value).text();
        },

        domainLookupFail = function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error(jqXHR, textStatus, errorThrown);

            // HACK: Server error, resubmit the form
            $nameShameForm.submit();
        },

        domainLookupDone = function(data, textStatus, jqXHR) {
            // TODO: use data
            console.log(data, textStatus, jqXHR);

            // Load the success or failure image
            var image = "";
            if (data.isSecure) {
                image = "Success";
            } else {
                image = "Failure";
            }

            var $img = $("#resultImageId img");

            if (!$img.length) {
                $img = $("<img />").appendTo("#resultImageId")
            }

            var imageUrl = "resources/image/" + image + ".png";
            $img.attr("src", imageUrl);

            // Load the results text
            var resultString = "<h2>DNSSEC Results</h2>";
            resultString += "<ul>";
            resultString += "<li>Domain:  " + htmlEncode(data.domain) + "</li>";
            resultString += "<li>DNSSEC Secure:  " + (data.isSecure === true ? "Yes!" : "No!") + "</li>";
            resultString += "</ul>";
            $("#resultId").empty();
            $("#resultId").append(resultString);

            // Load the tweet button
            var tweetResult = data.domain;
            var siteUrl="http://dnssec-name-and-shame.com";
            if (data.isSecure) {
                tweetResult += " has successfully implemented #DNSSEC. " + siteUrl;
            } else {
                tweetResult += " has NOT successfully implemented #DNSSEC. " +siteUrl;
            }
            var tweetString = "<p/><img src=\"resources/image/bird_blue_48.png\"><h3><a href=http://twitter.com/home/?status=" + encodeURIComponent(tweetResult) + ">Tweet results for " + data.domain +"</a></h3>";
            $("#tweetId").empty();
            $("#tweetId").append(tweetString);

            // play the sound
            if (data.isSecure === true) {
                playSound("done");
            } else {
                playSound("fail");
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
