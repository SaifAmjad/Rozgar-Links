import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const workspaces = ['@rozgar-links/server', '@rozgar-links/client'];
const children = workspaces.map((workspace) =>
  spawn(npmCommand, ['run', 'dev', '--workspace', workspace], {
    stdio: 'inherit',
  }),
);

let isStopping = false;

function stop(exitCode = 0) {
  if (isStopping) return;
  isStopping = true;

  for (const child of children) {
    child.kill();
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
