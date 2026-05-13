// 本地测试脚本（不依赖 OpenClaw）
const { isWorkday } = require('./isWorkday.min.js');
const { isFinanceWorkDay, isWeekend } = require('./isAShareTradingDay.js');

function testDate(dateStr, checkFn, label) {
  const date = new Date(dateStr);
  const tomorrow = new Date(date);
  tomorrow.setDate(date.getDate() + 1);

  const todayWork = checkFn(date);
  const tomorrowWork = checkFn(tomorrow);
  const shouldSend = todayWork && !tomorrowWork;
  const weekendTag = checkFn === isFinanceWorkDay && isWeekend(date) ? ' [周末短路]' : '';

  console.log(`${dateStr}: 今天${todayWork ? '工作日' : '非工作日'} → 明天${tomorrowWork ? '工作日' : '非工作日'} → ${shouldSend ? '✅ 发送' : '❌ 不发送'} (${label}${weekendTag})`);
}

console.log('=== 普通模式（默认） ===');
[isWorkday].forEach(fn => {
  testDate('2026-05-08', fn, '普通'); // 周五 → 周六
  testDate('2026-05-09', fn, '普通'); // 周六 → 周日
  testDate('2026-05-11', fn, '普通'); // 周一 → 周二
  testDate('2026-05-15', fn, '普通'); // 周五 → 周六
});

console.log('\n=== 金融行业模式（isFinanceWorkDay） ===');
[isFinanceWorkDay].forEach(fn => {
  testDate('2026-05-08', fn, '金融'); // 周五 → 周六
  testDate('2026-05-09', fn, '金融'); // 周六 → 周日（周末短路）
  testDate('2026-05-11', fn, '金融'); // 周一 → 周二
  testDate('2026-05-15', fn, '金融'); // 周五 → 周六
  testDate('2026-04-30', fn, '金融'); // 五一前工作日
  testDate('2026-05-05', fn, '金融'); // 五一假期中
});
