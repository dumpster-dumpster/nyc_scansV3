import { initSplatViewer } from './splatViewer.js';
import { renderGallery } from './gallery.js';

let currentSplatViewer = null;

export async function renderViewer(itemId) {
  // Clear existing content only if not already set up
  if (!document.getElementById('app-container')) {
    document.body.innerHTML = '';
    
    // Create main app container with overlapping header and gallery
    const appHTML = `
      <div id="app-container">
        <div id="viewer-container">
          <div id="viewer-controls">
            <!-- Controls can be added here if needed -->
          </div>
        </div>
        <div id="header-container">
          <h1 id="header-title">Loading...</h1>
          <p id="header-subtitle">Please wait while content loads</p>
        </div>
        <div id="gallery-container">
          <!-- Gallery thumbnails will be rendered here -->
        </div>
      </div>
    `;
 
    
    document.body.innerHTML = appHTML;
    
    // Render the gallery thumbnails
    await renderGallery();
  }
  
    
  // Wait for DOM to be updated
  await new Promise(resolve => requestAnimationFrame(resolve));

  // Verify container exists before proceeding
  const container = document.getElementById('viewer-container');
  if (!container) {
    throw new Error('Failed to create viewer container');
  }
  
  // Initialize the splat viewer - now using splats.json for file paths
  try {
    const splatFile = await getSplatFileForItem(itemId);
    await updateHeaderContent(itemId);
    await initSplatViewer('viewer-container', splatFile);
  } catch (error) {
    console.error('Failed to initialize splat viewer:', error);
    // Show error message to user
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; background: #333; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h2>Failed to load 3D viewer</h2>
          <p>Error: ${error.message}</p>
          <p>Click a thumbnail below to try loading another scan</p>
        </div>
      </div>
    `;
  }
}

// Function to switch splats without recreating the entire UI
export async function switchSplat(itemId) {
  const container = document.getElementById('viewer-container');
  if (!container) {
    console.error('Viewer container not found');
    return;
  }
  
  try {
    const splatFile = await getSplatFileForItem(itemId);
    await updateHeaderContent(itemId);
    await initSplatViewer('viewer-container', splatFile);
  } catch (error) {
    console.error('Failed to switch splat:', error);
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: white; background: #333; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <h2>Failed to load 3D scan</h2>
          <p>Error: ${error.message}</p>
          <p>Try clicking another thumbnail below</p>
        </div>
      </div>
    `;
  }
}

async function updateHeaderContent(itemId) {
  try {
    // Fetch splats.json to get splat details using base URL for GitHub Pages compatibility
    const baseUrl = import.meta.env.BASE_URL || '/';
    const splatJsonUrl = `${baseUrl}splats/splats.json`.replace(/\/+/g, '/');
    const response = await fetch(splatJsonUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch splats.json: ${response.status} ${response.statusText}`);
    }
    
    const splatsData = await response.json();
    const splats = Array.isArray(splatsData) ? splatsData : splatsData.splats || [];
    
    // Find the splat by ID
    const splat = splats.find(s => s.id === itemId);
    
    // Get header elements
    const titleElement = document.getElementById('header-title');
    const subtitleElement = document.getElementById('header-subtitle');
    
    if (titleElement && subtitleElement) {
      if (splat) {
        // Use splat data to populate header
        titleElement.textContent = splat.name || splat.title || `NYC Scan ${itemId}`;
        subtitleElement.textContent = splat.description || splat.subtitle || 'Interactive 3D Gaussian Splat Viewer';
      } else {
        // Fallback content
        titleElement.textContent = `NYC Scan ${itemId}`;
        subtitleElement.textContent = 'Interactive 3D Gaussian Splat Viewer';
      }
    }
  } catch (error) {
    console.error('Error updating header content:', error);
    // Set fallback content on error
    const titleElement = document.getElementById('header-title');
    const subtitleElement = document.getElementById('header-subtitle');
    
    if (titleElement && subtitleElement) {
      titleElement.textContent = 'NYC Scans Gallery';
      subtitleElement.textContent = 'Interactive 3D Gaussian Splat Viewer';
    }
  }
}

async function getSplatFileForItem(itemId) {
  try {
    // Fetch splats.json to get file paths using base URL for GitHub Pages compatibility
    const baseUrl = import.meta.env.BASE_URL || '/';
    const splatJsonUrl = `${baseUrl}splats/splats.json`.replace(/\/+/g, '/');
    const response = await fetch(splatJsonUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch splats.json: ${response.status} ${response.statusText}`);
    }
    
    const splatsData = await response.json();
    
    // Check if splatsData is an array or has a splats property
    const splats = Array.isArray(splatsData) ? splatsData : splatsData.splats || [];
    
    // Find the splat by ID
    const splat = splats.find(s => s.id === itemId);
    
    if (splat) {
      let splatPath = splat.path || splat.file || splat.url;
      
      // Convert Dropbox sharing URLs to direct download if needed
      if (splatPath.includes('dropbox.com') && splatPath.includes('dl=0')) {
        splatPath = splatPath.replace('dl=0', 'dl=1').replace('dropbox.com', 'dl.dropboxusercontent.com');
        console.log('🔄 Converted Dropbox URL to direct download:', splatPath);
      }
      
      return splatPath;
    }
    
    // Fallback: if no specific item found, use the first available splat
    if (splats.length > 0) {
      const defaultSplat = splats[0];
      let splatPath = defaultSplat.path || defaultSplat.file || defaultSplat.url;
      
      // Convert Dropbox sharing URLs to direct download if needed
      if (splatPath.includes('dropbox.com') && splatPath.includes('dl=0')) {
        splatPath = splatPath.replace('dl=0', 'raw=1').replace('dropbox.com', 'dl.dropboxusercontent.com');
      }
      
      return splatPath;
    }
    
    // Last resort fallback
    throw new Error(`No splat file found for item ID: ${itemId}`);
    
  } catch (error) {
    console.error('Error loading splat file path:', error);
    // Fallback to hardcoded path as last resort
    return 'src/splats/gs_Mailbox_2.ply';
  }
}
