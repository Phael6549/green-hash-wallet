var method = "create";

// Evento para mostrar a seção de criar uma nova carteira
document.getElementById("create-wallet").addEventListener("click", () => {
  method = "create";
  document.getElementById("passwordInput").value = "";
  document.getElementById("import-section").style.display = "none";
  document.getElementById("password-encrypt").style.display = "block";
});

// Evento para mostrar a seção de importação
document.getElementById("import-wallet").addEventListener("click", () => {
  document.getElementById("privateKeyInput").value = "";
  document.getElementById("passwordInput").value = "";
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

  document.getElementById("import-section").style.display = "none";
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

// Função para mostrar uma mensagem no modal
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