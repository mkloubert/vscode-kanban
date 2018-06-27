# Change Log (vscode-kanban)

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban)

## 1.15.1 (June 27th, 2018; chart and diagram support)

* added chart and diagram support, provided by [mermaid](https://github.com/knsv/mermaid) ... s. [Diagrams and charts](https://github.com/mkloubert/vscode-kanban#diagrams-and-charts-)

![Demo 7](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo7.gif)

* Markdown editors now using syntax highlighting, provided by [CodeMirror](https://codemirror.net/)

## 1.14.0 (June 27th, 2018; link to other cards)

* can add links to other cards now ... s. [issue #9](https://github.com/mkloubert/vscode-kanban/issues/9)

![Demo 6](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo6.gif)

* disabled `ESC` button for popups, which do add and edit cards ... s. [issue #16](https://github.com/mkloubert/vscode-kanban/issues/16)
* design updates
* code cleanups and improvements
* bugfixes
* updated the following [npm](https://www.npmjs.com/) modules:
  * [humanize-duration](https://www.npmjs.com/package/humanize-duration) `^3.15.0`
  * [vscode-helpers](https://www.npmjs.com/package/vscode-helpers) `^2.7.0`

## 1.13.1 (June 12th, 2018; links in Markdown and card exports)

* using links in Markdown is possible now ... s. [issue #7](https://github.com/mkloubert/vscode-kanban/issues/7)
* added `exportOnSave` [setting](https://github.com/mkloubert/vscode-kanban#settings-), which will save cards to external markdown files, if set to `(true)` ... s. [issue #5](https://github.com/mkloubert/vscode-kanban/issues/5)

## 1.12.0 (June 10th, 2018; card details)

* added additional detail area for cards ... s. [issue #5](https://github.com/mkloubert/vscode-kanban/issues/5)

![Demo 5](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo5.gif)

* code cleanups and improvements
* bugfixes

## 1.11.2 (June 9th, 2018; user categories)

* can now define user defined categories ... s. [issue #1](https://github.com/mkloubert/vscode-kanban/issues/1)

![Screenshot 2](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/screenshot2.png)

* can define custom [CSS styles](https://github.com/mkloubert/vscode-kanban#css-) for boards now

## 1.10.0 (June 3rd, 2018; time tracking)

* added `noTimeTrackingIfIdle` [setting](https://github.com/mkloubert/vscode-kanban#settings-), which can be set to `(true)` to hide 'track time' button in cards, if they are stored in `Todo` or `Done` column

## 1.9.1 (June 3rd, 2018; time tracking)

* added [track time](https://github.com/mkloubert/vscode-kanban#time-tracking-) feature:

![Demo 3](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo3.gif)

with support for [Toggl](https://github.com/mkloubert/vscode-kanban#toggl-):

![Demo 4](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo4.gif)

## 1.8.0 (June 1st, 2018; progress bars)

* progress bars are displayed, when using task lists in descriptions:

![Demo 2](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo2.gif)

* added reload button and fixed bug when bringing board to foreground, s. [issue #4](https://github.com/mkloubert/vscode-kanban/issues/4):

![Screenshot 1](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/screenshot1.png)

* improved card design

## 1.7.0 (June 1st, 2018; custom card data)

* now can set custom data to `tag` property of cards via [event scripts](https://github.com/mkloubert/vscode-kanban#handle-events-), e.g.

## 1.6.0 (May 31st, 2018; design improvements)

* improved design of cards

![Demo 1](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo1.gif)

* bugfixes

## 1.5.1 (May 31st, 2018; markdown support)

* added [Markdown support](https://github.com/mkloubert/vscode-kanban#markdown-support-) for card descriptions
* bugfixes

## 1.4.0 (May 31st, 2018; access modules of extension from scripts)

* added `require()` method to [EventScriptFunctionArguments](https://mkloubert.github.io/vscode-kanban/interfaces/_workspaces_.eventscriptfunctionarguments.html) interface, which can also access the [modules of that extension](https://github.com/mkloubert/vscode-kanban/blob/master/package.json)

## 1.3.0 (May 30th, 2018; creation time and handling events)

* creation time is displayed in the left bottom corner of a card now (only available for new cards), s. [issue #2](https://github.com/mkloubert/vscode-kanban/issues/2)
* can handle events via [scripts](https://github.com/mkloubert/vscode-kanban#handle-events-) now

## 1.2.2 (May 29th, 2018; 'assigned to' and priority)

* added `Assigned To` and `Prio` fields for cards

## 1.1.0 (May 28th, 2018; board title)

* title of board is updated with the name of the underlying workspace after initialization now

## 1.0.1 (May 27th, 2018; initial release)

For more information about the extension, that a look at the [project page](https://github.com/mkloubert/vscode-kanban).
