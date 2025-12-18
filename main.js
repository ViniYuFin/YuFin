const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProcess;
const isWin = process.platform === 'win32';

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Altere para o caminho do seu build (Vite)
  win.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(() => {
  // Caminho do backend empacotado
  let backendPath;
  if (isWin) {
    backendPath = path.join(process.resourcesPath, 'backend', 'backend.exe');
    backendProcess = spawn(backendPath, [], {
      cwd: path.dirname(backendPath),
      stdio: 'ignore',
      shell: false,
      detached: true,
      windowsHide: true
    });
    backendProcess.unref();
  } else {
    backendPath = path.join(process.resourcesPath, 'backend', 'backend');
    backendProcess = spawn(backendPath, [], {
      cwd: path.dirname(backendPath),
      stdio: 'ignore',
      shell: false,
      detached: true
    });
    backendProcess.unref();
  }
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Encerra o backend ao fechar o app
  if (backendProcess) backendProcess.kill();
  if (process.platform !== 'darwin') app.quit();
}); 