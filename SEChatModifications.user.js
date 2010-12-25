// ==UserScript==
// @name		SE Chat Modifications
// @description	A collection of modifications for SE chat rooms
// @include		http://chat.meta.stackoverflow.com/rooms/*
// @include		http://chat.stackexchange.com/rooms/*
// @include		http://chat.stackoverflow.com/rooms/*
// @include		http://chat.superuser.com/rooms/*
// @include		http://chat.serverfault.com/rooms/*
// @include		http://chat.askubuntu.com/rooms/*
// @author		@rchern
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

	$.expr[':'].regex = function (elem, index, match) {
		var matchParams = match[3].split(','),
			validLabels = /^(data|css):/,
			attr = {
				method: matchParams[0].match(validLabels) ?
							matchParams[0].split(':')[0] : 'attr',
				property: matchParams.shift().replace(validLabels, '')
			},
			regexFlags = 'ig',
			regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g, ''), regexFlags);
		return regex.test(jQuery(elem)[attr.method](attr.property));
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

		if (typeof prefix == 'undefined') { prefix = ''; }

		if (n.indexOf('meta') === 0) {
			n = n.substring(4);
			if (n.indexOf('.') === 0) { n = n.substring(1); }

			prefix = prefix + 'meta.';
		}

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

	function isCtrl(event) {
		return event.ctrlKey || (!event.altKey && event.metaKey);
	}

	var Navigation = {
		_active: false,

		_actions: {
			'37': {
				command: 'peek',
				jump: false
			},
			'39': {
				command: function (target) {
					return target.closest('.monologue').hasClass('mine') ? 'edit' : 'reply';
				},
				jump: true
			},
			'68': {
				command: 'del',
				jump: true
			},
			'70': {
				command: 'flag',
				jump: true
			},
			'72': {
				command: 'history',
				jump: false
			},
			'69': {
				command: 'edit',
				jump: true
			},
			'80': {
				command: 'peek',
				jump: false
			},
			'81': {
				command: 'quote',
				jump: true
			},
			'82': {
				command: 'reply',
				jump: true
			},
			'83': {
				command: 'star',
				jump: true
			},
			'ctrl': {}
		},

		deselect: function () {
			Navigation._active = false;
			Navigation.unpeek();
			$('#chat .easy-navigation-selected').removeClass('easy-navigation-selected');
		},

		launch: function (event) {
			if (isCtrl(event) && event.which == 38) {
				this.blur();

				Navigation._active = true;

				$(document).trigger(event);

				event.preventDefault();
				event.stopImmediatePropagation();

				return false;
			}
		},

		handles: function (key, isCtrl) {
			return (!isCtrl ? Navigation._actions : $.extend({}, Navigation._actions, Navigation._actions.ctrl))[key];
		},

		navigate: function (event, n) {
			Navigation.unpeek();

			if (isCtrl(event) && event.which == 40) {
				$(document).scrollTop($(document).height());
				$('#input').focus();

				return true;
			}

			if (!Navigation._active) {
				return true;
			}

			if (n === 0) {
				return false;
			}

			var selected = $('#chat .easy-navigation-selected'),
				up = event.which == 33 || event.which == 38,
				down = event.which == 34 || event.which == 40;

			if (up || down) {
				if (!selected.length) {
					selected = $('#chat .message:last').addClass('easy-navigation-selected');
				} else {
					var action = up ? 'prev' : 'next',
						select = up ? 'last' : 'first',
						sibling = selected[action + 'All']('.message:first');

					if (!sibling.length) {
						sibling = selected.closest('.monologue')[action + 'All']('.monologue:first').find('.message:' + select);
					}

					if (sibling.length) {
						selected.removeClass('easy-navigation-selected');
						selected = sibling.addClass('easy-navigation-selected');
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

				if ((event.which == 33 || event.which == 34) && !n) {
					n = 5;
				}

				if (n) {
					Navigation.navigate(event, n - 1);
				}

				return false;
			} else {
				var action = Navigation.handles(event.which, isCtrl(event)),
					message = selected[0].id.replace("message-", ""),
					parent = selected.data('info').parent_id,
					replied,
					command = action ? action.command : null;

				if (command && !selected.find('.content > .deleted').length) {
					if (typeof command == 'function') {
						command = command(selected);
					}

					if (action.jump) {
						$('#input').focus();
					}

					if (command == 'reply') {
						$('#input').val(':' + message + ' ' + $('#input').val().replace(/^:\d+\s*/, ''));
					} else if (command == 'peek') {
						if (parent) {
							if ((replied = $('#message-' + parent + ' > .content')).length) {
								Navigation.peek(message, parent, replied.html());
							} else {
								$.get('/message/' + parent, function (text) {
									Navigation.peek(message, parent, text);
								}, 'text');
							}
						}
					} else if (command == 'flag') {
						// Require double-confirmation in a roundabout way...
						$('#input').val("/flag " + message);
					} else {
						execute(command, [message]);
					}

					return false;
				} else if (command) {
					showNotification('Cannot perform actions on a deleted message...', 2000);
				}
			}
		},

		peek: function (reply, parent, text) {
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

				Navigation.update();
			}
		},

		suppress: function (event) {
			if (Navigation._active && Navigation.handles((event.which < 123 && event.which > 96 ? event.which - 32 : event.which), isCtrl(event))) {
				event.stopImmediatePropagation();
				event.preventDefault();
			}
		},

		unpeek: function () {
			$('.easy-navigation-peekable').remove();
		},

		update: function () {
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
			return "#my-rooms > li > a[href^='/rooms']:contains('" + match + "')";
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
		};

		this.remove = function (match) {
			this.items.splice($.inArray(match, this.items), 1);
			localStorage[this.storageName] = JSON.stringify(this.items);
		};
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

	//factor out highlighting stuff to avoid repeating myself
	function getHighlightSelector(match) {
		if (isNumber(match)) {
			return Selectors.getMessage(match);
		} else {
			return Selectors.getSignature(match);
		}
	}
	function addhl(match) {
		var selector = getHighlightSelector(match);
		$(selector).livequery(function () {
			$(this).addClass("highlight");
		});
	}
	function delhl(match) {
		var selector = getHighlightSelector(match);
		$(selector).expire().removeClass("highlight");
	}

	function getCommandList() {
		var ul = $('<ul />').addClass('gm_room_list');
		var cmds = [];
		for (var c in commands) cmds.push(c); //convert to array for sort to alphabetical order
		cmds.sort();
		for (var i = 0; i < cmds.length; i++) {
			(function (current) {
				$('<a />').click(function () {
					$('#input').val('/' + current).focus();
					return false;
				}).attr('href', '#')
			  .text(current)
			  .wrap('<li />')
			  .parent()
			  .appendTo(ul);
			})(cmds[i]);
		}
		return ul;
	}

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
		flag: function (id) {
			validateArgs(1, ["number"]);
			var flag = $(Selectors.getMessage(id) + " .flags .img")[0];
			$(flag).click();
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
			var selector = Selectors.getRoom(match);
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
		hl: function (match) {
			if (typeof match == 'undefined') {  //no parameters = show list
				var ul = $('<ul />').addClass('gm_room_list');

				if (highlightStore.items.length > 0) {
					for (var i = 0; i < highlightStore.items.length; i++) {
						(function (current) {
							$('<a />').click(function () {
								$('#input').val('/hl ' + current).focus();
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
			} else { //if already in list, remove - else add
				match = $.makeArray(match).join(" ");
				if ($.inArray(match, highlightStore.items) >= 0) {
					highlightStore.remove(match);
					delhl(match);
				} else {
					highlightStore.add(match);
					addhl(match);
				}
			}

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
			var elements = $(Selectors.getMessage(id) + " .action-link").click().closest(".message").find(".delete").click();
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
							name = data.display_name + (data.user_type === 'moderator' ? ' ♦' : '');

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
									showNotification(buildOb(current), 10E3);
									return false;
								}).attr('href', '#')
									.text(' ' + current.reputation)
									.wrap('<li />');

								$('<strong />').text(current.display_name + (current.user_type === 'moderator' ? ' ♦' : '')).prependTo(anchor);

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
		},
		history: function (id) {
			validateArgs(1, ["number"]);
			$("<div>").addClass("gm_room_list").load("/messages/" + id + "/history #content", function () {
				showNotification(this, 10E3);
			});
			return CommandState.SucceededDoClear;
		},
		update: function () {
			validateArgs(0);
			try {
				window.location = "http://github.com/rchern/StackExchangeScripts/raw/master/SEChatModifications.user.js";
			} catch (e) { if (console) console.log(e) } //do nothing, swallow 'Unknown exception 0x805e000a'
			return CommandState.SucceededDoClear;
		},
		help: function () {
			var ul = getCommandList();
			ul = $(ul).before($('<span/>').text('List of recognised commands:'));
			showNotification(ul, 10E3);
			return CommandState.SucceededDoClear;
		}
	};

	$(function () {
		var input = $("#input")
		var page = $(document);

		// ctrl+space retry
		page.bindAs(0, 'keydown', function (evt) {
			if (evt.which == 32 && isCtrl(event)) {
				var value = input.val();

				// This apparently removes the input's text
				$(".message.pending:first a:contains(retry)").click();

				input.val(value);

				return false;
			}
		});

		// show the message ids on each 
		$(".message:not(.pending):not(.posted)").livequery(function () {
			var id = this.id.replace("message-", "");

			if (!$(this).siblings('#id-' + id).length) {
				var timestamp = new Date($(this).data().info.time * 1000);
				timestamp = "" + timestamp.getHours() + ":" + (timestamp.getMinutes() < 10 ? "0" + timestamp.getMinutes() : timestamp.getMinutes()) + ":" + (timestamp.getSeconds() < 10 ? "0" + timestamp.getSeconds() : timestamp.getSeconds());
				$(this).prev(".timestamp").remove();
				$('<div />').insertBefore(this)
					.text(id + ' ' + timestamp)
					.addClass('timestamp')
					.attr('id', 'id-' + id);
			}

			if ($(this).find(".mention").length > 0) {
				if (window.webkitNotifications && (window.webkitNotifications.checkPermission() === 0)) {
					var n = window.webkitNotifications.createNotification($("#footer-logo img").attr("src").replace("logo.png", "apple-touch-icon.png"), $("#roomname").text(), $(this).find(".content").text());
					n.show();
					setTimeout(function () { n.cancel(); }, 10E3);
				}
			}
		});

		// handle commands
		input.bindAs(0, 'keydown', function (evt) {
			if (evt.which == 13 && input.val().substring(0, 1) == "/") {
				if (input.val().substring(1, 2) == "/") { //double slash to escape commands
					input.val(input.val().substring(1));  //remove the escaping slash
				} else {
					var args = input.val().split(" ");
					var cmd = args[0].substring(1);
					args = Array.prototype.slice.call(args, 1);
					var returnVal = false;
					returnVal = execute(cmd, args);
					if (returnVal == CommandState.SucceededDoClear) {
						input.val("");
					}
					if (returnVal == CommandState.NotFound) {
						var ul = getCommandList();
						ul = $(ul).before($('<span/>').text('Unknown command, try again, or use // to escape commands.'));
						showNotification(ul, 10E3);
					}
					//Prevent propagation whether command is found or not
					evt.preventDefault();
					evt.stopImmediatePropagation();
					evt.stopPropagation();
					evt.cancelBubble = true;
					return false;
				}
			}
		});

		// Persistant highlighting Restoration
		for (var i = 0; i < highlightStore.items.length; i++) {
			addhl(highlightStore.items[i]);
		}

		// Bind navigation controls
		input.bindAs(0, 'keydown', Navigation.launch);
		input.bindAs(0, 'focus', Navigation.deselect);
		page.bindAs(0, 'click', Navigation.deselect);
		page.bindAs(0, 'keydown', Navigation.navigate);
		page.bindAs(0, 'keypress', Navigation.suppress);
		$('.message').livequery(Navigation.update);

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
		})(
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
					'background': '1px 0px url("http://or.sstatic.net/chat/img/leave-and-switch-icons.png") no-repeat',
					'cursor': 'pointer'
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
				}
			}
		);

	 	// ask for notification permissions if we don't already have it
		if (window.webkitNotifications && (window.webkitNotifications.checkPermission() !== 0)) {
			$('<button />').text('desktop @mentions')
				.addClass('button')
				.css('margin-left', '4px')
				.appendTo('#chat-buttons')
				.click(function () {
					var self = this;
					window.webkitNotifications.requestPermission(function () {
						$(self).remove();
					});
				});
		}
	});
});
