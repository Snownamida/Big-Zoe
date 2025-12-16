import Matter from 'matter-js';

export class SliceSystem {
    private engine: Matter.Engine;
    private canvasWrapper: HTMLElement;
    private trail: { x: number, y: number }[] = [];
    private maxTrailLength: number = 20;
    private isSlicing: boolean = false;
    private onSlice: (body: Matter.Body) => void;

    constructor(engine: Matter.Engine, canvasWrapper: HTMLElement, onSlice: (body: Matter.Body) => void) {
        this.engine = engine;
        this.canvasWrapper = canvasWrapper;
        this.onSlice = onSlice;
        this.setupInput();
    }

    private setupInput() {
        const startSlice = (e: MouseEvent | TouchEvent) => {
            this.isSlicing = true;
            this.trail = [];
            this.addPoint(e);
        };

        const endSlice = () => {
            this.isSlicing = false;
            this.trail = [];
        };

        const moveSlice = (e: MouseEvent | TouchEvent) => {
            if (!this.isSlicing) return;
            this.addPoint(e);
            this.checkSlice();
        };

        this.canvasWrapper.addEventListener('mousedown', startSlice);
        this.canvasWrapper.addEventListener('touchstart', startSlice, { passive: false });
        
        window.addEventListener('mouseup', endSlice);
        window.addEventListener('touchend', endSlice);
        
        this.canvasWrapper.addEventListener('mousemove', moveSlice);
        this.canvasWrapper.addEventListener('touchmove', moveSlice, { passive: false });
    }

    private addPoint(e: MouseEvent | TouchEvent) {
        const rect = this.canvasWrapper.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        this.trail.push({ x, y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    private checkSlice() {
        if (this.trail.length < 2) return;

        const p1 = this.trail[this.trail.length - 2];
        const p2 = this.trail[this.trail.length - 1];

        // Raycast against all bodies
        const bodies = Matter.Composite.allBodies(this.engine.world);
        const rayCollision = Matter.Query.ray(bodies, p1, p2);

        for (const collision of rayCollision) {
            const body = collision.bodyA; // Query.ray usually returns collisions where bodyA is the hit body
            // Ensure we hit a valid game object and not a sensor/debris
            if (body.label.startsWith('fruit_') && !body.isSensor) {
                this.onSlice(body);
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        if (this.trail.length < 2) return;

        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < this.trail.length; i++) {
            ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#fff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#0ff';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}
