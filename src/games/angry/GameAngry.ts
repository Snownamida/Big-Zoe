import Matter from 'matter-js';
import { GameModule } from '../../router/types';
import './style.css';
import { IMG_PATH } from '../../constants';

// Aliases
const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Composite,
    Constraint
    // Mouse
} = Matter;

export class GameAngry implements GameModule {
    private engine: Matter.Engine;
    private render: Matter.Render;
    private runner: Matter.Runner;
    private canvasContainer: HTMLElement | null = null;
    private shotsLeftEl: HTMLElement | null = null;
    private msgOverlay: HTMLElement | null = null;
    private msgText: HTMLElement | null = null;
    
    // Game State
    private projectile: Matter.Body | null = null;
    private slingshot: Matter.Constraint | null = null;
    private slingshotAnchor: Matter.Body | null = null;
    private isDragging = false;
    private isFired = false;
    private shotsLeft = 5;
    private targets: Matter.Body[] = [];
    private gameEnded = false;

    // Config
    private canvasWidth = 500;
    private canvasHeight = 600;
    private anchorPos = { x: 0, y: 0 };
    private projectileRadius = 20;
    private targetRadius = 25;
    private boxSize = 60;

    // Load Timer
    private loadShotTimer: any = null;

    constructor() {
         this.engine = Engine.create();
         this.engine.gravity.y = 1;
         
         // TS Initialize hacks
         this.render = null as any;
         this.runner = null as any;
    }

    mount(container: HTMLElement) {
        this.canvasWidth = Math.min(window.innerWidth - 20, 500);
        this.anchorPos = {
            x: this.canvasWidth * 0.25,
            y: this.canvasHeight * 0.75
        };

        container.innerHTML = `
            <div id="angry-container">
                <h1 id="angry-title">愤怒的崔梓璇</h1>
                <div id="stats-bar">
                    <span style="font-weight:600">剩余发射: <span id="shots-left" style="font-weight:bold; font-size:1.25rem; color:#d81b60">5</span></span>
                </div>
                <div id="canvas-container-angry"></div>
                <button id="reset-button-angry">重新开始</button>
                
                <div id="message-overlay-angry">
                    <div id="message-box-angry">
                        <span id="message-text-angry"></span>
                        <button id="overlay-reset-btn">再试一次</button>
                    </div>
                </div>
            </div>
        `;

        this.canvasContainer = container.querySelector('#canvas-container-angry');
        this.shotsLeftEl = container.querySelector('#shots-left');
        this.msgOverlay = container.querySelector('#message-overlay-angry');
        this.msgText = container.querySelector('#message-text-angry');

        container.querySelector('#reset-button-angry')?.addEventListener('click', () => this.resetGame());
        container.querySelector('#overlay-reset-btn')?.addEventListener('click', () => this.resetGame());

        this.render = Render.create({
            element: this.canvasContainer!,
            engine: this.engine,
            options: {
                width: this.canvasWidth,
                height: this.canvasHeight,
                wireframes: false,
                background: '#87CEEB',
                pixelRatio: window.devicePixelRatio
            }
        });

        this.runner = Runner.create();
        
        this.resetGame();
        
        this.setupInput();
        
        Render.run(this.render);
        Runner.run(this.runner, this.engine);
        
        Matter.Events.on(this.engine, 'afterUpdate', this.checkGameStatusBound);
    }

    unmount() {
        if (this.runner) Runner.stop(this.runner);
        if (this.render) {
            Render.stop(this.render);
            if (this.render.canvas) this.render.canvas.remove();
        }
        if (this.engine) {
            World.clear(this.engine.world, false);
            Engine.clear(this.engine);
        }
        if (this.loadShotTimer) clearTimeout(this.loadShotTimer);
        
        // Remove event listeners? They are on canvas which is destroyed, so mostly fine.
    }

    private checkGameStatusBound = () => this.checkGameStatus();

    private resetGame() {
        this.gameEnded = false;
        this.isFired = false;
        this.isDragging = false;
        this.shotsLeft = 5;
        this.targets = [];
        this.updateUI();
        this.hideMessage();
        
        World.clear(this.engine.world, false);
        Engine.clear(this.engine); // Clear engine events if any, but we added one in mount, assume it persists or we re-add?
        // Wait, Engine.clear clears events too? 
        // Docs: "Clears the engine including the world, pairs and broadphase." 
        // Events are on the Runner or Engine object? 
        // If I clear engine, I might lose the event listener. 
        // Better to just clear World.
        
        // Actually, just clear world.
        // Matter.Engine.clear is destructive.
        // Let's rely on World.clear(world, false) (remove everything)
        // Re-adding the event listener might be safe if we check.
        // But `checkGameStatusBound` is an arrow function stored on instance, so we can re-add or check.
        // Since `Events.on` adds to the object, if I didn't replace the engine object, events should stay?
        // Actually, `Matter.Engine.create()` creates a new object.
        // My `unmount` creates new `GameAngry` instance? No, `Router` creates new instance.
        // So `mount` is called on fresh instance.
        // `resetGame` uses existing instance.
        // So just `World.clear` is enough.
        
        this.createLevel();
        this.loadNextShot();
    }

    private createLevel() {
        // Ground
        World.add(this.engine.world, Bodies.rectangle(this.canvasWidth / 2, this.canvasHeight - 20, this.canvasWidth, 40, {
            isStatic: true,
            render: { fillStyle: '#4A3B31' }
        }));

        this.slingshotAnchor = Bodies.circle(this.anchorPos.x, this.anchorPos.y, 10, {
            isStatic: true,
            render: { fillStyle: '#333' }
        });
        World.add(this.engine.world, this.slingshotAnchor);

        // Platform
        World.add(this.engine.world, Bodies.rectangle(this.canvasWidth * 0.75, this.canvasHeight - 100, this.canvasWidth * 0.4, 20, {
            isStatic: true,
            render: { fillStyle: '#A0522D' }
        }));

        // Box
        const box = Bodies.rectangle(this.canvasWidth * 0.75, this.canvasHeight - 140, this.boxSize, this.boxSize, {
            render: {
                sprite: {
                    texture: IMG_PATH + '崔梓璇11.png',
                    xScale: this.boxSize / 400,
                    yScale: this.boxSize / 400
                }
            }
        });
        this.targets.push(box);

        // Targets
        const tImgs = ['崔梓璇02.gif', '崔梓璇03.gif', '崔梓璇04.gif'];
        const positions = [
            { x: this.canvasWidth * 0.7, y: this.canvasHeight - 140 }, // Target 1
            { x: this.canvasWidth * 0.8, y: this.canvasHeight - 140 }, // Target 2
            { x: this.canvasWidth * 0.75, y: this.canvasHeight - 190 } // Target 3
        ];
        
        positions.forEach((pos, i) => {
            const t = Bodies.circle(pos.x, pos.y, this.targetRadius, {
                render: {
                    sprite: {
                        texture: IMG_PATH + tImgs[i],
                        xScale: (this.targetRadius * 2) / 100,
                        yScale: (this.targetRadius * 2) / 100
                    }
                }
            });
            this.targets.push(t);
        });
        
        World.add(this.engine.world, [...this.targets]);
    }

    private loadNextShot() {
        if (this.shotsLeft > 0 && !this.gameEnded) {
            this.isFired = false;
            // Remove old projectile if exists (cleanup)
            // But we keep them in the world as debris? Original code didn't remove old ones.
            
            this.projectile = Bodies.circle(this.anchorPos.x, this.anchorPos.y, this.projectileRadius, {
                restitution: 0.5,
                render: {
                    sprite: {
                        texture: IMG_PATH + '崔梓璇01.gif',
                        xScale: (this.projectileRadius * 2) / 100,
                        yScale: (this.projectileRadius * 2) / 100
                    }
                }
            });

            this.slingshot = Constraint.create({
                pointA: this.anchorPos,
                bodyB: this.projectile,
                stiffness: 0.05,
                length: 1,
                render: { visible: true, strokeStyle: '#333' }
            });

            World.add(this.engine.world, [this.projectile, this.slingshot]);
        }
    }

    private setupInput() {
        const canvas = this.render.canvas;
        
        const handleDown = (event: MouseEvent | TouchEvent) => {
            if (this.gameEnded || this.isFired) return;
            const pos = this.getEventPosition(event);
            if (pos && this.isNearProjectile(pos)) {
                this.isDragging = true;
            }
        };

        const handleMove = (event: MouseEvent | TouchEvent) => {
            if (!this.isDragging || this.gameEnded) return;
            const pos = this.getEventPosition(event);
            if (pos && this.projectile) { // null check
                const dx = pos.x - this.anchorPos.x;
                const dy = pos.y - this.anchorPos.y;
                const maxDrag = 100;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > maxDrag) {
                    const scale = maxDrag / distance;
                    pos.x = this.anchorPos.x + dx * scale;
                    pos.y = this.anchorPos.y + dy * scale;
                }

                Body.setPosition(this.projectile, pos);
                Body.setVelocity(this.projectile, { x: 0, y: 0 });
            }
        };

        const handleUp = (/* event */) => {
            if (!this.isDragging || this.gameEnded) return;
            this.isDragging = false;
            this.isFired = true;
            this.shotsLeft--;
            this.updateUI();

            if (this.slingshot) World.remove(this.engine.world, this.slingshot);
            
            if (this.projectile) {
                const forceMagnitude = 0.05;
                const force = {
                    x: (this.anchorPos.x - this.projectile.position.x) * forceMagnitude,
                    y: (this.anchorPos.y - this.projectile.position.y) * forceMagnitude
                };
                Body.applyForce(this.projectile, this.projectile.position, force);
            }

            this.loadShotTimer = setTimeout(() => this.loadNextShot(), 2000);
        };

        canvas.addEventListener('mousedown', handleDown);
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('mouseup', handleUp);
        canvas.addEventListener('mouseleave', handleUp);

        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleDown(e); }, { passive: false });
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
        canvas.addEventListener('touchend', (e) => { e.preventDefault(); handleUp(); }, { passive: false });
        canvas.addEventListener('touchcancel', (e) => { e.preventDefault(); handleUp(); }, { passive: false });
    }

    private getEventPosition(event: MouseEvent | TouchEvent) {
        let clientX, clientY;
        if (event instanceof TouchEvent) {
            if (event.touches.length > 0) {
                 clientX = event.touches[0].clientX;
                 clientY = event.touches[0].clientY;
            } else {
                 return null;
            }
        } else {
             clientX = event.clientX;
             clientY = event.clientY;
        }

        const rect = this.render.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    private isNearProjectile(pos: {x: number, y: number}) {
        if (!this.projectile) return false;
        const dx = pos.x - this.projectile.position.x;
        const dy = pos.y - this.projectile.position.y;
        return (dx * dx + dy * dy) < (this.projectileRadius + 10) * (this.projectileRadius + 10);
    }

    private checkGameStatus() {
        if (this.gameEnded) return;

        // Cleanup out of bounds
        this.targets = this.targets.filter(target => {
            if (target.position.y > this.canvasHeight + 50 || target.position.x < -50 || target.position.x > this.canvasWidth + 50) {
                World.remove(this.engine.world, target);
                return false;
            }
            return true;
        });

        if (this.targets.length === 0) {
            this.gameEnded = true;
            this.showMessage('你赢了！');
        } else if (this.shotsLeft === 0 && !this.isDragging && this.isFired) {
             let allStopped = true;
             const bodies = Composite.allBodies(this.engine.world);
             for(let body of bodies) {
                 if(!body.isStatic && body.speed > 0.1) {
                     allStopped = false;
                     break;
                 }
             }
             if (allStopped) {
                 this.gameEnded = true;
                 this.showMessage('失败了，再试一次！');
             }
        }
    }

    private updateUI() {
        if(this.shotsLeftEl) this.shotsLeftEl.textContent = this.shotsLeft.toString();
    }

    private showMessage(msg: string) {
        if(this.msgText) this.msgText.textContent = msg;
        if(this.msgOverlay) this.msgOverlay.classList.add('show');
    }

    private hideMessage() {
        if(this.msgOverlay) this.msgOverlay.classList.remove('show');
    }
}
