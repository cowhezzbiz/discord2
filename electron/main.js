const { app, BrowserWindow, Menu, dialog, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const https = require('https');

let mainWindow;
let tray;
const APP_VERSION = '1.0.0';
const UPDATE_URL = 'https://discord2-production-956f.up.railway.app';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Discord 2',
    icon: path.join(__dirname, '..', 'client', 'public', 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#111214',
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load from Railway server — always up to date!
  mainWindow.loadURL(UPDATE_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create tray icon
function createTray() {
  const iconPath = path.join(__dirname, '..', 'client', 'public', 'favicon.svg');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon.resize({ width: 16, height: 16 }));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Discord 2',
      click: () => {
        if (mainWindow) mainWindow.show();
      }
    },
    {
      label: 'Reload App',
      accelerator: 'CmdOrCtrl+R',
      click: () => {
        if (mainWindow) mainWindow.reload();
      }
    },
    { type: 'separator' },
    {
      label: 'About Discord 2',
      click: () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Discord 2',
          message: 'Discord 2 Nitro',
          detail: `Version: ${APP_VERSION}\nAlways up to date!`,
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);
  
  tray.setToolTip('Discord 2');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}

// IPC for renderer
ipcMain.handle('get-version', () => APP_VERSION);

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
