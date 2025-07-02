class BilliardsGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.powerFill = document.getElementById('power-fill');
        
        // 게임 상태
        this.score = 0;
        this.gameRunning = true;
        this.aimingMode = false;
        this.power = 0;
        this.powerIncreasing = true;
        
        // 마우스 상태
        this.mousePos = { x: 0, y: 0 };
        this.mouseDown = false;
        this.aimStart = { x: 0, y: 0 };
        
        // 당구대 설정
        this.tableMargin = 30;
        this.pocketRadius = 20;
        this.pockets = [
            { x: this.tableMargin, y: this.tableMargin },
            { x: this.canvas.width / 2, y: this.tableMargin },
            { x: this.canvas.width - this.tableMargin, y: this.tableMargin },
            { x: this.tableMargin, y: this.canvas.height - this.tableMargin },
            { x: this.canvas.width / 2, y: this.canvas.height - this.tableMargin },
            { x: this.canvas.width - this.tableMargin, y: this.canvas.height - this.tableMargin }
        ];
        
        // 공들 초기화
        this.balls = [];
        this.initializeBalls();
        
        // 이벤트 리스너
        this.setupEventListeners();
        
        // 게임 루프 시작
        this.gameLoop();
    }
    
    initializeBalls() {
        this.balls = [];
        
        // 흰 공 (큐볼)
        this.cueBall = {
            x: 200,
            y: this.canvas.height / 2,
            vx: 0,
            vy: 0,
            radius: 10,
            color: '#FFFFFF',
            type: 'cue',
            inPocket: false
        };
        this.balls.push(this.cueBall);
        
        // 색깔 공들 (삼각형 배치)
        const colors = ['#FF0000', '#FFFF00', '#0000FF', '#800080', '#FFA500', '#008000', '#8B4513', '#000000'];
        const startX = 550;
        const startY = this.canvas.height / 2;
        const ballSpacing = 22;
        
        let ballIndex = 0;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col <= row; col++) {
                if (ballIndex < colors.length) {
                    this.balls.push({
                        x: startX + row * ballSpacing,
                        y: startY + (col - row / 2) * ballSpacing,
                        vx: 0,
                        vy: 0,
                        radius: 10,
                        color: colors[ballIndex],
                        type: 'target',
                        inPocket: false,
                        number: ballIndex + 1
                    });
                    ballIndex++;
                }
            }
        }
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
    }
    
    onMouseDown(e) {
        if (!this.gameRunning || this.ballsMoving()) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        // 큐볼 근처에서 클릭했는지 확인
        const distance = Math.sqrt(Math.pow(this.mousePos.x - this.cueBall.x, 2) + Math.pow(this.mousePos.y - this.cueBall.y, 2));
        if (distance < 50) {
            this.mouseDown = true;
            this.aimingMode = true;
            this.aimStart = { ...this.mousePos };
        }
    }
    
    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;
        
        if (this.aimingMode && this.mouseDown) {
            const distance = Math.sqrt(Math.pow(this.mousePos.x - this.aimStart.x, 2) + Math.pow(this.mousePos.y - this.aimStart.y, 2));
            this.power = Math.min(distance / 2, 100);
            this.powerFill.style.width = this.power + '%';
        }
    }
    
    onMouseUp(e) {
        if (this.aimingMode && this.mouseDown) {
            this.shootCueBall();
        }
        this.mouseDown = false;
        this.aimingMode = false;
        this.power = 0;
        this.powerFill.style.width = '0%';
    }
    
    shootCueBall() {
        const angle = Math.atan2(this.mousePos.y - this.aimStart.y, this.mousePos.x - this.aimStart.x);
        const force = this.power / 5;
        
        this.cueBall.vx = Math.cos(angle) * force;
        this.cueBall.vy = Math.sin(angle) * force;
    }
    
    ballsMoving() {
        return this.balls.some(ball => !ball.inPocket && (Math.abs(ball.vx) > 0.1 || Math.abs(ball.vy) > 0.1));
    }
    
    updatePhysics() {
        this.balls.forEach(ball => {
            if (ball.inPocket) return;
            
            // 위치 업데이트
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // 마찰력
            ball.vx *= 0.98;
            ball.vy *= 0.98;
            
            // 속도가 너무 작으면 0으로
            if (Math.abs(ball.vx) < 0.1) ball.vx = 0;
            if (Math.abs(ball.vy) < 0.1) ball.vy = 0;
            
            // 벽과의 충돌
            if (ball.x - ball.radius < this.tableMargin) {
                ball.x = this.tableMargin + ball.radius;
                ball.vx = -ball.vx * 0.8;
            }
            if (ball.x + ball.radius > this.canvas.width - this.tableMargin) {
                ball.x = this.canvas.width - this.tableMargin - ball.radius;
                ball.vx = -ball.vx * 0.8;
            }
            if (ball.y - ball.radius < this.tableMargin) {
                ball.y = this.tableMargin + ball.radius;
                ball.vy = -ball.vy * 0.8;
            }
            if (ball.y + ball.radius > this.canvas.height - this.tableMargin) {
                ball.y = this.canvas.height - this.tableMargin - ball.radius;
                ball.vy = -ball.vy * 0.8;
            }
            
            // 포켓과의 충돌 확인
            this.pockets.forEach(pocket => {
                const distance = Math.sqrt(Math.pow(ball.x - pocket.x, 2) + Math.pow(ball.y - pocket.y, 2));
                if (distance < this.pocketRadius) {
                    ball.inPocket = true;
                    ball.vx = 0;
                    ball.vy = 0;
                    
                    if (ball.type === 'target') {
                        this.score += 10;
                        this.updateScore();
                    } else if (ball.type === 'cue') {
                        // 큐볼이 포켓에 들어간 경우 다시 시작 위치로
                        setTimeout(() => {
                            ball.inPocket = false;
                            ball.x = 200;
                            ball.y = this.canvas.height / 2;
                        }, 1000);
                    }
                }
            });
        });
        
        // 공들 간의 충돌
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                if (this.balls[i].inPocket || this.balls[j].inPocket) continue;
                
                const dx = this.balls[j].x - this.balls[i].x;
                const dy = this.balls[j].y - this.balls[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.balls[i].radius + this.balls[j].radius) {
                    // 충돌 처리
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // 회전 변환
                    const vx1 = this.balls[i].vx * cos + this.balls[i].vy * sin;
                    const vy1 = this.balls[i].vy * cos - this.balls[i].vx * sin;
                    const vx2 = this.balls[j].vx * cos + this.balls[j].vy * sin;
                    const vy2 = this.balls[j].vy * cos - this.balls[j].vx * sin;
                    
                    // 충돌 후 속도
                    const newVx1 = vx2;
                    const newVx2 = vx1;
                    
                    // 다시 회전 변환
                    this.balls[i].vx = newVx1 * cos - vy1 * sin;
                    this.balls[i].vy = vy1 * cos + newVx1 * sin;
                    this.balls[j].vx = newVx2 * cos - vy2 * sin;
                    this.balls[j].vy = vy2 * cos + newVx2 * sin;
                    
                    // 공들이 겹치지 않도록 분리
                    const overlap = this.balls[i].radius + this.balls[j].radius - distance;
                    const separateX = dx / distance * overlap * 0.5;
                    const separateY = dy / distance * overlap * 0.5;
                    
                    this.balls[i].x -= separateX;
                    this.balls[i].y -= separateY;
                    this.balls[j].x += separateX;
                    this.balls[j].y += separateY;
                }
            }
        }
    }
    
    draw() {
        // 배경 지우기
        this.ctx.fillStyle = '#0F4C2A';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 당구대 테두리
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(this.tableMargin / 2, this.tableMargin / 2, 
                           this.canvas.width - this.tableMargin, this.canvas.height - this.tableMargin);
        
        // 포켓 그리기
        this.pockets.forEach(pocket => {
            this.ctx.fillStyle = '#000000';
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, this.pocketRadius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#8B4513';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        
        // 공들 그리기
        this.balls.forEach(ball => {
            if (ball.inPocket) return;
            
            this.ctx.fillStyle = ball.color;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // 공 번호 표시
            if (ball.type === 'target') {
                this.ctx.fillStyle = ball.color === '#FFFF00' || ball.color === '#FFFFFF' ? '#000000' : '#FFFFFF';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(ball.number, ball.x, ball.y + 3);
            }
        });
        
        // 조준선 그리기
        if (this.aimingMode && this.mouseDown && !this.ballsMoving()) {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.cueBall.x, this.cueBall.y);
            this.ctx.lineTo(this.mousePos.x, this.mousePos.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }
    
    updateScore() {
        this.scoreElement.textContent = this.score;
    }
    
    resetGame() {
        this.score = 0;
        this.updateScore();
        this.initializeBalls();
        this.gameRunning = true;
    }
    
    togglePause() {
        this.gameRunning = !this.gameRunning;
        document.getElementById('pauseBtn').textContent = this.gameRunning ? '⏸️ 일시정지' : '▶️ 계속';
    }
    
    gameLoop() {
        if (this.gameRunning) {
            this.updatePhysics();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 게임 시작
window.addEventListener('load', () => {
    new BilliardsGame();
});