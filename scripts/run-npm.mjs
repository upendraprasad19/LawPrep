import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
// Run npm through Node: Windows .cmd shims cannot be spawned without a shell.
const npm = process.env.npm_execpath ?? join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const result = spawnSync(process.execPath, [npm, 'run', ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
