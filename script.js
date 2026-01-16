const USERS_KEY = "users";
const EXPENSES_KEY = "expenses";

/* ===== State ===== */
let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [
  { name: "Anya", time: 4 },
  { name: "Alya", time: 4 },
  { name: "Christina", time: 4 },
  { name: "Dasha", time: 5 }
];

let expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
let selectedUsersIndexes = [];

/* ===== Elements ===== */
const userName = document.getElementById("userName");
const timeHours = document.getElementById("timeHours");
const timeMinutes = document.getElementById("timeMinutes");
const userList = document.getElementById("userList");
const expenseType = document.getElementById("expenseType");
const expenseAmount = document.getElementById("expenseAmount");
const expenseList = document.getElementById("expenseList");
const totalsList = document.getElementById("totalsList");
const chipsContainer = document.getElementById("chipsContainer");
const bottomSheet = document.getElementById("bottomSheet");
const bottomSheetOptions = document.getElementById("bottomSheetOptions");
const selectParticipantsBtn = document.getElementById("selectParticipantsBtn");

/* ===== Utils ===== */
function save() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

/* ===== Participants ===== */
function addUser() {
  const name = userName.value.trim();
  const h = Number(timeHours.value || 0);
  const m = Number(timeMinutes.value || 0);
  if (!name) return;

  users.push({ name, time: h + m / 60 });
  userName.value = timeHours.value = timeMinutes.value = "";

  save();
  renderUsers();
  calculateTotals();
  haptic();
}

function renderUsers() {
  userList.innerHTML = "";
  users.forEach((u, i) => {
    userList.innerHTML += `
      <li>
        <strong>${u.name}</strong> — ${Math.floor(u.time)}h ${Math.round((u.time % 1) * 60)}m
        <button onclick="editUser(${i})">Edit</button>
        <button onclick="deleteUser(${i})">Delete</button>
      </li>`;
  });
  renderChips();
}

function editUser(i) {
  const h = prompt("Hours:", Math.floor(users[i].time));
  const m = prompt("Minutes:", Math.round((users[i].time % 1) * 60));
  if (h !== null && m !== null) {
    users[i].time = Number(h) + Number(m) / 60;
    save();
    renderUsers();
    calculateTotals();
  }
}

function deleteUser(i) {
  users.splice(i, 1);
  save();
  renderUsers();
  renderExpenses();
  calculateTotals();
}

/* ===== Chips ===== */
function renderChips() {
  chipsContainer.innerHTML = "";
  selectedUsersIndexes.forEach(i => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = users[i].name;
    chipsContainer.appendChild(chip);
  });
}

/* ===== Bottom Sheet ===== */
selectParticipantsBtn.onclick = () => {
  bottomSheetOptions.innerHTML = "";
  users.forEach((u, i) => {
    const btn = document.createElement("button");
    btn.textContent = u.name;
    btn.className = selectedUsersIndexes.includes(i) ? "selected" : "";
    btn.onclick = () => {
      if (selectedUsersIndexes.includes(i)) {
        selectedUsersIndexes = selectedUsersIndexes.filter(x => x !== i);
      } else {
        selectedUsersIndexes.push(i);
      }
      btn.classList.toggle("selected");
    };
    bottomSheetOptions.appendChild(btn);
  });
  bottomSheet.classList.add("show");
};

function closeBottomSheet() {
  renderChips();
  bottomSheet.classList.remove("show");
}

/* ===== Expenses ===== */
function addExpense() {
  const amount = Number(expenseAmount.value);
  if (!amount || selectedUsersIndexes.length === 0) return;

  expenses.push({
    type: expenseType.value,
    amount,
    users: selectedUsersIndexes.map(i => users[i])
  });

  expenseAmount.value = "";
  selectedUsersIndexes = [];
  renderChips();
  save();
  renderExpenses();
  calculateTotals();
}

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach((e, i) => {
    expenseList.innerHTML += `
      <li>
        <strong>${e.type}</strong>: ${e.amount} ₽ — ${e.users.map(u => u.name).join(", ")}
        <button onclick="deleteExpense(${i})">Delete</button>
      </li>`;
  });
}

function deleteExpense(i) {
  expenses.splice(i, 1);
  save();
  renderExpenses();
  calculateTotals();
}

/* ===== Totals — ПО-ЧЕЛОВЕЧЕСКИ ===== */
function calculateTotals() {
  const totals = {};
  users.forEach(u => totals[u.name] = 0);

  expenses.forEach(e => {

    /* Еда — просто поровну */
    if (e.type === "Food") {
      const part = e.amount / e.users.length;
      e.users.forEach(u => totals[u.name] += part);
      return;
    }

    /* ===== Аренда ===== */
    const times = e.users.map(u => u.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const pricePerHour = e.amount / maxTime;

    /* 1. Общие часы */
    const commonCost = minTime * pricePerHour;
    const commonPart = commonCost / e.users.length;

    e.users.forEach(u => {
      totals[u.name] += commonPart;
    });

    /* 2. Дополнительные часы */
    const stayed = e.users.filter(u => u.time > minTime);
    const extraHours = maxTime - minTime;

    if (extraHours > 0 && stayed.length > 0) {
      const extraCost = extraHours * pricePerHour;
      const extraPart = extraCost / stayed.length;

      stayed.forEach(u => {
        totals[u.name] += extraPart;
      });
    }
  });

  totalsList.innerHTML = "";
  for (const name in totals) {
    totalsList.innerHTML += `<li>${name}: ${totals[name].toFixed(2)} ₽</li>`;
  }
}

/* ===== Start ===== */
renderUsers();
renderExpenses();
calculateTotals();
