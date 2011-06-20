// ==UserScript==
// @name         SE Modifications
// @description  A collection of modifications for the Stack Exchange network of sites
// @include      http://stackoverflow.com/*
// @include      http://meta.stackoverflow.com/*
// @include      http://superuser.com/*
// @include      http://meta.superuser.com/*
// @include      http://serverfault.com/*
// @include      http://meta.serverfault.com/*
// @include      http://askubuntu.com/*
// @include      http://meta.askubuntu.com/*
// @include      http://answers.onstartups.com/*
// @include      http://meta.answers.onstartups.com/*
// @include      http://nothingtoinstall.com/*
// @include      http://meta.nothingtoinstall.com/*
// @include      http://seasonedadvice.com/*
// @include      http://meta.seasonedadvice.com/*
// @include      http://stackapps.com/*
// @include      http://*.stackexchange.com/*
// @exclude      http://chat.stackexchange.com/*
// @exclude      http://chat.*.stackexchange.com/*
// @exclude      http://api.*.stackexchange.com/*
// @exclude      http://data.stackexchange.com/*
// @exclude      http://*/reputation
// @author       @rchern
// ==/UserScript==

function with_jquery(f) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.textContent = "(" + f.toString() + ")(jQuery)";
    document.body.appendChild(script);
};

with_jquery(function ($) {
	var profile = $('#hlinks-user a').filter(function () {
			return this.href && this.href.match(/\/users\/\d+\/[^\/]+$/);
		});
		My = {
			'name': profile.text(),
			'profile': profile.attr('href')
		},
		NameRegistry = (function ($) {
			var translationTable = {
				'th': 'Þ',
				'ss': 'ß',
				'a': 'àåáâäãåą',
				'c': 'çćč',
				'e': 'èéêëę',
				'i': 'ìíîïı',
				'n': 'ñń',
				'o': 'òóôõöøő',
				'u': 'ùúûü',
				'y': 'ýŸ',
				'd': 'đ',
				'g': 'ğ',
				'l': 'ł',
				's': 'śşš',
				'z': 'żźž'
			}, tmp = {};
			
			for (var translation in translationTable) {
				var original = translationTable[translation];
				
				for (var i = 0; i < original.length; ++i) {
					tmp[original.charAt(i)] = translation;
				}
			}
			
			translationTable = tmp;
			
			delete(tmp);

			return function () {
				var availableNames = {},
					searched = null;
			
				this.add = function (name) {
					seek(name, true);
				};
				
				this.getMatches = getMatches;
				
				function getMatches(name) {
					return seek(name, false);
				};
				
				this.lastSearch = lastSearch;
				
				function lastSearch() {
					return searched;
				}
				
				function seek(name, add) {
					searched = name = translate(name);
					
					var first = name.lookup ? name.lookup.charAt(0) : null,
						list, i, j, current, matches = [];
					
					if (first) {
						if (list = availableNames[first]) {
							for (i = 0; i < list.length; ++i) {
								current = list[i].lookup;
								
								if (name.lookup.length === 1) {
									matches.push(list[i]);
								} else if (current.length >= name.lookup.length) {
									for (j = 1; j < name.lookup.length && current; ++j) {
										if (current.charAt(j) != name.lookup.charAt(j)) {
											current = null;
										}
									}
									
									if (current) {
										matches.push(list[i]);
									}
								}
							}
						}
						
						if (add && !matches.length) {
							if (!availableNames[first]) {
								availableNames[first] = [];
							}
							
							availableNames[first].push(name);
						}
					}
					
					return matches;
				}
				
				function translate(name) {
					if (!name)
						return '';

					// Check if the passed argument is jQuery (if so, we're extracting names from the usual places)
					if (name instanceof $)
						name = name.clone().find('span').remove().end().text();
						
					// The passed argument was already translated
					if (typeof name === 'object' && name.lookup)
						return name;
						
					// This should never happen
					if (typeof name !== 'string')
						return '';
					
					// Replace the spaces in the name and lookup
					name = {
						'original': name.replace(/\s+/g, ''),
						'lookup': ''
					};
					
					var lookup = name.original.toLowerCase();
					
					for (var i = 0; i < lookup.length; ++i) {			
						name.lookup += translationTable[lookup.charAt(i)] || lookup.charAt(i);
					}

					return name;
				}
			};
		})($);

	function AutoComplete(target) {
		var target = target.addClass('auto-complete'),
			active = false,
			users = new NameRegistry(),
			autocomplete = $('<ul class="auto-complete-matches">').css({
					'position': 'absolute',
					'width': target.width() + 'px',
					'margin-left': '0px',
					'margin-bottom': '5px'
				})
				.hide()
				.insertBefore(target),
			postSignatures = target.closest('#question, .answer').find('.post-signature');
				
			// Get the list of available user names and add them to the autocomplete list
			// First from the comments
			target.closest('.comments').find('.comment-user').each(add);
			// Then from the post signature of the last editor (if present)
			// Also the post author now, by popular demand
			postSignatures.find('.user-details a:first').each(add);
			
			// Add the auto-complete options tabber
			target.bind('keydown', tabselect);
			// TS: If we bind to keypress, the state of the input won't be what we expect it to be
			//     We could probably work around that though, since keyup is kind of bad
			target.bind('keyup click', update);
			
			function update(event) {
				var self = $(this),
					text = self.val(),
					selectionIndex, match, matches;
					
				if (this.selectionStart !== this.selectionEnd || event.which === 9) {
					return;
				}
				
				selectionIndex = text.indexOf(' ', this.selectionEnd);
				selectionIndex = selectionIndex == -1 ? text.length : selectionIndex;
				
				// Check for an auto-completable name; note that it has to be the first instance of @ to work
				if (active = ((match = text.substring(0, selectionIndex).match(/@([^\s]+)$/)) && selectionIndex - match[0].length === text.indexOf('@'))) {
					// Remove the existing potential matches
					autocomplete.empty();
					
					// Get the list of potential matches
					matches = users.getMatches(match[1]);
					
					// TS: We could do some sorting here, I suppose
					for (var i = 0; i < matches.length; ++i) {
						var selected = users.lastSearch().lookup === matches[i].lookup;
					
						$('<li />').css({
								'color': '#000000',
								'display': 'inline-block',
								'background-color': '#FFFFFF',
								'padding': '2px 4px 2px 4px',
								'margin': '0px 5px 0px 0px',
								'cursor': 'pointer',
								'border': '1px solid #888888',
								'font-weight': selected ? 'bold' : 'normal'
							})
							.addClass(selected ? 'selected' : '')
							.text(matches[i].original)
							.click(function () {
								var self = $(this);
								
								complete(target, self.text());
								
								// Trigger a keyup event on the input box
								target.keyup();
								
								return false;
							})
							.appendTo(autocomplete);
					}
					
					autocomplete.css({
							'top': (target.position().top - autocomplete.outerHeight(true)) + 'px',
							'left': target.position().left + 'px'
						})
						.show();
						
					return false;
				} else {
					autocomplete.hide().empty();
				}
			}
			
			function tabselect(event) {
				var self = $(this);
				
				if (active && event.which == 9) {
					var selected = autocomplete.find('.selected'),
						next = selected.next(),
						current;
						
					if (selected.length) {	
						selected.removeClass('selected').css('font-weight', 'normal');
						
						if (next.length) {
							current = next.addClass('selected').css('font-weight', 'bold');
						}
					}
					
					if (!next.length) {
						current = autocomplete.children(':eq(0)').addClass('selected').css('font-weight', 'bold');
					}
					
					if (current && current.length) {
						complete(self, current.text());
					}
					
					return false;
				}
			}
			
			function complete(self, text) {
				var value = self.val(),
					input = self.focus().val(value.replace(/@[^\s]+/, '@' + text))[0];
							
				input.selectionStart = input.selectionEnd = value.indexOf('@') + text.length + 1;
			}
				
			function add() {
				var self = $(this);
				
				if (self.attr('href') !== My.profile) {
					users.add(self);
				}
			}
	}
	
	$(function () {
		// Initialize the general stuff here
		var locationBits = location.hostname.split('.');
		
		if(locationBits[0] !== 'discuss' && (locationBits[0] !== 'meta' || locationBits[1] === 'stackoverflow'))
			$("#hlinks-user .reputation-score").attr('title', 'your reputation; view reputation audit').parent().attr('href', '/reputation');
		
		initQuestions();
		initPostRevisions();
		initSearchResults();
	});
	
	/*
	 * Initializes functionality that only appears on the questions page:
	 *   - Question timeline linking
	 *   - Explicit post history linking
	 *   - Comment linking
	 *   - Hidden linked comment revealing
	 *   - Comment auto-completion
	 */
	function initQuestions() {
		if (location.pathname.search("^/questions/\\d+/") === -1) {
			return;
		}
		
		var needsHighlight = false,
			question = $("#question-header a")[0].href;
		
		if (!question) {
			return;
		}

		function linkifyComments(reference, url) {
			reference.find('.comment')
				.each(function() {
					$('.comment-date', this).wrap('<a href="' + url.replace(/#.*/, '#' + this.id) + '" />');
				});
		}

		function highlightComment(comment) {
			if(!(comment = $(comment)).length) {
				return false;
			}

			needsHighlight = false;

			$(document).scrollTop(comment.offset().top);

			comment.css({ 'opacity': 0 })
				.animate({ 'opacity': 1 }, 1500, 'linear');

			return true;
		}

		$(document).ajaxComplete(function(event, request, options) {
			if (options) {
				var id = options.url.match(/^\/posts\/([0-9]+)\/comments/);

				if (id) {
					id = id[1];

					if (needsHighlight) {
						highlightComment(location.hash);
					}
					
					var post = $('#comments-' + id);
					var url = $('#question #comments-' + id).length ? questionURL + '#' :
						post.closest('.answer, #question')
							.find(".post-menu a:contains('link'):first")
							.attr("href");

					linkifyComments(post, url);
				}
			}
		});

		var post = question.replace("questions", "posts").replace(/\/[^\/]*$/, ""),
			timeline = post + "/timeline",
			revisions = post + "/revisions";
		$("#question .post-menu").append("<span class='lsep'>|</span><a href='" + timeline + "'>timeline</a>");
		$(".post-menu").each(function() {
			var postLink = $(this).find("a:contains('link'):first").attr("href");

			if (!revisions) {
				revisions = "/posts"
					+ postLink.replace(question, "").replace(/#.*/, "")
					+ "/revisions";
			} else {
				postLink = question + '#';
			}

			$(this).append("<span class='lsep'>|</span><a href='" + revisions + "'>history</a>");

			linkifyComments($(this).closest('.answer, #question'), postLink);

			revisions = null;
		});

		// try our best to show a linked comment
		var commentID = location.hash.match(/#(comment-[0-9]+)/);

		if (commentID && !highlightComment(commentID[0])) {
			// comment doesn't exist or it's hidden (more likely)
			var post = location.pathname;
				post = post.substring(post.lastIndexOf('/') + 1);

			needsHighlight = true;

			$((post.match(/^[0-9]+$/) ? '#answer-' + post : '#question') + ' .comments-link').click();
		}
		
		$(document).bind('keydown', function (event) {
			if (!event.shiftKey || event.which != 50)
				return;
			
			var target = $(event.target);
			
			if (target.attr('name') === 'comment' && !target.hasClass('auto-complete')) {
				new AutoComplete(target);
			} else if (target.attr('name') !== 'comment') {
				$('.auto-complete-matches').hide();
			}
		});
		$(document).bind('click', function (event) {
			$('.auto-complete-matches').hide();
		});
	}
	
	/*
	 * Initializes functionality that only appears on the post revisions page:
	 *   - Inline revision source loading
	 */
	function initPostRevisions() {
		if (location.pathname.search("^/posts/\\d+/revisions") === -1) {
			return;
		}
		
		$('.revision, .owner-revision').find('a[href$="/view-source"]').one('click', function () {
			if (lock) {
				return;
			}
			
			var self = $(this),
				original = self.text();
				
			self.text('loading...');
			
			$.ajax({
				'url': this.href,
				'context': self.closest('tr').next().find('.post-text')[0],
				'success': function (response) {
					var id = "inline-" + this.parentNode.id;
				
					self.removeAttr('target')[0].href = "#" + id;
					
					$('<pre>', {
						'text': $(response).filter('pre').text(),
						'css': {
							'white-space': 'pre-wrap'
						}
					}).appendTo(this)[0].id = id;
				},
				'complete': function() {
					self.text(original);
				}
			});
			
			return false;
		});
	}
	
	/*
	 * Initializes functionality that only applies to the search results page
	 *   - Removing tags from search results
	 */
	function initSearchResults() {
	
	}
});
