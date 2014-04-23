$(function() {
    var playSound = function(name) {
        var instance = createjs.Sound.play("fail");
    },

        domainLookupFail = function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error(jqXHR, textStatus, errorThrown);

            playSound("fail");
        },

        domainLookupDone = function(data, textStatus, jqXHR) {
            // TODO: use data
            console.log(data, textStatus, jqXHR);
            var resultString="<h2>DNSSEC Results</h1>";
            resultString+="<ul><li>Domain:  " + data.domain + "</li>";
            resultString+="<li>DNSSEC Secure:  " + data.isSecure + "</li>";
            resultString+="</ul>";	
            $("#resultId").empty();
            $("#resultId").append(resultString);
             if (data.isSecure) {
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
        var nameShameForm = $("#name-shame-form"),
            onSubmit = function(evt) {
                var domainname = $("[name=domainname]", this).val(),
                    onSubmitPromise = $.getJSON("/name-shame/", {
                        domainname: domainname
                    })
                        .fail(domainLookupFail)
                        .done(domainLookupDone);

                return false;
            };

        nameShameForm.on("submit", onSubmit);
    }());
});
