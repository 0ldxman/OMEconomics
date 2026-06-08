import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к корню проекта (текущая директория запуска)
const rootDir = process.cwd();
const frontendDir = path.join(rootDir, 'frontend', 'omeweb');

console.log('>>> [Orchestrator] Starting OME Economics System...');
console.log(`>>> [Orchestrator] Root directory: ${rootDir}`);
console.log(`>>> [Orchestrator] Frontend directory: ${frontendDir}`);

// Определяем ОС и задаем правильный путь к Python в venv
const isWindows = process.platform === 'win32';
const pythonExecutable = isWindows ? 'python.exe' : 'python';
const pythonPath = isWindows ? 'Scripts' : 'bin';
const venvPython = path.join(rootDir, '.venv', pythonPath, pythonExecutable);

// Настройки для процессов
const spawnOptions = {
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        PYTHONPATH: rootDir,
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_TELEMETRY_DISABLED: '1'
    }
};

// 1. Запуск Бэкенда (Python)
console.log(`>>> [Orchestrator] Launching Backend using ${venvPython}...`);
const backendProcess = spawn(venvPython, ['main.py'], {
    ...spawnOptions,
    cwd: rootDir
});

// 2. Запуск Фронтенда (Next.js)
console.log('>>> [Orchestrator] Launching Frontend...');
const frontendProcess = spawn('npm', ['run', 'dev:next'], {
    ...spawnOptions,
    cwd: frontendDir
});

// Обработка завершения
const cleanup = () => {
    console.log('\n>>> [Orchestrator] Shutting down...');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backendProcess.on('exit', (code) => {
    console.log(`>>> [Orchestrator] Backend exited with code ${code}`);
    if (code !== 0 && code !== null) cleanup();
});

frontendProcess.on('exit', (code) => {
    console.log(`>>> [Orchestrator] Frontend exited with code ${code}`);
    if (code !== 0 && code !== null) cleanup();
});
