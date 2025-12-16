import Matter from 'matter-js';




export function customRenderBodies(render: Matter.Render, engine: Matter.Engine) {
    const context = render.context;
    // engine is now passed in
    const world = engine.world;

    // 获取世界中的所有刚体
    const bodies = Matter.Composite.allBodies(world);

    // 过滤出我们自定义绘制的水果刚体
    const fruitBodies = bodies.filter(body => body.label.startsWith('fruit_') && body.customRender);

    fruitBodies.forEach(body => {
        if (!body.customRender) return;

        const {
            position,
            angle,
            customRender
        } = body;
        const {
            texture,
            backgroundColor,
            borderColor,
            radius,
            slice // { startAngle: number, endAngle: number }
        } = customRender;

        // 1. 保存当前 Canvas 状态
        context.save();

        // 2. 移动和旋转到刚体的位置和角度
        context.translate(position.x, position.y);
        context.rotate(angle);

        // --- 绘制圆形背景和描边 ---

        // 3. 绘制圆形路径 (用于填充和描边)
        context.beginPath();
        if (slice) {
            const { startAngle, endAngle } = slice;
            context.arc(0, 0, radius, startAngle, endAngle);
            context.closePath(); // Connects the chord
        } else {
            context.arc(0, 0, radius, 0, 2 * Math.PI);
        }

        // 4. 填充背景色
        context.fillStyle = backgroundColor;
        context.fill();

        // 5. 绘制描边
        context.lineWidth = 3;
        context.strokeStyle = borderColor;
        context.stroke();

        // --- 裁剪并绘制图片 ---

        if (texture && texture.loaded) {
            // 6. 应用裁剪蒙版 (路径已经在步骤 3 中定义)
            context.clip();

            // 7. 绘制图片 (图片会被裁剪成圆形)
            const img = texture.imgObject;
            const diameter = radius * 2;

            // 绘制图片，使其居中并填充整个圆形区域
            context.drawImage(
                img, -radius, // x 坐标 (-radius to center)
                -radius, // y 坐标 (-radius to center)
                diameter, // 宽度
                diameter // 高度
            );
        }

        // 8. 恢复 Canvas 状态 (移除裁剪和转换)
        context.restore();
    });
}
