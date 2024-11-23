const { contextBridge, ipcRenderer } = require('electron');

// Expondo as funções para o front-end
contextBridge.exposeInMainWorld('cryptoAPI', {
  createWallet: (password) => ipcRenderer.invoke('createWallet', password),
  importWallet: (privateKey, password) => ipcRenderer.invoke('importWallet', privateKey, password),
  verificaCarteira: () => ipcRenderer.invoke('verificaCarteira'),
  deleteWallet: () => ipcRenderer.invoke('deleteWallet'),
  authenticateWallet: (password) => ipcRenderer.invoke('authenticateWallet', password),
  showPrivateKey: (password) => ipcRenderer.invoke('showPrivateKey', password),
  mudaRede: (rede) => ipcRenderer.invoke('mudaRede', rede),
  retornarTokens: () => ipcRenderer.invoke('retornarTokens'),
  retornaDadosCarteira: () => ipcRenderer.invoke('retornaDadosCarteira'),
  sendCoin: (destinationAddress, amountInCoin) => ipcRenderer.invoke('sendCoin', destinationAddress, amountInCoin),
  addTokenToWallet: (tokenAddress) => ipcRenderer.invoke('addTokenToWallet', tokenAddress),
  excluirToken: (tokenIndex) => ipcRenderer.invoke('excluirToken', tokenIndex),
  enviarToken: (tokenAddress, destino, quantidade) => ipcRenderer.invoke('enviarToken', tokenAddress, destino, quantidade),
});