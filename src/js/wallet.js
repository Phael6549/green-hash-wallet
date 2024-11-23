var redeAPI = 'mainnet'; // Valor padrão da variável
var moeda = 'Ethereum'; // Valor padrão da variável
var moedaSimbolo = 'ETH'; // Valor padrão da variável


const networkSwitcher = document.getElementById('networkSwitcher');

loadWallet();
setInterval(loadWallet, 10000); // Executa a função a cada 10000 ms (10 segundos)

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

if (networkSwitcher) {
  networkSwitcher.addEventListener('change', function() {

    window.cryptoAPI.mudaRede(this.value)
      .then(() => {
        showMessageModal('Rede alterada com sucesso!', 'success')

        moeda = this.options[this.selectedIndex].text;
        moedaSimbolo = this.options[this.selectedIndex].getAttribute('simbolo');
  
        // Alterar todos os elementos com a classe 'simbolo'
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

// Listener para o botão de abrir o modal
document.getElementById('enviar-eth').addEventListener('click', () => {
  const sendETHModal = new bootstrap.Modal(document.getElementById('sendETHModal'),);
  sendETHModal.show();
});

// Evento de submit para enviar ETH
document.getElementById('sendCoinForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const destinationAddress = document.getElementById('destinationAddress');
  const amountToSend = document.getElementById('amountToSend');

  if (destinationAddress.value && amountToSend.value) {

    document.getElementById("closeButtonSendingModal").style.display = "none";;

    try {

      const sendETHModal = bootstrap.Modal.getInstance(document.getElementById('sendETHModal'));
      sendETHModal.hide();
      
      // Verifica se o spinner já existe
      if (!document.querySelector(".spinner-border")) {
        // Seleciona o corpo do modal onde o spinner será adicionado
        const container = document.querySelector("#sendingModal .modal-body");

        // Cria o spinner
        const spinner = document.createElement('div');
        spinner.classList.add('spinner-border', 'text-primary');
        spinner.setAttribute('role', 'status');  // Atributo de acessibilidade

        // Adiciona o spinner ao corpo do modal
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

// Listener para o botão de abrir o modal
document.getElementById('import-token').addEventListener('click', () => {
  const importTokenModal = new bootstrap.Modal(document.getElementById('importTokenModal'),);
  importTokenModal.show();
});

// Adiciona o listener de submissão apenas uma vez
document.getElementById("importTokenForm").addEventListener("submit", async function(event) {
  event.preventDefault(); // Evita o envio padrão do formulário

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

async function listaTokens() {
  try {
    window.cryptoAPI.retornarTokens(this.value)
    .then((tokens) => {
      const tokenListElement = document.getElementById('token-list');
      tokenListElement.innerHTML = '';

      if (tokens.length != 0) {
        document.getElementById('zero-tokens').style.display = 'none';
        
        tokens.forEach(async (token, index) => {
          // Criar o container do item
          const listItem = document.createElement('div');
          listItem.className = "token-item";
        
          // Criar o texto do token
          const tokenText = document.createElement('div');
          tokenText.className = "token-text";
          tokenText.textContent = `Token: ${token.name}, Símbolo: ${token.symbol}, Quantidade: ${token.amount}`;
        
          // Criar container para os botões
          const buttonContainer = document.createElement('div');
          buttonContainer.className = "token-buttons";
        
          // Criar botão de exclusão
          const deleteButton = document.createElement('button');
          deleteButton.className = "btn btn-danger";
          deleteButton.textContent = 'Excluir';
          deleteButton.onclick = async () => {
            // Excluir o token da lista
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
        
          // Criar botão de envio
          const sendButton = document.createElement('button');
          sendButton.className = "btn btn-success";
          sendButton.textContent = 'Enviar Tokens';
          sendButton.onclick = function () {
            // Exibir o modal de envio
            openSendModal(token.contract);
          };
        
          // Adicionar botões ao container de botões
          buttonContainer.appendChild(deleteButton);
          buttonContainer.appendChild(sendButton);
        
          // Adicionar texto e botões ao item da lista
          listItem.appendChild(tokenText);
          listItem.appendChild(buttonContainer);
        
          // Adicionar o item ao elemento da lista
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
    // Chama a função do backend via API ou comunicação IPC (no caso de Electron, por exemplo)
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

// Evento para deletar a carteira
document.getElementById('muda-tokens').addEventListener('click', () => {
  document.getElementById('tokens').style.display = "block";
  document.getElementById('wallet-principal').style.display = "none";
});

// Evento para deletar a carteira
document.getElementById('muda-carteira').addEventListener('click', () => {
  document.getElementById('tokens').style.display = "none";
  document.getElementById('wallet-principal').style.display = "block";
});

// Função para exibir o modal
function openSendModal(contract) {
  // Inicializar e abrir o modal
  const sendModal = new bootstrap.Modal(document.getElementById('sendModal'));
  sendModal.show();
  document.getElementById('contrato').value = contract;
}

// Função para fechar o modal
function closeSendModal() {
  const sendModal = bootstrap.Modal.getInstance(document.getElementById('sendModal'));
  sendModal.hide();
}

// Evento de envio do formulário
document.getElementById('sendForm').onsubmit = async function (event) {
  event.preventDefault();

  const contrato = document.getElementById('contrato').value;
  const destino = document.getElementById('destino').value;
  const quantidade = document.getElementById('quantidade').value;

  if (contrato && destino && quantidade) {
    try {
      // Verifica se o spinner já existe
      if (!document.querySelector(".spinner-border")) {

        // Seleciona o corpo do modal onde o spinner será adicionado
        const container = document.querySelector("#sendingModal .modal-body");

        // Cria o spinner
        const spinner = document.createElement('div');
        spinner.classList.add('spinner-border', 'text-primary');
        spinner.setAttribute('role', 'status');  // Atributo de acessibilidade

        // Adiciona o spinner ao corpo do modal
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
      closeSendModal();  // Fechar o modal após o envio
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

document.getElementById("show-private-key").addEventListener("click", function () {
  modalInstance = new bootstrap.Modal(document.getElementById("PrivateKeyModal"));
  modalInstance.show();
});

// Função para visualizar chave privada
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

function showPrivateKeyModal(privateKey) {
  const privateKeyShowModal = new bootstrap.Modal(document.getElementById('privateKeyShowModal'));
  
  // Inserir a chave privada no textarea
  const privateKeyText = document.getElementById('privateKeyText');
  privateKeyText.value = privateKey;

  // Mostrar o modal
  privateKeyShowModal.show();

  // Configurar botão de copiar
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

function showMessageModal(message, type) {
  const modalMessage = new bootstrap.Modal(document.getElementById('messageModal'), {
    backdrop: 'static',  // Não permite fechar clicando fora do modal
    keyboard: false      // Não fecha com a tecla ESC
  });

  const messageContent = document.getElementById("messageContent");

  // Limpa qualquer classe anterior de mensagem
  messageContent.classList.remove('alert', 'alert-success', 'alert-danger', 'alert-warning');

  // Define a classe do tipo de mensagem
  if (type === 'success') {
    messageContent.classList.add('alert', 'alert-success');
  } else if (type === 'danger') {
    messageContent.classList.add('alert', 'alert-danger');
  } else if (type === 'warning') {
    messageContent.classList.add('alert', 'alert-warning');
  }

  // Insere a mensagem no modal
  messageContent.innerHTML = message;

  // Exibe o modal
  modalMessage.show();

  // Fecha automaticamente após 2 segundos
  setTimeout(() => modalMessage.hide(), 2000);
}