window.cryptoAPI.verificaCarteira()
.catch(error => {
   showMessageModal('Ocorreu um erro ao verificar a carteira!', 'danger')
});

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

// Evento para confirmar a senha
document.getElementById("login").addEventListener("click", () => {
  const password = document.getElementById("password-login").value;

  if (!password) {
    showMessageModal('A senha é obrigatória!', 'warning');
    return;
  }

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