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

const BOARD_FILENAME = 'vscode-kanban.json';

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
