import { switchSplat } from './viewer.js';

export async function render            // Use splat properties or fallback to defaults
            const title = splat.name || splat.title || `NYC Scan ${index + 1}`;
            // Fix paths for GitHub Pages compatibility
            const baseUrl = import.meta.env.BASE_URL || '/';
            const defaultPreview = `${baseUrl}splats/previews/default_preview.png`.replace(/\/+/g, '/');
            const finalPreview = splat.preview ? `${baseUrl}${splat.preview}`.replace(/\/+/g, '/') : defaultPreview;
            const id = splat.id || `scan${index + 1}`;
            
            itemElement.innerHTML = `
                <img 
                    src="${finalPreview}" 
                    alt="${title}" 
                    loading="lazy" 
                    onerror="this.src='${defaultPreview}'"
                >`; // Wait for DOM to be ready if needed
    if (document.readyState === 'loading') {
        await new Promise(resolve => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }

    // Wait a bit more for the viewer to create the container
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Use the gallery container created by the viewer
    const container = document.getElementById('gallery-container');
    if (!container) {
        console.error('Gallery container not found. Make sure renderViewer() is called first.');
        return;
    }

    // Create gallery structure as a horizontal thumbnail strip
    const galleryHTML = `
        <div class="gallery-strip" id="gallery-strip">
            <div class="loading">Loading thumbnails...</div>
        </div>
    `;

    container.innerHTML = galleryHTML;

    // Now safely populate the gallery
    const galleryStrip = document.getElementById('gallery-strip');
    if (!galleryStrip) {
        console.error('Gallery strip element not found after creation');
        return;
    }

    try {
        await populateGallery(galleryStrip);
    } catch (error) {
        console.error('Error populating gallery:', error);
        galleryStrip.innerHTML = '<p class="error-message">Error loading gallery items. Please check that splats.json exists and is properly formatted.</p>';
    }
}

async function populateGallery(galleryStrip) {
    try {
        // Fetch splats.json from the public directory using base URL for GitHub Pages compatibility
        const baseUrl = import.meta.env.BASE_URL || '/';
        const splatJsonUrl = `${baseUrl}splats/splats.json`.replace(/\/+/g, '/');
        const response = await fetch(splatJsonUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch splats.json: ${response.status} ${response.statusText}`);
        }
        
        const splatsData = await response.json();
        
        // Clear loading message
        galleryStrip.innerHTML = '';
        
        // Check if splatsData is an array or has a splats property
        const splats = Array.isArray(splatsData) ? splatsData : splatsData.splats || [];
        
        if (splats.length === 0) {
            galleryStrip.innerHTML = '<p class="error-message">No scans available in the gallery.</p>';
            return;
        }

        // Create thumbnail images from splats data
        splats.forEach((splat, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'gallery-item';
            
            // Use splat properties or fallback to defaults
            const title = splat.name || splat.title || `NYC Scan ${index + 1}`;
            const preview = splat.preview || splat.thumbnail || '/splats/previews/default_preview.png';
            // Fix paths for GitHub Pages compatibility
            const baseUrl = import.meta.env.BASE_URL || '/';
            const finalPreview = splat.preview ? `${baseUrl}${splat.preview}`.replace(/\/+/g, '/') : preview;
            const id = splat.id || `scan${index + 1}`;
            
            itemElement.innerHTML = `
                <img 
                    src="${finalPreview}" 
                    alt="${title}" 
                    loading="lazy" 
                    onerror="this.src='/splats/previews/default_preview.png'"
                >
            `;
            
            // Add click handler to switch splats
            itemElement.addEventListener('click', () => {
                switchSplat(id);
                
                // Update visual selection
                document.querySelectorAll('.gallery-item').forEach(item => {
                    item.classList.remove('selected');
                });
                itemElement.classList.add('selected');
            });

            // Add touch event handlers for mobile
            itemElement.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent default touch behavior
                // Touch feedback is handled by CSS hover states
            });

            itemElement.addEventListener('touchend', (e) => {
                e.preventDefault(); // Prevent default touch behavior and click event
                switchSplat(id);
                
                // Update visual selection
                document.querySelectorAll('.gallery-item').forEach(item => {
                    item.classList.remove('selected');
                });
                itemElement.classList.add('selected');
            });

            itemElement.addEventListener('touchcancel', () => {
                // Touch cancel handled by CSS
            });
            
            // Hover effects are now handled by CSS
            
            galleryStrip.appendChild(itemElement);
        });

    } catch (error) {
        console.error('Error loading splats.json:', error);
        throw error;
    }
}

// Export switchSplat function for external use if needed
export { switchSplat };
