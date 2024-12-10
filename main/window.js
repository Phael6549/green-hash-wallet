const { BrowserWindow, shell } = require('electron');
const path = require('path');

// Variável que representa a janela do aplicativo
var win;

// Função para criar a janela do aplicativo
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

  win.setMenuBarVisibility(false);

  win.loadFile(path.join(__dirname, '..', 'src', 'html', initialPage));

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

// Função para redirecionar para outra página
function redirectToPage(page) {
  if (win) {
    win.loadFile(path.join(__dirname, '..', 'src', 'html', page));
  }
}

// Exportando funções createWindow e redirectToPage
module.exports = {
  createWindow,
  redirectToPage,
};