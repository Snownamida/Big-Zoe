import './style.css';
import { Navbar } from './components/Navbar';
import { Router } from './router/Router';

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

    // Import dynamique par jeu : le bundle initial ne charge que le jeu ouvert
    router.addRoute('/', () => import('./games/synthesis/GameSynthesis').then(m => new m.GameSynthesis()), 'Synthesis');
    router.addRoute('/2048', () => import('./games/2048/Game2048').then(m => new m.Game2048()), '2048');
    router.addRoute('/whack', () => import('./games/whack/GameWhack').then(m => new m.GameWhack()), 'Whack');
    router.addRoute('/ninja', () => import('./games/ninja/GameNinja').then(m => new m.GameNinja()), 'Ninja');
    router.addRoute('/runner', () => import('./games/runner/GameRunner').then(m => new m.GameRunner()), 'Runner');
    router.addRoute('/bird', () => import('./games/bird/GameBird').then(m => new m.GameBird()), 'Bird');
    router.addRoute('/angry', () => import('./games/angry/GameAngry').then(m => new m.GameAngry()), 'Angry');
});
