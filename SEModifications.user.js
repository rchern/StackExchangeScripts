// ==UserScript==
// @name         SE Modifications
// @description  A collection of modifications for the Stack Exchange network of sites
// @match        *://stackoverflow.com/*
// @match        *://meta.stackoverflow.com/*
// @match        *://superuser.com/*
// @match        *://meta.superuser.com/*
// @match        *://serverfault.com/*
// @match        *://meta.serverfault.com/*
// @match        *://askubuntu.com/*
// @match        *://meta.askubuntu.com/*
// @match        *://*.stackexchange.com/*
// @match        *://answers.onstartups.com/*
// @match        *://meta.answers.onstartups.com/*
// @match        *://stackapps.com/*
// @match        *://mathoverflow.net/*
// @exclude      http://chat.stackexchange.com/*
// @exclude      http://chat.*.stackexchange.com/*
// @exclude      http://api.*.stackexchange.com/*
// @exclude      http://data.stackexchange.com/*
// @exclude      http://*/reputation
// @author       @rchern
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
    var profile = $('#hlinks-user a.profile-link'),
        My = {
            'name': profile.text(),
            'profile': profile.attr('href')
        };
    
    $(function () {
        // Initialize the general stuff here
        var locationBits = location.hostname.split('.');
        
        if(locationBits[0] !== 'discuss' && (locationBits[0] !== 'meta' || locationBits[1] === 'stackoverflow')) {
            if (window.profileLink) {
                var initialized = false;
                
                profileLink._show = profileLink.show;
                profileLink.show = function (u, v) {
                    profileLink._show(u, v);
                    
                    if (!initialized && (initialized = true)) {
                        $('<li><a href="/reputation" title="view reputation audit">audit</a></li>').appendTo('.profile-links');
                    }
                };
            }
        }
        
        initQuestions();
        initPostRevisions();
        //initSearchResults();
    });
    
    /*
     * Initializes functionality that only appears on the questions page:
     *   - Question timeline linking
     *   - Explicit post history linking
     *   - Comment linking
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

        var post = question.replace("questions", "posts").replace(/\/[^\/]*$/, ""),
            timeline = post + "/timeline",
            revisions = post + "/revisions",
            questionPost = $('#question'),
            ownedByMe = $('.post-signature', questionPost).length == 2 && $('.post-signature.owner .user-details a:first').attr('href') === My.profile;
        $(".post-menu", questionPost).append(
            (ownedByMe ? "<br>" : "<span class='lsep'>|</span>") +
            "<a " + (ownedByMe ? 'style="line-height:1.8em;"' : "") + "href='" + timeline + "'>timeline</a>"
        );
        $(".post-menu").each(function() {
            var self = $(this),
                postLink = question,
                id = self.find("a.short-link")[0].href.replace(/^.*\/a\//, "").replace(/\/\d+(?:#.*)?$/, "");;

            if (!revisions) {
                revisions = "/posts/" + id + "/revisions";
                postLink = postLink + '/' + id;
            }

            self.append("<span class='lsep'>|</span><a href='" + revisions + "'>history</a>")
                .find('a').each(function () {
                    var nodes = this.childNodes, i;
                    
                    for (i = 0; i < nodes.length; ++i) {
                        if (nodes[i].nodeType == Node.TEXT_NODE) {
                            nodes[i].nodeValue = nodes[i].nodeValue.replace(/ +/g, '\u00a0');
                        }
                    }
                });

            revisions = null;
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
     *   - Removing/untaggifying tags from search results
     */
    function initSearchResults() {
        var tagpage = false;
    
        if (location.pathname.indexOf('/search') !== 0 &&
                !(tagpage = (location.pathname.indexOf('/questions/tagged/') === 0))) {
            return;
        }
        
        function on() {
            $(this).animate({ 'opacity': 1 }, 750);
        }
        
        function off() {
            $(this).animate({ 'opacity': 0 }, 750);
        }
        
        var criteria,
            tags = $('#sidebar .tagged a.post-tag');
            
        tags.each(function () {
            var tag = $(this),
                wrapper = $('<div class="tag-wrapper"></div>')
                    .append(
                        $('<span class="modify-options">')
                            .append(
                                $('<span class="quote-tag" title="change into search term">"</span>')
                                    .click(function () {
                                        updateCriteria(tag.text(), '"', true);
                                        wrapper.fadeOutAndRemove();
                                    })
                                    .add('<span class="remove-tag" title="remove from search">\u00D7</span>')
                                    .css({
                                        'font-family': 'Consolas, monospace',
                                        'border-radius': '7px 7px',
                                        'display': 'inline-block',
                                        'width': '15px',
                                        'height': '15px',
                                        'margin-right': '3px',
                                        'text-align': 'center',
                                        'border': '1px solid #915857',
                                        'cursor': 'pointer'
                                    })
                                    .last()
                                    .click(function () {
                                        updateCriteria(tag.text(), false, true);
                                    })
                                    .end()
                            )
                            .css({
                                'margin-left': '5px',
                                'color': '#6C0000',
                                'font-weight': 'bold',
                                'opacity': 0
                            })
                            .hover(on, off)
                    )
                    .insertBefore(this)
                    .prepend(this);
                    
            // Should just not add it in the first place, will fix later
            if (tagpage && tags.length === 1) {
                wrapper.find('.remove-tag').remove();
            }
        });
        
        function updateCriteria(existing, update, isTag) {
            update = !update ? '' : update + existing + update;
            
            if (isTag) {
                existing = '\\[' + existing + '\\]|' + existing;
            }
            
            var search = $('#search'), input = search.find('input[name="q"]');
            
            // Temporary until I expand on this feature
            input.val(
                input.val()
                    .replace(new RegExp('(^| )(' + existing + ')( |$)'), '$1' + update + '$3')
                    .replace(/^ +|  +$/, '')
            );
            search.submit();
        }
    }
});
