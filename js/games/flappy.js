class FlappyGame {
    constructor(arcade) {
        this.arcade = arcade;
        this.title = "Flappy";
        this.instructions = "Fly through the glowing pipe gaps without touching the pipes or the ground!";
        this.controls = "Spacebar / Click / Tap to flap | ESC to pause";
        this.useDOM = false;

        this.ctx = this.arcade.ctx;
        this.canvas = this.arcade.canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.rafId = null;

        this.gravity = 0.45;
        this.jumpForce = -8.5;
        this.pipeW = 64;
        this.minGap = 160;  // starts at 160, shrinks with score
        this.pipeInterval = 110; // frames between pipes
        this.frameCount = 0;
        this.pipeSpeed = 3.5;

        this.bird = { x: 140, y: 0, w: 22, h: 22, vy: 0, angle: 0 };
        this.pipes = [];
        this.particles = [];

        this.handleInput = this.handleInput.bind(this);
        this.loop = this.loop.bind(this);
    }

    start() {
        this.bird.y = this.height / 2;
        this.bird.vy = 0;
        this.bird.angle = 0;
        this.pipes = [];
        this.particles = [];
        this.score = 0;
        this.frameCount = 0;
        this.pipeSpeed = 3.5;

        this.isPlaying = true;
        this.isPaused = false;

        window.addEventListener('keydown', this.handleInput);
        this.canvas.addEventListener('mousedown', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput, { passive: false });

        this.rafId = requestAnimationFrame(this.loop);
    }

    pause() { this.isPaused = true; }

    resume() {
        this.isPaused = false;
        this.rafId = requestAnimationFrame(this.loop);
    }

    cleanup() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        window.removeEventListener('keydown', this.handleInput);
        this.canvas.removeEventListener('mousedown', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
    }

    handleInput(e) {
        if (!this.isPlaying || this.isPaused) return;
        if (
            e.type === 'mousedown' || e.type === 'touchstart' ||
            (e.type === 'keydown' && e.code === 'Space')
        ) {
            if (e.type === 'touchstart' || e.type === 'keydown') e.preventDefault();
            this.flap();
        }
    }

    flap() {
        this.bird.vy = this.jumpForce;
        audio.playEat();
    }

    spawnPipe() {
        const gap = Math.max(this.minGap - Math.floor(this.score / 5) * 4, 110);
        const minTop = 60;
        const maxTop = this.height - gap - 60;
        const topH = Math.floor(Math.random() * (maxTop - minTop + 1) + minTop);
        this.pipes.push({
            x: this.width + 10,
            topH,
            botY: topH + gap,
            passed: false
        });
    }

    spawnParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 1,
                color: Math.random() > 0.5 ? '#0ff' : '#f0f'
            });
        }
    }

    update() {
        this.frameCount++;

        // Spawn pipes
        if (this.frameCount % this.pipeInterval === 1) {
            this.spawnPipe();
        }

        // Bird physics
        this.bird.vy += this.gravity;
        this.bird.vy = Math.min(this.bird.vy, 12); // terminal velocity
        this.bird.y += this.bird.vy;
        this.bird.angle = Math.max(-30, Math.min(90, this.bird.vy * 4));

        // Ground / ceiling
        if (this.bird.y + this.bird.h >= this.height || this.bird.y <= 0) {
            this.spawnParticles(this.bird.x, this.bird.y);
            this.gameOver(); return;
        }

        // Pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= this.pipeSpeed;

            // Collision (tight AABB)
            const bx = this.bird.x, by = this.bird.y, bw = this.bird.w, bh = this.bird.h;
            const margin = 3; // small forgiveness
            if (
                bx + bw - margin > p.x &&
                bx + margin < p.x + this.pipeW &&
                (by + margin < p.topH || by + bh - margin > p.botY)
            ) {
                this.spawnParticles(bx + bw / 2, by + bh / 2);
                this.gameOver(); return;
            }

            // Scoring – passed pipe
            if (!p.passed && p.x + this.pipeW < this.bird.x) {
                p.passed = true;
                this.score++;
                this.arcade.updateHUD(this.score);
                audio.playHit();
                // Increase speed every 5 points
                if (this.score % 5 === 0) {
                    this.pipeSpeed = Math.min(this.pipeSpeed + 0.3, 9);
                }
            }

            // Remove off-screen
            if (p.x + this.pipeW < 0) this.pipes.splice(i, 1);
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= 0.05;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.shadowBlur = 10;

        // Pipes
        ctx.shadowColor = '#0ff';
        ctx.strokeStyle = '#0ff';
        ctx.fillStyle = 'rgba(0,255,255,0.12)';
        ctx.lineWidth = 3;
        for (const p of this.pipes) {
            // Top pipe body
            ctx.strokeRect(p.x, 0, this.pipeW, p.topH);
            ctx.fillRect(p.x, 0, this.pipeW, p.topH);
            // Top pipe cap
            ctx.strokeRect(p.x - 4, p.topH - 14, this.pipeW + 8, 14);
            ctx.fillRect(p.x - 4, p.topH - 14, this.pipeW + 8, 14);

            // Bottom pipe body
            ctx.strokeRect(p.x, p.botY, this.pipeW, this.height - p.botY);
            ctx.fillRect(p.x, p.botY, this.pipeW, this.height - p.botY);
            // Bottom pipe cap
            ctx.strokeRect(p.x - 4, p.botY, this.pipeW + 8, 14);
            ctx.fillRect(p.x - 4, p.botY, this.pipeW + 8, 14);
        }

        // Bird (rotated square with face)
        ctx.save();
        ctx.translate(this.bird.x + this.bird.w / 2, this.bird.y + this.bird.h / 2);
        ctx.rotate(this.bird.angle * Math.PI / 180);
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(-this.bird.w / 2, -this.bird.h / 2, this.bird.w, this.bird.h);
        // Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, -5, 5, 5);
        ctx.fillStyle = '#000';
        ctx.fillRect(6, -4, 3, 3);
        ctx.restore();

        // Particles
        for (const p of this.particles) {
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        ctx.globalAlpha = 1;

        ctx.shadowBlur = 0;
    }

    loop() {
        if (!this.isPlaying) return;
        if (!this.isPaused) {
            this.update();
            if (!this.isPlaying) return;
        }
        this.draw();
        this.rafId = requestAnimationFrame(this.loop);
    }

    gameOver() {
        this.isPlaying = false;
        window.removeEventListener('keydown', this.handleInput);
        this.canvas.removeEventListener('mousedown', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
        this.arcade.gameOver(this.score);
    }
}

arcade.registerGame('flappy', FlappyGame);
