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
import * as FSExtra from 'fs-extra';
import * as Path from 'path';
import * as vsckb from './extension';
import * as vsckb_html from './html';
import * as vsckb_workspaces from './workspaces';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * A board.
 */
export interface Board {
    /**
     * The cards of 'Todo' section.
     */
    'todo': BoardCard[];
    /**
     * The cards of 'In Progress' section.
     */
    'in-progress': BoardCard[];
    /**
     * The cards of 'Testing' section.
     */
    'testing': BoardCard[];
    /**
     * The cards of 'Done' section.
     */
    'done': BoardCard[];
}

/**
 * A board card.
 */
export interface BoardCard {
    /**
     * The (optional) description.
     */
    description?: string;
    /**
     * The title.
     */
    title: string;
    /**
     * The type.
     */
    type?: string;
}

/**
 * Options for opening a board.
 */
export interface OpenBoardOptions {
    /**
     * The function that returns the underlying file to use.
     */
    fileResolver?: () => vscode.Uri;
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
    /**
     * The title for the view.
     */
    title?: string;
    /**
     * An listener for a 'save board' event.
     */
    saveBoard?: SaveBoardEventListener;
}

/**
 * An listener for a 'save board' event.
 *
 * @param {Board} board The board to save.
 */
export type SaveBoardEventListener = (board: Board) => any;

interface WebViewMessage extends vsckb.WebViewMessage {
}

/**
 * A kanban board.
 */
export class KanbanBoard extends vscode_helpers.DisposableBase {
    private _html: string | false = false;
    private _openOptions: OpenBoardOptions;
    private _panel: vscode.WebviewPanel;
    private _saveBoardEventListener: SaveBoardEventListener[];

    /**
     * Gets the board file to use.
     */
    public get file(): vscode.Uri {
        const RESOLVER = this.openOptions.fileResolver;
        if (RESOLVER) {
            return RESOLVER();
        }
    }

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
        this._saveBoardEventListener = [];

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
                <div class="card-header font-weight-bold vsckb-primary-card-header border border-dark border-bottom-0 text-dark">
                    <span class="vsckb-title">Todo</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body vsckb-primary-card-body h-100 bg-light border border-dark">&nbsp;</div>
            </div>
        </div>

        <div class="col col-6 col-md-3 h-100">
            <div class="card text-white bg-primary vsckb-card" id="vsckb-card-in-progress">
                <div class="card-header font-weight-bold vsckb-primary-card-header border border-dark border-bottom-0 text-white">
                    <span class="vsckb-title">In Progress</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body vsckb-primary-card-body h-100 bg-light border border-dark">&nbsp;</div>
            </div>
        </div>

        <div class="col col-6 col-md-3 h-100">
            <div class="card text-white bg-warning vsckb-card" id="vsckb-card-testing">
                <div class="card-header font-weight-bold vsckb-primary-card-header border border-dark border-bottom-0 text-white">
                    <span class="vsckb-title">Testing</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body vsckb-primary-card-body h-100 bg-light border border-dark">&nbsp;</div>
            </div>
        </div>

        <div class="col col-6 col-md-3 h-100">
            <div class="card text-white bg-success vsckb-card" id="vsckb-card-done">
                <div class="card-header font-weight-bold vsckb-primary-card-header border border-dark border-bottom-0 text-white">
                    <span class="vsckb-title">Done</span>

                    <div class="vsckb-buttons float-right">
                        <a class="btn btn-sm vsckb-add-btn" title="Add Card ...">
                            <i class="fa fa-plus" aria-hidden="true"></i>
                        </a>
                    </div>
                </div>

                <div class="card-body vsckb-primary-card-body h-100 bg-light border border-dark">&nbsp;</div>
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

                    <div class="form-group vsckb-card-type-list">
                        <label for="vsckb-new-card-type">Type</label>
                        <select id="vsckb-new-card-type" class="form-control"></select>
                    </div>

                    <div class="form-group">
                        <label for="vsckb-new-card-description">Description</label>
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

<div class="modal" tabindex="-1" role="dialog" id="vsckb-delete-card-modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">Delete Card</h5>

                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body"></div>

            <div class="modal-footer">
                <a class="btn btn-warning text-white font-weight-bold vsckb-no-btn">
                    <span>NO!</span>
                </a>

                <a class="btn btn-danger text-white vsckb-yes-btn">
                    <span>Yes</span>
                </a>
            </div>
        </div>
    </div>
</div>

<div class="modal" tabindex="-1" role="dialog" id="vsckb-edit-card-modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Edit Card</h5>

                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">
                <form>
                    <div class="form-group">
                        <label for="vsckb-edit-card-title">Title</label>
                        <input type="text" class="form-control" id="vsckb-edit-card-title">
                    </div>

                    <div class="form-group vsckb-card-type-list">
                        <label for="vsckb-edit-card-type">Type</label>
                        <select id="vsckb-edit-card-type" class="form-control"></select>
                    </div>

                    <div class="form-group">
                        <label for="vsckb-edit-card-description">Description</label>
                        <textarea class="form-control" id="vsckb-edit-card-description" rows="10"></textarea>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <a class="btn btn-primary vsckb-save-btn text-white">
                    <i class="fa fa-floppy-o" aria-hidden="true"></i>

                    <span>Save</span>
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
        this._saveBoardEventListener = [];

        vscode_helpers.tryDispose(this._panel);
    }

    private async onLoaded() {
        const FILE = this.file;
        if (!FILE) {
            return;
        }

        let loadedBoard: Board = JSON.parse(
            await FSExtra.readFile(
                FILE.fsPath, 'utf8'
            )
        );

        if (_.isNil(loadedBoard)) {
            loadedBoard = newBoard();
        }

        await this.postMessage('setBoard',
                               loadedBoard);
    }

    /**
     * Adds a listener for a 'save board' event.
     *
     * @param {SaveBoardEventListener} listener The listener to add.
     *
     * @return {this}
     */
    public onSaveBoard(listener: SaveBoardEventListener) {
        if (listener) {
            this._saveBoardEventListener.push(
                listener
            );
        }

        return this;
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
            title = 'New Kanban Board';
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

                        case 'onLoaded':
                            action = async () => {
                                await this.onLoaded();
                            };
                            break;

                        case 'saveBoard':
                            action = async () => {
                                const BOARD_TO_SAVE: Board = msg.data;
                                if (BOARD_TO_SAVE) {
                                    const LISTENERS = vscode_helpers.asArray(this._saveBoardEventListener);
                                    for (const L of LISTENERS) {
                                        try {
                                            await Promise.resolve(
                                                L(BOARD_TO_SAVE)
                                            );
                                        } catch (e) {
                                            vsckb.showError(e);
                                        }
                                    }
                                }
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

    /**
     * Gets the underlying panel.
     */
    public get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    /**
     * @inheritdoc
     */
    public async postMessage(command: string, data?: any) {
        const MSG: WebViewMessage = {
            command: command,
            data: data,
        };

        return await this.view.postMessage(MSG);
    }

    /**
     * Gets the underlying web view.
     */
    public get view(): vscode.Webview {
        return this.panel.webview;
    }
}

/**
 * Creates a new board object.
 *
 * @return {Board} The new object.
 */
export function newBoard(): Board {
    return {
        'todo': [],
        'in-progress': [],
        'testing': [],
        'done': [],
    };
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

    if (opts.saveBoard) {
        NEW_BOARD.onSaveBoard(opts.saveBoard);
    }

    await NEW_BOARD.open(opts);

    return NEW_BOARD;
}
