// 第9章 データ設計 / 第6章 画面設計 を踏まえた画面制御モジュール
import { INPUT_LIMITS, TAX_TYPES } from "./constants.js";
import {
  calcInvestmentMonthsFromBirthDate,
  calcInvestmentMonthsFromYears,
  formatInvestmentMonths,
} from "./period.js";
import { validate, ERROR_MESSAGES } from "./validation.js";
import { runSimulation } from "./simulation.js";
import { renderAssetChart } from "./graph.js";

// ---- 要素参照 ----
const el = {
  form: document.getElementById("simulationForm"),
  initialAmount: document.getElementById("initialAmount"),
  monthlyAmount: document.getElementById("monthlyAmount"),
  annualRate: document.getElementById("annualRate"),
  periodInputModeToggle: document.getElementById("periodInputModeToggle"),
  modeBirthDateFields: document.getElementById("modeBirthDateFields"),
  modeYearsFields: document.getElementById("modeYearsFields"),
  birthDate: document.getElementById("birthDate"),
  maturityAge: document.getElementById("maturityAge"),
  investmentYearsInput: document.getElementById("investmentYearsInput"),
  startYearMonth: document.getElementById("startYearMonth"),
  interestType: document.getElementById("interestType"),
  investmentPeriodDisplay: document.getElementById("investmentPeriodDisplay"),
  resetButton: document.getElementById("resetButton"),
  resultSection: document.getElementById("resultSection"),
  taxSection: document.getElementById("taxSection"),
  graphSection: document.getElementById("graphSection"),
  yearlySection: document.getElementById("yearlySection"),
  disclaimerSection: document.getElementById("disclaimerSection"),
  taxTypeToggle: document.getElementById("taxTypeToggle"),
  taxSingleView: document.getElementById("taxSingleView"),
  taxCompareView: document.getElementById("taxCompareView"),
  resultBalance: document.getElementById("resultBalance"),
  resultPrincipal: document.getElementById("resultPrincipal"),
  resultProfit: document.getElementById("resultProfit"),
  resultProfitRate: document.getElementById("resultProfitRate"),
  resultTax: document.getElementById("resultTax"),
  resultAfterTax: document.getElementById("resultAfterTax"),
  compareTaxSeparate: document.getElementById("compareTaxSeparate"),
  compareTaxIncome: document.getElementById("compareTaxIncome"),
  compareTaxDiff: document.getElementById("compareTaxDiff"),
  compareAfterTaxSeparate: document.getElementById("compareAfterTaxSeparate"),
  compareAfterTaxIncome: document.getElementById("compareAfterTaxIncome"),
  yearlyTableBody: document.querySelector("#yearlyTable tbody"),
  assetChart: document.getElementById("assetChart"),
};

// ---- ユーティリティ ----
// 生年月日（YYYYMMDD、8桁数字）との比較に使うため同じ形式で返す
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function currentYearMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toNumber(rawValue) {
  if (rawValue === "" || rawValue === null || rawValue === undefined) return null;
  const cleaned = String(rawValue).replace(/,/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isNaN(n) ? NaN : n;
}

function formatCurrency(value) {
  return `${Math.round(value).toLocaleString()}円`;
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

// ---- 第9章 9.4 入力状態（InputState）の初期値 ----
function defaultInputState() {
  return {
    initialAmount: INPUT_LIMITS.initialAmount.default,
    monthlyAmount: INPUT_LIMITS.monthlyAmount.default,
    annualRate: INPUT_LIMITS.annualRate.default,
    periodInputMode: "birthDate",
    birthDate: "",
    maturityAge: INPUT_LIMITS.maturityAge.default,
    investmentYearsInput: INPUT_LIMITS.investmentYearsInput.default,
    startYearMonth: currentYearMonthStr(),
    interestType: "simple",
  };
}

// ---- アプリ状態 ----
let inputState = defaultInputState();
let derivedState = { maturityYearMonth: null, investmentMonths: null };
let simulationResult = null; // 第9章 9.5 SimulationResult
// 第9章 9.6 DisplayState
// selectedTaxType: "separate"|"income"|"compare"（比較モード、Ver.1.9追加）
// lastConcreteTaxType: グラフ・年次一覧は特定1税方式を前提とするため、
//   compareモード中も直前に選択されていた実税方式（separate/income）を保持し、そちらを使用する
let displayState = { selectedTaxType: "separate", lastConcreteTaxType: "separate" };
let lastRunStartYearMonth = null; // 直近のシミュレーション実行時点の積立開始年月（グラフの暦年ラベル算出用）

// ---- InputStateをDOMへ反映 ----
function renderInputStateToDom() {
  el.initialAmount.value = inputState.initialAmount.toLocaleString();
  el.monthlyAmount.value = inputState.monthlyAmount.toLocaleString();
  el.annualRate.value = inputState.annualRate;
  el.birthDate.value = inputState.birthDate;
  el.maturityAge.value = inputState.maturityAge;
  el.investmentYearsInput.value = inputState.investmentYearsInput;
  el.startYearMonth.value = inputState.startYearMonth;
  el.interestType.value = inputState.interestType;

  updateModeToggleUI();
}

// ---- DOMからInputStateを読み取る ----
function readInputStateFromDom() {
  // 第7章 7.3.1・7.3.2：空欄の場合は自動的に0を設定する
  inputState.initialAmount = toNumber(el.initialAmount.value) ?? 0;
  inputState.monthlyAmount = toNumber(el.monthlyAmount.value) ?? 0;
  inputState.annualRate = toNumber(el.annualRate.value);
  inputState.birthDate = el.birthDate.value;
  inputState.maturityAge = toNumber(el.maturityAge.value);
  inputState.investmentYearsInput = toNumber(el.investmentYearsInput.value);
  inputState.startYearMonth = el.startYearMonth.value;
  inputState.interestType = el.interestType.value;
}

// ---- 第6章 6.4.7 運用期間入力モード切替コントロール ----
function updateModeToggleUI() {
  const buttons = el.periodInputModeToggle.querySelectorAll(".toggle-btn");
  buttons.forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.mode === inputState.periodInputMode);
  });
  el.modeBirthDateFields.hidden = inputState.periodInputMode !== "birthDate";
  el.modeYearsFields.hidden = inputState.periodInputMode !== "years";
}

el.periodInputModeToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  inputState.periodInputMode = btn.dataset.mode;
  updateModeToggleUI();
  updateDerivedState();
});

// ---- 第10章 10.5 / 第9章 9.4.4 自動算出項目（DerivedState） ----
function updateDerivedState() {
  if (inputState.periodInputMode === "birthDate") {
    if (inputState.birthDate && inputState.maturityAge && inputState.startYearMonth) {
      const result = calcInvestmentMonthsFromBirthDate(
        inputState.birthDate,
        inputState.maturityAge,
        inputState.startYearMonth
      );
      derivedState = result;
    } else {
      derivedState = { maturityYearMonth: null, investmentMonths: null };
    }
  } else {
    if (inputState.investmentYearsInput) {
      derivedState = calcInvestmentMonthsFromYears(inputState.investmentYearsInput);
    } else {
      derivedState = { maturityYearMonth: null, investmentMonths: null };
    }
  }
  el.investmentPeriodDisplay.textContent = formatInvestmentMonths(derivedState.investmentMonths);
}

// 第7章 7.3.5：生年月日は数字以外を自動除去し最大8桁に制限する
el.birthDate.addEventListener("input", () => {
  el.birthDate.value = el.birthDate.value.replace(/\D/g, "").slice(0, 8);
});

[el.birthDate, el.maturityAge, el.startYearMonth, el.investmentYearsInput].forEach((input) => {
  input.addEventListener("input", () => {
    readInputStateFromDom();
    updateDerivedState();
  });
});

// 第7章 7.5 数値入力：3桁区切り表示（カンマ自動整形）、空欄の場合は自動的に0を設定する
[el.initialAmount, el.monthlyAmount].forEach((input) => {
  input.addEventListener("blur", () => {
    const n = toNumber(input.value) ?? 0;
    if (!Number.isNaN(n)) {
      input.value = n.toLocaleString();
    }
  });
});

// ---- 第8章 バリデーションエラー表示 ----
function clearErrors() {
  document.querySelectorAll(".error-message").forEach((p) => (p.textContent = ""));
  document.querySelectorAll(".has-error").forEach((elm) => elm.classList.remove("has-error"));
}

function renderErrors(errors) {
  clearErrors();
  let firstErrorField = null;
  Object.keys(errors).forEach((fieldId) => {
    const msgEl = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (msgEl) {
      msgEl.textContent = errors[fieldId].message;
    }
    const inputEl = document.getElementById(fieldId);
    if (inputEl) {
      inputEl.classList.add("has-error");
      if (!firstErrorField) firstErrorField = inputEl;
    }
  });
  if (firstErrorField) {
    firstErrorField.focus();
  }
}

// ---- シミュレーション実行 ----
el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  readInputStateFromDom();
  updateDerivedState();

  const errors = validate(inputState, todayStr());
  if (Object.keys(errors).length > 0) {
    renderErrors(errors);
    return;
  }
  clearErrors();

  const result = runSimulation({
    initialAmount: inputState.initialAmount,
    monthlyAmount: inputState.monthlyAmount,
    annualRate: inputState.annualRate / 100,
    investmentMonths: derivedState.investmentMonths,
    interestType: inputState.interestType,
  });

  if (result.error) {
    alert(ERROR_MESSAGES[result.error.code] || result.error.message);
    return;
  }

  simulationResult = result;
  lastRunStartYearMonth = inputState.startYearMonth;

  // 第6章 6.4.6.1：運用方法に応じて税方式トグルの初期選択を自動決定する
  const autoTaxType = inputState.interestType === "compound" ? "income" : "separate";
  displayState.selectedTaxType = autoTaxType;
  displayState.lastConcreteTaxType = autoTaxType;
  updateTaxTypeToggleUI();

  renderResult();
});

// ---- 第6章 6.4.6 税方式切替コントロール ----
function updateTaxTypeToggleUI() {
  const buttons = el.taxTypeToggle.querySelectorAll(".toggle-btn");
  buttons.forEach((b) => b.classList.toggle("is-active", b.dataset.taxType === displayState.selectedTaxType));
}

el.taxTypeToggle.addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle-btn");
  if (!btn) return;
  displayState.selectedTaxType = btn.dataset.taxType;
  if (displayState.selectedTaxType !== "compare") {
    displayState.lastConcreteTaxType = displayState.selectedTaxType;
  }
  updateTaxTypeToggleUI();
  if (simulationResult) {
    renderTaxSection();
    renderYearlyTable(simulationResult.yearlyData);
    renderAssetChart(el.assetChart, simulationResult.yearlyData, lastRunStartYearMonth, displayState.lastConcreteTaxType);
  }
});

function renderTaxSection() {
  if (displayState.selectedTaxType === "compare") {
    renderTaxCompareView();
    return;
  }
  el.taxSingleView.hidden = false;
  el.taxCompareView.hidden = true;

  const entry = simulationResult.taxComparison.find(
    (t) => t.taxType === displayState.selectedTaxType
  );
  el.resultTax.textContent = formatCurrency(entry.tax);
  el.resultAfterTax.textContent = formatCurrency(entry.afterTaxProfit);
}

// 第6章 6.4.6.2：税方式「比較」表示
// 差額は税額・手取り利益で絶対値が同一のため、税額行にのみ符号なしで表示する
function renderTaxCompareView() {
  el.taxSingleView.hidden = true;
  el.taxCompareView.hidden = false;

  const sep = simulationResult.taxComparison.find((t) => t.taxType === "separate");
  const inc = simulationResult.taxComparison.find((t) => t.taxType === "income");

  el.compareTaxSeparate.textContent = formatCurrency(sep.tax);
  el.compareTaxIncome.textContent = formatCurrency(inc.tax);
  el.compareTaxDiff.textContent = formatCurrency(Math.abs(sep.tax - inc.tax));

  el.compareAfterTaxSeparate.textContent = formatCurrency(sep.afterTaxProfit);
  el.compareAfterTaxIncome.textContent = formatCurrency(inc.afterTaxProfit);
}

// ---- 結果表示（第6章 6.4.5、第11章 グラフ設計） ----
function renderResult() {
  const { summary, yearlyData } = simulationResult;

  el.resultBalance.textContent = formatCurrency(summary.balance);
  el.resultPrincipal.textContent = formatCurrency(summary.principal);
  el.resultProfit.textContent = formatCurrency(summary.profit);
  const profitRate = summary.principal > 0 ? (summary.profit / summary.principal) * 100 : 0;
  el.resultProfitRate.textContent = formatPercent(profitRate);

  el.resultSection.hidden = false;
  el.taxSection.hidden = false;
  el.graphSection.hidden = false;
  el.yearlySection.hidden = false;
  el.disclaimerSection.hidden = false;

  renderTaxSection();
  renderAssetChart(el.assetChart, yearlyData, lastRunStartYearMonth, displayState.lastConcreteTaxType);
  renderYearlyTable(yearlyData);

  scrollToResult();
}

// 第6章 6.4.13：シミュレーション結果ブロック先頭へオートスクロール
// スマートフォンでは直前のフォーカス（仮想キーボード表示中）が残ったままだと
// キーボードが閉じる際のビューポート変化にスクロール位置がずれるため、
// フォーカスを外してレイアウトが確定してから（2フレーム後）スクロールする。
function scrollToResult() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderYearlyTable(yearlyData) {
  el.yearlyTableBody.innerHTML = "";
  const taxType = displayState.lastConcreteTaxType;
  yearlyData.forEach((row) => {
    const tax = taxType === "separate" ? row.taxSeparate : row.taxIncome;
    const afterTax = taxType === "separate" ? row.afterTaxSeparate : row.afterTaxIncome;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.year}年目</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.balance)}</td>
      <td>${formatCurrency(row.profit)}</td>
      <td>${formatCurrency(tax)}</td>
      <td>${formatCurrency(afterTax)}</td>
    `;
    el.yearlyTableBody.appendChild(tr);
  });
}

// ---- リセット（第6章 6.4.4、第9章 各State初期化） ----
el.resetButton.addEventListener("click", () => {
  inputState = defaultInputState();
  derivedState = { maturityYearMonth: null, investmentMonths: null };
  simulationResult = null;
  displayState = { selectedTaxType: "separate", lastConcreteTaxType: "separate" };
  lastRunStartYearMonth = null;

  renderInputStateToDom();
  updateDerivedState();
  clearErrors();

  el.resultSection.hidden = true;
  el.taxSection.hidden = true;
  el.graphSection.hidden = true;
  el.yearlySection.hidden = true;
  el.disclaimerSection.hidden = true;
  el.taxSingleView.hidden = false;
  el.taxCompareView.hidden = true;

  updateTaxTypeToggleUI();
});

// ---- 初期表示 ----
renderInputStateToDom();
updateDerivedState();
