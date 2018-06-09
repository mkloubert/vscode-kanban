# vscode-kanban

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban)


[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/mkloubert.vscode-kanban.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/mkloubert.vscode-kanban.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/mkloubert.vscode-kanban.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban#review-details)

[Kanban board](https://en.wikipedia.org/wiki/Kanban_board) for [Visual Studio Code](https://code.visualstudio.com/).

![Demo 1](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo1.gif)

1. [Install](#install-)
2. [How to use](#how-to-use-)
   * [How to execute](#how-to-execute-)
   * [Settings](#settings-)
   * [Markdown support](#markdown-support-)
   * [Handle events](#handle-events-)
   * [Time tracking](#time-tracking-)
     * [Simple time tracking](#simple-time-tracking-)
     * [Toggl](#toggl-)
     * [Custom time tracking](#custom-time-tracking-)
3. [Customization](#customization-)
   * [CSS](#css-)
4. [Support and contribute](#support-and-contribute-)
5. [Related projects](#related-projects-)
   * [vscode-helpers](#vscode-helpers-)

Launch VS Code Quick Open (`Ctrl + P`), paste the following command, and press enter:

```bash
ext install vscode-kanban
```

Or search for things like `vscode-kanban` in your editor.

## How to use [[&uarr;](#table-of-contents)]

### How to execute [[&uarr;](#how-to-use-)]

Press `F1` and enter one of the following commands:

| Name | Description | command |
| ---- | --------- | --------- |
| `Kanban: Open Board ...` | Opens a kanban board of a workspace (folder). | `extension.kanban.openBoard` |

### Settings [[&uarr;](#how-to-use-)]

Open (or create) your `settings.json` in your `.vscode` subfolder of your workspace or edit the global settings (`File >> Preferences >> Settings`).

Add a `kanban` section:

```json
{
    "kanban": {
        "openOnStartup": true
    }
}
```

| Name | Description |
| ---- | --------- |
| `noScmUser` | Do not detect username via source control manager like Git. Default: `(false)` |
| `noSystemUser` | Do not detect username of operating system. Default: `(false)` |
| `noTimeTrackingIfIdle` | Do not show 'track time' button, if a card is stored in 'Todo' or 'Done'. Default: `(false)` |
| `openOnStartup` | Opens a board, after a workspace (folder) has been loaded. Default: `(false)` |
| `trackTime` | Settings for [time tracking](#time-tracking-) feature. Default: `(false)` |

### Markdown support [[&uarr;](#how-to-use-)]

Card descriptions can be formatted with [Markdown](https://en.wikipedia.org/wiki/Markdown), which is parsed by [Showndown](https://github.com/showdownjs/showdown) library.

The extension uses the following [settings](https://github.com/showdownjs/showdown#valid-options):

```json
{
    "completeHTMLDocument": false,
    "encodeEmails": true,
    "ghCodeBlocks": true,
    "ghCompatibleHeaderId": true,
    "headerLevelStart": 3,
    "openLinksInNewWindow": true,
    "simpleLineBreaks": true,
    "simplifiedAutoLink": true,
    "strikethrough": true,
    "tables": true,
    "tasklists": true
}
```

Code blocks are parsed by [highlight.js](https://highlightjs.org/) and all [provided languages](https://highlightjs.org/static/demo/) are included and supported.

### Handle events [[&uarr;](#how-to-use-)]

For handling events, you can create a [Node.js](https://nodejs.org/) JavaScript file, called `vscode-kanban.js`, inside your `.vscode` subfolder of your workspace and start with the following skeleton (s. [EventScriptModule](https://mkloubert.github.io/vscode-kanban/interfaces/_workspaces_.eventscriptmodule.html) interface):

```javascript
// all 'args' parameters are based on
// 'EventScriptFunctionArguments' interface
// 
// s. https://mkloubert.github.io/vscode-kanban/interfaces/_workspaces_.eventscriptfunctionarguments.html

// use any Node.js 7 API, s. https://nodejs.org/
const fs = require('fs');
// use VSCode API, s. https://code.visualstudio.com/docs/extensionAPI/vscode-api
const vscode = require('vscode');

// [OPTIONAL]
// 
// Is raised after a CARD has been CREATED.
exports.onCardCreated = async (args) => {
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.cardcreatedeventdata.html

    // access a module of that extension
    // s. https://github.com/mkloubert/vscode-kanban/blob/master/package.json
    const FSExtra = args.require('fs-extra');

    // write own data to
    // 'tag' property of a card (args.tag)
    // 
    // also works in:
    // - onCardMoved()
    // - onCardUpdated()
    await args.setTag( 'Any JSON serializable data.' );    
};

// [OPTIONAL]
// 
// Is raised after a CARD has been DELETED.
exports.onCardDeleted = async (args) => {
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.carddeletedeventdata.html
};

// [OPTIONAL]
// 
// Is raised after a CARD has been MOVED.
exports.onCardMoved = async (args) => {
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.cardmovedeventdata.html
};

// [OPTIONAL]
// 
// Is raised after a CARD has been UPDATED.
exports.onCardUpdated = async (args) => {
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.cardupdatedeventdata.html
};

// [OPTIONAL]
// 
// Is raised after a column has been cleared.
exports.onColumnCleared = async (args) => {
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.columnclearedeventdata.html
};

// [OPTIONAL]
// 
// Is raised when an user clicks on a card's 'Track Time' button.
// This requires global extension / workspace setting 'canTrackTime' to be set to (true).
exports.onTrackTime = async (args) => {
    // args => https://mkloubert.github.io/vscode-kanban/interfaces/_workspaces_.eventscriptfunctionarguments.html
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.tracktimeeventarguments.html
};


// [OPTIONAL]
// 
// Generic fallback function, if a function is not defined for an event.
exports.onEvent = async (args) => {
    // args.name => name of the event
    // args.data => object with event data  
};
```

### Time tracking [[&uarr;](#how-to-use-)]

### Simple time tracking [[&uarr;](#time-tracking-)]

![Demo 3](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo3.gif)

Set the value of `trackTime` inside your `.vscode/settings.json` to `(true)`:

```json
{
    "kanban": {
        "trackTime": true
    }
}
```

This will run a simple workflow, which writes all required data to the `tag` property of the underlying card (s. `.vscode/vscode-kanban.json`).

### Toggl [[&uarr;](#time-tracking-)]

![Demo 4](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo4.gif)

To use the build-in [Toggl](https://www.toggl.com/) integration, you have to setup your personal API token, which can you find in your profile settings:

```json
{
    "kanban": {
        "trackTime": {
            "type": "toggl",
            "token": "<YOUR-API-TOKEN>"
        }
    }
}
```

If you do not want (or if you not able) to save the token in the settings, you can define the path to a text file, which contains it.

For example, create a text file inside your home directory, like `toggl.txt`, and write the token there. After that, you must define the path of the text file in the settings (`.vscode/settings.json`):

```json
{
    "kanban": {
        "trackTime": {
            "type": "toggl",
            "token": "toggl.txt"
        }
    }
}
```

You also can define an absolute path, like `D:/toggl/api-token.txt` or `/home/mkloubert/toggl-api-token.txt`.

For the case, your board belongs to a specific Toggl project and you know its ID, you can define it explicitly:

```json
{
    "kanban": {
        "trackTime": {
            "type": "toggl",
            "token": "<API-TOKEN>",

            "project": 123
        }
    }
}
```

### Custom time tracking [[&uarr;](#time-tracking-)]

For handling 'track time' events, you can create or edit a [Node.js](https://nodejs.org/) JavaScript file, called `vscode-kanban.js`, inside your `.vscode` subfolder of your workspace and add the following function:

```javascript
exports.onTrackTime = async (args) => {
    // args => https://mkloubert.github.io/vscode-kanban/interfaces/_workspaces_.eventscriptfunctionarguments.html
    // args.data => s. https://mkloubert.github.io/vscode-kanban/interfaces/_boards_.tracktimeeventarguments.html

    // use any Node.js 7 API, s. https://nodejs.org/
    const fs = require('fs');

    // use VSCode API, s. https://code.visualstudio.com/docs/extensionAPI/vscode-api
    const vscode = require('vscode');

    // access a module of that extension
    // s. https://github.com/mkloubert/vscode-kanban/blob/master/package.json
    const moment = args.require('moment');

    // options from the settings, s. below
    const OPTS = args.options;


    // start implement your workflow here
};
```

You also have to update the extension settings:

```json
{
    "kanban": {
        "trackTime": {
            "type": "script",
            "options": {
                "MK": 239.79,
                "TM": "5979"
            }
        }
    }
}
```

## Customization [[&uarr;](#table-of-contents)]

### CSS [[&uarr;](#customization-)]

If you want to style your board, you can create a file, called `vscode-kanban.css`, inside your `.vscode` sub folder of the underlying workspace or your home directory.

Have a look at the files [board.css](https://github.com/mkloubert/vscode-kanban/blob/master/src/res/css/board.css) and [style.css](https://github.com/mkloubert/vscode-kanban/blob/master/src/res/css/style.css) to get an idea of the CSS classes, that are used.

## Support and contribute [[&uarr;](#table-of-contents)]

If you like the extension, you can support the project by sending a [donation via PayPal](https://paypal.me/MarcelKloubert) to [me](https://github.com/mkloubert).

To contribute, you can [open an issue](https://github.com/mkloubert/vscode-kanban/issues) and/or fork this repository.

To work with the code:

* clone [this repository](https://github.com/mkloubert/vscode-kanban)
* create and change to a new branch, like `git checkout -b my_new_feature`
* run `npm install` from your project folder
* open that project folder in Visual Studio Code
* now you can edit and debug there
* commit your changes to your new branch and sync it with your forked GitHub repo
* make a [pull request](https://github.com/mkloubert/vscode-kanban/pulls)

The complete API documentation can be found [here](https://mkloubert.github.io/vscode-kanban/).

## Related projects [[&uarr;](#table-of-contents)]

### vscode-helpers [[&uarr;](#related-projects-)]

[vscode-helpers](https://github.com/mkloubert/vscode-helpers) is a NPM module, which you can use in your own [VSCode extension](https://code.visualstudio.com/docs/extensions/overview) and contains a lot of helpful classes and functions.
