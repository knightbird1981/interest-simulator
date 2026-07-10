// 第8章 バリデーション設計
import { INPUT_LIMITS } from "./constants.js";
import { calcAgeAtYearMonth, calcAgeAtDate } from "./period.js";

export const ERROR_MESSAGES = {
  "VAL-001": "初期資産を入力してください。",
  "VAL-002": "初期資産は数値で入力してください。",
  "VAL-003": "初期資産は0円以上を入力してください。",
  "VAL-004": "初期資産が上限を超えています。",
  "VAL-005": "毎月積立額を入力してください。",
  "VAL-006": "毎月積立額は数値で入力してください。",
  "VAL-007": "毎月積立額は0円以上を入力してください。",
  "VAL-008": "毎月積立額が上限を超えています。",
  "VAL-009": "想定年利を入力してください。",
  "VAL-010": "想定年利は数値で入力してください。",
  "VAL-011": "想定年利は0〜100%で入力してください。",
  "VAL-012": "運用期間の入力方法を選択してください。",
  "VAL-013": "生年月日を入力してください。",
  "VAL-014": "生年月日には未来の日付や現実的でない日付は入力できません。",
  "VAL-015": "満期年齢を入力してください。",
  "VAL-016": "満期年齢は数値で入力してください。",
  "VAL-017": "満期年齢は1〜120歳で入力してください。",
  "VAL-018": "運用期間を入力してください。",
  "VAL-019": "運用期間は数値で入力してください。",
  "VAL-020": "運用期間は1〜100年で入力してください。",
  "VAL-021": "積立開始年月を入力してください。",
  "VAL-022": "積立頻度を選択してください。",
  "VAL-023": "運用方法を選択してください。",
  "VAL-024": "満期年齢は、積立開始年月時点の年齢より大きい値を入力してください。",
};

function err(code) {
  return { code, message: ERROR_MESSAGES[code] };
}

function isEmpty(value) {
  return value === null || value === undefined || value === "" || (typeof value === "string" && value.trim() === "");
}

function isInteger(value) {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

// 第8章 8.2 バリデーション一覧 / 8.3 共通バリデーション
export function validate(inputState, todayStr) {
  const errors = {};

  // initialAmount VAL-001〜004
  if (isEmpty(inputState.initialAmount)) {
    errors.initialAmount = err("VAL-001");
  } else if (!isInteger(inputState.initialAmount)) {
    errors.initialAmount = err("VAL-002");
  } else if (inputState.initialAmount < INPUT_LIMITS.initialAmount.min) {
    errors.initialAmount = err("VAL-003");
  } else if (inputState.initialAmount > INPUT_LIMITS.initialAmount.max) {
    errors.initialAmount = err("VAL-004");
  }

  // monthlyAmount VAL-005〜008
  if (isEmpty(inputState.monthlyAmount)) {
    errors.monthlyAmount = err("VAL-005");
  } else if (!isInteger(inputState.monthlyAmount)) {
    errors.monthlyAmount = err("VAL-006");
  } else if (inputState.monthlyAmount < INPUT_LIMITS.monthlyAmount.min) {
    errors.monthlyAmount = err("VAL-007");
  } else if (inputState.monthlyAmount > INPUT_LIMITS.monthlyAmount.max) {
    errors.monthlyAmount = err("VAL-008");
  }

  // annualRate VAL-009〜011
  if (isEmpty(inputState.annualRate)) {
    errors.annualRate = err("VAL-009");
  } else if (!isNumber(inputState.annualRate)) {
    errors.annualRate = err("VAL-010");
  } else if (
    inputState.annualRate < INPUT_LIMITS.annualRate.min ||
    inputState.annualRate > INPUT_LIMITS.annualRate.max
  ) {
    errors.annualRate = err("VAL-011");
  }

  // periodInputMode VAL-012
  if (inputState.periodInputMode !== "birthDate" && inputState.periodInputMode !== "years") {
    errors.periodInputMode = err("VAL-012");
  }

  // 8.3.8 モードによる表示・必須制御
  if (inputState.periodInputMode === "birthDate") {
    // birthDate VAL-013〜014
    if (isEmpty(inputState.birthDate)) {
      errors.birthDate = err("VAL-013");
    } else if (inputState.birthDate > todayStr) {
      errors.birthDate = err("VAL-014");
    } else if (calcAgeAtDate(inputState.birthDate, todayStr) > INPUT_LIMITS.birthDateMaxAgeYears) {
      errors.birthDate = err("VAL-014");
    }

    // maturityAge VAL-015〜017
    if (isEmpty(inputState.maturityAge)) {
      errors.maturityAge = err("VAL-015");
    } else if (!isInteger(inputState.maturityAge)) {
      errors.maturityAge = err("VAL-016");
    } else if (
      inputState.maturityAge < INPUT_LIMITS.maturityAge.min ||
      inputState.maturityAge > INPUT_LIMITS.maturityAge.max
    ) {
      errors.maturityAge = err("VAL-017");
    }

    // 8.3.7 クロスフィールドチェック（残月数）VAL-024
    if (
      !errors.birthDate &&
      !errors.maturityAge &&
      !isEmpty(inputState.startYearMonth)
    ) {
      const ageAtStart = calcAgeAtYearMonth(inputState.birthDate, inputState.startYearMonth);
      if (inputState.maturityAge <= ageAtStart) {
        errors.maturityAge = err("VAL-024");
      }
    }
  } else if (inputState.periodInputMode === "years") {
    // investmentYearsInput VAL-018〜020
    if (isEmpty(inputState.investmentYearsInput)) {
      errors.investmentYearsInput = err("VAL-018");
    } else if (!isInteger(inputState.investmentYearsInput)) {
      errors.investmentYearsInput = err("VAL-019");
    } else if (
      inputState.investmentYearsInput < INPUT_LIMITS.investmentYearsInput.min ||
      inputState.investmentYearsInput > INPUT_LIMITS.investmentYearsInput.max
    ) {
      errors.investmentYearsInput = err("VAL-020");
    }
  }

  // startYearMonth VAL-021（両モード共通）
  if (isEmpty(inputState.startYearMonth)) {
    errors.startYearMonth = err("VAL-021");
  }

  // contributionFrequency VAL-022
  if (isEmpty(inputState.contributionFrequency)) {
    errors.contributionFrequency = err("VAL-022");
  }

  // interestType VAL-023
  if (isEmpty(inputState.interestType)) {
    errors.interestType = err("VAL-023");
  }

  return errors;
}
