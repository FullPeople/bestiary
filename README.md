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

MIT
