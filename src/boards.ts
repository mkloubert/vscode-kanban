/**
 * This file is part of the vscode-kanban distribution.
 * Copyright (c) Marcel Joachim Kloubert.
 *
 * vscode-kanban is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-kanban is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import * as Path from 'path';
import * as vsckb from './extension';
import * as vsckb_html from './html';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * Options for opening a board.
 */
export interface OpenBoardOptions {
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
    /**
     * The title for the view.
     */
    title?: string;
}

interface WebViewMessage extends vsckb.WebViewMessage {
}

/**
 * A kanban board.
 */
export class KanbanBoard extends vscode_helpers.DisposableBase {
    private _html: string | false = false;
    private _openOptions: OpenBoardOptions;
    private _panel: vscode.WebviewPanel;

    /**
     * Returns an URI from the 'resources' directory.
     *
     * @param {string} p The (relative) path.
     *
     * @return {vscode.Uri} The URI.
     */
    public getResourceUri(p: string): vscode.Uri {
        p = vscode_helpers.toStringSafe(p);

        let u: vscode.Uri;

        for (const R of vsckb.getWebViewResourceUris()) {
            const PATH_TO_CHECK = Path.resolve(
                Path.join(R.fsPath, p)
            );

            u = vscode.Uri.file( PATH_TO_CHECK ).with({
                scheme: 'vscode-resource'
            });

            try {
                if (vscode_helpers.isFileSync(PATH_TO_CHECK)) {
                    break;
                }
            } catch { }
        }

        return u;
    }

    /**
     * Initializes the board.
     */
    public async initialize() {
        const GET_RES_URI = (p: string) => {
            return this.getResourceUri(p);
        };

        this._html = vsckb_html.generateHtmlDocument({
            getContent: () => {
                return `
<main role="main" class="container-fluid h-100">
    <div class="row h-100">
        <div class="col col-6 col-md-3 h-100">
            <div class="card text-dark bg-secondary vsckb-card" id="vsckb-card-todo">
                <div class="card-header">
                    <span class="vsckb-title">Todo</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm btn-dark vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus-circle text-white" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body h-100">&nbsp;</div>
            </div>
        </div>

        <div class="col col-6 col-md-3 h-100">
            <div class="card text-white bg-primary vsckb-card" id="vsckb-card-in-progress">
                <div class="card-header">
                    <span class="vsckb-title">In Progress</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm btn-dark vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus-circle text-white" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body h-100">&nbsp;</div>
            </div>
        </div>

        <div class="col col-6 col-md-3 h-100">
            <div class="card text-white bg-warning vsckb-card" id="vsckb-card-testing">
                <div class="card-header">
                    <span class="vsckb-title">Testing</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm btn-dark vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus-circle text-white" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body h-100">&nbsp;</div>
            </div>
        </div>

        <div class="col col-6 col-md-3 h-100">
            <div class="card text-white bg-success vsckb-card" id="vsckb-card-done">
                <div class="card-header">
                    <span class="vsckb-title">Done</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm btn-dark vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus-circle text-white" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body h-100">&nbsp;</div>
            </div>
        </div>
    </div>
</main>
`;
            },
            getFooter: () => {
                return `
<div class="modal" tabindex="-1" role="dialog" id="vsckb-add-card-modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Add Card</h5>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">
                <form>
                    <div class="form-group">
                        <label for="vsckb-new-card-title">Title</label>
                        <input type="text" class="form-control" id="vsckb-new-card-title">
                    </div>

                    <div class="form-group">
                        <label for="vsckb-new-card-description">Title</label>
                        <textarea class="form-control" id="vsckb-new-card-description" rows="10"></textarea>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <a class="btn btn-primary text-white">
                    <i class="fa fa-plus-circle" aria-hidden="true"></i>

                    <span>Add</span>
                </a>
            </div>
        </div>
    </div>
</div>
`;
            },
            getResourceUri: GET_RES_URI,
            name: 'board',
        });
    }

    /**
     * Is invoked after the underlying panel has been disposed.
     */
    protected onDispose() {
        vscode_helpers.tryDispose(this._panel);
    }

    /**
     * Opens the board.
     *
     * @param {OpenBoardOptions} [opts] The options.
     *
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    public async open(opts?: OpenBoardOptions) {
        if (this._panel) {
            return false;
        }

        if (_.isNil(opts)) {
            opts = <any>{};
        }

        let title = vscode_helpers.toStringSafe(opts.title).trim();
        if ('' === title) {
            title = 'New HTTP Request';
        }

        let showOptions = opts.showOptions;
        if (_.isNil(showOptions)) {
            showOptions = vscode.ViewColumn.One;
        }

        let newPanel: vscode.WebviewPanel;
        try {
            newPanel = vscode.window.createWebviewPanel(
                'vscodeKanbanBoard',
                title,
                showOptions,
                {
                    enableCommandUris: true,
                    enableFindWidget: true,
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: vsckb.getWebViewResourceUris(),
                }
            );

            newPanel.webview.onDidReceiveMessage((msg: WebViewMessage) => {
                try {
                    let action: Function;

                    switch (msg.command) {
                        case 'log':
                            action = () => {
                                try {
                                    if (!_.isNil(msg.data) && !_.isNil(msg.data.message)) {
                                        console.log(
                                            JSON.parse(
                                                vscode_helpers.toStringSafe(msg.data.message)
                                            )
                                        );
                                    }
                                } catch { }
                            };
                            break;
                    }

                    if (action) {
                        Promise.resolve( action() ).then(() => {
                        }, (err) => {
                            vsckb.showError(err);
                        });
                    }
                } catch (e) {
                    vsckb.showError(e);
                }
            });

            if (false !== this._html) {
                newPanel.webview.html = vscode_helpers.toStringSafe(this._html);
            }

            this._openOptions = opts;
            this._panel = newPanel;

            return true;
        } catch (e) {
            vscode_helpers.tryDispose(newPanel);

            throw e;
        }
    }

    /**
     * Gets the options for opening the board.
     */
    public get openOptions(): OpenBoardOptions {
        return this._openOptions;
    }
}

/**
 * Opens a kanban board.
 *
 * @param {OpenBoardOptions} [opts] The options.
 *
 * @return {Promise<KanbanBoard>} The promise with the new board.
 */
export async function openBoard(opts?: OpenBoardOptions) {
    const NEW_BOARD = new KanbanBoard();

    await NEW_BOARD.initialize();
    await NEW_BOARD.open(opts);

    return NEW_BOARD;
}
