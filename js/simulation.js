// 第10章 計算ロジック設計 / 第12章 処理インターフェース設計
import {
  SEPARATE_TAX_RATE,
  REVIVAL_TAX_RATE,
  INCOME_RESIDENT_TAX_RATE,
  SPECIAL_DEDUCTION_MAX,
  INCOME_TAX_BRACKETS,
} from "./constants.js";

// 10.6 実効月利の計算
function calcMonthlyRate(annualRate) {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

// 10.15 源泉分離課税
function calcTaxSeparate(profit) {
  if (profit <= 0) {
    return { tax: 0, afterTax: profit };
  }
  const tax = Math.floor(profit * SEPARATE_TAX_RATE);
  return { tax, afterTax: profit - tax };
}

// 10.17 所得税速算表の適用
function calcIncomeTaxAmount(taxableAmount) {
  const bracket = INCOME_TAX_BRACKETS.find((b) => taxableAmount <= b.limit);
  const raw = taxableAmount * bracket.rate - bracket.deduction;
  return Math.max(0, Math.floor(raw));
}

// 10.16〜10.17 所得税方式（一時所得としての単純計算）
function calcTaxIncome(profit) {
  if (profit <= 0) {
    return { tax: 0, afterTax: profit };
  }
  // ① 一時所得の金額
  const specialDeduction = Math.min(SPECIAL_DEDUCTION_MAX, profit);
  const occasionalIncome = profit - specialDeduction;

  // ② 課税対象額
  const taxableAmount = Math.floor(occasionalIncome / 2);

  // ③ 税額計算
  const incomeTax = calcIncomeTaxAmount(taxableAmount);
  const revivalTax = Math.floor(taxableAmount * REVIVAL_TAX_RATE);
  const residentTax = Math.floor(taxableAmount * INCOME_RESIDENT_TAX_RATE);
  const tax = incomeTax + revivalTax + residentTax;

  return { tax, afterTax: profit - tax };
}

function makeError(code, message) {
  return { error: { code, message } };
}

// 第12章 12.4 シミュレーション実行関数
export function runSimulation(input) {
  const { initialAmount, monthlyAmount, annualRate, investmentMonths } = input;

  // 12.12 入力値エラー処理
  if (initialAmount == null || isNaN(initialAmount) || initialAmount < 0) {
    return makeError("INVALID_PARAMETER", "初期投資額が不正です。");
  }
  if (monthlyAmount == null || isNaN(monthlyAmount) || monthlyAmount < 0) {
    return makeError("INVALID_PARAMETER", "積立額が不正です。");
  }
  if (annualRate == null || isNaN(annualRate)) {
    return makeError("INVALID_PARAMETER", "利回りが未入力です。");
  }
  if (investmentMonths == null || isNaN(investmentMonths) || investmentMonths < 1) {
    return makeError("INVALID_PARAMETER", "運用期間が1ヶ月未満です。");
  }

  const monthlyRate = calcMonthlyRate(annualRate);

  let balance = initialAmount;
  let principal = initialAmount;

  const monthlyData = [];
  const yearlyData = [];

  for (let month = 1; month <= investmentMonths; month++) {
    // 10.8 積立処理順序：積立 → 利息計算 → 評価額更新
    principal += monthlyAmount;
    balance += monthlyAmount;

    const interest = Math.floor(balance * monthlyRate);
    balance += interest;

    const profit = balance - principal;

    if (!isFinite(balance) || isNaN(balance)) {
      return makeError("CALCULATION_ERROR", "計算処理中にエラーが発生しました。");
    }

    const sep = calcTaxSeparate(profit);
    const inc = calcTaxIncome(profit);

    monthlyData.push({
      month,
      principal,
      balance,
      profit,
      taxSeparate: sep.tax,
      afterTaxSeparate: sep.afterTax,
      taxIncome: inc.tax,
      afterTaxIncome: inc.afterTax,
    });

    // 10.19 年次データ生成：12か月ごと、および端数月がある場合は最終月
    if (month % 12 === 0 || month === investmentMonths) {
      yearlyData.push({
        year: Math.ceil(month / 12),
        principal,
        balance,
        profit,
        taxSeparate: sep.tax,
        afterTaxSeparate: sep.afterTax,
        taxIncome: inc.tax,
        afterTaxIncome: inc.afterTax,
      });
    }
  }

  const last = monthlyData[monthlyData.length - 1];

  // 10.26 計算結果の整合性チェック
  if (last.balance < 0 || last.principal < 0) {
    return makeError("CALCULATION_ERROR", "計算結果が不正です。");
  }

  return {
    summary: {
      principal: last.principal,
      balance: last.balance,
      profit: last.profit,
    },
    monthlyData,
    yearlyData,
    taxComparison: [
      { taxType: "separate", tax: last.taxSeparate, afterTaxProfit: last.afterTaxSeparate },
      { taxType: "income", tax: last.taxIncome, afterTaxProfit: last.afterTaxIncome },
    ],
  };
}
