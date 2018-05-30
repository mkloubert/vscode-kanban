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
import * as vsckb_boards from './boards';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * Configuration data for the extension.
 */
export interface Config extends vscode.WorkspaceConfiguration {
    /**
     * Do not detect username via source control manager.
     */
    readonly noScmUser?: boolean;
    /**
     * Do not detect username of operating system.
     */
    readonly noSystemUser?: boolean;
    /**
     * Open the board for that workspace on startup.
     */
    readonly openOnStartup?: boolean;
}

/**
 * An event script module.
 */
export interface EventScriptModule {
    /**
     * Is raised after a card has been created.
     */
    onCardCreated?: EventScriptFunction<vsckb_boards.CardCreatedEventData>;
    /**
     * Is raised after a card has been deleted.
     */
    onCardDeleted?: EventScriptFunction<vsckb_boards.CardDeletedEventData>;
    /**
     * Is raised after a card has been moved.
     */
    onCardMoved?: EventScriptFunction<vsckb_boards.CardMovedEventData>;
    /**
     * Is raised after a card has been updated.
     */
    onCardUpdated?: EventScriptFunction<vsckb_boards.CardUpdatedEventData>;
    /**
     * Is raised after a column has been cleared.
     */
    onColumnCleared?: EventScriptFunction<vsckb_boards.ColumnClearedEventData>;
    /**
     * Generic fallback.
     */
    onEvent?: EventScriptFunction;
}

/**
 * An event script function.
 *
 * @param {EventScriptFunctionArguments<TData>} args The arguments for the event.
 */
export type EventScriptFunction<TData = any> = (args: EventScriptFunctionArguments<TData>) => any;

/**
 * Arguments for an event script function.
 */
export interface EventScriptFunctionArguments<TData = any> {
    /**
     * The event data.
     */
    data: TData;
    /**
     * The path of the underlying board file.
     */
    file: string;
    /**
     * The name of the event.
     */
    name: string;
}

const BOARD_FILENAME = 'vscode-kanban.json';
const SCRIPT_FILENAME = 'vscode-kanban.js';

/**
 * Returns the list of all available workspaces.
 *
 * @return {Workspace[]} The list of workspaces.
 */
export let getAllWorkspaces: () => Workspace[];

/**
 * A workspace.
 */
export class Workspace extends vscode_helpers.WorkspaceBase {
    private _config: Config;
    private _configSrc: vscode_helpers.WorkspaceConfigSource;
    private _isReloadingConfig = false;

    public get boardFile(): vscode.Uri {
        return vscode.Uri.file(
            Path.resolve(
                Path.join(this.folder.uri.fsPath, '.vscode/' + BOARD_FILENAME)
            )
        );
    }

    /**
     * Gets the current configuration.
     */
    public get config() {
        return this._config;
    }

    /**
     * @inheritdoc
     */
    public get configSource() {
        return this._configSrc;
    }

    /**
     * Initializes that workspace object.
     */
    public async initialize() {
        this._configSrc = {
            section: 'kanban',
            resource: vscode.Uri.file( Path.join(this.rootPath,
                                                 '.vscode/settings.json') ),
        };

        await this.onDidChangeConfiguration();
    }

    /**
     * @inheritdoc
     */
    public async onDidChangeConfiguration() {
        if (this._isReloadingConfig) {
            const ARGS = arguments;

            vscode_helpers.invokeAfter(async () => {
                await this.onDidChangeConfiguration
                          .apply(this, ARGS);
            }, 1000);

            return;
        }

        this._isReloadingConfig = true;
        try {
            let loadedCfg: Config = vscode.workspace.getConfiguration(this.configSource.section,
                                                                      this.configSource.resource) || <any>{};

            this._config = loadedCfg;

            await this.openBoardOnStartup(loadedCfg);
        } finally {
            this._isReloadingConfig = false;
        }
    }

    /**
     * Opens the kanban board for that workspace.
     */
    public async openBoard() {
        const CFG = this.config;
        if (!CFG) {
            return;
        }

        const KANBAN_FILE = Path.resolve(
            this.boardFile.fsPath
        );

        const VSCODE_DIR = Path.resolve(
            Path.dirname(
                KANBAN_FILE
            )
        );

        if (!(await vscode_helpers.exists(KANBAN_FILE))) {
            if (!(await vscode_helpers.exists(VSCODE_DIR))) {
                await FSExtra.mkdirs( VSCODE_DIR );
            }

            if (!(await vscode_helpers.isDirectory(VSCODE_DIR))) {
                vscode.window.showWarningMessage(
                    `'${ VSCODE_DIR }' is no directory!`
                );

                return;
            }

            await saveBoardTo(
                vsckb_boards.newBoard(), KANBAN_FILE
            );
        }

        if (!(await vscode_helpers.isFile(KANBAN_FILE))) {
            vscode.window.showWarningMessage(
                `'${ KANBAN_FILE }' is no file!`
            );

            return;
        }

        let title = vscode_helpers.toStringSafe(this.folder.name).trim();
        if ('' === title) {
            title = `Workspace #${ this.folder.index }`;
        }

        await vsckb_boards.openBoard({
            fileResolver: () => this.boardFile,
            git: await this.tryCreateGitClient(),
            noScmUser: CFG.noScmUser,
            noSystemUser: CFG.noSystemUser,
            raiseEvent: async (ctx) => {
                await this.raiseEvent(ctx);
            },
            saveBoard: async (board) => {
                await saveBoardTo(
                    board,
                    this.boardFile.fsPath
                );
            },
            title: title,
        });
    }

    private async openBoardOnStartup(cfg: Config) {
        try {
            if (vscode_helpers.toBooleanSafe(cfg.openOnStartup)) {
                await this.openBoard();
            }
        } catch (e) {
            this.showError(e);
        }
    }

    private async raiseEvent(context: vsckb_boards.EventListenerContext) {
        const SCRIPT_FILE = vscode.Uri.file( Path.join(this.rootPath,
                                                       '.vscode/' + SCRIPT_FILENAME) );

        try {
            if (!(await vscode_helpers.isFile(SCRIPT_FILE.fsPath, false))) {
                return;
            }
        } catch { }

        const SCRIPT_MODULE = vscode_helpers.loadModule<EventScriptModule>(SCRIPT_FILE.fsPath);
        if (SCRIPT_MODULE) {
            let scriptFunc: Function;

            let thisArg: any = SCRIPT_MODULE;
            const ARGS: EventScriptFunctionArguments = {
                data: context.data,
                file: Path.resolve(
                    this.boardFile.fsPath
                ),
                name: context.name,
            };

            switch (context.name) {
                case 'card_created':
                    scriptFunc = SCRIPT_MODULE.onCardCreated;
                    break;

                case 'card_deleted':
                    scriptFunc = SCRIPT_MODULE.onCardDeleted;
                    break;

                case 'card_moved':
                    scriptFunc = SCRIPT_MODULE.onCardMoved;
                    break;

                case 'card_updated':
                    scriptFunc = SCRIPT_MODULE.onCardUpdated;
                    break;

                case 'column_cleared':
                    scriptFunc = SCRIPT_MODULE.onColumnCleared;
                    break;
            }

            if (!scriptFunc) {
                scriptFunc = SCRIPT_MODULE.onEvent;  // try use fallback
            }

            if (scriptFunc) {
                await Promise.resolve(
                    scriptFunc.apply(thisArg,
                                     [ ARGS ])
                );
            }
        }
    }

    private showError(err: any) {
        return vsckb.showError(err);
    }

    private tryCreateGitClient() {
        return vscode_helpers.tryCreateGitClient(
            this.folder.uri.fsPath
        );
    }
}

async function saveBoardTo(board: vsckb_boards.Board, file: string) {
    if (_.isNil(board)) {
        board = vsckb_boards.newBoard();
    }

    await FSExtra.writeFile(
        file,
        JSON.stringify(board, null, 2),
        'utf8'
    );
}
