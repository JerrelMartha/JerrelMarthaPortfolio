/* ==========================================================================
   SPELL CONTROLLER - Interactive Sandbox Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // 01. DOM Element Bindings
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('spell-sandbox-canvas');
    if (!canvas) return; // Exit if not on the sandbox page

    const ctx = canvas.getContext('2d');
    const spellTypeSelect = document.getElementById('spell-type');
    const castSpeedSlider = document.getElementById('cast-speed');
    const spellSizeSlider = document.getElementById('spell-size');
    const spellVelocitySlider = document.getElementById('spell-velocity');
    const spellGravitySlider = document.getElementById('spell-gravity');

    const castSpeedVal = document.getElementById('cast-speed-val');
    const spellSizeVal = document.getElementById('spell-size-val');
    const spellVelocityVal = document.getElementById('spell-velocity-val');
    const spellGravityVal = document.getElementById('spell-gravity-val');

    const codeCast = document.getElementById('code-cast');
    const codeRadius = document.getElementById('code-radius');
    const codeVelocity = document.getElementById('code-velocity');
    const codeGravity = document.getElementById('code-gravity');

    const velocityGroup = document.getElementById('velocity-group');
    const gravityGroup = document.getElementById('gravity-group');
    const resetBtn = document.getElementById('reset-sandbox');

    // --------------------------------------------------------------------------
    // 02. Simulation Settings & States
    // --------------------------------------------------------------------------
    let spellType = 'fireball';
    let castTimeSetting = 0.3;     // seconds
    let spellRadiusSetting = 2.5;  // meters
    let velocitySetting = 15;      // m/s
    let gravitySetting = 10;       // G-force

    let keys = { w: false, a: false, s: false, d: false };
    let mouse = { x: 0, y: 0, screenX: 0, screenY: 0 };
    let player = {
        x: 0,
        y: 0,
        radius: 16,
        speed: 3.5,
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.4)',
        isCasting: false,
        castProgress: 0, // 0 to 1
        aimAngle: 0
    };

    let activeSpells = [];
    let particles = [];

    // Scale factors: 1 meter = 15 pixels
    const METERS_TO_PIXELS = 15;

    // Setup canvas dimension
    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        if (player.x === 0 && player.y === 0) {
            player.x = canvas.width / 2;
            player.y = canvas.height / 2;
        }
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --------------------------------------------------------------------------
    // 03. UI Updates & Logic Synchronizer
    // --------------------------------------------------------------------------
    function updateUI() {
        // Read values from elements
        spellType = spellTypeSelect.value;
        castTimeSetting = parseFloat(castSpeedSlider.value);
        spellRadiusSetting = parseFloat(spellSizeSlider.value);
        velocitySetting = parseFloat(spellVelocitySlider.value);
        gravitySetting = parseFloat(spellGravitySlider.value);

        // Update display text
        castSpeedVal.textContent = `${castTimeSetting.toFixed(2)}s`;
        spellSizeVal.textContent = `${spellRadiusSetting.toFixed(1)}m`;
        spellVelocityVal.textContent = `${velocitySetting}m/s`;
        spellGravityVal.textContent = `${(gravitySetting * 0.98).toFixed(1)}m/s²`;

        // Update code view
        codeCast.textContent = `${castTimeSetting.toFixed(2)}f`;
        codeRadius.textContent = `${spellRadiusSetting.toFixed(2)}f`;
        codeVelocity.textContent = `${velocitySetting.toFixed(1)}f`;
        codeGravity.textContent = `${(gravitySetting / 10).toFixed(2)}f`;

        // Hide/Show context specific sliders
        if (spellType === 'fireball') {
            velocityGroup.style.display = 'flex';
            gravityGroup.style.display = 'none';
        } else if (spellType === 'lightning') {
            velocityGroup.style.display = 'none';
            gravityGroup.style.display = 'none';
        } else if (spellType === 'meteor') {
            velocityGroup.style.display = 'none';
            gravityGroup.style.display = 'flex';
        }
    }

    // Set slider listeners
    spellTypeSelect.addEventListener('change', updateUI);
    castSpeedSlider.addEventListener('input', updateUI);
    spellSizeSlider.addEventListener('input', updateUI);
    spellVelocitySlider.addEventListener('input', updateUI);
    spellGravitySlider.addEventListener('input', updateUI);

    resetBtn.addEventListener('click', () => {
        spellTypeSelect.value = 'fireball';
        castSpeedSlider.value = '0.3';
        spellSizeSlider.value = '2.5';
        spellVelocitySlider.value = '15';
        spellGravitySlider.value = '10';
        updateUI();
    });

    updateUI();

    // --------------------------------------------------------------------------
    // 04. Input Listeners (Locomotion & Aiming)
    // --------------------------------------------------------------------------
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key in keys) keys[key] = true;
    });

    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key in keys) keys[key] = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        mouse.screenX = e.clientX;
        mouse.screenY = e.clientY;
    });

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0 && !player.isCasting) {
            triggerSpellCasting();
        }
    });

    // Prevent default navigation scrolling with arrow keys inside canvas wrapper context
    canvas.addEventListener('keydown', (e) => {
        if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
            e.preventDefault();
        }
    });

    // --------------------------------------------------------------------------
    // 05. Spell Mechanics (Physics & Casting State Machine)
    // --------------------------------------------------------------------------
    function triggerSpellCasting() {
        player.isCasting = true;
        player.castProgress = 0;
        
        // Calculate angle pointing to mouse
        player.aimAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    }

    function spawnSpell() {
        const angle = player.aimAngle;
        const radius = spellRadiusSetting * METERS_TO_PIXELS;

        if (spellType === 'fireball') {
            // Instantiate projectile spell
            const speed = (velocitySetting * METERS_TO_PIXELS) / 60; // scale to pixels/frame
            activeSpells.push({
                type: 'fireball',
                x: player.x + Math.cos(angle) * player.radius,
                y: player.y + Math.sin(angle) * player.radius,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: radius * 0.4, // fireball visual scale factor
                color: '#f97316',
                glow: 'rgba(249, 115, 22, 0.5)',
                life: 180, // frames
                maxLife: 180
            });
        } else if (spellType === 'lightning') {
            // Raycast instantaneous line beam
            const targetX = player.x + Math.cos(angle) * 800;
            const targetY = player.y + Math.sin(angle) * 800;

            activeSpells.push({
                type: 'lightning',
                sx: player.x,
                sy: player.y,
                tx: targetX,
                ty: targetY,
                angle: angle,
                width: radius * 0.25,
                color: '#60a5fa',
                glow: 'rgba(96, 165, 250, 0.7)',
                life: 20,
                maxLife: 20
            });

            // Cast spark explosion at mouse location
            createExplosion(mouse.x, mouse.y, '#60a5fa', 15);
        } else if (spellType === 'meteor') {
            // Spawn gravity based mortar spell
            const targetX = mouse.x;
            const targetY = mouse.y;
            const meteorRadius = radius * 0.5;

            // Falling physics variables
            const fallHeight = 400; // spawn off-screen top
            const startX = targetX - 100;
            const startY = targetY - fallHeight;

            activeSpells.push({
                type: 'meteor',
                tx: targetX,
                ty: targetY,
                x: startX,
                y: startY,
                vx: 100 / 60, // slow slide drift along X axis
                vy: 0,        // accelerated by gravity
                gravity: (gravitySetting * 9.8 * METERS_TO_PIXELS) / (3600), // scale pixel gravity per frame
                radius: meteorRadius,
                aoeRadius: radius,
                color: '#ef4444',
                glow: 'rgba(239, 68, 68, 0.6)',
                life: 1, // trigger based lifecycle
                exploding: false
            });
        }
    }

    // --------------------------------------------------------------------------
    // 06. Particle Physics Engine
    // --------------------------------------------------------------------------
    class VisualParticle {
        constructor(x, y, color, size, vx, vy, life) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.vx = vx;
            this.vy = vy;
            this.life = life;
            this.maxLife = life;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.life--;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.life / this.maxLife;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    function createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            particles.push(new VisualParticle(
                x, y, color,
                Math.random() * 4 + 2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.floor(Math.random() * 20 + 20)
            ));
        }
    }

    function spawnSpellTrail(x, y, color, size) {
        if (Math.random() < 0.35) {
            const angle = Math.random() * Math.PI * 2;
            const drift = Math.random() * 0.8;
            particles.push(new VisualParticle(
                x, y, color,
                Math.random() * size * 0.4 + 1.5,
                Math.cos(angle) * drift - 0.2,
                Math.sin(angle) * drift - 0.2,
                Math.floor(Math.random() * 15 + 10)
            ));
        }
    }

    // --------------------------------------------------------------------------
    // 07. Main Simulation & Rendering Loop
    // --------------------------------------------------------------------------
    function animate() {
        // Clear frame with tech grid overlay
        ctx.fillStyle = '#06060c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw isometric Grid Background lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        const gridSpacing = 40;
        for (let x = 0; x < canvas.width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        // --- Player Controller Locomotion & State Update ---
        if (!player.isCasting) {
            // Apply standard WASD forces
            let dx = 0;
            let dy = 0;
            if (keys.w) dy -= 1;
            if (keys.s) dy += 1;
            if (keys.a) dx -= 1;
            if (keys.d) dx += 1;

            if (dx !== 0 && dy !== 0) {
                // Normalize diagonal travel speed
                dx *= 0.7071;
                dy *= 0.7071;
            }

            player.x += dx * player.speed;
            player.y += dy * player.speed;

            // Bounds checks
            player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
            player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
        } else {
            // Charging Cast-Bar State
            const castDurationFrames = castTimeSetting * 60; // 60fps assumption
            player.castProgress += 1 / castDurationFrames;

            if (player.castProgress >= 1) {
                player.isCasting = false;
                spawnSpell();
            }
        }

        // --- Render Player Character ---
        ctx.save();
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.shadowBlur = player.isCasting ? 22 : 12;
        ctx.shadowColor = player.color;
        ctx.fill();
        ctx.restore();

        // Draw inner mechanical orb core
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw dynamic casting circular overlay bar
        if (player.isCasting) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 6, -Math.PI / 2, (-Math.PI / 2) + (Math.PI * 2 * player.castProgress));
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }

        // --- Render Aiming Pointer dotted guide line ---
        if (!player.isCasting) {
            player.aimAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        }
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = player.isCasting ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();
        ctx.restore();

        // --- Update & Draw Particles ---
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].life <= 0) {
                particles.splice(i, 1);
            }
        }

        // --- Update & Draw Active Spells ---
        for (let i = activeSpells.length - 1; i >= 0; i--) {
            const s = activeSpells[i];

            if (s.type === 'fireball') {
                s.x += s.vx;
                s.y += s.vy;
                s.life--;

                spawnSpellTrail(s.x, s.y, '#f97316', s.radius);

                // Draw fireball core
                ctx.save();
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fillStyle = s.color;
                ctx.shadowBlur = 18;
                ctx.shadowColor = s.glow;
                ctx.fill();
                ctx.restore();

                // Check lifecycle expiration or out of bounds
                if (s.life <= 0 || s.x < 0 || s.x > canvas.width || s.y < 0 || s.y > canvas.height) {
                    createExplosion(s.x, s.y, '#f97316', 15);
                    activeSpells.splice(i, 1);
                }
            } else if (s.type === 'lightning') {
                s.life--;

                // Render crackling electrical beam
                ctx.save();
                ctx.shadowBlur = 24;
                ctx.shadowColor = s.glow;
                ctx.strokeStyle = s.color;
                ctx.lineWidth = s.width * (s.life / s.maxLife); // shrink beam as it fades
                ctx.beginPath();
                ctx.moveTo(s.sx, s.sy);

                // Generate lightning zigzag offsets
                const segmentCount = 10;
                let currentX = s.sx;
                let currentY = s.sy;
                const totalDist = Math.sqrt((s.tx - s.sx) * (s.tx - s.sx) + (s.ty - s.sy) * (s.ty - s.sy));

                for (let j = 1; j <= segmentCount; j++) {
                    const progress = j / segmentCount;
                    const nextBaseX = s.sx + Math.cos(s.angle) * totalDist * progress;
                    const nextBaseY = s.sy + Math.sin(s.angle) * totalDist * progress;

                    if (j < segmentCount) {
                        // Offset segments perpendicular to the beam axis
                        const normalAngle = s.angle + Math.PI / 2;
                        const offset = (Math.random() - 0.5) * 16;
                        currentX = nextBaseX + Math.cos(normalAngle) * offset;
                        currentY = nextBaseY + Math.sin(normalAngle) * offset;
                    } else {
                        currentX = s.tx;
                        currentY = s.ty;
                    }
                    ctx.lineTo(currentX, currentY);
                }
                ctx.stroke();

                // Core inner electric filament
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = Math.max(1, s.width * 0.3 * (s.life / s.maxLife));
                ctx.stroke();
                ctx.restore();

                if (s.life <= 0) {
                    activeSpells.splice(i, 1);
                }
            } else if (s.type === 'meteor') {
                // Draw target ground warning indicator circle
                ctx.save();
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([2, 4]);
                ctx.beginPath();
                ctx.arc(s.tx, s.ty, s.aoeRadius, 0, Math.PI * 2);
                ctx.stroke();

                // Pulse core fill
                ctx.fillStyle = 'rgba(239, 68, 68, 0.03)';
                ctx.fill();
                ctx.restore();

                if (!s.exploding) {
                    // Update falling meteor physics
                    s.vy += s.gravity; // Gravity velocity integration
                    s.x += s.vx;
                    s.y += s.vy;

                    spawnSpellTrail(s.x, s.y, '#ef4444', s.radius);

                    // Render meteor projectile
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                    ctx.fillStyle = s.color;
                    ctx.shadowBlur = 16;
                    ctx.shadowColor = s.glow;
                    ctx.fill();
                    ctx.restore();

                    // Check ground impact event
                    if (s.y >= s.ty) {
                        s.exploding = true;
                        s.life = 25; // explosion duration frames
                        s.maxLife = 25;
                        createExplosion(s.tx, s.ty, '#ef4444', 35);
                    }
                } else {
                    // Exploding shockwave growth phase
                    s.life--;
                    const progress = 1 - (s.life / s.maxLife);
                    const currentExplosionRadius = s.aoeRadius * progress;

                    // Shockwave circle ring
                    ctx.save();
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 4 * (1 - progress);
                    ctx.beginPath();
                    ctx.arc(s.tx, s.ty, currentExplosionRadius, 0, Math.PI * 2);
                    ctx.stroke();

                    // Fire filling glow
                    ctx.fillStyle = `rgba(239, 68, 68, ${0.35 * (1 - progress)})`;
                    ctx.beginPath();
                    ctx.arc(s.tx, s.ty, currentExplosionRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    if (s.life <= 0) {
                        activeSpells.splice(i, 1);
                    }
                }
            }
        }

        requestAnimationFrame(animate);
    }
    animate();
});
