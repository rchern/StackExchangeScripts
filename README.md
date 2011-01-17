##SEChatModifications
Provides keyboard shortcuts and other commands via input text reducing the dependency on mouse usage.  Currently the script adds the id to the right of each message and the commands take in this id to identify the selected message.  Keyboard navigation support is also planned.

* View list of all keyboard commands (except navigation)
  *. `/help`
* Star a message
  * `/star <id>`
  * `<id>` is the numeric id of a message
* Flag a message
  * `/start <id>`
  * `<id>` is the numeric id of a message
* Quote a message
  * `/quote <id>`
  * `<id>` is the numeric id of a message
* Reply to a message
  * Begin your message with `:<id> `
  * Example:  `:12345 hi yourself`
  * This is not a /command because it is built-in chat functionality
* Switch to another room
  * `/switch <match>`
  * `<match>` is any (partial) substring of the room name
  * Will only work if only a single room name matches the input
* View the transcript
  * `/transcript [match]`
  * If `[match]` is specified, it will be used to search the transcript.
* Load older messages
  * `/load`
* /me support
  * `/me <action text>`
  * Wraps `<action text>` in asterisks so that the output will be italic and sends to the room
* Toggle highlight on messages
  * `/hl <match>`
  * `<match>` is the numeric id of a single message, or a (partial) substring of a username
  * `/hl`
  * if called with no parameters, shows a clickable list of all highlights 
  * Uses localStorage to persist highlights
* Scroll to the last message from a user
  * `/last <match>`
  * `<match>` is a (partial) substring of a username
* List rooms with recent activity
  * `/list [match]`
  * If `[match]` is specified, it will be used to filter the rooms
* Join a room
  * `/join <id>`
  * `<id>` is the numeric id of the room
  * Doing `/list` first will give you the numeric ids
  * You do not have to be in the room already
* Edit a message
  * `/edit [id]`
  * `<id>` is the numeric id of the message you want to edit
  * Leave `<id>` blank to edit the last message
  * Messages may only be edited within 2 minutes of being posted. (Does not apply to mods)
* Delete a message
  * `/del [id]`
  * `<id>` is the numeric id of the message you want to edit
  * Leave `<id>` blank to delete the last message
  * Messages may only be deleted within 2 minutes of being posted.  (Does not apply to mods)
* Leave a room
  * `/leave [match]`
  * If `[match]` is not specified, then the current room will be used.
  * If `[match]` is a numeric id, then that room will be used.
  * If `[match]` is the word `all`, then all rooms will be used.
  * If `[match]` is a string, then it is assumed to be a (partial) substring of a room name.
* View a user profile
  * `/profile [site] <display name>`
  * `[site]` will match for common abbreviations like SO, SF and NTI before defaulting to site.stackexchange.com.
* Pseudo-Oneboxes
  * `/ob [url]` will create onebox-like series of messages that attempt to add onebox support for sites not "officially supported"
    * **Vimeo:** Video links will be turned into a preview frame image of the video plus a link to the video in question. *Only the link, not the image, will take you to the video.*
    * Supported URL formats:
      * `http://vimeo.com/{video-id}`
      * `http://vimeo.com/channels/{channel-name}#{video-id}`
      * `htt[://vimeo.com/category/{group-name}/videos/{video-id}`
  * This feature is currently undergoing development so **any suggestions on what other sites to add and feedback on how it works will be very welcome.**
* View message history
  * `/history <id>`
  * `<id>` is the numeric id of a message
* Clipboard
  * The clipboard is a place to store messages and notes to yourself
  * `/jot [match]` is used to take down messages or notes.
    * If `[match]` is a number, than the message with that id is taken down into the clipboard,
      else everything else after `/jot` is stored into the clipboard as a note.
    * After jotting down things into the clipboard, an id will be shown.
      This id will be used to refer to the note when pasting or removing the message from the clipboard.
  * `/clips` will show a list of all messages and notes taken. Clips and also be managed from here.
  * `/paste [id]` if a message is pasted, that message will be **quoted**, else a new message with the note's content will be generated
  * `/rmclip [id]` will remove the clip with that id from the clipboard
* Retry a rate limited message
  * Hit `ctrl+space` to resend the message.
* Jump to a message
  * `/jump [id]` if the message is still in the chat window, chat will scroll to it and it will be keyboard-navigation selected, otherwise the message will open in the transcript
* Navigate messages with keyboard
  * `Ctrl` + `Up Arrow` begins navigation
  * `Ctrl` + `Down Arrow` cancels navigation and jumps to message input
  * `Up Arrow` and `Down Arrow` navigate between messages
    * `Page Up` and `Page Down` navigate more quickly (5 messages at a time)
  * On a selected message:
    * `Q` quotes the selected message
    * `E` edits the selected message
    * `R` begins a reply to the selected message
    * `D` removes the selected message
    * `S` stars the selected message
    * `H` shows the history of the message
    * `F` puts the command to flag a message in the input box
    * `J` jumps to the replied-to message, if the selected message is an explicit reply
    * `Right Arrow` edits or begins a reply to the selected message, depending on if you own it
    * `Left Arrow` and `P` display the replied-to message, if the selected message is an explicit reply


##SEModifications
Provides minor tweaks to StackExchange sites.

* Adds a timeline link to each question page
* Turns comment timestamps into links to the comment
  * Will only work if the comment is visible when the page is linked to (Unless you have this script).
* Adds audit link to /reputation
* Adds history link to each question and answer
* Adds chat-like autocomplete for comments, in a way (relatively) consistent with [these criteria](http://meta.stackoverflow.com/questions/43019/how-do-comment-replies-work/43020#43020)

##SEChatFaviconNotifier
Adds unread count and @-mention notifications directly to the favicon of the chatroom page. The circle shows the number of unread messages and turns green when someone @-mentions you.

##SEAnswerWatcher

**Warning: This script is not finished and may include defects / missing features.** Adds a 'answers' tab to the StackExchange SuperColliding Dropdown Menu. Answers and tag wikis can then be watched and the user be notified when new comments arrives, or when the answer is edited. This script is an experiment in exploring if userscripts could be made to integrate with the MultiCollider SuperDropdown. 
