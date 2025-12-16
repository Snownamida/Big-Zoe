export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class RunnerPhysics {
    static checkCollision(r1: Rect, r2: Rect): boolean {
        return (
            r1.x < r2.x + r2.width &&
            r1.x + r1.width > r2.x &&
            r1.y < r2.y + r2.height &&
            r1.y + r1.height > r2.y
        );
    }
}
