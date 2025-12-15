import { GameModule } from '../../router/types';
import './style.css';
import { IMG_PATH } from '../../constants';

// Reusing original configuration logic
const LEVELS = [
    { id: 0, file: '崔梓璇01.gif', score: 10, bg: '#FFFACD', border: '#FFD700', weight: 30 },
    { id: 1, file: '崔梓璇02.gif', score: 10, bg: '#FFA07A', border: '#FF4500', weight: 25 },
    { id: 2, file: '崔梓璇03.gif', score: 20, bg: '#FF6347', border: '#DC143C', weight: 15 },
    { id: 3, file: '崔梓璇04.gif', score: 20, bg: '#90EE90', border: '#3CB371', weight: 10 },
    { id: 4, file: '崔梓璇05.gif', score: 30, bg: '#32CD32', border: '#228B22', weight: 8 },
    { id: 5, file: '崔梓璇06.gif', score: 30, bg: '#87CEFA', border: '#4682B4', weight: 6 },
    { id: 6, file: '崔梓璇07.gif', score: 40, bg: '#4169E1', border: '#191970', weight: 4 },
    { id: 7, file: '崔梓璇08.gif', score: 50, bg: '#9932CC', border: '#800080', weight: 3 },
    { id: 8, file: '崔梓璇09.gif', score: 80, bg: '#FFD700', border: '#B8860B', weight: 2 },
    { id: 9, file: '崔梓璇10.gif', score: 100, bg: '#C0C0C0', border: '#808080', weight: 1 },
    { id: 10, file: '崔梓璇11.png', score: 200, bg: '#228B22', border: '#3CB371', weight: 0.5 }
];

export class GameWhack implements GameModule {
    // private container: HTMLElement | null = null;
    private scoreEl: HTMLElement | null = null;
    private timeEl: HTMLElement | null = null;
    private comboEl: HTMLElement | null = null;
    private overlay: HTMLElement | null = null;
    private holes: NodeListOf<Element> | null = null;

    private lastHole: Element | null = null;
    private timeUp = false;
    private score = 0;
    private timeLeft = 30;
    private combo = 0;
    private gameTimer: any = null;
    private peepTimer: any = null;

    mount(container: HTMLElement) {
        // this.container = container;
        container.innerHTML = `
            <div id="game-whack-container">
                <div id="whack-header">
                    <div class="whack-header-item">
                        <span class="whack-label">时间</span>
                        <span class="whack-value" id="time-value">30</span>
                    </div>
                    <div class="whack-header-item">
                        <span class="whack-label">连击</span>
                        <span class="whack-value" id="combo-value">0</span>
                    </div>
                    <div class="whack-header-item">
                        <span class="whack-label">得分</span>
                        <span class="whack-value" id="score-value">0</span>
                    </div>
                </div>

                <div id="whack-board">
                    <div class="whack-grid">
                        ${Array(9).fill(0).map((_, i) => `
                            <div class="hole" id="hole-${i}">
                                <div class="cui"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div id="overlay-whack">
                    <div class="title" style="font-size:36px; color:#d63384; font-weight:800; margin-bottom:20px;">暴打崔梓璇</div>
                    <div id="whack-msg" style="margin-bottom:20px; text-align:center; color:#666;">
                         <p>点击冒出来的崔梓璇得分！</p>
                         <p>连击越高，分数越高。</p>
                    </div>
                    <div id="final-score-whack" style="font-size:32px; font-weight:bold; color:#d63384; margin-bottom:20px; display:none;">0</div>
                    <button id="start-btn-whack" class="whack-btn">开始游戏</button>
                </div>
            </div>
        `;

        this.scoreEl = container.querySelector('#score-value');
        this.timeEl = container.querySelector('#time-value');
        this.comboEl = container.querySelector('#combo-value');
        this.overlay = container.querySelector('#overlay-whack');
        this.holes = container.querySelectorAll('.hole');

        container.querySelector('#start-btn-whack')?.addEventListener('click', () => this.startGame());

        this.holes.forEach(hole => {
            hole.addEventListener('mousedown', (e) => this.bonk(e as MouseEvent));
            hole.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.bonk(e as any); // TouchEvent but simpler to cast
            });
        });
    }

    unmount() {
        clearInterval(this.gameTimer);
        clearTimeout(this.peepTimer);
        // Clear all hole timeouts
        if (this.holes) {
            this.holes.forEach(hole => {
                const id = (hole as HTMLElement).dataset.timeoutId;
                if (id) clearTimeout(parseInt(id));
            });
        }
    }

    private randomHole(): Element {
        if (!this.holes) throw new Error("No holes");
        const idx = Math.floor(Math.random() * this.holes.length);
        const hole = this.holes[idx];
        if (hole === this.lastHole) {
            return this.randomHole();
        }
        this.lastHole = hole;
        return hole;
    }

    private randomCharacter() {
        const totalWeight = LEVELS.reduce((sum, l) => sum + l.weight, 0);
        let random = Math.random() * totalWeight;

        for (let level of LEVELS) {
            if (random < level.weight) return level;
            random -= level.weight;
        }
        return LEVELS[0];
    }

    private peep() {
        if (this.timeUp || !this.holes) return;

        const minTime = this.timeLeft > 10 ? 400 : 250;
        const maxTime = this.timeLeft > 10 ? 800 : 500;
        const time = Math.round(Math.random() * (maxTime - minTime) + minTime);

        const hole = this.randomHole() as HTMLElement;
        const character = this.randomCharacter();
        const cuiDiv = hole.querySelector('.cui') as HTMLElement;

        cuiDiv.style.backgroundImage = `url('${IMG_PATH}${character.file}')`;
        cuiDiv.style.backgroundColor = character.bg;
        cuiDiv.style.borderColor = character.border;
        cuiDiv.dataset.score = character.score.toString();
        cuiDiv.dataset.id = character.id.toString();

        hole.classList.add('up');

        const timeoutId = setTimeout(() => {
            if (!hole.classList.contains('whacked')) {
                if (this.combo > 0) {
                    this.combo = 0;
                    this.updateCombo();
                }
            }
            hole.classList.remove('up');
            hole.classList.remove('whacked');
            if (!this.timeUp) this.peep();
        }, time);

        hole.dataset.timeoutId = timeoutId.toString();
    }

    private startGame() {
        if (this.scoreEl) this.scoreEl.textContent = '0';
        if (this.timeEl) {
            this.timeEl.textContent = '30';
            this.timeEl.style.color = '#ff4500';
            this.timeEl.style.transform = 'scale(1)';
        }
        if (this.comboEl) this.comboEl.textContent = '0';

        this.score = 0;
        this.timeLeft = 30;
        this.combo = 0;
        this.timeUp = false;

        if (this.overlay) {
            this.overlay.style.display = 'none';
            const scoreDisplay = this.overlay.querySelector('#final-score-whack') as HTMLElement;
            if (scoreDisplay) scoreDisplay.style.display = 'none';
        }

        this.peep();

        this.gameTimer = setInterval(() => {
            this.timeLeft--;
            if (this.timeEl) this.timeEl.textContent = this.timeLeft.toString();
            
            if (this.timeLeft <= 5 && this.timeEl) {
                this.timeEl.style.color = 'red';
                this.timeEl.style.transform = 'scale(1.2)';
            }

            if (this.timeLeft <= 0) {
                this.endTime();
            }
        }, 1000);
    }

    private endTime() {
        clearInterval(this.gameTimer);
        this.timeUp = true;
        setTimeout(() => {
             if (this.overlay) {
                this.overlay.style.display = 'flex';
                this.overlay.querySelector('.title')!.textContent = '时间到！';
                this.overlay.querySelector('#whack-msg')!.innerHTML = '<p>最终得分</p>';
                const scoreDisplay = this.overlay.querySelector('#final-score-whack') as HTMLElement;
                if (scoreDisplay) {
                    scoreDisplay.style.display = 'block';
                    scoreDisplay.textContent = this.score.toString();
                }
                const btn = this.overlay.querySelector('button');
                if (btn) btn.textContent = '再来一次';
             }
        }, 500);
    }

    private bonk(e: MouseEvent | TouchEvent) {
        if (!e.isTrusted) return;
        const hole = e.currentTarget as HTMLElement;

        if (!hole.classList.contains('up') || hole.classList.contains('whacked')) return;

        hole.classList.add('whacked');
        hole.classList.remove('up');

        const cuiDiv = hole.querySelector('.cui') as HTMLElement;
        const baseScore = parseInt(cuiDiv.dataset.score || '0');
        const isRare = parseInt(cuiDiv.dataset.id || '0') >= 10;

        this.combo++;
        let multiplier = 1 + Math.floor(this.combo / 5) * 0.2;
        let finalScore = Math.floor(baseScore * multiplier);

        this.score += finalScore;
        if (this.scoreEl) this.scoreEl.textContent = this.score.toString();

        if (isRare) {
            this.timeLeft += 2;
            if (this.timeEl) {
                this.timeEl.textContent = this.timeLeft + "+2";
                setTimeout(() => {
                    if (this.timeEl) this.timeEl.textContent = this.timeLeft.toString();
                }, 500);
            }
        }

        this.updateCombo();
        
        let clientX, clientY;
        if (window.TouchEvent && e instanceof TouchEvent) { // e could be MouseEvent, check needed
             clientX = e.touches[0].clientX;
             clientY = e.touches[0].clientY;
        } else {
             clientX = (e as MouseEvent).clientX;
             clientY = (e as MouseEvent).clientY;
        }
        
        // TouchEvent processing in `bonk` wrapper passes TouchEvent directly
        if ((e as any).touches && (e as any).touches.length > 0) {
            clientX = (e as any).touches[0].clientX;
            clientY = (e as any).touches[0].clientY;
        } else if ((e as any).clientX) {
            clientX = (e as any).clientX;
            clientY = (e as any).clientY;
        } else {
            // fallback
            const rect = hole.getBoundingClientRect();
            clientX = rect.left + rect.width/2;
            clientY = rect.top;
        }

        this.showFloatScore(clientX, clientY, finalScore, isRare);
    }

    private updateCombo() {
        if (this.comboEl) {
            this.comboEl.textContent = this.combo.toString();
            if (this.combo > 5) {
                this.comboEl.classList.add('combo-active');
                setTimeout(() => this.comboEl?.classList.remove('combo-active'), 100);
            }
        }
    }

    private showFloatScore(x: number, y: number, amount: number, isRare: boolean) {
        const el = document.createElement('div');
        el.classList.add('float-score');
        el.textContent = "+" + amount;
        el.style.left = x + 'px';
        el.style.top = y + 'px';

        if (isRare) {
            el.style.color = '#FFD700';
            el.style.fontSize = '36px';
            el.textContent = "CRITICAL +" + amount;
        }

        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    }
}
