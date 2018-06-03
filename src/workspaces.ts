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
const HumanizeDuration = require('humanize-duration');
import * as Moment from 'moment';
import * as Path from 'path';
import * as vsckb from './extension';
import * as vsckb_boards from './boards';
import * as vsckb_toggl from './toggl';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * Arguments for an event script function, which also can set
 * thet 'tag' property of the underlying card.
 */
export interface CanSetCardTag {
    /**
     * Sets value for the 'tag' property of the underlying card.
     *
     * @param {any} tag The data to set.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    setTag: (tag: any) => PromiseLike<boolean>;
}

/**
 * Configuration data for the extension.
 */
export interface Config extends vscode.WorkspaceConfiguration {
    /**
     * Any data, which can be accessed inside the whole extension context, like scripts, e.g.
     */
    readonly globals?: any;
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
    /**
     * Enable time tracking or not.
     */
    readonly trackTime?: TimeTrackingSettingValue;
}

/**
 * An event script module.
 */
export interface EventScriptModule {
    /**
     * Is raised after a card has been created.
     */
    onCardCreated?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag>;
    /**
     * Is raised after a card has been deleted.
     */
    onCardDeleted?: EventScriptFunction<EventScriptFunctionArguments & HasTag>;
    /**
     * Is raised after a card has been moved.
     */
    onCardMoved?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag>;
    /**
     * Is raised after a card has been updated.
     */
    onCardUpdated?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag>;
    /**
     * Is raised after a column has been cleared.
     */
    onColumnCleared?: EventScriptFunction;
    /**
     * Generic fallback.
     */
    onEvent?: EventScriptFunction;
    /**
     * Is raised time tracking should be started or stopped.
     */
    onTrackTime?: EventScriptFunction<TrackTimeEventArguments>;
}

/**
 * An event script function.
 *
 * @param {EventScriptFunctionArguments<TData>} args The arguments for the event.
 */
export type EventScriptFunction<TArgs extends EventScriptFunctionArguments = EventScriptFunctionArguments> = (args: TArgs) => any;

/**
 * Arguments for an event script function.
 */
export interface EventScriptFunctionArguments {
    /**
     * The event data.
     */
    data: any;
    /**
     * The current context of the underlying extension.
     */
    extension: vscode.ExtensionContext;
    /**
     * The path of the underlying board file.
     */
    file: string;
    /**
     * The data from the 'globals' setting of the extension.
     */
    globals: any;
    /**
     * The name of the event.
     */
    name: string;
    /**
     * Data / options for the execution.
     */
    options?: any;
    /**
     * An extended 'require()' function, which can also access the modules of that extension.
     */
    require: (id: string) => any;
    /**
     * Accesses the global state object, which can share data
     * accross the extension, while the current session.
     */
    session: any;
}

/**
 * An object that contains a 'tag' property.
 */
export interface HasTag {
    /**
     * The 'tag' data.
     */
    readonly tag: any;
}

/**
 * Settings for tracking time by script.
 */
export interface TimeTrackingByScriptSettings extends TimeTrackingSettings {
    /**
     * Options for the script.
     */
    readonly options?: any;
}

/**
 * Settings for tracking time.
 */
export interface TimeTrackingSettings {
    /**
     * The type.
     */
    readonly type?: string;
}

/**
 * A possible value for 'trackTime' extension setting.
 */
export type TimeTrackingSettingValue = boolean | TimeTrackingSettings;

/**
 * Event argument for a 'track time' event.
 */
export type TrackTimeEventArguments = EventScriptFunctionArguments & CanSetCardTag & HasTag;

const BOARD_FILENAME = 'vscode-kanban.json';
const EVENT_TRACK_TIME = 'track_time';
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

    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.WorkspaceFolder} folder The underlying folder.
     * @param {vscode.ExtensionContext} extension The exitension context.
     */
    public constructor(
        folder: vscode.WorkspaceFolder,
        public readonly extension: vscode.ExtensionContext
    ) {
        super(folder);
    }

    public get boardFile(): vscode.Uri {
        return vscode.Uri.file(
            Path.resolve(
                Path.join(this.folder.uri.fsPath, '.vscode/' + BOARD_FILENAME)
            )
        );
    }

    /**
     * Gets if the workspace is setup for 'time tracking' or not.
     */
    public get canTrackTime(): boolean {
        const CFG = this.config;
        if (CFG) {
            return !_.isNil(CFG.trackTime) &&
                   (false !== CFG.trackTime);
        }
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
            settings: {
                canTrackTime: this.canTrackTime,
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
        const CFG = this.config;
        if (!CFG) {
            return;
        }

        let func: Function;
        let options: any;

        let setupUID = false;
        let setupSetTag = false;
        let setupTag = false;

        const SETUP_FOR_TRACK_TIME = () => {
            setupUID = true;
            setupSetTag = true;
            setupTag = true;
        };

        let thisArg: any;
        const ARGS: EventScriptFunctionArguments = {
            data: context.data,
            extension: this.extension,
            file: Path.resolve(
                this.boardFile.fsPath
            ),
            globals: vscode_helpers.cloneObject(
                CFG.globals
            ),
            name: context.name,
            require: (id) => {
                return require(
                    vscode_helpers.toStringSafe(id)
                );
            },
            session: vscode_helpers.SESSION,
        };

        if (EVENT_TRACK_TIME === context.name) {
            if (this.canTrackTime) {
                thisArg = this;

                if (_.isObject(CFG.trackTime)) {
                    const SETTINGS = <TimeTrackingSettings>CFG.trackTime;

                    switch (SETTINGS.type) {
                        case '':
                        case 'script':
                            {
                                const SCRIPT_SETTINGS = <TimeTrackingByScriptSettings>SETTINGS;

                                options = SCRIPT_SETTINGS.options;
                            }
                            break;

                        case 'toggl':
                        case 'toggle':
                            {
                                const TOGGLE_SETTINGS = <vsckb_toggl.TimeTrackingByToggleSettings>SETTINGS;

                                func = async () => {
                                    await vscode_helpers.applyFuncFor(
                                        vsckb_toggl.trackTime, this
                                    )(<TrackTimeEventArguments>ARGS, TOGGLE_SETTINGS);
                                };
                            }
                            break;

                        default:
                            return;  // not supported
                    }
                } else {
                    if (vscode_helpers.toBooleanSafe(CFG.trackTime)) {
                        func = this.trackTime;
                        SETUP_FOR_TRACK_TIME();
                    }
                }
            }
        }

        if (!func) {
            const SCRIPT_FILE = vscode.Uri.file( Path.join(this.rootPath,
                                                           '.vscode/' + SCRIPT_FILENAME) );

            try {
                if (!(await vscode_helpers.isFile(SCRIPT_FILE.fsPath, false))) {
                    return;
                }
            } catch { }

            const SCRIPT_MODULE = thisArg = vscode_helpers.loadModule<EventScriptModule>(SCRIPT_FILE.fsPath);
            if (SCRIPT_MODULE) {
                switch (context.name) {
                    case 'card_created':
                        func = SCRIPT_MODULE.onCardCreated;
                        setupUID = true;
                        setupSetTag = true;
                        setupTag = true;
                        break;

                    case 'card_deleted':
                        func = SCRIPT_MODULE.onCardDeleted;
                        setupUID = true;
                        setupTag = true;
                        break;

                    case 'card_moved':
                        func = SCRIPT_MODULE.onCardMoved;
                        setupUID = true;
                        setupSetTag = true;
                        setupTag = true;
                        break;

                    case 'card_updated':
                        func = SCRIPT_MODULE.onCardUpdated;
                        setupUID = true;
                        setupSetTag = true;
                        setupTag = true;
                        break;

                    case 'column_cleared':
                        func = SCRIPT_MODULE.onColumnCleared;
                        break;

                    case EVENT_TRACK_TIME:
                        func = SCRIPT_MODULE.onTrackTime;
                        SETUP_FOR_TRACK_TIME();
                        break;
                }

                if (!func) {
                    func = SCRIPT_MODULE.onEvent;  // try use fallback
                }
            }
        }

        ARGS.options = vscode_helpers.cloneObject(
            options
        );

        if (setupTag) {
            // ARGS.tag
            Object.defineProperty(ARGS, 'tag', {
                get: function () {
                    return this.data.card.tag;
                }
            });
        }

        if (setupUID) {
            // ARGS.uid
            Object.defineProperty(ARGS, 'uid', {
                get: function () {
                    return this.data.card.__uid;
                }
            });
        }

        if (setupSetTag) {
            // ARGS.setTag()
            ARGS['setTag'] = async function(tag: any) {
                const UID: string = this.uid;

                let result: boolean;
                try {
                    result = await context.postMessage(
                        'setCardTag', {
                            tag: tag,
                            uid: UID,
                        }
                    );
                } catch {
                    result = false;
                }

                if (result) {
                    this.data.card.tag = tag;
                }

                return result;
            };
        }

        if (func) {
            await Promise.resolve(
                func.apply(thisArg,
                           [ ARGS ])
            );
        }
    }

    private showError(err: any) {
        return vsckb.showError(err);
    }

    private async trackTime(args: TrackTimeEventArguments) {
        let tag = args.tag;
        if (_.isNil(tag)) {
            tag = {};  // initialize card's 'tag'
        }

        if (_.isNil(tag['time-tracking'])) {
            // initialize 'time-tracking' property
            // of card's 'tag'

            tag['time-tracking'] = {
                'seconds': 0,
                'entries': []
            };
        }

        // add current time
        // as UTC
        tag['time-tracking']['entries'].push(
            Moment.utc()
                  .toISOString()
        );

        let seconds = 0.0;
        let lastStartTime: false | Moment.Moment = false;
        for (let i = 0; i < tag['time-tracking']['entries'].length; i++) {
            const TIME = Moment.utc(
                tag['time-tracking']['entries'][i]
            );

            if (false === lastStartTime) {
                // start time
                lastStartTime = TIME;
            } else {
                // end time
                // calculate difference
                // and add value
                seconds += Moment.duration( TIME.diff(lastStartTime) )
                                 .asSeconds();

                lastStartTime = false;
            }
        }

        // store sum
        tag['time-tracking']['seconds'] = seconds;

        await args.setTag( tag );

        if (Moment.isMoment(lastStartTime)) {
            vscode.window.showInformationMessage(
                'Time tracking has been started.'
            );
        } else {
            vscode.window.showInformationMessage(
                `Time tracking has been STOPPED. Current duration: ${ HumanizeDuration(seconds * 1000.0) }`
            );
        }
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
