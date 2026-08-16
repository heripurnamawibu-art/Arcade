class ArcadeManager {
    constructor() {
        this.games = {};
        this.currentGameId = null;
        this.currentGameInstance = null;

        // DOM Elements
        this.screens = {
            mainMenu: document.getElementById('main-menu'),
            gameScreen: document.getElementById('game-screen')
        };

        this.overlays = {
            instructions: document.getElementById('instructions-overlay'),
            pause: document.getElementById('pause-overlay'),
            gameOver: document.getElementById('game-over-overlay')
        };

        this.hud = {
            title: document.getElementById('current-game-title'),
            score: document.getElementById('score-val'),
            highscore: document.getElementById('highscore-val')
        };

        this.buttons = {
            globalMute: document.getElementById('global-mute-btn'),
            resetProgress: document.getElementById('reset-progress-btn'),
            backToMenu: document.getElementById('back-to-menu-btn'),
            startGame: document.getElementById('start-game-btn'),
            resume: document.getElementById('resume-btn'),
            restartPause: document.getElementById('restart-btn'),
            playAgain: document.getElementById('play-again-btn')
        };

        this.canvas = document.getElementById('game-canvas');
        this.domContainer = document.getElementById('dom-game-container');
        this.ctx = this.canvas.getContext('2d');

        this._globalKeyHandler = this._globalKeyHandler.bind(this);
        this._firstPointerHandler = this._firstPointerHandler.bind(this);

        this.setupEventListeners();
        this.updateMuteButtonUI();
    }

    // ─── Registration ───────────────────────────────────────────────────────────
    registerGame(id, gameClass) {
        this.games[id] = gameClass;
    }

    // ─── Event Listeners ────────────────────────────────────────────────────────
    setupEventListeners() {
        // Game card clicks
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => this.loadGame(card.dataset.game));
        });

        // Mute toggle
        this.buttons.globalMute.addEventListener('click', () => {
            audio.init();
            audio.toggleMute();
            this.updateMuteButtonUI();
        });

        // Reset progress
        this.buttons.resetProgress.addEventListener('click', () => {
            if (storage.resetAllProgress()) {
                this._flashMessage('Progress reset!');
            }
        });

        // In-game overlay buttons
        this.buttons.backToMenu.addEventListener('click', () => this.returnToMenu());
        this.buttons.startGame.addEventListener('click', () => this.startGame());
        this.buttons.resume.addEventListener('click', () => this.resumeGame());
        this.buttons.restartPause.addEventListener('click', () => this.startGame());
        this.buttons.playAgain.addEventListener('click', () => this.startGame());

        // Global keyboard shortcuts
        window.addEventListener('keydown', this._globalKeyHandler);

        // Init audio on first interaction
        window.addEventListener('pointerdown', this._firstPointerHandler, { once: true });
    }

    _globalKeyHandler(e) {
        // Space = start/restart when instruction or game-over overlay is visible
        if (e.code === 'Space') {
            if (
                this.overlays.instructions.classList.contains('active') ||
                this.overlays.gameOver.classList.contains('active')
            ) {
                e.preventDefault();
                this.startGame();
                return;
            }
        }

        // R = restart from pause
        if (e.code === 'KeyR' && this.overlays.pause.classList.contains('active')) {
            this.startGame();
            return;
        }

        // Escape = pause / resume
        if (e.code === 'Escape') {
            if (this.currentGameInstance) {
                if (this.currentGameInstance.isPlaying) {
                    this.pauseGame();
                } else if (this.currentGameInstance.isPaused) {
                    this.resumeGame();
                }
            }
        }
    }

    _firstPointerHandler() {
        if (!audio.ctx) audio.init();
    }

    // ─── UI Helpers ─────────────────────────────────────────────────────────────
    updateMuteButtonUI() {
        this.buttons.globalMute.innerText = audio.muted ? '🔇' : '🔊';
    }

    showScreen(name) {
        Object.values(this.screens).forEach(s => s.classList.remove('active'));
        this.screens[name].classList.add('active');
    }

    showOverlay(name) {
        Object.values(this.overlays).forEach(o => o.classList.remove('active'));
        if (name) this.overlays[name].classList.add('active');
    }

    _flashMessage(msg) {
        // Non-blocking feedback on main menu
        const el = document.createElement('div');
        Object.assign(el.style, {
            position: 'fixed', bottom: '20px', left: '50%',
            transform: 'translateX(-50%)',
            background: '#0ff', color: '#000',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.6rem', padding: '8px 16px',
            zIndex: 9999, pointerEvents: 'none',
            animation: 'fadeIn 0.3s ease'
        });
        el.textContent = msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 2000);
    }

    // ─── Game Lifecycle ─────────────────────────────────────────────────────────
    loadGame(gameId) {
        if (!this.games[gameId]) {
            console.error(`[Arcade] Game "${gameId}" is not registered.`);
            return;
        }

        audio.init();
        audio.playSelect();

        // Tear down previous game
        if (this.currentGameInstance) {
            try { this.currentGameInstance.cleanup(); } catch (e) { /* ignore */ }
            this.currentGameInstance = null;
        }

        this.currentGameId = gameId;
        this.currentGameInstance = new this.games[gameId](this);

        const game = this.currentGameInstance;

        // HUD title + initial scores
        this.hud.title.innerText = game.title.toUpperCase();
        this.updateHUD(0);

        // Canvas vs DOM mode
        if (game.useDOM) {
            this.canvas.style.display = 'none';
            this.domContainer.style.display = 'flex';
            this.domContainer.innerHTML = '';
            if (typeof game.initDOM === 'function') {
                game.initDOM(this.domContainer);
            }
        } else {
            this.domContainer.style.display = 'none';
            this.canvas.style.display = 'block';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Show instruction overlay
        document.getElementById('instructions-title').innerText = game.title;
        document.getElementById('instructions-text').innerText = game.instructions;
        document.getElementById('instructions-controls').innerText = game.controls;

        this.showScreen('gameScreen');
        this.showOverlay('instructions');
    }

    startGame() {
        if (!this.currentGameInstance) return;
        audio.init();
        audio.playStart();
        this.showOverlay(null);
        document.getElementById('new-highscore-msg').classList.add('hidden');
        this.updateHUD(0);

        try {
            this.currentGameInstance.start();
        } catch (e) {
            console.error('[Arcade] Error starting game:', e);
        }
    }

    pauseGame() {
        if (this.currentGameInstance && this.currentGameInstance.isPlaying) {
            this.currentGameInstance.pause();
            this.showOverlay('pause');
        }
    }

    resumeGame() {
        if (this.currentGameInstance && this.currentGameInstance.isPaused) {
            this.showOverlay(null);
            this.currentGameInstance.resume();
        }
    }

    returnToMenu() {
        audio.playSelect();
        if (this.currentGameInstance) {
            try { this.currentGameInstance.cleanup(); } catch (e) { /* ignore */ }
            this.currentGameInstance = null;
        }
        this.currentGameId = null;
        this.showScreen('mainMenu');
        this.showOverlay(null); // hide any lingering overlays
    }

    // ─── HUD & Score ────────────────────────────────────────────────────────────
    updateHUD(score) {
        let displayScore = score;
        let highscore = storage.getHighScore(this.currentGameId);
        let displayHS;

        if (this.currentGameId === 'reaction') {
            displayScore = score === 0 ? '--' : `${score}ms`;
            displayHS = highscore === 0 ? '--' : `${highscore}ms`;
        } else if (this.currentGameId === 'memory') {
            displayScore = score === 0 ? '--' : `${score} mv`;
            displayHS = highscore === 0 ? '--' : `${highscore} mv`;
        } else {
            displayHS = highscore;
        }

        this.hud.score.innerText = displayScore;
        this.hud.highscore.innerText = displayHS;
    }

    gameOver(score) {
        audio.playExplosion();

        const id = this.currentGameId;
        let highscore = storage.getHighScore(id);
        let isNewBest = false;

        // Lower = better for reaction & memory
        const lowerIsBetter = (id === 'reaction' || id === 'memory');
        if (lowerIsBetter) {
            if (score < 9999 && (highscore === 0 || score < highscore)) {
                storage.setHighScore(id, score);
                isNewBest = true;
            }
        } else {
            if (score > highscore) {
                storage.setHighScore(id, score);
                isNewBest = true;
            }
        }

        this.updateHUD(score);

        // Format final score display
        let display = score;
        if (id === 'reaction') display = score === 9999 ? 'MISS' : `${score}ms`;
        else if (id === 'memory') display = `${score} moves`;

        document.getElementById('final-score').innerText = display;
        const msg = document.getElementById('new-highscore-msg');
        if (isNewBest) msg.classList.remove('hidden');
        else msg.classList.add('hidden');

        this.showOverlay('gameOver');
    }
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
const arcade = new ArcadeManager();
