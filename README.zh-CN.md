[English](README.md) | **中文**

# 合成崔梓璇 · Synthesis Cui Zixuan

一个用 [matter.js](https://brm.io/matter-js/) 打造的「合成大西瓜」式物理**合成小游戏**——只不过把水果换成了**崔梓璇**的头像。把她们扔进容器，让相同的两个碰到一起合体，一路合成到最大的「最终形态」。

后来它长成了一个小小的**迷你游戏合集**：同一批角色驱动了七款不同的游戏，可从顶部导航栏切换。

**在线体验：<https://big-zoe.snownamida.xyz/>**

从最小到最终形态，共 11 个等级：

<p>
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8701.gif" width="36" alt="等级 1">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8702.gif" width="40" alt="等级 2">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8703.gif" width="44" alt="等级 3">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8704.gif" width="48" alt="等级 4">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8705.gif" width="52" alt="等级 5">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8706.gif" width="56" alt="等级 6">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8707.gif" width="60" alt="等级 7">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8708.gif" width="64" alt="等级 8">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8709.gif" width="68" alt="等级 9">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8710.gif" width="72" alt="等级 10">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8711.png" width="76" alt="最终形态">
</p>

## 🕹️ 主玩法（合成版）

1. 移动手指 / 鼠标瞄准，松开即可**投下**一个角色到容器中。
2. 当两个**相同**的角色相撞时，会**合体**成更高一级，并获得分数（2、4、8……最高 2048）。
3. 等级越高、角色越大，空间很快就会被占满。
4. 难度会动态提升：随着分数增长，投放队列里会开始出现更高级的角色。
5. 如果堆叠的角色长时间停留在顶部的警戒线以上，就会**游戏结束**。**最高分**会保存在本地。

## 🎮 七款游戏，同一批角色

从顶部导航栏选择模式，每款游戏都复用同一套崔梓璇美术素材：

| 模式 | 名称 | 玩法 |
|---|---|---|
| 合成版 | **Synthesis** | 合成大西瓜式的合成游戏（默认） |
| 2048版 | **2048** | 经典 2048 滑块拼合 |
| 暴打版 | **Whack** | 打地鼠：敲打冒出来的角色 |
| 忍者版 | **Ninja** | 水果忍者式切割 |
| 酷跑版 | **Runner** | 无尽跑酷跳跃 |
| 飞飞版 | **Bird** | 飞翔的小鸟式点击 |
| 愤怒版 | **Angry** | 愤怒的小鸟式弹弓，弹药有限 |

## 🛠️ 技术栈

- [Vite](https://vitejs.dev/) + **TypeScript**
- [matter.js](https://brm.io/matter-js/) 提供 2D 物理（合成、忍者、愤怒）
- 一个轻量的哈希路由 + **游戏模块按需懒加载**——首屏只加载你打开的那款游戏
- **PWA** 支持（[vite-plugin-pwa](https://vite-pwa-org.netlify.app/)）：可安装、可离线运行

## 💻 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 类型检查 + 生产构建 -> dist/
npm run preview  # 预览构建产物
```

## 📄 许可证与素材

- **代码**：MIT © Snownamida。
- **角色美术（`public/images/`）**：崔梓璇头像为个人同人 / 赠礼美术，不在代码许可范围内。
