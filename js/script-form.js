document.querySelector("form").addEventListener("submit", function (e) {
  e.preventDefault(); // Impede que o formulário seja enviado

  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  if (username === "MGdespesas" && password === "Controle2023") {
    // Se o nome de usuário e a senha estiverem corretos, redirecionar para a página de escolha de controle
    window.location.href = "/pages/escolha-controle.html";
    alert("Bem vindo!");
  } else {
    // Se o nome de usuário e a senha estiverem incorretos, mostrar uma mensagem de erro
    alert("Nome de usuário ou senha incorretos. Tente novamente.");
  }
});
