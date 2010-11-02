// ==UserScript==
// @name           SE Answer Watcher
// @namespace      yijiang
// @description    Adds the ability to watch for changes to answers, such as voting, comments and edits
// @include        http://stackoverflow.com/*
// @include        http://meta.stackoverflow.com/*
// @exclude        */reputation
// @exclude        */flair/*
// ==/UserScript==

Date.prototype.pad = function(n){
	return n < 10 ? '0' + n : n;
}

if (!Date.prototype.toISOString) Date.prototype.toISOString = function() {
	return this.getUTCFullYear() + '-'
		+ pad(this.getUTCMonth() + 1) +'-'
		+ pad(this.getUTCDate()) + 'T'
		+ pad(this.getUTCHours()) + ':'
		+ pad(this.getUTCMinutes()) + ':'
		+ pad(this.getUTCSeconds()) + 'Z';
}

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

with_plugin('http://timeago.yarp.com/jquery.timeago.js', function(){
	if(localStorage['answatch:lastUpdate'] === null){
		localStorage['answatch:lastUpdate'] = 0;
	}
	
	if(localStorage['answatch:lastViewed'] === null){
		localStorage['answatch:lastViewed'] = 0;
	}
	
	function apiAjax(route, options){
		return $.ajax($.extend(true, {
			url: 'http://api.' + window.location.hostname + '/1.0/' + route,
			cache: true, 
			dataType: 'jsonp', 
			jsonp: 'jsonp', 
			data: {
				api: 'c32K0emmkkeUirrc7hK_lg'
			}
		}, options));
	}
	
	// Build structure to store new answers and changes
	var Answers = {
		add: function(id){
			var answers = Answers.getAll();
			
			if(!Answers.getOne(id)){
			
				apiAjax('answers/' + id, {
					success: function(data){
						// Bail if answer not found
						if(data.total !== 1) { 
							return false;
						} else {
							answers.push({
								'id': id, 
								title: data.answers[0].title, 
								
							});
							localStorage['answatch:answers'] = JSON.stringify(answers);
						}
					}
				});
			}
		}, 
		
		addWiki: function(id, name){
			var answers = Answers.getAll();
			
			if(!Answers.getOne(id)){
				apiAjax('questions/' + id, {
					success: function(data){
						if(data.total !== 1){
							return false;
						} else {
							answers.push({
								'id': id, 
								title: '[' + name + '] Tag Wiki'
							});
							
							console.log(answers);
							
							localStorage['answatch:answers'] = JSON.stringify(answers);
						}
					}
				});
			}
		},
		
		remove: function(id){
			var answers = Answers.getAll();
			
			for(var i = 0; i < answers.length; i++){
				if(answers[i] === id){
					var ret = answers.splice(i-1, 1)[0];
					localStorage['answatch:answers'] = JSON.stringify(answers);
					
					return ret;
				}
			}
			
			return false;
		},
		
		getAll: function(){
			return JSON.parse(localStorage['answatch:answers']) || [];
		}, 
		
		getOne: function(id){
			var answers = Answers.getAll();
			
			// console.log(answers);
			for(var i = 0; i < answers.length; i++){
				if(answers[i].id == id){
					return answers[i];
				}
			}
			
			return false;
		},
		
		serialize: function(){
			var answers = Answers.getAll(), 
				id = [];
			
			for(var i = 0; i < answers.length; i++){
				id.push(answers[i].id);
			}
			
			return id.join(';');
		}
	}
	
	var Changes = {
		add: function(data){
			var changes = Changes.getAll(),
				ret = changes.push(data);
			
			localStorage['answatch:changes'] = JSON.stringify(changes);
			return ret;
		},
		
		getAll: function(){
			return JSON.parse(localStorage['answatch:changes']) || [];
		}
	}
	
	// Inject watch link into answers
	$('.answer .post-menu').each(function(){
		$('<span />').text(' | ').addClass('lsep').appendTo(this);
		$('<a />').attr({
			title: 'add this answer to the list of watched answers', 
			href: '#'
		}).click(function(){
			Answers.add($(this).closest('.answer').attr('id').substring(7));
			return false;
		}).text('watch').appendTo(this);
	});
	
	var menu = $('#questions .post-menu');
	
	if(window.location.pathname.indexOf('/tags') === 0 && menu.length){
		var id = menu.find('a:contains(history)').attr('href').split('/')[2];
		
		$('<span />').text(' | ').addClass('lsep').appendTo(menu);
		
		$('<a />').attr({
			title: 'add this answer to the list of watched answers', 
			href: '#'
		}).click(function(){
			Answers.addWiki(id, window.location.pathname.split('/')[2]);
			return false;
		}).text('watch').appendTo(menu);
	}
	
	var now = Math.round((new Date()).getTime() / 1000), 
		old = localStorage['answatch:lastUpdate'];
	
	if(now - parseInt(localStorage['answatch:lastUpdate'], 10) > 150){
		localStorage['answatch:lastUpdate'] = now;
		
		// Check for edits
		var id = Answers.serialize();
		
		if(id){
			apiAjax('revisions/' + id, {
				data: {
					fromdate: old
				},
				success: function(data){
					for(var i = 0; i < data.revisions.length; i++){
						var t = $('<p />').text(' edited '), 
							rev = data.revisions[i],
							post = rev.post_id,
							userUrl = '/users/' + rev.user.user_id, 
							lastEdit = new Date(rev.creation_date * 1000);
						
						$('<a />').text(rev.user.display_name).attr('href', userUrl).prependTo(t);
						$('<a />').text(Answers.getOne(post).title + ' ').attr('href', '/q/' + post).appendTo(t);
						$('<span />').text(lastEdit.toString()).addClass('ans_time').attr('title', lastEdit.toISOString()).appendTo(t);
						
						Changes.add({
							title: t.wrap('<div />').parent().html(), 
							content: rev.comment,
							url: userUrl,
							gravatar: 'http://www.gravatar.com/avatar/' + rev.user.email_hash + '?s=24&d=identicon&r=PG'
						});
					}
				}
			});
			
			// Check for new comments
			apiAjax('posts/' + id + '/comments', {
				data: {
					min: old
				},
				success: function(data){
					for(var i = 0; i < data.total; i++){
						var t = $('<p />'), 
							c = data.comments[i],
							post = c.post_id,
							userUrl = '/users/' + c.owner.user_id, 
							lastEdit = new Date(c.creation_date * 1000);
						
						if(c.reply_to_user){
							t.text(' replied to ');
							$('<a />').text(c.reply_to_user.display_name).attr('href', '/user/' + c.reply_to_user.user_id).appendTo(t);
							t.append(' on ');
						} else {
							t.text(' commented on ');
						}
						
						$('<a />').text(c.owner.display_name).attr('href', userUrl).prependTo(t);
						$('<a />').text(Answers.getOne(post).title + ' ').attr('href', '/q/' + post).appendTo(t);
						$('<span />').text(lastEdit.toString()).addClass('ans_time').attr('title', lastEdit.toISOString()).appendTo(t);
						
						Changes.add({
							title: t.wrap('<div />').parent().html(), 
							content: c.body,
							url: userUrl,
							gravatar: 'http://www.gravatar.com/avatar/' + c.owner.email_hash + '?s=24&d=identicon&r=PG'
						});
					}
				}
			});
		}
	}
	
	// Inject itself into the SuperColliding Dropdown
	$('.genu').click(function(){
		var SuperCollidingDropDown = $('#seWrapper'), 
			nav = SuperCollidingDropDown.find('.seNavLinks'), 
			container = SuperCollidingDropDown.find('.seContainer').css('position', 'relative');
		
		if(!nav.find('a:contains(answers)').length){
			var answerList = $('<div />').css({
					position: 'absolute', 
					height: '100%', 
					width: '100%',
					overflowY: 'auto'
				}); 
				changes = Changes.getAll();
			
			if(changes.length){
				nav.find('a').click(function(){
					answerList.fadeOut(200);
				});
				
				for(var i = 0; i < changes.length; i++){
					var siteBox = $('<div />').addClass('itemBox').prependTo(answerList), 
						content = $('<div />').addClass('siteInfo').appendTo(siteBox), 
						title = $('<p />').html(changes[i].title).appendTo(content);
					
					console.log(title.find('.ans_time').wrap('<div />').parent().html());
					title.find('.ans_time').timeago();
					console.log(title.find('.ans_time'));
					$('<img />').attr('src', changes[i].gravatar).css('margin', 0)
						.wrap('<a />').parent().attr('href', changes[i].url).addClass('siteFavicon').css('margin-right', 7)
						.prependTo(siteBox);
					
					if(changes[i].content){
						$('<p />').html(changes[i].content).appendTo(content).css({
							maxHeight: 24, 
							overflow: 'hidden'
						});
					}
				}
			} else {
				$('<p />').appendTo(answerList).html('Nothing to see here. Yet. <br />Why not add some answers to your watchlist?').css({
					padding: 30, 
					textAlign: 'center', 
					fontSize: 20, 
					fontWeight: 'bold', 
					color: '#999', 
					lineHeight: 1.4
				});
			}
			
			$('<a />').text('answers').attr('href', '#').click(function(){
				container.children().fadeOut(200, function(){
					answerList.fadeIn(200);
				});
				
				$(this).addClass('seCurrent').parent().siblings().children().removeClass('seCurrent');
				
				return false;
			}).wrap('<li />').parent().appendTo(nav);
			
			answerList.hide().appendTo(container);
		}
	});
	
});
