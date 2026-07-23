import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CreditCard,
  Download,
  Landmark,
  PiggyBank,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TransactionType = "income" | "expense" | "transfer";
type AccountType = "bank" | "cash" | "credit" | "savings";

type Account = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
};

type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  date: string;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  note?: string;
  autoKey?: string;
};

type BudgetLimit = {
  id: string;
  category: string;
  limit: number;
};

type SavingGoal = {
  id: string;
  title: string;
  target: number;
  current: number;
};

type Debt = {
  id: string;
  title: string;
  total: number;
  paid: number;
  monthlyRate: number;
  accountId?: string;
};

type Subscription = {
  id: string;
  title: string;
  amount: number;
  category: string;
  billingDay: number;
  accountId?: string;
};

type RecurringIncome = {
  id: string;
  title: string;
  amount: number;
  category: string;
  payday: number;
  accountId?: string;
};

const today = new Date().toISOString().slice(0, 10);
const currentMonth = today.slice(0, 7);

const COLORS = ["#22d3ee", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#eab308", "#38bdf8", "#f472b6"];

const defaultAccounts: Account[] = [
  { id: "main-bank", name: "Hauptkonto", type: "bank", balance: 4200 },
  { id: "cash", name: "Bargeld", type: "cash", balance: 150 },
  { id: "savings", name: "Sparkonto", type: "savings", balance: 1200 },
  { id: "credit-card", name: "Kreditkarte", type: "credit", balance: -300 },
];

const defaultTransactions: Transaction[] = [
  { id: crypto.randomUUID(), type: "income", title: "Lohn", category: "Einkommen", amount: 4200, date: today, accountId: "main-bank" },
  { id: crypto.randomUUID(), type: "expense", title: "Miete", category: "Wohnen", amount: 1200, date: today, accountId: "main-bank" },
  { id: crypto.randomUUID(), type: "expense", title: "Krankenkasse", category: "Versicherung", amount: 350, date: today, accountId: "main-bank" },
];

const defaultBudgets: BudgetLimit[] = [
  { id: crypto.randomUUID(), category: "Essen", limit: 600 },
  { id: crypto.randomUUID(), category: "Freizeit", limit: 300 },
  { id: crypto.randomUUID(), category: "Shopping", limit: 250 },
  { id: crypto.randomUUID(), category: "Transport", limit: 200 },
];

const defaultGoals: SavingGoal[] = [
  { id: crypto.randomUUID(), title: "Notgroschen", target: 5000, current: 1200 },
];

const defaultDebts: Debt[] = [
  { id: crypto.randomUUID(), title: "Kreditkarte", total: 1200, paid: 300, monthlyRate: 150, accountId: "main-bank" },
];

const defaultSubscriptions: Subscription[] = [
  { id: crypto.randomUUID(), title: "Netflix", amount: 18.9, category: "Abo", billingDay: 5, accountId: "main-bank" },
  { id: crypto.randomUUID(), title: "Handyvertrag", amount: 29.9, category: "Kommunikation", billingDay: 15, accountId: "main-bank" },
];

const defaultRecurringIncome: RecurringIncome[] = [
  { id: crypto.randomUUID(), title: "Lohn", amount: 4200, category: "Einkommen", payday: 25, accountId: "main-bank" },
];

function load<T>(key: string, fallback: T): T {
  const saved = localStorage.getItem(key);
  if (!saved) return fallback;
  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatCHF(value: number) {
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
  }).format(value || 0);
}

function monthLabel(month: string) {
  const [year, m] = month.split("-");
  return `${m}.${year}`;
}

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [accounts, setAccounts] = useState<Account[]>(() => load("bp_accounts", defaultAccounts));
  const [transactions, setTransactions] = useState<Transaction[]>(() => load("bp_transactions", defaultTransactions));
  const [budgets, setBudgets] = useState<BudgetLimit[]>(() => load("bp_budgets", defaultBudgets));
  const [goals, setGoals] = useState<SavingGoal[]>(() => load("bp_goals", defaultGoals));
  const [debts, setDebts] = useState<Debt[]>(() => load("bp_debts", defaultDebts));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => load("bp_subscriptions", defaultSubscriptions));
  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>(() => load("bp_recurring_income", defaultRecurringIncome));
  const [search, setSearch] = useState("");

  const firstAccountId = accounts[0]?.id ?? "";

  const [accountForm, setAccountForm] = useState({ name: "", type: "bank" as AccountType, balance: "" });
  const [transactionForm, setTransactionForm] = useState({
    type: "expense" as TransactionType,
    title: "",
    category: "",
    amount: "",
    date: today,
    accountId: firstAccountId,
    fromAccountId: firstAccountId,
    toAccountId: "",
    note: "",
  });
  const [budgetForm, setBudgetForm] = useState({ category: "", limit: "" });
  const [goalForm, setGoalForm] = useState({ title: "", target: "", current: "" });
  const [debtForm, setDebtForm] = useState({ title: "", total: "", paid: "", monthlyRate: "", accountId: firstAccountId });
  const [subscriptionForm, setSubscriptionForm] = useState({ title: "", amount: "", category: "", billingDay: "", accountId: firstAccountId });
  const [incomeForm, setIncomeForm] = useState({ title: "", amount: "", category: "Einkommen", payday: "25", accountId: firstAccountId });

  useEffect(() => save("bp_accounts", accounts), [accounts]);
  useEffect(() => save("bp_transactions", transactions), [transactions]);
  useEffect(() => save("bp_budgets", budgets), [budgets]);
  useEffect(() => save("bp_goals", goals), [goals]);
  useEffect(() => save("bp_debts", debts), [debts]);
  useEffect(() => save("bp_subscriptions", subscriptions), [subscriptions]);
  useEffect(() => save("bp_recurring_income", recurringIncomes), [recurringIncomes]);

  useEffect(() => {
    const month = new Date().toISOString().slice(0, 7);
    const autoTransactions: Transaction[] = [];

    subscriptions.forEach((sub) => {
      const autoKey = `sub-${sub.id}-${month}`;
      const alreadyBooked = transactions.some((t) => t.autoKey === autoKey);
      if (!alreadyBooked) {
        autoTransactions.push({
          id: crypto.randomUUID(),
          type: "expense",
          title: sub.title,
          category: sub.category,
          amount: sub.amount,
          date: `${month}-${String(sub.billingDay).padStart(2, "0")}`,
          accountId: sub.accountId || firstAccountId,
          note: "Automatisch gebuchtes Abo",
          autoKey,
        });
      }
    });

    recurringIncomes.forEach((income) => {
      const autoKey = `income-${income.id}-${month}`;
      const alreadyBooked = transactions.some((t) => t.autoKey === autoKey);
      if (!alreadyBooked) {
        autoTransactions.push({
          id: crypto.randomUUID(),
          type: "income",
          title: income.title,
          category: income.category,
          amount: income.amount,
          date: `${month}-${String(income.payday).padStart(2, "0")}`,
          accountId: income.accountId || firstAccountId,
          note: "Automatisch gebuchte Einnahme",
          autoKey,
        });
      }
    });

    if (autoTransactions.length > 0) {
      setTransactions((current) => [...current, ...autoTransactions]);
    }
  }, [subscriptions, recurringIncomes, firstAccountId]);

  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    accounts.forEach((a) => (map[a.id] = a.balance));

    transactions.forEach((t) => {
      if (t.type === "income" && t.accountId) map[t.accountId] = (map[t.accountId] || 0) + t.amount;
      if (t.type === "expense" && t.accountId) map[t.accountId] = (map[t.accountId] || 0) - t.amount;
      if (t.type === "transfer" && t.fromAccountId && t.toAccountId) {
        map[t.fromAccountId] = (map[t.fromAccountId] || 0) - t.amount;
        map[t.toAccountId] = (map[t.toAccountId] || 0) + t.amount;
      }
    });

    return map;
  }, [accounts, transactions]);

  const totalNetWorth = useMemo(() => Object.values(accountBalances).reduce((sum, value) => sum + value, 0), [accountBalances]);

  const monthTransactions = useMemo(() => transactions.filter((item) => item.date.startsWith(selectedMonth)), [transactions, selectedMonth]);

  const filteredTransactions = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return monthTransactions;
    return monthTransactions.filter((item) => `${item.title} ${item.category} ${item.note ?? ""}`.toLowerCase().includes(query));
  }, [monthTransactions, search]);

  const stats = useMemo(() => {
    const income = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const transfers = monthTransactions.filter((item) => item.type === "transfer").reduce((sum, item) => sum + item.amount, 0);
    const debtMonthly = debts.reduce((sum, item) => sum + item.monthlyRate, 0);
    const balance = income - expenses - debtMonthly;
    const savingsTotal = goals.reduce((sum, item) => sum + item.current, 0);
    const debtOpen = debts.reduce((sum, item) => sum + Math.max(item.total - item.paid, 0), 0);
    const emergencyMonths = expenses > 0 ? savingsTotal / expenses : 0;
    const savingsRate = income > 0 ? (balance / income) * 100 : 0;

    return { income, expenses, transfers, debtMonthly, balance, savingsTotal, debtOpen, emergencyMonths, savingsRate };
  }, [monthTransactions, debts, goals]);

  const categorySpend = useMemo(() => {
    const result: Record<string, number> = {};
    monthTransactions.filter((item) => item.type === "expense").forEach((item) => {
      result[item.category] = (result[item.category] || 0) + item.amount;
    });
    return result;
  }, [monthTransactions]);

  const topCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const chartData = useMemo(() => Object.entries(categorySpend).map(([name, value]) => ({ name, value })), [categorySpend]);

  const monthlyCompareData = useMemo(() => {
    const months: string[] = [];
    const base = new Date(`${selectedMonth}-01`);
    for (let i = 5; i >= 0; i--) {
      const date = new Date(base.getFullYear(), base.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7));
    }

    return months.map((month) => {
      const items = transactions.filter((item) => item.date.startsWith(month));
      const income = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
      const expenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
      return { month: monthLabel(month), Einnahmen: income, Ausgaben: expenses, Überschuss: income - expenses };
    });
  }, [transactions, selectedMonth]);

  function accountName(id?: string) {
    if (!id) return "Kein Konto";
    return accounts.find((a) => a.id === id)?.name ?? "Unbekannt";
  }

  function addAccount() {
    const balance = Number(accountForm.balance);
    if (!accountForm.name) return;
    setAccounts((items) => [...items, { id: crypto.randomUUID(), name: accountForm.name, type: accountForm.type, balance: balance || 0 }]);
    setAccountForm({ name: "", type: "bank", balance: "" });
  }

  function addTransaction() {
    const amount = Number(transactionForm.amount);
    if (!transactionForm.title || !transactionForm.category || !amount || amount <= 0) return;

    if (transactionForm.type === "transfer") {
      if (!transactionForm.fromAccountId || !transactionForm.toAccountId || transactionForm.fromAccountId === transactionForm.toAccountId) return;
      setTransactions((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: "transfer",
          title: transactionForm.title,
          category: "Transfer",
          amount,
          date: transactionForm.date,
          fromAccountId: transactionForm.fromAccountId,
          toAccountId: transactionForm.toAccountId,
          note: transactionForm.note,
        },
      ]);
    } else {
      setTransactions((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          type: transactionForm.type,
          title: transactionForm.title,
          category: transactionForm.category,
          amount,
          date: transactionForm.date,
          accountId: transactionForm.accountId || firstAccountId,
          note: transactionForm.note,
        },
      ]);
    }

    setTransactionForm({ type: "expense", title: "", category: "", amount: "", date: today, accountId: firstAccountId, fromAccountId: firstAccountId, toAccountId: "", note: "" });
  }

  function addBudget() {
    const limit = Number(budgetForm.limit);
    if (!budgetForm.category || !limit || limit <= 0) return;
    setBudgets((current) => [...current, { id: crypto.randomUUID(), category: budgetForm.category, limit }]);
    setBudgetForm({ category: "", limit: "" });
  }

  function addGoal() {
    const target = Number(goalForm.target);
    const current = Number(goalForm.current);
    if (!goalForm.title || !target || target <= 0) return;
    setGoals((items) => [...items, { id: crypto.randomUUID(), title: goalForm.title, target, current: current || 0 }]);
    setGoalForm({ title: "", target: "", current: "" });
  }

  function addDebt() {
    const total = Number(debtForm.total);
    const paid = Number(debtForm.paid);
    const monthlyRate = Number(debtForm.monthlyRate);
    if (!debtForm.title || !total || total <= 0) return;
    setDebts((items) => [...items, { id: crypto.randomUUID(), title: debtForm.title, total, paid: paid || 0, monthlyRate: monthlyRate || 0, accountId: debtForm.accountId || firstAccountId }]);
    setDebtForm({ title: "", total: "", paid: "", monthlyRate: "", accountId: firstAccountId });
  }

  function addSubscription() {
    const amount = Number(subscriptionForm.amount);
    const billingDay = Number(subscriptionForm.billingDay);
    if (!subscriptionForm.title || !subscriptionForm.category || !amount || amount <= 0) return;
    setSubscriptions((items) => [...items, { id: crypto.randomUUID(), title: subscriptionForm.title, category: subscriptionForm.category, amount, billingDay: billingDay || 1, accountId: subscriptionForm.accountId || firstAccountId }]);
    setSubscriptionForm({ title: "", amount: "", category: "", billingDay: "", accountId: firstAccountId });
  }

  function addRecurringIncome() {
    const amount = Number(incomeForm.amount);
    const payday = Number(incomeForm.payday);
    if (!incomeForm.title || !incomeForm.category || !amount || amount <= 0) return;
    setRecurringIncomes((items) => [...items, { id: crypto.randomUUID(), title: incomeForm.title, category: incomeForm.category, amount, payday: payday || 25, accountId: incomeForm.accountId || firstAccountId }]);
    setIncomeForm({ title: "", amount: "", category: "Einkommen", payday: "25", accountId: firstAccountId });
  }

  function exportCSV() {
    const rows = [
      "Datum,Typ,Titel,Kategorie,Betrag,Konto,Von Konto,Zu Konto,Notiz",
      ...transactions.map((t) => `${t.date},${t.type},${t.title},${t.category},${t.amount},${accountName(t.accountId)},${accountName(t.fromAccountId)},${accountName(t.toAccountId)},${t.note ?? ""}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "budget-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function resetDemo() {
    if (!confirm("Alle gespeicherten Daten löschen und Demo-Daten laden?")) return;
    localStorage.clear();
    location.reload();
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300 uppercase tracking-[0.25em]">All-in-One Finanzsystem</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight">Budget Control Center</h1>
            <p className="text-slate-400 mt-2 max-w-3xl">Bankkonten, Bargeld, Kreditkarte, Abos, Lohn, Budgets, Sparziele, Schulden, Transfers und Auswertungen.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
              <CalendarDays className="w-5 h-5 text-cyan-300" />
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent outline-none text-white" />
            </div>
            <button onClick={exportCSV} className="btn-secondary"><Download className="w-4 h-4" /> CSV Export</button>
            <button onClick={resetDemo} className="btn-danger"><RotateCcw className="w-4 h-4" /> Reset</button>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard icon={<Landmark />} title="Vermögen" value={formatCHF(totalNetWorth)} sub="über alle Konten" danger={totalNetWorth < 0} />
          <StatCard icon={<TrendingUp />} title="Einnahmen" value={formatCHF(stats.income)} sub="im gewählten Monat" />
          <StatCard icon={<TrendingDown />} title="Ausgaben" value={formatCHF(stats.expenses + stats.debtMonthly)} sub="inkl. Raten" />
          <StatCard icon={<Wallet />} title="Frei verfügbar" value={formatCHF(stats.balance)} sub={`${Math.round(stats.savingsRate)}% Sparquote`} danger={stats.balance < 0} />
          <StatCard icon={<PiggyBank />} title="Gespart" value={formatCHF(stats.savingsTotal)} sub={`${stats.emergencyMonths.toFixed(1)} Monate Reserve`} />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <Panel title="Banken & Konten">
            <Input placeholder="Kontoname z.B. UBS Privatkonto" value={accountForm.name} onChange={(v) => setAccountForm({ ...accountForm, name: v })} />
            <select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value as AccountType })} className="field">
              <option value="bank">Bankkonto</option>
              <option value="cash">Bargeld</option>
              <option value="credit">Kreditkarte</option>
              <option value="savings">Sparkonto</option>
            </select>
            <Input type="number" placeholder="Startsaldo" value={accountForm.balance} onChange={(v) => setAccountForm({ ...accountForm, balance: v })} />
            <button onClick={addAccount} className="btn-primary"><Plus className="w-4 h-4" /> Konto hinzufügen</button>
            <div className="space-y-3 pt-2">
              {accounts.map((a) => (
                <MiniBlock key={a.id} title={a.name} right={formatCHF(accountBalances[a.id] || 0)} onDelete={() => setAccounts((x) => x.filter((i) => i.id !== a.id))}>
                  <p className="text-xs text-slate-400">{a.type === "bank" ? "Bankkonto" : a.type === "cash" ? "Bargeld" : a.type === "credit" ? "Kreditkarte" : "Sparkonto"}</p>
                </MiniBlock>
              ))}
            </div>
          </Panel>

          <Panel title="Neuer Eintrag" className="xl:col-span-1">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setTransactionForm({ ...transactionForm, type: "income" })} className={transactionForm.type === "income" ? "tab-active" : "tab"}>Einnahme</button>
              <button onClick={() => setTransactionForm({ ...transactionForm, type: "expense" })} className={transactionForm.type === "expense" ? "tab-active" : "tab"}>Ausgabe</button>
              <button onClick={() => setTransactionForm({ ...transactionForm, type: "transfer" })} className={transactionForm.type === "transfer" ? "tab-active" : "tab"}>Transfer</button>
            </div>
            <Input placeholder="Titel z.B. Einkauf" value={transactionForm.title} onChange={(v) => setTransactionForm({ ...transactionForm, title: v })} />
            {transactionForm.type !== "transfer" ? (
              <>
                <Input placeholder="Kategorie z.B. Essen" value={transactionForm.category} onChange={(v) => setTransactionForm({ ...transactionForm, category: v })} />
                <AccountSelect value={transactionForm.accountId} accounts={accounts} onChange={(v) => setTransactionForm({ ...transactionForm, accountId: v })} />
              </>
            ) : (
              <>
                <AccountSelect label="Von Konto" value={transactionForm.fromAccountId} accounts={accounts} onChange={(v) => setTransactionForm({ ...transactionForm, fromAccountId: v })} />
                <AccountSelect label="Zu Konto" value={transactionForm.toAccountId} accounts={accounts} onChange={(v) => setTransactionForm({ ...transactionForm, toAccountId: v })} />
              </>
            )}
            <Input type="number" placeholder="Betrag CHF" value={transactionForm.amount} onChange={(v) => setTransactionForm({ ...transactionForm, amount: v })} />
            <Input type="date" value={transactionForm.date} onChange={(v) => setTransactionForm({ ...transactionForm, date: v })} />
            <Input placeholder="Notiz optional" value={transactionForm.note} onChange={(v) => setTransactionForm({ ...transactionForm, note: v })} />
            <button onClick={addTransaction} className="btn-primary"><Plus className="w-4 h-4" /> Eintrag hinzufügen</button>
          </Panel>

          <Panel title="Transaktionen" className="xl:col-span-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3">
              <Search className="w-4 h-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen nach Titel, Kategorie oder Notiz" className="bg-transparent outline-none w-full" />
            </div>
            <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
              {filteredTransactions.map((item) => (
                <Row key={item.id}>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-slate-400">
                      {item.date} · {item.type === "transfer" ? `${accountName(item.fromAccountId)} → ${accountName(item.toAccountId)}` : `${item.category} · ${accountName(item.accountId)}`}
                    </p>
                    {item.note ? <p className="text-xs text-slate-500 mt-1">{item.note}</p> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={item.type === "income" ? "text-emerald-400 font-bold" : item.type === "expense" ? "text-rose-400 font-bold" : "text-cyan-300 font-bold"}>
                      {item.type === "income" ? "+" : item.type === "expense" ? "-" : "↔"}{formatCHF(item.amount)}
                    </p>
                    <button onClick={() => setTransactions((x) => x.filter((t) => t.id !== item.id))} className="icon-btn"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Row>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel title="Monatsvergleich" className="xl:col-span-2">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCompareData}>
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip formatter={(value) => formatCHF(Number(value))} contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }} labelStyle={{ color: "#e2e8f0" }} />
                  <Bar dataKey="Einnahmen" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Ausgaben" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Überschuss" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Ausgaben-Verteilung">
            <div className="h-[320px] w-full">
              {chartData.length === 0 ? <div className="h-full flex items-center justify-center text-slate-500">Keine Ausgaben vorhanden.</div> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                      {chartData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCHF(Number(value))} contentStyle={{ background: "#020617", border: "1px solid #1e293b", borderRadius: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-2">
              {chartData.map((item) => <div key={item.name} className="flex justify-between text-sm text-slate-300"><span>{item.name}</span><span>{formatCHF(item.value)}</span></div>)}
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <Panel title="Kategorie-Budgets">
            <Input placeholder="Kategorie" value={budgetForm.category} onChange={(v) => setBudgetForm({ ...budgetForm, category: v })} />
            <Input type="number" placeholder="Limit CHF" value={budgetForm.limit} onChange={(v) => setBudgetForm({ ...budgetForm, limit: v })} />
            <button onClick={addBudget} className="btn-primary"><Plus className="w-4 h-4" /> Budget</button>
            <div className="space-y-3 pt-2">
              {budgets.map((b) => {
                const used = categorySpend[b.category] || 0;
                const percent = Math.min((used / b.limit) * 100, 100);
                const over = used > b.limit;
                return <MiniBlock key={b.id} title={b.category} right={`${Math.round(percent)}%`} onDelete={() => setBudgets((x) => x.filter((i) => i.id !== b.id))}><div className="bar"><div className={over ? "bar-fill-danger" : "bar-fill"} style={{ width: `${percent}%` }} /></div><p className="text-xs text-slate-400">{formatCHF(used)} von {formatCHF(b.limit)}</p></MiniBlock>;
              })}
            </div>
          </Panel>

          <Panel title="Sparziele">
            <Input placeholder="Ziel z.B. Auto" value={goalForm.title} onChange={(v) => setGoalForm({ ...goalForm, title: v })} />
            <Input type="number" placeholder="Zielbetrag" value={goalForm.target} onChange={(v) => setGoalForm({ ...goalForm, target: v })} />
            <Input type="number" placeholder="Aktuell gespart" value={goalForm.current} onChange={(v) => setGoalForm({ ...goalForm, current: v })} />
            <button onClick={addGoal} className="btn-primary"><Target className="w-4 h-4" /> Sparziel</button>
            <div className="space-y-3 pt-2">
              {goals.map((g) => {
                const percent = Math.min((g.current / g.target) * 100, 100);
                return <MiniBlock key={g.id} title={g.title} right={`${Math.round(percent)}%`} onDelete={() => setGoals((x) => x.filter((i) => i.id !== g.id))}><div className="bar"><div className="bar-fill" style={{ width: `${percent}%` }} /></div><p className="text-xs text-slate-400">{formatCHF(g.current)} von {formatCHF(g.target)}</p></MiniBlock>;
              })}
            </div>
          </Panel>

          <Panel title="Schulden / Raten">
            <Input placeholder="Name" value={debtForm.title} onChange={(v) => setDebtForm({ ...debtForm, title: v })} />
            <Input type="number" placeholder="Gesamtbetrag" value={debtForm.total} onChange={(v) => setDebtForm({ ...debtForm, total: v })} />
            <Input type="number" placeholder="Bereits bezahlt" value={debtForm.paid} onChange={(v) => setDebtForm({ ...debtForm, paid: v })} />
            <Input type="number" placeholder="Monatsrate" value={debtForm.monthlyRate} onChange={(v) => setDebtForm({ ...debtForm, monthlyRate: v })} />
            <AccountSelect value={debtForm.accountId} accounts={accounts} onChange={(v) => setDebtForm({ ...debtForm, accountId: v })} />
            <button onClick={addDebt} className="btn-primary"><CreditCard className="w-4 h-4" /> Schuld</button>
            <div className="space-y-3 pt-2">
              {debts.map((d) => {
                const remaining = Math.max(d.total - d.paid, 0);
                const percent = Math.min((d.paid / d.total) * 100, 100);
                return <MiniBlock key={d.id} title={d.title} right={formatCHF(remaining)} onDelete={() => setDebts((x) => x.filter((i) => i.id !== d.id))}><div className="bar"><div className="bar-fill" style={{ width: `${percent}%` }} /></div><p className="text-xs text-slate-400">Rate: {formatCHF(d.monthlyRate)} / Monat</p></MiniBlock>;
              })}
            </div>
          </Panel>

          <Panel title="Abos / Fixkosten">
            <Input placeholder="Abo z.B. Spotify" value={subscriptionForm.title} onChange={(v) => setSubscriptionForm({ ...subscriptionForm, title: v })} />
            <Input type="number" placeholder="Betrag" value={subscriptionForm.amount} onChange={(v) => setSubscriptionForm({ ...subscriptionForm, amount: v })} />
            <Input placeholder="Kategorie" value={subscriptionForm.category} onChange={(v) => setSubscriptionForm({ ...subscriptionForm, category: v })} />
            <Input type="number" placeholder="Tag im Monat" value={subscriptionForm.billingDay} onChange={(v) => setSubscriptionForm({ ...subscriptionForm, billingDay: v })} />
            <AccountSelect value={subscriptionForm.accountId} accounts={accounts} onChange={(v) => setSubscriptionForm({ ...subscriptionForm, accountId: v })} />
            <button onClick={addSubscription} className="btn-primary"><Repeat className="w-4 h-4" /> Abo</button>
            <div className="space-y-3 pt-2">
              {subscriptions.map((s) => <MiniBlock key={s.id} title={s.title} right={formatCHF(s.amount)} onDelete={() => setSubscriptions((x) => x.filter((i) => i.id !== s.id))}><p className="text-xs text-slate-400">{s.category} · {accountName(s.accountId)} · jeden Monat am {s.billingDay}.</p></MiniBlock>)}
            </div>
          </Panel>

          <Panel title="Wiederkehrende Einnahmen">
            <Input placeholder="Name z.B. Lohn" value={incomeForm.title} onChange={(v) => setIncomeForm({ ...incomeForm, title: v })} />
            <Input type="number" placeholder="Betrag" value={incomeForm.amount} onChange={(v) => setIncomeForm({ ...incomeForm, amount: v })} />
            <Input placeholder="Kategorie" value={incomeForm.category} onChange={(v) => setIncomeForm({ ...incomeForm, category: v })} />
            <Input type="number" placeholder="Tag im Monat" value={incomeForm.payday} onChange={(v) => setIncomeForm({ ...incomeForm, payday: v })} />
            <AccountSelect value={incomeForm.accountId} accounts={accounts} onChange={(v) => setIncomeForm({ ...incomeForm, accountId: v })} />
            <button onClick={addRecurringIncome} className="btn-primary"><Banknote className="w-4 h-4" /> Einnahme</button>
            <div className="space-y-3 pt-2">
              {recurringIncomes.map((i) => <MiniBlock key={i.id} title={i.title} right={formatCHF(i.amount)} onDelete={() => setRecurringIncomes((x) => x.filter((item) => item.id !== i.id))}><p className="text-xs text-slate-400">{i.category} · {accountName(i.accountId)} · jeden Monat am {i.payday}.</p></MiniBlock>)}
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel title="Top Ausgaben-Kategorien" className="xl:col-span-2">
            <div className="space-y-3">
              {topCategories.length === 0 ? <p className="text-slate-400">Noch keine Ausgaben vorhanden.</p> : null}
              {topCategories.map(([category, amount]) => {
                const max = topCategories[0]?.[1] || 1;
                const percent = (amount / max) * 100;
                return <div key={category}><div className="flex justify-between text-sm mb-1"><span>{category}</span><span>{formatCHF(amount)}</span></div><div className="bar"><div className="bar-fill" style={{ width: `${percent}%` }} /></div></div>;
              })}
            </div>
          </Panel>

          <Panel title="Finanz-Check">
            <Advice danger={stats.balance < 0} text={stats.balance < 0 ? "Du bist für diesen Monat im Minus. Reduziere variable Ausgaben oder verschiebe nicht wichtige Käufe." : "Monat aktuell positiv. Überschuss direkt auf Sparziel oder Schuldenabbau verteilen."} />
            <Advice danger={stats.emergencyMonths < 3} text={stats.emergencyMonths < 3 ? "Notgroschen ist noch schwach. Ziel: mindestens 3 Monatsausgaben Reserve." : "Reserve sieht solide aus."} />
            <Advice danger={stats.debtOpen > 0} text={stats.debtOpen > 0 ? `Offene Schulden: ${formatCHF(stats.debtOpen)}. Priorität auf hohe Zinsen legen.` : "Keine offenen Schulden erfasst."} />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function StatCard({ icon, title, value, sub, danger = false }: { icon: React.ReactNode; title: string; value: string; sub: string; danger?: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between text-slate-400 mb-4"><span>{title}</span><div className={danger ? "text-rose-400" : "text-cyan-300"}>{icon}</div></div>
      <p className={danger ? "text-3xl font-black text-rose-400" : "text-3xl font-black"}>{value}</p>
      <p className="text-sm text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl shadow-black/20 ${className}`}><h2 className="text-xl font-black tracking-tight">{title}</h2>{children}</section>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="field" />;
}

function AccountSelect({ value, onChange, accounts, label = "Konto" }: { value: string; onChange: (value: string) => void; accounts: Account[]; label?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="field" aria-label={label}>
      <option value="">{label} wählen</option>
      {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
    </select>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-4">{children}</div>;
}

function MiniBlock({ title, right, children, onDelete }: { title: string; right: string; children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between gap-3"><p className="font-bold">{title}</p><div className="flex items-center gap-2"><span className="text-sm text-slate-400">{right}</span><button onClick={onDelete} className="icon-btn"><Trash2 className="w-4 h-4" /></button></div></div>
      {children}
    </div>
  );
}

function Advice({ text, danger }: { text: string; danger?: boolean }) {
  return <div className={danger ? "bg-rose-950/40 border border-rose-900 rounded-2xl p-4" : "bg-emerald-950/30 border border-emerald-900 rounded-2xl p-4"}><div className="flex gap-3"><AlertTriangle className={danger ? "w-5 h-5 text-rose-400 shrink-0" : "w-5 h-5 text-emerald-400 shrink-0"} /><p className="text-sm text-slate-200">{text}</p></div></div>;
}
