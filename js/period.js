// 第10章 10.5 満期年月・運用期間（投資月数）の算出

function parseYearMonth(yearMonthStr) {
  const [year, month] = yearMonthStr.split("-").map(Number);
  return { year, month };
}

// 第7章 7.3.5：生年月日はYYYYMMDD（8桁数字、区切り文字なし）で保持する
function parseDate(dateStr) {
  const year = Number(dateStr.slice(0, 4));
  const month = Number(dateStr.slice(4, 6));
  const day = Number(dateStr.slice(6, 8));
  return { year, month, day };
}

function formatYearMonth(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

// 10.5.2 モード①：満期年月の算出
export function calcMaturityYearMonth(birthDate, maturityAge) {
  const birth = parseDate(birthDate);
  return { year: birth.year + maturityAge, month: birth.month };
}

// 10.5.3 モード①：運用期間（投資月数）の算出
export function calcInvestmentMonthsFromBirthDate(birthDate, maturityAge, startYearMonth) {
  const maturity = calcMaturityYearMonth(birthDate, maturityAge);
  const start = parseYearMonth(startYearMonth);
  const investmentMonths =
    (maturity.year - start.year) * 12 + (maturity.month - start.month);
  return {
    maturityYearMonth: formatYearMonth(maturity.year, maturity.month),
    investmentMonths,
  };
}

// 10.5.5 モード②：運用期間（投資月数）の算出
export function calcInvestmentMonthsFromYears(investmentYearsInput) {
  return {
    maturityYearMonth: null,
    investmentMonths: investmentYearsInput * 12,
  };
}

// 10.5.8 共通：画面表示用の年数・月数変換
export function formatInvestmentMonths(investmentMonths) {
  if (investmentMonths == null || investmentMonths < 1) {
    return "−";
  }
  const years = Math.floor(investmentMonths / 12);
  const months = investmentMonths % 12;
  return `${years}年${months}ヶ月`;
}

// 8.3.6 / 8.3.7 バリデーションで使用する年齢算出（年月精度）
export function calcAgeAtYearMonth(birthDate, yearMonthStr) {
  const birth = parseDate(birthDate);
  const target = parseYearMonth(yearMonthStr);
  let age = target.year - birth.year;
  if (target.month < birth.month) {
    age -= 1;
  }
  return age;
}

// 8.3.6 生年月日の妥当性チェックで使用する年齢算出（日付精度、システム日付基準）
export function calcAgeAtDate(birthDate, targetDateStr) {
  const birth = parseDate(birthDate);
  const target = parseDate(targetDateStr);
  let age = target.year - birth.year;
  const monthDiff = target.month - birth.month;
  if (monthDiff < 0 || (monthDiff === 0 && target.day < birth.day)) {
    age -= 1;
  }
  return age;
}
