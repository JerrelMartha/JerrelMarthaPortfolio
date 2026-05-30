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
    // 02. Interactive Canvas Particles Background
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    let mouse = { x: null, y: null, radius: 120 };

    // Setup dimensions
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position only on desktop
    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    // Particle Object Blueprint
    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }

        // Draw individual node
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        // Update positions & bounds checks
        update() {
            if (this.x > canvas.width || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > canvas.height || this.y < 0) {
                this.directionY = -this.directionY;
            }

            // Mouse interact pulling logic
            if (mouse.x !== null && mouse.y !== null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    this.x -= dx * force * 0.03;
                    this.y -= dy * force * 0.03;
                }
            }

            // Regular float update
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    // Determine color schemes dynamically
    function getParticleThemeColor() {
        const theme = htmlElement.getAttribute('data-theme');
        return theme === 'dark' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(13, 148, 136, 0.12)';
    }

    function getLineThemeColor() {
        const theme = htmlElement.getAttribute('data-theme');
        return theme === 'dark' ? 'rgba(139, 92, 246, 0.04)' : 'rgba(124, 58, 237, 0.04)';
    }

    // Populate particles base on viewport size
    function initParticles() {
        particlesArray = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 14000);
        const color = getParticleThemeColor();

        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = Math.random() * (canvas.width - size * 2) + size;
            let y = Math.random() * (canvas.height - size * 2) + size;
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;

            particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
        }
    }

    // Refresh color when theme changes
    window.reinitializeParticleColors = () => {
        const pColor = getParticleThemeColor();
        particlesArray.forEach(p => p.color = pColor);
    };

    // Draw connecting paths between adjacent nodes
    function connectParticles() {
        let opacityValue = 1;
        const lineColor = getLineThemeColor();
        
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let dx = particlesArray[a].x - particlesArray[b].x;
                let dy = particlesArray[a].y - particlesArray[b].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) {
                    ctx.strokeStyle = lineColor;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Animation Loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectParticles();
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
});
