/** 每个游戏一份的最高分持久化（localStorage，失败时静默降级）。 */

const PREFIX = 'bz-best-';

export function loadBest(gameId: string): number {
    try {
        const v = parseInt(localStorage.getItem(PREFIX + gameId) || '0', 10);
        return Number.isFinite(v) && v > 0 ? v : 0;
    } catch {
        return 0;
    }
}

/** 若 score 打破纪录则保存，返回当前最高分。 */
export function saveBest(gameId: string, score: number): number {
    const best = loadBest(gameId);
    if (score > best) {
        try { localStorage.setItem(PREFIX + gameId, String(score)); } catch { /* stockage indisponible */ }
        return score;
    }
    return best;
}
