class ReactionGame {
    constructor(arcade) {
        this.arcade = arcade;
        this.title = "Reaction";
        this.instructions = "When the screen turns GREEN — click as fast as you can! Clicking too early counts as a miss.";
        this.controls = "Click / Tap anywhere on the game area";
        this.useDOM = true;

        this.isPlaying = false;
        this.isPaused = false;
        this.state = 'idle';   // idle | waiting | ready | result
        this.timeoutId = null;
        this.startTime = 0;
        this.lastResult = null;

        this.handleClick = this.handleClick.bind(this);
    }

    initDOM(container) {
        this.container = container;
        this.container.style.flexDirection = 'column';
        this.container.style.fontFamily = '"Press Start 2P", monospace';

        this.box = document.createElement('div');
        Object.assign(this.box.style, {
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center',
            cursor: 'pointer', textAlign: 'center',
            transition: 'background-color 0.15s',
            userSelect: 'none'
        });

        this.statusEl = document.createElement('div');
        Object.assign(this.statusEl.style, {
            fontSize: '1.4rem', color: '#fff',
            marginBottom: '1.5rem', lineHeight: '1.8',
            fontFamily: '"Press Start 2P", monospace'
        });

        this.subEl = document.createElement('div');
        Object.assign(this.subEl.style, {
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)',
            lineHeight: '1.6', fontFamily: '"Press Start 2P", monospace'
        });

        this.histEl = document.createElement('div');
        Object.assign(this.histEl.style, {
            marginTop: '1.5rem', fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.4)', fontFamily: '"Press Start 2P", monospace'
        });

        this.box.appendChild(this.statusEl);
        this.box.appendChild(this.subEl);
        this.box.appendChild(this.histEl);
        this.container.appendChild(this.box);

        this.box.addEventListener('mousedown', this.handleClick);
        this.box.addEventListener('touchstart', this.handleClick, { passive: true });
    }

    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.lastResult = null;
        this.arcade.updateHUD(0);
        this.setWaiting();
    }

    setWaiting() {
        this.state = 'waiting';
        this.box.style.background = '#1a0000';
        this.statusEl.style.color = '#ff4444';
        this.statusEl.textContent = 'WAIT FOR GREEN...';
        this.subEl.textContent = 'Don\'t click yet!';
        this.histEl.textContent = '';

        const delay = 2000 + Math.random() * 4000;
        if (this.timeoutId) clearTimeout(this.timeoutId);
        this.timeoutId = setTimeout(() => {
            if (!this.isPlaying || this.isPaused) return;
            this.setReady();
        }, delay);
    }

    setReady() {
        this.state = 'ready';
        this.box.style.background = '#002200';
        this.statusEl.style.color = '#39ff14';
        this.statusEl.textContent = 'CLICK NOW!';
        this.subEl.textContent = '';
        this.startTime = performance.now();
        audio.playStart();
    }

    handleClick(e) {
        if (!this.isPlaying || this.isPaused) return;

        if (this.state === 'waiting') {
            // Too early
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.state = 'result';
            this.box.style.background = '#1a001a';
            this.statusEl.style.color = '#f0f';
            this.statusEl.textContent = 'TOO EARLY!';
            this.subEl.textContent = 'You clicked before the signal.';
            audio.playExplosion();
            this.isPlaying = false;
            // Show briefly, then game over
            setTimeout(() => this.arcade.gameOver(9999), 1200);

        } else if (this.state === 'ready') {
            const ms = Math.round(performance.now() - this.startTime);
            this.lastResult = ms;
            this.state = 'result';
            this.isPlaying = false;
            audio.playSelect();

            let grade, color;
            if (ms < 180) { grade = 'SUPERHUMAN!'; color = '#39ff14'; }
            else if (ms < 250) { grade = 'EXCELLENT!'; color = '#0ff'; }
            else if (ms < 350) { grade = 'GOOD!'; color = '#ff9900'; }
            else { grade = 'SLOW...'; color = '#ff4444'; }

            this.box.style.background = '#001a00';
            this.statusEl.style.color = color;
            this.statusEl.textContent = `${ms} ms`;
            this.subEl.style.color = color;
            this.subEl.textContent = grade;

            const best = storage.getHighScore('reaction');
            if (best > 0 && ms < best) {
                this.histEl.textContent = `NEW BEST! (was ${best}ms)`;
            } else if (best > 0) {
                this.histEl.textContent = `Best: ${best}ms`;
            }

            setTimeout(() => this.arcade.gameOver(ms), 1500);
        }
    }

    pause() {
        this.isPaused = true;
        if (this.timeoutId) clearTimeout(this.timeoutId);
    }

    resume() {
        this.isPaused = false;
        if (this.state === 'waiting') this.setWaiting();
    }

    cleanup() {
        this.isPlaying = false;
        if (this.timeoutId) clearTimeout(this.timeoutId);
        if (this.box) {
            this.box.removeEventListener('mousedown', this.handleClick);
            this.box.removeEventListener('touchstart', this.handleClick);
        }
    }
}

arcade.registerGame('reaction', ReactionGame);
