##SEChatModifications
Provides keyboard shortcuts and other commands via input text reducing the dependency on mouse usage.  Currently the script adds the id to the right of each message and the commands take in this id to identify the selected message.  Keyboard navigation support is also planned.

* Star a message
  * `/star <id>`
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
* Add a highlight to messages
  * `/addhl <match>`
  * `<match>` is the numeric id of a single message, or a (partial) substring of a username
  * Uses localStorage to persist highlights
* Remove a highlight from messages
  * `/delhl <match>`
  * `<match>` is the numeric id of a single message, or a (partial) substring of a username
  * `<match>` must be identical to the match used with `/addhl`
* View all highlights
  * `/highlights`
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
  * [site] will match for common abbreviations like SO, SF and NTI before defaulting to site.stackexchange.com.
* Retry a rate limited message
  * Hit `ctrl+space` to resend the message.
* Navigate messages with keyboard
  * `Ctrl` + `Up Arrow` begins navigation
  * `Ctrl` + `Down Arrow` cancels navigation and jumps to message input
  * `Up Arrow` and `Down Arrow` navigate between messages
  * On a selected message:
    * `Q` quotes the selected message
    * `E` edits the selected message
    * `R` begins a reply to the selected message
    * `D` removes the selected message
    * `Right Arrow` edits or begins a reply to the selected message, depending on if you own it


##SEModifications
Provides minor tweaks to StackExchange sites.

* Adds a timeline link to each question page
* Turns comment timestamps into links to the comment
  * Will only work if the comment is visible when the page is linked to.