/**
 * Loading Manager for NYC Scans
 * Handles progress bars, loading overlays, and loading states
 */

class LoadingManager {
    constructor() {
        this.progressBar = null;
        this.loadingOverlay = null;
        this.currentProgress = 0;
        this.isLoading = false;
        this.loadingTasks = new Map();
        this.totalTasks = 0;
        this.completedTasks = 0;
    }

    /**
     * Initialize the loading manager and create DOM elements
     */
    init() {
        this.createProgressBar();
        this.createLoadingOverlay();
    }

    /**
     * Create the progress bar element
     */
    createProgressBar() {
        if (document.getElementById('progress')) {
            this.progressBar = document.getElementById('progress');
        } else {
            this.progressBar = document.createElement('div');
            this.progressBar.id = 'progress';
            this.progressBar.style.width = '0%';
            document.body.appendChild(this.progressBar);
        }
    }

    /**
     * Create the loading overlay
     */
    createLoadingOverlay() {
        if (document.querySelector('.loading-overlay')) {
            this.loadingOverlay = document.querySelector('.loading-overlay');
        } else {
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.className = 'loading-overlay hidden';
            this.loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading NYC Scans</div>
                <div class="loading-progress">Initializing...</div>
            `;
            document.body.appendChild(this.loadingOverlay);
        }
    }

    /**
     * Start loading with optional message
     */
    startLoading(message = 'Loading...') {
        this.isLoading = true;
        this.currentProgress = 0;
        this.totalTasks = 0;
        this.completedTasks = 0;
        this.loadingTasks.clear();

        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.classList.remove('hidden');
        }

        if (this.loadingOverlay) {
            const textElement = this.loadingOverlay.querySelector('.loading-text');
            const progressElement = this.loadingOverlay.querySelector('.loading-progress');
            
            if (textElement) textElement.textContent = message;
            if (progressElement) progressElement.textContent = 'Initializing...';
            
            this.loadingOverlay.classList.remove('hidden');
        }
    }

    /**
     * Update loading progress
     */
    updateProgress(progress, message = null) {
        this.currentProgress = Math.max(0, Math.min(100, progress));
        
        if (this.progressBar) {
            this.progressBar.style.width = `${this.currentProgress}%`;
        }

        if (this.loadingOverlay && message) {
            const progressElement = this.loadingOverlay.querySelector('.loading-progress');
            if (progressElement) {
                progressElement.textContent = `${message} (${Math.round(this.currentProgress)}%)`;
            }
        }
    }

    /**
     * Add a loading task
     */
    addTask(taskId, description = '') {
        this.loadingTasks.set(taskId, { completed: false, description });
        this.totalTasks++;
        this.updateTaskProgress();
    }

    /**
     * Complete a loading task
     */
    completeTask(taskId, message = null) {
        if (this.loadingTasks.has(taskId) && !this.loadingTasks.get(taskId).completed) {
            this.loadingTasks.get(taskId).completed = true;
            this.completedTasks++;
            this.updateTaskProgress(message);
        }
    }

    /**
     * Update progress based on completed tasks
     */
    updateTaskProgress(message = null) {
        if (this.totalTasks > 0) {
            const progress = (this.completedTasks / this.totalTasks) * 100;
            this.updateProgress(progress, message);
        }
    }

    /**
     * Finish loading
     */
    finishLoading(delay = 500) {
        this.updateProgress(100, 'Complete!');
        
        setTimeout(() => {
            this.isLoading = false;
            
            if (this.progressBar) {
                this.progressBar.classList.add('hidden');
            }
            
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.add('hidden');
            }
        }, delay);
    }

    /**
     * Set loading message without changing progress
     */
    setMessage(message) {
        if (this.loadingOverlay) {
            const progressElement = this.loadingOverlay.querySelector('.loading-progress');
            if (progressElement) {
                const currentPercent = Math.round(this.currentProgress);
                progressElement.textContent = `${message} ${currentPercent > 0 ? `(${currentPercent}%)` : ''}`;
            }
        }
    }

    /**
     * Hide loading immediately
     */
    hideLoading() {
        this.isLoading = false;
        
        if (this.progressBar) {
            this.progressBar.classList.add('hidden');
        }
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Show progress bar only (without overlay)
     */
    showProgressOnly() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.add('hidden');
        }
        
        if (this.progressBar) {
            this.progressBar.classList.remove('hidden');
        }
    }
}

// Create and export singleton instance
export const loadingManager = new LoadingManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadingManager.init();
    });
} else {
    loadingManager.init();
}