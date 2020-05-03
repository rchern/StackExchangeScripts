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

	/*
	* jqModal - Minimalist Modaling with jQuery
	*   (http://dev.iceburg.net/jquery/jqModal/)
	*
	* Copyright (c) 2007,2008 Brice Burgess <bhb@iceburg.net>
	* Dual licensed under the MIT and GPL licenses:
	*   http://www.opensource.org/licenses/mit-license.php
	*   http://www.gnu.org/licenses/gpl.html
	* 
	* $Version: 03/01/2009 +r14
	*/
	(function ($) { $.fn.jqm = function (o) { var p = { overlay: 50, overlayClass: 'jqmOverlay', closeClass: 'jqmClose', trigger: '.jqModal', ajax: F, ajaxText: '', target: F, modal: F, toTop: F, onShow: F, onHide: F, onLoad: F }; return this.each(function () { if (this._jqm) return H[this._jqm].c = $.extend({}, H[this._jqm].c, o); s++; this._jqm = s; H[s] = { c: $.extend(p, $.jqm.params, o), a: F, w: $(this).addClass('jqmID' + s), s: s }; if (p.trigger) $(this).jqmAddTrigger(p.trigger); }); }; $.fn.jqmAddClose = function (e) { return hs(this, e, 'jqmHide'); }; $.fn.jqmAddTrigger = function (e) { return hs(this, e, 'jqmShow'); }; $.fn.jqmShow = function (t) { return this.each(function () { t = t || window.event; $.jqm.open(this._jqm, t); }); }; $.fn.jqmHide = function (t) { return this.each(function () { t = t || window.event; $.jqm.close(this._jqm, t) }); }; $.jqm = { hash: {}, open: function (s, t) { var h = H[s], c = h.c, cc = '.' + c.closeClass, z = (parseInt(h.w.css('z-index'))), z = (z > 0) ? z : 3000, o = $('<div></div>').css({ height: '100%', width: '100%', position: 'fixed', left: 0, top: 0, 'z-index': z - 1, opacity: c.overlay / 100 }); if (h.a) return F; h.t = t; h.a = true; h.w.css('z-index', z); if (c.modal) { if (!A[0]) L('bind'); A.push(s); } else if (c.overlay > 0) h.w.jqmAddClose(o); else o = F; h.o = (o) ? o.addClass(c.overlayClass).prependTo('body') : F; if (ie6) { $('html,body').css({ height: '100%', width: '100%' }); if (o) { o = o.css({ position: 'absolute' })[0]; for (var y in { Top: 1, Left: 1 }) o.style.setExpression(y.toLowerCase(), "(_=(document.documentElement.scroll" + y + " || document.body.scroll" + y + "))+'px'"); } } if (c.ajax) { var r = c.target || h.w, u = c.ajax, r = (typeof r == 'string') ? $(r, h.w) : $(r), u = (u.substr(0, 1) == '@') ? $(t).attr(u.substring(1)) : u; r.html(c.ajaxText).load(u, function () { if (c.onLoad) c.onLoad.call(this, h); if (cc) h.w.jqmAddClose($(cc, h.w)); e(h); }); } else if (cc) h.w.jqmAddClose($(cc, h.w)); if (c.toTop && h.o) h.w.before('<span id="jqmP' + h.w[0]._jqm + '"></span>').insertAfter(h.o); (c.onShow) ? c.onShow(h) : h.w.show(); e(h); return F; }, close: function (s) { var h = H[s]; if (!h.a) return F; h.a = F; if (A[0]) { A.pop(); if (!A[0]) L('unbind'); } if (h.c.toTop && h.o) $('#jqmP' + h.w[0]._jqm).after(h.w).remove(); if (h.c.onHide) h.c.onHide(h); else { h.w.hide(); if (h.o) h.o.remove(); } return F; }, params: {} }; var s = 0, H = $.jqm.hash, A = [], ie6 = $.browser.msie && ($.browser.version == "6.0"), F = false, i = $('<iframe src="javascript:false;document.write(\'\');" class="jqm"></iframe>').css({ opacity: 0 }), e = function (h) { if (ie6) if (h.o) h.o.html('<p style="width:100%;height:100%"/>').prepend(i); else if (!$('iframe.jqm', h.w)[0]) h.w.prepend(i); f(h); }, f = function (h) { try { $(':input:visible', h.w)[0].focus(); } catch (_) { } }, L = function (t) { $()[t]("keypress", m)[t]("keydown", m)[t]("mousedown", m); }, m = function (e) { var h = H[A[A.length - 1]], r = (!$(e.target).parents('.jqmID' + h.s)[0]); if (r) f(h); return !r; }, hs = function (w, t, c) { return w.each(function () { var s = this._jqm; $(t).each(function () { if (!this[c]) { this[c] = []; $(this).click(function () { for (var i in { jqmShow: 1, jqmHide: 1 }) for (var s in this[i]) if (H[this[i][s]]) H[this[i][s]].w[i](this); return F; }); } this[c].push(s); }); }); }; })(jQuery);

	/*
	* Viewport - jQuery selectors for finding elements in viewport
	*
	* Copyright (c) 2008-2009 Mika Tuupola
	*
	* Licensed under the MIT license:
	*   http://www.opensource.org/licenses/mit-license.php
	*
	* Project home:
	*  http://www.appelsiini.net/projects/viewport
	*
	*/
	/* with additions by rchern */
	(function ($) { $.belowthefold = function (element, settings) { var fold = $(window).height() + $(window).scrollTop(); return fold <= $(element).offset().top - settings.threshold; }; $.abovethetop = function (element, settings) { var top = $(window).scrollTop(); return top >= $(element).offset().top + $(element).height() - settings.threshold; }; $.rightofscreen = function (element, settings) { var fold = $(window).width() + $(window).scrollLeft(); return fold <= $(element).offset().left - settings.threshold; }; $.leftofscreen = function (element, settings) { var left = $(window).scrollLeft(); return left >= $(element).offset().left + $(element).width() - settings.threshold; }; $.inviewport = function (element, settings) { return !$.rightofscreen(element, settings) && !$.leftofscreen(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings); }; $.topVisible = function (element, settings) { var top = $(window).scrollTop(); var bottom = top + $(window).height(); var elPos = $(element).offset().top - settings.threshold; return (top <= elPos) && (bottom >= elPos); }; $.bottomVisible = function (element, settings) { var top = $(window).scrollTop(); var bottom = $(window).height() + $(window).scrollTop(); var elPos = $(element).offset().top + $(element).height() - settings.threshold; return (top <= elPos) && (bottom >= elPos); }; $.leftVisible = function (element, settings) { var left = $(window).scrollLeft(); var right = left + $(window).width(); var elPos = $(element).offset().left - settings.threshold; return (left <= elPos) && (right >= elPos); }; $.rightVisible = function (element, settings) { var left = $(window).scrollLeft(); var right = left + $(window).width(); var elPos = $(element).offset().left + $(element).width() - settings.threshold; return (left <= elPos) && (right >= elPos); }; $.fullyVisible = function (element, settings) { return $.topVisible(element, settings) && $.bottomVisible(element, settings) && $.leftVisible(element, settings) && $.rightVisible(element, settings); }; $.extend($.expr[':'], { "below-the-fold": function (a, i, m) { return $.belowthefold(a, { threshold: 0 }); }, "above-the-top": function (a, i, m) { return $.abovethetop(a, { threshold: 0 }); }, "left-of-screen": function (a, i, m) { return $.leftofscreen(a, { threshold: 0 }); }, "right-of-screen": function (a, i, m) { return $.rightofscreen(a, { threshold: 0 }); }, "in-viewport": function (a, i, m) { return $.inviewport(a, { threshold: 0 }); }, "top-visible": function (a, i, m) { return $.topVisible(a, { threshold: 0 }); }, "bottom-visible": function (a, i, m) { return $.bottomVisible(a, { threshold: 0 }); }, "left-visible": function (a, i, m) { return $.leftVisible(a, { threshold: 0 }); }, "right-visible": function (a, i, m) { return $.rightVisible(a, { threshold: 0 }); }, "fully-visible": function (a, i, m) { return $.fullyVisible(a, { threshold: 0 }); } }); })(jQuery);

	/* shortcut plugin */
	(function ($) { $.fn.shortcut = function (fn, params) { params = $.extend({}, $.fn.shortcut.params, params); return this.each(function () { $(this).bind('keyup', function (event) { if (this !== event.target && (/textarea|select/i.test(event.target.nodeName) || event.target.type === "text")) { return; } if (event.keyCode === params.code[params.step]) { if (params.step === 0) { params.startTime = new Date(); } params.step++; } else { params.step = 0; } if (params.step === params.code.length) { if (new Date() - params.startTime <= 2E3) { fn(); } params.step = 0; } }); }); }; $.fn.shortcut.params = { 'code': [38, 38, 40, 40, 37, 39, 37, 39, 66, 65], 'step': 0 }; })(jQuery);

	$(function () {
		var curIndex = -2, selectedItem = null;

		var goToDestination = function (url) { location = url; };

		var selectItem = function (items, i) {
			if (i < 0) {
				// make a guess at the selected post
				var fullyVisiblePosts = items.filter(":fully-visible");
				if (fullyVisiblePosts.length > 0) {
					i = items.index(fullyVisiblePosts[0]);
				} else {
					var partiallyVisiblePosts = items.filter(":in-viewport");
					if (partiallyVisiblePosts.length === 1) {
						i = items.index(partiallyVisiblePosts[0]);
					} else {
						if (i === -1) {
							i = items.index(partiallyVisiblePosts[1]);
						} else {
							i = items.index(partiallyVisiblePosts[0]);
						}
					}
				}
			} else {
				i = i % items.length;
			}
			selectedItem = items.removeAttr("style").eq(i);
			selectedItem.css("border", "1px dashed black");
			if (!selectedItem.is(":fully-visible")) {
				$.scrollTo(selectedItem);
			}
			curIndex = i;
		};

		var getCharacterCode = function (code) {
			var c = null;
			switch (code) {
				case "ENTER":
					c = 13;
					break;
				case "ESC":
					c = 27;
					break;
				case "?":
					c = 191;
					break;
				default:
					c = code.charCodeAt(0);
					break;
			}
			return c;
		};

		var convertCode = function (code) {
			var chars = code.split(",");
			for (var i = 0; i < chars.length; i++) { chars[i] = getCharacterCode(chars[i]); }
			return chars;
		};

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
			"profile": { code: "G,P", url: $("#hlinks-user a").attr("href") },
			"profile summary": { code: "G,S", fn: function () { $(".profile-triangle").mouseover(); } },
			"main vs meta": { code: "G,M", url: "http://" + (location.hostname.indexOf("meta") === 0 ? location.hostname.substring(5) : "meta." + location.hostname) },
			"inbox": { code: "G,I", fn: function () { $("#portalLink .genu").click(); $("#portalLink #seTabInbox").click(); } },
			"help": { code: "?", fn: function () { $("#helpOverlay").jqmShow(); } },
			"close help": { code: "ESC", fn: function () { $(".jqmWindow").jqmHide(); } }
		};

		var setupHelpOverlay = function () {
			var styleText = ""; // ".easy-navigation-peekable { -moz-border-radius: 4px 4px 4px 4px;background-color: #000000;border-radius: 4px 4px 4px 4px;color: #F0F0F0;margin-top: 5px;padding-right: 0px !important;position: absolute;z-index: 4;} .easy-navigation-peeked-message: {line-height: 1.5em;padding: 3px 0px 3px 15px;},.easy-navigation-subtle: { color: #D2F7D0;display: block;font-size: 10px;}";
			styleText += ".jqmWindow {display: none;position: fixed;top: 17%;left: 50%;margin-left: -300px;width: 600px;background-color: #EEE;color: #333;border: 1px solid black;padding: 12px;}.jqmOverlay { background-color: #000; } * iframe.jqm {position:absolute;top:0;left:0;z-index:-1;width: expression(this.parentNode.offsetWidth+'px');height: expression(this.parentNode.offsetHeight+'px');}* html .jqmWindow {position: absolute;top: expression((document.documentElement.scrollTop || document.body.scrollTop) + Math.round(17 * (document.documentElement.offsetHeight || document.body.clientHeight) / 100) + 'px');}";
			$('<style />').text(styleText).appendTo('head');
			var helpOverlay = $("<div id='helpOverlay' class='jqmWindow easy-navigation-peekable'>");
			var text = "";
			$.each(GlobalShortcuts, function (name, item) {
				text += "<br>" + name + ": " + item.code;
			});
			var globalOverlay = $("<div class='easy-navigation-peeked-message'><span class='easy-navigation-subtle'>Global Shortcuts:</span>" + text + "</div>").appendTo(helpOverlay);
			text = "";
			$.each(PostShortcuts, function (name, item) {
				text += "<br>" + name + ": " + item.code;
			});
			var postOverlay = $("<div class='easy-navigation-peeked-message'><span class='easy-navigation-subtle'>Post Shortcuts:</span>" + text + "</div>").appendTo(helpOverlay);

			text = "";
			$.each(ListingShortcuts, function (name, item) {
				text += "<br>" + name + ": " + item.code;
			});
			var listingOverlay = $("<div class='easy-navigation-peeked-message'><span class='easy-navigation-subtle'>Listing Shortcuts:</span>" + text + "</div>").appendTo(helpOverlay);

			helpOverlay.appendTo(document.body).jqm();
		};

		var PostShortcuts = {
			"vote up": { code: "V,U", fn: function () { selectedItem.closest("#question,.answer").find(".vote-up-off").click(); } },
			"vote down": { code: "V,D", fn: function () { selectedItem.closest("#question,.answer").find(".vote-down-off").click(); } },
			"reply / comment": { code: "R", fn: function () { selectedItem.closest("#question,.answer").find("a.comments-link").click(); } },
			"flag": { code: "F", fn: function () { selectedItem.closest("#question,.answer").find("a[id^=flag]").click(); } },
			"close": { code: "V,C", fn: function () { selectedItem.closest("#question,.answer").find("a[id^=close]").click(); } },
			"edit": { code: "E", fn: function () { selectedItem.closest("#question,.answer").find("a[href=edit]").click(); } },
			"bounty": { code: "B", fn: function () { selectedItem.closest("#question,.answer").find("#bounty-link").click(); } },
			"owner": { code: "O", fn: function () { goToDestination(selectedItem.closest("#question,.answer").find(".user-details a").attr("href")); } }
		};

		var ListingShortcuts = {
			"go to question": { code: "ENTER", fn: function () { goToDestination("/questions/" + selectedItem.attr("id").replace("question-summary-", "")); } }
		};


		var $w = $(window);
		$.each(GlobalShortcuts, function (name, item) {
			code = convertCode(item.code);
			$w.shortcut(function () {
				if (item.url) { goToDestination(item.url); }
				else { item.fn(); }
			}, { "code": code });
		});

		var questionListing = $("#questions,#question-mini-list").length > 0;
		if (questionListing) {
			var questions = $("div.question-summary");
			$w.shortcut(function () { curIndex++; selectItem(questions, curIndex); }, { "code": convertCode("J") });
			$w.shortcut(function () { curIndex--; selectItem(questions, curIndex); }, { "code": convertCode("K") });
			$.each(ListingShortcuts, function (name, item) {
				code = convertCode(item.code);
				$w.shortcut(function () { item.fn(); }, { "code": code });
			});
		} else {
			var posts = $("div.post-text");
			$w.shortcut(function () { curIndex++; selectItem(posts, curIndex); }, { "code": convertCode("J") });
			$w.shortcut(function () { curIndex--; selectItem(posts, curIndex); }, { "code": convertCode("K") });

			$.each(PostShortcuts, function (name, item) {
				code = convertCode(item.code);
				$w.shortcut(function () { item.fn(); }, { "code": code });
			});
		}
		setupHelpOverlay();
	});
});
