// electron.mjs
import { app, BrowserWindow } from 'electron';
import path from 'path';

const isDev = !app.isPackaged; // самый надёжный способ определить режим разработки

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false, // пока не загрузится — не показываем
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.on('did-finish-load', () => {
      win.show();
      win.webContents.openDevTools({ mode: 'detach' });
    });
  } else {
    win.loadFile(path.join(process.resourcesPath, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});