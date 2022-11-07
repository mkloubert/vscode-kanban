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

import * as vscode from 'vscode';

const REFACTORING_ANNOUNCEMENT_KEY = 'vsckb_announcement_20201009_655f729b';
const REFACTORING_ANNOUNCEMENT_DNSA_VALUE = '3';

interface MessageItem extends vscode.MessageItem {
    id: number;
}

/**
 * Shows announcements.
 */
export async function showAnnouncements(context: vscode.ExtensionContext) {
    //TODO: load from external resource

    let doNotShowAgain = false;

    try {
        const VALUE = context.globalState.get<string>(REFACTORING_ANNOUNCEMENT_KEY);
        if (VALUE !== REFACTORING_ANNOUNCEMENT_DNSA_VALUE) {
            const BTN = await vscode.window.showWarningMessage<MessageItem>(
                "[VSCODE-KANBAN] Do you like to code in TypeScript and/or React.js and help refactoring the extension?",
                {
                    id: 1,
                    title: 'YES',
                },
                {
                    id: 2,
                    title: 'No, but DONATE',
                },
                {
                    id: 3,
                    title: 'Later',
                },
                {
                    id: 4,
                    title: "Don't show again",
                }
            );

            if (BTN) {
                switch (BTN.id) {
                    case 1:
                        // yes
                        doNotShowAgain = await vscode.env.openExternal(vscode.Uri.parse('https://github.com/vscode-kanban/vscode-kanban/issues/16'));
                        break;

                    case 2:
                        // donate
                        {
                            const DONATE_BTN = await vscode.window.showWarningMessage<MessageItem>(
                                "Thanks a lot 🙏🙏🙏 What whould you like to do?",
                                {
                                    id: 1,
                                    title: "Open author's homepage",
                                },
                                {
                                    id: 2,
                                    title: 'Currently nothing',
                                },
                            );

                            if (DONATE_BTN) {
                                switch (DONATE_BTN.id) {
                                    case 1:
                                        // author's homepage
                                        doNotShowAgain = await vscode.env.openExternal(vscode.Uri.parse('https://marcel.coffee/'));
                                        break;
                                }
                            }
                        }
                        break;

                    case 4:
                        doNotShowAgain = true;  // do not show again
                        break;
                }
            }
        }
    } finally {
        if (doNotShowAgain) {
            await context.globalState.update(REFACTORING_ANNOUNCEMENT_KEY, REFACTORING_ANNOUNCEMENT_DNSA_VALUE);
        }
    }
}
