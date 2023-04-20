document.querySelector(".btn-login").addEventListener("click", function () {
  var username = document.querySelector('input[name="usuario"]').value;
  var password = document.querySelector('input[name="senha"]').value;

  if (username === "MGdespesas" && password === "Controle2023") {
    // Se o nome de usuário e a senha estiverem corretos, redirecionar para a página de escolha de controle
    window.location.href = "./pages/escolha-controle.html";
    alert("Bem vindo!");
  } else {
    // Se o nome de usuário e a senha estiverem incorretos, mostrar uma mensagem de erro
    alert("Nome de usuário ou senha incorretos. Tente novamente.");
  }
});

function registrar() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // User registered successfully
    var user = userCredential.user;
    console.log(user);
  })
  .catch((error) => {
    // Registration failed
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorMessage);
  });
}

function entrar() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // User logged in successfully
    var user = userCredential.user;
    console.log(user);
  })
  .catch((error) => {
    // Login failed
    var errorCode = error.code;
    var errorMessage = error.message;
    console.log(errorMessage);
  });
}
