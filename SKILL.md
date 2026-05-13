---
name: weekly-report
description: 假期前一天自动发送工作周报
version: 1.0.0
author: pangshiqin
---

# Weekly Report Skill

## 功能

每天 17:11 判断是否需要发送周报：
- 今天是工作日，且明天不是工作日 → 发送邮件

## 使用

```bash
openclaw run --skill weekly-report
openclaw run --skill weekly-report --force true  # 强制发送测试