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
	$(function () {
		// make comment timestamps a link to the comment
		$(".comments tr").each(function () {
			var commentId = this.id;
			var href = "<a href='#" + commentId + "'/>";
			$(".comment-date", this).wrap(href);
		});

		// add timeline and history links to post menu
		var questionURL = $("#question-header a").attr("href");
		if (questionURL) {
			var post = questionURL.replace("questions", "posts").replace(/\/[^\/]*$/, ""),
				timeline = post + "/timeline",
				revisions = post + "/revisions";
			$(".post-menu").each(function() {
				if (!revisions)
					revisions = "/posts"
						+ $(this).find("a:contains('link'):first")
							.attr("href")
							.replace(questionURL, "")
							.replace(/#.*/, "")
						+ "/revisions";

				$(this).append("<span class='lsep'>|</span><a href='" + timeline + "'>timeline</a><span class='lsep'>|</span><a href='" + revisions + "'>history</a>");
				
				revisions = null;
			});
		}

		// adds an audit link next to your rep in the header that leads to /reputation
		$("#hlinks-user .reputation-score").parent().after("<a href='/reputation'>(audit)</a>");
	});
});