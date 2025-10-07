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
                <div class="loading-subtext">Please wait while we load the 3D data</div>
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
        
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.classList.remove('hidden');
        }
        
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('hidden');
            const textElement = this.loadingOverlay.querySelector('.loading-text');
            if (textElement) {
                textElement.textContent = message;
            }
        }
        
        console.log(`🚀 Loading started: ${message}`);
    }

    /**
     * Update progress (0-100) with optional message
     */
    updateProgress(progress, message = null) {
        this.currentProgress = Math.max(0, Math.min(100, progress));
        
        if (this.progressBar) {
            this.progressBar.style.width = `${this.currentProgress}%`;
        }
        
        if (this.loadingOverlay && message) {
            const progressElement = this.loadingOverlay.querySelector('.loading-progress');
            if (progressElement) {
                const currentPercent = Math.round(this.currentProgress);
                progressElement.textContent = `${message} (${currentPercent}%)`;
            }
        }
        
        console.log(`📊 Progress: ${Math.round(this.currentProgress)}% ${message ? '- ' + message : ''}`);
    }

    /**
     * Add a task to track
     */
    addTask(taskId, description = '') {
        this.loadingTasks.set(taskId, { description, completed: false });
        this.totalTasks = this.loadingTasks.size;
        console.log(`📋 Added task: ${taskId} - ${description}`);
    }

    /**
     * Mark a task as completed
     */
    completeTask(taskId, message = null) {
        if (this.loadingTasks.has(taskId)) {
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
     * Update loading text for cache operations
     */
    updateCacheStatus(message, isFromCache = false) {
        const textElement = this.loadingOverlay?.querySelector('.loading-text');
        const spinner = this.loadingOverlay?.querySelector('.loading-spinner');
        
        if (textElement) {
            textElement.textContent = message;
            
            // Add cache indicator styling
            if (isFromCache) {
                textElement.style.color = '#4CAF50'; // Green for cache
                if (spinner) {
                    spinner.style.borderTopColor = '#4CAF50';
                }
            } else {
                textElement.style.color = '#2196F3'; // Blue for download
                if (spinner) {
                    spinner.style.borderTopColor = '#2196F3';
                }
            }
        }
        
        console.log(`📋 Loading status: ${message}`);
    }

    /**
     * Show cache statistics
     */
    async showCacheStats(cacheInstance) {
        if (!cacheInstance) return;
        
        try {
            const stats = await cacheInstance.getCacheStats();
            console.log('📊 Cache Statistics:');
            console.log(`- Total cached items: ${stats.count}`);
            console.log(`- Total cache size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            console.log(`- Cache entries:`, stats.entries);
        } catch (error) {
            console.warn('⚠️ Could not retrieve cache stats:', error);
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