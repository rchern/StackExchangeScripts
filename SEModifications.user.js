// ==UserScript==
// @name           SE Modifications
// @description    A collection of modifications for the Stack Exchange network of sites
// @include       http://stackoverflow.com/*
// @include       http://meta.stackoverflow.com/*
// @include       http://superuser.com/*
// @include       http://meta.superuser.com/*
// @include       http://serverfault.com/*
// @include       http://meta.serverfault.com/*
// @include       http://askubuntu.com/*
// @include       http://meta.askubuntu.com/*
// @include       http://answers.onstartups.com/*
// @include       http://meta.answers.onstartups.com/*
// @include       http://nothingtoinstall.com/*
// @include       http://meta.nothingtoinstall.com/*
// @include       http://seasonedadvice.com/*
// @include       http://meta.seasonedadvice.com/*
// @include       http://stackapps.com/*
// @include       http://*.stackexchange.com/*
// @exclude       http://chat.stackexchange.com/*
// @exclude       http://chat.*.stackexchange.com/*
// @exclude       http://api.*.stackexchange.com/*
// @exclude       http://odata.stackexchange.com/*
// @exclude       http://area51.stackexchange.com/*
// @exclude       http://*/reputation
// @author         @rchern
// ==/UserScript==

function with_jquery(f) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery)";
    document.body.appendChild(script);
};

with_jquery(function ($) {

	// make comment timestamps a link to the comment
	$(".comments tr").each(function () {
		var commentId = this.id;
		var href = "<a href='#" + commentId + "'/>";
		$(".comment-date", this).wrap(href);
	});

	// add timeline link to post menu
	var questionHeader = $("#question-header a");
	if (questionHeader.length == 1) {
		var href = questionHeader.attr("href").replace("questions", "posts");
		href = href.substring(0, href.lastIndexOf("/")) + "/timeline";
		$(".post-menu").append("<span class='lsep'>|</span> <a href='" + href + "'>timeline</a>");
	}
});