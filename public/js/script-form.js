document.querySelector(".btn-login").addEventListener("click", function () {
  var email = document.querySelector('input[name="email"]').value;
  var password = document.querySelector('input[name="password"]').value;

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Se as credenciais estiverem corretas, redirecionar para a página de escolha de controle
      window.location.href = "./pages/escolha-controle.html";
      alert("Bem vindo!");
    })
    .catch((error) => {
      // Se as credenciais estiverem incorretas, mostrar uma mensagem de erro
      var errorMessage = error.message;
      alert(errorMessage);
    });
});

function registrar() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  auth
    .createUserWithEmailAndPassword(email, password)
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

  auth
    .signInWithEmailAndPassword(email, password)
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
