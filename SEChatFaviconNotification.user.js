// ==UserScript==
// @name           Stack Overflow Chat Favicon Notifier
// @namespace      yijiang
// @description    Watches the SO Chat for new messages, and changes the Favicon accordingly
// @include        http://chat.stackoverflow.com/rooms/*
// @include        http://chat.meta.stackoverflow.com/rooms/*
// ==/UserScript==


var title = document.title;

setInterval(function(){
		if(title !== document.title){
			title = document.title;
			var times, mention = false, ctitle = title;

			if(title.indexOf('(') === 0){
				ctitle = title.substring(1, title.indexOf(')'));
				if(ctitle.indexOf('*') > -1){
					mention = true;
				
					if(ctitle.length === 1){
						times = 0;
					} else {
						times = parseInt(ctitle, 10);
					}
				} else {
					times = parseInt(ctitle, 10);
				}

			} else {
				times = 0;
			}
			
			var url = (times > 0) ? 'http://dl.dropbox.com/u/1722364/so-favicon/so-' + (times > 30 ? 31 : times) + (mention ? 'm' : '') + '.png' : 'http://sstatic.net/stackoverflow/img/favicon.ico';
			var headElements = document.getElementsByTagName('head')[0].childNodes;
								
			for(var i = 0; i < headElements.length; i++){
			    if(headElements[i].tagName === 'LINK' && headElements[i].getAttribute('rel').indexOf('shortcut') > -1){
			        var newLink = headElements[i].cloneNode(false);
			        newLink.href = url;
			        document.getElementsByTagName('head')[0].replaceChild(newLink, headElements[i]);
			        break;
			    }
			}
		}
	
}, 500);
