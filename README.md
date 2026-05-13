# weekly-report-skill

OpenClaw Skill - 假期前一天自动发送工作周报

## 功能

- 每天 17:11 自动判断是否需要发送周报
- 判断逻辑：**今天是工作日，且明天不是工作日** → 发送
- 覆盖场景：普通周五、调休上班日、节假日前一天
- 邮件标题：`周小包 MM.DD ~ MM.DD 工作周报`

## 安装

```bash
cd ~/.openclaw/skills/
git clone <your-repo> weekly-report
cd weekly-report
npm install
```

## 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的邮件配置
```

## OpenClaw 注册

```bash
openclaw skills install weekly-report
```

## Cron 配置

```bash
openclaw cron add \
  --name "holiday-weekly-report" \
  --cron "11 17 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message '调用 weekly-report Skill 执行周报发送判断' \
  --announce \
  --model "anthropic/claude-sonnet-4-5"
```

## 测试

```bash
# 测试判断逻辑（不发送邮件）
openclaw run --skill weekly-report

# 强制发送测试邮件
openclaw run --skill weekly-report --force true
```

## 依赖

- `nodemailer` - 邮件发送
- `isWorkday.min.js` - 中国节假日判断库（内置 2005-2026 数据）