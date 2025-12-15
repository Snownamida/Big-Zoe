import Matter from 'matter-js';
import { WALL_THICKNESS } from '../constants';

export function createWalls(width: number, height: number): Matter.Body[] {
    const wallThickness = WALL_THICKNESS;
    
    const ground = Matter.Bodies.rectangle(width / 2, height + wallThickness / 2, width + wallThickness * 2, wallThickness, {
        isStatic: true,
        render: {
            visible: false
        }
    });

    const leftWall = Matter.Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height * 2, {
        isStatic: true,
        render: {
            visible: false
        }
    });

    const rightWall = Matter.Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height * 2, {
        isStatic: true,
        render: {
            visible: false
        }
    });

    return [ground, leftWall, rightWall];
}
