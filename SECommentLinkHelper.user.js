// ==UserScript==
// @name          SE Comment Link Helper
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
        var filter = '-ox0X.YDyJfh',
            textarea = t.addClass('link-hijacked')[0],
            form = t.closest('form'),
            link = new RegExp('(?:^|[^\\(])http://([^\\s/]+)/q(?:uestions)?/([0-9]+)', 'ig'),
            lock = 0,
            submitComment = form.data('events').submit[0].handler,
            validSites = /^(?:(?:(?:meta\.)?(?:stackoverflow|[^.]+\.stackexchange|serverfault|askubuntu|superuser))|stackapps)\.com$/i,
            miniLink = /(^|\s)(\[([^\]]+)\]\((?:(?:https?|ftp):\/\/[^)\s]+?)(?:\s(?:"|&quot;)(?:[^"]+?)(?:"|&quot;))?\))/g,
            miniCode = /(^|\W)(`(?:.+?)`)(?=\W|$)/g,
            results = [];

        form.data('events').submit[0].handler = handler;

        function handler() {
            if (lock)
                return;

            lock = -1;

            var url, ids = {}, count = 0,
                comment = textarea.value.replace(miniLink, "$1##").replace(miniCode, "$1##");

            while (url = link.exec(comment)) {
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

            if (!data.items || !data.items.length) {
                if (lock < 0) {
                    submit();
                }

                return;
            }

            data.domain = domain;

            results.push(data);

            if (lock < 0) {
                submit();
            }
        }

        function submit() {
            var i, j, pattern, swaps = [],
                swapper = function (s, m1, m2) {
                    swaps.push(m2);
                    
                    console.log(m2);
                    
                    return m1 + "~%" + (swaps.length - 1) + "#";
                },
                comment = textarea.value;

            if (results.length) {
                comment = comment.replace(miniLink, swapper).replace(miniCode, swapper);
            
                for (i = 0; i < results.length; ++i) {
                    for (j = 0; j < results[i].items.length; ++j) {
                        pattern = '(^|[^\\(])http://' + results[i].domain + '/(q(?:uestions)?)/' + results[i].items[j].question_id + '(?:/[-\\w]*)?(/[0-9]+)?(?:\\?[a-z]+=1)?(#\\w+)?';
                        comment = comment.replace(new RegExp(pattern, 'gi'), function (s, leading, question, trailing, anchor) {
                            leading = leading || '';
                            trailing = trailing || '';
                            anchor = anchor || '';
                            
                            var url, comment = /^#comment(\d+)_/.exec(anchor);
                            
                            if (comment) {
                                url = '/posts/comments/' + comment[1];
                            } else if (question === 'questions' && trailing) {
                                url = '/a' + trailing;
                            } else {
                                url = '/q/' + results[i].items[j].question_id;
                            }
                            
                            return leading + '[' + results[i].items[j].title.replace(']', '\]') + '](http://' + results[i].domain + url + ')';
                        });
                    }
                }

                textarea.value = comment.replace(/~%(\d+)#/g, function (s, m1) {
                    return swaps[+m1];
                });
                $(textarea).trigger('keyup');
            }

            submitComment.call(form[0]);

            results = [];
            lock = 0;
        }

        function request(ids, callback) {
            for (var domain in ids) {
                if (validSites.test(domain)) {
                    lock = lock < 0 ? 1 : lock + 1;

                    $.get('http://api.stackexchange.com/2.1/questions/' + ids[domain].join(';') + '?site=' + toSite(domain) + '&filter=' + filter,
                        (function (d) {
                            var domain = d;

                            return function (data) {
                                // Go home Firefox you are drunk
                                if (typeof(data) === 'string') {
                                    data = JSON.parse(data);
                                }
                            
                                callback(data, domain);
                            };
                        })(domain));
                }
            }
        }
        
        function toSite(domain) {
            return domain.substring(0, domain.indexOf('.'));
        }
    }

    $(document).ready(function () {
        $('textarea[name="comment"]:not(.link-hijacked)').live('focus', function () {
            new HijackedTextarea($(this));
        });
    });
});