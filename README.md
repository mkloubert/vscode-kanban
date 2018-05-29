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
3. [Support and contribute](#support-and-contribute-)
4. [Related projects](#related-projects-)
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
| `openOnStartup` | Opens a board, after a workspace (folder) has been loaded. Default: `(false)` |

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

## Related projects [[&uarr;](#table-of-contents)]

### vscode-helpers [[&uarr;](#related-projects-)]

[vscode-helpers](https://github.com/mkloubert/vscode-helpers) is a NPM module, which you can use in your own [VSCode extension](https://code.visualstudio.com/docs/extensions/overview) and contains a lot of helpful classes and functions.
