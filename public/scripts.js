document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BizBot Kenya - Initializing...');

    // Mobile Navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Login Modal
    const loginBtn = document.querySelector('a[href="#login"]');
    const loginModal = document.getElementById('loginModal');
    const closeBtn = loginModal?.querySelector('.close');

    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeBtn && loginModal) {
        closeBtn.addEventListener('click', function() {
            loginModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    // Close modal when clicking outside
    if (loginModal) {
        window.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Logging in...';
            submitBtn.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
                // Show success message (in a real app, this would handle actual authentication)
                showMessage('Login successful! Redirecting to dashboard...', 'success');
                
                // Close modal after delay
                setTimeout(() => {
                    loginModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    loginForm.reset();
                }, 1500);
            }, 2000);
        });
    }

    // Contact Form Handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Simulate form submission
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                showMessage('Message sent successfully! We\'ll get back to you soon.', 'success');
                contactForm.reset();
            }, 2000);
        });
    }

    // Pricing Card Buttons
    document.querySelectorAll('.pricing-card .btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const planName = this.closest('.pricing-card').querySelector('h3').textContent;
            showMessage(`Starting ${planName} plan...`, 'info');
        });
    });

    // Hero Section Buttons
    const startTrialBtn = document.querySelector('.hero-buttons .btn-primary');
    const watchDemoBtn = document.querySelector('.hero-buttons .btn-secondary');

    if (startTrialBtn) {
        startTrialBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('Starting your free trial...', 'success');
        });
    }

    if (watchDemoBtn) {
        watchDemoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('Opening demo video...', 'info');
        });
    }

    // Header scroll effect
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .testimonial-card, .pricing-card, .kpi-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // KPI Card Animations
    const kpiObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.kpi-value');
                statNumbers.forEach(number => {
                    const finalValue = number.textContent;
                    const numericValue = parseInt(finalValue.replace(/[^\d]/g, ''));
                    
                    if (!isNaN(numericValue)) {
                        animateNumber(number, 0, numericValue, 2000);
                    }
                });
            }
        });
    }, observerOptions);

    // Observe KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
        kpiObserver.observe(card);
    });

    // Number animation function
    function animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const startValue = start;
        const change = end - start;

        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (change * progress));
            element.textContent = element.textContent.replace(/\d+/, currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    // Typing Effect for Hero Title
    const heroTitle = document.querySelector('.hero-text h1');
    if (heroTitle) {
        const titleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const text = entry.target.textContent;
                    entry.target.textContent = '';
                    entry.target.style.borderRight = '2px solid var(--primary-color)';
                    
                    let i = 0;
                    const typeWriter = () => {
                        if (i < text.length) {
                            entry.target.textContent += text.charAt(i);
                            i++;
                            setTimeout(typeWriter, 50);
                        } else {
                            entry.target.style.borderRight = 'none';
                        }
                    };
                    typeWriter();
                    titleObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        titleObserver.observe(heroTitle);
    }

    // Dashboard Insights Rotation
    const insights = document.querySelectorAll('.insight');
    if (insights.length > 0) {
        let currentInsight = 0;
        
        setInterval(() => {
            insights.forEach((insight, index) => {
                if (index === currentInsight) {
                    insight.style.opacity = '1';
                    insight.style.transform = 'translateX(0)';
                } else {
                    insight.style.opacity = '0.5';
                    insight.style.transform = 'translateX(-10px)';
                }
            });
            
            currentInsight = (currentInsight + 1) % insights.length;
        }, 3000);
    }

    // Pricing Card Hover Effects
    const pricingCards = document.querySelectorAll('.pricing-card');
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Feature Card Stagger Animation
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Testimonials Carousel (if multiple testimonials)
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    if (testimonialCards.length > 1) {
        let currentTestimonial = 0;
        
        setInterval(() => {
            testimonialCards.forEach((card, index) => {
                if (index === currentTestimonial) {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                } else {
                    card.style.opacity = '0.7';
                    card.style.transform = 'scale(0.95)';
                }
            });
            
            currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
        }, 4000);
    }

    // Scroll Progress Indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
        z-index: 10000;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });

    // Theme Toggle (placeholder for future dark mode)
    const themeToggle = document.createElement('button');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.className = 'btn btn-outline';
    themeToggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        z-index: 1000;
        box-shadow: var(--shadow-lg);
    `;

    themeToggle.addEventListener('click', () => {
        showMessage('Dark mode coming soon!', 'info');
    });

    document.body.appendChild(themeToggle);

    // Utility Functions
    function showMessage(text, type = 'info') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success':
                message.style.background = '#00a651';
                break;
            case 'error':
                message.style.background = '#dc3545';
                break;
            case 'warning':
                message.style.background = '#ffc107';
                message.style.color = '#000';
                break;
            default:
                message.style.background = '#007bff';
        }
        
        document.body.appendChild(message);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    // Add CSS animations for messages
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Performance Monitoring
    if ('performance' in window) {
        window.addEventListener('load', () => {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            if (loadTime > 3000) {
                console.warn('Page load time is high:', loadTime + 'ms');
            }
        });
    }

    // Error Handling
    window.addEventListener('error', (e) => {
        console.error('JavaScript Error:', e.error);
    });

    // Track button clicks for analytics
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn')) {
            console.log('Button clicked:', e.target.textContent);
            // In a real app, this would send analytics data
        }
    });

    console.log('✅ BizBot Kenya - Initialization complete!');
});

// Intersection Observer Polyfill for older browsers
if (!window.IntersectionObserver) {
    const script = document.createElement('script');
    script.src = 'https://polyfill.io/v3/polyfill.min.js?features=IntersectionObserver';
    document.head.appendChild(script);
}