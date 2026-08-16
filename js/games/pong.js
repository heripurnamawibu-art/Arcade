class PongGame {
    constructor(arcade) {
        this.arcade = arcade;
        this.title = "Pong";
        this.instructions = "Deflect the ball past the AI opponent to score points. First to miss loses!";
        this.controls = "Up/Down Arrow Keys or W/S to move your paddle | ESC to pause";
        this.useDOM = false;

        this.ctx = this.arcade.ctx;
        this.canvas = this.arcade.canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.rafId = null;

        this.paddleW = 12;
        this.paddleH = 90;
        this.ballR = 8;

        this.player = { x: 25, y: 0, speed: 8 };
        this.ai = { x: this.width - 25 - this.paddleW, y: 0, speed: 4 };
        this.ball = { x: 0, y: 0, vx: 0, vy: 0, baseSpeed: 6 };

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.loop = this.loop.bind(this);
    }

    start() {
        this.score = 0;
        this.player.y = this.height / 2 - this.paddleH / 2;
        this.ai.y = this.height / 2 - this.paddleH / 2;
        this.ai.speed = 4;
        this.ball.baseSpeed = 6;
        this.keys = {};
        this.resetBall(1);

        this.isPlaying = true;
        this.isPaused = false;

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
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
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }

    handleKeyDown(e) { this.keys[e.key] = true; }
    handleKeyUp(e) { this.keys[e.key] = false; }

    resetBall(dir) {
        this.ball.x = this.width / 2;
        this.ball.y = this.height / 2;
        const angle = (Math.random() * 60 - 30) * Math.PI / 180;
        this.ball.vx = dir * this.ball.baseSpeed * Math.cos(angle);
        this.ball.vy = this.ball.baseSpeed * Math.sin(angle);
    }

    update() {
        // Player paddle
        if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
            this.player.y -= this.player.speed;
        }
        if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
            this.player.y += this.player.speed;
        }
        this.player.y = Math.max(0, Math.min(this.height - this.paddleH, this.player.y));

        // AI paddle – tracks ball with capped speed
        const aiCenter = this.ai.y + this.paddleH / 2;
        if (aiCenter < this.ball.y - 5) {
            this.ai.y = Math.min(this.ai.y + this.ai.speed, this.height - this.paddleH);
        } else if (aiCenter > this.ball.y + 5) {
            this.ai.y = Math.max(this.ai.y - this.ai.speed, 0);
        }

        // Ball movement
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Top / bottom wall bounce
        if (this.ball.y - this.ballR <= 0) {
            this.ball.y = this.ballR;
            this.ball.vy = Math.abs(this.ball.vy);
            audio.playBleep();
        } else if (this.ball.y + this.ballR >= this.height) {
            this.ball.y = this.height - this.ballR;
            this.ball.vy = -Math.abs(this.ball.vy);
            audio.playBleep();
        }

        // Player paddle collision
        if (
            this.ball.vx < 0 &&
            this.ball.x - this.ballR <= this.player.x + this.paddleW &&
            this.ball.x - this.ballR >= this.player.x &&
            this.ball.y >= this.player.y &&
            this.ball.y <= this.player.y + this.paddleH
        ) {
            this.ball.x = this.player.x + this.paddleW + this.ballR;
            const relHit = (this.ball.y - (this.player.y + this.paddleH / 2)) / (this.paddleH / 2);
            const bounceAngle = relHit * 60 * Math.PI / 180;
            const speed = Math.min(Math.hypot(this.ball.vx, this.ball.vy) + 0.3, 18);
            this.ball.vx = Math.abs(speed * Math.cos(bounceAngle));
            this.ball.vy = speed * Math.sin(bounceAngle);
            audio.playHit();
        }

        // AI paddle collision
        if (
            this.ball.vx > 0 &&
            this.ball.x + this.ballR >= this.ai.x &&
            this.ball.x + this.ballR <= this.ai.x + this.paddleW &&
            this.ball.y >= this.ai.y &&
            this.ball.y <= this.ai.y + this.paddleH
        ) {
            this.ball.x = this.ai.x - this.ballR;
            const relHit = (this.ball.y - (this.ai.y + this.paddleH / 2)) / (this.paddleH / 2);
            const bounceAngle = relHit * 60 * Math.PI / 180;
            const speed = Math.min(Math.hypot(this.ball.vx, this.ball.vy) + 0.3, 18);
            this.ball.vx = -Math.abs(speed * Math.cos(bounceAngle));
            this.ball.vy = speed * Math.sin(bounceAngle);
            audio.playHit();
        }

        // Scoring
        if (this.ball.x + this.ballR < 0) {
            // AI scored → game over
            this.gameOver();
        } else if (this.ball.x - this.ballR > this.width) {
            // Player scored
            this.score++;
            this.arcade.updateHUD(this.score);
            audio.playEat();
            // Increase difficulty
            this.ai.speed = Math.min(this.ai.speed + 0.4, 9);
            this.ball.baseSpeed = Math.min(this.ball.baseSpeed + 0.3, 16);
            this.resetBall(-1); // serve to player
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.width, this.height);

        // Centre dashed line
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.setLineDash([12, 18]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, 0);
        ctx.lineTo(this.width / 2, this.height);
        ctx.stroke();
        ctx.restore();

        ctx.shadowBlur = 12;

        // Player paddle (cyan)
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        ctx.fillRect(this.player.x, this.player.y, this.paddleW, this.paddleH);

        // AI paddle (magenta)
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#f0f';
        ctx.fillRect(this.ai.x, this.ai.y, this.paddleW, this.paddleH);

        // Ball (white glowing)
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ballR, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Score labels
        ctx.fillStyle = 'rgba(0,255,255,0.4)';
        ctx.font = 'bold 14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', this.width / 4, 24);
        ctx.fillStyle = 'rgba(255,0,255,0.4)';
        ctx.fillText('AI', (this.width / 4) * 3, 24);
        ctx.textAlign = 'left';
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
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.arcade.gameOver(this.score);
    }
}

arcade.registerGame('pong', PongGame);
