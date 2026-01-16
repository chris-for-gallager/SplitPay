/* ===== State ===== */
let users = [
  { name: "Anya", time: 5 },
  { name: "Alya", time: 5 },
  { name: "Christina", time: 5 },
  { name: "Dasha", time: 4 }
];
let expenses = [];
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
const selectAllBtn = document.getElementById("selectAllBtn");

/* ===== Participants ===== */
function addUser() {
  const name = userName.value.trim();
  const h = Number(timeHours.value || 0);
  const m = Number(timeMinutes.value || 0);
  if (!name) return;
  users.push({ name, time: h + m/60 });
  userName.value = timeHours.value = timeMinutes.value = "";
  renderUsers();
  calculateTotals();
}

function renderUsers() {
  userList.innerHTML = "";
  users.forEach((u, i) => {
    userList.innerHTML += `<li>
      <strong>${u.name}</strong> — ${Math.floor(u.time)}h ${Math.round((u.time % 1)*60)}m
      <button onclick="editUser(${i})">Edit</button>
      <button onclick="deleteUser(${i})">Delete</button>
    </li>`;
  });
}

function editUser(i) {
  const h = prompt("Hours:", Math.floor(users[i].time));
  const m = prompt("Minutes:", Math.round((users[i].time %1)*60));
  if(h!==null && m!==null){
    users[i].time = Number(h)+Number(m)/60;
    renderUsers();
    calculateTotals();
  }
}

function deleteUser(i){
  users.splice(i,1);
  renderUsers();
  renderExpenses();
  calculateTotals();
}

/* ===== Chips ===== */
function renderChips() {
  chipsContainer.innerHTML = "";
  if(selectedUsersIndexes.length===0) return;
  selectedUsersIndexes.forEach(i=>{
    const chip = document.createElement("div");
    chip.className="chip";
    chip.textContent = users[i].name;
    chipsContainer.appendChild(chip);
  });
}

/* ===== Bottom Sheet ===== */
selectParticipantsBtn.onclick = () => {
  bottomSheetOptions.innerHTML = "";
  users.forEach((u,i)=>{
    const btn=document.createElement("button");
    btn.textContent = u.name;
    btn.className = selectedUsersIndexes.includes(i) ? "selected" : "";
    btn.onclick = () => {
      if(selectedUsersIndexes.includes(i)){
        selectedUsersIndexes=selectedUsersIndexes.filter(x=>x!==i);
        btn.classList.remove("selected");
      } else {
        selectedUsersIndexes.push(i);
        btn.classList.add("selected");
      }
    };
    bottomSheetOptions.appendChild(btn);
  });
  bottomSheet.classList.add("show");
};

selectAllBtn.onclick = ()=>{
  selectedUsersIndexes = users.map((_,i)=>i);
  Array.from(bottomSheetOptions.children).forEach(btn=>btn.classList.add("selected"));
};

function closeBottomSheet(){
  bottomSheet.classList.remove("show");
  renderChips();
}

/* ===== Expenses ===== */
function addExpense(){
  const amount = Number(expenseAmount.value);
  if(!amount || selectedUsersIndexes.length===0) return;
  expenses.push({
    type: expenseType.value,
    amount,
    users: selectedUsersIndexes.map(i=>users[i])
  });
  expenseAmount.value="";
  selectedUsersIndexes=[];
  closeBottomSheet();
  renderExpenses();
  calculateTotals();
}

function renderExpenses(){
  expenseList.innerHTML="";
  expenses.forEach((e,i)=>{
    expenseList.innerHTML+=`<li>
      <strong>${e.type}</strong>: ${e.amount} ₽ — ${e.users.map(u=>u.name).join(", ")}
      <button onclick="deleteExpense(${i})">Delete</button>
    </li>`;
  });
}

function deleteExpense(i){
  expenses.splice(i,1);
  renderExpenses();
  calculateTotals();
}

/* ===== Totals — по-человечески ===== */
function calculateTotals(){
  const totals={};
  users.forEach(u=>totals[u.name]=0);

  expenses.forEach(e=>{
    if(e.type==="Food"){
      const part = e.amount / e.users.length;
      e.users.forEach(u=>totals[u.name]+=part);
      return;
    }

    const times = e.users.map(u=>u.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const pricePerHour = e.amount / maxTime;

    // Общие часы
    const commonCost = minTime * pricePerHour;
    const commonPart = commonCost / e.users.length;
    e.users.forEach(u=>totals[u.name]+=commonPart);

    // Дополнительные часы
    const stayed = e.users.filter(u=>u.time>minTime);
    const extraHours = maxTime - minTime;
    if(extraHours>0 && stayed.length>0){
      const extraCost = extraHours * pricePerHour;
      const extraPart = extraCost / stayed.length;
      stayed.forEach(u=>totals[u.name]+=extraPart);
    }
  });

  totalsList.innerHTML="";
  for(const name in totals){
    totalsList.innerHTML+=`<li>${name}: ${totals[name].toFixed(2)} ₽</li>`;
  }
}

/* ===== START / TEST CASE ===== */
window.onload = ()=>{
  expenses.push({
    type:"Rent",
    amount:12500,
    users: users
  });
  renderUsers();
  renderExpenses();
  calculateTotals();
};
