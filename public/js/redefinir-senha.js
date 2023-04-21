// Obtenha a referência do botão de envio do formulário HTML
const resetPasswordBtn = document.getElementById("reset-password-btn");

// Adicione um listener de eventos de clique ao botão de envio
resetPasswordBtn.addEventListener("click", (event) => {
  // Impedir que o formulário seja enviado
  event.preventDefault();

  // Obtenha o valor do campo de entrada de e-mail
  const email = document.getElementById("email").value;

  // Use o método sendPasswordResetEmail() para enviar um e-mail de redefinição de senha para o usuário
  auth
    .sendPasswordResetEmail(email)
    .then(() => {
      // O e-mail de redefinição de senha foi enviado com sucesso
      console.log(
        "Um e-mail de redefinição de senha foi enviado para " + email
      );
      alert("Um e-mail de redefinição de senha foi enviado para " + email);
    })
    .catch((error) => {
      // Ocorreu um erro ao enviar o e-mail de redefinição de senha
      console.error("Erro ao enviar e-mail de redefinição de senha:", error);
    });
});
