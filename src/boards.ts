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
import * as OS from 'os';
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
     * The user, the card is assigned to.
     */
    assignedTo?: {
        /**
         * The name of the user.
         */
        name?: string;
    };
    /**
     * The time, the card has been created.
     */
    creation_time?: string;
    /**
     * The (optional) description.
     */
    description?: string;
    /**
     * The priority.
     */
    prio?: number;
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
 * Data of a 'card created' event.
 */
export interface CardCreatedEventData extends EventDataWithUniqueId {
    /**
     * The new card.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been created.
     */
    column: string;
}

/**
 * Data of a 'card deleted' event.
 */
export interface CardDeletedEventData extends EventDataWithUniqueId {
    /**
     * The new card.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been deleted.
     */
    column: string;
}

/**
 * Data of a 'card moved' event.
 */
export interface CardMovedEventData extends EventDataWithUniqueId {
    /**
     * The moved card.
     */
    card: BoardCard;
    /**
     * The name of the area from where the card has been moved.
     */
    from: string;
    /**
     * The name of the area where the card has been moved to.
     */
    to: string;
}

/**
 * Data of a 'card updated' event.
 */
export interface CardUpdatedEventData extends EventDataWithUniqueId {
    /**
     * The card with the current data.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been updated.
     */
    column: string;
    /**
     * The card with the old data.
     */
    oldCard: BoardCard;
}

/**
 * Data of a 'column cleared' event.
 */
export interface ColumnClearedEventData {
    /**
     * The cards that have been removed.
     */
    cards: BoardCard[];
    /**
     * The name of the column that has been cleared.
     */
    column: string;
}

/**
 * Event data with an unique ID.
 */
export interface EventDataWithUniqueId {
    /**
     * The unique ID.
     */
    uid: string;
}

/**
 * An event listener.
 */
export type EventListener = (context: EventListenerContext) => any;

/**
 * A context for an event listener.
 */
export interface EventListenerContext {
    /**
     * The underlying event data.
     */
    data: any;
    /**
     * The name of the event.
     */
    name: string;
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
     * The Git client.
     */
    git?: any;
    /**
     * Do not detect username via source control manager.
     */
    noScmUser?: boolean;
    /**
     * Do not detect username of operating system.
     */
    noSystemUser?: boolean;
    /**
     * A listener for a 'save board' event.
     */
    saveBoard?: SaveBoardEventListener;
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
    /**
     * A listener for an event.
     */
    raiseEvent?: EventListener;
    /**
     * The title for the view.
     */
    title?: string;
}

interface RaiseEvent {
    data?: any;
    name: string;
}

/**
 * An listener for a 'save board' event.
 *
 * @param {Board} board The board to save.
 */
export type SaveBoardEventListener = (board: Board) => any;

interface WebViewMessage extends vsckb.WebViewMessage {
}

const KNOWN_URLS = {
    'github': 'https://github.com/mkloubert/vscode-kanban',
    'paypal': 'https://paypal.me/MarcelKloubert',
    'twitter': 'https://twitter.com/mjkloubert',
};

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
                        <a class="btn btn-sm vsckb-clear-btn" title="Clear ...">
                            <i class="fa fa-eraser" aria-hidden="true"></i>
                        </a>

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

                    <div class="row">
                        <div class="col col-10">
                            <div class="form-group vsckb-card-type-list">
                                <label for="vsckb-new-card-type">Type</label>
                                <select id="vsckb-new-card-type" class="form-control"></select>
                            </div>
                        </div>

                        <div class="col col-2">
                            <div class="form-group">
                                <label for="vsckb-new-card-prio">Prio</label>
                                <input type="number" id="vsckb-new-card-prio" class="form-control" placeholder="0"></input>
                            </div>
                        </div>
                    </div>

                    <div class="form-group vsckb-card-assigned-to">
                        <label for="vsckb-new-card-assigned-to">Assigned To</label>
                        <input type="text" class="form-control" id="vsckb-new-card-assigned-to">
                    </div>

                    <div class="form-group">
                        <label for="vsckb-new-card-description">Description</label>
                        <textarea class="form-control" id="vsckb-new-card-description" rows="7"></textarea>
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

                    <div class="row">
                        <div class="col col-10">
                            <div class="form-group vsckb-card-type-list">
                                <label for="vsckb-edit-card-type">Type</label>
                                <select id="vsckb-edit-card-type" class="form-control"></select>
                            </div>
                        </div>

                        <div class="col col-2">
                            <div class="form-group">
                                <label for="vsckb-edit-card-prio">Prio</label>
                                <input type="number" id="vsckb-edit-card-prio" class="form-control" placeholder="0"></input>
                            </div>
                        </div>
                    </div>

                    <div class="form-group vsckb-card-assigned-to">
                        <label for="vsckb-edit-card-assigned-to">Assigned To</label>
                        <input type="text" class="form-control" id="vsckb-edit-card-assigned-to">
                    </div>

                    <div class="form-group">
                        <label for="vsckb-edit-card-description">Description</label>
                        <textarea class="form-control" id="vsckb-edit-card-description" rows="7"></textarea>
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

<div class="modal" tabindex="-1" role="dialog" id="vsckb-clear-done-modal">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header bg-warning text-white">
                <h5 class="modal-title">Clear <strong>'Done'</strong>?</h5>

                <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>

            <div class="modal-body">
                <span>Do you really want to delete ALL cards in <strong>Done</strong>?</span>
            </div>

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

        await this.postMessage('setTitleAndFilePath', {
            file: Path.resolve(this.file.fsPath),
            title: this.openOptions.title,
        });

        let userName: string;

        if (!vscode_helpers.toBooleanSafe(this.openOptions.noScmUser)) {
            if (this.openOptions.git) {
                // try get user name from Git
                try {
                    const GIT_FOLDER = Path.resolve(
                        Path.join(this.openOptions.git.cwd, '.git')
                    );

                    if (await vscode_helpers.isDirectory(GIT_FOLDER, false)) {
                        // only, when git repo exists

                        userName = vscode_helpers.toStringSafe(
                            this.openOptions.git.execSync([ 'config', 'user.name' ])
                        ).trim();
                    }
                } catch { }
            }
        }

        if (!vscode_helpers.toBooleanSafe(this.openOptions.noSystemUser)) {
            if (vscode_helpers.isEmptyString(userName)) {
                // now try get username from operating system

                try {
                    userName = OS.userInfo().username;
                } catch { }
            }
        }

        if (!vscode_helpers.isEmptyString(userName)) {
            await this.postMessage('setCurrentUser', {
                name: vscode_helpers.toStringSafe(userName).trim(),
            });
        }
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

        let webViewTitle = 'Kanban Board';

        const TITLE = vscode_helpers.toStringSafe(opts.title).trim();
        if ('' !== TITLE) {
            webViewTitle = `${ webViewTitle } (${ TITLE })`;
        }

        let showOptions = opts.showOptions;
        if (_.isNil(showOptions)) {
            showOptions = vscode.ViewColumn.One;
        }

        let newPanel: vscode.WebviewPanel;
        try {
            newPanel = vscode.window.createWebviewPanel(
                'vscodeKanbanBoard',
                webViewTitle,
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

                        case 'openKnownUrl':
                            const KU = KNOWN_URLS[ vscode_helpers.normalizeString(msg.data) ];
                            if (!_.isNil(KU)) {
                                action = async () => {
                                    await vsckb.open( KU );
                                };
                            }
                            break;

                        case 'raiseEvent':
                            const EVENT_DATA: RaiseEvent = msg.data;
                            if (EVENT_DATA) {
                                action = async () => {
                                    await this.raiseEvent(
                                        vscode_helpers.normalizeString(EVENT_DATA.name),
                                        EVENT_DATA.data,
                                    );
                                };
                            }
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

            newPanel.onDidChangeViewState((e) => {
                try {
                    if (e.webviewPanel.visible) {
                        this.postMessage('webviewIsVisible').then(() => {
                        }, () => {
                        });
                    }
                } catch { }
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

    private async raiseEvent(name: string, data: any) {
        const LISTENER = this.openOptions.raiseEvent;
        if (!LISTENER) {
            return;
        }

        const CTX: EventListenerContext = {
            data: data,
            name: vscode_helpers.normalizeString(name),
        };

        await Promise.resolve(
            LISTENER( CTX )
        );
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
