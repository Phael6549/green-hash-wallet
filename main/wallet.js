require('dotenv').config();
const { ipcMain } = require('electron');
const { redirectToPage } = require('./window');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32;
const INFURA_API_KEY = process.env.INFURA_API_KEY;
var privateKey, address;

class Rede {
  constructor(rede_infura = '', moedaSimbolo = '', scan = '', api_key = '') {
    this.rede_infura = rede_infura;
    this.moedaSimbolo = moedaSimbolo;
    this.scan = scan;
    this.api_key = api_key;
  }
}

const eth_mainnet = new Rede('mainnet', 'ETH', 'https://api.etherscan.io', process.env.ETH_MAINNET_KEY);
const eth_test_sepolia = new Rede('sepolia', 'ETH', 'https://api-sepolia.etherscan.io', process.env.ETH_TEST_SEPOLIA_KEY);
const bsc_mainnet = new Rede('bsc-mainnet', 'BNB', 'https://api.bscscan.com', process.env.BSC_MAINNET_KEY);
const base_mainnet = new Rede('base-mainnet', 'ETH', 'https://api.basescan.org', process.env.BASE_MAINNET_KEY);
const polygon_amoy = new Rede('polygon-mainnet', 'MATIC', 'https://api.polygonscan.com', process.env.POLYGON_AMOY_KEY);
const optimism_mainnet = new Rede('optimism-mainnet', 'ETH', 'https://api-optimistic.etherscan.io', process.env.OPTIMISM_MAINNET_KEY);
const arbitrum_mainnet = new Rede('arbitrum-mainnet', 'ETH', 'https://api.arbiscan.io', process.env.ARBITRUM_MAINNET_KEY);

var redeAtual = eth_mainnet;

function generateKeyFromPassword(password, salt) {
  return crypto.scryptSync(password, salt, KEY_LENGTH);
}
  
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

function verificaCarteira() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));

      // Verifica se o arquivo contém o formato esperado
      if (walletData.address && walletData.privateKey) {
      } else {
        redirectToPage('index.html'); // Redirecionar para a página wallet.html
      }
    } catch (error) {
      redirectToPage('index.html'); // Redirecionar para a página wallet.html
    }
  } else {
    redirectToPage('index.html'); // Redirecionar para a página wallet.html
  }
}

function deleteWallet() {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      fs.unlinkSync(walletPath); // Deleta o arquivo wallet.json
      setTimeout(() => {
        redirectToPage('index.html'); // Redireciona para outra página
      }, 2000);
      return true;
    } catch (error) {
      return false;
    }
  } else {
    setTimeout(() => {
      redirectToPage('index.html'); // Redireciona para outra página
    }, 2000);
    return true;
  }
}

// Função para autenticar e descriptografar a carteira de forma síncrona
function authenticateWallet(password) {
  const walletPath = path.join(__dirname, 'wallet.json');

  if (fs.existsSync(walletPath)) {
    try {
      const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      const encryptedPrivateKey = walletData.privateKey;
      const encryptedAddress = walletData.address;

      // Descriptografa os dados usando a senha fornecida
      let decryptedPrivateKey = decryptData(encryptedPrivateKey, password);
      let decryptedAddress = decryptData(encryptedAddress, password);

      if (decryptedPrivateKey) {
        address = decryptedAddress;
        privateKey = decryptedPrivateKey;
        setTimeout(() => {
          redirectToPage('wallet.html'); // Redireciona para outra página
        }, 2000);
        return { success: true };
      } else {
        return { success: false, message: "Senha incorreta!" };
      }
    } catch (error) {
      return { success: false, message: "Senha incorreta!"};
    }
  } else {
    redirectToPage('index.html'); // Redirecionar para a página wallet.html
    return { success: false, message: "Carteira não encontrada!" };
  }
}

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

function mudaRede(rede) {
  switch(rede){
    case 'mainnet':
        redeAtual = eth_mainnet;
      break;
    case 'sepolia':
        redeAtual = eth_test_sepolia;
      break;
    case 'bsc-mainnet':
        redeAtual = bsc_mainnet;
      break;
    case 'base-mainnet':
        redeAtual = base_mainnet;
      break;
    case 'polygon-amoy':
        redeAtual = polygon_amoy;
      break;
    case 'optimism-mainnet':
        redeAtual = optimism_mainnet;
      break;
    case 'arbitrum-mainnet':
        redeAtual = arbitrum_mainnet;
      break;
    default:

  }
}

// Função para obter o valor atual de uma moeda em USD
async function getPrice() {
  try {
    response = await fetch(`${redeAtual.scan}/api?module=stats&action=${redeAtual.moedaSimbolo}price&apikey=${redeAtual.api_key}`);
    data = await response.json();

    if (data.status === "1") {
      const coinPriceUSD = data.result.ethusd; // Valor da moeda em USD
      return coinPriceUSD;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

async function retornaDadosCarteira() {
  try {

    // Configuração do provedor para interagir com a rede EVM
    const provider = new ethers.JsonRpcProvider('https://' + redeAtual.rede_infura + '.infura.io/v3/' + INFURA_API_KEY); // Substitua com seu ID da Infura ou outro provedor

    // Obter o saldo da carteira
    const balanceWei = await provider.getBalance(address);
    const balanceCoin = ethers.formatEther(balanceWei);

    // Obter o preço em USD
    const priceCoinUSD = await getPrice();
    const balanceUSD = priceCoinUSD ? (balanceCoin * priceCoinUSD).toFixed(2) : "";

    return { address, balanceCoin, balanceUSD };
  } catch (error) {
    return { balanceCoin: null, balanceUSD: null };
  }
}

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

        // Escrevendo no arquivo após o loop, quando todos os tokens foram processados
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

// Função para enviar ETH
async function sendCoin(destinationAddress, amountInCoin) {
  try {

    // Converter o valor para wei (as transações no Ethereum são feitas em wei)
    const amountInWei = ethers.parseUnits(amountInCoin, 'ether');

    // Preparar a transação
    const tx = {
      to: destinationAddress,
      value: amountInWei,
    };

    // Configuração do provedor para interagir com a rede EVM
    const provider = new ethers.JsonRpcProvider('https://' + redeAtual.rede_infura + '.infura.io/v3/' + INFURA_API_KEY); 

    // Criar a carteira com a chave privada e associar ao provedor
    userWallet = new ethers.Wallet(privateKey).connect(provider);

    // Enviar a transação e aguardar a confirmação
    const txResponse = await userWallet.sendTransaction(tx);

    // Aguardar a transação ser confirmada
    const txReceipt = await txResponse.wait();

    // Exibir a confirmação para o usuário
    return { success: true, response: txReceipt.hash };

  } catch (error) {
    return { success: false, response: error.message };
  }
}

async function buscarToken(tokenAddress) {
  try {

      if (!address) {
        throw new Error('Nenhuma carteira carregada.');
      } 

      const provider = new ethers.JsonRpcProvider('https://' + redeAtual.rede_infura + '.infura.io/v3/' + INFURA_API_KEY); 

      // ABI mínima para interagir com um token ERC-20 (balanceOf, decimals, name e symbol)
      const tokenABI = [
          "function balanceOf(address owner) view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function name() view returns (string)",
          "function symbol() view returns (string)"
      ];
      
      // Criar uma instância do contrato do token
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, provider);

      // Obter informações do token
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      const formattedBalance = ethers.formatUnits(balance, decimals);
      const tokenName = await tokenContract.name();
      const tokenSymbol = await tokenContract.symbol();
      
      // Retornar os dados do token em um objeto
      return {
          tokenName: tokenName,
          tokenSymbol: tokenSymbol,
          balance: formattedBalance,
          decimals: decimals
      };
  } catch (error) {
      // Em caso de erro, capturar e exibir a mensagem
      throw new Error("Erro ao buscar dados do token. Por favor, tente novamente mais tarde.");
  }
}

async function addTokenToWallet(tokenAddress) {
  try {
    const tokenData = await buscarToken(tokenAddress);

    // Obter ou criar dados da carteira em wallet.json
    const walletPath = path.join(__dirname, 'wallet.json');
    let walletData = fs.existsSync(walletPath) ? JSON.parse(fs.readFileSync(walletPath)) : {};

    // Verificar se o token já está na carteira
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

    // Adicionar o token à lista na carteira
    walletData.tokens.push({
      contract: tokenAddress,
      name: tokenData.tokenName,
      symbol: tokenData.tokenSymbol,
      amount: parseFloat(tokenData.balance),
      rede: redeAtual.rede_infura,
      decimals: parseFloat(tokenData.decimals)
    });

    // Salvar a carteira no wallet.json
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

//Função para excluir um token
async function excluirToken(tokenIndex) {
  try {
    if (!address) {
      throw new Error('Nenhuma carteira carregada.');
    }

    // Obter os dados da carteira de wallet.json
    const walletPath = path.join(__dirname, 'wallet.json');
    let walletData = fs.existsSync(walletPath) ? JSON.parse(fs.readFileSync(walletPath)) : {};

    // Verificar se existe tokens
    if (!walletData.tokens || !Array.isArray(walletData.tokens)) {
      throw new Error('Nenhum token encontrado na carteira.');
    }

    // Verificar se o índice do token é válido
    if (tokenIndex >= 0 && tokenIndex < walletData.tokens.length) {
      // Remover o token da lista de tokens
      walletData.tokens.splice(tokenIndex, 1);

      // Atualizar o wallet.json com a lista sem o token excluído
      fs.writeFileSync(walletPath, JSON.stringify(walletData, null, 2));
      return true;
    } else {
      return false;
    }

  } catch (error) {
    return false;
  }
}

//Função para enviar um token
async function enviarToken(tokenAddress, destino, quantidade) {
  try {
    if (!address || !privateKey) {
      throw new Error('Nenhuma carteira ou chave privada carregada.');
    }

    // Configurar o provedor (usando Infura como exemplo)
    const provider = new ethers.JsonRpcProvider(`https://${redeAtual.rede_infura}.infura.io/v3/${INFURA_API_KEY}`);
    
    // Criar a instância da carteira
    const signer = new ethers.Wallet(privateKey, provider);

    // ABI mínima para transferir um token ERC-20
    const tokenABI = [
      "function decimals() view returns (uint8)",
      "function transfer(address recipient, uint256 amount) public returns (bool)"
    ];

    // Criar a instância do contrato do token
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);

    // Calcular o valor a ser enviado, considerando os decimais do token
    const tokenDecimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(quantidade.toString(), tokenDecimals);

    // Enviar a transação
    const tx = await tokenContract.transfer(destino, amountInWei);
    
    // Esperar pela confirmação da transação
    const receipt = await tx.wait();

    // Confirmar o envio e mostrar os detalhes
    if (receipt.status === 1) {
      return tx.hash;
    } else {
      return false
    }

  } catch (error) {
    return false
  }
}

// Expondo a função de importação da carteira para o front-end via IPC
ipcMain.handle('verificaCarteira', (event) => {
    return verificaCarteira();
});

ipcMain.handle('deleteWallet', async (event) => {
  return deleteWallet();
});

// Expondo a função de autenticacao de carteira para o front-end via IPC
ipcMain.handle('authenticateWallet', (event, password) => {
  return authenticateWallet(password);
});

// Expondo a função de autenticacao de carteira para o front-end via IPC
ipcMain.handle('showPrivateKey', (event, password) => {
  return showPrivateKey(password);
});

// Expondo a função de mudar rede para o front-end via IPC
ipcMain.handle('mudaRede', (event, rede) => {
  return mudaRede(rede);
});

// Expondo a função de exclusão de carteira para o front-end via IPC
ipcMain.handle('retornarTokens', (event) => {
  return retornarTokens();
});

// Expondo a função de exclusão de carteira para o front-end via IPC
ipcMain.handle('retornaDadosCarteira', (event) => {
  return retornaDadosCarteira();
});

// Expondo a função de exclusão de carteira para o front-end via IPC
ipcMain.handle('sendCoin', (event, destinationAddress, amountInCoin) => {
  return sendCoin(destinationAddress, amountInCoin);
});

// Expondo a função de autenticacao de carteira para o front-end via IPC
ipcMain.handle('addTokenToWallet', (event, tokenAddress) => {
  return addTokenToWallet(tokenAddress);
});

// Expondo a função de autenticacao de carteira para o front-end via IPC
ipcMain.handle('excluirToken', (event, tokenIndex) => {
  return excluirToken(tokenIndex);
});

// Expondo a função de autenticacao de carteira para o front-end via IPC
ipcMain.handle('enviarToken', (event, tokenAddress, destino, quantidade) => {
  return enviarToken(tokenAddress, destino, quantidade);
});