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
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';
import * as vscode_workspaces from './workspaces';

/**
 * Settings for tracking time by Toggle.com
 */
export interface TimeTrackingByToggleSettings extends vscode_workspaces.TimeTrackingSettings {
    /**
     * The ID of the project.
     */
    readonly project?: number;
    /**
     * The personal API token or the path to a text file, that contains it.
     */
    readonly token: string;
}

interface TogglProject {
    __vsckbWorkspace: TogglWorkspace;
    id: number;
    name: string;
}

interface TogglTimeEntry {
    id: number;
    pid: number;
    wid: number;
}

interface TogglWorkspace {
    id: number;
    name: string;
}

interface TogglWithData<TData = any> {
    data?: TData;
}

/**
 * Starts / stops time tracking via Toggl.
 *
 * @param {vscode_workspaces.TrackTimeEventArguments} args The event arguments.
 * @param {TimeTrackingByToggleSettings} settings The settings.
 */
export async function trackTime(args: vscode_workspaces.TrackTimeEventArguments, settings: TimeTrackingByToggleSettings) {
    const ME: vscode_workspaces.Workspace = this;

    let token = vscode_helpers.toStringSafe(settings.token);
    let existingTokenFile: false | string = false;

    if (!vscode_helpers.isEmptyString(token)) {
        try {
            let tokenFilePath = token;
            if (!Path.isAbsolute(tokenFilePath)) {
                tokenFilePath = Path.join(
                    OS.homedir(), tokenFilePath
                );
            }
            tokenFilePath = Path.resolve( tokenFilePath );

            if (await vscode_helpers.isFile(tokenFilePath, false)) {
                existingTokenFile = tokenFilePath;
            }
        } catch { }
    }

    if (false !== existingTokenFile) {
        token = await FSExtra.readFile(existingTokenFile, 'utf8');
    }

    token = token.trim();

    if ('' === token) {
        throw new Error('No API token defined!');
    }

    const CREATE_AUTH = () => {
        return `Basic ${new Buffer(token + ':api_token', 'ascii').toString('base64')}`;
    };

    const THROW_HTTP_ERROR = (result: vscode_helpers.HTTPRequestResult, msg: string) => {
        throw new Error(
            vscode_helpers.format(
                "{0}: [{1}] '{2}'",
                msg, result.code, result.status
            )
        );
    };

    let projects: TogglProject[] = [];

    const PROJECT_ID = parseInt( vscode_helpers.toStringSafe(settings.project).trim() );
    if (!isNaN(PROJECT_ID)) {
        const RESULT = await vscode_helpers.GET(`https://www.toggl.com/api/v8/projects/${ PROJECT_ID }`, {
            'Authorization': CREATE_AUTH(),
        });

        if (200 === RESULT.code) {
            const PROJECT_DATA: TogglWithData<TogglProject> = JSON.parse(
                (await RESULT.readBody()).toString('utf8')
            );

            if (PROJECT_DATA && !_.isNil(PROJECT_DATA.data)) {
                projects.push(
                    PROJECT_DATA.data
                );
            }
        } else if (404 === RESULT.code) {
            vscode.window.showWarningMessage(
                `Project '${ PROJECT_ID }' not found!`
            );

            return;
        }
    }

    if (projects.length < 1) {
        await vscode.window.withProgress({
            cancellable: false,
            location: vscode.ProgressLocation.Notification,
            title: 'Loading Toggl workspaces ...',
        }, async (progress) => {
            let workspaces: TogglWorkspace[];
            {
                const RESULT = await vscode_helpers.GET('https://www.toggl.com/api/v8/workspaces', {
                    'Authorization': CREATE_AUTH(),
                });

                if (200 !== RESULT.code) {
                    THROW_HTTP_ERROR(RESULT,
                                     'Could not load Toggle workspaces');
                }

                workspaces = vscode_helpers.asArray(JSON.parse(
                    (await RESULT.readBody()).toString('utf8')
                ));
            }

            for (let i = 0; i < workspaces.length; i++) {
                const WS = workspaces[i];

                progress.report({
                    message: `Loading Toggl projects of workspace '${ vscode_helpers.toStringSafe(WS.name).trim() }' (${ i + 1 } / ${ workspaces.length }) ...`,
                });

                const RESULT = await vscode_helpers.GET(`https://www.toggl.com/api/v8/workspaces/${ WS.id }/projects`, {
                    'Authorization': CREATE_AUTH(),
                });

                if (200 !== RESULT.code) {
                    THROW_HTTP_ERROR(RESULT,
                                     `Could not load Toggle projects of workspace '${ vscode_helpers.toStringSafe(WS.name) }' (${ WS.id })`);
                }

                const WORKSPACE_PROJECTS = vscode_helpers.asArray<TogglProject>(
                    JSON.parse(
                        (await RESULT.readBody()).toString('utf8')
                    )
                );

                WORKSPACE_PROJECTS.forEach(p => {
                    p.__vsckbWorkspace = WS;
                });

                projects = projects.concat(
                    WORKSPACE_PROJECTS
                );
            }
        });
    }

    const QUICK_PICKS: vsckb.ActionQuickPickItem[] = projects.map(p => {
        return {
            action: async () => {
                const RESULT = await vscode_helpers.GET('https://www.toggl.com/api/v8/time_entries/current', {
                    'Authorization': CREATE_AUTH(),
                });

                let timeEntry: TogglTimeEntry;
                if (200 === RESULT.code) {
                    const CURRENT_ENTRY: TogglWithData<TogglTimeEntry> = JSON.parse(
                        (await RESULT.readBody()).toString('utf8'),
                    );

                    if (CURRENT_ENTRY) {
                        timeEntry = CURRENT_ENTRY.data;
                    }
                } else {
                    THROW_HTTP_ERROR(RESULT,
                                     `Could not load current Toggle time entry for project '${ vscode_helpers.toStringSafe(p.name) }'`);
                }

                if (!_.isNil(timeEntry)) {
                    if (timeEntry.pid !== p.id) {
                        vscode.window.showWarningMessage(
                            `The current time entry does not belong to the project '${ vscode_helpers.toStringSafe(p.name) }'. You have to stop it first, before you can continue.`
                        );

                        return;
                    }
                }

                if (_.isNil(timeEntry)) {
                    // start

                    const TAGS: any[] = [ 'vscode' ];
                    TAGS.push( ME.folder.name );
                    TAGS.push( Path.basename(ME.folder.name) );
                    TAGS.push( args.data.column );

                    const RESULT = await vscode_helpers.POST('https://www.toggl.com/api/v8/time_entries/start', JSON.stringify({
                        'time_entry': {
                            'description': vscode_helpers.toStringSafe(args.data.card.title).trim(),
                            'tags': vscode_helpers.from(TAGS).select(x => {
                                return vscode_helpers.normalizeString(x);
                            }).where(x => '' !== x)
                              .distinct()
                              .order()
                              .toArray(),
                            'pid': p.id,
                            'created_with': 'vscode-kanban',
                        }
                    }), {
                        'Authorization': CREATE_AUTH(),
                    });

                    if (200 === RESULT.code) {
                        vscode.window.showInformationMessage(
                            'Time tracking has been started.'
                        );
                    } else {
                        THROW_HTTP_ERROR(RESULT,
                                         'CREATING new Toggle time entry failed');
                    }
                } else {
                    // stop

                    const RESULT = await vscode_helpers.PUT(`https://www.toggl.com/api/v8/time_entries/${ timeEntry.id }/stop`, null, {
                        'Authorization': CREATE_AUTH(),
                    });

                    if (200 === RESULT.code) {
                        vscode.window.showInformationMessage<vsckb.ActionMessageItem>(
                            'Time tracking has been STOPPED.',
                            {
                                action: async () => {
                                    await vsckb.open('https://www.toggl.com/app/timer');
                                },
                                title: 'Open Toggl ...',
                                isCloseAffordance: false,
                            }
                        ).then((selectedItem) => {
                            (async () => {
                                if (selectedItem) {
                                    await selectedItem.action();
                                }
                            })().then(() => {}, (err) => {
                                vsckb.showError(err);
                            });
                        }, (err) => {
                            vsckb.showError(err);
                        });
                    } else {
                        THROW_HTTP_ERROR(RESULT,
                                         'STOPPING current Toggle time entry failed');
                    }
                }
            },
            detail: _.isNil(p.__vsckbWorkspace) ? undefined
                                                : vscode_helpers.toStringSafe(p.__vsckbWorkspace.name).trim(),
            label: vscode_helpers.toStringSafe(p.name).trim(),
            __vsckbProject: p,
        };
    }).sort((x, y) => {
        // first by project name
        const COMP_0 = vscode_helpers.compareValuesBy(x, y, qp => {
            return vscode_helpers.normalizeString(qp.label);
        });
        if (0 !== COMP_0) {
            return COMP_0;
        }

        // then by workspace
        return vscode_helpers.compareValuesBy(x, y, qp => {
            return vscode_helpers.normalizeString(qp.detail);
        });
    });

    if (QUICK_PICKS.length < 1) {
        vscode.window.showWarningMessage(
            'No Toggl project found!'
        );

        return;
    }

    let selectedItem: vsckb.ActionQuickPickItem;
    if (1 === QUICK_PICKS.length) {
        selectedItem = QUICK_PICKS[0];
    } else {
        selectedItem = await vscode.window.showQuickPick(QUICK_PICKS, {
            canPickMany: false,
            placeHolder: 'Select Toggl project ...',
        });
    }

    if (selectedItem) {
        await selectedItem.action();
    }
}
