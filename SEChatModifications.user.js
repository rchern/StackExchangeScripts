// ==UserScript==
// @name         SE Chat Modifications
// @description  A collection of modifications for SE chat rooms
// @include      http://chat.meta.stackoverflow.com/rooms/*
// @include      http://chat.stackexchange.com/rooms/*
// @include      http://chat.stackoverflow.com/rooms/*
// @include      http://chat.askubuntu.com/rooms/*
// @author       @rchern
// ==/UserScript==

/*
 * Injects functions into the page so they can freely interact with existing code
 */
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

// Inject the support plugins, followed by the main userscript function
inject(livequery, bindas, expressions, function ($) {
    // Setup the selector shortcuts
    var Selectors = {
        'getMessage': function getMessage(id) {
            if (id)
                validate('number');

            return id ? '#message-' + id : '.user-container.mine:last .message:last';
        },
        'getSignature': function getSignature(match) {
            validate('string');

            return ".signature:contains('" + match + "') ~ .messages";
        },
        'getRoom': function getRoom(match) {
            validate('string');

            return "#my-rooms > li > a[href^='/rooms']:contains('" + match + "')";
        }
    };

    // Setup the highlight and clipping objects
    var Highlights = new Storage(),
        Clippings = new Storage('chatClips');

    // The list of command states that can be returned from a command function, or one of the command utility functions
    var CommandState = {
        // The command wasn't found
        'NotFound': -1,
        // The command failed validation or couldn't execute properly
        'Failed': 0,
        // The command succeeded, and the input should be cleared (where applicable)
        'SucceedDoClear': 1,
        // The command succeeded, and the input should not be cleared (where applicable)
        'SucceedNoClear': 2
    };

    // Setup the command and onebox mappings
    var Commands = {}, Oneboxes = {};

    // Create the navigation
    var Navigation = new Navigation();

    // Setup the main chat extension function, responsible for handling command processing (client-exposed)
    var ChatExtension = window.ChatExtension = new function () {
        /*
         * Defines new chat extension commands, allowing outside functions to plug into the existing userscript infrastructure
         */
        this.define = function (name, fn, help) {
            name = name.toLowerCase();
            
            if (typeof fn !== 'function')
                throw new Error("The function assigned to " + name + " is not a function");

            if (Commands[name])
                throw new Error("The command " + name + " is already defined");
                
            if (help && typeof help === 'string')
                fn.helptext = help;

            Commands[name] = fn;
        };

        /*
         * Associates domains with functions that produce pseudo-oneboxes
         */
        this.associate = function (domain, fn) {
            if (typeof domain === 'string') {
                var assignment = domain.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+).*/i);

                if (!assignment)
                    throw new Error("The domain " + domain + " does not look valid");

                domain = assignment[1].toLowerCase();

                if (Oneboxes[domain])
                    throw new Error("The domain " + domain + " is already onebox-associated");

                Oneboxes[domain] = fn;
            } else if (domain instanceof RegExp) {
                if (!Oneboxes['_regex'])
                    Oneboxes['_regex'] = [];

                Oneboxes['_regex'].push({
                    'pattern': domain,
                    'handler': fn
                });
            } else {
                throw new Error("The provided domain is not an acceptable type");
            }
        }

        /*
         * Executes commands and automatically displays errors in the case of failed function validation
         */
        this.execute = function (name, args) {
            var result = CommandState.NotFound;

            // Check if the command is defined
            if (Commands[name]) {
                try {
                    // Attempt to run the command and get the result
                    result = Commands[name].apply(this, args);
                } catch (ex) {
                    if (ex.message)
                        ChatExtension.notify(ex.message);

                    result = CommandState.Failed;
                }
            }

            return result;
        };

        /*
         * Displays a (usually error) notification dialog to the user for the specified period of time, or until a keyboard or mouse press event occurs
         */
        this.notify = function (message, delay) {
            if (!delay)
                delay = 3000;

            $('#inputerror').html(message)
                .clearQueue()
                .fadeIn("slow")
                .delay(delay)
                .fadeOut("slow")
                .hover(
                    function () {
                        $(this).clearQueue();
                    },
                    function () {
                        $(this).delay(delay).fadeOut("slow");
                    }
                )
                .css({
                    'max-height': ($(window).height() - 90) + 'px',
                    'max-width': '60%'
                });
        };

        /*
         * Adds styles to the userscript's <style> element, to simplify writing CSS styles for script-injected content
         */
        this.style = function (styleObject) {
            var userStyle = $('style#user-style'),
                styleText = userStyle.length ? userStyle.text() : '';

            for (var selector in styleObject) {
                styleText = styleText + selector + '{';

                for (var style in styleObject[selector]) {
                    styleText = styleText + style + ':' + styleObject[selector][style] + ';';
                }

                styleText = styleText + '}';
            }

            if (!userStyle.length)
                userStyle = $('<style id="user-style" />').appendTo('head');

            userStyle.text(styleText);
        };

        this.bind = Navigation.bind;
        this.validate = validate;
        this.Selectors = Selectors;
        this.CommandState = CommandState;
    };
    
    function reply(id) {
        $('#input').val(':' + id + ' ' + $('#input').val().replace(/^:\d+\s*/, ''));
    }

    // Define the on ready activities
    $(function () {
        var input = $('#input'),
            page = $(document),
            stars = $('#starred-posts');

        // Add a handler for Ctrl + Space message resubmission
        page.bindAs(0, 'keydown', function (event) {
            if (event.which == 32 && isCtrl(event)) {
                // Store the value, since the next step removes it
                var value = input.val();

                $('.message.pending:first a:contains(retry)').click();

                input.val(value);

                return false;
            }
        });

        // Add a handler to remove the overlay
        //*
        page.bindAs(0, 'click keydown', function (event) {
            var error = $('#inputerror');

            if (event.target != error[0]) {
                error.stop(true, true).fadeOut('slow');
            }
        });
        //*/

        // Add a handler for /commands
        input.bindAs(0, 'keydown', function (event) {
            var value = input.val();

            if (event.which == 13 && value.substring(0, 1) == '/') {
                if (value.substring(1, 2) == '/') {
                    input.val(value.substring(1));
                } else {
                    var args = value.replace(/\s+$/, '').split(' '),
                        command = args[0].substring(1),
                        result;

                    args = Array.prototype.slice.call(args, 1);
                    result = ChatExtension.execute(command, args);

                    if (result == CommandState.SucceededDoClear)
                        input.val('');
                    else if (result == CommandState.NotFound)
                        ChatExtension.notify($(getCommands()).before($('<span />').text("Unknown command, try again, or use // to escape commands")));

                    event.preventDefault();
                    event.stopImmediatePropagation();

                    return false;
                }
            }
        });

        // Add keyboard navigation handlers
        input.bindAs(0, 'keydown', Navigation.launch);
        input.bindAs(0, 'focus', Navigation.deselect);
        page.bindAs(0, 'click', Navigation.deselect);
        page.bindAs(0, 'keydown', Navigation.navigate);
        page.bindAs(0, 'keypress', Navigation.suppress);
        $('#chat .message').livequery(Navigation.update);
        
        // Add handler for stars list
        stars.ajaxComplete(function (event, xhr, settings) {
            if (settings.url.search(/^\/chats\/stars\/\d+/) !== 0) {
                return;
            }
            
            $(this).find('li').each(function () {
                var id = this.id.replace(/^summary_/, '');
                
                $('<span title="reply to this message" class="quick-unstar newreply" />').appendTo(this).click(function (event) {
                    input.focus();
                    reply(id);
                    event.stopImmediatePropagation();
                });
            });
        });
        
        // Defer getting the background image until it's available
        ChatExtension.style({
            '#starred-posts .newreply' : {
                'background-image': $('<span class="newreply">').hide()
                    .appendTo(document.body)
                    .wrap('<div class="message">')
                    .css('background-image')
            }
        });

        // Add a handler to update clips across tabs
        $(window).bindAs(0, 'focus', function (event) {
            Clippings.update();
        });

        // Highlight persisted highlight items
        for (var i = 0; i < Highlights.items.length; ++i) {
            addHighlight(Highlights.items[i]);
        }

        // Add default Vimeo onebox support
        ChatExtension.associate('vimeo.com', function (domain, path) {
            var id = path.match(/^\/([0-9]+)/) || path.match(/\/channels\/[\d\w]+#([0-9]+)/) || path.match(/\/groups\/[\d\w]+\/videos\/([0-9]+)/);

            if (!id || !id[1])
                throw new Error("The Vimeo URL " + path + " is unsupported");

            id = id[1];

            $.ajax({
                url: 'http://vimeo.com/api/v2/video/' + id + '.json',
                dataType: 'jsonp',
                success: function (data) {
                    // Drop in small preview frame
                    $('#input').val(data[0].thumbnail_large);
                    $('#sayit-button').click();

                    // Wait a bit before dropping in the video title
                    (function (title, url, name) {
                        setTimeout(function () {
                            $('#input').val('[▶ Watch **' + title + '** by ' + name + ' on Vimeo](' + url + ')');
                            $('#sayit-button').click();
                        }, 1100);
                    })(data[0].title, data[0].url, data[0].user_name);
                }
            });
        });

        // Show the message ID and timestamp on each message
        $("#chat .message:not(.pending):not(.posted)").livequery(function () {
            var id = this.id.replace("message-", ""), self = $(this);

            if (!self.siblings('#id-' + id).length) {
                var timestamp = new Date(self.data('info').time * 1000);
                timestamp = "" + timestamp.getHours() + ":" + (timestamp.getMinutes() < 10 ? "0" + timestamp.getMinutes() : timestamp.getMinutes()) + ":" + (timestamp.getSeconds() < 10 ? "0" + timestamp.getSeconds() : timestamp.getSeconds());
                self.prev(".timestamp").remove();
                self.prepend($('<div />')
                    .text(id + ' ' + timestamp)
                    .addClass('timestamp')
                    .css('line-height', '1.4em')
                    .attr('id', 'id-' + id));
            }
        });

        // Inject clipboard button and clipboard message link
        $('<button class="button" />')
            .text('clipboard')
            .appendTo('#chat-buttons')
            .click(function () {
                ChatExtension.execute('clips', []);

                return false;
            });

        $('#chat .message').livequery(function () {
            var self = this;

            $('<span class="action_clip" />')
                .prependTo($(this).find('.meta'))
                .attr('title', "Add this message to my clipboard")
                .click(function () {
                    ChatExtension.execute('jot', [self.id.substring(8)]);
                });
        });
        
        // Hijack image uploader so we can preserve a leading :id
        Object.defineProperty(window, 'closeDialog', (function () {
            var original;
            
            function transform(url) {
                if (!original) {
                    return;
                }
                
                if (!url) {
                    return original();
                }
                
                var text = input.val();
                
                if ((text = /^(:\d+)\s*$/.exec(text)) && !/^:\d+\s*/.test(url)) {
                    url = text[1] + ' ' + url;
                }
                
                original(url);
            }
            
            return {
                set: function (value) {
                    original = value;
                },
                get: function () {
                    return transform;
                }
            }
        })());
    });

    // Define the snippet list command
    ChatExtension.define('clips', function () {
        validate(0);

        var delay = 7.5E3, ol;

        if (Clippings.items.length) {
            ol = $('<ol class="clips_list" />');

            for (var i = 0; i < Clippings.items.length; ++i) {
                ol.append(createClipItem(i, Clippings.items[i].room, Clippings.items[i].display, true));
            }
        } else {
            ol = $('<span />').text("You do not have any saved clips");
            delay = 3E3;
        }

        ChatExtension.notify(ol, delay);

        return CommandState.SucceededDoClear;
    });

    // Define the delete command
    ChatExtension.define('del', function (id) {
        if (id)
            validate('number');

        id = Selectors.getMessage(id) + ' .action-link';

        if (!$(id).click().closest('.message').find('.delete').eq(0).click().length)
            throw new Error("Unable to delete message");

        return CommandState.SucceededNoClear;
    });

    // Define the edit command
    ChatExtension.define('edit', function (id) {
        if (id)
            validate('number');

        id = Selectors.getMessage(id) + ' .action-link';

        if (!$(id).click().closest('.message').find('.edit').eq(0).click().length)
            throw new Error("Unable to edit message");

        return CommandState.SucceededNoClear;
    });

    // Define the message flag command
    ChatExtension.define('flag', function (id) {
        validate('number');

        $(Selectors.getMessage(id) + ' .flags .img').eq(0).click();

        return CommandState.SucceedDoClear;
    });

    // Define the help command
    ChatExtension.define('help', function (command) {
        if (!command) {
            ChatExtension.notify($('<span />').text('List of recognized commands:').add(getCommands()), 7.5E3);
            
            return;
        }
        
        command = command.toLowerCase();
        
        if (!Commands[command])
            throw new Error("Unable to get help for unkown command " + command);
            
        if (!Commands[command].helptext)
            throw new Error("No additional help for the command " + command);
            
        ChatExtension.notify(Commands[command].helptext);
    });

    // Define the message history command
    ChatExtension.define('history', function (id) {
        validate('number');

        $('<div class="gm_room_list" />').load('/messages/' + id + '/history #content', function () {
            ChatExtension.notify(this, 7.5E3);
        });

        return CommandState.SucceededDoClear;
    });

    // Define the highlight display command
    ChatExtension.define('hl', function (match) {
        if (typeof match == 'undefined') {  //no parameters = show list
            var ul = $('<ul />').addClass('gm_room_list');

            if (Highlights.items.length > 0) {
                for (var i = 0; i < Highlights.items.length; i++) {
                    (function (current) {
                        $('<a />').click(function () {
                                $('#input').val('/hl ' + current).focus();
                                return false;
                            })
                            .attr('href', '#')
                            .text(current)
                            .wrap('<li />')
                            .parent()
                            .appendTo(ul);
                    })(Highlights.items[i]);
                }
            } else {
                ul = $('<p />').text('Currently there are no highlighted users or messages');
            }

            ChatExtension.notify(ul, 7.5E3);
        } else { //if already in list, remove - else add
            match = $.makeArray(arguments).join(' ');

            if ($.inArray(match, Highlights.items) >= 0) {
                Highlights.remove(match);
                removeHighlight(match);
            } else {
                Highlights.add(match);
                addHighlight(match);
            }
        }

        return CommandState.SucceededDoClear;
    });

    // Define the jump command
    ChatExtension.define('jump', function (id) {
        validate('number');

        var message = $(Selectors.getMessage(id));

        if (message.length) {
            Navigation.deselect();
            Navigation.select(message);

            $(document).scrollTop(message.offset().top - 5);
        } else {
            window.open('http://' + window.location.host + '/transcript/message/' + id + '#' + id);
        }

        return CommandState.SucceededDoClear;
    });

    // Define the snippet jotting command
    ChatExtension.define('jot', function () {
        var first = arguments[0],
            second = arguments[1],
            room = $('#roomname').text(),
            insert, display;

        if (isNumber(first) && second === '|') {
            insert = 'http://' + window.location.host + '/transcript/message/' + first;
            display = $.makeArray(arguments).slice(2).join(' ');
        } else if (isNumber(first)) {
            validate('number');

            insert = 'http://' + window.location.host + '/transcript/message/' + first;
            var content = $(Selectors.getMessage(first));

            if (content.length !== 1)
                throw new Error("The message you're trying to jot down cannot be found");

            display = content.find('.content').html();
        } else {
            display = insert = $.makeArray(arguments).join(' ');

            if (insert === '')
                throw new Error("You have not entered anything to be jotted down");
        }

        Clippings.add({
            'display': display,
            'insert': insert,
            'room': room
        });

        ChatExtension.notify($('<ul class="clips_list" />').append(createClipItem(Clippings.items.length - 1, room, display, false)), 7.5E3);

        return CommandState.SucceededDoClear;
    });

    // Define the show last message command
    ChatExtension.define('last', function (match) {
        match = $.makeArray(arguments).join(' ');
        match = $(Selectors.getSignature(match)).last();

        if (!match.length)
            throw new Error("Last message cannot be found. Try /load more messages.", 2000);

        match.addClass('highlight');

        window.setTimeout(function () {
            match.removeClass('highlight');
        }, 2000);

        $.scrollTo(match, 200);

        return CommandState.SucceededDoClear;
    });

    // Define the leave room command
    ChatExtension.define('leave', function (match) {
        $('#input').val('');

        // Determine which room to leave
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
    });

    // Define the room list command
    ChatExtension.define('list', function (match) {
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

                        if (i >= pageCount)
                            ChatExtension.notify(ul, 7.5E3);
                    });
                }
            } else {
                ChatExtension.notify(ul, 7.5E3);
            }
        });

        return CommandState.SucceededDoClear;
    });

    // Define the load older messages command
    ChatExtension.define('load', function () {
        validate(0);

        var message = $('.message')[0];

        $('#getmore').data('events').click[0].handler(function() {
            $(document).scrollTo(message, 400);
        });

        return CommandState.SucceededDoClear;
    });

    // Define the /me command
    ChatExtension.define('me', function () {
        // Don't validate anything, just send the formatted output
        $('#input').val('*' + $.trim($.makeArray(arguments).join(' ') + '*'));
        $('#sayit-button').click();

        return CommandState.SucceededDoClear;
    });

    // Define the pseudo-onebox command
    ChatExtension.define('ob', function (url) {
        validate('string');

        url = url.match(/^(?:https?:\/\/)?((?:www\.)?([^\/]+))(.*)/i);

        if (!url)
            throw new Error("Invalid URL " + url);

        var handler;

        if (!(handler = Oneboxes[url[2]])) {
            if (Oneboxes['_regex']) {
                for (var i = 0; i < Oneboxes['_regex'].length && !handler; ++i) {
                    if (Oneboxes['_regex'][i].pattern.test(url[1] + url[3]))
                        handler = Oneboxes['_regex'][i].handler;
                }
            }

            if (!handler)
                throw new Error("The domain " + url[2] + " does not have associated onebox support");
        }

        handler(url[1], url[3]);

        return CommandState.SucceededDoClear;
    });

    // Define the snippet paste command
    ChatExtension.define('paste', function (id) {
        validate('number');

        $('#input').val(Clippings.items[id].insert);
        $('#sayit-button').click();

        return CommandState.SucceededDoClear;
    });

    // Define the user profile command
    ChatExtension.define('profile', function () {
        match = $.makeArray(arguments).slice(1).join(" ");
        var url = matchSite(arguments[0], 'api.') + '/1.0/users/',
            currentSite = matchSite(arguments[0]);

        $.ajax({
            'url': url,
            dataType: 'jsonp',
            jsonp: 'jsonp',
            data: {
                filter: match,
                pagesize: 50
            },
            cache: true,
            success: function (data) {
                var response = '';

                function buildOb(data) {
                    var ob = $('<div />').css({
                        textAlign: 'left',
                        padding: '10px 20px 20px',
                        overflow: 'hidden'
                    }),
                        userInfo = $('<div />').css('float', 'left').appendTo(ob),
                        title = $('<div />').text(', ' + data.location).appendTo(userInfo),
                        stat = $('<div />').appendTo(userInfo),
                        name = data.display_name + (data.user_type === 'moderator' ? ' â™¦' : '');

                    $('<a />').attr('href', currentSite + '/users/' + data.user_id)
                        .addClass('ob-user-username')
                        .text(name)
                        .prependTo(title);

                    // repNumber: Chat function for displaying rep - adds in k for 10k+ reps
                    $('<span />').addClass('reputation-score').text(repNumber(data.reputation)).appendTo(stat);

                    $('<img />').css({
                        float: 'left',
                        marginRight: 10
                    }).attr({
                        src: 'http://www.gravatar.com/avatar/' + data.email_hash + '?s=64&d=identicon',
                        alt: ''
                    }).prependTo(ob);

                    $.ajax({
                        'url': url + data.user_id + '/tags',
                        dataType: 'jsonp',
                        jsonp: 'jsonp',
                        data: {
                            pagesize: 8
                        },
                        cache: true,
                        success: function (data) {
                            var wrapper = $('<div />').appendTo(userInfo).css('margin-top', 4);
                            for (var i = 0; i < data.tags.length; i++) {
                                var outer = $('<a />')
                                    .attr('href', currentSite + '/tagged/' + data.tags[i].name)
                                    .appendTo(wrapper).css('text-decoration', 'none');

                                $('<span />')
                                    .addClass('ob-user-tag')
                                    .text(data.tags[i].name)
                                    .appendTo(outer)
                                    .css({
                                        borderStyle: 'solid',
                                        marginRight: 5
                                    });
                            }
                        }
                    });

                    var badgeN = 1;
                    for (var i in data.badge_counts) {
                        $('<span />').addClass('badge' + badgeN++).appendTo(stat);
                        $('<span />').addClass('badgecount').text(data.badge_counts[i]).appendTo(stat);
                    }

                    return ob;
                }

                if (data.total === 0) {
                    response = $('<p />').text('There are no user that match your search');
                } else if (data.total === 1) {
                    $('#input').val(currentSite + '/users/' + data.users[0].user_id);
                    response = buildOb(data.users[0]);
                } else {
                    response = $('<ul />').addClass('gm_room_list profile');

                    for (var i = 0; i < data.users.length; i++) {
                        (function (current) {
                            var anchor = $('<a />').click(function () {
                                $('#input').val(currentSite + '/users/' + current.user_id);
                                ChatExtension.notify(buildOb(current), 7.5E3);
                                return false;
                            }).attr('href', '#')
                                .text(' ' + current.reputation)
                                .wrap('<li />');

                            $('<strong />').text(current.display_name + (current.user_type === 'moderator' ? ' â™¦' : '')).prependTo(anchor);

                            $('<img />').attr({
                                src: 'http://www.gravatar.com/avatar/' + current.email_hash + '?s=14&d=identicon',
                                alt: ''
                            }).prependTo(anchor);

                            anchor.parent().appendTo(response);
                        })(data.users[i]);
                    }

                    if (data.total > 50) {
                        $('<li />').append($('<h3 />').text('Your query returned too many results. Currently showing the top 50 sorted by reputation')).prependTo(response);
                    }
                }

                ChatExtension.notify(response, 7.5E3);
            }
        });

        return CommandState.SucceededDoClear;
    });

    // Define the message quote command
    ChatExtension.define('quote', function (id) {
        validate('number');

        $('#input').val('http://' + window.location.host + '/transcript/message/' + id + '#' + id);
        $('#sayit-button').click();
    });

    // Define the snippet remove command
    ChatExtension.define('rmclip', function (id) {
        validate('number');

        Clippings.remove(Clippings.items[id]);

        return CommandState.SucceededDoClear;
    });

    // Define the message star command
    ChatExtension.define('star', function (id) {
        validate('number');

        $(Selectors.getMessage(id) + ' .stars .img').eq(0).click();

        return CommandState.SucceededDoClear;
    });

    // Define the room switch command
    ChatExtension.define('switch', function (match) {
        validate('string');

        var rooms = $(Selectors.getRoom(match));

        if (rooms.length !== 1) {
            throw new Error("Unable to find a single match");
        }

        window.location = rooms.attr('href');
    });

    // Define the transcript view command
    ChatExtension.define('transcript', function (match) {
        var href = '';

        if (!match) {
            href = $("a.button[href^='/transcript']").attr('href');
        } else {
            var search = $('#searchbox'),
                form = search.parent();

            href = form.attr('action') + '?room=' + $("input[name='room']", form).val() + '&' + search.attr('name') + '=' + escape(match);
        }

        window.open(href);

        return CommandState.SucceededDoClear;
    });

    // Define the update command
    ChatExtension.define('update', function () {
        validate(0);

        try {
            window.location = 'http://github.com/rchern/StackExchangeScripts/raw/master/SEChatModifications.user.js';
        } catch (ex) {}

        return CommandState.SucceededDoClear;
    });

    /*
     * Defines the storage wrapper
     */
    function Storage(name) {
        this.storageName = name || window.location.pathname + 'chatHighlights';
        this.items = [];

        /*
         * Adds an item to this local storage collection
         */
        this.add = function (match) {
            if ($.inArray(match, this.items) == -1) {
                this.items.push(match);
                this.store();
            }
        };

        /*
         * Removes an item from this local storage collection
         */
        this.remove = function (match) {
            var index = $.inArray(match, this.items);
            if (index > -1) {
                this.items.splice(index, 1);
                this.store();
            }
        };

        /*
         * Updates the item list of this local storage collection
         */
        this.update = function () {
            if (localStorage[this.storageName] != null)
                this.items = JSON.parse(localStorage[this.storageName]);
        };

        this.update();

        this.store = function () {
            localStorage[this.storageName] = JSON.stringify(this.items);
        }
    }

    /*
     * Defines the keyboard navigation functionality
     */
    function Navigation() {
        var active = false,
            actions = {
                '37': {
                    'command': 'peek',
                    'jump': false
                },
                '39': {
                    'command': function (target) {
                        return target.closest('.monologue').hasClass('mine') ? 'edit' : 'reply';
                    }
                },
                '67': {
                    'command': 'jot'
                },
                '68': {
                    'command': 'del',
                },
                '69': {
                    'command': 'edit'
                },
                '70': {
                    'command': 'flag',
                },
                '72': {
                    'command': 'history',
                    'jump': false
                },
                '74': {
                    'command': 'jump',
                    'jump': false
                },
                '80': {
                    'command': 'peek',
                    'jump': false
                },
                '81': {
                    'command': 'quote'
                },
                '82': {
                    'command': 'reply'
                },
                '83': {
                    'command': 'star',
                }
            };

        /*
         * Binds new keyboard navigation message commands
         */
        this.bind = function (key, command, jump) {
            if (actions[key])
                throw new Error("The key " + key + " is already mapped");

            if (typeof(command) !== 'string' && typeof(command) !== 'function')
                throw new Error("The command must be a command name (string) or function");

            actions[key] = {
                'command': command,
                'jump': !!jump
            };
        };

        /*
         * Selects the specified message, turning on keyboard navigation in the process
         */
        this.select = selectMessage;

        // TS: We can't call this function "select", because Chrome undefines the reference in navigate() for some reason
        function selectMessage(message) {
            message = $(message);

            if (message.length) {
                active = true;

                return message.eq(0).addClass('easy-navigation-selected');
            }

            return null;
        }

        /*
         * Deselects any selected messages, hides the current message peek if present, and disables keyboard navigation
         */
        this.deselect = deselect;

        function deselect() {
            active = false;

            unpeek();
            $('#chat .easy-navigation-selected').removeClass('easy-navigation-selected');
        }

        /*
         * Launches the keyboard navigation
         */
        this.launch = function (event) {
            if (isCtrl(event) && event.which == 38) {
                this.blur();

                active = true;

                $(document).trigger(event);

                event.preventDefault();
                event.stopImmediatePropagation();

                return false;
            }
        };

        /*
         * Performs the bulk of the keyboard navigation work
         */
        this.navigate = function (event, n) {
            if (event.which == 17)
                return true;
        
            unpeek();

            if (isCtrl(event) && event.which == 40) {
                $(document).scrollTop($(document).height());
                $('#input').focus();

                return false;
            }

            if (!active)
                return true;

            if (n === 0)
                return false;

            var selected = $('#chat .easy-navigation-selected'),
                up = event.which == 33 || event.which == 38,
                down = event.which == 34 || event.which == 40;

            if (up || down) {
                if (!selected.length) {
                    selected = selectMessage('#chat .message:last');
                } else {
                    var action = up ? 'prev' : 'next',
                        select = up ? 'last' : 'first',
                        sibling = selected[action + 'All']('.message:first');

                    if (!sibling.length)
                        sibling = selected.closest('.monologue')[action + 'All']('.monologue:first').find('.message:' + select);

                    if (sibling.length) {
                        selected.removeClass('easy-navigation-selected');
                        selected = selectMessage(sibling);
                    }
                }

                var monologue = selected.closest('.monologue'),
                    messageTop = selected.offset().top,
                    messageHeight = selected.outerHeight(true),
                    messageBottom = messageTop + messageHeight,
                    monologueTop = monologue.offset().top,
                    monologueHeight = monologue.outerHeight(true),
                    monologueBottom = monologueTop + monologueHeight,
                    windowPosition = $(document).scrollTop(),
                    windowHeight = $(window).height() - $('#input-area').outerHeight(true),
                    newPosition = windowPosition;

                if (monologueHeight > windowHeight) {
                    newPosition = up ? messageBottom - windowHeight : messageTop;
                } else if (up && monologueTop < windowPosition || down && monologueBottom > windowPosition + windowHeight) {
                    newPosition = up ? monologueTop : monologueBottom - windowHeight;
                }

                if (newPosition != windowPosition) {
                    if (selected[0] == $('#chat .message:last')[0]) {
                        newPosition = $(document).height();
                    }

                    $(document).scrollTop(newPosition);
                }

                // Allow using Page Up / Page Down to skip five messages at a time
                if ((event.which == 33 || event.which == 34) && !n)
                    n = 5;

                if (n)
                    arguments.callee(event, n - 1);

                return false;
            } else {
                var action = handles(event),
                    message = selected[0].id.replace("message-", ""),
                    parent = selected.data('info').parent_id,
                    replied,
                    command = action ? action.command : null;

                if (command && !selected.find('.content > .deleted').length) {
                    if (typeof command === 'function')
                        command = command(selected);

                    if (typeof action.jump === 'undefined' || action.jump)
                        $('#input').focus();

                    if (command == 'reply') {
                        reply(message);
                    } else if (command == 'peek') {
                        if (parent) {
                            if ((replied = $('#message-' + parent + ' > .content')).length) {
                                peek(message, parent, replied.html());
                            } else {
                                $.get('/message/' + parent, function (text) {
                                    peek(message, parent, text);
                                }, 'text');
                            }
                        }
                    } else if (command == 'flag') {
                        // Require double-confirmation in a roundabout way...
                        $('#input').val("/flag " + message);
                    } else {
                        ChatExtension.execute(command, [command == 'jump' ? parent : message]);
                    }

                    return false;
                } else if (command) {
                    ChatExtension.notify('Cannot perform actions on a deleted message...', 2000);
                }
            }
        };

        /*
         * Previews a message above the currently selected message
         */
        this.peek = peek;

        function peek(reply, parent, text) {
            if ((reply = $('#message-' + reply + '.easy-navigation-selected')).length) {
                $('<div class="easy-navigation-peekable"></div>')
                    .append('<div class="easy-navigation-peeked-message"><span class="easy-navigation-subtle">Referenced message<span class="reference-id">#' + parent + '</span></span>' + text + '</div>')
                    .css({
                        'left': reply.offset().left + 'px',
                        'width': reply.outerWidth() + 'px',
                        'opacity': '0.8'
                    })
                    .data('reply', reply.attr('id'))
                    .appendTo(document.body);

                update();
            }
        }

        /*
         * Hides the message preview, if present
         */
        this.unpeek = unpeek;

        function unpeek() {
            $('.easy-navigation-peekable').remove();
        }

        /*
         * Suppresses events that the keyboard navigation will handle
         */
        this.suppress = function (event) {
            if (active && (handles((event.which < 123 && event.which > 96 ? event.which - 32 : event.which)) || 
                    event.which == 33 || event.which == 38 || event.which == 34 || event.which == 40)) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }
        }

        /*
         * Updates the position of the preview box, necessary when content is added / removed from the page
         */
        this.update = update;

        function update() {
            var peekable = $('body > .easy-navigation-peekable'),
                reply,
                scrollTopOffset = $(document).scrollTop(),
                peekableTopOffset;

            if (peekable.length && (reply = $('#' + peekable.data('reply') + '.easy-navigation-selected')).length) {
                peekableTopOffset = reply.offset().top - peekable.outerHeight(true) - 3;

                peekable.css({
                    'top': peekableTopOffset + 'px'
                });

                if (peekableTopOffset < scrollTopOffset) {
                    $(document).scrollTo(peekable);
                }
            }
        }

        /*
         * Returns the action object associated with this event, if any
         */
        function handles(key) {
            if (key && !isNumber(key))
                key = key.which;

            return key ? actions[key] : null;
        }
    }

    /*
     * Validates the arguments passed to the calling method based on the passed parameters
     */
    function validate(length, types) {
        if (arguments.length == 1 && typeof(length) === 'string')
            length = (types = [length]).length;

        if (!length)
            length = 0;

        var args = validate.caller.arguments;

        // Verify that there are the expected number of arguments
        if (length !== args.length)
            throw new Error("Expected " + length + " args to " + validate.caller.name + " but received " + args.length);

        if (types) {
            // Iterate over the expected types
            for (var i = 0; i < args.length; ++i) {
                var actual = typeof(args[i]);
                var expected = types[i];

                if (expected === 'number' && isNumber(args[i]))
                    actual = 'number';

                if (actual !== expected)
                    throw new Error("Parameter " + i + " should have type " + expected + " but has type " + actual);
            }
        }
    }

    /*
     * Determines if the given argument is numeric
     */
    function isNumber(n) {
        return !isNaN(parseInt(n, 10)) && isFinite(n);
    }

    /*
     * Determines if the ctrl or command key was pressed
     */
    function isCtrl(event) {
        return event && (event.ctrlKey || (!event.altKey && event.metaKey));
    }

    /*
     * Returns an unordered HTML list with the currently available commands
     */
    function getCommands() {
        var ul = $('<ul class="gm_room_list" />'),
            commands = [];

        // Put the command names into an array for sorting
        for (var command in Commands)
            commands.push(command);
        commands.sort();

        // Iterate over the list of commands
        for (var i = 0; i < commands.length; ++i) {
            (function(command) {
                $('<a href="#" />').click(function () {
                        $('#input').val('/' + command).focus();

                        return false;
                    })
                    .text(command)
                    .wrap('<li />')
                    .parent()
                    .appendTo(ul);
            })(commands[i]);
        }

        return ul;
    }

    /*
     * Returns a URL to the given site
     */
    function matchSite(site, prefix) {
        site = site.toLowerCase();

        var result = '', first, rest;

        if (!prefix)
            prefix = '';

        if (site.indexOf('meta') === 0 && site !== 'meta') {
            site = site.substring(4);

            if (site.indexOf('.') === 0)
                site = site.substring(1);

            prefix = prefix + 'meta.';
        }

        first = site.substring(0, 1);
        rest = site.substring(1);

        switch (first) {
            case '8':
                if (rest == 'bitlavapwnpwniebossstagesixforhelp')
                    result = 'gaming.stackexchange.com';
            case 'a':
            case 'u':
                if (rest == 'u' || rest == 'skubuntu' || rest == 'buntu')
                    result = 'askubuntu.com';
                break;
            case 'm':
                if (rest == 'so' || 'eta')
                    result = 'meta.stackoverflow.com';
                break;
            case 'n':
            case 'w':
                if (rest == 'ti' || rest == 'othingtoinstall' || rest == 'a')
                    result = 'webapps.stackexchange.com';
                break;
            case 'o':
                if (rest == 'nstartups')
                    result = 'answers.onstartups.com';
                break;
            case 'p':
                if (rest == 'so' || rest == '.so' || rest == 'rogrammer')
                    result = 'programmers.stackexchange.com';
                break;
            case 's':
                if (rest == 'o' || rest == 'tackoverflow')
                    result = 'stackoverflow.com';
                else if (rest == 'f' || rest == 'erverfault')
                    result = 'serverfault.com';
                else if (rest == 'u' || rest == 'uperuser')
                    result = 'superuser.com';
                else if (rest == 'a' || rest == 'easonedadvice')
                    result = 'cooking.stackexchange.com';
                break;
            case 't':
                if (rest == 'cs' || rest == 'heory')
                    result = 'cstheory.stackexchange.com';
                break;
            default:
                result = site + '.stackexchange.com';
                break;
        }

        return 'http://' + prefix + result;
    }

    /*
     * Gets the appropriate highlight selector based on the argument type
     */
    function getHighlightSelector(match) {
        if (isNumber(match))
            return Selectors.getMessage(match);

        return Selectors.getSignature(match);
    }

    /*
     * Adds highlighting to the matched elements
     */
    function addHighlight(match) {
        $(getHighlightSelector(match)).livequery(function () {
            $(this).addClass('highlight');
        });
    }

    /*
     * Removes highlighting from the match elements
     */
    function removeHighlight(match) {
        $(getHighlightSelector(match)).expire().removeClass('highlight');
    }

    /*
     * Creates a clip item
     */
    function createClipItem(index, room, display, hide) {
        var html = index + '. <em>' + room + '</em>';

        if (!$('<div />').html(display).find('div, p, blockquote').length) {
            html = html + ' | ';
        }

        var li = $('<li />').html(html + display),
            cl_commands = $('<div />').addClass('cl_commands').appendTo(li);

        $('<a />').text('Delete').click(function () {
            li.slideUp(300, function () {
                commands.clips();
            });

            commands.rmclip(index);
            return false;
        }).appendTo(cl_commands);

        $('<a />').text('Paste').click(function () {
            commands.paste(index);
            return false;
        }).appendTo(cl_commands);

        if (hide) {
            if (li.appendTo('body').height() > 60) {
                var h = li.height();

                var a = $('<a />').text('Show').toggle(function () {
                    $(this).text('Hide').parents('li').animate({
                        height: h
                    }, 300);
                }, function () {
                    $(this).text('Show').parents('li').animate({
                        height: 60
                    }, 300);
                }).appendTo(cl_commands);

                li.click(function () {
                    a.click();
                }).height(60);
            }
        }

        return li;
    }

    // Define all of the styles
    // TS: We might want to break this into smaller pieces
    ChatExtension.style({
        '.gm_room_list': {
            'list-style': 'none',
            'text-align': 'left',
            'font-size': '11px',
            'padding': '10px',
            'margin': '0',
            'min-width': '540px'
        },
        '.gm_room_list li': {
            'float': 'left',
            'width': '33%'
        },
        '.gm_room_list li a': {
            'display': 'block',
            'padding': '4px 8px'
        },
        '#input-area #inputerror a': {
            'color': $('#about-room').css('color')
        },
        '.gm_room_list li a:hover': {
            'background-color': '#eee',
            'text-decoration': 'none'
        },
        '.gm_room_list.profile li img': {
            'margin-right': '4px'
        },
        '.clips_list': {
            'list-style': 'none',
            'text-align': 'left',
            'font-size': '11px',
            'padding': '8px 14px',
            'margin': '0'
        },
        '.clips_list li': {
            'padding': '8px 20px',
            'border-bottom': '1px dashed #999',
            'cursor': 'pointer',
            'overflow': 'hidden',
            'position': 'relative'
        },
        '.clips_list li:hover': {
            'background-color': '#efefef'
        },
        '.clips_list li div.cl_commands': {
            'position': 'absolute',
            'top': '5px',
            'right': '5px',
            'display': 'none',
            'border': '1px solid #ccc'
        },
        '.clips_list li:hover div.cl_commands': {
            'display': 'block'
        },
        '.clips_list li div.cl_commands a': {
            'display': 'inline-block',
            'padding': '2px 4px 3px',
            'background-color': '#efefef'
        },
        'span.action_clip': {
            'display': 'inline-block',
            'height': '11px',
            'width': '12px',
            'margin-right': '3px',
            'padding': '0',
            'background': '1px 0px url("http://or.sstatic.net/chat/img/leave-and-switch-icons.png") no-repeat',
            'cursor': 'pointer'
        },
        '.monologue .message:hover .timestamp' : {
            'visibility': 'hidden'
        },
        '#chat-body .monologue.mine .message:hover .meta': {
            'display': 'inline-block !important'
        },
        '#chat-body .monologue.mine .message .meta .vote-count-container': {
            'display': 'none !important'
        },
        '#chat-body .monologue.mine .message .meta .action_clip': {
            'margin-right': '0px;'
        },
        '.easy-navigation-selected': {
            '-moz-border-radius': '4px 4px 4px 4px',
            'background-color': '#D2F7D0',
            'border-radius': '4px 4px 4px 4px',
            'margin-left': '5px',
            'padding-left': '15px !important'
        },
        '.easy-navigation-peekable': {
            '-moz-border-radius': '4px 4px 4px 4px',
            'background-color': '#000000',
            'border-radius': '4px 4px 4px 4px',
            'color': '#F0F0F0',
            'margin-top': '5px',
            'padding-right': '0px !important',
            'position': 'absolute',
            'z-index': '4'
        },
        '.easy-navigation-peekable .onebox': {
            'color': '#000000'
        },
        '.easy-navigation-peeked-message': {
            'line-height': '1.5em',
            'padding': '3px 10px 4px 15px'
        },
        '.easy-navigation-peeked-message .mention': {
            'color': '#000000'
        },
        '.easy-navigation-subtle': {
            'color': '#D2F7D0',
            'display': 'block',
            'font-size': '10px'
        },
        '.easy-navigation-subtle .reference-id': {
            'float': 'right',
            'margin-right': '5px'
        },
        '#starred-posts .newreply' : {
            'display': 'inline-block',
            'background-repeat': 'no-repeat',
            'background-position': '0 -43px',
            'width': '10px',
            'height': '10px',
            'cursor': 'pointer'
        }
    });
});

/*
 * Actas as a container for some additional selector expressions
 */
function expressions($) {
    $.expr[':'].contains = function (a, i, m) {
        return jQuery(a).text().toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
    };

    $.expr[':'].regex = function (elem, index, match) {
        var matchParams = match[3].split(','),
            validLabels = /^(data|css):/,
            attr = {
                method: matchParams[0].match(validLabels) ? matchParams[0].split(':')[0] : 'attr',
                property: matchParams.shift().replace(validLabels, '')
            },
            regexFlags = 'ig',
            regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g, ''), regexFlags);

        return regex.test(jQuery(elem)[attr.method](attr.property));
    };
}

/*
 * Acts as a container for the bindAs implementation
 */
function bindas($) {
    $.fn.extend({
        bindAs: function (nth, type, data, fn) {
            if (type.indexOf(' ') > -1) {
                var s = type.split(' ');

                for (var i = 0; i < s.length; ++i) {
                    this.bindAs(nth, s[i], data, fn);
                }

                return this;
            }

            if ($.isFunction(data) || data === false) {
                fn = data;
                data = undefined;
            }

            if (nth < 0) {
                nth = 0;
            }

            for (var i = 0; i < this.length; ++i) {
                var elem = this[i];

                $.event.add(elem, type, fn, data);

                var events = $(elem).data(elem.nodeType ? 'events' : '__events__');

                if (events && typeof events === 'function') {
                    events = events.events;
                }

                if (events) {
                    var handlers = events[type],
                        offset = 0;
                        
                    if (handlers.delegateCount) {
                        offset = handlers.delegateCount;
                    }

                    if (handlers && handlers.length > offset + nth + 1) {
                        handlers.splice(offset + nth, 0, handlers.splice(handlers.length - 1, 1)[0]);
                    }
                }
            }

            return this;
        }
    });
}

/*
 * Acts a container for the livequery plugin, which is used by this userscript to perform certain functions
 */
function livequery($) {
    /*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
     * Dual licensed under the MIT (MIT_LICENSE.txt)
     * and GPL Version 2 (GPL_LICENSE.txt) licenses.
     *
     * Version: 1.1.1
     * Requires jQuery 1.3+
     * Docs: http://docs.jquery.com/Plugins/livequery
     */

    $.extend($.fn, {
        livequery: function(type, fn, fn2) {
            var self = this, q;

            // Handle different call patterns
            if ($.isFunction(type))
                fn2 = fn, fn = type, type = undefined;

            // See if Live Query already exists
            $.each( $.livequery.queries, function(i, query) {
                if ( self.selector == query.selector && self.context == query.context &&
                    type == query.type && (!fn || fn.$lqguid == query.fn.$lqguid) && (!fn2 || fn2.$lqguid == query.fn2.$lqguid) )
                        // Found the query, exit the each loop
                        return (q = query) && false;
            });

            // Create new Live Query if it wasn't found
            q = q || new $.livequery(this.selector, this.context, type, fn, fn2);

            // Make sure it is running
            q.stopped = false;

            // Run it immediately for the first time
            q.run();

            // Contnue the chain
            return this;
        },

        expire: function(type, fn, fn2) {
            var self = this;

            // Handle different call patterns
            if ($.isFunction(type))
                fn2 = fn, fn = type, type = undefined;

            // Find the Live Query based on arguments and stop it
            $.each( $.livequery.queries, function(i, query) {
                if ( self.selector == query.selector && self.context == query.context &&
                    (!type || type == query.type) && (!fn || fn.$lqguid == query.fn.$lqguid) && (!fn2 || fn2.$lqguid == query.fn2.$lqguid) && !this.stopped )
                        $.livequery.stop(query.id);
            });

            // Continue the chain
            return this;
        }
    });

    $.livequery = function(selector, context, type, fn, fn2) {
        this.selector = selector;
        this.context  = context;
        this.type     = type;
        this.fn       = fn;
        this.fn2      = fn2;
        this.elements = [];
        this.stopped  = false;

        // The id is the index of the Live Query in $.livequery.queries
        this.id = $.livequery.queries.push(this)-1;

        // Mark the functions for matching later on
        fn.$lqguid = fn.$lqguid || $.livequery.guid++;
        if (fn2) fn2.$lqguid = fn2.$lqguid || $.livequery.guid++;

        // Return the Live Query
        return this;
    };

    $.livequery.prototype = {
        stop: function() {
            var query = this;

            if ( this.type )
                // Unbind all bound events
                this.elements.unbind(this.type, this.fn);
            else if (this.fn2)
                // Call the second function for all matched elements
                this.elements.each(function(i, el) {
                    query.fn2.apply(el);
                });

            // Clear out matched elements
            this.elements = [];

            // Stop the Live Query from running until restarted
            this.stopped = true;
        },

        run: function() {
            // Short-circuit if stopped
            if ( this.stopped ) return;
            var query = this;

            var oEls = this.elements,
                els  = $(this.selector, this.context),
                nEls = els.not(oEls);

            // Set elements to the latest set of matched elements
            this.elements = els;

            if (this.type) {
                // Bind events to newly matched elements
                nEls.bind(this.type, this.fn);

                // Unbind events to elements no longer matched
                if (oEls.length > 0)
                    $.each(oEls, function(i, el) {
                        if ( $.inArray(el, els) < 0 )
                            $.event.remove(el, query.type, query.fn);
                    });
            }
            else {
                // Call the first function for newly matched elements
                nEls.each(function() {
                    query.fn.apply(this);
                });

                // Call the second function for elements no longer matched
                if ( this.fn2 && oEls.length > 0 )
                    $.each(oEls, function(i, el) {
                        if ( $.inArray(el, els) < 0 )
                            query.fn2.apply(el);
                    });
            }
        }
    };

    $.extend($.livequery, {
        guid: 0,
        queries: [],
        queue: [],
        running: false,
        timeout: null,

        checkQueue: function() {
            if ( $.livequery.running && $.livequery.queue.length ) {
                var length = $.livequery.queue.length;
                // Run each Live Query currently in the queue
                while ( length-- )
                    $.livequery.queries[ $.livequery.queue.shift() ].run();
            }
        },

        pause: function() {
            // Don't run anymore Live Queries until restarted
            $.livequery.running = false;
        },

        play: function() {
            // Restart Live Queries
            $.livequery.running = true;
            // Request a run of the Live Queries
            $.livequery.run();
        },

        registerPlugin: function() {
            $.each( arguments, function(i,n) {
                // Short-circuit if the method doesn't exist
                if (!$.fn[n]) return;

                // Save a reference to the original method
                var old = $.fn[n];

                // Create a new method
                $.fn[n] = function() {
                    var jQuery = $;
                    // Call the original method
                    var r = old.apply(this, arguments);

                    // Request a run of the Live Queries
                    jQuery.livequery.run();

                    // Return the original methods result
                    return r;
                }
            });
        },

        run: function(id) {
            if (id != undefined) {
                // Put the particular Live Query in the queue if it doesn't already exist
                if ( $.inArray(id, $.livequery.queue) < 0 )
                    $.livequery.queue.push( id );
            }
            else
                // Put each Live Query in the queue if it doesn't already exist
                $.each( $.livequery.queries, function(id) {
                    if ( $.inArray(id, $.livequery.queue) < 0 )
                        $.livequery.queue.push( id );
                });

            // Clear timeout if it already exists
            if ($.livequery.timeout) clearTimeout($.livequery.timeout);
            // Create a timeout to check the queue and actually run the Live Queries
            $.livequery.timeout = setTimeout($.livequery.checkQueue, 20);
        },

        stop: function(id) {
            if (id != undefined)
                // Stop are particular Live Query
                $.livequery.queries[ id ].stop();
            else
                // Stop all Live Queries
                $.each( $.livequery.queries, function(id) {
                    $.livequery.queries[ id ].stop();
                });
        }
    });

    // Register core DOM manipulation methods
    $.livequery.registerPlugin('append', 'prepend', 'after', 'before', 'wrap', 'attr', 'removeAttr', 'addClass', 'removeClass', 'toggleClass', 'empty', 'remove', 'html');

    // Run Live Queries when the Document is ready
    $(function() { $.livequery.play(); });
}
