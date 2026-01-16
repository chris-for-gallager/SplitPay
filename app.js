const KEY = "splitpay-data";

let data = JSON.parse(localStorage.getItem(KEY)) || {
  participants: [],
  expenses: []
};

function save() {
  localStorage.setItem(KEY, JSON.stringify(data));
  render();
}

function addParticipant() {
  const name = nameInput.value;
  const hours = Number(hoursInput.value);
  const minutes = Number(minutesInput.value);

  data.participants.push({
    id: crypto.randomUUID(),
    name,
    durationMinutes: hours * 60 + minutes
  });

  save();
}

function removeParticipant(id) {
  data.participants = data.participants.filter(p => p.id !== id);
  save();
}

function addExpense() {
  const category = categorySelect.value;
  const amount = Number(amountInput.value);

  const selected = [...document.querySelectorAll(".ep:checked")]
    .map(cb => cb.value);

  data.expenses.push({
    id: crypto.randomUUID(),
    category,
    amount,
    participants: selected
  });

  save();
}

function removeExpense(id) {
  data.expenses = data.expenses.filter(e => e.id !== id);
  save();
}

function selectAll() {
  document.querySelectorAll(".ep").forEach(cb => cb.checked = true);
}

function calculate() {
  const rent = calculateRent();
  const food = calculateFood();

  let text = "";

  data.participants.forEach(p => {
    const r = Math.round(rent[p.id] || 0);
    const f = Math.round(food[p.id] || 0);
    text += `${p.name}
Аренда: ${r}
Еда: ${f}
Итого: ${r + f}\n\n`;
  });

  result.textContent = text;
}

function calculateRent() {
  const rentExpense = data.expenses.find(e => e.category === "rent");
  if (!rentExpense) return {};

  const participants = data.participants
    .filter(p => rentExpense.participants.includes(p.id));

  const result = {};
  participants.forEach(p => result[p.id] = 0);

  const sorted = [...participants].sort(
    (a, b) => a.durationMinutes - b.durationMinutes
  );

  const maxTime = sorted.at(-1).durationMinutes;
  const pricePerMinute = rentExpense.amount / maxTime;

  let prev = 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i].durationMinutes;
    const interval = current - prev;
    const active = sorted.slice(i);

    const cost = interval * pricePerMinute / active.length;

    active.forEach(p => result[p.id] += cost);
    prev = current;
  }

  return result;
}

function calculateFood() {
  const result = {};
  data.participants.forEach(p => result[p.id] = 0);

  data.expenses
    .filter(e => e.category === "food")
    .forEach(e => {
      const share = e.amount / e.participants.length;
      e.participants.forEach(pid => result[pid] += share);
    });

  return result;
}

function render() {
  participants.innerHTML = data.participants.map(p =>
    `<div class="row">
      ${p.name} (${Math.floor(p.durationMinutes/60)}ч ${p.durationMinutes%60}м)
      <button onclick="removeParticipant('${p.id}')">✕</button>
    </div>`
  ).join("");

  expenseParticipants.innerHTML = data.participants.map(p =>
    `<label>
      <input class="ep" type="checkbox" value="${p.id}"> ${p.name}
    </label><br>`
  ).join("");

  expenses.innerHTML = data.expenses.map(e =>
    `<div class="row small">
      ${e.category} — ${e.amount}
      <button onclick="removeExpense('${e.id}')">✕</button>
    </div>`
  ).join("");
}

const nameInput = document.getElementById("name");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const categorySelect = document.getElementById("category");
const amountInput = document.getElementById("amount");

render();
