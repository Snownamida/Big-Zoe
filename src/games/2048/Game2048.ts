import { GameModule } from '../../router/types';
import './style.css';
import { IMG_PATH } from '../../constants';

// Configuration
const LEVELS = [
    { id: 0, val: 2, file: '崔梓璇01.gif', bg: '#FFFACD', border: '#FFD700' },
    { id: 1, val: 4, file: '崔梓璇02.gif', bg: '#FFA07A', border: '#FF4500' },
    { id: 2, val: 8, file: '崔梓璇03.gif', bg: '#FF6347', border: '#DC143C' },
    { id: 3, val: 16, file: '崔梓璇04.gif', bg: '#90EE90', border: '#3CB371' },
    { id: 4, val: 32, file: '崔梓璇05.gif', bg: '#32CD32', border: '#228B22' },
    { id: 5, val: 64, file: '崔梓璇06.gif', bg: '#87CEFA', border: '#4682B4' },
    { id: 6, val: 128, file: '崔梓璇07.gif', bg: '#4169E1', border: '#191970' },
    { id: 7, val: 256, file: '崔梓璇08.gif', bg: '#9932CC', border: '#800080' },
    { id: 8, val: 512, file: '崔梓璇09.gif', bg: '#FFD700', border: '#B8860B' },
    { id: 9, val: 1024, file: '崔梓璇10.gif', bg: '#C0C0C0', border: '#808080' },
    { id: 10, val: 2048, file: '崔梓璇11.png', bg: '#228B22', border: '#3CB371' }
];

export class Game2048 implements GameModule {
    private container: HTMLElement | null = null;
    private gridSize = 4;
    private grid: any[][] = [];
    private score = 0;
    private isGameOver = false;
    private tileContainer: HTMLElement | null = null;
    private scoreEl: HTMLElement | null = null;
    private overlay: HTMLElement | null = null;
    // private overlayMsg: HTMLElement | null = null; // Unused
    private finalScoreEl: HTMLElement | null = null;

    private touchStartX = 0;
    private touchStartY = 0;

    mount(container: HTMLElement) {
        this.container = container;
        container.innerHTML = `
            <div id="game-2048-container" style="display:flex; flex-direction:column; align-items:center; width:100%; height:100%;">
                <div class="header-bar" style="width:100%; max-width:400px; justify-content:space-between; margin-bottom:10px;">
                    <div style="font-size:24px; font-weight:bold; color:#d63384;">2048崔梓璇</div>
                    <div style="background:rgba(255,255,255,0.6); padding:5px 15px; border-radius:15px; text-align:center;">
                        <span style="font-size:12px; display:block;">得分</span>
                        <span id="score-2048" style="font-weight:bold; font-size:18px; color:#d63384;">0</span>
                    </div>
                    <button id="restart-2048" style="background:#d63384; color:white; border:none; padding:8px 16px; border-radius:20px; font-weight:bold; cursor:pointer;">重置</button>
                </div>

                <div id="grid-container">
                    ${Array(16).fill('<div class="grid-cell"></div>').join('')}
                    <div id="tile-container"></div>
                    <div id="overlay-2048">
                        <h2 id="overlay-msg-2048" style="font-size:32px; color:#d63384; margin-bottom:20px;">游戏结束</h2>
                        <div id="final-score-2048" style="font-size:20px; color:#333; margin-bottom:20px;"></div>
                        <button id="overlay-restart-2048" style="background:#d63384; color:white; border:none; padding:10px 24px; border-radius:20px; font-size:18px; cursor:pointer;">再来一次</button>
                    </div>
                </div>
                 <div style="text-align: center; margin-top: 20px; color: #d63384; font-size: 14px; opacity: 0.8;">
                    滑动屏幕来合并崔梓璇！
                </div>
            </div>
        `;

        this.tileContainer = container.querySelector('#tile-container');
        this.scoreEl = container.querySelector('#score-2048');
        this.overlay = container.querySelector('#overlay-2048');
        // this.overlayMsg = container.querySelector('#overlay-msg-2048');
        this.finalScoreEl = container.querySelector('#final-score-2048');

        container.querySelector('#restart-2048')?.addEventListener('click', () => this.restart());
        container.querySelector('#overlay-restart-2048')?.addEventListener('click', () => this.restart());

        this.setupInput();
        this.restart();
    }

    unmount() {
        window.removeEventListener('keydown', this.handleKeyDownBound);
        // Remove touch listeners? 
        // Since they are attached to elements inside container, they will be garbage collected when container.innerHTML is cleared.
        // But keydown is on window/document.
    }

    private handleKeyDownBound = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowLeft': this.move('left'); break;
            case 'ArrowRight': this.move('right'); break;
            case 'ArrowUp': this.move('up'); break;
            case 'ArrowDown': this.move('down'); break;
        }
    };

    private setupInput() {
        window.addEventListener('keydown', this.handleKeyDownBound);

        const gridEl = this.container?.querySelector('#grid-container');
        if (!gridEl) return;

        gridEl.addEventListener('touchstart', (e: any) => {
            if (e.touches.length > 1) return;
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: false });

        gridEl.addEventListener('touchend', (e: any) => {
            if (!this.touchStartX || !this.touchStartY) return;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - this.touchStartX;
            const dy = touchEndY - this.touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) dx > 0 ? this.move('right') : this.move('left');
            } else {
                if (Math.abs(dy) > 30) dy > 0 ? this.move('down') : this.move('up');
            }
            this.touchStartX = 0; 
            this.touchStartY = 0;
        }, { passive: false });

        gridEl.addEventListener('touchmove', (e: any) => e.preventDefault(), { passive: false });
    }

    private restart() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
        this.score = 0;
        this.isGameOver = false;
        this.updateScore(0);
        if (this.overlay) this.overlay.style.display = 'none';

        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    private updateScore(add: number) {
        this.score += add;
        if (this.scoreEl) this.scoreEl.innerText = this.score.toString();
    }

    private addRandomTile() {
        const emptyCells: {r: number, c: number}[] = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === null) emptyCells.push({ r, c });
            }
        }
        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = {
                level: Math.random() < 0.9 ? 0 : 1,
                id: Math.random().toString(36).substr(2, 9),
                isNew: true,
                isMerged: false
            };
        }
    }

    private move(direction: 'left'|'right'|'up'|'down') {
        if (this.isGameOver) return;
        let moved = false;
        let scoreAdded = 0;

        // Reset merge status
        this.grid.forEach(row => row.forEach(cell => {
             if(cell) { cell.isMerged = false; cell.isNew = false; }
        }));

        const traverse = (callback: (r: number, c: number) => void) => {
             if (direction === 'left') {
                for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) callback(r, c);
            } else if (direction === 'right') {
                for (let r = 0; r < 4; r++) for (let c = 3; c >= 0; c--) callback(r, c);
            } else if (direction === 'up') {
                for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) callback(r, c);
            } else if (direction === 'down') {
                for (let c = 0; c < 4; c++) for (let r = 3; r >= 0; r--) callback(r, c);
            }
        };

        const vector = {
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 },
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 }
        }[direction];

        traverse((r, c) => {
            const tile = this.grid[r][c];
            if (tile) {
                let nextR = r;
                let nextC = c;
                while (true) {
                    const checkR = nextR + vector.y;
                    const checkC = nextC + vector.x;
                    if (checkR < 0 || checkR >= 4 || checkC < 0 || checkC >= 4) break;
                    const nextTile = this.grid[checkR][checkC];
                    if (nextTile === null) {
                        nextR = checkR; nextC = checkC;
                    } else if (nextTile.level === tile.level && !nextTile.isMerged) {
                        nextR = checkR; nextC = checkC;
                        break;
                    } else {
                        break;
                    }
                }

                if (nextR !== r || nextC !== c) {
                    const targetTile = this.grid[nextR][nextC];
                    if (targetTile === null) {
                        this.grid[nextR][nextC] = tile;
                        this.grid[r][c] = null;
                        moved = true;
                    } else if (targetTile.level === tile.level && !targetTile.isMerged) {
                        const newLevel = tile.level + 1;
                        this.grid[nextR][nextC] = {
                            level: newLevel,
                            id: targetTile.id,
                            isMerged: true,
                            isNew: false
                        };
                        this.grid[r][c] = null;
                        
                        if (newLevel < LEVELS.length) {
                             // Assuming LEVELS array config aligns with original
                             // Original logic: FRUIT_LEVELS[newLevel].val
                             scoreAdded += Math.pow(2, newLevel + 1); 
                        } else {
                             scoreAdded += Math.pow(2, newLevel + 1);
                        }
                        moved = true;
                    }
                }
            }
        });

        if (moved) {
            this.updateScore(scoreAdded);
            this.addRandomTile();
            this.render();
            if (this.checkGameOver()) this.gameOver();
        }
    }

    private checkGameOver() {
        for(let r=0; r<4; r++) for(let c=0; c<4; c++) if(this.grid[r][c]===null) return false;
        for(let r=0; r<4; r++) for(let c=0; c<4; c++) {
            const current = this.grid[r][c].level;
            if (c < 3 && this.grid[r][c+1].level === current) return false;
            if (r < 3 && this.grid[r+1][c].level === current) return false;
        }
        return true;
    }

    private gameOver() {
        this.isGameOver = true;
        if(this.overlay) this.overlay.style.display = 'flex';
        if(this.finalScoreEl) this.finalScoreEl.innerText = "最终得分: " + this.score;
    }

    private render() {
        if (!this.tileContainer) return;
        this.tileContainer.innerHTML = '';
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const tileData = this.grid[r][c];
                if (tileData) {
                    const el = document.createElement('div');
                    el.className = 'tile';
                    const displayLevel = Math.min(tileData.level, LEVELS.length - 1);
                    const config = LEVELS[displayLevel];
                    el.style.backgroundColor = config.bg;
                    el.style.borderColor = config.border;
                    el.style.top = `calc(${r * 25}% + 10px)`;
                    el.style.left = `calc(${c * 25}% + 10px)`;
                    
                    if (tileData.isNew) el.classList.add('tile-new');
                    if (tileData.isMerged) el.classList.add('tile-merged');

                    const img = document.createElement('img');
                    img.src = IMG_PATH + config.file;
                    el.appendChild(img);
                    this.tileContainer.appendChild(el);
                }
            }
        }
    }
}
