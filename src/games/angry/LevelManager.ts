import Matter from 'matter-js';


export class LevelManager {
    private engine: Matter.Engine;
    private width: number;
    private height: number;
    private bodies: Matter.Body[] = [];

    constructor(engine: Matter.Engine, width: number, height: number) {
        this.engine = engine;
        this.width = width;
        this.height = height;
    }

    public setupLevel() {
        this.clearLevel();

        // 1. Ground
        const ground = Matter.Bodies.rectangle(this.width / 2, this.height - 20, this.width, 40, { 
            isStatic: true,
            render: { fillStyle: '#654321' }
        });

        // 2. Platform
        const platformX = this.width * 0.75;
        const platform = Matter.Bodies.rectangle(platformX, this.height - 100, 200, 20, {
            isStatic: true,
            render: { fillStyle: '#8B4513' }
        });

        this.bodies.push(ground, platform);

        // 3. Stack of boxes on platform
        // Simple pyramid
        const boxSize = 40;
        const startX = platformX;
        const startY = this.height - 120 - boxSize/2;

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3 - row; col++) {
                const x = startX - ((3 - row - 1) * boxSize / 2) + col * boxSize;
                const y = startY - row * boxSize;
                
                const box = Matter.Bodies.rectangle(x, y, boxSize, boxSize, {
                    render: { fillStyle: '#e55' } // Red boxes
                });
                this.bodies.push(box);
            }
        }

        // Add random "Pigs" (Targets) - reusing a fruit texture for fun?
        // Let's use a distinct color or shape for targets.
        // Or create a special body.
        const target = Matter.Bodies.circle(startX, startY - 3 * boxSize, 20, {
             density: 0.005,
             render: { fillStyle: '#32CD32' }, // Green pig
             label: 'target'
        });
        this.bodies.push(target);


        Matter.World.add(this.engine.world, this.bodies);
    }

    public clearLevel() {
        Matter.World.remove(this.engine.world, this.bodies);
        this.bodies = [];
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        // Ideally we should reposition bodies relatively, but for now a reset works
        this.setupLevel();
    }
}
