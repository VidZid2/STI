import React, { useEffect, useRef } from 'react';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!active || !canvasRef.current) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            // Clear canvas when inactive
            if (canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
            }
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        let retina = window.devicePixelRatio || 1;
        let canvasWidth = window.innerWidth;
        let canvasHeight = window.innerHeight;

        canvas.width = canvasWidth * retina;
        canvas.height = canvasHeight * retina;

        const PI = Math.PI;
        const sqrt = Math.sqrt;
        const round = Math.round;
        const random = Math.random;
        const cos = Math.cos;
        const sin = Math.sin;

        const speed = 50;
        const duration = (1.0 / speed);
        const confettiRibbonCount = 11;
        const ribbonPaperCount = 30;
        const ribbonPaperDist = 8.0;
        const ribbonPaperThick = 8.0;
        const confettiPaperCount = 95;
        const DEG_TO_RAD = PI / 180;
        const colors = [
            ["#df0049", "#660671"],
            ["#00e857", "#005291"],
            ["#2bebbc", "#05798a"],
            ["#ffd200", "#b06c00"]
        ];

        class Vector2 {
            x: number;
            y: number;
            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
            }
            Length() { return sqrt(this.SqrLength()); }
            SqrLength() { return this.x * this.x + this.y * this.y; }
            Add(vec: Vector2) { this.x += vec.x; this.y += vec.y; }
            Sub(vec: Vector2) { this.x -= vec.x; this.y -= vec.y; }
            Div(f: number) { this.x /= f; this.y /= f; }
            Mul(f: number) { this.x *= f; this.y *= f; }
            Normalize() {
                const sqrLen = this.SqrLength();
                if (sqrLen !== 0) {
                    const factor = 1.0 / sqrt(sqrLen);
                    this.x *= factor;
                    this.y *= factor;
                }
            }
            static Sub(vec0: Vector2, vec1: Vector2) {
                return new Vector2(vec0.x - vec1.x, vec0.y - vec1.y);
            }
        }

        class EulerMass {
            position: Vector2;
            mass: number;
            drag: number;
            force: Vector2;
            velocity: Vector2;

            constructor(x: number, y: number, mass: number, drag: number) {
                this.position = new Vector2(x, y);
                this.mass = mass;
                this.drag = drag;
                this.force = new Vector2(0, 0);
                this.velocity = new Vector2(0, 0);
            }

            AddForce(f: Vector2) {
                this.force.Add(f);
            }

            Integrate(dt: number) {
                const acc = this.CurrentForce();
                acc.Div(this.mass);
                const posDelta = new Vector2(this.velocity.x, this.velocity.y);
                posDelta.Mul(dt);
                this.position.Add(posDelta);
                acc.Mul(dt);
                this.velocity.Add(acc);
                this.force = new Vector2(0, 0);
            }

            CurrentForce() {
                const totalForce = new Vector2(this.force.x, this.force.y);
                const speed = this.velocity.Length();
                const dragVel = new Vector2(this.velocity.x, this.velocity.y);
                dragVel.Mul(this.drag * this.mass * speed);
                totalForce.Sub(dragVel);
                return totalForce;
            }
        }

        class ConfettiPaper {
            pos: Vector2;
            rotationSpeed: number;
            angle: number;
            rotation: number;
            cosA: number;
            size: number;
            oscillationSpeed: number;
            xSpeed: number;
            ySpeed: number;
            corners: Vector2[];
            time: number;
            frontColor: string;
            backColor: string;
            static bounds: Vector2;

            constructor(x: number, y: number) {
                this.pos = new Vector2(x, y);
                this.rotationSpeed = (random() * 600 + 800);
                this.angle = DEG_TO_RAD * random() * 360;
                this.rotation = DEG_TO_RAD * random() * 360;
                this.cosA = 1.0;
                this.size = 5.0;
                this.oscillationSpeed = (random() * 1.5 + 0.5);
                this.xSpeed = 40.0;
                this.ySpeed = (random() * 60 + 50.0);
                this.corners = [];
                this.time = random();
                const ci = round(random() * (colors.length - 1));
                this.frontColor = colors[ci][0];
                this.backColor = colors[ci][1];
                for (let i = 0; i < 4; i++) {
                    const dx = cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
                    const dy = sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
                    this.corners[i] = new Vector2(dx, dy);
                }
            }

            Update(dt: number) {
                this.time += dt;
                this.rotation += this.rotationSpeed * dt;
                this.cosA = cos(DEG_TO_RAD * this.rotation);
                this.pos.x += cos(this.time * this.oscillationSpeed) * this.xSpeed * dt;
                this.pos.y += this.ySpeed * dt;
            }

            Draw(g: CanvasRenderingContext2D) {
                if (this.cosA > 0) {
                    g.fillStyle = this.frontColor;
                } else {
                    g.fillStyle = this.backColor;
                }
                g.beginPath();
                g.moveTo((this.pos.x + this.corners[0].x * this.size) * retina, (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina);
                for (let i = 1; i < 4; i++) {
                    g.lineTo((this.pos.x + this.corners[i].x * this.size) * retina, (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina);
                }
                g.closePath();
                g.fill();
            }
        }

        class ConfettiRibbon {
            particleDist: number;
            particleCount: number;
            particleMass: number;
            particleDrag: number;
            particles: EulerMass[];
            frontColor: string;
            backColor: string;
            xOff: number;
            yOff: number;
            position: Vector2;
            prevPosition: Vector2;
            velocityInherit: number;
            time: number;
            oscillationSpeed: number;
            oscillationDistance: number;
            ySpeed: number;
            static bounds: Vector2;

            constructor(x: number, y: number, count: number, dist: number, thickness: number, angle: number, mass: number, drag: number) {
                this.particleDist = dist;
                this.particleCount = count;
                this.particleMass = mass;
                this.particleDrag = drag;
                this.particles = [];
                const ci = round(random() * (colors.length - 1));
                this.frontColor = colors[ci][0];
                this.backColor = colors[ci][1];
                this.xOff = (cos(DEG_TO_RAD * angle) * thickness);
                this.yOff = (sin(DEG_TO_RAD * angle) * thickness);
                this.position = new Vector2(x, y);
                this.prevPosition = new Vector2(x, y);
                this.velocityInherit = (random() * 2 + 4);
                this.time = random() * 100;
                this.oscillationSpeed = (random() * 2 + 2);
                this.oscillationDistance = (random() * 40 + 40);
                this.ySpeed = (random() * 40 + 80);
                for (let i = 0; i < this.particleCount; i++) {
                    this.particles[i] = new EulerMass(x, y - i * this.particleDist, this.particleMass, this.particleDrag);
                }
            }

            Update(dt: number) {
                let i = 0;
                this.time += dt * this.oscillationSpeed;
                this.position.y += this.ySpeed * dt;
                this.position.x += cos(this.time) * this.oscillationDistance * dt;
                this.particles[0].position = this.position;
                const dX = this.prevPosition.x - this.position.x;
                const dY = this.prevPosition.y - this.position.y;
                const delta = sqrt(dX * dX + dY * dY);
                this.prevPosition = new Vector2(this.position.x, this.position.y);
                for (i = 1; i < this.particleCount; i++) {
                    const dirP = Vector2.Sub(this.particles[i - 1].position, this.particles[i].position);
                    dirP.Normalize();
                    dirP.Mul((delta / dt) * this.velocityInherit);
                    this.particles[i].AddForce(dirP);
                }
                for (i = 1; i < this.particleCount; i++) {
                    this.particles[i].Integrate(dt);
                }
                for (i = 1; i < this.particleCount; i++) {
                    const rp2 = new Vector2(this.particles[i].position.x, this.particles[i].position.y);
                    rp2.Sub(this.particles[i - 1].position);
                    rp2.Normalize();
                    rp2.Mul(this.particleDist);
                    rp2.Add(this.particles[i - 1].position);
                    this.particles[i].position = rp2;
                }
            }

            Draw(g: CanvasRenderingContext2D) {
                for (let i = 0; i < this.particleCount - 1; i++) {
                    const p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
                    const p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
                    if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
                        g.fillStyle = this.frontColor;
                        g.strokeStyle = this.frontColor;
                    } else {
                        g.fillStyle = this.backColor;
                        g.strokeStyle = this.backColor;
                    }
                    if (i === 0) {
                        g.beginPath();
                        g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                        g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                        g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
                        g.closePath();
                        g.stroke();
                        g.fill();
                        g.beginPath();
                        g.moveTo(p1.x * retina, p1.y * retina);
                        g.lineTo(p0.x * retina, p0.y * retina);
                        g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
                        g.closePath();
                        g.stroke();
                        g.fill();
                    } else if (i === this.particleCount - 2) {
                        g.beginPath();
                        g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                        g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                        g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
                        g.closePath();
                        g.stroke();
                        g.fill();
                        g.beginPath();
                        g.moveTo(p1.x * retina, p1.y * retina);
                        g.lineTo(p0.x * retina, p0.y * retina);
                        g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
                        g.closePath();
                        g.stroke();
                        g.fill();
                    } else {
                        g.beginPath();
                        g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                        g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                        g.lineTo(p1.x * retina, p1.y * retina);
                        g.lineTo(p0.x * retina, p0.y * retina);
                        g.closePath();
                        g.stroke();
                        g.fill();
                    }
                }
            }

            Side(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
                return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2));
            }
        }

        const confettiRibbons: ConfettiRibbon[] = [];
        ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
        for (let i = 0; i < confettiRibbonCount; i++) {
            confettiRibbons[i] = new ConfettiRibbon(random() * canvasWidth, -random() * canvasHeight * 2, ribbonPaperCount, ribbonPaperDist, ribbonPaperThick, 45, 1, 0.05);
        }

        const confettiPapers: ConfettiPaper[] = [];
        ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
        for (let i = 0; i < confettiPaperCount; i++) {
            confettiPapers[i] = new ConfettiPaper(random() * canvasWidth, -random() * canvasHeight);
        }

        const animationDuration = 8000; // 8 seconds
        const startTime = Date.now();

        const update = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;

            if (elapsed > animationDuration) {
                // Clear canvas completely when animation ends
                context.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < confettiPaperCount; i++) {
                confettiPapers[i].Update(duration);
                confettiPapers[i].Draw(context);
            }
            for (let i = 0; i < confettiRibbonCount; i++) {
                confettiRibbons[i].Update(duration);
                confettiRibbons[i].Draw(context);
            }
            animationRef.current = requestAnimationFrame(update);
        };

        update();

        const handleResize = () => {
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth * retina;
            canvas.height = canvasHeight * retina;
            ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
            ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [active]);

    return <canvas ref={canvasRef} id="confetti" className={active ? 'active' : ''}></canvas>;
};

export default Confetti;
