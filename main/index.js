const { ipcMain } = require('electron');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { redirectToPage } = require('./window');

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function generateKeyFromPassword(password, salt) {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

function encryptData(data, password) {
  const salt = crypto.randomBytes(16);
  const key = generateKeyFromPassword(password, salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');

  return `${salt.toString('hex')}:${iv.toString('hex')}:${encryptedData}`;
}

function checkWallet() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

      // Verifica se o arquivo contém o formato esperado
      if (walletData.address && walletData.privateKey) {
        return true; // Retorna verdadeiro se o arquivo contém os dados esperados
      } else {
        return false; // Retorna falso se faltar algum campo
      }
    } catch (error) {
      return false; // Retorna falso em caso de erro ao ler o arquivo
    }
  } else {
    return false; // Retorna falso se o arquivo não existir
  }
}

// Função para criar uma carteira EVM, criptografar e salvar no arquivo
function createAndSaveWallet(password) {
  try {
    const wallet = ethers.Wallet.createRandom();
    const walletPath = path.join(__dirname, 'wallet.json');

    // Criptografar a chave privada
    const encryptedPrivateKey = encryptData(wallet.privateKey, password);
    const encryptedAddress = encryptData(wallet.address, password);

    const encryptedWalletData = {
      address: encryptedAddress,
      privateKey: encryptedPrivateKey
    };

    // Salvar o arquivo wallet.json
    fs.writeFileSync(walletPath, JSON.stringify(encryptedWalletData));

    setTimeout(() => {
      redirectToPage('unlock.html'); // Redireciona para outra página
    }, 2000);

    return { success: true};

  } catch (error) {
    return { success: false, message: 'Erro ao criar a carteira!' };
  }
}

// Função para importar a carteira EVM e criptografar a chave privada
function importAndSaveWallet(privateKey, password) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const walletPath = path.join(__dirname, 'wallet.json');

    // Criptografar a chave privada
    const encryptedPrivateKey = encryptData(wallet.privateKey, password);
    const encryptedAddress = encryptData(wallet.address, password);

    const encryptedWalletData = {
      address: encryptedAddress,
      privateKey: encryptedPrivateKey
    };

    // Salvar o arquivo wallet.json
    fs.writeFileSync(walletPath, JSON.stringify(encryptedWalletData));

    setTimeout(() => {
      redirectToPage('unlock.html'); // Redireciona para outra página
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

module.exports = { checkWallet };