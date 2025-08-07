// Bold & Poppy Confetti Effects System
class ConfettiEffectsManager {
    constructor() {
        this.confettiContainer = null;
        this.sparkleContainer = null;
        this.isActive = true;
        this.particles = [];
        this.init();
    }

    init() {
        this.createContainers();
        this.startContinuousEffects();
        this.addEventListeners();
    }

    createContainers() {
        // Create confetti container
        this.confettiContainer = document.createElement('div');
        this.confettiContainer.className = 'confetti-container';
        this.confettiContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            overflow: hidden;
        `;
        document.body.appendChild(this.confettiContainer);

        // Create sparkle container
        this.sparkleContainer = document.createElement('div');
        this.sparkleContainer.className = 'sparkle-container';
        this.sparkleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
            overflow: hidden;
        `;
        document.body.appendChild(this.sparkleContainer);
    }

    startContinuousEffects() {
        // Only sparkle effects on user interaction, no continuous floating elements
        // Removed continuous floating emojis and automatic celebration bursts
    }

    createFloatingEmoji() {
        const symbols = ['♡', '◊', '◈', '●', '◐', '◑', '◒', '◓', '▲', '▼', '◆', '□'];
        const emoji = symbols[Math.floor(Math.random() * symbols.length)];
        
        const element = document.createElement('div');
        element.textContent = emoji;
        element.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 30 + 20}px;
            left: ${Math.random() * 100}%;
            top: 100%;
            opacity: 0.7;
            animation: float-up ${8 + Math.random() * 4}s linear forwards;
            z-index: 1000;
        `;

        this.confettiContainer.appendChild(element);

        // Remove after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 12000);
    }

    createSparkle() {
        const sparkle = document.createElement('div');
        sparkle.textContent = '◊';
        sparkle.style.cssText = `
            position: absolute;
            font-size: ${Math.random() * 20 + 15}px;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: 1;
            animation: sparkle-twinkle ${1 + Math.random() * 2}s ease-in-out forwards;
            z-index: 999;
        `;

        this.sparkleContainer.appendChild(sparkle);

        // Remove after animation
        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 3000);
    }

    createCelebrationBurst() {
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * (window.innerHeight * 0.7) + window.innerHeight * 0.15;
        
        const confettiPieces = ['◊', '●', '◈', '♡', '▲', '◆'];
        
        for (let i = 0; i < 12; i++) {
            const piece = document.createElement('div');
            piece.textContent = confettiPieces[Math.floor(Math.random() * confettiPieces.length)];
            
            const angle = (i * 30) * (Math.PI / 180);
            const velocity = 150 + Math.random() * 100;
            const duration = 2 + Math.random() * 1;
            
            piece.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 25 + 20}px;
                left: ${centerX}px;
                top: ${centerY}px;
                opacity: 1;
                z-index: 1001;
                animation: burst-${i} ${duration}s ease-out forwards;
            `;

            // Create unique keyframe for each piece
            this.createBurstAnimation(i, angle, velocity, duration);
            
            this.confettiContainer.appendChild(piece);

            // Remove after animation
            setTimeout(() => {
                if (piece.parentNode) {
                    piece.parentNode.removeChild(piece);
                }
            }, duration * 1000);
        }
    }

    createBurstAnimation(index, angle, velocity, duration) {
        const keyframeName = `burst-${index}`;
        const endX = Math.cos(angle) * velocity;
        const endY = Math.sin(angle) * velocity + 100; // Add gravity effect
        
        const keyframes = `
            @keyframes ${keyframeName} {
                0% {
                    transform: translate(0, 0) rotate(0deg) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translate(${endX}px, ${endY}px) rotate(720deg) scale(0.3);
                    opacity: 0;
                }
            }
        `;

        // Add keyframes to stylesheet
        const style = document.createElement('style');
        style.textContent = keyframes;
        document.head.appendChild(style);

        // Remove style after use
        setTimeout(() => {
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, duration * 1000 + 1000);
    }

    addEventListeners() {
        // Trigger celebration on successful actions
        document.addEventListener('wedding-form-saved', () => {
            this.celebrateSuccess();
        });

        document.addEventListener('preferences-updated', () => {
            this.celebrateSuccess();
        });

        document.addEventListener('setup-completed', () => {
            this.celebrateCompletion();
        });

        // Trigger on button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.btn, .btn-enhanced')) {
                this.createClickBurst(e.clientX, e.clientY);
            }
        });

        // Trigger on card selections
        document.addEventListener('click', (e) => {
            if (e.target.closest('.option-card')) {
                this.createSelectionSparkle(e.clientX, e.clientY);
            }
        });
    }

    celebrateSuccess() {
        // Create multiple celebration bursts
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createCelebrationBurst();
            }, i * 300);
        }
    }

    celebrateCompletion() {
        // Epic celebration sequence
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createCelebrationBurst();
            }, i * 200);
        }

        // Rain of emojis
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createFloatingEmoji();
            }, i * 100);
        }
    }

    createClickBurst(x, y) {
        const sparkles = ['◊', '●', '◈'];
        
        for (let i = 0; i < 6; i++) {
            const sparkle = document.createElement('div');
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            
            const angle = (i * 60) * (Math.PI / 180);
            const distance = 50 + Math.random() * 30;
            
            sparkle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 15 + 10}px;
                left: ${x}px;
                top: ${y}px;
                opacity: 1;
                z-index: 1002;
                animation: click-burst-${i} 0.8s ease-out forwards;
            `;

            // Create animation
            const keyframes = `
                @keyframes click-burst-${i} {
                    0% {
                        transform: translate(0, 0) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0.3);
                        opacity: 0;
                    }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            this.sparkleContainer.appendChild(sparkle);

            // Cleanup
            setTimeout(() => {
                if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
                if (style.parentNode) style.parentNode.removeChild(style);
            }, 800);
        }
    }

    createSelectionSparkle(x, y) {
        const sparkle = document.createElement('div');
        sparkle.innerHTML = '💖';
        
        sparkle.style.cssText = `
            position: absolute;
            font-size: 30px;
            left: ${x - 15}px;
            top: ${y - 15}px;
            opacity: 1;
            z-index: 1002;
            animation: selection-heart 1s ease-out forwards;
        `;

        this.sparkleContainer.appendChild(sparkle);

        setTimeout(() => {
            if (sparkle.parentNode) {
                sparkle.parentNode.removeChild(sparkle);
            }
        }, 1000);
    }

    toggle() {
        this.isActive = !this.isActive;
        
        if (!this.isActive) {
            // Clear existing effects
            this.confettiContainer.innerHTML = '';
            this.sparkleContainer.innerHTML = '';
        }
    }

    destroy() {
        this.isActive = false;
        
        if (this.confettiContainer && this.confettiContainer.parentNode) {
            this.confettiContainer.parentNode.removeChild(this.confettiContainer);
        }
        
        if (this.sparkleContainer && this.sparkleContainer.parentNode) {
            this.sparkleContainer.parentNode.removeChild(this.sparkleContainer);
        }
    }
}

// Add required CSS animations
const confettiStyles = document.createElement('style');
confettiStyles.textContent = `
    @keyframes float-up {
        0% {
            transform: translateY(0) rotate(0deg) scale(0.8);
            opacity: 0;
        }
        10% {
            opacity: 0.7;
            transform: translateY(-50px) rotate(36deg) scale(1);
        }
        90% {
            opacity: 0.7;
            transform: translateY(-90vh) rotate(324deg) scale(1);
        }
        100% {
            transform: translateY(-100vh) rotate(360deg) scale(0.3);
            opacity: 0;
        }
    }

    @keyframes sparkle-twinkle {
        0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
        }
        50% {
            transform: scale(1.2) rotate(180deg);
            opacity: 1;
        }
        100% {
            transform: scale(0) rotate(360deg);
            opacity: 0;
        }
    }

    @keyframes selection-heart {
        0% {
            transform: scale(1);
            opacity: 1;
        }
        50% {
            transform: scale(1.5);
            opacity: 0.8;
        }
        100% {
            transform: scale(2) translateY(-30px);
            opacity: 0;
        }
    }

    /* Disable effects for users who prefer reduced motion */
    @media (prefers-reduced-motion: reduce) {
        .confetti-container,
        .sparkle-container {
            display: none !important;
        }
    }
`;

document.head.appendChild(confettiStyles);

// Initialize effects when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.confettiEffects = new ConfettiEffectsManager();
    });
} else {
    window.confettiEffects = new ConfettiEffectsManager();
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfettiEffectsManager;
} 