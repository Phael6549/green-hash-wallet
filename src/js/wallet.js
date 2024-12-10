// Variáveis da rede atual
var redeAPI = 'mainnet';
var moeda = 'Ethereum';
var moedaSimbolo = 'ETH';

// Variável que representa o switcher de troca de rede
const networkSwitcher = document.getElementById('networkSwitcher');

// Chama a função para ler os dados da carteira inicialmente e depois a cada 10 segundos
loadWallet();
setInterval(loadWallet, 10000);

// Função para ler os dados da carteira
async function loadWallet() {
  try {

    listaTokens();

    await window.cryptoAPI.retornaDadosCarteira()
    .then((dados) => {
      address = dados.address;
      balanceCoin = dados.balanceCoin;
      balanceUSD = dados.balanceUSD;
    })
    .catch(error => {
      showMessageModal('Erro ao buscar dados da carteira!', 'danger')
    }
    );
    
    document.getElementById('walletAddress').innerText = `Endereço da Carteira: ${address}`;
    document.getElementById('walletBalance').innerText = `Saldo da Carteira: ${balanceCoin} ` + moedaSimbolo + ` ($${balanceUSD} USD)`;

  } catch (error) {
    showMessageModal('Erro ao carregar a carteira!', 'danger')
  }
}

// Listener para troca de rede
if (networkSwitcher) {
  networkSwitcher.addEventListener('change', function() {

    window.cryptoAPI.mudaRede(this.value)
      .then(() => {
        showMessageModal('Rede alterada com sucesso!', 'success')

        moeda = this.options[this.selectedIndex].text;
        moedaSimbolo = this.options[this.selectedIndex].getAttribute('simbolo');
  
        document.querySelectorAll('.simbolo').forEach(element => {
          element.innerText = moedaSimbolo; 
        });
    
        document.getElementById('moeda').innerText = moeda;
  
        loadWallet();

      })
      .catch(error => {
        showMessageModal('Erro ao alterar a rede!', 'danger')

        networkSwitcher.value = "mainnet";
      }
    );
  });
}

// Listener para o o modal de enviar moeda
document.getElementById('enviar-eth').addEventListener('click', () => {
  const sendETHModal = new bootstrap.Modal(document.getElementById('sendETHModal'),);
  sendETHModal.show();
});

// Evento de submit para enviar moeda
document.getElementById('sendCoinForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const destinationAddress = document.getElementById('destinationAddress');
  const amountToSend = document.getElementById('amountToSend');

  if (destinationAddress.value && amountToSend.value) {

    document.getElementById("closeButtonSendingModal").style.display = "none";;

    try {

      const sendETHModal = bootstrap.Modal.getInstance(document.getElementById('sendETHModal'));
      sendETHModal.hide();
      
      if (!document.querySelector(".spinner-border")) {
        const container = document.querySelector("#sendingModal .modal-body");

        const spinner = document.createElement('div');
        spinner.classList.add('spinner-border', 'text-primary');
        spinner.setAttribute('role', 'status');

        container.appendChild(spinner);
      }

      const sendingModal = new bootstrap.Modal(document.getElementById('sendingModal'),);

      document.getElementById("sendingMessage").innerHTML = `Enviando <span class="moeda-simbolo">${moedaSimbolo}</span>... Aguarde confirmação!`;
      sendingModal.show();

      window.cryptoAPI.sendCoin(destinationAddress.value, amountToSend.value)
        .then((result) => {

          document.getElementById("closeButtonSendingModal").style.display = "block";;

          const spinner = document.querySelector(".spinner-border");
          if (spinner) {
            spinner.remove();
          }

          if(result.success){
            document.getElementById("sendingMessage").innerHTML = `
              <div class="text-success">
                <strong>${moedaSimbolo} enviado com sucesso!</strong><br>
                Transação confirmada com sucesso.
              </div>
            `;
          }
          else{

            document.getElementById("sendingMessage").innerHTML = `
            <div class="text-danger">
              <strong>Erro ao enviar ${moedaSimbolo}!</strong><br>
              Verifique seu saldo ou tente novamente.
            </div>
          `;
          }
        })
        .catch(error => {

          document.getElementById("closeButtonSendingModal").style.display = "block";;

          const spinner = document.querySelector(".spinner-border");
          if (spinner) {
            spinner.remove();
          }

          document.getElementById("sendingMessage").innerHTML = `
          <div class="text-danger">
            <strong>Erro ao enviar ${moedaSimbolo}!</strong><br>
            Verifique seu saldo ou tente novamente.
          </div>
        `;
        }
      );
    } catch (error) {

        document.getElementById("closeButtonSendingModal").style.display = "block";;

        const spinner = document.querySelector(".spinner-border");
        if (spinner) {
          spinner.remove();
        }

        document.getElementById("sendingMessage").innerHTML = `
        <div class="text-danger">
          <strong>Erro ao enviar ${moedaSimbolo}!</strong><br>
          Verifique seu saldo ou tente novamente.
        </div>
      `;
    }
    destinationAddress.value = '';
    amountToSend.value = '';
  } else {
    document.getElementById("sendingMessage").innerHTML = `
    <div class="text-danger">
      Por favor, preencha o endereço e a quantidade.
    </div>
    `;
  }
});

// Função para adicionar token na carteira na rede atual
async function addTokenToWallet(tokenAddress) {
  try {
    window.cryptoAPI.addTokenToWallet(tokenAddress)
      .then((response) => {
        if (response.result && response.result !== false) {
          listaTokens();    
          showMessageModal(`Token ${response.result} adicionado com sucesso!`, 'success')
        } else {
          showMessageModal(`Ocorreu um erro ao adicionar o token! Verifique o contrato ou a rede atual!`, 'danger')
        }
      })
      .catch(error => {
        showMessageModal(`Ocorreu um erro ao adicionar o token! Verifique o contrato ou a rede atual!`, 'danger')
      });
  } catch (error) {
    showMessageModal(`Ocorreu um erro ao adicionar o token! Verifique o contrato ou a rede atual!`, 'danger')
  }
}

// Listener para o modal de importar token
document.getElementById('import-token').addEventListener('click', () => {
  const importTokenModal = new bootstrap.Modal(document.getElementById('importTokenModal'),);
  importTokenModal.show();
});

// Listener para o envio de token
document.getElementById("importTokenForm").addEventListener("submit", async function(event) {
  event.preventDefault();

  const importTokenModal = bootstrap.Modal.getInstance(document.getElementById('importTokenModal'));
  importTokenModal.hide();

  const tokenAddress = document.getElementById("tokenAddress");

  if (tokenAddress.value.trim()) {
    addTokenToWallet(tokenAddress.value.trim());
    tokenAddress.value = '';
  } else {
    showMessageModal(`Por favor, insira um endereço de token válido.`, 'warning');
  }
});

// Função para listar tokens já importados da rede atual
async function listaTokens() {
  try {
    window.cryptoAPI.retornarTokens(this.value)
    .then((tokens) => {
      const tokenListElement = document.getElementById('token-list');
      tokenListElement.innerHTML = '';

      if (tokens.length != 0) {
        document.getElementById('zero-tokens').style.display = 'none';
        
        tokens.forEach(async (token, index) => {
          const listItem = document.createElement('div');
          listItem.className = "token-item";
        
          const tokenText = document.createElement('div');
          tokenText.className = "token-text";
          tokenText.textContent = `Token: ${token.name}, Símbolo: ${token.symbol}, Quantidade: ${token.amount}`;
        
          const buttonContainer = document.createElement('div');
          buttonContainer.className = "token-buttons";
        
          const deleteButton = document.createElement('button');
          deleteButton.className = "btn btn-danger";
          deleteButton.textContent = 'Excluir';
          deleteButton.onclick = async () => {
            window.cryptoAPI.excluirToken(index)
              .then((response) => {
                if (response && response !== false) {
                  showMessageModal(`Token excluído com sucesso!`, 'success')
                } else {
                  showMessageModal(`Ocorreu um erro ao excluir o token!`, 'danger')
                }
              })
              .catch(error => {
                showMessageModal(`Ocorreu um erro ao excluir o token!`, 'danger')
              });
            listaTokens();
          };
        
          const sendButton = document.createElement('button');
          sendButton.className = "btn btn-success";
          sendButton.textContent = 'Enviar Tokens';
          sendButton.onclick = function () {
            openSendModal(token.contract);
          };
        
          buttonContainer.appendChild(deleteButton);
          buttonContainer.appendChild(sendButton);
        
          listItem.appendChild(tokenText);
          listItem.appendChild(buttonContainer);
        
          tokenListElement.appendChild(listItem);
        });        
      }
      else{
        document.getElementById('zero-tokens').style.display = 'block';
      }
    })
    .catch(error => {
      showMessageModal(`Ocorreu um erro ao listar tokens!`, 'danger')
    }
  );
  } catch (error) {
    showMessageModal(`Ocorreu um erro ao listar tokens!`, 'danger')
  }
}

// Evento para deletar a carteira
document.getElementById('delete-wallet').addEventListener('click', () => {
  const modalDelete = new bootstrap.Modal(document.getElementById('deleteWalletModal'),);
  modalDelete.show();
  document.getElementById("confirmDelete").addEventListener("click", function() {
    window.cryptoAPI.deleteWallet()
      .then(() => {
        modalDelete.hide();
        showMessageModal(`Carteira deletada com sucesso!`, 'success')
      })
      .catch(error => {
        modalDelete.hide();
        showMessageModal(`Erro ao deletar a carteira!`, 'danger')
      }
    );
  });
});

// Evento para mostrar tokens
document.getElementById('muda-tokens').addEventListener('click', () => {
  document.getElementById('tokens').style.display = "block";
  document.getElementById('wallet-principal').style.display = "none";
});

// Evento para mostrar moeda principal da carteira
document.getElementById('muda-carteira').addEventListener('click', () => {
  document.getElementById('tokens').style.display = "none";
  document.getElementById('wallet-principal').style.display = "block";
});

// Função para exibir o modal de enviar tokens
function openSendModal(contract) {
  const sendModal = new bootstrap.Modal(document.getElementById('sendModal'));
  sendModal.show();
  document.getElementById('contrato').value = contract;
}

// Função para fechar o modal de enviar tokens
function closeSendModal() {
  const sendModal = bootstrap.Modal.getInstance(document.getElementById('sendModal'));
  sendModal.hide();
}

// Evento para envio de tokens
document.getElementById('sendForm').onsubmit = async function (event) {
  event.preventDefault();

  const contrato = document.getElementById('contrato').value;
  const destino = document.getElementById('destino').value;
  const quantidade = document.getElementById('quantidade').value;

  if (contrato && destino && quantidade) {
    try {
      if (!document.querySelector(".spinner-border")) {

        const container = document.querySelector("#sendingModal .modal-body");

        const spinner = document.createElement('div');
        spinner.classList.add('spinner-border', 'text-primary');
        spinner.setAttribute('role', 'status');

        container.appendChild(spinner);
      }

      const sendingModal = new bootstrap.Modal(document.getElementById('sendingModal'),);

      document.getElementById("closeButtonSendingModal").style.display = "none";;

      document.getElementById("sendingMessage").innerHTML = `Enviando <span class="moeda-simbolo">tokens</span>... Aguarde confirmação!`;
      sendingModal.show();

      window.cryptoAPI.enviarToken(contrato, destino, quantidade)
      .then((response) => {

        document.getElementById("closeButtonSendingModal").style.display = "block";;

        const spinner = document.querySelector(".spinner-border");
        if (spinner) {
          spinner.remove();
        }

        if (response && response !== false) {
          document.getElementById("sendingMessage").innerHTML = `
          <div class="text-success">
            <strong>Tokens enviados com sucesso!</strong><br>
            Transação confirmada com sucesso.
          </div>
        `;
        } else {
          document.getElementById("sendingMessage").innerHTML = `
          <div class="text-danger">
            <strong>Erro ao enviar tokens!</strong><br>
            Verifique seu saldo ou tente novamente.
          </div>
        `;
        }
      })
      .catch(error => {

        document.getElementById("closeButtonSendingModal").style.display = "block";;

        const spinner = document.querySelector(".spinner-border");
        if (spinner) {
          spinner.remove();
        }

        document.getElementById("sendingMessage").innerHTML = `
        <div class="text-danger">
          <strong>Erro ao enviar tokens!</strong><br>
          Verifique seu saldo ou tente novamente.
        </div>
      `;
      });

      listaTokens();
      closeSendModal();
    } catch (error) {

      document.getElementById("sendingMessage").innerHTML = `
      <div class="text-danger">
        <strong>Erro ao enviar tokens!</strong><br>
        Verifique seu saldo ou tente novamente.
      </div>
    `;
    }
    document.getElementById('destino').value = '';
    document.getElementById('quantidade').value = '';
  } else {

    document.getElementById("sendingMessage").innerHTML = `
    <div class="text-danger">
      <strong>Erro ao enviar tokens!</strong><br>
      Por favor, preencha o endereço e a quantidade.
    </div>
  `;
  }

};

// Evento para mostrar modal da chave privada
document.getElementById("show-private-key").addEventListener("click", function () {
  modalInstance = new bootstrap.Modal(document.getElementById("PrivateKeyModal"));
  modalInstance.show();
});

// Função para solicitar chave privada
document.getElementById("PrivateKeyForm").addEventListener("submit", async function(event) {
  event.preventDefault();
  const passwordWallet = document.getElementById("passwordWallet").value.trim();
  document.getElementById("passwordWallet").value = "";

  let modalInstance = bootstrap.Modal.getInstance(document.getElementById("PrivateKeyModal"));
  modalInstance.hide();

  if (passwordWallet) {
    try {
      window.cryptoAPI.showPrivateKey(passwordWallet)
      .then((response) => {
        if (response && response !== false) {
          showPrivateKeyModal(response);
        } else {
          showMessageModal(`Erro ao visualizar a carteira. Verifique a senha!`, 'danger')
        }
      })
      .catch(error => {
        showMessageModal(`Erro ao visualizar a carteira. Verifique a senha!`, 'danger')
      });
      
    } catch (error) {
      showMessageModal(`Erro ao visualizar a carteira. Verifique a senha!`, 'danger')
    }
  } else {
    showMessageModal(`Por favor, insira uma senha!`, 'warning')
  }
});

// Função para mostrar a chave privada
function showPrivateKeyModal(privateKey) {
  const privateKeyShowModal = new bootstrap.Modal(document.getElementById('privateKeyShowModal'));
  
  const privateKeyText = document.getElementById('privateKeyText');
  privateKeyText.value = privateKey;

  privateKeyShowModal.show();

  document.getElementById('copyPrivateKey').addEventListener('click', () => {
    navigator.clipboard.writeText(privateKey).then(() => {
      const modalBody = document.querySelector('#privateKeyShowModal .modal-body');

      const existingMessage = document.getElementById('successMessage');
      if (existingMessage) {
        existingMessage.remove();
      }

      const successMessage = document.createElement('div');
      successMessage.id = 'successMessage';
      successMessage.className = 'alert alert-success mt-3 text-center';
      successMessage.textContent = 'A chave privada foi copiada com sucesso!';

      modalBody.appendChild(successMessage);

      setTimeout(() => {
        if (successMessage) {
          successMessage.remove();
        }
      }, 5000);
    });
  });
}

// Função para mostrar modal de mensagem
function showMessageModal(message, type) {
  const modalMessage = new bootstrap.Modal(document.getElementById('messageModal'), {
    backdrop: 'static',
    keyboard: false
  });

  const messageContent = document.getElementById("messageContent");

  messageContent.classList.remove('alert', 'alert-success', 'alert-danger', 'alert-warning');

  if (type === 'success') {
    messageContent.classList.add('alert', 'alert-success');
  } else if (type === 'danger') {
    messageContent.classList.add('alert', 'alert-danger');
  } else if (type === 'warning') {
    messageContent.classList.add('alert', 'alert-warning');
  }

  messageContent.innerHTML = message;

  modalMessage.show();

  setTimeout(() => modalMessage.hide(), 2000);
}