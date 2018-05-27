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
import * as ChildProcess from 'child_process';
import * as Path from 'path';
import * as vsckb_workspaces from './workspaces';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * A quick pick item with an action.
 */
export interface ActionQuickPickItem extends vscode.QuickPickItem {
    /**
     * The (optional) action to invoke.
     */
    action?: () => any;
}

/**
 * Options for open function.
 */
export interface OpenOptions {
    /**
     * The app (or options) to open.
     */
    app?: string | string[];
    /**
     * The custom working directory.
     */
    cwd?: string;
    /**
     * An optional list of environment variables
     * to submit to the new process.
     */
    env?: any;
    /**
     * Wait until exit or not.
     */
    wait?: boolean;
}

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
                    const QUICK_PICKS: ActionQuickPickItem[] = vsckb_workspaces.getAllWorkspaces().map(ws => {
                        let name = vscode_helpers.toStringSafe(ws.folder.name).trim();
                        if ('' === name) {
                            name = `Workspace #${ ws.folder.index }`;
                        }

                        return {
                            action: async () => {
                                await ws.openBoard();
                            },
                            detail: ws.folder.uri.fsPath,
                            label: name,
                        };
                    });

                    if (QUICK_PICKS.length < 1) {
                        vscode.window.showWarningMessage(
                            'No workspace found!'
                        );

                        return;
                    }

                    let selectedItem: ActionQuickPickItem;
                    if (1 === QUICK_PICKS.length) {
                        selectedItem = QUICK_PICKS[0];
                    } else {
                        selectedItem = await vscode.window.showQuickPick(QUICK_PICKS, {
                            canPickMany: false,
                            placeHolder: 'Select the workspace of your kanban board ...',
                        });
                    }

                    if (selectedItem) {
                        await selectedItem.action();
                    }
                } catch (e) {
                    showError(e);
                }
            })
        );
    });

    WF.next(async () => {
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

        await workspaceWatcher.reload();

        (<any>vsckb_workspaces)['getAllWorkspaces'] = () => {
            return workspaceWatcher.workspaces
                                   .map(ws => ws);
        };
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
 * Opens a target.
 *
 * @param {string} target The target to open.
 * @param {OpenOptions} [opts] The custom options to set.
 *
 * @param {Promise<ChildProcess.ChildProcess>} The promise with the child process.
 */
export function open(target: string, opts?: OpenOptions): Promise<ChildProcess.ChildProcess> {
    if (!opts) {
        opts = {};
    }

    target = vscode_helpers.toStringSafe(target);
    const WAIT = vscode_helpers.toBooleanSafe(opts.wait, true);

    return new Promise((resolve, reject) => {
        const COMPLETED = vscode_helpers.createCompletedAction(resolve, reject);

        try {
            let app = opts.app;
            let cmd: string;
            let appArgs: string[] = [];
            let args: string[] = [];
            let cpOpts: ChildProcess.SpawnOptions = {
                cwd: opts.cwd,
                env: opts.env,
            };

            if (Array.isArray(app)) {
                appArgs = app.slice(1);
                app = opts.app[0];
            }

            if (process.platform === 'darwin') {
                // Apple

                cmd = 'open';

                if (WAIT) {
                    args.push('-W');
                }

                if (app) {
                    args.push('-a', app);
                }
            } else if (process.platform === 'win32') {
                // Microsoft

                cmd = 'cmd';
                args.push('/c', 'start', '""');
                target = target.replace(/&/g, '^&');

                if (WAIT) {
                    args.push('/wait');
                }

                if (app) {
                    args.push(app);
                }

                if (appArgs.length > 0) {
                    args = args.concat(appArgs);
                }
            } else {
                // Unix / Linux

                if (app) {
                    cmd = app;
                } else {
                    cmd = Path.join(__dirname, 'xdg-open');
                }

                if (appArgs.length > 0) {
                    args = args.concat(appArgs);
                }

                if (!WAIT) {
                    // xdg-open will block the process unless
                    // stdio is ignored even if it's unref'd
                    cpOpts.stdio = 'ignore';
                }
            }

            args.push(target);

            if (process.platform === 'darwin' && appArgs.length > 0) {
                args.push('--args');
                args = args.concat(appArgs);
            }

            let cp = ChildProcess.spawn(cmd, args, cpOpts);

            if (WAIT) {
                cp.once('error', (err) => {
                    COMPLETED(err);
                });

                cp.once('close', function (code) {
                    if (code > 0) {
                        COMPLETED(new Error('Exited with code ' + code));
                        return;
                    }

                    COMPLETED(null, cp);
                });
            } else {
                cp.unref();

                COMPLETED(null, cp);
            }
        } catch (e) {
            COMPLETED(e);
        }
    });
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
