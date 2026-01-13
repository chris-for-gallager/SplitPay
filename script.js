const USERS_KEY = "users";
const EXPENSES_KEY = "expenses";

let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [
  { name: "Anya", time: 4 },
  { name: "Alya", time: 4 },
  { name: "Christina", time: 4 },
  { name: "Dasha", time: 4 }
];

let expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
let selectedUsersIndexes = [];

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
        <button class="btn-edit" onclick="editUser(${i})">Edit</button>
        <button class="btn-delete" onclick="deleteUser(${i})">Delete</button>
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
    haptic();
  }
}

function deleteUser(i) {
  if (confirm("Delete participant?")) {
    users.splice(i, 1);
    save();
    renderUsers();
    renderExpenses();
    calculateTotals();
    haptic();
  }
}

/* ===== Chips ===== */
function renderChips() {
  chipsContainer.innerHTML = "";

  if (selectedUsersIndexes.length === 0) return;
  if (selectedUsersIndexes.length === users.length) {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = "All";
    chipsContainer.appendChild(chip);
    return;
  }

  selectedUsersIndexes.forEach(i => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.textContent = users[i].name;
    chipsContainer.appendChild(chip);
  });
}

/* ===== Bottom Sheet ===== */
selectParticipantsBtn.addEventListener("click", openBottomSheet);

function openBottomSheet() {
  bottomSheetOptions.innerHTML = "";

  users.forEach((u, i) => {
    const btn = document.createElement("button");
    btn.textContent = u.name;
    btn.className = selectedUsersIndexes.includes(i) ? "participant-btn selected" : "participant-btn";
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
}

function closeBottomSheet() {
  renderChips();
  bottomSheet.classList.remove("show");
}

function selectAllParticipants() {
  selectedUsersIndexes = users.map((_, i) => i);
  openBottomSheet(); // обновляем кнопки с выбранными
}

/* ===== Expenses ===== */
function addExpense() {
  const amount = Number(expenseAmount.value);
  if (!amount) return;
  if (selectedUsersIndexes.length === 0) return alert("Select participants");

  const involved = selectedUsersIndexes.map(i => users[i]);
  expenses.push({
    type: expenseType.value,
    amount,
    users: involved
  });

  expenseAmount.value = "";
  selectedUsersIndexes = [];
  renderChips();
  save();
  renderExpenses();
  calculateTotals();
  haptic();
}

function renderExpenses() {
  expenseList.innerHTML = "";
  expenses.forEach((e, i) => {
    expenseList.innerHTML += `<li><strong>${e.type}</strong>: ${e.amount} ₽ — ${e.users.map(u=>u.name).join(", ")}
      <button class="btn-delete" onclick="deleteExpense(${i})">Delete</button></li>`;
  });
}

function deleteExpense(i) {
  if (confirm("Delete expense?")) {
    expenses.splice(i, 1);
    save();
    renderExpenses();
    calculateTotals();
    haptic();
  }
}

/* ===== Totals ===== */
function calculateTotals() {
  const totals = {};
  users.forEach(u => totals[u.name] = 0);

  expenses.forEach(e => {
    if (e.type === "Food") {
      const part = e.amount / e.users.length;
      e.users.forEach(u => totals[u.name] += part);
    } else {
      const t = e.users.reduce((s,u)=>s+u.time,0);
      e.users.forEach(u=>totals[u.name] += e.amount*(u.time/t));
    }
  });

  totalsList.innerHTML = "";
  for (const name in totals) {
    totalsList.innerHTML += `<li>${name}: ${totals[name].toFixed(2)} ₽</li>`;
  }
  haptic();
}

/* ===== Export ===== */
function exportText() {
  let text = "Expenses:\n";
  expenses.forEach(e => text+=`${e.type} — ${e.amount} ₽ (${e.users.map(u=>u.name).join(", ")})\n`);
  text += "\nTotals:\n";
  const totals = {};
  users.forEach(u=>totals[u.name]=0);
  expenses.forEach(e=>{
    if(e.type==="Food"){
      const part = e.amount/e.users.length;
      e.users.forEach(u=>totals[u.name]+=part);
    } else {
      const t = e.users.reduce((s,u)=>s+u.time,0);
      e.users.forEach(u=>totals[u.name]+=e.amount*(u.time/t));
    }
  });
  for(const name in totals){
    text+=`${name}: ${totals[name].toFixed(2)} ₽\n`;
  }
  navigator.clipboard.writeText(text);
  haptic();
  alert("Copied 👍");
}

/* ===== Start ===== */
renderUsers();
renderExpenses();
calculateTotals();
