var nameShameForm = $("#name-shame-form");

function onSubmit(evt) {
    var domainname = $("[name=domainname]", this).val();

    $.getJSON("/name-shame/", {
        domainname: domainname
    })
        .fail(function(jqXHR, textStatus, errorThrown) {
            // TODO: show error to the user
            console.error(jqXHR, textStatus, errorThrown);
        })
        .done(function(data, textStatus, jqXHR) {
            // TODO: use data
            console.log(data, textStatus, jqXHR);
        });

    return false;
}

nameShameForm.on("submit", onSubmit);