$(function() {
    var $document = $(document),
        $nameShameForm = $("#name-shame-form"),
        $domainInput = $("[name=domainname]", $nameShameForm),

        playSound = function(name) {
            var instance = createjs.Sound.play(name);
        },

        domainLookupFail = function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error(jqXHR, textStatus, errorThrown);

            playSound("fail");
        },

        domainLookupDone = function(data, textStatus, jqXHR) {
            // TODO: use data
            console.log(data, textStatus, jqXHR);
            
            // Load the success or failure image
            var image="";
            if (data.isSecure){
              image="Success";
            } else {
              image="Failure";
            }
            var imageString="<img src=resources/image/"+image+".png />";
            $("#resultImageId").empty();
            $("#resultImageId").append(imageString);

            // Load the results text
            var resultString = "<h2>DNSSEC Results</h1>";
            resultString += "<ul><li>Domain:  " + data.domain + "</li>";
            resultString += "<li>DNSSEC Secure:  " + data.isSecure + "</li>";
            resultString += "</ul>";
            $("#resultId").empty();
            $("#resultId").append(resultString);

            // Load the tweet button
            var tweetResult = data.domain;
            if (data.isSecure) {
               tweetResult+=" has successfully implemented #DNSSEC";
            } else {
               tweetResult+=" has NOT successfully implemented #DNSSEC";
            }
	    var tweetString="<p/><h3><a href=http://twitter.com/home/?status=" + encodeURIComponent(tweetResult) + ">Tweet this result</a></h3>";
            $("#tweetId").empty();
            $("#tweetId").append(tweetString);

            // play the sound
            if (data.isSecure === true) {
                playSound("done");
            } else {
                playSound("fail");
            }
        };

    (function() {
        createjs.Sound.registerSound("resources/audio/164089_2975503-lq.mp3", "fail");
        createjs.Sound.registerSound("resources/audio/109662_945474-lq.mp3", "done");
    }());

    (function() {
        var onSubmit = function(event) {
            event.preventDefault();

            var domainname = $domainInput.val(),
                onSubmitPromise = $.getJSON("/name-shame/", {
                    domainname: domainname
                })
                    .fail(domainLookupFail)
                    .done(domainLookupDone);

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
                    domain = getDomainFromUrl(url);

                $domainInput.val(domain);
                $nameShameForm.submit();

                return false;
            };

        $document.on("click", ".has-domains-to-check a", doAjaxOnLinkClick);
    }());
});
