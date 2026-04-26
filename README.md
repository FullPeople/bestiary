# 怪物图鉴 — Owlbear Rodeo 插件

D&D 5E 怪物图鉴插件，可检索所有官方怪物并一键添加到场景，自动设置 HP / AC / 先攻。

## 安装

```
https://obr.dnd.center/bestiary/manifest.json
```

粘贴到 **Owlbear Rodeo → 设置 → 扩展 → 添加自定义扩展**。

## 功能

- **仅 DM 可见** — 玩家端不显示
- **全量怪物数据** — 来自 5e.kiwee.top，覆盖所有 D&D 5E 官方来源
- **中英文搜索** — 按名称、类型、CR 检索
- **CR 排序** — 支持升序/降序切换
- **一键添加** — 点击怪物卡片，在场景中心生成 Token，自动：
  - 设置为**隐藏**（GM 准备好后右键显示）
  - 写入 [Bubbles](https://github.com/SeamusFinlayson/Bubbles-for-Owlbear-Rodeo) 插件的 HP / AC（仅 DM 可见）
  - 写入先攻追踪器的先攻值（1d20）和 DEX 加值
- **Token 尺寸自适应** — 自动探测图片分辨率，精确匹配一格大小

## 兼容插件

| 插件 | 联动 |
|------|------|
| [Full Initiative Tracker](https://github.com/FullPeople/Full_initiative_tracker) | 自动写入先攻值和 DEX 加值 |
| [Bubbles](https://github.com/SeamusFinlayson/Bubbles-for-Owlbear-Rodeo) | 自动写入 HP / AC |

未安装这些插件也不会报错，数据安静存在 metadata 中，安装后自动生效。

## 技术栈

- Preact + TypeScript + Vite
- @owlbear-rodeo/sdk v3.x

## 许可证

本仓库的**代码**采用 [PolyForm Noncommercial License 1.0.0](./LICENSE) —— 详见 LICENSE 文件。

**通俗说明**（仅供理解，以 LICENSE 全文为准）：

- ✅ **可以**：自由查看、修改、二次创作、非商用分发
- ✅ **必须**：保留 `Required Notice: Copyright (c) 2026 FullPeople` 这一行
- ❌ **不允许**：任何商业用途（售卖、盈利产品、收费部署等）
- ✅ 个人 / TRPG 团队 / 爱好者 / 学校 / 公益使用 **均允许**
- ✅ 非商用衍生品可以闭源、可重新分发

### 数据来源声明

- 怪物 JSON 数据从 `5e.kiwee.top`（5etools 的中文翻译镜像）运行时拉取
- 怪物 token 图片从 `5e.tools` 经服务端反代缓存
- 上述数据**不在本仓库分发**，也**不属于本许可证范围**
- D&D 5E 的怪物名称、属性、描述等内容版权归 Wizards of the Coast 所有；其中 SRD 5.1 / 5.2 部分采用 Creative Commons 授权
- 5etools 与 kiwee.top 的内容许可请参考其各自网站说明

如果你 fork 本项目自行部署，请确保你对所引用的数据拥有合法使用权。本作者不对使用者的数据行为承担责任。

---

## 💖 支持作者

如果这些插件对你的跑团有帮助，欢迎来爱发电支持一下作者 —— 用于服务器续费和新插件开发 ♥

[![前往爱发电](https://img.shields.io/badge/%E7%88%B1%E5%8F%91%E7%94%B5-FullPeople-FF6B9D?style=for-the-badge&logo=heart&logoColor=white)](https://ifdian.net/a/fullpeople)

> 反馈或建议：[1763086701@qq.com](mailto:1763086701@qq.com)
