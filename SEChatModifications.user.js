// ==UserScript==
// @name		  SE Chat Modifications
// @description  A collection of modifications for SE chat rooms
// @include		http://chat.meta.stackoverflow.com/rooms/*
// @include		http://chat.stackexchange.com/rooms/*
// @include		http://chat.stackoverflow.com/rooms/*
// @include		http://chat.superuser.com/rooms/*
// @include		http://chat.serverfault.com/rooms/*
// @include		http://chat.askubuntu.com/rooms/*
// @author		 @rchern
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

	$.fn.extend({
		bindAs: function (nth, type, data, fn) {
			if (typeof type == "object") {
				for (var key in type) {
					this.bindAs(nth, key, data, type[key], fn);
				}
			}

			if (type.indexOf(' ') > -1) {
				var s = type.split(' ');

				for (var i = 0; i < s.length; ++i) {
					this.bindAs(nth, s[i], data, fn);
				}
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

				var elemData = jQuery.data(elem);
				var eventKey = elem.nodeType ? "events" : "__events__";
				var events = elemData[eventKey];

				if (events && typeof events === "function") {
					events = events.events;
				}

				if (events) {
					var handlers = events[type];

					if (handlers && handlers.length > nth + 1) {
						handlers.splice(nth, 0, handlers.splice(handlers.length - 1, 1)[0]);
					}
				}
			}

			return this;
		}
	});

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
			}).css({
				maxHeight: $(window).height() - 90,
				maxWidth: '60%',
				overflowY: 'scroll'
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

	function matchSite(n, prefix) {
		n = n.toLowerCase();
		var retVal;

		if (typeof prefix == 'undefined') { prefix = '' }

		if (n.indexOf('meta') === 0) {
			n = n.substring(4);
			if (n.indexOf('.') === 0) { n = n.substring(1) }

			prefix = prefix + 'meta.';
		};

		switch (n) {
			case 'so':
			case 'stackoverflow':
				retVal = 'stackoverflow.com';
				break;
			case 'mso':
				retVal = 'meta.stackoverflow.com';
				break;
			case 'su':
			case 'superuser':
				retVal = 'superuser.com';
				break;
			case 'sf':
			case 'serverfault':
				retVal = 'serverfault.com';
				break;
			case 'wa':
			case 'nti':
			case 'nothingtoinstall':
				retVal = 'webapps.stackexchange.com';
				break;
			case '8bitlavapwnpwniesbossstagesixforhelp':
				retVal = 'gaming.stackexchange.com';
				break;
			case 'askubuntu':
			case 'ubuntu':
				retVal = 'askubuntu.com';
				break;
			case 'onstartups':
				retVal = 'answers.onstartups.com';
				break;
			case 'seasonedadvice':
			case 'sa':
				retVal = 'cooking.stackexchange.com';
				break;
			default:
				retVal = n + '.stackexchange.com';
				break;
		}

		return 'http://' + prefix + retVal;
	}

	function isNumber(n) {
		return !isNaN(parseInt(n, 10)) && isFinite(n);
	}

	var Navigation = {
		_active: false,

		_actions: {
			'39': function (target) {
				return target.closest('.monologue').hasClass('mine') ? 'edit' : 'reply';
			},
			'68': 'del',
			'69': 'edit',
			'81': 'quote',
			'82': 'reply',
			'83': 'star',
			'ctrl': {
				'39': 'quote'
			}
		},

		launch: function (event) {
			if (event.ctrlKey && event.which == 38) {
				this.blur();

				Navigation._active = true;

				$(document).trigger(event);

				event.preventDefault();
				event.stopImmediatePropagation();

				return false;
			}
		},

		navigate: function (event) {
			if (event.ctrlKey && event.which == 40) {
				$(document).scrollTop($(document).height());
				$('#input').focus();

				return true;
			}

			if (!Navigation._active) {
				return true;
			}

			var selected = $('#chat .easy-navigation-selected');

			if (event.which == 38 || event.which == 40) {
				if (!selected.length) {
					selected = $('#chat .message:last').addClass('easy-navigation-selected');
				} else {
					var action = event.which == 38 ? 'prev' : 'next',
						select = event.which == 38 ? 'last' : 'first',
						sibling = selected[action + 'All']('.message:first');

					if (!sibling.length) {
						sibling = selected.closest('.monologue')[action + 'All']('.monologue:first').find('.message:' + select);
					}

					if (sibling.length) {
						selected.removeClass('easy-navigation-selected');
						selected = sibling.addClass('easy-navigation-selected');
					}
				}

				var monologue = selected.closest('.monologue');
				selectedTopOffset = monologue.offset().top,
					scrollTopOffset = $(document).scrollTop();

				if (selectedTopOffset < scrollTopOffset) {
					$(document).scrollTo(monologue);
				} else {
					var selectedBottomOffset = selectedTopOffset + monologue.outerHeight(true),
						offsetDifference = selectedBottomOffset - $('#input-area').offset().top,
						scrollPosition = scrollTopOffset + offsetDifference + 5;

					if (offsetDifference > 0) {
						if (selected[0] == $('#chat .message:last')[0]) {
							scrollPosition = $(document).height();
						}

						$(document).scrollTop(scrollPosition);
					}
				}

				return false;
			} else {
				var command = (!event.ctrlKey ? Navigation._actions : Navigation._actions.ctrl)[event.which],
					message = selected[0].id.replace("message-", "");

				if (command && !selected.find('.content > .deleted').length) {
					if (typeof command == 'function') {
						command = command(selected);
					}

					$('#input').focus();

					if (command == 'reply') {
						$('#input').val(':' + message + ' ');
					} else {
						execute(command, [message]);
					}

					return false;
				} else if (command) {
					showNotification('Cannot perform actions on a deleted message...', 2000);
				}
			}
		},

		deselect: function () {
			Navigation._active = false;
			$('#chat .easy-navigation-selected').removeClass('easy-navigation-selected');
		}
	};

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

	function Storage(name) {
		this.storageName = (name || window.location.pathname + 'chatHighlights');
		this.items = [];

		if (localStorage[this.storageName] != null) {
			this.items = JSON.parse(localStorage[this.storageName]);
		} else {
			this.items = [];
		}

		this.add = function (match) {
			if ($.inArray(match, this.items) < 0) {
				this.items.push(match);
				localStorage[this.storageName] = JSON.stringify(this.items);
			}
		}

		this.remove = function (match) {
			this.items.splice($.inArray(match, this.items), 1);
			localStorage[this.storageName] = JSON.stringify(this.items);
		}
	};

	var highlightStore = new Storage(),
		clipping = new Storage('chatClips');

	setInterval(function () {
		if (localStorage[clipping.storageName] != null) {
			clipping.items = JSON.parse(localStorage[clipping.storageName]);
		} else {
			clipping.items = [];
		}
	}, 2500);

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
			$('#input').val('');

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
		transcript: function (match) {
			if (!match) {
				var transcript = $("a.button[href^=/transcript]")[0];
				var href = transcript.href;
				window.open(href);
			} else {
				var searchField = $("input#searchbox");
				var searchForm = searchField.parent("form");
				var href = searchForm.attr('action');
				var fieldName = searchField.attr('name');
				var roomID = $("input[name='room']", searchForm).val();
				window.open(href + "?room=" + roomID + "&" + fieldName + "=" + escape(match));
			}
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

			highlightStore.add(match);
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
			highlightStore.remove(match);
			$(selector).expire().removeClass("highlight");
			return CommandState.SucceededDoClear;
		},
		highlights: function () {
			validateArgs(0);
			var ul = $('<ul />').addClass('gm_room_list');

			if (highlightStore.items.length > 0) {
				for (var i = 0; i < highlightStore.items.length; i++) {
					(function (current) {
						$('<a />').click(function () {
							$('#input').val('/delhl ' + current).focus();
							return false;
						}).attr('href', '#')
							.text(current)
							.wrap('<li />')
							.parent()
							.appendTo(ul);
					})(highlightStore.items[i]);
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
			if (m.length) {
				m.addClass("highlight");
				window.setTimeout(function () {
					m.removeClass("highlight");
				}, 2000);
				$.scrollTo(m, 200);
			} else {
				showNotification('Last message cannot be found. Try /load more messages.', 2000)
			}

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
			$('#input').val('');

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
		del: function (id) {
			if (id == null) {
				id = $(".user-container.mine:last .message:last").attr("id").replace("message-", "");
			} else {
				validateArgs(1, ["number"]);
			}
			var elements = $(Selectors.getMessage(id) + ".action-link").click().closest(".message").find(".delete").click();
			if (elements.length !== 1) {
				throw new Error("Unable to delete message.");
			}
			return CommandState.SucceededDoClear;
		},
		leave: function (match) {
			$('#input').val('');

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
		},
		profile: function () {
			match = $.makeArray(arguments).slice(1).join(" ");
			var url = matchSite(arguments[0], 'api.') + '/1.0/users',
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

					if (data.total > 50) {
						response = $('<p />').text('There are too many users that match your search.');
					} else if (data.total === 0) {
						response = $('<p />').text('There are no user that match your search');
					} else if (data.total === 1) {
						$('#input').val(currentSite + '/users/' + data.users[0].user_id);
						$('#sayit-button').click();
					} else {
						response = $('<ul />').addClass('gm_room_list profile');

						for (var i = 0; i < data.users.length; i++) {
							(function (current) {
								var anchor = $('<a />').click(function () {
									$('#input').val(currentSite + '/users/' + current.user_id);
									$('#sayit-button').click();

									return false;
								}).attr('href', '#')
									.text(' ' + current.reputation)
									.wrap('<li />');

								$('<strong />').text(current.display_name).prependTo(anchor);

								$('<img />').attr({
									src: 'http://www.gravatar.com/avatar/' + current.email_hash + '?s=14&d=identicon',
									alt: ''
								}).prependTo(anchor);

								anchor.parent().appendTo(response);
							})(data.users[i]);
						}
					}

					showNotification(response, 10E3);
				}
			});

			return CommandState.SucceededDoClear;
		},

		jot: function () {
			var insert, display;

			if (isNumber(arguments[0])) {
				validateArgs(1, ['number']);
				insert = 'http://' + window.location.hostname + '/transcript/message/' + arguments[0];
				var content = $(Selectors.getMessage(arguments[0]));

				if (content.length !== 1) {
					throw new Error("The message you're trying to jot down cannot be found");
				}

				display = content.find('.content').html();
			} else {
				insert = $.makeArray(arguments).join(' ');
				display = insert;

				if (insert === '') {
					throw new Error('You have not entered anything to be jotted down');
				}
			}

			clipping.add({
				'display': display,
				'insert': insert,
				'room': $('#roomname').text()
			});

			showNotification($('<ul />').append(createClipItem(clipping.items.length - 1, $('#roomname').text(), display, false)).addClass('clips_list'), 10E3);

			return CommandState.SucceededDoClear;
		},

		clips: function () {
			validateArgs(0);

			var ul = $('<ol />').addClass('clips_list');

			for (var i = 0; i < clipping.items.length; i++) {
				createClipItem(i, clipping.items[i].room, clipping.items[i].display, true).appendTo(ul);
			}

			showNotification(ul, 10E3);
			return CommandState.SucceededDoClear;
		},

		paste: function (id) {
			validateArgs(1, ['number']);

			$('#input').val(clipping.items[id].insert);
			$('#sayit-button').click();

			return CommandState.SucceededDoClear;
		},

		rmclip: function (id) {
			validateArgs(1, ['number']);

			clipping.remove(clipping.items[id]);

			return CommandState.SucceededDoClear;
		},

		ob: function (url) {
			validateArgs(1, ['string']);

			url = url.replace(/https?:\/\/(www.)?/, '');

			if (url.indexOf('vimeo.com') > -1) {
				var id;

				if (url.match(/^vimeo.com\/[0-9]+/)) {
					id = url.split('/')[1];
				} else if (url.match(/^vimeo.com\/channels\/[\d\w]+#[0-9]+/)) {
					id = url.split('#')[1];
				} else if (url.match(/vimeo.com\/groups\/[\d\w]+\/videos\/[0-9]+/)) {
					id = url.split('/')[4];
				} else {
					throw new Error('Unsupported Vimeo URL');
				}

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
							}, 400);
						})(data[0].title, data[0].url, data[0].user_name);
					}
				});
			}
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
			// $(this).before("<div class='timestamp'>" + id + "</div>");

			if (!$(this).siblings('#id-' + id).length) {
				// var timestamp = new Date($(this).data().info.time * 1000);
				// timestamp = "" + timestamp.getHours() + ":" + (timestamp.getMinutes() < 10 ? "0" + timestamp.getMinutes() : timestamp.getMinutes()) + ":" + (timestamp.getSeconds() < 10 ? "0" + timestamp.getSeconds() : timestamp.getSeconds());
				// $(this).prev(".timestamp").remove();
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
		for (var i = 0; i < highlightStore.items.length; i++) {
			commands.addhl(oldHighlights[i]);
		}

		// Bind navigation controls
		$('#input').bindAs(0, 'keydown', Navigation.launch);
		$('#input').bindAs(0, 'focus', Navigation.deselect);
		$(document).bindAs(0, 'click', Navigation.deselect);
		$(document).bindAs(0, 'keydown', Navigation.navigate);

		// Injecting Clipboard buttons
		$('<button />')
			.text('clipboard')
			.addClass('button')
			.appendTo('#chat-buttons')
			.click(function () {
				commands.clips();
			});

		$('.message').livequery(function () {
			var c = this;

			$('<span />').prependTo($(this).find('.meta')).addClass('action_clip').attr('title', 'add this message to my clipboard').click(function () {
				commands.jot(c.id.substring(8));
			});
		});


		// Style insertion, a la GM_addStyle, but using jQuery CSS syntax
		(function (style_obj) {
			var styleText = '';

			for (var i in style_obj) {
				styleText = styleText + i + '{';
				for (var p in style_obj[i]) {
					styleText = styleText + p + ':' + style_obj[i][p] + ';';
				}
				styleText = styleText + '}';
			}

			$('<style />').text(styleText).appendTo('head');
		})( // Ugly brackets!
		{
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
			'background': 'url("http://sstatic.net/chat/img/leave-and-switch-icons.png") no-repeat',
			'cursor': 'pointer'
		},
		'#chat-body .monologue.mine .message:hover .meta': {
			'display': 'inline-block !important'
		},
		'#chat-body .monologue.mine .message .meta .vote-count-container': {
			'display': 'none !important'
		},
		'.easy-navigation-selected': {
			'background-color': '#D2F7D0',
			'margin-left': '5px',
			'-moz-border-radius': '4px 4px 4px 4px',
			'padding-left': '15px !important;'
		}

	   });
	});
});
