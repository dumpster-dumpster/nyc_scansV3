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
  const hash = window.location.hash;
  if (hash.startsWith('#/viewer')) {
    const params = new URLSearchParams(hash.split('?')[1]);
    renderViewer(params.get('id'));
  } else {
    // Always render viewer with first available scan to ensure layout is created
    const firstScanId = await getFirstScanId();
    renderViewer(firstScanId);
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
