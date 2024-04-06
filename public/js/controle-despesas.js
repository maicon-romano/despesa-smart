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

const transactionsUl = document
  .getElementById("transactions")
  .querySelector("tbody");
const incomeDisplay = document.getElementById("money-plus");
const expenseDisplay = document.getElementById("money-minus");
const balanceDisplay = document.getElementById("balance");
const form = document.getElementById("form");
const inputTransactionName = document.getElementById("text");
const inputTransactionAmount = document.getElementById("amount");

const getTransactionsFromDB = () => {
  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions");

  userTransactionsRef.onSnapshot(
    (querySnapshot) => {
      transactions = []; // Limpa o array de transações a cada atualização
      querySnapshot.forEach((doc) => {
        const transaction = {
          id: doc.id,
          description: doc.data().description,
          value: doc.data().value,
          paid: doc.data().paid,
        };
        transactions.push(transaction);
      });
      init(); // Re-inicializa a aplicação a cada atualização do banco de dados
    },
    (error) => {
      console.error("Erro ao inscrever para atualizações:", error);
    }
  );
};

const addTransactionToDB = async (transaction) => {
  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions");

  await userTransactionsRef
    .add({
      description: transaction.description,
      value: transaction.value.toString().replace(",", "."),
      paid: transaction.paid,
    })
    .catch((error) => {
      console.error("Erro ao adicionar transação ao banco de dados:", error);
    });
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

// Garanta que `calculateAndDisplayBalances` seja chamada em outros lugares onde as transações são modificadas
const removeTransaction = (transactionId) => {
  transactions = transactions.filter(
    (transaction) => transaction.id !== transactionId
  );
  removeTransactionFromDB(transactionId);
  calculateAndDisplayBalances(); // Atualiza os valores depois de remover uma transação
};

const togglePaymentStatus = async (button, transactionId) => {
  const userId = currentUser.uid;
  const transactionRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions")
    .doc(transactionId);

  const transactionIndex = transactions.findIndex(
    (t) => t.id === transactionId
  );
  if (transactionIndex === -1) return; // Se não encontrar, retorna

  const paidStatus = !transactions[transactionIndex].paid;

  try {
    await transactionRef.update({
      paid: paidStatus,
    });

    transactions[transactionIndex].paid = paidStatus; // Atualiza o estado

    // Atualiza a interface de usuário especificamente para a transação alterada
    if (
      (paidStatus &&
        document.getElementById("filtro-status").value === "em aberto") ||
      (!paidStatus && document.getElementById("filtro-status").value === "pago")
    ) {
      transactionsUl.removeChild(button.closest("tr")); // Remove a linha se não corresponder ao filtro
    } else {
      button.style.backgroundColor = paidStatus ? "green" : "red";
      button.textContent = paidStatus ? "Pago" : "Em aberto";
    }

    calculateAndDisplayBalances(); // Atualiza o saldo e totais imediatamente
  } catch (error) {
    console.error("Erro ao atualizar status de pagamento:", error);
  }
};

const limparBotoesPago = async () => {
  const paymentButtons = document.querySelectorAll(".payment-btn");
  paymentButtons.forEach((button) => {
    button.style.backgroundColor = "red";
    button.textContent = "Em aberto";
  });

  try {
    const userId = currentUser.uid;
    const userTransactionsRef = db
      .collection("transactions")
      .doc(userId)
      .collection("userTransactions");

    const querySnapshot = await userTransactionsRef.get();
    querySnapshot.forEach(async (doc) => {
      const transactionIndex = transactions.findIndex((t) => t.id === doc.id);
      if (transactionIndex !== -1) {
        transactions[transactionIndex].paid = false;
        await userTransactionsRef.doc(doc.id).update({
          paid: false,
        });
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar informações no banco de dados:", error);
  }

  init();
};

const atualizarContasBotao = document.getElementById("atualizar-contas-botao");

atualizarContasBotao.addEventListener("click", () => {
  limparBotoesPago();
});

const addTransactionIntoDOM = ({ id, description, value, paid }) => {
  const operator = value < 0 ? "-" : "+";
  const CSSClass = value < 0 ? "minus" : "plus";
  const valueWithoutOperator = Math.abs(value).toFixed(2);

  let rowContent = `
    <td><button class="edit-btn btn btn-primary">✏️</button></td>
    <td>${description}</td>
    <td>${operator} R$ ${valueWithoutOperator}</td>
    <td>${
      CSSClass === "minus"
        ? `<button class="payment-btn btn ${
            paid ? "btn-success" : "btn-danger"
          }" data-id="${id}">${paid ? "Pago" : "Em aberto"}</button>`
        : ""
    }</td>
    <td><button class="del-btn btn btn-danger" data-id="${id}"><i class="fa-solid fa-trash"></i></button></td>`;

  const row = document.createElement("tr");
  row.classList.add(CSSClass);
  row.setAttribute("data-id", id);
  row.innerHTML = rowContent;

  // Adiciona eventos ao botão de pagamento diretamente
  const paymentButton = row.querySelector(".payment-btn");
  if (paymentButton) {
    paymentButton.addEventListener("click", () =>
      togglePaymentStatus(paymentButton, id)
    );
  }

  transactionsUl.appendChild(row);
};

const openEditMenu = async (transactionId) => {
  const transactionIndex = transactions.findIndex(
    (t) => t.id === transactionId
  );
  const transaction = transactions[transactionIndex];

  const newDescription = prompt(
    "Editar nome da transação:",
    transaction.description
  );
  if (newDescription === null) return; // Cancelado pelo usuário

  const newValue = parseFloat(
    prompt("Editar valor da transação:", transaction.value).replace(",", ".")
  );
  if (isNaN(newValue)) return; // Cancelado pelo usuário ou valor inválido

  transaction.description = newDescription;
  transaction.value = newValue;

  const userId = currentUser.uid;
  const transactionRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions")
    .doc(transactionId);

  try {
    await transactionRef.update({
      description: newDescription,
      value: newValue,
    });

    init();
  } catch (error) {
    console.error("Erro ao atualizar transação no banco de dados:", error);
  }
};

const getExpenses = (transactionsAmounts) => {
  return Math.abs(
    transactionsAmounts
      .filter((value) => value < 0)
      .reduce((accumulator, value) => accumulator + Number(value), 0)
  ).toFixed(2);
};

const getIncome = (transactionsAmounts) =>
  transactionsAmounts
    .filter((value) => value > 0)
    .reduce((accumulator, value) => accumulator + Number(value), 0)
    .toFixed(2);

const getTotal = (transactionsAmounts) => {
  return transactionsAmounts
    .reduce((accumulator, transaction) => accumulator + Number(transaction), 0)
    .toFixed(2);
};

const updateBalanceValues = () => {
  const transactionsAmounts = transactions.map(({ value }) => value);
  balanceDisplay.textContent = `R$ ${getTotal(transactionsAmounts)}`;
  incomeDisplay.textContent = `R$ ${getIncome(transactionsAmounts)}`;
  expenseDisplay.textContent = `R$ ${getExpenses(transactionsAmounts)}`;
};

// Você deve chamar esta função sempre que precisar atualizar os valores na interface do usuário.
const calculateAndDisplayBalances = () => {
  const totalIncome = transactions
    .filter((t) => t.value > 0)
    .reduce((acc, t) => acc + Number(t.value), 0);

  const totalExpensesPaid = transactions
    .filter((t) => t.value < 0 && t.paid)
    .reduce((acc, t) => acc + Number(t.value), 0);

  const totalExpenses = transactions
    .filter((t) => t.value < 0)
    .reduce((acc, t) => acc + Number(t.value), 0);

  const currentBalance = totalIncome + totalExpensesPaid; // Receitas - Despesas Pagas
  const subtotal = totalIncome + totalExpenses; // Receitas - Despesas Totais

  balanceDisplay.textContent = `R$ ${currentBalance.toFixed(2)}`;
  incomeDisplay.textContent = `R$ ${totalIncome.toFixed(2)}`;
  expenseDisplay.textContent = `R$ ${Math.abs(totalExpenses).toFixed(2)}`;
  document.getElementById(
    "subtotal"
  ).textContent = `Subtotal: R$ ${subtotal.toFixed(2)}`;

  // Atualiza a linha de totais na tabela
  addTotalRowToDOM(
    transactions.length,
    getTotal(transactions.map((t) => t.value))
  );
};

// Função para adicionar a linha de totais na tabela
const addTotalRowToDOM = (itemCount, totalAmount) => {
  // Remove a linha de totais anterior, se existir
  const existingTotalRow = transactionsUl.querySelector(".total-row");
  if (existingTotalRow) {
    transactionsUl.removeChild(existingTotalRow);
  }

  let rowContent = `
    <td>Total</td>
    <td>${itemCount} itens</td>
    <td>R$ ${totalAmount}</td>
    <td></td>
    <td></td>`;

  const row = document.createElement("tr");
  row.classList.add("total-row");
  row.innerHTML = rowContent;

  transactionsUl.appendChild(row);
};

// Certifique-se de chamar calculateAndDisplayBalances no final de funções que alteram os dados, como init, após adicionar, remover ou alterar transações
const init = () => {
  transactionsUl.innerHTML = "";
  transactions.forEach(addTransactionIntoDOM);
  calculateAndDisplayBalances(); // Atualiza todos os valores na UI
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
    console.log("Usuário autenticado");
    getTransactionsFromDB();
  } else {
    console.log("Usuário não autenticado");
    transactionsUl.innerHTML = "";
  }
});

const selecaoTransacao = document.getElementById("selecao-transacao");

transactionsUl.addEventListener("click", (event) => {
  const tr = event.target.closest("tr");
  const transactionId = tr.getAttribute("data-id");

  if (event.target.classList.contains("del-btn")) {
    // Configura o modal de delete e o abre
    const deleteModal = new bootstrap.Modal(
      document.getElementById("deleteTransactionModal")
    );
    document.getElementById("confirmDelete").onclick = function () {
      removeTransaction(transactionId);
      deleteModal.hide();
    };
    deleteModal.show();
  } else if (event.target.classList.contains("edit-btn")) {
    // Preenche os dados no modal de edição
    const transaction = transactions.find((t) => t.id === transactionId);
    document.getElementById("editTransactionId").value = transactionId;
    document.getElementById("editDescription").value = transaction.description;
    document.getElementById("editValue").value = transaction.value;

    // Configura o ouvinte de evento para o formulário de edição
    const editForm = document.getElementById("editTransactionForm");
    editForm.onsubmit = async function (e) {
      e.preventDefault();
      const newDescription = document.getElementById("editDescription").value;
      const newValue = parseFloat(document.getElementById("editValue").value);

      // Atualiza a transação no banco de dados
      await updateTransaction(transactionId, {
        description: newDescription,
        value: newValue,
      });
      const editModal = bootstrap.Modal.getInstance(
        document.getElementById("editTransactionModal")
      );
      editModal.hide();
    };

    const editModal = new bootstrap.Modal(
      document.getElementById("editTransactionModal")
    );
    editModal.show();
  }
});

// Função para atualizar uma transação
const updateTransaction = async (transactionId, updatedTransaction) => {
  const userId = currentUser.uid;
  const transactionRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions")
    .doc(transactionId);

  await transactionRef.update(updatedTransaction).catch((error) => {
    console.error("Erro ao atualizar transação no banco de dados:", error);
  });
};

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
document
  .getElementById("filtro-tipo")
  .addEventListener("change", filtrarTransacoes);
document
  .getElementById("filtro-status")
  .addEventListener("change", filtrarTransacoes);

function filtrarTransacoes() {
  const tipoSelecionado = document.getElementById("filtro-tipo").value;
  const statusSelecionado = document.getElementById("filtro-status").value;

  let transacoesFiltradas = transactions.filter((transaction) => {
    const filtroTipo =
      tipoSelecionado === "todos" ||
      (tipoSelecionado === "receitas" && transaction.value > 0) ||
      (tipoSelecionado === "despesas" && transaction.value < 0);
    const filtroStatus =
      statusSelecionado === "todos" ||
      (statusSelecionado === "pago" && transaction.paid) ||
      (statusSelecionado === "em aberto" && !transaction.paid);

    return filtroTipo && filtroStatus;
  });

  transactionsUl.innerHTML = "";
  transacoesFiltradas.forEach(addTransactionIntoDOM);
  addTotalRowToDOM(
    transacoesFiltradas.length,
    getTotal(transacoesFiltradas.map((t) => t.value))
  );
}

document.getElementById("adicionar-receita").addEventListener("click", () => {
  abrirModalTransacao("receita");
});

document.getElementById("adicionar-despesa").addEventListener("click", () => {
  abrirModalTransacao("despesa");
});

function abrirModalTransacao(tipo) {
  document.getElementById("tipo-transacao-modal").value = tipo;
  var modalElement = document.getElementById("modalTransacao");
  var modal = new bootstrap.Modal(modalElement);
  modal.show();
}

document
  .getElementById("salvar-transacao")
  .addEventListener("click", async () => {
    const tipo = document.getElementById("tipo-transacao-modal").value;
    const descricao = document.getElementById("nome-transacao-modal").value;
    const valor = parseFloat(
      document.getElementById("valor-transacao-modal").value
    );

    const transaction = {
      description: descricao,
      value: tipo === "despesa" ? -Math.abs(valor) : Math.abs(valor),
      paid: tipo === "despesa" ? false : true,
    };

    await addTransactionToDB(transaction);
    var modalElement = document.getElementById("modalTransacao");
    var modal = bootstrap.Modal.getInstance(modalElement);
    modal.hide();
  });
