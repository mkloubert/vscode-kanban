'use strict';

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
import * as vsckb_boards from './boards';
import * as vsckb_workspaces from './workspaces';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * A message from and for a WebView.
 */
export interface WebViewMessage {
    /**
     * The command.
     */
    command: string;
    /**
     * The data.
     */
    data?: any;
}

let isDeactivating = false;
let workspaceWatcher: vscode_helpers.WorkspaceWatcherContext<vsckb_workspaces.Workspace>;

export async function activate(context: vscode.ExtensionContext) {
    const WF = vscode_helpers.buildWorkflow();

    // commands
    WF.next(() => {
        context.subscriptions.push(
            // openBoard
            vscode.commands.registerCommand('extension.kanban.openBoard', async () => {
                try {

                } catch (e) {
                    showError(e);
                }
            })
        );
    });

    WF.next(() => {
        context.subscriptions.push(
            workspaceWatcher = vscode_helpers.registerWorkspaceWatcher(context, async (ev, folder, workspace?) => {
                try {
                    if (ev === vscode_helpers.WorkspaceWatcherEvent.Added) {
                        if (folder && folder.uri && (['', 'file'].indexOf( vscode_helpers.normalizeString(folder.uri.scheme) ) > -1)) {
                            // only if local URI
                            return await createNewWorkspace( folder );
                        }
                    }
                } finally { }
            },
            async (err, ev, folder, workspace) => {
                if (err) {
                    showError(err);
                    return;
                }

                if (ev === vscode_helpers.WorkspaceWatcherEvent.Removed) {
                }
            })
        );
    });

    WF.next(async () => {
        // await updateActiveWorkspace();

        // await vsckb_boards.openBoard();
    });

    if (!isDeactivating) {
        await WF.start();
    }
}

async function createNewWorkspace(folder: vscode.WorkspaceFolder) {
    let newWorkspace: vsckb_workspaces.Workspace;
    try {
        newWorkspace = new vsckb_workspaces.Workspace(folder);

        await newWorkspace.initialize();

        return newWorkspace;
    } catch (e) {
        vscode_helpers.tryDispose(newWorkspace);

        throw e;
    }
}

export function deactivate() {
    if (isDeactivating) {
        return;
    }

    isDeactivating = true;
}

/**
 * Returns all possible resource URIs for web views.
 *
 * @return {vscode.Uri[]} The list of URIs.
 */
export function getWebViewResourceUris() {
    const URIs: vscode.Uri[] = [];

    try {
        URIs.push(
            vscode.Uri.file(Path.resolve(
                Path.join(__dirname, './res')
            ))
        );
    } catch { }

    return URIs;
}

/**
 * Shows an error.
 *
 * @param {any} err The error to show.
 */
export async function showError(err: any) {
    if (!_.isNil(err)) {
        return await vscode.window.showErrorMessage(
            `[ERROR] '${ vscode_helpers.toStringSafe(err) }'`
        );
    }
}
