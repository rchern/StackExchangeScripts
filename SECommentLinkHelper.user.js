// ==UserScript==
// @name          SE Comment Link Helper
// @description   A hook to transform raw links to properly titled links in comments
// @match         *://stackoverflow.com/*
// @match         *://meta.stackoverflow.com/*
// @match         *://superuser.com/*
// @match         *://meta.superuser.com/*
// @match         *://serverfault.com/*
// @match         *://meta.serverfault.com/*
// @match         *://askubuntu.com/*
// @match         *://meta.askubuntu.com/*
// @match         *://stackapps.com/*
// @match         *://*.stackexchange.com/*
// @exclude       *://chat.stackexchange.com/*
// @exclude       *://chat.*.stackexchange.com/*
// @exclude       *://api.*.stackexchange.com/*
// @exclude       *://data.stackexchange.com/*
// @exclude       *://*/reputation
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
        var filters = { questions: '-ox0X.YDyJfh', answers: '!b6vl_mZrb8iVXs' },
            textarea = t.addClass('link-hijacked')[0],
            form = t.closest('form'),
            span = document.createElement('span'),
            link = new RegExp('(?:^|[^\\w\\\\])https?://([^\\s/]+)/(q(?:uestions)?|a)/([0-9]+)', 'ig'),
            lock = 0,
            submitComment = $._data(form[0], 'events').submit[0].handler,
            validSites = /^(?:(?:(?:meta\.)?(?:stackoverflow|[^.]+\.stackexchange|serverfault|askubuntu|superuser))|stackapps)\.com$/i,
            miniLink = /(^|\W)(\[([^\]]+)\]\((?:(?:https?|ftp):\/\/[^)\s]+?)(?:\s(?:"|&quot;)(?:[^"]+?)(?:"|&quot;))?\))/g,
            miniCode = /(^|\W)(`(?:.+?)`)(?=\W|$)/g,
            results = [];

        $._data(form[0], 'events').submit[0].handler = handler;

        function handler() {
            if (lock)
                return;

            lock = -1;

            var url, questions = {}, answers = {},
                comment = textarea.value.replace(miniLink, "$1##").replace(miniCode, "$1##");

            while (url = link.exec(comment)) {
                var type = url[2] === 'a' ? answers : questions,
                    domain = url[1];

                if (!type[domain])
                    type[domain] = [];

                type[domain].push(url[3]);
            }

            if (Object.keys(questions).length || Object.keys(answers).length) {
                request(questions, 'questions', callback);
                request(answers, 'answers', callback);
            }
            
            if (lock < 0) {
                // either no question and answer links were detected, *or* none of the
                // links were for valid sites and so no AJAX requests were started.
                // In either case we need to trigger the comment submit at this point.
                submit();
            }

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
            var i, j, id, post, pattern, swaps = [],
                swapper = function (s, m1, m2) {
                    swaps.push(m2);

                    return m1 + "~%" + (swaps.length - 1) + "#";
                },
                comment = textarea.value;

            if (results.length) {
                for (i = 0; i < results.length; ++i) {
                    comment = comment.replace(miniLink, swapper).replace(miniCode, swapper);

                    for (j = 0; j < results[i].items.length; ++j) {
                        post = results[i].items[j];
                        id = post.question_id || post.answer_id;
                        pattern = '(^|[^\\w\\\\])http(s?)://' + results[i].domain.replace('.', '\\.') + '/(q(?:uestions)?|a)/' + id + '(?:/[-\\w]*)?(/[0-9]+)?(?:\\?[a-z]+=1)?(#\\w+)?';
                        comment = comment.replace(new RegExp(pattern, 'gi'), function (s, leading, https, type, trailing, anchor) {
                            leading = leading || '';
                            trailing = trailing || '';
                            anchor = /^#comment(\d+)_/.exec(anchor || '');

                            var url;

                            if (anchor) {
                                url = '/posts/comments/' + anchor[1];
                            } else if (type === 'questions' && trailing) {
                                url = '/a' + trailing;
                            } else if (type === 'a') {
                                url = '/a/' + id;
                            } else {
                                url = '/q/' + id;
                            }

                            return leading + '[' + escapeMarkdown(toText(post.title)) + '](//' + results[i].domain + url + ')';
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

        function toText(html) {
            span.innerHTML = html;

            return span.textContent;
        }

        function escapeMarkdown(text) {
            return text.replace(/\[/g, '\\[')
                       .replace(/\]/g, '\\]')
                       .replace(/\*/g, '\\*')
                       .replace(/_/g, '\\_')
                       .replace(/`/g, '\\`');
        }

        function request(ids, type, callback) {
            Object.keys(ids).forEach(function (domain) {
                if (validSites.test(domain)) {
                    lock = lock < 0 ? 1 : lock + 1;

                    $.get(window.location.protocol + '//api.stackexchange.com/2.1/' + type + '/' + ids[domain].join(';') + '?site=' + domain + '&filter=' + filters[type] + '&key=p0r10MZ01l1H4So8wqT*qA((',
                        function (data) {
                            // Go home Firefox you are drunk
                            if (typeof(data) === 'string') {
                                data = JSON.parse(data);
                            }

                            callback(data, domain);
                        }
                    );
                }
            });
        }
    }

    $(document).on('focus', 'textarea[name="comment"]:not(.link-hijacked)', function () {
        new HijackedTextarea($(this));
    });
});
