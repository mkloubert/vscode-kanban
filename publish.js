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

const vsce = require('vsce');

(async () => {
    try {
        const PAT = process.env.VSCE_TOKEN.trim();
        if ('' === PAT) {
            throw new Error(`No PAT in 'VSCE_TOKEN' defined!`);
        }

        await vsce.publish({
            cwd: __dirname,
            pat: PAT,
            useYarn: false,
        });
    } catch (e) {
        console.error(e);

        process.exit(1);
    }
})();