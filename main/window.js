const { BrowserWindow, shell } = require('electron');
const path = require('path');

var win;

function createWindow(initialPage) {

  win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'img', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
    },
  });

  // Ocultar a barra de menu
  win.setMenuBarVisibility(false);

  // Carrega a página inicial com base na verificação da carteira
  win.loadFile(path.join(__dirname, '..', 'src', 'html', initialPage));

  // Impede navegação fora da janela
  win.webContents.on('will-navigate', (event, url) => {
    if (url !== win.webContents.getURL()) {
      if (url.startsWith('https://') || url.startsWith('http://')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function redirectToPage(page) {
  if (win) {
    win.loadFile(path.join(__dirname, '..', 'src', 'html', page));
  }
}

module.exports = {
  createWindow,
  redirectToPage,
};