// ==UserScript==
// @name          SE Chat Modifications
// @description  A collection of modifications for SE chat rooms
// @include        http://chat.meta.stackoverflow.com/rooms/*
// @include        http://chat.webapps.stackexchange.com/rooms/*
// @include        http://chat.stackoverflow.com/rooms/*
// @include        http://chat.superuser.com/rooms/*
// @include        http://chat.serverfault.com/rooms/*
// @include        http://chat.askubuntu.com/rooms/*
// @include        http://chat.*.stackexchange.com/rooms/*
// @author         @rchern
// ==/UserScript==

function with_plugin(url, callback) {
    var script = document.createElement("script");
    script.setAttribute("src", url);
    script.addEventListener("load", function () {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = "(" + callback.toString() + ")(jQuery)";
        document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);
}

with_plugin("http://stackflair.com/jquery.livequery.js", function ($) {
    $.expr[':'].contains = function (a, i, m) {
        return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    function execute(name, args) {
        var returnVal;
        if (commands[name]) {
            try {
                returnVal = commands[name].apply(this, args);
            } catch (e) {
                returnVal = CommandState.Failed;
                showNotification("Error processing " + name + ":  " + e.message);
            }
        } else {
            returnVal = CommandState.NotFound;
        }
        return returnVal;
    }

    function showNotification(msg, delay) {
        if (!delay) { delay = 3000; }
        var inputError = $("#inputerror");
        inputError
        	.html(msg)
        	.fadeIn("slow").delay(delay).fadeOut("slow")
        	.hover(function () {
        	    $(this).clearQueue();
        	}, function () {
        	    $(this).delay(delay).fadeOut("slow");
        	});
    }

    function validateArgs(expectedLength, expectedTypes) {
        var actualArgs = validateArgs.caller.arguments;
        var actualLength = actualArgs.length;

        if (expectedLength) {
            if (expectedLength !== actualLength) {
                throw new Error("Expected " + expectedLength + " args to " + validateArgs.caller.name + " but received " + actualLength);
            }
        }

        if (expectedTypes) {
            for (var i = 0; i < actualLength; i++) {
                var actualType = typeof (actualArgs[i]);
                var expectedType = expectedTypes[i];
                if (expectedType === "number" && isNumber(actualArgs[i])) {
                    actualType = "number";
                }
                if (actualType !== expectedType) {
                    throw new Error("Parameter " + i + " should have type " + expectedType + " but has type " + actualType);
                }
            }
        }
    }

    function isNumber(n) {
        return !isNaN(parseInt(n, 10)) && isFinite(n);
    }

    var Selectors = {
        getMessage: function getMessage(id) {
            validateArgs(1, ["number"]);
            return "#message-" + id;
        },
        getSignature: function getSignature(match) {
            validateArgs(1, ["string"]);
            return "#.signature:contains('" + match + "') ~ .messages";
        },
        getRoom: function getRoom(match) {
            return "#my-rooms > li > a:first-child:contains('" + match + "')";
        }
    };

    var Storage = {
        add: function add(match) {
            var highlights = Storage.retrieveAll();
            if ($.inArray(match, highlights) < 0) {
                highlights.push(match);
                localStorage["chatHighlights"] = JSON.stringify(highlights);
            }
        },
        remove: function remove(match) {
            var highlights = Storage.retrieveAll();
            highlights.splice($.inArray(match, highlights), 1);
            localStorage["chatHighlights"] = JSON.stringify(highlights);
        },
        retrieveAll: function retrieveAll() {
            var highlights = localStorage["chatHighlights"];
            if (highlights != null) {
                highlights = JSON.parse(highlights);
            } else {
                highlights = [];
            }
            return highlights;
        }
    };
    var CommandState = { "NotFound": -1, "Failed": 0, "SucceededDoClear": 1, "SucceededNoClear": 2 };
    var commands = {
        star: function (id) {
            validateArgs(1, ["number"]);
            var star = $(Selectors.getMessage(id) + " .stars .img")[0];
            $(star).click();
            return CommandState.SucceededDoClear;
        },
        quote: function (id) {
            validateArgs(1, ["number"]);
            $("#input").val("http://" + window.location.host + "/transcript/message/" + id + "#" + id);
            $("#sayit-button").click();
        },
        "switch": function (match) {
            validateArgs(1, ["string"]);
            var selector = Selectors.getRoom(match) + "~ .quickswitch";
            var rooms = $(selector);
            if (rooms.length == 1) {
                window.location = $(rooms[0]).attr("href");
            } else {
                throw new Error("Unable to find single match");
            }
            return CommandState.SucceededDoClear;
        },
        transcript: function () {
            validateArgs(0);
            var transcript = $("a.button[href^=/transcript]")[0];
            var href = transcript.href;
            window.open(href);
            return CommandState.SucceededDoClear;
        },
        load: function () {
            validateArgs(0);
            var getMore = $('#getmore');
            var m = $(".message")[0];
            getMore.data("events").click[0].handler(function () {
                $(document).scrollTo(m, 400);
            });
            return CommandState.SucceededDoClear;
        },
        me: function () {
            // don't validate, just send the output
            $("#input").val("*" + $.makeArray(arguments).join(" ") + "*");
            $("#sayit-button").click();
            return CommandState.SucceededDoClear;
        },
        addhl: function (match) {
            match = $.makeArray(match).join(" ");
            var selector;
            if (isNumber(match)) {
                selector = Selectors.getMessage(match);
            } else {
                selector = Selectors.getSignature(match);
            }
            Storage.add(match);
            $(selector).livequery(function () {
                $(this).addClass("highlight");
            });
            return CommandState.SucceededDoClear;
        },
        delhl: function (match) {
            match = $.makeArray(match).join(" ");
            var selector;
            if (isNumber(match)) {
                selector = Selectors.getMessage(match);
            } else {
                selector = Selectors.getSignature(match);
            }
            Storage.remove(match);
            $(selector).expire().removeClass("highlight");
            return CommandState.SucceededDoClear;
        },
        highlights: function () {
            var highlights = Storage.retrieveAll(),
            	ul = $('<ul />').addClass('gm_room_list');

            if (highlights.length > 0) {
                for (var i = 0; i < highlights.length; i++) {
                    (function (current) {
                        $('<a />').click(function () {
                            $('#input').val('/delhl ' + current).focus();
                            return false;
                        }).attr('href', '#')
			    			.text(current)
				        	.wrap('<li />')
				        	.parent()
				        	.appendTo(ul);
                    })(highlights[i]);
                }
            } else {
                ul = $('<p />').text('Currently there are no highlighted users or messages');
            }

            showNotification(ul, 10E3);
            return CommandState.SucceededDoClear;
        },
        last: function (match) {
            match = $.makeArray(match).join(" ");
            var m = $(Selectors.getSignature(match)).last();
            m.addClass("highlight");
            window.setTimeout(function () {
                m.removeClass("highlight");
            }, 2000);
            $.scrollTo(m, 200);
            return CommandState.SucceededDoClear;
        },
        list: function (match) {
            $.get('/', {
                'tab': 'all',
                'sort': 'active',
                'page': 1,
                'filter': match
            }, function (data) {
                var ul = $('<ul />').addClass('gm_room_list'),
            		page = $(data),
            		pageCount = page.filter('.pager').find('a').length;

                function processPage() {
                    var room = $(this).find('h3 .room-name');
                    var href = room.find("a").attr("href");

                    var id = this.id.substring(this.id.indexOf('-') + 1);

                    $('<a />').attr({
                        'href': href,
                        'target': '_self'
                    }).text(id + " - " + room.attr("title"))
	                	.wrap('<li />')
	                	.parent()
	                	.appendTo(ul);
                }

                page.filter(".roomcard").each(processPage);

                if (pageCount >= 2) {
                    for (var i = 2; i <= pageCount; i++) {
                        $.get('/', {
                            'tab': 'all',
                            'sort': 'active',
                            'page': i,
                            'filter': match
                        }, function (data) {
                            $(data).filter(".roomcard").each(processPage);
                            if (i >= pageCount) { showNotification(ul, 10E3); }
                        });
                    }
                } else {
                    showNotification(ul, 10E3);
                }
            });

            return CommandState.SucceededDoClear;
        },
        join: function (id) {
            validateArgs(1, ["number"]);
            window.location = "/rooms/" + id;
            return CommandState.SucceededDoClear;
        },
        edit: function (id) {
            if (id == null) {
                id = $(".user-container.mine:last .message:last").attr("id").replace("message-", "");
            } else {
                validateArgs(1, ["number"]);
            }
            var elements = $(Selectors.getMessage(id) + " .action-link").click().closest('.message').find('.edit').click();
            if (elements.length !== 1) {
                throw new Error("Unable to edit message.");
            }
            return CommandState.SucceededNoClear;
        },
        leave: function (match) {
            if (!match) {
                // No argument - Leave current room
                $('#leave').click();
            } else if (isNumber(match)) {
                // Numerals - Leave room id
                $('#room-' + match).children('.quickleave').click();
            } else if (match.toLowerCase() === 'all') {
                // all - Leave all rooms
                $('#leaveall').click();
            } else {
                // String - leave room containing string
                $(Selectors.getRoom(match) + "~ .quickleave").click();
            }
            return CommandState.SucceededDoClear;
        }
    };

    $(function () {
        // ctrl+space retry
        $(document).keyup(function (evt) {
            if (evt.which == 32 && evt.ctrlKey) {
                $(".message.pending:first a:contains(retry)").click();
                $("#input").val("");
            }
        });

        // show the message ids on each 
        $(".message:not(.pending):not(.posted)").livequery(function () {
            var id = this.id.replace("message-", "");
            //$(this).before("<div class='timestamp'>" + id + "</div>");

            if (!$(this).siblings('#id-' + id).length) {
                $('<div />').insertBefore(this)
		        .text(id)
		        .addClass('timestamp')
		        .attr('id', 'id-' + id);
            }
        });

        // handle commands
        var input = $("#input");
        input.keydown(function (evt) {
            if (evt.which == 13 && input.val().substring(0, 1) == "/") {
                var args = input.val().split(" ");
                var cmd = args[0].substring(1);
                args = Array.prototype.slice.call(args, 1);
                var returnVal = false;
                returnVal = execute(cmd, args);
                if (returnVal == CommandState.SucceededDoClear) {
                    input.val("");
                }
                if (returnVal != CommandState.NotFound) {
                    evt.preventDefault();
                    evt.stopImmediatePropagation();
                    evt.stopPropagation();
                    evt.cancelBubble = true;
                    return false;
                }
            }
        });

        var e = input.data("events").keydown; e.unshift(e.pop());

        // Persistant highlighting Restoration
        var oldHighlights = Storage.retrieveAll();

        for (var i = 0; i < oldHighlights.length; i++) {
            commands.addhl(oldHighlights[i]);
        }

        // Style insertion, a la GM_addStyle, but using jQuery CSS syntax
        (function (style_obj) {
            var styleText = '';

            for (var i in style_obj) {
                styleText = styleText + i + '{';
                for (var p in style_obj[i]) {
                    styleText = styleText + p + ':' + style_obj[i][p] + ';';
                }
                styleText = styleText + '}';
                $('<style />').text(styleText).appendTo('head');
            }
        })( // Ugly brackets!
        {
        '.gm_room_list': {
            'list-style': 'none',
            'text-align': 'left',
            'font-size': '11px',
            'column-count': '3',
            '-moz-column-count': '3',
            '-webkit-column-count': '3'
        },
        '.gm_room_list li a': {
            'display': 'block',
            'padding': '2px 8px'
        },
        '.gm_room_list li a:hover': {
            'background-color': '#eee'
        }
    });

});
});