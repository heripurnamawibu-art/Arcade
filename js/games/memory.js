class MemoryGame {
    constructor(arcade) {
        this.arcade = arcade;
        this.title = "Memory";
        this.instructions = "Find all matching pairs! Flip two cards at a time. Match all pairs in the fewest moves.";
        this.controls = "Click or tap cards to flip them | ESC to pause";
        this.useDOM = true;

        this.isPlaying = false;
        this.isPaused = false;
        this.moves = 0;
        this.matches = 0;
        this.flippedCards = [];
        this.lockBoard = false;
        this.timerInterval = null;
        this.elapsed = 0;

        this.grid = null;
        this.timerEl = null;

        // 8 symbols × 2 = 16 cards
        this.SYMBOLS = ['★', '♦', '♣', '♠', '❤', '▲', '●', '■'];
    }

    initDOM(container) {
        this.container = container;
        this.container.style.flexDirection = 'column';
        this.container.style.padding = '10px';
        this.container.style.gap = '10px';

        // Timer bar
        this.timerEl = document.createElement('div');
        Object.assign(this.timerEl.style, {
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '0.6rem', color: '#888',
            textAlign: 'center', letterSpacing: '2px'
        });
        this.timerEl.textContent = 'TIME: 0:00';
        this.container.appendChild(this.timerEl);

        // Card grid
        this.grid = document.createElement('div');
        Object.assign(this.grid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            width: '100%',
            maxWidth: '520px'
        });
        this.container.appendChild(this.grid);
    }

    start() {
        this.moves = 0;
        this.matches = 0;
        this.flippedCards = [];
        this.lockBoard = false;
        this.elapsed = 0;
        this.isPlaying = true;
        this.isPaused = false;

        this.arcade.updateHUD(this.moves);
        this.createBoard();
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const startTs = Date.now();
        this.timerInterval = setInterval(() => {
            if (!this.isPlaying || this.isPaused) return;
            this.elapsed = Math.floor((Date.now() - startTs) / 1000);
            const m = Math.floor(this.elapsed / 60);
            const s = String(this.elapsed % 60).padStart(2, '0');
            if (this.timerEl) this.timerEl.textContent = `TIME: ${m}:${s}`;
        }, 500);
    }

    createBoard() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        const deck = [...this.SYMBOLS, ...this.SYMBOLS].sort(() => Math.random() - 0.5);

        deck.forEach(symbol => {
            const card = document.createElement('div');
            Object.assign(card.style, {
                aspectRatio: '1/1', perspective: '800px', cursor: 'pointer'
            });

            const inner = document.createElement('div');
            Object.assign(inner.style, {
                position: 'relative', width: '100%', height: '100%',
                transformStyle: 'preserve-3d', transition: 'transform 0.4s ease',
                borderRadius: '6px'
            });

            // Card back (face-down, neon border)
            const back = document.createElement('div');
            Object.assign(back.style, {
                position: 'absolute', width: '100%', height: '100%',
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                background: '#151520',
                border: '2px solid #0ff',
                borderRadius: '6px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 0 10px rgba(0,255,255,0.15)'
            });
            back.innerHTML = '<span style="color:#0ff;font-size:1.4rem;opacity:0.4">?</span>';

            // Card front (face-up, magenta symbol)
            const front = document.createElement('div');
            Object.assign(front.style, {
                position: 'absolute', width: '100%', height: '100%',
                backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                background: '#1a1a2e',
                border: '2px solid #f0f',
                borderRadius: '6px',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                transform: 'rotateY(180deg)',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 0 12px rgba(255,0,255,0.2)',
                fontSize: '2rem', color: '#f0f',
                fontFamily: 'Arial, sans-serif'
            });
            front.textContent = symbol;

            inner.appendChild(back);
            inner.appendChild(front);
            card.appendChild(inner);

            card.dataset.symbol = symbol;
            card.dataset.matched = 'false';
            card.dataset.flipped = 'false';

            card.addEventListener('click', () => this.flipCard(card, inner));
            card.addEventListener('touchstart', () => this.flipCard(card, inner), { passive: true });

            this.grid.appendChild(card);
        });
    }

    flipCard(card, inner) {
        if (!this.isPlaying || this.isPaused || this.lockBoard) return;
        if (card.dataset.flipped === 'true' || card.dataset.matched === 'true') return;

        inner.style.transform = 'rotateY(180deg)';
        card.dataset.flipped = 'true';
        audio.playBleep();

        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.arcade.updateHUD(this.moves);
            this.checkMatch();
        }
    }

    checkMatch() {
        const [a, b] = this.flippedCards;
        if (a.dataset.symbol === b.dataset.symbol) {
            // Match!
            a.dataset.matched = 'true';
            b.dataset.matched = 'true';
            // Glow matched cards
            a.firstChild.style.boxShadow = '0 0 16px #39ff14, inset 0 0 12px rgba(57,255,20,0.3)';
            b.firstChild.style.boxShadow = '0 0 16px #39ff14, inset 0 0 12px rgba(57,255,20,0.3)';
            a.firstChild.querySelector('div:last-child').style.borderColor = '#39ff14';
            b.firstChild.querySelector('div:last-child').style.borderColor = '#39ff14';
            audio.playHit();
            this.matches++;
            this.flippedCards = [];

            if (this.matches === this.SYMBOLS.length) {
                this.stopTimer();
                setTimeout(() => this.gameOver(), 600);
            }
        } else {
            // No match – flip back after delay
            this.lockBoard = true;
            setTimeout(() => {
                a.firstChild.style.transform = 'rotateY(0deg)';
                b.firstChild.style.transform = 'rotateY(0deg)';
                a.dataset.flipped = 'false';
                b.dataset.flipped = 'false';
                this.flippedCards = [];
                this.lockBoard = false;
            }, 900);
        }
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    pause() {
        this.isPaused = true;
        this.stopTimer();
    }

    resume() {
        this.isPaused = false;
        this.startTimer();
    }

    cleanup() {
        this.isPlaying = false;
        this.stopTimer();
        if (this.grid) this.grid.innerHTML = '';
    }

    gameOver() {
        this.isPlaying = false;
        this.stopTimer();
        this.arcade.gameOver(this.moves);
    }
}

arcade.registerGame('memory', MemoryGame);
