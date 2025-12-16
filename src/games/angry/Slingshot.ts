import Matter from 'matter-js';

export class Slingshot {
    private engine: Matter.Engine;
    private canvas: HTMLCanvasElement;
    private anchor: { x: number, y: number };
    private bird: Matter.Body | null = null;
    private sling: Matter.Constraint | null = null;
    
    private isDragging: boolean = false;
    private onLaunch: () => void;

    constructor(engine: Matter.Engine, canvas: HTMLCanvasElement, anchor: { x: number, y: number }, onLaunch: () => void) {
        this.engine = engine;
        this.canvas = canvas;
        this.anchor = anchor;
        this.onLaunch = onLaunch;

        this.bindEvents();
    }

    public setup(bird: Matter.Body) {
        this.bird = bird;
        
        // Initial position at anchor
        Matter.Body.setPosition(this.bird, this.anchor);

        this.sling = Matter.Constraint.create({
            pointA: this.anchor,
            bodyB: this.bird,
            stiffness: 0.05,
            damping: 0.1,
            length: 10,
            render: {
                visible: true,
                strokeStyle: '#333',
                lineWidth: 5
            }
        });

        Matter.World.add(this.engine.world, this.sling);
    }

    private bindEvents() {
        const startDrag = (e: MouseEvent | TouchEvent) => {
            if (!this.bird || !this.sling) return;
            
            // Allow dragging if near anchor or bird
            const pos = this.getEventPos(e);
            const dist = Matter.Vector.magnitude(Matter.Vector.sub(pos, this.bird.position));
            
            if (dist < 50) {
                this.isDragging = true;
                e.preventDefault();
            }
        };

        const onDrag = (e: MouseEvent | TouchEvent) => {
            if (!this.isDragging || !this.bird || !this.sling) return;
            
            const pos = this.getEventPos(e);
            // Limit drag distance
            const vector = Matter.Vector.sub(pos, this.anchor);
            const len = Matter.Vector.magnitude(vector);
            const maxLen = 100;
            
            if (len > maxLen) {
                const scale = maxLen / len;
                pos.x = this.anchor.x + vector.x * scale;
                pos.y = this.anchor.y + vector.y * scale;
            }

            Matter.Body.setPosition(this.bird, pos);
            // Make purely kinematic while dragging
            Matter.Body.setVelocity(this.bird, { x: 0, y: 0 });
            e.preventDefault();
        };

        const endDrag = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.fire();
        };

        this.canvas.addEventListener('mousedown', startDrag);
        this.canvas.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', endDrag);

        this.canvas.addEventListener('touchstart', startDrag, { passive: false });
        this.canvas.addEventListener('touchmove', onDrag, { passive: false });
        window.addEventListener('touchend', endDrag);
    }

    private fire() {
        if (!this.sling || !this.bird) return;

        // Release constraint
        Matter.World.remove(this.engine.world, this.sling);
        this.sling = null;

        // Apply force based on stretch (Matter.js naturally handles this if we just release, 
        // but since we were setting position manually, we might need to let it snap or apply force manually 
        // if we weren't using stiffness during drag properly. 
        // Actually, the Constraint with stiffness acts as a spring. 
        // BUT, while manually setting position, physics doesn't accumulate force in the same way 
        // unless we let the solver run a bit or calculate velocity manually.
        // A common trick is to just release the body if the constraint was pulling it.
        // HOWEVER, since we set position manually every frame, velocity is zero.
        // We need to calculate launch vector.
        
        const forceVector = Matter.Vector.sub(this.anchor, this.bird.position);
        const forceMagnitude = 0.03; // tweak this
        
        Matter.Body.applyForce(this.bird, this.bird.position, {
            x: forceVector.x * forceMagnitude,
            y: forceVector.y * forceMagnitude
        });

        this.onLaunch();
    }

    private getEventPos(e: MouseEvent | TouchEvent): { x: number, y: number } {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if (e.type.startsWith('touch')) {
            const touch = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = (e as MouseEvent).clientX;
            clientY = (e as MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    public cleanup() {
        // Remove listeners (simplified, normally wrap ref)
    }
}
