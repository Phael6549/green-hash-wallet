const { app, BrowserWindow } = require('electron');
const { createWindow } = require('./window');  // Importando a função para criar a janela
const { checkWallet } = require('./index');  // Importando as funções da página inicial
require('./wallet'); // Importando as funções da página wallet

// Configura a criação da janela após a verificação da carteira
app.whenReady().then(() => {
  const walletFound = checkWallet();  // Verifica se a carteira existe
  
  // Se a carteira for encontrada, carrega a página 'wallet.html', caso contrário, carrega 'index.html'
  const initialPage = walletFound ? 'unlock.html' : 'index.html';

  createWindow(initialPage);  // Passa o caminho da página inicial para o createWindow

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(initialPage);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});