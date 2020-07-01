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
import * as HtmlEntities from 'html-entities';
const HumanizeDuration = require('humanize-duration');
import * as Moment from 'moment';
import * as Path from 'path';
const SanitizeFilename = require('sanitize-filename');
import * as vsckb from './extension';
import * as vsckb_boards from './boards';
import * as vsckb_toggl from './toggl';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * A possible value for an argument, which represents a card.
 */
export type CardArgument = string | vsckb_boards.BoardCard;

/**
 * Arguments for an event script function, which can move the underlying card.
 */
export interface CanMove {
    /**
     * Moves the underlying card to 'Done' column.
     *
     * @param {MoveToArgument} [card] The custom card.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    moveToDone: (card?: CardArgument) => PromiseLike<boolean>;
    /**
     * Moves the underlying card to 'In Progress' column.
     *
     * @param {MoveToArgument} [card] The custom card.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    moveToInProgress: (card?: CardArgument) => PromiseLike<boolean>;
    /**
     * Moves the underlying card to 'Testing' column.
     *
     * @param {MoveToArgument} [card] The custom card.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    moveToTesting: (card?: CardArgument) => PromiseLike<boolean>;
    /**
     * Moves the underlying card to 'Todo' column.
     *
     * @param {MoveToArgument} [card] The custom card.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    moveToTodo: (card?: CardArgument) => PromiseLike<boolean>;
}

/**
 * Arguments for an event script function, which also can set
 * thet 'tag' property of the underlying card.
 */
export interface CanSetCardTag {
    /**
     * Sets value for the 'tag' property of the underlying card.
     *
     * @param {any} tag The data to set.
     * @param {MoveToArgument} [card] The custom card.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    setTag: (tag: any, card?: CardArgument) => PromiseLike<boolean>;
}

/**
 * Configuration data for the extension.
 */
export interface Config extends vscode.WorkspaceConfiguration {
    /**
     * Indicates if a button should be shown in each card, which can execute a 'onExecute' function in 'vscode-kanban.js' file.
     */
    readonly canExecute?: boolean;
    /**
     * Remove existing export files, before regenerate them.
     */
    readonly cleanupExports?: boolean;
    /**
     * Column settings.
     */
    readonly columns?: {
        /**
         * The custom (display) name for the column 'Done'.
         */
        readonly done?: string;
        /**
         * The custom (display) name for the column 'In Progress'.
         */
        readonly inProgress?: string;
        /**
         * The custom (display) name for the column 'Testing'.
         */
        readonly testing?: string;
        /**
         * The custom (display) name for the column 'Todo'.
         */
        readonly todo?: string;
    };
    /**
     * Export cards to external Markdown files on save or not.
     */
    readonly exportOnSave?: boolean;
    /**
     * The custom path where export files, like cards, should be stored.
     */
    readonly exportPath?: string;
    /**
     * Any data, which can be accessed inside the whole extension context, like scripts, e.g.
     */
    readonly globals?: any;
    /**
     * The maximum size of the name of an export file.
     */
    readonly maxExportNameLength?: number;
    /**
     * Do not detect username via source control manager.
     */
    readonly noScmUser?: boolean;
    /**
     * Do not detect username of operating system.
     */
    readonly noSystemUser?: boolean;
    /**
     * Do not show 'track time' button, if a card is stored in 'Todo' or 'Done'.
     */
    readonly noTimeTrackingIfIdle?: boolean;
    /**
     * Open the board for that workspace on startup.
     */
    readonly openOnStartup?: boolean;
    /**
     * Use integer values as IDs for cards instead.
     */
    readonly simpleIDs?: boolean;
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
    onCardCreated?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag & CanMove>;
    /**
     * Is raised after a card has been deleted.
     */
    onCardDeleted?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag & CanMove>;
    /**
     * Is raised after a card has been moved.
     */
    onCardMoved?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag & CanMove>;
    /**
     * Is raised after a card has been updated.
     */
    onCardUpdated?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & HasTag & CanMove>;
    /**
     * Is raised after a column has been cleared.
     */
    onColumnCleared?: EventScriptFunction<EventScriptFunctionArguments & CanSetCardTag & CanMove>;
    /**
     * Is raised if 'execute' button has been clicked.
     */
    onExecute?: EventScriptFunction<ExecuteCardEventArguments>;
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
     * The underlying logger.
     */
    logger: vscode_helpers.Logger;
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
    /**
     * Accesses the state object, which can share data
     * accross the underlying workspace.
     */
    state: any;
}

/**
 * Event argument for an 'execute' event.
 */
export type ExecuteCardEventArguments = EventScriptFunctionArguments & CanSetCardTag & HasTag & CanMove;

interface ExportBoardCardsToOptions {
    board: vsckb_boards.Board;
    cleanup: boolean;
    dir: string;
    maxNameLength: number;
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
export type TrackTimeEventArguments = EventScriptFunctionArguments & CanSetCardTag & HasTag & CanMove;

const BOARD_FILENAME = 'vscode-kanban.json';
const BOARD_CARD_EXPORT_FILE_EXT = 'card.md';
const EVENT_TRACK_TIME = 'track_time';
const FILTER_FILENAME = 'vscode-kanban.filter';
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
    private readonly _STATE: any = {};

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

        const FILTER_FILE = Path.resolve(
            Path.join(
                Path.dirname(KANBAN_FILE),
                FILTER_FILENAME
            )
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

        const COL_SETTINGS_DONE: vsckb_boards.ColumnSettings = {
        };
        const COL_SETTINGS_IN_PROGRESS: vsckb_boards.ColumnSettings = {
        };
        const COL_SETTINGS_TESTING: vsckb_boards.ColumnSettings = {
        };
        let COL_SETTINGS_TODO: vsckb_boards.ColumnSettings = {
        };

        if (CFG.columns) {
            COL_SETTINGS_DONE.name = vscode_helpers.toStringSafe(CFG.columns.done).trim();
            COL_SETTINGS_IN_PROGRESS.name = vscode_helpers.toStringSafe(CFG.columns.inProgress).trim();
            COL_SETTINGS_TESTING.name = vscode_helpers.toStringSafe(CFG.columns.testing).trim();
            COL_SETTINGS_TODO.name = vscode_helpers.toStringSafe(CFG.columns.todo).trim();
        }

        await vsckb_boards.openBoard({
            additionalResourceRoots: [
                vscode.Uri.file(
                    Path.resolve(
                        Path.join(this.folder.uri.fsPath, '.vscode')
                    )
                )
            ],
            fileResolver: () => this.boardFile,
            git: await this.tryCreateGitClient(),
            loadFilter: async () => {
                try {
                    if (await vscode_helpers.isFile(FILTER_FILE, false)) {
                        return await FSExtra.readFile(FILTER_FILE, 'utf8');
                    }
                } catch (e) {
                    this.showError(e);
                }

                return '';
            },
            noScmUser: CFG.noScmUser,
            noSystemUser: CFG.noSystemUser,
            raiseEvent: async (ctx) => {
                await this.raiseEvent(ctx);
            },
            saveBoard: async (board) => {
                try {
                    await saveBoardTo(
                        board,
                        this.boardFile.fsPath,
                    );
                } catch (e) {
                    vsckb.showError(e);
                }

                if (vscode_helpers.toBooleanSafe(CFG.exportOnSave)) {
                    try {
                        const VSCODE_DIR = Path.join(this.folder.uri.fsPath, '.vscode');

                        let exportPath = vscode_helpers.toStringSafe(CFG.exportPath);
                        if (vscode_helpers.isEmptyString(exportPath)) {
                            exportPath = VSCODE_DIR;
                        }
                        if (!Path.isAbsolute(exportPath)) {
                            exportPath = Path.join(
                                VSCODE_DIR, exportPath
                            );
                        }
                        exportPath = Path.resolve( exportPath );

                        let maxNameLength = parseInt(
                            vscode_helpers.toStringSafe(CFG.maxExportNameLength).trim()
                        );
                        if (isNaN(maxNameLength)) {
                            maxNameLength = 0;
                        }
                        if (maxNameLength < 1) {
                            maxNameLength = 48;
                        }

                        await exportBoardCardsTo({
                            board: board,
                            cleanup: vscode_helpers.toBooleanSafe(CFG.cleanupExports, true),
                            dir: exportPath,
                            maxNameLength: maxNameLength,
                        });
                    } catch (e) {
                        vsckb.showError(e);
                    }
                }
            },
            saveFilter: async (filter) => {
                try {
                    await vsckb.saveToFile(
                        FILTER_FILE,
                        new Buffer(filter, 'utf8')
                    );
                } catch (e) {
                    vsckb.showError(e);
                }
            },
            settings: {
                canExecute: vscode_helpers.toBooleanSafe( this.config.canExecute ),
                canTrackTime: this.canTrackTime,
                columns: {
                    done: COL_SETTINGS_DONE,
                    'in-progress': COL_SETTINGS_IN_PROGRESS,
                    testing: COL_SETTINGS_TESTING,
                    todo: COL_SETTINGS_TODO,
                },
                hideTimeTrackingIfIdle: vscode_helpers.toBooleanSafe(CFG.noTimeTrackingIfIdle),
                simpleIDs: vscode_helpers.toBooleanSafe(CFG.simpleIDs, true),
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

        let setupUID = true;
        let setupTag = true;

        const SETUP_FOR_TRACK_TIME = () => {
            setupUID = true;
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
            logger: vsckb.getLogger(),
            name: context.name,
            require: (id) => {
                return require(
                    vscode_helpers.toStringSafe(id)
                );
            },
            session: vscode_helpers.SESSION,
            state: this._STATE,
        };

        const GET_UID = (arg: CardArgument) => {
            if (!_.isNil(arg)) {
                let card: vsckb_boards.BoardCard;
                if (_.isObject(arg)) {
                    card = <any>arg;
                } else {
                    const UID = vscode_helpers.normalizeString(arg);
                    if (!_.isNil(ARGS.data) && !_.isNil(ARGS.data.others)) {
                        for (const COLUMN in ARGS.data.others) {
                            const CARDS_OF_COLUMN = vscode_helpers.asArray<vsckb_boards.BoardCard>(
                                ARGS.data.others[COLUMN]
                            );

                            for (const C of CARDS_OF_COLUMN) {
                                if (C['__uid'] === UID) {
                                    card = C;
                                    break;
                                }
                            }

                            if (!_.isNil(card)) {
                                break;
                            }
                        }
                    }
                }

                if (_.isNil(card)) {
                    throw new Error('Card not found');
                }

                return card['__uid'];
            }

            return ARGS['uid'];
        };

        const TRY_FIND_CARD = (uid: string): vsckb_boards.BoardCard => {
            if (!_.isNil(ARGS.data)) {
                // check for CURRENT card
                if (!_.isNil(ARGS.data.card)) {
                    if (uid === ARGS.data.card['__uid']) {
                        return ARGS.data.card;
                    }
                }

                // now check for OTHER cards
                if (!_.isNil(ARGS.data.others)) {
                    for (const COLUMN in ARGS.data.others) {
                        const CARDS_OF_COLUMN = vscode_helpers.asArray<vsckb_boards.BoardCard>(
                            ARGS.data.others[COLUMN]
                        );

                        for (const C of CARDS_OF_COLUMN) {
                            if (uid === C['__uid']) {
                                return C;
                            }
                        }
                    }
                }
            }
        };

        const MOVE_TO = async (uid: string, column: string) => {
            let result: boolean;
            try {
                result = await context.postMessage(
                    'moveCardTo', {
                        column: column,
                        uid: uid,
                    }
                );
            } catch {
                result = false;
            }

            return result;
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
                        break;

                    case 'card_deleted':
                        func = SCRIPT_MODULE.onCardDeleted;
                        break;

                    case 'card_moved':
                        func = SCRIPT_MODULE.onCardMoved;
                        break;

                    case 'card_updated':
                        func = SCRIPT_MODULE.onCardUpdated;
                        break;

                    case 'column_cleared':
                        setupUID = false;
                        setupTag = false;
                        func = SCRIPT_MODULE.onColumnCleared;
                        break;

                    case 'execute_card':
                        func = SCRIPT_MODULE.onExecute;
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

        // ARGS.options
        ARGS.options = vscode_helpers.cloneObject(
            options
        );

        if (setupTag) {
            // ARGS.tag
            Object.defineProperty(ARGS, 'tag', {
                enumerable: true,
                get: function () {
                    return this.data.card.tag;
                }
            });
        }

        if (setupUID) {
            // ARGS.uid
            Object.defineProperty(ARGS, 'uid', {
                enumerable: true,
                get: function () {
                    return this.data.card.__uid;
                }
            });
        }

        // ARGS.setTag()
        ARGS['setTag'] = async function(tag: any, card?: CardArgument) {
            const UID: string = GET_UID(card);

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
                const CARD = TRY_FIND_CARD(UID);
                if (CARD) {
                    CARD.tag = tag;
                }
            }

            return result;
        };

        // move cards
        {
            ARGS['moveToDone'] = function(card?: CardArgument) {
                return MOVE_TO(GET_UID(card), 'done');
            };

            ARGS['moveToInProgress'] = function(card?: CardArgument) {
                return MOVE_TO(GET_UID(card), 'in-progress');
            };

            ARGS['moveToTesting'] = function(card?: CardArgument) {
                return MOVE_TO(GET_UID(card), 'testing');
            };

            ARGS['moveToTodo'] = function(card?: CardArgument) {
                return MOVE_TO(GET_UID(card), 'todo');
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

async function exportBoardCardsTo(opts: ExportBoardCardsToOptions) {
    let board = opts.board;
    if (_.isNil(board)) {
        board = vsckb_boards.newBoard();
    }

    let dir = opts.dir;
    await vscode_helpers.createDirectoryIfNeeded(dir);

    const HTML_ENCODER = new HtmlEntities.AllHtmlEntities();

    const FILENAME_FORMAT = 'vscode-kanban_{0}_{1}_{2}';

    if (opts.cleanup) {
        const EXITING_FILES = (await vscode_helpers.glob('/vscode-kanban_*.' + BOARD_CARD_EXPORT_FILE_EXT, {
            absolute: true,
            cwd: dir,
            dot: false,
            nocase: true,
            nodir: true,
            nonull: false,
            nosort: true,
            nounique: false,
            root: dir,
        }));

        for (const EF of EXITING_FILES) {
            await FSExtra.unlink( EF );
        }
    }

    const EXTRACT_BOARD_CARD_CONTENT = (value: vsckb_boards.BoardCardContentValue) => {
        let content: string;

        if (!_.isNil(value)) {
            let cardContent: vsckb_boards.BoardCardContent;
            if (_.isObject(value)) {
                cardContent = <vsckb_boards.BoardCardContent>value;
            } else {
                cardContent = {
                    content: vscode_helpers.toStringSafe(value),
                };
            }

            content = vscode_helpers.toStringSafe( cardContent.content );
        }

        return content;
    };

    let index = 0;
    for (const BC of vsckb_boards.BOARD_COLMNS) {
        const CARDS: vsckb_boards.BoardCard[] = vscode_helpers.asArray( board[ BC ] );

        let columnIndex = 0;
        for (const C of CARDS) {
            ++index;
            ++columnIndex;

            const DESCRIPTION = EXTRACT_BOARD_CARD_CONTENT(C.description);
            const DETAILS = EXTRACT_BOARD_CARD_CONTENT(C.details);

            let filename = vscode_helpers.format(
                FILENAME_FORMAT,
                BC, // {0}
                columnIndex,  // {1}
                vscode_helpers.toStringSafe(C.title).trim(),  // {2}
            ).trim();

            filename = SanitizeFilename(filename).trim();

            if (filename.length > opts.maxNameLength) {
                filename = filename.substr(0, opts.maxNameLength);
            }

            let outputFile: string;
            let filenameSuffix: number;
            do {
                outputFile = filename;

                if (!isNaN(filenameSuffix)) {
                    --filenameSuffix;

                    outputFile += filenameSuffix;
                } else {
                    filenameSuffix = 0;
                }

                outputFile = Path.join(
                    dir,
                    outputFile + '.' + BOARD_CARD_EXPORT_FILE_EXT,
                );

                if (!(await vscode_helpers.exists(outputFile))) {
                    break;
                }
            } while (true);

            let type = vscode_helpers.normalizeString(C.type);
            if ('' === type) {
                type = 'note';
            }

            const META: any = {
                'Column': BC,
                'Type': type,
            };

            let category = vscode_helpers.toStringSafe(C.category).trim();
            if ('' !== category) {
                META['Category'] = category;
            }

            let deadline = vscode_helpers.toStringSafe(C.deadline).trim();
            if ('' !== deadline) {
                META['Deadline'] = deadline;
            }
            let finished_date = vscode_helpers.toStringSafe(C.finished_date).trim();
            if ('' !== finished_date) {
                META['Finished date'] = finished_date;
            }

            let creationTime = vscode_helpers.toStringSafe(C.creation_time).trim();
            if ('' !== creationTime) {
                try {
                    const CT = Moment.utc(creationTime);
                    if (CT.isValid()) {
                        META['Creation time'] = CT.format('YYYY-MM-DD HH:mm:ss') + ' (UTC)';
                    }
                } catch { }
            }

            if (!_.isNil(C.assignedTo)) {
                let assignedTo = vscode_helpers.toStringSafe(C.assignedTo.name).trim();
                if ('' !== assignedTo) {
                    META['Assigned to'] = assignedTo;
                }
            }

            let md = `# ${ HTML_ENCODER.encode( vscode_helpers.toStringSafe(C.title).trim() ) }

## Meta
`;

            for (const M of Object.keys(META).sort()) {
                md += `
* ${ HTML_ENCODER.encode(M) }: \`${ HTML_ENCODER.encode( META[M] ) }\``;
            }

            if (!vscode_helpers.isEmptyString(DESCRIPTION)) {
                md += `

## Description

${ vscode_helpers.toStringSafe(DESCRIPTION) }`;
            }

            if (!vscode_helpers.isEmptyString(DETAILS)) {
                md += `

## Details

${ vscode_helpers.toStringSafe(DETAILS) }`;
            }

            md += `

---

<sup>This document was generated by [Visual Studio Code](https://code.visualstudio.com/) extension [vscode-kanban](https://marketplace.visualstudio.com/items?itemName=mkloubert.vscode-kanban).</sup>`;

            await FSExtra.writeFile(outputFile, md, 'utf8');
        }
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
