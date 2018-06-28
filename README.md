# vscode-kanban

[![Share via Facebook](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Facebook.png)](https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban) [![Share via Twitter](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Twitter.png)](https://twitter.com/intent/tweet?source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&text=VSCode%20Kanban:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&via=mjkloubert) [![Share via Google+](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Google+.png)](https://plus.google.com/share?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Pinterest](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Pinterest.png)](http://pinterest.com/pin/create/button/?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&description=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Reddit](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Reddit.png)](http://www.reddit.com/submit?url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban) [![Share via LinkedIn](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/LinkedIn.png)](http://www.linkedin.com/shareArticle?mini=true&url=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&title=VSCode%20Kanban&summary=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.&source=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban) [![Share via Wordpress](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Wordpress.png)](http://wordpress.com/press-this.php?u=https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban&quote=VSCode%20Kanban&s=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.) [![Share via Email](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/share/Email.png)](mailto:?subject=VSCode%20Kanban&body=Visual%20Studio%20Code%20extension%2C%20which%20receives%20and%20shows%20git%20events%20from%20webhooks.:%20https%3A%2F%2Fmarketplace.visualstudio.com%2Fitems%3FitemName%3Dmkloubert.vscode-kanban)


[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/mkloubert.vscode-kanban.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/mkloubert.vscode-kanban.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/mkloubert.vscode-kanban.svg)](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban#review-details)

[Kanban board](https://en.wikipedia.org/wiki/Kanban_board) for [Visual Studio Code](https://code.visualstudio.com/).

![Demo 1](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo1.gif)

## Table of contents

1. [Install](#install-)
2. [How to use](#how-to-use-)
   * [How to execute](#how-to-execute-)
   * [Settings](#settings-)
   * [Markdown support](#markdown-support-)
   * [Diagrams and charts](#diagrams-and-charts-)
   * [Filter](#filter-)
     * [Constants](#constants-)
     * [Functions](#functions-)
   * [Handle events](#handle-events-)
   * [Time tracking](#time-tracking-)
     * [Simple time tracking](#simple-time-tracking-)
     * [Toggl](#toggl-)
     * [Custom time tracking](#custom-time-tracking-)
3. [Customization](#customization-)
   * [CSS](#css-)
4. [Logs](#logs-)
5. [Support and contribute](#support-and-contribute-)
6. [Related projects](#related-projects-)
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
| `cleanupExports` | Remove existing export files, before regenerate them. Default: `(true)` |
| `exportOnSave` | Export cards to external Markdown files on save or not. Default: `(false)` |
| `exportPath` | The custom path where export files, like cards, should be stored. Relative paths will be mapped to the `.vscode` subfolder of the underlying workspace. Default: `.vscode` subfolder of the underlying workspace. |
| `globals` | Custom data, which can be used inside the extension, like [event scripts](#handle-events-). |
| `maxExportNameLength` | The maximum size of the name of an export file. Default: `48` |
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

### Diagrams and charts [[&uarr;](#how-to-use-)]

![Demo 7](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo7.gif)

Card descriptions can also include diagrams and charts, using a language parsed and rendered by [mermaid](https://github.com/knsv/mermaid).

Those diagram / chart descriptions has to be put into a Markdown code block, which uses `mermaid` as language:

    Example graph:
    
    ```mermaid
    graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;
    ```

### Filter [[&uarr;](#how-to-use-)]

![Demo 8](https://raw.githubusercontent.com/mkloubert/vscode-kanban/master/img/demo8.gif)

Cards can be filtered by using a powerful language, provided by [filtrex](https://github.com/joewalnes/filtrex#expressions) library.

### Constants [[&uarr;](#filter-)]

| Name | Description | Example |
| ---- | --------- | --------- |
| `assigned_to` | The value that indicates where the current card is assigned to. | `assigned_to == "Marcel" or assigned_to == "Tanja"` |
| `cat` | Short version of `category`. | `cat == "My Category"` |
| `category` | Stores the unparsed category value of the current card. | `category == "My Category"` |
| `description` | The description of the current card. | `description == "My description"` |
| `details` | The details of the current card. | `details == "My details"` |
| `id` | The ID of the card. | `id == "20180628102654_516121916_3f99e5abbe05420e1e5114d235ded3a2"` |
| `is_bug` | Is `(true)` if card type is `Bug / issue`. | `not is_bug` |
| `is_emerg` | Short version of `is_emergency`. | `is_emerg or is_bug` |
| `is_emergency` | Is `(true)` if card type is `Emergency`. | `is_emergency or is_bug` |
| `is_issue` | Alias of `is_bug`. | `is_bug or is_issue` |
| `is_note` | Is `(true)` if card type is `Note / task`. | `not is_note`|
| `is_task` | Alias of `is_note`. | `not is_task` |
| `prio` | Short version of `priority`. | `prio > 10` |
| `priority` | Stores the priority value. | `priority > 10` |
| `no` | `(false)` | `no == false` |
| `now` | The current local time as UNIX timestamp. | `now > 305413740` |
| `tag` | The tag value. | `tag == "by MK"` |
| `time` | The (creation) time of the card as UNIX timestamp (UTC). | `time > 305413740` |
| `title` | The title of the card. | `title == "My card title"` |
| `type` | The type of the card (lower case). | `type == "bug" or type == "emergency"` |
| `utc` | The current UTC time as UNIX timestamp. | `utc > 305413740` |
| `yes` | `(true)` | `yes == true` |

### Functions [[&uarr;](#filter-)]

| Name | Description | Example |
| ---- | --------- | --------- |
| `concat(...args)` | Handles arguments as strings and concats them to one string. | `concat(5, "9.1", 979) == "59.1979"` |
| `contains(val, searchFor: string)` | Handles a value as a string and searches for a sub string (case insensitive). | `contains(assigned_to, "Marcel")` |
| `debug(val, result? = true)` | Logs a value. | `debug( concat(title, ": ", id) )` |
| `float(val)` | Converts a value to a float number. | `float("5.979") == 5.979` |
| `int(val)` | Short version of `integer()`. | `int("5.979") == 5` |
| `integer(val)` | Converts a value to an integer number. | `integer("5.979") == 5` |
| `is_after(date, alsoSame?: bool = false)` | `(true)`, if a card has been created after a specific time. | `is_after("1979-09-05")` |
| `is_assigned_to(val)` | `(true)`, if a card is assigned to someone (case insensitive). | `is_assigned_to("Marcel Kloubert")` |
| `is_before(date, alsoSame?: bool = false)` | `(true)`, if a card has been created before a specific time. | `is_before("2019-09-05")` |
| `is_cat(name: string)` | Short version of `is_category()`. | `is_cat("My category")` |
| `is_category(name: string)` | `(true)`, if a card belongs to a specific category (case insensitive). | `is_category("My category")` |
| `is_empty(val)` | Converts a value to a string and checks if value is empty or contains whitespace only. | `is_empty(assigned_to)` |
| `is_nan(val, asInt?: bool = false)` | Checks if a value is NOT a number. | `is_nan(prio)` |
| `is_nil(val)` | Checks if a value is `(null)` or `(undefined)`. | `is_nil(category)` |
| `is_older(days: number, alsoSameDay?: bool = false)` | `(true)`, if a card is older than a specific number of days. | `is_older(30)` |
| `is_younger(days: number, alsoSameDay?: bool = false)` | `(true)`, if a card is younger than a specific number of days. | `is_younger(30)` |
| `norm(val)` | Short version of `normalize()`. | `norm(" Marcel Kloubert ") == ""` |
| `normalize(val)` | Converts a value to a string and converts the characters to lower case by removing leading and ending whitespaces. | `norm(" Marcel Kloubert ") == "marcel lloubert"` |
| `number(val)` | Alias of number. | `number("5.979") == 5.979` |
| `regex(val, pattern: string, flags?: string)` | `(true)` if a value matches a regular expression. s. [RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp) | `regex(assigned_to, "^(marcel|tanja)", "i")` |
| `str(val)` | Converts a value to a string. | `str(59.79) == "59.79"` |
| `str_invoke(val, methods: string, ...args)` | Handles a value as string and invokes methods for it. s. [String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) | `str_invoke(assigned_to, "trim,toLowerCase") == "marcel" or str_invoke(assigned_to, "indexOf", 'Marcel') > -1` |
| `unix(val, isUTC?: bool = true)` | Returns the UNIX timestamp of a date/time value. | `time > unix("1979-09-05 23:09:00")` |

For more functions, s. [Expressions](https://github.com/joewalnes/filtrex#expressions).

If a filter expression is invalid or its execution fails, a [log entry](#logs-) will be written.

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

## Logs [[&uarr;](#table-of-contents)]

Log files are stored inside the `.vscode-kanban/.logs` subfolder of the user's home directory, separated by day.

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
