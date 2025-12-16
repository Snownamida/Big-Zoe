import './style.css';
import { Navbar } from './components/Navbar';
import { Router } from './router/Router';
import { GameSynthesis } from './games/synthesis/GameSynthesis';
import { Game2048 } from './games/2048/Game2048';
import { GameWhack } from './games/whack/GameWhack';
import { GameNinja } from './games/ninja/GameNinja';

document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    if (!app) throw new Error("App container not found");

    // 1. Mount Navbar
    const navbar = new Navbar();
    navbar.mount(app);

    // 2. Create Game Container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-view';
    gameContainer.style.flex = '1';
    gameContainer.style.width = '100%';
    gameContainer.style.height = '100%';
    gameContainer.style.overflow = 'hidden';
    app.appendChild(gameContainer);

    // 3. Setup Router
    const router = new Router('game-view');

    router.addRoute('/', () => new GameSynthesis(), 'Synthesis');
    router.addRoute('/2048', () => new Game2048(), '2048');
    router.addRoute('/whack', () => new GameWhack(), 'Whack');
    router.addRoute('/ninja', () => new GameNinja(), 'Ninja');
});
