document.querySelector(".btn-login").addEventListener("click", function () {
  var username = document.querySelector('input[name="usuario"]').value;
  var password = document.querySelector('input[name="senha"]').value;

  if (username === "MGdespesas" && password === "Controle2023") {
    // Se o nome de usuário e a senha estiverem corretos, redirecionar para a página de escolha de controle
    window.location.href = "/public/pages/escolha-controle.html";
    alert("Bem vindo!");
  } else {
    // Se o nome de usuário e a senha estiverem incorretos, mostrar uma mensagem de erro
    alert("Nome de usuário ou senha incorretos. Tente novamente.");
  }
});
