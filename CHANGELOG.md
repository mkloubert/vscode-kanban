# Change Log (vscode-kanban)

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban)

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
