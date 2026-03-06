# GitHub Token 到期提醒

## 仓库信息

- **仓库**: https://github.com/sosound/openclaw-display
- **创建日期**: 2026-03-06
- **有效期**: 60 天
- **到期日期**: **2026-05-05** ⚠️

## 提醒时间

| 提醒时间 | 距离到期 | 操作 |
|----------|----------|------|
| 2026-04-28 | 7 天 | 提醒用户更新 Token |
| 2026-05-01 | 4 天 | 再次提醒 |
| 2026-05-04 | 1 天 | 紧急提醒 |

## 更新 Token 步骤

1. 访问 https://github.com/settings/tokens
2. 删除旧 Token
3. 生成新 Token（建议 No expiration 或更长）
4. 更新远程仓库配置：
   ```bash
   cd /root/.openclaw/workspace
   git remote set-url origin https://NEW_TOKEN@github.com/sosound/openclaw-display.git
   git push -u origin main
   ```

## 注意事项

- ⚠️ Token 不应提交到 Git 仓库（会被 GitHub secret scanning 拦截）
- ⚠️ 新 Token 生成后，旧 Token 立即失效
- ✅ 建议使用 No expiration 或更长的有效期
- ✅ Token 应通过安全方式存储（如 Feishu 私密文档）

---

**创建时间**: 2026-03-06
**创建者**: 十一 (Eleven)
