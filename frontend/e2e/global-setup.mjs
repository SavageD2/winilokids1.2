import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');
const backendDir = path.join(repoRoot, 'backend');

function run(command, cwd) {
  execSync(command, {
    cwd,
    stdio: 'inherit',
  });
}

export default async function globalSetup() {
  run('docker compose up -d postgres', repoRoot);
  run('npm run prisma:migrate:deploy', backendDir);
  run('npm run seed:admin', backendDir);
  run('npm run seed:demo', backendDir);
}
