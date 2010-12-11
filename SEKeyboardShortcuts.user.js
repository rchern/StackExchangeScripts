// ==UserScript==
// @name		SE Keyboard Navigation
// @description	VIM like navigation of Stack Exchange sites
// @include		http://stackoverflow.com/*
// @include		http://meta.stackoverflow.com/*
// @include		http://superuser.com/*
// @include		http://meta.superuser.com/*
// @include		http://serverfault.com/*
// @include		http://meta.serverfault.com/*
// @include		http://askubuntu.com/*
// @include		http://meta.askubuntu.com/*
// @include		http://answers.onstartups.com/*
// @include		http://meta.answers.onstartups.com/*
// @include		http://nothingtoinstall.com/*
// @include		http://meta.nothingtoinstall.com/*
// @include		http://seasonedadvice.com/*
// @include		http://meta.seasonedadvice.com/*
// @include		http://stackapps.com/*
// @include		http://*.stackexchange.com/*
// @exclude		http://chat.stackexchange.com/*
// @exclude		http://chat.*.stackexchange.com/*
// @exclude		http://api.*.stackexchange.com/*
// @exclude		http://odata.stackexchange.com/*
// @exclude		http://area51.stackexchange.com/*
// @exclude		http://*/reputation
// @author		@rchern
// ==/UserScript==

function with_jquery(callback) {
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.textContent = "(" + callback.toString() + ")(jQuery)";
	document.body.appendChild(script);
}

with_jquery(function ($) {
	$(function () {
		$.fn.shortcut = function (fn, params) {
			params = $.extend({}, $.fn.shortcut.params, params);
			return this.each(function () {
				$(this).bind('keyup', function (event) {
					if (this !== event.target && (/textarea|select/i.test(event.target.nodeName) || event.target.type === "text")) { return; }
					if (event.keyCode == params.code[params.step]) { if (params.step == 0) { params.startTime = new Date(); } params.step++; }
					else { params.step = 0; }
					if (params.step == params.code.length) { if (new Date() - params.startTime <= 2E3) { fn(); } params.step = 0; }
				});
			});
		};

		$.fn.shortcut.params = { 'code': [38, 38, 40, 40, 37, 39, 37, 39, 66, 65], 'step': 0 };

		var goToDestination = function (url) { location = url; };

		var selectPost = function (i) {
			i = i % posts.length;
			selectedPost = posts.css("padding", "5px").css("border", "1px solid " + $("#content").css("backgroundColor")).eq(i);
			selectedPost.css("border", "1px dashed black");
			//$.scrollTop(posts.eq(i).position().y);
		};

		var convertCode = function (code) {
			var chars = code.split(",");
			for (var i = 0; i < chars.length; i++) { chars[i] = chars[i].charCodeAt(0); }
			return chars;
		}

		var GlobalShortcuts = {
			"home": { code: "G,H", url: "/" },
			"questions": { code: "G,Q", url: "/questions" },
			"tags": { code: "G,T", url: "/tags" },
			"users": { code: "G,U", url: "/users" },
			"badges": { code: "G,B", url: "/badges" },
			"unanswered": { code: "G,N", url: "/unanswered" },
			"ask": { code: "G,A", url: "/questions/ask" },
			"recent": { code: "G,E", url: "/users/recent" },
			"rep audit": { code: "G,R", url: "/reputation" },
			"chat": { code: "G,C", url: "http://chat." + location.hostname },
			"profile": { code: "G,P", url: $("hlinks-user a").eq(1).href },
			"sister": { code: "G,S", url: "http://" + (location.hostname.indexOf("meta") === 0 ? location.hostname.substring(5) : "meta." + location.hostname) },
			"inbox": { code: "G,I", fn: function () { $("#portalLink .genu").click(); $("#portalLink #seTabInbox").click(); } }
		};

		var PostShortcuts = {
			"vote up": { code: "V,U", fn: function () { selectedPost.closest("#question,.answer").find(".vote-up-off").click(); } },
			"vote down": { code: "V,D", fn: function () { selectedPost.closest("#question,.answer").find(".vote-down-off").click(); } },
			"reply / comment": { code: "R", fn: function () { selectedPost.closest("#question,.answer").find("a.comments-link").click(); } },
			"flag": { code: "F", fn: function () { selectedPost.closest("#question,.answer").find("a[id^=flag]").click(); } },
			"close": { code: "V,C", fn: function () { selectedPost.closest("#question,.answer").find("a[id^=close]").click(); } },
			"edit": { code: "E", fn: function () { selectedPost.closest("#question,.answer").find("a[href=edit]").click(); } },
			"bounty": { code: "B", fn: function () { selectedPost.closest("#question,.answer").find("#bounty-link").click(); } },
			"owner": { code: "O", fn: function () { goToDestination(selectedPost.closest("#question,.answer").find(".user-details a").attr("href")); } }
		};


		var $w = $(window);
		$.each(GlobalShortcuts, function (name, item) {
			code = convertCode(item.code);
			$w.shortcut(function () {
				if (item.url) { goToDestination(item.url); }
				else { item.fn(); }
			}, { "code": code });
		});

		var posts = $("div.post-text"), curIndex = 0, selectedPost = null;
		selectPost(curIndex);
		$w.shortcut(function () { curIndex++; selectPost(curIndex); }, { "code": convertCode("J") });
		$w.shortcut(function () { curIndex--; selectPost(curIndex); }, { "code": convertCode("K") });

		$.each(PostShortcuts, function (name, item) {
			code = convertCode(item.code);
			$w.shortcut(function () { item.fn() }, { "code": code });
		});
	});
});