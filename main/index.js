const { ipcMain } = require('electron');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { redirectToPage } = require('./window');

// Variáveis de criptografia
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Função para gerar chave para criptografia de dados
function generateKeyFromPassword(password, salt) {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

// Função para criptografar dados
function encryptData(data, password) {
  const salt = crypto.randomBytes(16);
  const key = generateKeyFromPassword(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');

  return `${salt.toString('hex')}:${iv.toString('hex')}:${encryptedData}`;
}

// Função para checar se a carteira EVM existe e está salva corretamente
function checkWallet() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

      if (walletData.address && walletData.privateKey) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  } else {
    return false;
  }
}

// Função para criar uma carteira EVM, criptografar e salvar no arquivo
function createAndSaveWallet(password) {
  try {
    const wallet = ethers.Wallet.createRandom();
    const walletPath = path.join(__dirname, 'wallet.json');

    const encryptedPrivateKey = encryptData(wallet.privateKey, password);
    const encryptedAddress = encryptData(wallet.address, password);

    const encryptedWalletData = {
      address: encryptedAddress,
      privateKey: encryptedPrivateKey
    };

    fs.writeFileSync(walletPath, JSON.stringify(encryptedWalletData));

    setTimeout(() => {
      redirectToPage('unlock.html');
    }, 2000);

    return { success: true};

  } catch (error) {
    return { success: false, message: 'Erro ao criar a carteira!' };
  }
}

// Função para importar uma carteira EVM, criptografar e salvar no arquivo
function importAndSaveWallet(privateKey, password) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const walletPath = path.join(__dirname, 'wallet.json');

    const encryptedPrivateKey = encryptData(wallet.privateKey, password);
    const encryptedAddress = encryptData(wallet.address, password);

    const encryptedWalletData = {
      address: encryptedAddress,
      privateKey: encryptedPrivateKey
    };

    fs.writeFileSync(walletPath, JSON.stringify(encryptedWalletData));

    setTimeout(() => {
      redirectToPage('unlock.html');
    }, 2000);

    return { success: true};

  } catch (error) {
    return { success: false};
  }
}

// Expondo a função de importação da carteira para o front-end via IPC
ipcMain.handle('importWallet', (event, privateKey, password) => {
  return importAndSaveWallet(privateKey, password);
});

// Expondo a função de criação de carteira para o front-end via IPC
ipcMain.handle('createWallet', (event, password) => {
  return createAndSaveWallet(password);
});

// Exportando função checkWallet
module.exports = { checkWallet };