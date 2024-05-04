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
      transactions = [];
      querySnapshot.forEach((doc) => {
        const transaction = {
          id: doc.id,
          description: doc.data().description,
          value: doc.data().value,
          paid: doc.data().paid,
          category: doc.data().category, // Certifique-se de que este campo está sendo extraído corretamente
          source: doc.data().source, // Certifique-se de que este campo está sendo extraído corretamente
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
      category: transaction.category,
      source: transaction.source,
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

// Função para adicionar categoria ao banco de dados
const addCategoryToDB = async (name, type) => {
  const userId = currentUser ? currentUser.uid : null;
  if (!userId) {
    console.error("Usuário não autenticado.");
    return;
  }

  const userCategoriesRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userCategories");

  try {
    await userCategoriesRef.add({ name, type });
    console.log("Categoria adicionada ao banco de dados");
  } catch (error) {
    console.error("Erro ao adicionar categoria ao banco de dados:", error);
  }
};

// Função para adicionar fonte ao banco de dados
const addSourceToDB = async (name, type) => {
  const userId = currentUser ? currentUser.uid : null;
  if (!userId) {
    console.error("Usuário não autenticado.");
    return;
  }

  const userSourcesRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userSources");

  try {
    await userSourcesRef.add({ name, type });
    console.log("Fonte adicionada ao banco de dados");
  } catch (error) {
    console.error("Erro ao adicionar fonte ao banco de dados:", error);
  }
};

// Evento para trocar categorias e fontes ao mudar o tipo de transação no modal de adição
document
  .getElementById("tipo-transacao-modal")
  .addEventListener("change", (e) => {
    const tipoSelecionado = e.target.value;
    populateCategoriesByType(tipoSelecionado, "categoria-transacao-modal");
    populateSourcesByType(tipoSelecionado, "fonte-transacao-modal");
  });

// Função para preencher as categorias com base no tipo selecionado
const populateCategoriesByType = async (type, selectElementId) => {
  const userId = currentUser ? currentUser.uid : null;
  if (!userId) {
    console.error("Usuário não autenticado.");
    return;
  }

  const userCategoriesRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userCategories");

  try {
    const snapshot = await userCategoriesRef.where("type", "==", type).get();
    const selectElement = document.getElementById(selectElementId);
    selectElement.innerHTML = ""; // Limpar opções

    snapshot.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.data().name;
      option.textContent = doc.data().name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
  }
};

// Função para preencher as fontes com base no tipo selecionado
const populateSourcesByType = async (type, selectElementId) => {
  const userId = currentUser ? currentUser.uid : null;
  if (!userId) {
    console.error("Usuário não autenticado.");
    return;
  }

  const userSourcesRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userSources");

  try {
    const snapshot = await userSourcesRef.where("type", "==", type).get();
    const selectElement = document.getElementById(selectElementId);
    selectElement.innerHTML = ""; // Limpar opções

    snapshot.forEach((doc) => {
      const option = document.createElement("option");
      option.value = doc.data().name;
      option.textContent = doc.data().name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao buscar fontes:", error);
  }
};

// Função para abrir o modal de adicionar categoria
const openAddCategoryModal = () => {
  var modal = new bootstrap.Modal(document.getElementById("modalCategoria"));
  modal.show();
};

// Função para abrir o modal de adicionar fonte
const openAddSourceModal = () => {
  var modal = new bootstrap.Modal(document.getElementById("modalFonte"));
  modal.show();
};

// Evento para salvar nova categoria
// Evento para salvar nova categoria
document
  .getElementById("salvar-categoria")
  .addEventListener("click", async () => {
    const name = document.getElementById("nome-categoria-modal").value;
    const type = document.querySelector(
      'input[name="tipoCategoria"]:checked'
    ).value;
    await addCategoryToDB(name, type);
    var modal = bootstrap.Modal.getInstance(
      document.getElementById("modalCategoria")
    );
    modal.hide();
    populateCategorySelects(); // Atualiza os selects de categorias
  });

// Evento para salvar nova fonte
document.getElementById("salvar-fonte").addEventListener("click", async () => {
  const name = document.getElementById("nome-fonte-modal").value;
  const type = document.querySelector('input[name="tipoFonte"]:checked').value;
  await addSourceToDB(name, type);
  var modal = bootstrap.Modal.getInstance(
    document.getElementById("modalFonte")
  );
  modal.hide();
  populateSourceSelects(); // Atualiza os selects de fontes
});

// Garanta que `calculateAndDisplayBalances` seja chamada em outros lugares onde as transações são modificadas
const removeTransaction = async (transactionId) => {
  const userId = currentUser.uid;
  const userTransactionsRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions")
    .doc(transactionId);

  try {
    await userTransactionsRef.delete();
    console.log("Transação removida do banco de dados");

    Swal.fire({
      title: "Removido!",
      text: "Transação removida com sucesso.",
      icon: "success",
      confirmButtonText: "Ok",
    });

    transactions = transactions.filter(
      (transaction) => transaction.id !== transactionId
    );
    calculateAndDisplayBalances();
    filtrarTransacoes(); // Recarrega a tabela com os filtros aplicados
  } catch (error) {
    console.error("Erro ao remover transação do banco de dados:", error);
    Swal.fire({
      title: "Erro!",
      text: "Não foi possível remover a transação.",
      icon: "error",
      confirmButtonText: "Ok",
    });
  }
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
    await transactionRef.update({ paid: paidStatus });
    transactions[transactionIndex].paid = paidStatus; // Atualiza o estado na memória

    // Após a atualização, reaplicar os filtros em vez de alterar a DOM diretamente
    filtrarTransacoes();
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

const addTransactionIntoDOM = ({
  id,
  description,
  value,
  paid,
  category,
  source,
}) => {
  console.log(category, source); // Isso mostrará os valores no console do navegador
  const operator = value < 0 ? "-" : "+";
  const CSSClass = value < 0 ? "minus" : "plus";
  const valueWithoutOperator = Math.abs(value).toFixed(2);

  let rowContent = `
      <td><button class="edit-btn btn btn-primary">✏️</button></td>
      <td>${description}</td>
      <td>${operator} R$ ${valueWithoutOperator}</td>
      <td>${category}</td>
      <td>${source}</td>
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

  // Ajuste aqui: converter entrada para formato correto e aceitar números decimais com vírgula ou ponto
  const rawNewValue = prompt("Editar valor da transação:", transaction.value);
  const newValue = parseFloat(rawNewValue.replace(",", "."));
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

    init(); // Re-inicializar para atualizar a UI
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

const selecaoTransacao = document.getElementById("selecao-transacao");

// Substitui as chamadas a `populateCategorySelects` e `populateSourceSelects` dentro do evento `onAuthStateChanged`
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log("Usuário autenticado");
    getTransactionsFromDB();
    // Preencher ambos os selects com todas as categorias e fontes inicialmente
    populateCategoriesByType("receita", "categoria-transacao-modal");
    populateSourcesByType("receita", "fonte-transacao-modal");
  } else {
    currentUser = null;
    console.log("Usuário não autenticado");
    transactionsUl.innerHTML = "";
  }
});

// Função para abrir o modal de adicionar transação com preenchimento automático de categorias e fontes
function abrirModalTransacao(tipo) {
  document.getElementById("tipo-transacao-modal").value = tipo;
  populateCategoriesByType(tipo, "categoria-transacao-modal");
  populateSourcesByType(tipo, "fonte-transacao-modal");

  const modalElement = document.getElementById("modalTransacao");
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
}

// Evento para deletar ou editar uma transação
transactionsUl.addEventListener("click", (event) => {
  // Identificar a linha associada ao botão clicado
  const tr = event.target.closest("tr");
  if (!tr) return;

  const transactionId = tr.getAttribute("data-id");

  // Verificar se o botão clicado é de edição
  if (event.target.classList.contains("edit-btn")) {
    const transaction = transactions.find((t) => t.id === transactionId);
    openEditTransactionModal(transaction);

    // Verificar se o botão clicado é de exclusão
  } else if (event.target.classList.contains("del-btn")) {
    const deleteModal = new bootstrap.Modal(
      document.getElementById("deleteTransactionModal")
    );
    document.getElementById("confirmDelete").onclick = async function () {
      await removeTransaction(transactionId);
      deleteModal.hide();
    };
    deleteModal.show();
  }
});

// Função de abrir o modal de edição para uma transação específica
const openEditTransactionModal = async (transaction) => {
  if (!transaction) return;

  // Preencher campos no modal
  document.getElementById("editTransactionId").value = transaction.id;
  document.getElementById("editDescription").value = transaction.description;
  document.getElementById("editValue").value = Math.abs(transaction.value);

  const tipo = transaction.value > 0 ? "receita" : "despesa";
  await populateCategoriesByType(tipo, "editCategory");
  await populateSourcesByType(tipo, "editSource");

  document.getElementById("editCategory").value = transaction.category;
  document.getElementById("editSource").value = transaction.source;

  // Exibir o modal
  const editModal = new bootstrap.Modal(
    document.getElementById("editTransactionModal")
  );
  editModal.show();
};
// Associa a função `onsubmit` ao formulário de edição
document.getElementById("editTransactionForm").onsubmit = async function (e) {
  e.preventDefault(); // Previne comportamento padrão de recarregar a página

  // Obtenha os dados do formulário
  const transactionId = document.getElementById("editTransactionId").value;
  const description = document.getElementById("editDescription").value;
  let value = parseFloat(document.getElementById("editValue").value);
  const category = document.getElementById("editCategory").value;
  const source = document.getElementById("editSource").value;

  // Verifique se é uma despesa ou receita
  value = value < 0 ? -Math.abs(value) : Math.abs(value);

  // Atualiza a transação com os novos valores
  const updatedTransaction = { description, value, category, source };

  try {
    await updateTransaction(transactionId, updatedTransaction); // Função de atualização no Firestore
  } catch (error) {
    console.error("Erro ao tentar atualizar a transação:", error);
  }
};

// Função para atualizar uma transação no Firestore
const updateTransaction = async (transactionId, updatedTransaction) => {
  const userId = currentUser.uid;
  const transactionRef = db
    .collection("transactions")
    .doc(userId)
    .collection("userTransactions")
    .doc(transactionId);

  try {
    await transactionRef.update(updatedTransaction);
    console.log("Transação atualizada no banco de dados");

    // Exibir SweetAlert de sucesso
    Swal.fire({
      title: "Sucesso!",
      text: "Transação atualizada com sucesso.",
      icon: "success",
      confirmButtonText: "Ok",
    });

    // Fechar o modal de edição
    const editModal = bootstrap.Modal.getInstance(
      document.getElementById("editTransactionModal")
    );
    editModal.hide();

    // Recarregar a tabela de transações filtradas
    filtrarTransacoes();
  } catch (error) {
    console.error("Erro ao atualizar transação no banco de dados:", error);

    // Exibir SweetAlert de erro
    Swal.fire({
      title: "Erro!",
      text: "Não foi possível atualizar a transação.",
      icon: "error",
      confirmButtonText: "Ok",
    });
  }
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

document
  .getElementById("filtro-nome")
  .addEventListener("input", filtrarTransacoes);

function filtrarTransacoes() {
  const tipoSelecionado = document.getElementById("filtro-tipo").value;
  const statusSelecionado = document.getElementById("filtro-status").value;
  const nomePesquisa = document
    .getElementById("filtro-nome")
    .value.toLowerCase();

  let transacoesFiltradas = transactions.filter((transaction) => {
    const filtroTipo =
      tipoSelecionado === "todos" ||
      (tipoSelecionado === "receitas" && transaction.value > 0) ||
      (tipoSelecionado === "despesas" && transaction.value < 0);
    const filtroStatus =
      statusSelecionado === "todos" ||
      (statusSelecionado === "pago" && transaction.paid) ||
      (statusSelecionado === "em aberto" && !transaction.paid);
    const filtroNome = transaction.description
      .toLowerCase()
      .includes(nomePesquisa);

    return filtroTipo && filtroStatus && filtroNome;
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

// Eventos para abrir os modais de adicionar categoria e fonte
document
  .getElementById("adicionar-categoria")
  .addEventListener("click", openAddCategoryModal);

document
  .getElementById("adicionar-fonte")
  .addEventListener("click", openAddSourceModal);

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
    const categoria = document.getElementById(
      "categoria-transacao-modal"
    ).value;
    const fonte = document.getElementById("fonte-transacao-modal").value;

    const transaction = {
      description: descricao,
      value: tipo === "despesa" ? -Math.abs(valor) : Math.abs(valor),
      paid: tipo === "despesa" ? false : true,
      category: categoria,
      source: fonte,
    };

    try {
      await addTransactionToDB(transaction);
      Swal.fire({
        title: "Sucesso!",
        text: `A ${tipo === "despesa" ? "despesa" : "receita"} foi adicionada.`,
        icon: "success",
        confirmButtonText: "Ok",
      });

      document
        .getElementById("modalTransacao")
        .querySelector(".modal-body form")
        .reset();
      var modal = bootstrap.Modal.getInstance(
        document.getElementById("modalTransacao")
      );
      modal.hide();
    } catch (error) {
      console.error("Erro ao adicionar transação ao banco de dados:", error);
      Swal.fire({
        title: "Erro!",
        text: "Não foi possível adicionar a transação.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    }
  });
