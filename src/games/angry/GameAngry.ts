import Matter from 'matter-js';
import { GameModule } from '../../router/types';
import { AssetManager } from '../../utils/AssetManager';
import { loadBest, saveBest } from '../../utils/bestScore';

/**
 * 愤怒版（Angry-Birds-like）— 完全重写。
 * 弹弓拖拽发射崔梓璇，击倒木箱结构、消灭所有目标即过关；弹药有限。
 * 物理：matter-js；渲染：Matter.Render + afterRender 自绘（纹理/皮筋/轨迹）。
 */

// —— 可调参数 ——
const BIRD_RADIUS = 18;
const TARGET_RADIUS = 20;
const SHOTS_PER_LEVEL = 4;
const LAUNCH_POWER = 0.16;        // 拖拽距离 → 初速度系数
const MAX_DRAG = 120;             // 最大拖拽距离(px)
const IMPACT_KILL_SPEED = 5;      // 目标被撞掉所需的相对冲击速度
const TARGET_SCORE = 100;
const SHOT_BONUS = 50;            // 过关时每发剩余弹药的奖励
const BIRD_TEXTURE_LEVEL = 0;     // 弹丸用 崔梓璇01
const TARGET_TEXTURE_LEVEL = 4;   // 目标用 崔梓璇05

interface LevelBlock { x: number; y: number; w: number; h: number; }   // 相对系数(0-1)
interface LevelTarget { x: number; y: number; }
interface LevelDef { blocks: LevelBlock[]; targets: LevelTarget[]; }

// 关卡布局（x/w 为画布宽度系数，y/h 为高度系数；y 是自地面向上的偏移）
const LEVELS: LevelDef[] = [
    { // 第1关：单塔
        blocks: [
            { x: 0.68, y: 0.10, w: 0.016, h: 0.20 }, { x: 0.76, y: 0.10, w: 0.016, h: 0.20 },
            { x: 0.72, y: 0.225, w: 0.13, h: 0.035 },
        ],
        targets: [{ x: 0.72, y: 0 }, { x: 0.72, y: 0.26 }],
    },
    { // 第2关：双塔
        blocks: [
            { x: 0.58, y: 0.10, w: 0.016, h: 0.20 }, { x: 0.66, y: 0.10, w: 0.016, h: 0.20 },
            { x: 0.62, y: 0.225, w: 0.115, h: 0.035 },
            { x: 0.80, y: 0.10, w: 0.016, h: 0.20 }, { x: 0.88, y: 0.10, w: 0.016, h: 0.20 },
            { x: 0.84, y: 0.225, w: 0.115, h: 0.035 },
        ],
        targets: [{ x: 0.62, y: 0.26 }, { x: 0.84, y: 0.26 }, { x: 0.73, y: 0 }],
    },
    { // 第3关：金字塔
        blocks: [
            { x: 0.62, y: 0.08, w: 0.014, h: 0.16 }, { x: 0.70, y: 0.08, w: 0.014, h: 0.16 },
            { x: 0.78, y: 0.08, w: 0.014, h: 0.16 }, { x: 0.86, y: 0.08, w: 0.014, h: 0.16 },
            { x: 0.66, y: 0.185, w: 0.10, h: 0.03 }, { x: 0.82, y: 0.185, w: 0.10, h: 0.03 },
            { x: 0.685, y: 0.25, w: 0.014, h: 0.10 }, { x: 0.795, y: 0.25, w: 0.014, h: 0.10 },
            { x: 0.74, y: 0.32, w: 0.14, h: 0.03 },
        ],
        targets: [{ x: 0.66, y: 0 }, { x: 0.82, y: 0 }, { x: 0.74, y: 0.215 }, { x: 0.74, y: 0.35 }],
    },
];

export class GameAngry implements GameModule {
    private engine!: Matter.Engine;
    private render!: Matter.Render;
    private runner!: Matter.Runner;
    private container!: HTMLElement;
    private wrapper!: HTMLElement;
    private hud!: HTMLElement;
    private overlay!: HTMLElement;

    private width = 0;
    private height = 0;
    private groundY = 0;
    private anchor = { x: 0, y: 0 };  // 弹弓锚点

    private levelIndex = 0;
    private score = 0;
    private shotsLeft = SHOTS_PER_LEVEL;
    private targetsLeft = 0;
    private bird: Matter.Body | null = null;
    private birdState: 'ready' | 'dragging' | 'flying' = 'ready';
    private dragPos: { x: number; y: number } | null = null;
    private settleTimer: number | null = null;
    private ended = false;
    private levelLoadedAt = 0;

    private assets = AssetManager.getInstance();

    // —— 生命周期 ——
    mount(container: HTMLElement) {
        this.container = container;
        this.assets.preloadImages();
        this.buildDom();

        this.width = this.wrapper.clientWidth;
        this.height = this.wrapper.clientHeight;
        this.groundY = this.height - 24;
        this.anchor = { x: Math.max(90, this.width * 0.14), y: this.groundY - this.height * 0.22 };

        this.engine = Matter.Engine.create();
        this.render = Matter.Render.create({
            canvas: this.wrapper.querySelector('canvas') as HTMLCanvasElement,
            engine: this.engine,
            options: {
                width: this.width, height: this.height,
                wireframes: false, background: 'transparent',
                pixelRatio: window.devicePixelRatio,
            },
        });
        this.runner = Matter.Runner.create();

        Matter.Events.on(this.engine, 'collisionStart', this.onCollision);
        Matter.Events.on(this.render, 'afterRender', this.afterRender);

        this.wrapper.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
        window.addEventListener('resize', this.onResize);

        this.loadLevel(0);
        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
    }

    unmount() {
        if (this.settleTimer) window.clearTimeout(this.settleTimer);
        this.wrapper.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('pointerup', this.onPointerUp);
        window.removeEventListener('resize', this.onResize);
        Matter.Events.off(this.engine, 'collisionStart', this.onCollision);
        Matter.Events.off(this.render, 'afterRender', this.afterRender);
        Matter.Runner.stop(this.runner);
        Matter.Render.stop(this.render);
        this.render.canvas?.remove();
        Matter.World.clear(this.engine.world, false);
        Matter.Engine.clear(this.engine);
    }

    // —— DOM ——
    private buildDom() {
        this.container.innerHTML = `
            <div class="angry-root" style="position:relative;width:100%;height:100%;background:linear-gradient(#aee3f5,#e8f7ff calc(100% - 24px),#a3d06f calc(100% - 24px));overflow:hidden;touch-action:none;">
                <canvas></canvas>
                <div class="angry-hud" style="position:absolute;top:10px;left:12px;right:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;font-weight:800;color:#334155;pointer-events:none;font-size:15px;"></div>
                <div class="angry-overlay" style="position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(15,23,42,.45);z-index:5;">
                    <div style="background:#fff;border-radius:18px;padding:26px 34px;text-align:center;box-shadow:0 16px 50px rgba(0,0,0,.35);">
                        <h2 class="angry-msg" style="margin:0 0 6px;color:#d63384;"></h2>
                        <p class="angry-sub" style="margin:0 0 14px;color:#64748b;font-weight:600;"></p>
                        <button class="angry-btn" style="border:0;background:#d63384;color:#fff;font-weight:800;padding:10px 26px;border-radius:999px;font-size:15px;cursor:pointer;">再来一次</button>
                    </div>
                </div>
            </div>`;
        this.wrapper = this.container.querySelector('.angry-root') as HTMLElement;
        this.hud = this.container.querySelector('.angry-hud') as HTMLElement;
        this.overlay = this.container.querySelector('.angry-overlay') as HTMLElement;
    }

    private updateHud() {
        const best = Math.max(loadBest('angry'), this.score);
        this.hud.innerHTML = `
            <span>第 ${this.levelIndex + 1}/${LEVELS.length} 关</span>
            <span>🎯 剩余目标 ${this.targetsLeft}</span>
            <span>弹药 ${'●'.repeat(this.shotsLeft)}${'○'.repeat(Math.max(0, SHOTS_PER_LEVEL - this.shotsLeft))}</span>
            <span>分数 ${this.score} · 最高 ${best}</span>`;
    }

    private showOverlay(msg: string, sub: string, btnText: string, onClick: () => void) {
        (this.overlay.querySelector('.angry-msg') as HTMLElement).textContent = msg;
        (this.overlay.querySelector('.angry-sub') as HTMLElement).textContent = sub;
        const btn = this.overlay.querySelector('.angry-btn') as HTMLButtonElement;
        btn.textContent = btnText;
        // remplacer le bouton pour purger les anciens handlers
        const fresh = btn.cloneNode(true) as HTMLButtonElement;
        btn.replaceWith(fresh);
        fresh.addEventListener('click', onClick, { once: true });
        this.overlay.style.display = 'flex';
    }

    // —— 关卡 ——
    private loadLevel(index: number) {
        if (this.settleTimer) { window.clearTimeout(this.settleTimer); this.settleTimer = null; }
        this.overlay.style.display = 'none';
        this.levelIndex = index;
        this.shotsLeft = SHOTS_PER_LEVEL;
        this.ended = false;
        this.bird = null;
        this.birdState = 'ready';
        this.dragPos = null;

        Matter.World.clear(this.engine.world, false);

        // 地面
        Matter.World.add(this.engine.world, Matter.Bodies.rectangle(
            this.width / 2, this.groundY + 12, this.width * 2, 24,
            { isStatic: true, label: 'ground', render: { fillStyle: '#7cab4f' } },
        ));

        // 结构与目标
        const def = LEVELS[index];
        for (const b of def.blocks) {
            const w = Math.max(14, b.w * this.width);
            const h = Math.max(14, b.h * this.height);
            Matter.World.add(this.engine.world, Matter.Bodies.rectangle(
                b.x * this.width, this.groundY - b.y * this.height - h / 2, w, h,
                { label: 'block', density: 0.0015, friction: 0.6, render: { fillStyle: '#c98a4b', strokeStyle: '#9a6534', lineWidth: 2 } },
            ));
        }
        for (const t of def.targets) {
            Matter.World.add(this.engine.world, Matter.Bodies.circle(
                t.x * this.width, this.groundY - t.y * this.height - TARGET_RADIUS, TARGET_RADIUS,
                { label: 'target', density: 0.001, friction: 0.4, render: { visible: false } },
            ));
        }
        this.targetsLeft = def.targets.length;
        this.levelLoadedAt = Date.now();
        this.spawnBird();
        this.updateHud();
    }

    private spawnBird() {
        this.bird = Matter.Bodies.circle(this.anchor.x, this.anchor.y, BIRD_RADIUS, {
            label: 'bird', density: 0.004, restitution: 0.35, friction: 0.4,
            isStatic: true, render: { visible: false },
        });
        Matter.World.add(this.engine.world, this.bird);
        this.birdState = 'ready';
    }

    // —— 输入（弹弓） ——
    private toLocal(e: PointerEvent) {
        const r = this.wrapper.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    private onPointerDown = (e: PointerEvent) => {
        if (this.ended || !this.bird || this.birdState !== 'ready') return;
        const p = this.toLocal(e);
        const d = Math.hypot(p.x - this.anchor.x, p.y - this.anchor.y);
        if (d < BIRD_RADIUS * 3.2) {
            this.birdState = 'dragging';
            this.dragPos = p;
        }
    };

    private onPointerMove = (e: PointerEvent) => {
        if (this.birdState !== 'dragging' || !this.bird) return;
        const p = this.toLocal(e);
        // 限制拖拽半径
        let dx = p.x - this.anchor.x, dy = p.y - this.anchor.y;
        const d = Math.hypot(dx, dy);
        if (d > MAX_DRAG) { dx *= MAX_DRAG / d; dy *= MAX_DRAG / d; }
        this.dragPos = { x: this.anchor.x + dx, y: this.anchor.y + dy };
        Matter.Body.setPosition(this.bird, this.dragPos);
    };

    private onPointerUp = () => {
        if (this.birdState !== 'dragging' || !this.bird || !this.dragPos) return;
        const vx = (this.anchor.x - this.dragPos.x) * LAUNCH_POWER;
        const vy = (this.anchor.y - this.dragPos.y) * LAUNCH_POWER;
        if (Math.hypot(vx, vy) < 1) { // 拖得太近：放回弹弓
            Matter.Body.setPosition(this.bird, this.anchor);
            this.birdState = 'ready';
            this.dragPos = null;
            return;
        }
        Matter.Body.setStatic(this.bird, false);
        Matter.Body.setVelocity(this.bird, { x: vx, y: vy });
        this.birdState = 'flying';
        this.dragPos = null;
        this.shotsLeft -= 1;
        this.updateHud();
        // 弹丸飞行结算：4 秒后收尾（撞完目标由 onCollision 提前处理过关）
        this.settleTimer = window.setTimeout(() => this.settleShot(), 4000);
    };

    private settleShot() {
        this.settleTimer = null;
        if (this.ended) return;
        if (this.bird) Matter.World.remove(this.engine.world, this.bird);
        this.bird = null;
        if (this.targetsLeft <= 0) return; // 已在 levelCleared 处理
        if (this.shotsLeft <= 0) {
            this.gameOver();
        } else {
            this.spawnBird();
            this.updateHud();
        }
    }

    // —— 碰撞与结算 ——
    private onCollision = (ev: Matter.IEventCollision<Matter.Engine>) => {
        if (this.ended) return;
        if (Date.now() - this.levelLoadedAt < 800) return; // 开局落座碰撞不计
        for (const pair of ev.pairs) {
            const target = pair.bodyA.label === 'target' ? pair.bodyA : pair.bodyB.label === 'target' ? pair.bodyB : null;
            if (!target) continue;
            const other = target === pair.bodyA ? pair.bodyB : pair.bodyA;
            const impact = Math.hypot(
                target.velocity.x - other.velocity.x,
                target.velocity.y - other.velocity.y,
            );
            if (other.label === 'bird' || impact > IMPACT_KILL_SPEED) {
                Matter.World.remove(this.engine.world, target);
                this.targetsLeft -= 1;
                this.score += TARGET_SCORE;
                this.updateHud();
                if (this.targetsLeft <= 0) {
                    this.levelCleared();
                    break;
                }
            }
        }
    };

    private levelCleared() {
        this.ended = true;
        this.score += this.shotsLeft * SHOT_BONUS;
        if (this.settleTimer) { window.clearTimeout(this.settleTimer); this.settleTimer = null; }
        this.updateHud();
        if (this.levelIndex + 1 < LEVELS.length) {
            const next = this.levelIndex + 1;
            this.showOverlay(
                `第 ${this.levelIndex + 1} 关完成！`,
                `+${this.shotsLeft * SHOT_BONUS} 弹药奖励 · 当前 ${this.score} 分`,
                '下一关',
                () => this.loadLevel(next),
            );
        } else {
            const prev = loadBest('angry');
            const best = saveBest('angry', this.score);
            this.showOverlay(
                '🏆 全部通关！',
                this.score > prev ? `🎉 新纪录：${this.score} 分！` : `总分 ${this.score} · 最高 ${best}`,
                '再玩一遍',
                () => { this.score = 0; this.loadLevel(0); },
            );
        }
    }

    private gameOver() {
        this.ended = true;
        const prev = loadBest('angry');
        const best = saveBest('angry', this.score);
        this.showOverlay(
            '弹药用尽…',
            this.score > prev ? `🎉 但你创下新纪录：${this.score} 分！` : `得分 ${this.score} · 最高 ${best}`,
            '再来一次',
            () => { this.score = 0; this.loadLevel(0); },
        );
        this.updateHud();
    }

    // —— 自绘（纹理 / 皮筋 / 轨迹预览） ——
    private afterRender = () => {
        const ctx = this.render.context;
        const birdTex = this.assets.getTexture(BIRD_TEXTURE_LEVEL);
        const targetTex = this.assets.getTexture(TARGET_TEXTURE_LEVEL);

        // 弹弓支架
        ctx.strokeStyle = '#7a4a21';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.anchor.x, this.groundY);
        ctx.lineTo(this.anchor.x, this.anchor.y + 8);
        ctx.stroke();

        // 皮筋 + 轨迹预览（拖拽中）
        if (this.birdState === 'dragging' && this.dragPos) {
            ctx.strokeStyle = '#5b3418';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(this.anchor.x - 10, this.anchor.y);
            ctx.lineTo(this.dragPos.x, this.dragPos.y);
            ctx.lineTo(this.anchor.x + 10, this.anchor.y);
            ctx.stroke();

            // 轨迹点：按引擎重力积分（gravity.y × scale × dt²，dt=16.666ms）
            const g = this.engine.gravity.y * this.engine.gravity.scale * Math.pow(16.666, 2);
            let px = this.dragPos.x, py = this.dragPos.y;
            let vx = (this.anchor.x - this.dragPos.x) * LAUNCH_POWER;
            let vy = (this.anchor.y - this.dragPos.y) * LAUNCH_POWER;
            ctx.fillStyle = 'rgba(255,255,255,.85)';
            for (let i = 0; i < 28; i++) {
                px += vx; vy += g; py += vy;
                if (i % 2 === 0) {
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (py > this.groundY) break;
            }
        }

        // 纹理贴图（弹丸 + 目标）
        for (const body of Matter.Composite.allBodies(this.engine.world)) {
            if (body.label === 'bird') this.drawTextured(ctx, body, BIRD_RADIUS, birdTex, '#ef4444');
            else if (body.label === 'target') this.drawTextured(ctx, body, TARGET_RADIUS, targetTex, '#22c55e');
        }
    };

    private drawTextured(
        ctx: CanvasRenderingContext2D,
        body: Matter.Body,
        radius: number,
        tex: { loaded: boolean; imgObject: HTMLImageElement } | undefined,
        fallback: string,
    ) {
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.closePath();
        if (tex && tex.loaded) {
            ctx.clip();
            ctx.drawImage(tex.imgObject, -radius, -radius, radius * 2, radius * 2);
        } else {
            ctx.fillStyle = fallback;
            ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    private onResize = () => {
        // 尺寸大幅变化时最稳妥：按新尺寸重排当前关（保留总分）
        const w = this.wrapper.clientWidth, h = this.wrapper.clientHeight;
        if (Math.abs(w - this.width) < 4 && Math.abs(h - this.height) < 4) return;
        this.width = w;
        this.height = h;
        this.groundY = this.height - 24;
        this.anchor = { x: Math.max(90, this.width * 0.14), y: this.groundY - this.height * 0.22 };
        (Matter.Render as unknown as { setSize(r: Matter.Render, w: number, h: number): void })
            .setSize(this.render, this.width, this.height);
        if (!this.ended) this.loadLevel(this.levelIndex);
    };
}
