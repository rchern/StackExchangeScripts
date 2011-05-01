// ==UserScript==
// @name          Comment link filter
// @description   A hook to transform raw links to properly titled links in comments
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
// @include       http://stackapps.com/*
// @include       http://*.stackexchange.com/*
// @exclude       http://chat.stackexchange.com/*
// @exclude       http://chat.*.stackexchange.com/*
// @exclude       http://api.*.stackexchange.com/*
// @exclude       http://data.stackexchange.com/*
// @exclude       http://*/reputation
// @author        @TimStone
// ==/UserScript==

function inject() {
	for (var i = 0; i < arguments.length; ++i) {
		if (typeof(arguments[i]) == 'function') {
			var script = document.createElement('script');

			script.type = 'text/javascript';
			script.textContent = '(' + arguments[i].toString() + ')(jQuery)';

			document.body.appendChild(script);
		}
	}
}

inject(function ($) {	
	function HijackedTextarea(t) {
		var textarea = t.addClass('link-hijacked'),
			form = textarea.closest('form'),
			link = new RegExp('(?:^|[^\\(])http://([^\\s/]+)/q(?:uestions)?/([0-9]+)', 'ig'),
			lock = 0,
			submitComment = form.data('events').submit[0].handler,
			validSites = /^(?:(?:(?:meta\.)?(?:stackoverflow|[^.]+\.stackexchange|serverfault|askubuntu|superuser))|stackapps)\.com$/i,
			results = [];
			
		form.data('events').submit[0].handler = handler;
		
		function handler() {
			if (lock)
				return;

			lock = -1;
		
			var url, ids = {}, count = 0;;

			while (url = link.exec(textarea.val())) {
				if (!ids[url[1]])
					ids[url[1]] = []
			
				ids[url[1]].push(url[2]);
				
				++count;
			}
			
			if (count)
				request(ids, callback);
			else
				submit.call(form.eq(0));

			link.lastIndex = 0;
			
			return false;
		}
		
		function callback(data, domain) {
			lock = lock - 1 === 0 ? -1 : lock - 1;
		
			if (!data.questions || !data.questions.length)
				return;
		
			data.domain = domain;
			
			results.push(data);
			
			if (lock < 0) {
				submit();
			}
		}
		
		function submit() {
			var i, j, pattern, value = textarea.val();
		
			if (results.length) {
				for (i = 0; i < results.length; ++i) {
					for (j = 0; j < results[i].questions.length; ++j) {
						pattern = '(?:^|[^\\(])http://' + results[i].domain + '/(q(?:uestions)?)/' + results[i].questions[j].question_id + '(?:/[^\\s/]*)?(/[0-9]+)?(#[^\\s]+)?';
						value = value.replace(new RegExp(pattern, 'i'), function (s, question, trailing, anchor) {
							trailing = trailing || '';
							anchor = anchor || '';
						
							return '[' + results[i].questions[j].title + '](http://' + results[i].domain + '/' +
								(question === 'questions' && trailing === '' ? 'q' : question) + '/' + results[i].questions[j].question_id +
								(question === 'q' ? '' : trailing) + anchor + ')';
						});
					}
				}
			
				textarea.val(value).keyup();
			}
			
			submitComment.call(form.eq(0));

			results = [];
			lock = 0;
		}
		
		function request(ids, callback) {
			for (var domain in ids) {
				if (validSites.test(domain)) {
					lock = lock < 0 ? 1 : lock + 1;
					
					$.getJSON('http://api.' + domain + '/1.1/questions/' + ids[domain].join(';') + '?jsonp=?',
						(function (d) {
							var domain = d;
			
							return function (data) {
								callback(data, domain);
							};
						})(domain));
				}
			}
		}
	}
	
	$(document).ready(function () {
		$('textarea[name="comment"]:not(.link-hijacked)').live('focus', function () {
			new HijackedTextarea($(this));
		});
	});
});