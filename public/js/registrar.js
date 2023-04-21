function registrar() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  auth
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // User registered successfully
      var user = userCredential.user;
      console.log(user);
      alert("Agora você está cadastrado, volte e realize seu login!");
    })
    .catch((error) => {
      // Registration failed
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorMessage);

      if (errorCode === "auth/invalid-email") {
        alert(
          "O endereço de e-mail digitado é inválido. Por favor, verifique e tente novamente."
        );
      } else if (errorCode === "auth/email-already-in-use") {
        alert(
          "O endereço de e-mail digitado já está sendo usado por outra conta. Por favor, tente com um endereço de e-mail diferente."
        );
      } else {
        alert(
          "Ocorreu um erro ao registrar. Por favor, tente novamente mais tarde."
        );
      }
    });
}
