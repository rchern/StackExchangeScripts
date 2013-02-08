// ==UserScript==
// @name           Stack Exchange Reputation Audit Helper
// @namespace      yijiang
// @include        http://stackoverflow.com/reputation
// @include        http://meta.stackoverflow.com/reputation
// @include        http://superuser.com/reputation
// @include        http://serverfault.com/reputation
// @include        http://askubuntu.com/reputation
// @include        http://answers.onstartups.com/reputation
// @include        http://stackapps.com/reputation
// @include        http://*.stackexchange.com/reputation
// ==/UserScript==

(function(){
	function json (data) {
		var sites = data.api_sites,
			list = document.createElement('div');
		
		list.innerHTML = "more reputation: <br>";
		list.style.position = 'absolute';
		list.style.top = 0;
		list.style.left = '40em';
		list.style.fontFamily = 'Ubuntu, Arial, sans-serif';
		list.style.lineHeight = '1.8em';
		
		document.body.appendChild(list);
		
		for(var i = 0; i < sites.length; i++) {
			// Exclude SE 2.0 linked Metas
			if(sites[i].state !== 'linked_meta') {
				var a = document.createElement('a'),
					icon = document.createElement('img');
				
				// Include the favicon in the link
				icon.src = sites[i].icon_url.replace('apple-touch-icon.png', 'favicon.ico');
				icon.style.border = '0';
				icon.style.verticalAlign = 'middle';
				icon.style.paddingRight = '3px';
				
				a.href = sites[i].site_url + '/reputation';
				a.style.color = '#999';
				a.style.display = 'block';
				
				a.appendChild(icon);
				a.innerHTML += sites[i].name;
				
				// Stick ya links in the pre element
				list.appendChild(a);
			}
		}
	}
	
	function spaces (n) {
		if (n < 0) return '';
		return new Array(n + 1).join(' ');
	}
	
	function inObject (value, obj) {
		for(var i in obj) {
			if(i === value) return obj[i];
		}
		
		return false;
	}
	
	var voteTypesComplex = {
		1: {
			15: 'your answer accepted',
			2: 'answer accepted by you'
		},
		3: {
			'-1': 'downvote by you',
			'-2': 'downvote to you'
		}
	}, voteTypeSimple = {
		2: 'upvote',
		4: 'penalty for post flagged as offensive',
		8: 'bounty granted by you',
		9: 'bounty awarded to you',
		12: 'penalty for post flagged as spam',
		16: 'post edit accepted'
	};
	
	var pre = document.getElementsByTagName('pre')[0],
		html = pre.innerHTML,
		lines = html.split(/\n/g),
		maxLen = Math.max.apply(Math, lines.filter(function(c){
			var n = c.split(/\s/g)[1];
			return !c || inObject(n, voteTypesComplex) || inObject(n, voteTypeSimple);
		}).map(function(c){
			return c.length;
		}));
	
	for(var i = 0; i < lines.length; i++) {
		var chunks = lines[i].split(/\s+/g);
		
		if(chunks.length > 3) {
			if(inObject(chunks[1], voteTypesComplex)) {
				chunks.push(voteTypesComplex[chunks[1]][(/^[([](-?\d+)[)\]]$/).exec(chunks[3])[1]]);
			} else if(inObject(chunks[1], voteTypeSimple)) {
				chunks.push(voteTypeSimple[chunks[1]]);
			}
			
			if(!isNaN(chunks[1]) && chunks[0] !== 'earned') {
				lines[i] = spaces(1) + chunks[1] + spaces(2) + chunks[2] + spaces(10 - chunks[2].length - chunks[1].length) + chunks[3] + spaces(maxLen - lines[i].length + 3) + chunks[4];
			}
		}
	}
	
	html = lines.join('\n');
	
	// link the question/post id
	html = html.replace(/^\s*(12|16|1|2|3|4|8|9)\s*(\d+)/gm, " $1   <a href='http://" + window.location.host + "/q/$2'>$2</a>");
	
	pre.innerHTML = html;
	
	// Inject json function into page
	var script = document.createElement('script');
	script.innerHTML = json.toString();
	document.getElementsByTagName('head')[0].appendChild(script);
	
	// Grab site list from StackAuth
	var jsonScript = document.createElement('script');
	jsonScript.src = 'http://stackauth.com/1.0/sites?jsonp=json';
	
	document.getElementsByTagName('head')[0].appendChild(jsonScript);
})();
