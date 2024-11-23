window.cryptoAPI.verificaCarteira()
.catch(error => {
   showMessageModal('Ocorreu um erro ao verificar a carteira!', 'danger')
});

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

// Evento para confirmar a senha
document.getElementById("login").addEventListener("click", () => {
  const password = document.getElementById("password-login").value;

  if (!password) {
    showMessageModal('A senha é obrigatória!', 'warning');
    return;
  }

  // Envia a senha para o back-end para autenticação via API
  window.cryptoAPI.authenticateWallet(password)
  .then((result) => {
    if (result && 'success' in result && result.success) {
      showMessageModal('Logado com sucesso!', 'success')
    }
    else{
      showMessageModal('Erro ao autenticar a carteira! Verifique a senha!', 'danger')
    }
  }).catch(error => {
      showMessageModal('Erro ao autenticar a carteira! Verifique a senha!', 'danger')
  });
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