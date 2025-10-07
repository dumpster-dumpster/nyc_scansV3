/**
 * IndexedDB Cache Manager for Gaussian Splat Files
 * Handles caching of processed splat data to improve loading performance
 */

class SplatCache {
    constructor() {
        this.dbName = 'SplatCacheDB';
        this.dbVersion = 1;
        this.storeName = 'splatData';
        this.maxCacheSize = 500 * 1024 * 1024; // 500MB max cache size
        this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        this.db = null;
    }

    /**
     * Initialize the IndexedDB database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create the object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('size', 'size', { unique: false });
                    console.log('🗃️ Created splat cache object store');
                }
            };
        });
    }

    /**
     * Generate a consistent cache key from a splat file URL
     */
    generateCacheKey(splatUrl) {
        // Handle Dropbox URLs - extract file identifier
        if (splatUrl.includes('dropbox.com')) {
            const match = splatUrl.match(/\/scl\/fi\/([^\/]+)/);
            if (match) {
                return `dropbox_${match[1]}`;
            }
        }
        
        // For other URLs, use the filename and last modified info
        const url = new URL(splatUrl);
        const filename = url.pathname.split('/').pop();
        const params = url.searchParams.toString();
        
        // Create a hash-like key from URL components
        const keyString = `${filename}_${params}`;
        return keyString.replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    /**
     * Check if cache is available and initialized
     */
    isAvailable() {
        return this.db !== null && 'indexedDB' in window;
    }

    /**
     * Get cached splat data
     */
    async get(splatUrl) {
        if (!this.isAvailable()) {
            return null;
        }

        const key = this.generateCacheKey(splatUrl);
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            
            return new Promise((resolve, reject) => {
                const request = store.get(key);
                
                request.onsuccess = () => {
                    const result = request.result;
                    
                    if (!result) {
                        console.log('💾 Cache miss for:', key);
                        resolve(null);
                        return;
                    }

                    // Check if cache entry has expired
                    const now = Date.now();
                    if (now - result.timestamp > this.maxAge) {
                        console.log('⏰ Cache entry expired for:', key);
                        this.delete(key); // Clean up expired entry
                        resolve(null);
                        return;
                    }

                    console.log('✅ Cache hit for:', key, `(${(result.size / 1024 / 1024).toFixed(2)} MB)`);
                    resolve({
                        buffer: result.buffer,
                        vertexCount: result.vertexCount,
                        metadata: result.metadata
                    });
                };

                request.onerror = () => {
                    console.error('❌ Error reading from cache:', request.error);
                    resolve(null);
                };
            });
        } catch (error) {
            console.error('❌ Cache get error:', error);
            return null;
        }
    }

    /**
     * Store splat data in cache
     */
    async set(splatUrl, buffer, vertexCount, metadata = {}) {
        if (!this.isAvailable()) {
            return false;
        }

        const key = this.generateCacheKey(splatUrl);
        const size = buffer.byteLength;
        
        try {
            // Check if we need to clean up cache before storing
            await this.ensureCacheSpace(size);

            const cacheData = {
                key,
                buffer,
                vertexCount,
                metadata,
                timestamp: Date.now(),
                size,
                url: splatUrl
            };

            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve, reject) => {
                const request = store.put(cacheData);
                
                request.onsuccess = () => {
                    console.log('💾 Cached splat data:', key, `(${(size / 1024 / 1024).toFixed(2)} MB)`);
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('❌ Error storing to cache:', request.error);
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('❌ Cache set error:', error);
            return false;
        }
    }

    /**
     * Delete a specific cache entry
     */
    async delete(key) {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (error) {
            console.error('❌ Cache delete error:', error);
            return false;
        }
    }

    /**
     * Get current cache size and entry count
     */
    async getCacheStats() {
        if (!this.isAvailable()) {
            return { size: 0, count: 0 };
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve) => {
                const request = store.getAll();
                
                request.onsuccess = () => {
                    const entries = request.result;
                    const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
                    
                    resolve({
                        size: totalSize,
                        count: entries.length,
                        entries: entries.map(e => ({
                            key: e.key,
                            size: e.size,
                            timestamp: e.timestamp,
                            url: e.url
                        }))
                    });
                };

                request.onerror = () => {
                    resolve({ size: 0, count: 0, entries: [] });
                };
            });
        } catch (error) {
            console.error('❌ Error getting cache stats:', error);
            return { size: 0, count: 0, entries: [] };
        }
    }

    /**
     * Ensure there's enough space in cache by removing old entries if needed
     */
    async ensureCacheSpace(newEntrySize) {
        const stats = await this.getCacheStats();
        
        if (stats.size + newEntrySize <= this.maxCacheSize) {
            return; // Enough space available
        }

        console.log('🧹 Cache size limit exceeded, cleaning up old entries...');
        
        // Sort entries by timestamp (oldest first)
        const sortedEntries = stats.entries.sort((a, b) => a.timestamp - b.timestamp);
        
        let spaceToFree = (stats.size + newEntrySize) - this.maxCacheSize;
        let freedSpace = 0;

        for (const entry of sortedEntries) {
            if (freedSpace >= spaceToFree) {
                break;
            }

            await this.delete(entry.key);
            freedSpace += entry.size;
            console.log('🗑️ Removed cache entry:', entry.key, `(${(entry.size / 1024 / 1024).toFixed(2)} MB)`);
        }

        console.log(`✅ Freed ${(freedSpace / 1024 / 1024).toFixed(2)} MB of cache space`);
    }

    /**
     * Clear all cache entries
     */
    async clearAll() {
        if (!this.isAvailable()) {
            return false;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            return new Promise((resolve) => {
                const request = store.clear();
                
                request.onsuccess = () => {
                    console.log('🧹 Cache cleared successfully');
                    resolve(true);
                };

                request.onerror = () => {
                    console.error('❌ Error clearing cache:', request.error);
                    resolve(false);
                };
            });
        } catch (error) {
            console.error('❌ Cache clear error:', error);
            return false;
        }
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            console.log('🔒 Cache database connection closed');
        }
    }
}

// Create a singleton instance
const splatCache = new SplatCache();

export default splatCache;
