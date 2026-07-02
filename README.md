**English** | [中文](README.zh-CN.md)

# 合成崔梓璇 · Synthesis Cui Zixuan

A "Suika / Big Watermelon"-style physics **merge game** built with [matter.js](https://brm.io/matter-js/) — except the fruits are replaced by **Cui Zixuan (崔梓璇)** avatars. Drop them, let identical ones collide, and watch them merge into ever-bigger versions all the way up to the final form.

It has since grown into a small **mini-game arcade**: the same cast of characters powers seven different games, switchable from the top navigation bar.

**Play online: <https://big-zoe.snownamida.xyz/>**

The 11 tiers, from smallest to final form:

<p>
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8701.gif" width="36" alt="tier 1">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8702.gif" width="40" alt="tier 2">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8703.gif" width="44" alt="tier 3">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8704.gif" width="48" alt="tier 4">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8705.gif" width="52" alt="tier 5">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8706.gif" width="56" alt="tier 6">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8707.gif" width="60" alt="tier 7">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8708.gif" width="64" alt="tier 8">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8709.gif" width="68" alt="tier 9">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8710.gif" width="72" alt="tier 10">
  <img src="public/images/%E5%B4%94%E6%A2%93%E7%92%8711.png" width="76" alt="final form">
</p>

## 🕹️ The main game (Synthesis)

1. Move your finger / cursor to aim, then release to **drop** a character into the container.
2. When two **identical** characters touch, they **merge** into the next tier and you score points (2, 4, 8, … up to 2048).
3. The higher the tier, the bigger the character — space fills up fast.
4. Difficulty ramps up dynamically: as your score grows, higher-tier characters start appearing in the drop queue.
5. If the pile stays stacked above the warning line at the top, it's **game over**. Your **best score** is saved locally.

## 🎮 Seven games, one cast

Pick a mode from the top navbar — every game reuses the same Cui Zixuan artwork:

| Mode | Name | What it is |
|---|---|---|
| 合成版 | **Synthesis** | The Suika-style merge game (default) |
| 2048版 | **2048** | The classic 2048 sliding-tile puzzle |
| 暴打版 | **Whack** | Whack-a-mole against pop-up characters |
| 忍者版 | **Ninja** | Fruit-Ninja-style slicing |
| 酷跑版 | **Runner** | An endless jump-and-run |
| 飞飞版 | **Bird** | A Flappy-Bird-style tapper |
| 愤怒版 | **Angry** | An Angry-Birds-style slingshot with limited ammo |

## 🛠️ Tech stack

- [Vite](https://vitejs.dev/) + **TypeScript**
- [matter.js](https://brm.io/matter-js/) for 2D physics (Synthesis, Ninja, Angry)
- A tiny hash router with **lazy-loaded game modules** — the initial bundle only loads the game you open
- **PWA** support ([vite-plugin-pwa](https://vite-pwa-org.netlify.app/)): installable and works offline

## 💻 Run locally

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build -> dist/
npm run preview  # preview the build
```

## 📄 License & assets

- **Code**: MIT © Snownamida.
- **Character artwork (`public/images/`)**: the Cui Zixuan avatars are personal fan/gift art and are not covered by the code license.
