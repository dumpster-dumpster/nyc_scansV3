import { renderGallery } from './gallery.js';
import { renderViewer } from './viewer.js';
import { loadingManager } from './loadingManager.js';

async function getFirstScanId() {
  try {
    loadingManager.addTask('fetch-splats', 'Loading scan data');
    loadingManager.setMessage('Fetching scan data...');
    
    const baseUrl = import.meta.env.BASE_URL || '/';
    const splatJsonUrl = `${baseUrl}splats/splats.json`.replace(/\/+/g, '/');
    const response = await fetch(splatJsonUrl);
    if (!response.ok) {
      loadingManager.completeTask('fetch-splats', 'Using fallback scan');
      return 'scan1'; // fallback
    }

    const splatsData = await response.json();
    const splats = Array.isArray(splatsData) ? splatsData : splatsData.splats || [];
    
    loadingManager.completeTask('fetch-splats', 'Scan data loaded');
    
    if (splats.length > 0) {
      return splats[0].id || 'scan1';
    }
    return 'scan1'; // fallback
  } catch (error) {
    console.warn('Could not load splats.json, using default scan:', error);
    loadingManager.completeTask('fetch-splats', 'Using fallback scan');
    return 'scan1'; // fallback
  }
}async function router() {
  // Start loading
  loadingManager.startLoading('Loading NYC Scans');
  
  const hash = window.location.hash;
  if (hash.startsWith('#/viewer')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    loadingManager.addTask('render-viewer', 'Setting up viewer');
    await renderViewer(params.get('id'));
    loadingManager.completeTask('render-viewer', 'Viewer ready');
  } else {
    // Always render viewer with first available scan to ensure layout is created
    loadingManager.addTask('get-first-scan', 'Finding first scan');
    const firstScanId = await getFirstScanId();
    loadingManager.completeTask('get-first-scan', 'First scan found');
    
    loadingManager.addTask('render-viewer', 'Setting up viewer');
    await renderViewer(firstScanId);
    loadingManager.completeTask('render-viewer', 'Viewer ready');
  }
  
  // Finish loading
  loadingManager.finishLoading();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
