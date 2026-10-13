import { spawn, spawnSync } from 'node:child_process';

const npmCliPath = process.env.npm_execpath;

if (!npmCliPath) {
  throw new Error('npm_execpath is unavailable. Start development with npm run dev.');
}

const workspaces = ['@rozgar-links/server', '@rozgar-links/client'];
const children = workspaces.map((workspace) =>
  spawn(process.execPath, [npmCliPath, 'run', 'dev', '--workspace', workspace], {
    stdio: 'inherit',
    windowsHide: true,
  }),
);

let isStopping = false;

function stop(exitCode = 0) {
  if (isStopping) return;
  isStopping = true;

  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;

    if (process.platform === 'win32') {
      spawnSync('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      child.kill('SIGTERM');
    }
  }

  process.exitCode = exitCode;
}

for (const child of children) {
  child.on('error', (error) => {
    console.error('Unable to start development workspace.', error.message);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (!isStopping && code !== 0) {
      console.error(`A development workspace stopped (${signal ?? `code ${code}`}).`);
      stop(code ?? 1);
    }
  });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
