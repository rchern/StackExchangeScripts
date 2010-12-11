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

	/**
	* jQuery.ScrollTo - Easy element scrolling using jQuery.
	* Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com
	* Dual licensed under MIT and GPL.
	* Date: 5/25/2009
	* @author Ariel Flesler
	* @version 1.4.2
	*
	* http://flesler.blogspot.com/2007/10/jqueryscrollto.html
	*/
	(function (d) { var k = d.scrollTo = function (a, i, e) { d(window).scrollTo(a, i, e) }; k.defaults = { axis: 'xy', duration: parseFloat(d.fn.jquery) >= 1.3 ? 0 : 1 }; k.window = function (a) { return d(window)._scrollable() }; d.fn._scrollable = function () { return this.map(function () { var a = this, i = !a.nodeName || d.inArray(a.nodeName.toLowerCase(), ['iframe', '#document', 'html', 'body']) != -1; if (!i) return a; var e = (a.contentWindow || a).document || a.ownerDocument || a; return d.browser.safari || e.compatMode == 'BackCompat' ? e.body : e.documentElement }) }; d.fn.scrollTo = function (n, j, b) { if (typeof j == 'object') { b = j; j = 0 } if (typeof b == 'function') b = { onAfter: b }; if (n == 'max') n = 9e9; b = d.extend({}, k.defaults, b); j = j || b.speed || b.duration; b.queue = b.queue && b.axis.length > 1; if (b.queue) j /= 2; b.offset = p(b.offset); b.over = p(b.over); return this._scrollable().each(function () { var q = this, r = d(q), f = n, s, g = {}, u = r.is('html,body'); switch (typeof f) { case 'number': case 'string': if (/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)) { f = p(f); break } f = d(f, this); case 'object': if (f.is || f.style) s = (f = d(f)).offset() } d.each(b.axis.split(''), function (a, i) { var e = i == 'x' ? 'Left' : 'Top', h = e.toLowerCase(), c = 'scroll' + e, l = q[c], m = k.max(q, i); if (s) { g[c] = s[h] + (u ? 0 : l - r.offset()[h]); if (b.margin) { g[c] -= parseInt(f.css('margin' + e)) || 0; g[c] -= parseInt(f.css('border' + e + 'Width')) || 0 } g[c] += b.offset[h] || 0; if (b.over[h]) g[c] += f[i == 'x' ? 'width' : 'height']() * b.over[h] } else { var o = f[h]; g[c] = o.slice && o.slice(-1) == '%' ? parseFloat(o) / 100 * m : o } if (/^\d+$/.test(g[c])) g[c] = g[c] <= 0 ? 0 : Math.min(g[c], m); if (!a && b.queue) { if (l != g[c]) t(b.onAfterFirst); delete g[c] } }); t(b.onAfter); function t(a) { r.animate(g, j, b.easing, a && function () { a.call(this, n, b) }) } }).end() }; k.max = function (a, i) { var e = i == 'x' ? 'Width' : 'Height', h = 'scroll' + e; if (!d(a).is('html,body')) return a[h] - d(a)[e.toLowerCase()](); var c = 'client' + e, l = a.ownerDocument.documentElement, m = a.ownerDocument.body; return Math.max(l[h], m[h]) - Math.min(l[c], m[c]) }; function p(a) { return typeof a == 'object' ? a : { top: a, left: a} } })(jQuery);


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
			$.scrollTo((i == 0 ? 0 : selectedPost), { "duration": 2E3 });
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