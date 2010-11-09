// ==UserScript==
// @name           SE Modifications
// @description    A collection of modifications for the Stack Exchange network of sites
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
// @include       http://nothingtoinstall.com/*
// @include       http://meta.nothingtoinstall.com/*
// @include       http://seasonedadvice.com/*
// @include       http://meta.seasonedadvice.com/*
// @include       http://stackapps.com/*
// @include       http://*.stackexchange.com/*
// @exclude       http://chat.stackexchange.com/*
// @exclude       http://chat.*.stackexchange.com/*
// @exclude       http://api.*.stackexchange.com/*
// @exclude       http://odata.stackexchange.com/*
// @exclude       http://area51.stackexchange.com/*
// @exclude       http://*/reputation
// @author         @rchern
// ==/UserScript==

function with_jquery(f) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery)";
    document.body.appendChild(script);
};

with_jquery(function ($) {
	$(function () {
		// add timeline and history links to post menu
		var questionURL = $("#question-header a").attr("href");
		if (questionURL) {
			var post = questionURL.replace("questions", "posts").replace(/\/[^\/]*$/, ""),
				timeline = post + "/timeline",
				revisions = post + "/revisions";
			$("#question .post-menu").append("<span class='lsep'>|</span><a href='" + timeline + "'>timeline</a>");
			$(".post-menu").each(function() {
				var postLink = $(this).find("a:contains('link'):first").attr("href");

				if (!revisions) {
					revisions = "/posts"
						+ postLink.replace(questionURL, "").replace(/#.*/, "")
						+ "/revisions";
				} else {
					postLink = questionURL + '#';
				}

				$(this).append("<span class='lsep'>|</span><a href='" + revisions + "'>history</a>");
				
				// add comment link to comment date
				$(this).closest('.answer, #question')
					.find('.comment')
					.each(function() {
						$('.comment-date', this).wrap('<a href="' + postLink.replace(/#.*/, '#' + this.id) + '" />');
					})
					.end()
					.find('.comments-link')
					.click(function(event) {
						var self = $(this);

						// This isn't ideal...
						setTimeout(function() {
							self.prevAll('.comments')
								.find('.comment')
								.each(function() {
									$('.comment-date', this).wrap('<a href="' + postLink.replace(/#.*/, '#' + this.id) + '" />');
								});
						}, 500);
					});

				revisions = null;
			});
		}
		
		// try our best to show a linked comment
		var commentID = location.hash.match(/#(comment-[0-9]+)/),
			comment;

		if (commentID && !(comment = $(commentID[0])).length) {
			// comment doesn't exist or it's hidden (more likely)
			var post = location.pathname;
				post = post.substring(post.lastIndexOf('/'));

			$((post.match(/[0-9]+/) ? 'answer-' + post : '#question') + ' .comments-link').click();

			// Again, not ideal...
			setTimeout(function() {
				var comment;

				if ((comment = $(commentID[0])).length) {
					$(document).scrollTop(comment.offset().top);
					comment.css({ 'background-color': $('<span class="newuser" />').css('background-color') })
						.animate({ 'background-color': $('#question').css('background-color') }, 2000, 'linear');
				}
			}, 500);
		} else if (comment) {
			comment.css({ 'background-color': $('<span class="newuser" />').css('background-color') })
				.animate({ 'background-color': $('#question').css('background-color') }, 2000, 'linear');
		}

		// adds an audit link next to your rep in the header that leads to /reputation
		$("#hlinks-user .reputation-score").parent().after("<a href='/reputation'>(audit)</a>");
		
		// add autocomplete to comments
		$(document).bind('keydown', function(event) {
			if (!event.shiftKey || event.which != 50)
				return;

			var target = $(event.target);

			if (target.attr('name') == 'comment' && !target.hasClass('easy-auto-complete')) {
				var isActive = false,
					users = [];

				function simplify(name) {
					return name.clone().find('span').remove().end().text().replace(/\s+/, '');
				}

				function autocomplete(event) {
					var self = $(this),
						text = self.val(),
						matches,
						list,
						selectionIndex;

					if (this.selectionStart != this.selectionEnd || event.which == 9) {
						return;
					}
					
					selectionIndex = text.indexOf(' ', this.selectionEnd);
					selectionIndex = selectionIndex == -1 ? text.length : selectionIndex;

					if (isActive = ((matches = text.substring(0, selectionIndex).match(/@([^\s]+)$/))
						&& (selectionIndex - matches[0].length == text.indexOf('@')))) {
						(list = self.prev('.easy-auto-complete-matches'))
							.children()
							.remove();

						$.each(users, function(index, value) {
							if (value.toLowerCase().indexOf(matches[1].toLowerCase()) == 0) {
								$('<li />').css({
										'display': 'inline-block',
										'background-color': '#FFFFFF',
										'padding': '2px 4px 2px 4px',
										'margin-right': '5px',
										'cursor': 'pointer',
										'border': '1px solid #888888',
										'font-weight': value.toLowerCase() == matches[1].toLowerCase() ? 'bold' : 'normal'
									})
									.addClass(value.toLowerCase() == matches[1].toLowerCase() ? 'selected' : '')
									.text(value)
									.click(function() {
										var text = $(this).text(),
											value = self.val(),
											box = self.focus()
												.val(value.replace(/@[^\s]+/, '@' + text))[0];

										box.selectionStart = box.selectionEnd = value.indexOf('@') + text.length + 1;
										
										self.keyup();

										return false;
									})
									.appendTo(list);
							} else if (matches[1] < value) {
								return false;
							}
						});

						list.css({
								'display': 'block',
								'top': (self.offset().top - list.outerHeight(true)) + 'px',
								'left': self.offset().left + 'px'
							});
					} else {
						self.prev('.easy-auto-complete-matches')
							.css({ 'display': 'none' })
							.children()
							.remove();
					}
				}

				target.addClass('easy-auto-complete')
					.before('<ul class="easy-auto-complete-matches" />')
					.prev()
					.css({
						'display': 'none',
						'position': 'absolute',
						'width': target.width() + 'px',
						'margin-left': '0px',
						'margin-bottom': '5px',
					})
					.end()
					.bind('keydown', function(event) {
						var self = $(this);

						if (isActive && event.which == 9) {
							var matches = self.prev(),
								selected = matches.find('.selected'),
								next = selected.next(),
								current;

							if (selected.length) {
								selected.removeClass('selected')
									.css({ 'font-weight': 'normal' });

								if (next.length) {
									current = next.addClass('selected')
										.css({ 'font-weight': 'bold' });
								}
							}

							if (!next.length) {
								current = matches.children()
									.first()
									.addClass('selected')
									.css({ 'font-weight': 'bold' });
							}
							
							if (current && current.length) {
								var text = current.text(),
									value = self.val(),
									box = self.focus()
										.val(value.replace(/@[^\s]+/, '@' + text))[0];

								box.selectionStart = box.selectionEnd = value.indexOf('@') + text.length + 1;
							}

							return false;
						}
					})
					.bind('keyup click', autocomplete)
					.data('_easy-auto-complete-users', users)
					.closest('.comments')
					.find('.comment-user')
					.each(function() {
						var username = simplify($(this));

						if ($.inArray(username, users) == -1) {
							users.push(username);
						}
					})
					.closest('#question')
					.find('.post-signature .user-details')
					.each(function() {
						var username = simplify($(this).find('a:first'));

						if ($.inArray(username, users) == -1) {
							users.push(username);
						}
					})
					.trigger('keypress', function(event) {
						users.sort();
						
						return event;
					}(event));
			}
		});
	});
});