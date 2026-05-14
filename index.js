// skills/weekly-report/index.js
const nodemailer = require('nodemailer');
const { isWorkday } = require('./isWorkday.min.js');
const { isFinanceWorkDay } = require('./isAShareTradingDay.js');

const isFinanceIndustry = process.env.FINANCE_INDUSTRY === 'true';
const employeeName = process.env.EMPLOYEE_NAME || '周小包';

/**
 * 获取当周有效工作日期范围（周一至周五）
 */
function getWeekWorkdays() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (d) => {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${m}.${day}`;
  };

  return { start: fmt(monday), end: fmt(friday), range: `${fmt(monday)} ~ ${fmt(friday)}` };
}

/**
 * 核心判断：今天是否需要发邮件
 * 条件：今天是工作日，且明天不是工作日
 */
function shouldSendReport() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const checkDay = isFinanceIndustry ? isFinanceWorkDay : isWorkday;
  const todayIsWorkday = checkDay(today);
  const tomorrowIsWorkday = checkDay(tomorrow);
  const shouldSend = todayIsWorkday && !tomorrowIsWorkday;

  const financeTag = isFinanceIndustry ? ' [金融行业模式]' : '';

  return {
    today: today.toISOString().split('T')[0],
    tomorrow: tomorrow.toISOString().split('T')[0],
    todayIsWorkday,
    tomorrowIsWorkday,
    shouldSend,
    reason: shouldSend
      ? `今天是工作日，明天放假 → 发送周报${financeTag}`
      : todayIsWorkday
        ? `今天明天都是工作日 → 不发送${financeTag}`
        : `今天不是工作日 → 不发送${financeTag}`
  };
}

/**
 * 生成 HTML 邮件模板
 */
function buildHtmlEmail({ weekRange, dateStr, content }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}
  .header{border-bottom:2px solid #1890ff;padding-bottom:12px;margin-bottom:20px}
  .title{font-size:18px;font-weight:600;color:#1890ff;margin:0}
  .subtitle{font-size:13px;color:#888;margin-top:4px}
  .section{margin:16px 0}
  .section-title{font-size:14px;font-weight:600;color:#555;margin-bottom:8px;padding-left:8px;border-left:3px solid #1890ff}
  .content{background:#f8f9fa;padding:12px 16px;border-radius:6px;font-size:14px;color:#444;white-space:pre-wrap}
  .footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:12px;color:#aaa;text-align:right}
</style>
</head>
<body>
  <div class="header">
    <div class="title">${employeeName} ${weekRange} 工作周报</div>
    <div class="subtitle">发送日期：${dateStr} | 周期范围：${weekRange}（周一至周五）</div>
  </div>
  <div class="section">
    <div class="section-title">本周工作内容</div>
    <div class="content">${content}</div>
  </div>
  <div class="footer">本邮件由 OpenClaw 自动发送 · 假期前下班前触发</div>
</body>
</html>`;
}

/**
 * 生成纯文本邮件模板
 */
function buildTextEmail({ weekRange, dateStr, content }) {
  return `${employeeName} ${weekRange} 工作周报
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
发送日期：${dateStr}
周期范围：${weekRange}（周一至周五）

【本周工作内容】
${content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本邮件由 OpenClaw 自动发送 · 假期前下班前触发`;
}

module.exports = {
  name: 'weekly-report',
  description: '判断是否需要发送周报（假期前一天），并执行发送',
  parameters: {
    type: 'object',
    properties: {
      force: { type: 'boolean', description: '强制发送，忽略日期判断（用于测试）', default: false },
      customContent: { type: 'string', description: '自定义周报内容（可选）' },
      cc: { type: 'string', description: '抄送邮箱（可选）' }
    },
    required: []
  },
  handler: async ({ force = false, customContent, cc }) => {
    const check = shouldSendReport();

    if (!check.shouldSend && !force) {
      return {
        content: [{
          type: 'text',
          text: `⏭️ 跳过发送\n📅 今天: ${check.today} (${check.todayIsWorkday ? '工作日' : '非工作日'})\n📅 明天: ${check.tomorrow} (${check.tomorrowIsWorkday ? '工作日' : '非工作日'})\n📝 原因: ${check.reason}`
        }]
      };
    }

    const weekRange = getWeekWorkdays();
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const recipient = process.env.RECIPIENT || 'recipient@example.com';
    const subject = `${employeeName} ${weekRange.range} 工作周报`;
    const content = customContent || '已完成本周工作内容';

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    try {
      await transporter.sendMail({
        from: `"周报机器人" <${process.env.SMTP_USER}>`,
        to: recipient,
        cc: cc || undefined,
        subject: subject,
        text: buildTextEmail({ weekRange: weekRange.range, dateStr, content }),
        html: buildHtmlEmail({ weekRange: weekRange.range, dateStr, content })
      });

      return {
        content: [{
          type: 'text',
          text: `✅ 周报已发送\n📧 收件人: ${recipient}\n📌 标题: ${subject}\n📅 周期: ${weekRange.range}\n🔍 判断: ${check.reason}`
        }]
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `❌ 发送失败: ${err.message}` }],
        isError: true
      };
    }
  }
};
