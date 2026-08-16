class BreakoutGame {
    constructor(arcade) {
        this.arcade = arcade;
        this.title = "Breakout";
        this.instructions = "Break all the neon bricks! Don't let the ball fall. Clear the board to advance levels.";
        this.controls = "Left/Right Arrow Keys or A/D to move paddle | Mouse to move paddle | ESC to pause";
        this.useDOM = false;

        this.ctx = this.arcade.ctx;
        this.canvas = this.arcade.canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.rafId = null;

        this.paddleH = 14;
        this.paddleW = 110;
        this.paddle = { x: 0, y: this.height - 30 };

        this.ball = { x: 0, y: 0, dx: 0, dy: 0, r: 7, baseSpeed: 5 };

        this.brickCols = 9;
        this.brickRows = 5;
        this.brickW = 0;
        this.brickH = 22;
        this.brickPad = 8;
        this.brickOffY = 50;
        this.brickOffX = 20;
        this.bricks = [];

        this.COLORS = ['#ff0055', '#ff9900', '#39ff14', '#0ff', '#f0f'];

        this.keys = {};
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.loop = this.loop.bind(this);

        // Compute brick width to fit canvas
        const totalPad = this.brickPad * (this.brickCols - 1) + this.brickOffX * 2;
        this.brickW = Math.floor((this.width - totalPad) / this.brickCols);
    }

    initBricks() {
        this.bricks = [];
        for (let r = 0; r < this.brickRows; r++) {
            for (let c = 0; c < this.brickCols; c++) {
                const bx = this.brickOffX + c * (this.brickW + this.brickPad);
                const by = this.brickOffY + r * (this.brickH + this.brickPad);
                this.bricks.push({ x: bx, y: by, alive: true, color: this.COLORS[r % this.COLORS.length] });
            }
        }
    }

    resetBall() {
        this.paddle.x = this.width / 2 - this.paddleW / 2;
        this.ball.x = this.width / 2;
        this.ball.y = this.paddle.y - this.ball.r - 2;
        const speed = this.ball.baseSpeed + (this.level - 1) * 0.5;
        const angle = (-60 + Math.random() * 120) * Math.PI / 180; // –60° to +60° from vertical
        this.ball.dx = speed * Math.sin(angle);
        this.ball.dy = -speed * Math.cos(angle);
    }

    start() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.ball.baseSpeed = 5;
        this.keys = {};
        this.initBricks();
        this.resetBall();

        this.isPlaying = true;
        this.isPaused = false;

        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);

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
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    }

    handleKeyDown(e) { this.keys[e.key] = true; }
    handleKeyUp(e) { this.keys[e.key] = false; }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.width / rect.width;
        const mx = (e.clientX - rect.left) * scaleX;
        this.paddle.x = Math.max(0, Math.min(this.width - this.paddleW, mx - this.paddleW / 2));
    }

    update() {
        const paddleSpeed = 8;

        // Keyboard paddle
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.paddle.x = Math.max(0, this.paddle.x - paddleSpeed);
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.paddle.x = Math.min(this.width - this.paddleW, this.paddle.x + paddleSpeed);
        }

        // Ball movement
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Side walls
        if (this.ball.x - this.ball.r <= 0) {
            this.ball.x = this.ball.r;
            this.ball.dx = Math.abs(this.ball.dx);
            audio.playBleep();
        } else if (this.ball.x + this.ball.r >= this.width) {
            this.ball.x = this.width - this.ball.r;
            this.ball.dx = -Math.abs(this.ball.dx);
            audio.playBleep();
        }

        // Top wall
        if (this.ball.y - this.ball.r <= 0) {
            this.ball.y = this.ball.r;
            this.ball.dy = Math.abs(this.ball.dy);
            audio.playBleep();
        }

        // Paddle collision
        if (
            this.ball.dy > 0 &&
            this.ball.y + this.ball.r >= this.paddle.y &&
            this.ball.y + this.ball.r <= this.paddle.y + this.paddleH &&
            this.ball.x >= this.paddle.x - this.ball.r &&
            this.ball.x <= this.paddle.x + this.paddleW + this.ball.r
        ) {
            this.ball.y = this.paddle.y - this.ball.r;
            const rel = (this.ball.x - (this.paddle.x + this.paddleW / 2)) / (this.paddleW / 2); // –1 to 1
            const bounceAngle = rel * 65 * Math.PI / 180;
            const speed = Math.hypot(this.ball.dx, this.ball.dy);
            this.ball.dx = speed * Math.sin(bounceAngle);
            this.ball.dy = -Math.abs(speed * Math.cos(bounceAngle));
            audio.playHit();
        }

        // Ball lost
        if (this.ball.y - this.ball.r > this.height) {
            this.lives--;
            audio.playExplosion();
            if (this.lives <= 0) {
                this.gameOver(); return;
            }
            this.resetBall();
        }

        // Brick collision
        let allGone = true;
        for (const b of this.bricks) {
            if (!b.alive) continue;
            allGone = false;

            // AABB + ball radius test
            const nearX = Math.max(b.x, Math.min(this.ball.x, b.x + this.brickW));
            const nearY = Math.max(b.y, Math.min(this.ball.y, b.y + this.brickH));
            const distX = this.ball.x - nearX;
            const distY = this.ball.y - nearY;

            if (distX * distX + distY * distY < this.ball.r * this.ball.r) {
                b.alive = false;
                allGone = false; // reset check — at least one was alive, so check again next frame
                this.score += 10 * this.level;
                this.arcade.updateHUD(this.score);
                audio.playBleep();

                // Determine bounce direction by overlap
                const overlapX = Math.abs(distX);
                const overlapY = Math.abs(distY);
                if (overlapX < overlapY) {
                    this.ball.dx = distX > 0 ? Math.abs(this.ball.dx) : -Math.abs(this.ball.dx);
                } else {
                    this.ball.dy = distY > 0 ? Math.abs(this.ball.dy) : -Math.abs(this.ball.dy);
                }
                break; // one brick per frame
            }
        }

        // Check if all bricks cleared
        if (this.bricks.every(b => !b.alive)) {
            this.level++;
            this.ball.baseSpeed = Math.min(this.ball.baseSpeed + 0.8, 14);
            this.initBricks();
            this.resetBall();
            audio.playStart();
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.width, this.height);

        // HUD – lives & level
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#888';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`LVL ${this.level}`, 12, 22);
        ctx.fillText(`♥ × ${this.lives}`, this.width - 80, 22);

        ctx.shadowBlur = 12;

        // Bricks
        for (const b of this.bricks) {
            if (!b.alive) continue;
            ctx.shadowColor = b.color;
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, this.brickW, this.brickH);
            // Dark inner beveling
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(b.x + 2, b.y + 2, this.brickW - 4, this.brickH - 4);
        }

        // Paddle
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#0ff';
        const pr = 6;
        ctx.beginPath();
        ctx.roundRect(this.paddle.x, this.paddle.y, this.paddleW, this.paddleH, pr);
        ctx.fill();

        // Ball
        ctx.shadowColor = '#fff';
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
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
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.arcade.gameOver(this.score);
    }
}

arcade.registerGame('breakout', BreakoutGame);
