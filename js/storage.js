class StorageManager {
    constructor() {
        this.prefix = 'arcade_';
    }

    getHighScore(gameId) {
        const score = localStorage.getItem(`${this.prefix}${gameId}_highscore`);
        return score ? parseInt(score, 10) : 0;
    }

    setHighScore(gameId, score) {
        localStorage.setItem(`${this.prefix}${gameId}_highscore`, score);
    }

    getMuteState() {
        const state = localStorage.getItem(`${this.prefix}muted`);
        return state === 'true';
    }

    setMuteState(isMuted) {
        localStorage.setItem(`${this.prefix}muted`, isMuted);
    }

    resetAllProgress() {
        if (confirm("Are you sure you want to reset all high scores?")) {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        }
        return false;
    }
}

const storage = new StorageManager();
