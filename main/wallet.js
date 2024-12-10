require('dotenv').config();
const { ipcMain } = require('electron');
const { redirectToPage } = require('./window');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Variáveis de criptografia, da api, da chave privada e do endereço
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
var privateKey, address;

// Classe que representa uma rede EVM
class Rede {
  constructor(rede_infura = '', moedaSimbolo = '', scan = '', api_key = '') {
    this.rede_infura = rede_infura;
    this.moedaSimbolo = moedaSimbolo;
    this.scan = scan;
    this.api_key = api_key;
  }
}

// Objetos da classe Rede que representam cada rede EVM do aplicativo
const eth_mainnet = new Rede('mainnet', 'ETH', 'https://api.etherscan.io', process.env.ETH_MAINNET_KEY);
const bsc_mainnet = new Rede('bsc-mainnet', 'BNB', 'https://api.bscscan.com', process.env.BSC_MAINNET_KEY);
const base_mainnet = new Rede('base-mainnet', 'ETH', 'https://api.basescan.org', process.env.BASE_MAINNET_KEY);
const optimism_mainnet = new Rede('optimism-mainnet', 'ETH', 'https://api-optimistic.etherscan.io', process.env.OPTIMISM_MAINNET_KEY);
const arbitrum_mainnet = new Rede('arbitrum-mainnet', 'ETH', 'https://api.arbiscan.io', process.env.ARBITRUM_MAINNET_KEY);

// Variável que representa a rede atual do aplicativo
var redeAtual = eth_mainnet;

// Função para gerar chave para descriptografia de dados
function generateKeyFromPassword(password, salt) {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}

// Função para descriptografar dados
function decryptData(encryptedData, password) {
  const parts = encryptedData.split(':');
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const key = generateKeyFromPassword(password, salt);

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let decryptedData = decipher.update(encryptedText, 'hex', 'utf8');
  decryptedData += decipher.final('utf8');

  return decryptedData;
}

// Função para checar se a carteira EVM existe e está salva corretamente
function verificaCarteira() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

      if (walletData.address && walletData.privateKey) {
      } else {
        redirectToPage('index.html');
      }
    } catch (error) {
      redirectToPage('index.html');
    }
  } else {
    redirectToPage('index.html');
  }
}

// Função para deletar carteira do aplicativo
function deleteWallet() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      fs.unlinkSync(walletPath);
      setTimeout(() => {
        redirectToPage('index.html');
      }, 2000);
      return true;
    } catch (error) {
      return false;
    }
  } else {
    setTimeout(() => {
      redirectToPage('index.html');
    }, 2000);
    return true;
  }
}

// Função para autenticar e descriptografar a carteira
function authenticateWallet(password) {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      const encryptedPrivateKey = walletData.privateKey;
      const encryptedAddress = walletData.address;

      let decryptedPrivateKey = decryptData(encryptedPrivateKey, password);
      let decryptedAddress = decryptData(encryptedAddress, password);

      if (decryptedPrivateKey) {
        address = decryptedAddress;
        privateKey = decryptedPrivateKey;
        setTimeout(() => {
          redirectToPage('wallet.html');
        }, 2000);
        return { success: true };
      } else {
        return { success: false, message: "Senha incorreta!" };
      }
    } catch (error) {
      return { success: false, message: "Senha incorreta!"};
    }
  } else {
    redirectToPage('index.html');
    return { success: false, message: "Carteira não encontrada!" };
  }
}

// Função para mostrar a chave privada da carteira
function showPrivateKey(password){
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      const encryptedPrivateKey = walletData.privateKey;
      let decryptedPrivateKey = decryptData(encryptedPrivateKey, password);
      
      if (decryptedPrivateKey) {
        return decryptedPrivateKey;
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

// Função para mudar a rede atual do aplicativo
function mudaRede(rede) {
  switch(rede){
    case 'mainnet':
        redeAtual = eth_mainnet;
      break;
    case 'bsc-mainnet':
        redeAtual = bsc_mainnet;
      break;
    case 'base-mainnet':
        redeAtual = base_mainnet;
      break;
    case 'optimism-mainnet':
        redeAtual = optimism_mainnet;
      break;
    case 'arbitrum-mainnet':
        redeAtual = arbitrum_mainnet;
      break;
    default:
      redeAtual = eth_mainnet;
  }
}

// Função para obter o valor atual da moeda em USD
async function getPrice() {
  try {
    response = await fetch(`${redeAtual.scan}/api?module=stats&action=${redeAtual.moedaSimbolo}price&apikey=${redeAtual.api_key}`);
    data = await response.json();

    if (data.status === "1") {
      const coinPriceUSD = data.result.ethusd;
      return coinPriceUSD;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

// Função para retornar os dados principais da carteira
async function retornaDadosCarteira() {
  try {

    const provider = new ethers.JsonRpcProvider('https://' + redeAtual.rede_infura + '.infura.io/v3/' + INFURA_API_KEY);

    const balanceWei = await provider.getBalance(address);
    const balanceCoin = ethers.formatEther(balanceWei);

    const priceCoinUSD = await getPrice();
    const balanceUSD = priceCoinUSD ? (balanceCoin * priceCoinUSD).toFixed(2) : "";

    return { address, balanceCoin, balanceUSD };
  } catch (error) {
    return { balanceCoin: null, balanceUSD: null };
  }
}

// Função para retornar os tokens importados da carteira e da rede atual
async function retornarTokens() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

      if (walletData && walletData.tokens && Array.isArray(walletData.tokens)) {
        let tokens = [];

        for (const token of walletData.tokens) {
          if (token.rede === redeAtual.rede_infura) {
            const dados = await buscarToken(token.contract);
            token.amount = dados.balance;
            tokens.push(token);
          }
        }

        fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

        return tokens;
      } else {
        return [];
      }
    } catch (error) {
      return { success: false, message: "Erro ao ler o arquivo!" };
    }
  } else {
    redirectToPage('index.html');
    return { success: false, message: "Carteira não encontrada!" };
  }
}

// Função para enviar Moeda
async function sendCoin(destinationAddress, amountInCoin) {
  try {

    const amountInWei = ethers.parseUnits(amountInCoin, 'ether');

    const tx = {
      to: destinationAddress,
      value: amountInWei,
    };

    const provider = new ethers.JsonRpcProvider('https://' + redeAtual.rede_infura + '.infura.io/v3/' + INFURA_API_KEY); 

    userWallet = new ethers.Wallet(privateKey).connect(provider);

    const txResponse = await userWallet.sendTransaction(tx);

    const txReceipt = await txResponse.wait();

    return { success: true, response: txReceipt.hash };

  } catch (error) {
    return { success: false, response: error.message };
  }
}

// Função para buscar um token na rede atual
async function buscarToken(tokenAddress) {
  try {

      if (!address) {
        throw new Error('Nenhuma carteira carregada.');
      } 

      const provider = new ethers.JsonRpcProvider('https://' + redeAtual.rede_infura + '.infura.io/v3/' + INFURA_API_KEY); 

      const tokenABI = [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function name() view returns (string)",
          "function symbol() view returns (string)"
      ];
      
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      const tokenName = await tokenContract.name();
      const tokenSymbol = await tokenContract.symbol();
      
      return {
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          balance: formattedBalance,
          decimals: decimals
      };
  } catch (error) {
      throw new Error("Erro ao buscar dados do token. Por favor, tente novamente mais tarde.");
  }
}

// Função para adicionar um token na carteira
async function addTokenToWallet(tokenAddress) {
  try {
    const tokenData = await buscarToken(tokenAddress);

    const walletPath = path.join(__dirname, 'wallet.json');
    let walletData = fs.existsSync(walletPath) ? JSON.parse(fs.readFileSync(walletPath)) : {};

    // Verificar se o token já não está na carteira
    if (walletData.tokens) {
      const tokenExists = walletData.tokens.some(token => token.contract === tokenAddress);
      if (tokenExists) {
        return {
          result: false
        };
      }
    } else {
      walletData.tokens = [];
    }

    walletData.tokens.push({
      contract: tokenAddress,
      name: tokenData.tokenName,
      symbol: tokenData.tokenSymbol,
      amount: parseFloat(tokenData.balance),
      rede: redeAtual.rede_infura,
      decimals: parseFloat(tokenData.decimals)
    });

    fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));

    return {
      result: tokenData.tokenName
    };
  } catch (error) {
    return {
      result: false
    };
  }
}

//Função para excluir um token da carteira
async function excluirToken(tokenIndex) {
  try {
    if (!address) {
      throw new Error('Nenhuma carteira carregada.');
    }

    const walletPath = path.join(__dirname, 'wallet.json');
    let walletData = fs.existsSync(walletPath) ? JSON.parse(fs.readFileSync(walletPath)) : {};

    if (!walletData.tokens || !Array.isArray(walletData.tokens)) {
      throw new Error('Nenhum token encontrado na carteira.');
    }

    if (tokenIndex >= 0 && tokenIndex < walletData.tokens.length) {
      walletData.tokens.splice(tokenIndex, 1);

      fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
      return true;
    } else {
      return false;
    }

  } catch (error) {
    return false;
  }
}

//Função para enviar um token para outra carteira
async function enviarToken(tokenAddress, destino, quantidade) {
  try {
    if (!address || !privateKey) {
      throw new Error('Nenhuma carteira ou chave privada carregada.');
    }

    const provider = new ethers.JsonRpcProvider(`https://${redeAtual.rede_infura}.infura.io/v3/${INFURA_API_KEY}`);
    
    const signer = new ethers.Wallet(privateKey, provider);

    const tokenABI = [
      "function decimals() view returns (uint8)",
      "function transfer(address recipient, uint256 amount) public returns (bool)"
    ];

    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);

    const tokenDecimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(quantidade.toString(), tokenDecimals);

    const tx = await tokenContract.transfer(destino, amountInWei);
    
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      return tx.hash;
    } else {
      return false
    }

  } catch (error) {
    return false
  }
}

// Expondo a função de verificar carteira para o front-end via IPC
ipcMain.handle('verificaCarteira', (event) => {
    return verificaCarteira();
});

// Expondo a função de deletar carteira para o front-end via IPC
ipcMain.handle('deleteWallet', async (event) => {
  return deleteWallet();
});

// Expondo a função de autenticacao de carteira para o front-end via IPC
ipcMain.handle('authenticateWallet', (event, password) => {
  return authenticateWallet(password);
});

// Expondo a função de mostrar chave privada da carteira para o front-end via IPC
ipcMain.handle('showPrivateKey', (event, password) => {
  return showPrivateKey(password);
});

// Expondo a função de mudar rede para o front-end via IPC
ipcMain.handle('mudaRede', (event, rede) => {
  return mudaRede(rede);
});

// Expondo a função de retornar os tokens da carteira para o front-end via IPC
ipcMain.handle('retornarTokens', (event) => {
  return retornarTokens();
});

// Expondo a função de retornar os dados da carteira para o front-end via IPC
ipcMain.handle('retornaDadosCarteira', (event) => {
  return retornaDadosCarteira();
});

// Expondo a função de enviar moeda da carteira para o front-end via IPC
ipcMain.handle('sendCoin', (event, destinationAddress, amountInCoin) => {
  return sendCoin(destinationAddress, amountInCoin);
});

// Expondo a função de adicionar um token na carteira para o front-end via IPC
ipcMain.handle('addTokenToWallet', (event, tokenAddress) => {
  return addTokenToWallet(tokenAddress);
});

// Expondo a função de excluir um token da carteira para o front-end via IPC
ipcMain.handle('excluirToken', (event, tokenIndex) => {
  return excluirToken(tokenIndex);
});

// Expondo a função de enviar um token da carteira para o front-end via IPC
ipcMain.handle('enviarToken', (event, tokenAddress, destino, quantidade) => {
  return enviarToken(tokenAddress, destino, quantidade);
});