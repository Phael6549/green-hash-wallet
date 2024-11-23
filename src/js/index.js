var method = "create";

// Evento para mostrar a seção de criar uma nova carteira
document.getElementById("create-wallet").addEventListener("click", () => {
  method = "create";
  document.getElementById("passwordInput").value = "";
  // Ocultar a seção de importação, se visível
  document.getElementById("import-section").style.display = "none";
  // Exibe o campo de senha para o usuário
  document.getElementById("password-encrypt").style.display = "block";
});

// Evento para mostrar a seção de importação
document.getElementById("import-wallet").addEventListener("click", () => {
  document.getElementById("privateKeyInput").value = "";
  document.getElementById("passwordInput").value = "";
  // Ocultar a seção de criação de carteira, se visível
  document.getElementById("password-encrypt").style.display = "none";
  document.getElementById("import-section").style.display = "block";
});

// Evento para importar uma carteira existente com base na chave privada fornecida
document.getElementById("confirm-import").addEventListener("click", () => {
  const privateKey = document.getElementById("privateKeyInput").value;

  if (!privateKey) {
    showMessageModal('Por favor, insira uma chave privada!', 'warning')
    return;
  }

  // Oculta o campo de chave privada
  document.getElementById("import-section").style.display = "none";
  // Exibe o campo de senha para criptografia
  document.getElementById("password-encrypt").style.display = "block";

  method = "import";
});

// Evento para confirmar a senha
document.getElementById("confirm-password").addEventListener("click", () => {
  const password = document.getElementById("passwordInput").value;
  
  if (!password) {
    showMessageModal('A senha é obrigatória!', 'warning')
    return;
  }
  if(method==="create"){
    window.cryptoAPI.createWallet(password)
    .then((result) => {
      if (result && 'success' in result && result.success) {
        showMessageModal('Carteira criada com sucesso!', 'success')
      }
      else{
        showMessageModal('Ocorreu um erro ao criar a carteira!', 'danger')
      }
    }).catch(error => {
      showMessageModal('Ocorreu um erro ao criar a carteira!', 'danger')
    });
  }

  if(method==="import"){
    window.cryptoAPI.importWallet(document.getElementById("privateKeyInput").value, password)
    .then((result) => {
      if (result && 'success' in result && result.success) {
        showMessageModal('Carteira importada com sucesso!', 'success')
      }
      else{
        showMessageModal('Verifique a chave privada informada!', 'danger')
      }
    }).catch(error => {
      showMessageModal('Verifique a chave privada informada!', 'danger')
    });

    document.getElementById("privateKeyInput").value = "";
    document.getElementById("passwordInput").value = "";

    document.getElementById("import-section").style.display = "block";
    document.getElementById("password-encrypt").style.display = "none";
  }
});

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