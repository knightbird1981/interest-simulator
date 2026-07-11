// 第11章 グラフ設計：資産推移グラフ（GRP-001、積み上げ棒グラフ）
import { TAX_TYPES } from "./constants.js";

let chartInstance = null;

function taxTypeName(taxType) {
  const found = TAX_TYPES.find((t) => t.code === taxType);
  return found ? found.name : taxType;
}

// 11.4.3 X軸：積立開始年月からyearlyData[].year分経過した暦年ラベル
function calcCalendarYearLabels(yearlyData, startYearMonth) {
  const [startYear] = startYearMonth.split("-").map(Number);
  return yearlyData.map((d) => `${startYear + d.year - 1}年`);
}

// 11.4.4 系列（データセット）：元本(+)、手取り利益(+)、税額(+)。すべてプラス方向に積み上げる（Ver.1.9）
export function renderAssetChart(canvasEl, yearlyData, startYearMonth, selectedTaxType) {
  const labels = calcCalendarYearLabels(yearlyData, startYearMonth);
  const principalSeries = yearlyData.map((d) => d.principal);
  const taxSeries = yearlyData.map((d) =>
    selectedTaxType === "separate" ? d.taxSeparate : d.taxIncome
  );
  const afterTaxProfitSeries = yearlyData.map((d, i) => d.profit - taxSeries[i]);

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(canvasEl, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "元本",
          data: principalSeries,
          backgroundColor: "#2f9e44",
          stack: "asset",
        },
        {
          label: `手取り利益（${taxTypeName(selectedTaxType)}）`,
          data: afterTaxProfitSeries,
          backgroundColor: "#7c3aed",
          stack: "asset",
        },
        {
          label: `税額（${taxTypeName(selectedTaxType)}）`,
          data: taxSeries,
          backgroundColor: "#e03131",
          stack: "asset",
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}円`,
          },
        },
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          ticks: {
            callback: (value) => `${Number(value).toLocaleString()}円`,
          },
        },
      },
    },
  });
}
