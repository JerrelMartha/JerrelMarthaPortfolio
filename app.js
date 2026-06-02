/* ==========================================================================
   INTERACTIVE APPLICATION LAYER
   Jerrel Martha - Portfolio Website
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------------------------
    // 01. Theme Management System
    // --------------------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;

    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        htmlElement.setAttribute('data-theme', savedTheme);
    } else {
        htmlElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
    }

    // Toggle Theme Click Event
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Re-initialize particles if needed or update their color palette
        if (typeof reinitializeParticleColors === 'function') {
            reinitializeParticleColors();
        }
    });

    // --------------------------------------------------------------------------
    // 02. Interactive Mana Wisps & Floating Runes Background
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let stardustArray = [];
    let mouse = { x: null, y: null, radius: 150 };

    // Setup dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    const runesList = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

    class StardustTrail {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 1.5 + 0.4;
            this.alpha = 1;
            this.decay = Math.random() * 0.015 + 0.01;
            this.color = color;
        }
        update() {
            this.alpha -= this.decay;
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 4;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    // Trigger magical shockwave on click
    window.addEventListener('click', (event) => {
        // Skip clicks on active buttons or links
        if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON' || event.target.closest('a') || event.target.closest('button')) {
            return;
        }

        const clickX = event.clientX;
        const clickY = event.clientY;
        const shockwaveRadius = 260;
        const pushForce = 18;

        particlesArray.forEach(p => {
            let dx = p.x - clickX;
            let dy = p.y - clickY;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < shockwaveRadius) {
                let force = (shockwaveRadius - distance) / shockwaveRadius;
                // Outward radial acceleration surge
                p.speedX += (dx / distance) * force * pushForce;
                p.speedY += (dy / distance) * force * pushForce;

                // Boost size and brightness temporarily under pressure
                p.size = Math.min(p.isRune ? 22 : 14, p.size + force * 4);
                p.alpha = Math.min(0.8, p.alpha + force * 0.3);
            }
        });
    });

    class MagicParticle {
        constructor(isRune = false) {
            this.isRune = isRune;
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * canvas.width;
            this.y = initial ? (Math.random() * canvas.height) : (canvas.height + 20);

            this.baseSize = this.isRune ? (Math.random() * 6 + 10) : (Math.random() * 3 + 2);
            this.size = this.baseSize;

            // Base drift speeds
            this.targetSpeedY = -(Math.random() * 0.5 + 0.3);
            this.targetSpeedX = (Math.random() * 0.4) - 0.2;

            this.speedY = this.targetSpeedY;
            this.speedX = this.targetSpeedX;

            this.angle = Math.random() * Math.PI * 2;
            this.spinSpeed = (Math.random() * 0.02) - 0.01;

            this.baseAlpha = Math.random() * 0.4 + 0.15;
            this.alpha = this.baseAlpha;

            if (this.isRune) {
                this.runeChar = runesList[Math.floor(Math.random() * runesList.length)];
            }

            // Oscillation variables
            this.oscSpeed = Math.random() * 0.02 + 0.01;
            this.oscAmount = Math.random() * 0.5 + 0.2;
            this.oscTime = Math.random() * 100;
        }

        update(themeColor) {
            this.oscTime += this.oscSpeed;

            // Shrink and dim back to base values gradually
            if (this.size > this.baseSize) {
                this.size -= 0.03;
            }
            if (this.alpha > this.baseAlpha) {
                this.alpha -= 0.005;
            }

            // Dampen/Restore velocity back to base drift speeds (friction)
            this.speedX = this.speedX * 0.95 + this.targetSpeedX * 0.05;
            this.speedY = this.speedY * 0.95 + this.targetSpeedY * 0.05;

            // Gravity/Vortex pull to mouse
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius * 1.5) {
                    let force = (mouse.radius * 1.5 - distance) / (mouse.radius * 1.5);
                    this.speedX += (dx / distance) * force * 0.15;
                    this.speedY += (dy / distance) * force * 0.15;

                    // Circular orbital swirl bias
                    this.speedX += -(dy / distance) * force * 0.06;
                    this.speedY += (dx / distance) * force * 0.06;
                }
            }

            // Apply velocities
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(this.oscTime) * (this.oscAmount * 0.1);

            // Rotate runes
            if (this.isRune) {
                this.angle += this.spinSpeed;
            }

            // Spawn stardust trails for standard wisps (higher spawn rate when excited!)
            const trailChance = this.size > this.baseSize ? 0.25 : 0.12;
            if (!this.isRune && Math.random() < trailChance) {
                stardustArray.push(new StardustTrail(this.x, this.y, themeColor));
            }

            // Bound checks
            if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
                this.reset(false);
            }
        }

        draw(themeColor) {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.fillStyle = themeColor;
            ctx.shadowBlur = this.isRune ? 8 : 12;
            ctx.shadowColor = themeColor;

            if (this.isRune) {
                // Render rotating ancient rune symbol
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.font = `${this.size}px 'Outfit', -apple-system, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.runeChar, 0, 0);
            } else {
                // Render soft glowing mana wisp
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // Determine color schemes dynamically
    function getParticleThemeColor() {
        const theme = htmlElement.getAttribute('data-theme');
        return theme === 'dark' ? 'rgba(163, 230, 53, 0.4)' : 'rgba(101, 163, 13, 0.35)';
    }

    // Magical Fusion logic (when mana wisps collide, one absorbs the other and grows larger/brighter)
    function checkMagicCollisions() {
        for (let a = 0; a < particlesArray.length; a++) {
            if (particlesArray[a].isRune) continue;

            for (let b = a + 1; b < particlesArray.length; b++) {
                if (particlesArray[b].isRune) continue;

                let dx = particlesArray[b].x - particlesArray[a].x;
                let dy = particlesArray[b].y - particlesArray[a].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let minDist = particlesArray[a].size + particlesArray[b].size;

                if (distance < minDist) { // Direct overlapping collision
                    // Determine consumer (larger wisp absorbs smaller wisp)
                    let consumer = particlesArray[a];
                    let consumed = particlesArray[b];
                    if (particlesArray[b].size > particlesArray[a].size) {
                        consumer = particlesArray[b];
                        consumed = particlesArray[a];
                    }

                    // Transfer energy up to a maximum massive size limit of 22px
                    if (consumer.size < 22) {
                        consumer.size += consumed.size * 0.45;
                        consumer.alpha = Math.min(0.9, consumer.alpha + consumed.alpha * 0.25);

                        // Conservation of momentum: blend velocities on impact
                        consumer.speedX = (consumer.speedX + consumed.speedX) * 0.5;
                        consumer.speedY = (consumer.speedY + consumed.speedY) * 0.5;
                    }

                    // Respawn the consumed wisp at the bottom of the screen as new energy
                    consumed.reset(false);

                    // Break out of inner loop to process the next wisp in the next frame
                    break;
                }
            }
        }
    }

    // Populate particles based on viewport size
    function initParticles() {
        particlesArray = [];
        stardustArray = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 25000);

        for (let i = 0; i < numberOfParticles; i++) {
            const isRune = Math.random() < 0.15;
            particlesArray.push(new MagicParticle(isRune));
        }
    }

    // Refresh color when theme changes
    window.reinitializeParticleColors = () => {
        initParticles();
    };

    // Animation Loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const themeColor = getParticleThemeColor();

        // Update & Draw stardust trails
        for (let i = stardustArray.length - 1; i >= 0; i--) {
            stardustArray[i].update();
            if (stardustArray[i].alpha <= 0) {
                stardustArray.splice(i, 1);
            } else {
                stardustArray[i].draw();
            }
        }

        // Run magical energy coalescence
        checkMagicCollisions();

        // Update & Draw mana wisps and runes
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update(themeColor);
            particlesArray[i].draw(themeColor);
        }

        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();

    // Re-init on resize to keep density balanced
    window.addEventListener('resize', () => {
        initParticles();
    });

    // --------------------------------------------------------------------------
    // 03. Typing Loop Engine
    // --------------------------------------------------------------------------
    const typingSpan = document.getElementById('typing-span');
    if (typingSpan) {
        const roles = ["Gameplay Programmer.", "Game Systems Architect.", "Devtools Developer."];
        let roleIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 100;

        function typeEffect() {
            const currentRole = roles[roleIndex];

            if (isDeleting) {
                charIndex--;
                typingSpeed = 50; // faster deletion
            } else {
                charIndex++;
                typingSpeed = 120; // natural typing speed
            }

            typingSpan.textContent = currentRole.substring(0, charIndex);

            if (!isDeleting && charIndex === currentRole.length) {
                typingSpeed = 2000; // pause at completion of typing
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                typingSpeed = 500; // brief pause before typing next role
            }

            setTimeout(typeEffect, typingSpeed);
        }

        // Begin Typing Loop
        typeEffect();
    }

    // --------------------------------------------------------------------------
    // 04. Reveal on Scroll (Intersection Observer)
    // --------------------------------------------------------------------------
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const skillBars = document.querySelectorAll('.skill-progress');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                // If it is the skills section, animate progress bars
                if (entry.target.id === 'skills') {
                    animateSkills();
                }
            }
        });
    }, {
        threshold: 0.15
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });

    // Animate individual progress bars once visible
    function animateSkills() {
        skillBars.forEach(bar => {
            const finalWidth = bar.getAttribute('style').match(/width:\s*(\d+)%/)[1];
            // Temporarily reset to 0 then animate out smoothly
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = `${finalWidth}%`;
            }, 100);
        });
    }

    // --------------------------------------------------------------------------
    // 05. Navbar Active Link Highlighting (Scroll Spy)
    // --------------------------------------------------------------------------
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let currentSectionId = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;

            // Deduct some threshold to make transition natural
            if (window.scrollY >= (sectionTop - 250)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });

        // Toggle header scrolled styling
        const header = document.getElementById('header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --------------------------------------------------------------------------
    // 06. Mobile Drawer Navigation Controls
    // --------------------------------------------------------------------------
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    // Close mobile menu when nav links are selected
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('open');
            navMenu.classList.remove('open');
        });
    });

    // --------------------------------------------------------------------------
    // 07. Back to Top Button Control
    // --------------------------------------------------------------------------
    const backToTopBtn = document.getElementById('back-to-top-btn');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 600) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // --------------------------------------------------------------------------
    // 08. Form Simulation Layer
    // --------------------------------------------------------------------------
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('form-submit-btn');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();

            // Enable visual progress loading
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            formStatus.className = 'form-status-message';
            formStatus.textContent = '';

            // Simulate server network latency (1.5 seconds)
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;

                // Set success details
                formStatus.classList.add('success');
                formStatus.textContent = "Thank you, Jerrel will get back to you shortly.";

                // Clear fields
                contactForm.reset();

                // Clear success notification after 5 seconds
                setTimeout(() => {
                    formStatus.textContent = '';
                    formStatus.className = 'form-status-message';
                }, 5000);

            }, 1500);
        });
    }

    // --------------------------------------------------------------------------
    // 09. Video Lazy-Loading Engine
    // --------------------------------------------------------------------------
    const lazyVideos = document.querySelectorAll('video[data-src]');

    // We defer heavy video loads until all core page assets have fully completed loading
    window.addEventListener('load', () => {
        lazyVideos.forEach(video => {
            const dataSrc = video.getAttribute('data-src');
            if (dataSrc) {
                const source = document.createElement('source');
                source.src = dataSrc;
                source.type = 'video/mp4';
                video.appendChild(source);
                video.load();
                video.play().catch(err => {
                    console.log("Autoplay deferred:", err);
                });
            }
        });
    });
});
