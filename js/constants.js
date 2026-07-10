// 第12章 12.13 定数モジュール（マスタ値）
export const TAX_TYPES = [
  { code: "separate", name: "源泉分離課税" },
  { code: "income", name: "一時所得に掛かる税金概算" },
];

// 第10章 10.15 源泉分離課税
export const SEPARATE_TAX_RATE = 0.20315;

// 第10章 10.14 復興特別所得税率（共通定数）
export const REVIVAL_TAX_RATE = 0.00315;

// 第10章 10.16 特別控除額（最高50万円）
export const SPECIAL_DEDUCTION_MAX = 500000;

// 第10章 10.17 所得税速算表
export const INCOME_TAX_BRACKETS = [
  { limit: 1949000, rate: 0.05, deduction: 0 },
  { limit: 3299000, rate: 0.10, deduction: 97500 },
  { limit: 6949000, rate: 0.20, deduction: 427500 },
  { limit: 8999000, rate: 0.23, deduction: 636000 },
  { limit: 17999000, rate: 0.33, deduction: 1536000 },
  { limit: 39999000, rate: 0.40, deduction: 2796000 },
  { limit: Infinity, rate: 0.45, deduction: 4796000 },
];

// 第7章 入力項目設計：入力範囲・初期値
export const INPUT_LIMITS = {
  initialAmount: { min: 0, max: 999999999, default: 0 },
  monthlyAmount: { min: 0, max: 999999999, default: 30000 },
  annualRate: { min: 0, max: 100, default: 5.0 },
  maturityAge: { min: 1, max: 120, default: 65 },
  investmentYearsInput: { min: 1, max: 100, default: 20 },
  birthDateMaxAgeYears: 120,
};
