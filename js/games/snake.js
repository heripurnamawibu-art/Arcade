class SnakeGame {
    constructor(arcade) {
        this.arcade = arcade;
        this.title = "Snake";
        this.instructions = "Eat the neon apples to grow. Don't hit the walls or yourself!";
        this.controls = "Arrow Keys / WASD to move | ESC to pause";
        this.useDOM = false;

        this.ctx = this.arcade.ctx;
        this.canvas = this.arcade.canvas;

        this.gridSize = 20;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cols = Math.floor(this.width / this.gridSize);
        this.rows = Math.floor(this.height / this.gridSize);

        this.isPlaying = false;
        this.isPaused = false;
        this.score = 0;

        this.snake = [];
        this.food = {};
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.lastTick = 0;
        this.baseSpeed = 120;
        this.currentSpeed = this.baseSpeed;
        this.rafId = null;

        this.handleInput = this.handleInput.bind(this);
        this.loop = this.loop.bind(this);
    }

    start() {
        const cx = Math.floor(this.cols / 2);
        const cy = Math.floor(this.rows / 2);
        this.snake = [
            { x: cx, y: cy },
            { x: cx - 1, y: cy },
            { x: cx - 2, y: cy }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.currentSpeed = this.baseSpeed;
        this.spawnFood();

        this.isPlaying = true;
        this.isPaused = false;

        window.addEventListener('keydown', this.handleInput);
        this.lastTick = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastTick = performance.now();
        this.rafId = requestAnimationFrame(this.loop);
    }

    cleanup() {
        this.isPlaying = false;
        this.isPaused = false;
        if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
        window.removeEventListener('keydown', this.handleInput);
    }

    handleInput(e) {
        const key = e.key.toLowerCase();
        if ((key === 'arrowup' || key === 'w') && this.direction.y !== 1) {
            this.nextDirection = { x: 0, y: -1 };
        } else if ((key === 'arrowdown' || key === 's') && this.direction.y !== -1) {
            this.nextDirection = { x: 0, y: 1 };
        } else if ((key === 'arrowleft' || key === 'a') && this.direction.x !== 1) {
            this.nextDirection = { x: -1, y: 0 };
        } else if ((key === 'arrowright' || key === 'd') && this.direction.x !== -1) {
            this.nextDirection = { x: 1, y: 0 };
        }
    }

    spawnFood() {
        let pos;
        let tries = 0;
        do {
            pos = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows)
            };
            tries++;
        } while (tries < 100 && this.snake.some(s => s.x === pos.x && s.y === pos.y));
        this.food = pos;
    }

    update() {
        this.direction = { ...this.nextDirection };
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            this.gameOver(); return;
        }
        // Self collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver(); return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            audio.playEat();
            this.arcade.updateHUD(this.score);
            this.spawnFood();
            this.currentSpeed = Math.max(40, this.currentSpeed - 3);
        } else {
            this.snake.pop();
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.width, this.height);

        // Grid lines
        ctx.strokeStyle = 'rgba(0,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.width; i += this.gridSize) {
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, this.height); ctx.stroke();
        }
        for (let i = 0; i < this.height; i += this.gridSize) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(this.width, i); ctx.stroke();
        }

        // Food – pulsing magenta square
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f0f';
        ctx.fillStyle = '#f0f';
        ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4, this.gridSize - 4
        );

        // Snake
        this.snake.forEach((seg, i) => {
            ctx.shadowColor = '#0ff';
            ctx.shadowBlur = i === 0 ? 20 : 8;
            ctx.fillStyle = i === 0 ? '#ffffff' : '#0ff';
            ctx.fillRect(seg.x * this.gridSize + 1, seg.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        });

        ctx.shadowBlur = 0;
    }

    loop(timestamp) {
        if (!this.isPlaying) return;
        if (!this.isPaused) {
            if (timestamp - this.lastTick >= this.currentSpeed) {
                this.update();
                if (!this.isPlaying) return; // gameOver may have been called
                this.lastTick = timestamp;
            }
            this.draw();
        }
        this.rafId = requestAnimationFrame(this.loop);
    }

    gameOver() {
        this.isPlaying = false;
        window.removeEventListener('keydown', this.handleInput);
        this.arcade.gameOver(this.score);
    }
}

arcade.registerGame('snake', SnakeGame);
