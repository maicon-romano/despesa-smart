var firebaseConfig = {
  apiKey: "AIzaSyDrquZN4aqqAAZr2g60mFuUSkTHyOI84Eg",
  authDomain: "despesasmart.firebaseapp.com",
  projectId: "despesasmart",
  storageBucket: "despesasmart.appspot.com",
  messagingSenderId: "348685765695",
  appId: "1:348685765695:web:4913207469c96328a13c8a",
  measurementId: "G-CB8JDXKMDX",
};
window.firebase.initializeApp(firebaseConfig);

const auth = window.firebase.auth();
const db = window.firebase.firestore();
let currentUser;
let transactions = [];

const transactionsUl = document.getElementById("transactions");
const incomeDisplay = document.getElementById("money-plus");
const expenseDisplay = document.getElementById("money-minus");
const balanceDisplay = document.getElementById("balance");
const form = document.getElementById("form");
const inputTransactionName = document.getElementById("text");
const inputTransactionAmount = document.getElementById("amount");

const getTransactionsFromDB = async () => {
  transactions = []; // Limpa o array de transações antes de buscar no banco de dados

  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions");

  try {
    const querySnapshot = await userTransactionsRef.get();
    querySnapshot.forEach((doc) => {
      const transaction = {
        id: doc.id,
        description: doc.data().description,
        value: doc.data().value,
      };
      transactions.push(transaction);
    });

    // Adicionar transações pendentes
    const pendingTransactions = transactions.filter((t) => !t.id);
    for (const pendingTransaction of pendingTransactions) {
      const docRef = await userTransactionsRef.add({
        description: pendingTransaction.description,
        value: pendingTransaction.value,
      });
      pendingTransaction.id = docRef.id;
    }

    init();
  } catch (error) {
    console.error("Erro ao recuperar transações do usuário:", error);
  }
};

const addTransactionToDB = async (transaction) => {
  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions");

  try {
    const docRef = await userTransactionsRef.add({
      description: transaction.description,
      value: transaction.value.toString().replace(",", "."), // conversão para string e substituição da vírgula pelo ponto
    });
    console.log("Transação adicionada ao banco de dados");
    transaction.id = docRef.id;
    init();
  } catch (error) {
    console.error("Erro ao adicionar transação ao banco de dados:", error);
  }
};

const removeTransactionFromDB = (transactionId) => {
  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions")
    .doc(transactionId);

  userTransactionsRef
    .delete()
    .then(() => {
      console.log("Transação removida do banco de dados");
    })
    .catch((error) => {
      console.error("Erro ao remover transação do banco de dados:", error);
    });
};

const removeTransaction = (transactionId) => {
  transactions = transactions.filter(
    (transaction) => transaction.id !== transactionId
  );
  removeTransactionFromDB(transactionId);
  init();
};

const addTransactionIntoDOM = ({ id, description, value }) => {
  const operator = value < 0 ? "-" : "+";
  const CSSClass = value < 0 ? "minus" : "plus";
  const valueWithoutOperator = Math.abs(value).toFixed(2);
  const li = document.createElement("li");

  li.classList.add(CSSClass);
  li.setAttribute("data-id", id);
  li.innerHTML = `${description} <span>${operator} R$ ${valueWithoutOperator}</span> <button class="delete-btn">x</button> `;
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
  const transactionsAmounts = transactions.map(({ value }) => value);
  balanceDisplay.textContent = `R$ ${getTotal(transactionsAmounts)}`;
  incomeDisplay.textContent = `R$ ${getIncome(transactionsAmounts)}`;
  expenseDisplay.textContent = `R$ ${getExpenses(transactionsAmounts)}`;
};

const init = () => {
  transactionsUl.innerHTML = "";
  transactions.forEach(addTransactionIntoDOM);
  updateBalanceValues();
};

const updateTransactionsInDB = () => {
  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions");

  userTransactionsRef
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const transaction = transactions.find((t) => t.id === doc.id);
        if (!transaction) {
          userTransactionsRef
            .doc(doc.id)
            .delete()
            .then(() => {
              console.log("Transação removida do banco de dados");
            })
            .catch((error) => {
              console.error(
                "Erro ao remover transação do banco de dados:",
                error
              );
            });
        }
      });
      transactions.forEach((transaction) => {
        if (!transaction.id) {
          userTransactionsRef
            .add({
              description: transaction.description,
              value: transaction.value,
            })
            .then(() => {
              console.log("Transação adicionada ao banco de dados");
            })
            .catch((error) => {
              console.error(
                "Erro ao adicionar transação ao banco de dados:",
                error
              );
            });
        } else {
          userTransactionsRef
            .doc(transaction.id)
            .update({
              description: transaction.description,
              value: transaction.value,
            })
            .then(() => {
              console.log("Transação atualizada no banco de dados");
            })
            .catch((error) => {
              console.error(
                "Erro ao atualizar transação no banco de dados:",
                error
              );
            });
        }
      });
    })
    .catch((error) => {
      console.error("Erro ao recuperar transações do usuário:", error);
    });
};

auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log("Usuário autenticado:", user.uid);
    getTransactionsFromDB();
  } else {
    console.log("Usuário não autenticado");
    transactionsUl.innerHTML = "";
  }
});

const selecaoTransacao = document.getElementById("selecao-transacao");

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const description = inputTransactionName.value.trim();
  const value = parseFloat(inputTransactionAmount.value.replace(",", "."));
  const type = selecaoTransacao.value;

  if (!description || isNaN(value) || !type) {
    console.error(
      "Os campos de entrada devem ser preenchidos e o valor deve ser um número válido"
    );
    return;
  }

  const transaction = {
    id: "",
    description: description,
    value: type === "despesa" ? -value : value, // ajuste para definir se é despesa ou receita
  };
  transactions.push(transaction);
  addTransactionToDB(transaction);
  addTransactionIntoDOM(transaction);
  updateBalanceValues();
  inputTransactionName.value = "";
  inputTransactionAmount.value = "";
  selecaoTransacao.value = ""; // limpa a seleção do usuário após a transação ser adicionada
});

transactionsUl.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete-btn")) {
    const li = event.target.closest("li");
    const transactionId = li.getAttribute("data-id");
    removeTransaction(transactionId);
  }
});

const logoutButton = document.getElementById("logout-button");
logoutButton.addEventListener("click", () => {
  auth
    .signOut()
    .then(() => {
      console.log("Usuário desconectado");
      currentUser = null;
      transactions = [];
      transactionsUl.innerHTML = "";
      balanceDisplay.textContent = "R$ 0.00";
      incomeDisplay.textContent = "R$ 0.00";
      expenseDisplay.textContent = "R$ 0.00";
    })
    .catch((error) => {
      console.error("Erro ao desconectar usuário:", error);
    });
});

const todosButton = document.getElementById("filtrar-todos");
const receitasButton = document.getElementById("filtrar-receitas");
const despesasButton = document.getElementById("filtrar-despesas");

// Função para filtrar as transações
const filtrarTransacoes = (tipo, botao) => {
  const transacoesFiltradas = transactions.filter((t) => {
    if (tipo === "receitas") {
      return t.value > 0;
    } else if (tipo === "despesas") {
      return t.value < 0;
    } else {
      return true;
    }
  });

  // Limpar a lista de transações e adicioná-las novamente filtradas
  transactionsUl.innerHTML = "";
  transacoesFiltradas.forEach(addTransactionIntoDOM);
  updateBalanceValues();

  // Remover o ícone de filtro de todos os botões de filtro
  const filterButtons = document.querySelectorAll(".botao-filtro");
  filterButtons.forEach((button) => {
    button.innerHTML = button.textContent;
  });

  // Adicionar o ícone de filtro ao botão correspondente
  botao.innerHTML = '<i class="fa-solid fa-filter"></i>' + botao.textContent;
};

// Adicionar um listener de clique para cada botão de filtro
todosButton.addEventListener("click", () => {
  filtrarTransacoes("todos", todosButton);
});

receitasButton.addEventListener("click", () => {
  filtrarTransacoes("receitas", receitasButton);
});

despesasButton.addEventListener("click", () => {
  filtrarTransacoes("despesas", despesasButton);
});
