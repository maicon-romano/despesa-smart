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
  const auth = firebase.auth();
  const transactionsCollectionRef = firebase
    .firestore()
    .collection("transactions");

  function addTransaction(description, value) {
    const user = firebase.auth().currentUser;

    if (user) {
      transactionsCollectionRef
        .doc(user.uid)
        .collection("userTransactions")
        .add({
          description: description,
          value: value,
        })
        .then(() => {
          console.log("Transação adicionada com sucesso!");
          getUserTransactions();
        })
        .catch((error) => {
          console.error("Erro ao adicionar transação:", error);
        });
    } else {
      console.error("Usuário não autenticado");
    }
  }

  function removeTransaction(transactionId) {
    const user = firebase.auth().currentUser;

    if (user) {
      transactionsCollectionRef
        .doc(user.uid)
        .collection("userTransactions")
        .doc(transactionId)
        .delete()
        .then(() => {
          console.log("Transação removida com sucesso!");
          getUserTransactions();
        })
        .catch((error) => {
          console.error("Erro ao remover transação:", error);
        });
    } else {
      console.error("Usuário não autenticado");
    }
  }

  function getUserTransactions() {
    const user = firebase.auth().currentUser;

    if (user) {
      transactionsCollectionRef
        .doc(user.uid)
        .collection("userTransactions")
        .get()
        .then((querySnapshot) => {
          const transactionsList = document.getElementById("transactions");
          transactionsList.innerHTML = "";

          querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());

            const transactionElement = document.createElement("li");
            transactionElement.textContent = `${doc.data().description} - R$ ${
              doc.data().value
            }`;

            const removeButton = document.createElement("button");
            removeButton.textContent = "X";
            removeButton.onclick = () => {
              removeTransaction(doc.id);
            };
            transactionElement.appendChild(removeButton);

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

  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log("Usuário autenticado:", user.uid);
      getUserTransactions();
    } else {
      console.log("Usuário não autenticado");
      const transactionsList = document.getElementById("transactions");
      transactionsList.innerHTML = "";
    }
  });

  const form = document.getElementById("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const description = document.getElementById("text").value;
    const value = parseFloat(document.getElementById("amount").value);

    if (!description || isNaN(value)) {
      console.error(
        "Os campos de entrada devem ser preenchidos e o valor deve ser um número válido"
      );
      return;
    }

    addTransaction(description, value);

    document.getElementById("text").value = "";
    document.getElementById("amount").value = "";
  });

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

  const loginButton = document.getElementById("login-button");
  loginButton.addEventListener("click", () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        console.log("Usuário autenticado com sucesso:", result.user.uid);
        getUserTransactions();
      })
      .catch((error) => {
        console.error("Erro ao autenticar usuário:", error);
      });
  });
};
