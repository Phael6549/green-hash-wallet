const { app, BrowserWindow } = require('electron');
const { createWindow } = require('./window');
const { checkWallet } = require('./index');
require('./wallet');

// Função para configurar a criação da janela
app.whenReady().then(() => {
  const walletFound = checkWallet();  // Verifica se a carteira existe
  
  // Se a carteira for encontrada, carrega a página 'wallet.html', caso contrário, carrega 'index.html'
  const initialPage = walletFound ? 'unlock.html' : 'index.html';

  createWindow(initialPage);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(initialPage);
  });
});

// Função para finalizar aplicativo
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});