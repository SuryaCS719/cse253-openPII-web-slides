// OpenPII Watcher Presentation JavaScript

class Presentation {
    constructor() {
        this.currentSlide = 1;
        this.totalSlides = document.querySelectorAll('.slide').length;
        this.init();
    }

    init() {
        // Setup event listeners
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevSlide());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                this.nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.prevSlide();
            } else if (e.key === 'Home') {
                e.preventDefault();
                this.goToSlide(1);
            } else if (e.key === 'End') {
                e.preventDefault();
                this.goToSlide(this.totalSlides);
            }
        });

        // Touch swipe support for mobile
        let touchStartX = 0;
        let touchEndX = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        const handleSwipe = () => {
            if (touchEndX < touchStartX - 50) {
                this.nextSlide();
            }
            if (touchEndX > touchStartX + 50) {
                this.prevSlide();
            }
        };

        this.handleSwipe = handleSwipe;

        // Update initial state
        this.updateSlideCounter();
        this.updateProgress();
        this.updateNavigationButtons();
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides) {
            this.goToSlide(this.currentSlide + 1);
        }
    }

    prevSlide() {
        if (this.currentSlide > 1) {
            this.goToSlide(this.currentSlide - 1);
        }
    }

    goToSlide(slideNumber) {
        if (slideNumber < 1 || slideNumber > this.totalSlides) return;

        const slides = document.querySelectorAll('.slide');
        const currentSlideElement = slides[this.currentSlide - 1];
        const nextSlideElement = slides[slideNumber - 1];

        // Remove active class from current slide
        currentSlideElement.classList.remove('active');

        // Add appropriate transition class
        if (slideNumber > this.currentSlide) {
            currentSlideElement.classList.add('prev');
            nextSlideElement.classList.remove('prev');
        } else {
            currentSlideElement.classList.remove('prev');
        }

        // Activate new slide
        nextSlideElement.classList.add('active');

        // Update current slide number
        this.currentSlide = slideNumber;

        // Update UI
        this.updateSlideCounter();
        this.updateProgress();
        this.updateNavigationButtons();

        // Scroll to top of slide
        nextSlideElement.scrollTop = 0;
    }

    updateSlideCounter() {
        document.getElementById('slideCounter').textContent = `${this.currentSlide} / ${this.totalSlides}`;
    }

    updateProgress() {
        const progress = (this.currentSlide / this.totalSlides) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');

        prevBtn.disabled = this.currentSlide === 1;
        nextBtn.disabled = this.currentSlide === this.totalSlides;
    }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const presentation = new Presentation();

    // Add fullscreen toggle (F key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Add print functionality (P key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            window.print();
        }
    });

    // Show keyboard shortcuts on ? key
    document.addEventListener('keydown', (e) => {
        if (e.key === '?') {
            showKeyboardShortcuts();
        }
    });

    function showKeyboardShortcuts() {
        const shortcuts = `
Keyboard Shortcuts:
→ or Space: Next slide
← : Previous slide
Home: First slide
End: Last slide
F: Toggle fullscreen
P: Print
?: Show this help
        `;
        alert(shortcuts);
    }

    console.log('Presentation initialized');
    console.log('Keyboard shortcuts: → (next), ← (prev), F (fullscreen), ? (help)');
});

