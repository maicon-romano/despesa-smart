const pageName = window.location.pathname.split("/").pop().replace(".html", "");

const transactionsUl = document.querySelector("#transactions");
const incomeDisplay = document.querySelector("#money-plus");
const expenseDisplay = document.querySelector("#money-minus");
const balanceDisplay = document.querySelector("#balance");
const form = document.querySelector("#form");
const inputTransactionName = document.querySelector("#text");
const inputTransactionAmount = document.querySelector("#amount");

const getStoredTransactions = () => {
  const localStorageTransactions = localStorage.getItem(
    `${pageName}-transactions`
  );
  return localStorageTransactions ? JSON.parse(localStorageTransactions) : [];
};

let transactions = getStoredTransactions();

const removeTransaction = (ID) => {
  transactions = transactions.filter((transaction) => transaction.id !== ID);
  updateLocalStorage();
  init();
};

const addTransactionIntoDOM = ({ amount, name, id }) => {
  const operator = amount < 0 ? "-" : "+";
  const CSSClass = amount < 0 ? "minus" : "plus";
  const amountWithoutOperator = Math.abs(amount).toFixed(2);
  const li = document.createElement("li");

  li.classList.add(CSSClass);
  li.innerHTML = `
    ${name}
    <span>${operator} R$ ${amountWithoutOperator}</span>
    <button class="delete-btn" onClick="removeTransaction(${id})">x</button>
  `;
  transactionsUl.append(li);
};

const getExpenses = (transactionsAmounts) =>
  Math.abs(
    transactionsAmounts
      .filter((value) => value < 0)
      .reduce((accumulator, value) => accumulator + value, 0)
  ).toFixed(2);

const getIncome = (transactionsAmounts) =>
  transactionsAmounts
    .filter((value) => value > 0)
    .reduce((accumulator, value) => accumulator + value, 0)
    .toFixed(2);

const getTotal = (transactionsAmounts) =>
  transactionsAmounts
    .reduce((accumulator, transaction) => accumulator + transaction, 0)
    .toFixed(2);

const updateBalanceValues = () => {
  const transactionsAmounts = transactions.map(({ amount }) => amount);
  balanceDisplay.textContent = `R$ ${getTotal(transactionsAmounts)}`;
  incomeDisplay.textContent = `R$ ${getIncome(transactionsAmounts)}`;
  expenseDisplay.textContent = `R$ ${getExpenses(transactionsAmounts)}`;
};

const init = () => {
  transactionsUl.innerHTML = "";
  transactions.forEach(addTransactionIntoDOM);
  updateBalanceValues();
};

init();

const updateLocalStorage = () => {
  localStorage.setItem(
    `${pageName}-transactions`,
    JSON.stringify(transactions)
  );
};

const generateID = () => Math.round(Math.random() * 1000);

const addToTransactionsArray = (transactionName, transactionAmount) => {
  transactions.push({
    id: generateID(),
    name: transactionName,
    amount: parseFloat(transactionAmount),
  });
};

const cleanInputs = () => {
  inputTransactionName.value = "";
  inputTransactionAmount.value = "";
};

const isValidInput = (transactionName, transactionAmount) => {
  if (transactionName === "" || transactionAmount === "") {
    alert("Por favor, preencha tanto o nome quanto o valor da transação");
    return false;
  }

  if (
    isNaN(parseFloat(transactionAmount.replace(",", "."))) ||
    parseFloat(transactionAmount.replace(",", ".")) === 0
  ) {
    alert("Por favor, digite um valor válido para a transação");
    return false;
  }

  return true;
};

const handleFormSubmit = (event) => {
  event.preventDefault();

  const transactionName = inputTransactionName.value.trim();
  const transactionAmount = inputTransactionAmount.value
    .trim()
    .replace(",", ".");

  if (!isValidInput(transactionName, transactionAmount)) {
    return;
  }

  addToTransactionsArray(transactionName, transactionAmount);
  init();
  updateLocalStorage();
  cleanInputs();
};

form.addEventListener("submit", handleFormSubmit);

window.onload = function () {
  // Configuração do Firebase Authentication
  const auth = firebase.auth();

  // Obtém uma referência para a coleção de transações
  const transactionsCollectionRef = firebase
    .firestore()
    .collection("transactions");

  // Adiciona uma nova transação ao banco de dados do Firebase
  function addTransaction(description, value) {
    // Obtém o usuário autenticado
    const user = firebase.auth().currentUser;

    if (user) {
      // Cria um novo documento de transação com o UID do usuário como ID
      transactionsCollectionRef
        .doc(user.uid)
        .collection("userTransactions")
        .add({
          description: description,
          value: value,
        })
        .then(() => {
          console.log("Transação adicionada com sucesso!");
        })
        .catch((error) => {
          console.error("Erro ao adicionar transação:", error);
        });
    } else {
      console.error("Usuário não autenticado");
    }
  }

  // Recupera as transações do usuário autenticado
  function getUserTransactions() {
    // Obtém o usuário autenticado
    const user = firebase.auth().currentUser;

    if (user) {
      // Faz uma consulta no banco de dados para obter as transações do usuário
      transactionsCollectionRef
        .doc(user.uid)
        .collection("userTransactions")
        .get()
        .then((querySnapshot) => {
          // Remove todos os elementos da lista (UL)
          const transactionsList = document.getElementById("transactions");
          transactionsList.innerHTML = "";

          querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());

            // Cria um novo elemento de lista (LI) com as informações da transação
            const transactionElement = document.createElement("li");
            transactionElement.textContent = `${doc.data().description} - R$ ${
              doc.data().value
            }`;

            // Adiciona o novo elemento de lista à lista (UL)
            transactionsList.appendChild(transactionElement);
          });
        })
        .catch((error) => {
          console.error("Erro ao recuperar transações do usuário:", error);
        });
    } else {
      console.error("Usuário não autenticado");
    }
  }

  // Cria um observador para verificar se o usuário está autenticado ou não
  auth.onAuthStateChanged((user) => {
    if (user) {
      // O usuário está autenticado
      console.log("Usuário autenticado:", user.uid);

      // Aqui você pode criar o código para exibir as informações do usuário ou carregar as transações do banco de dados
    } else {
      // O usuário não está autenticado
      console.log("Usuário não autenticado");

      // Aqui você pode criar o código para exibir um formulário de login ou redirecionar o usuário para a página de login
    }
  });

  // Adiciona uma transação quando o formulário for enviado
  const form = document.getElementById("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault(); // Impede que a página seja recarregada ao enviar o formulário

    // Obtém os valores dos campos de entrada
    const description = document.getElementById("text").value;
    const value = parseFloat(document.getElementById("amount").value);

    // Verifica se os campos de entrada estão preenchidos
    if (!description || isNaN(value)) {
      console.error(
        "Os campos de entrada devem ser preenchidos e o valor deve ser um número válido"
      );
      return;
    }

    // Adiciona a transação ao banco de dados do Firebase
    addTransaction(description, value);

    // Cria um novo elemento de lista (LI) com os valores dos campos de entrada
    const transactionElement = document.createElement("li");
    transactionElement.textContent = `${description} - R$ ${value}`;

    // Adiciona o novo elemento de lista à lista (UL)
    const transactionsList = document.getElementById("transactions");
    transactionsList.appendChild(transactionElement);

    // Limpa os valores dos campos de entrada
    document.getElementById("text").value = "";
    document.getElementById("amount").value = "";

    // Exibe uma mensagem de sucesso
    const successMessage = document.getElementById("success-message");
    successMessage.style.display = "block";
    setTimeout(() => {
      successMessage.style.display = "none";
    }, 3000);

    // Atualiza a lista de transações
    getUserTransactions();
  });

  // Exemplo de como recuperar as transações do usuário
  getUserTransactions();

  // Adiciona um ouvinte para o botão de logout
  const logoutButton = document.getElementById("logout-button");
  logoutButton.addEventListener("click", () => {
    firebase
      .auth()
      .signOut()
      .then(() => {
        console.log("Usuário desconectado");
      })
      .catch((error) => {
        console.error("Erro ao desconectar usuário:", error);
      });
  });

  // Adiciona um ouvinte para o botão de login
  const loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        console.log("Usuário autenticado com sucesso:", result.user.uid);
      })
      .catch((error) => {
        console.error("Erro ao autenticar usuário:", error);
      });
  });
};
