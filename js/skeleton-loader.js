/**
 * Skeleton Loader - Provides loading states and skeleton UI components
 * Creates animated skeleton placeholders for better UX during data loading
 */

class SkeletonLoader {
  constructor() {
    this.activeLoaders = new Set();
  }

  /**
   * Create skeleton table rows
   */
  createTableSkeleton(rows = 5, columns = 6) {
    const skeletonRows = Array.from({ length: rows }, () => {
      const cells = Array.from({ length: columns }, () => 
        '<td><div class="skeleton skeleton-text"></div></td>'
      ).join('');
      return `<tr class="skeleton-row">${cells}</tr>`;
    }).join('');

    return `
      <tbody class="skeleton-tbody">
        ${skeletonRows}
      </tbody>
    `;
  }

  /**
   * Create skeleton card grid
   */
  createCardSkeleton(count = 4) {
    const cards = Array.from({ length: count }, () => `
      <div class="skeleton-card">
        <div class="skeleton skeleton-rect" style="height: 120px; margin-bottom: 12px;"></div>
        <div class="skeleton skeleton-text" style="width: 80%; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-text" style="width: 60%;"></div>
      </div>
    `).join('');

    return `<div class="skeleton-grid">${cards}</div>`;
  }

  /**
   * Create skeleton list items
   */
  createListSkeleton(count = 5) {
    const items = Array.from({ length: count }, () => `
      <div class="skeleton-list-item">
        <div class="skeleton skeleton-circle" style="width: 40px; height: 40px; margin-right: 12px;"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-text" style="width: 70%; margin-bottom: 8px;"></div>
          <div class="skeleton skeleton-text" style="width: 50%;"></div>
        </div>
      </div>
    `).join('');

    return `<div class="skeleton-list">${items}</div>`;
  }

  /**
   * Create skeleton form
   */
  createFormSkeleton(fields = 4) {
    const formFields = Array.from({ length: fields }, () => `
      <div class="form-field">
        <div class="skeleton skeleton-text" style="width: 30%; height: 16px; margin-bottom: 8px;"></div>
        <div class="skeleton skeleton-rect" style="height: 40px;"></div>
      </div>
    `).join('');

    return `<div class="skeleton-form">${formFields}</div>`;
  }

  /**
   * Show skeleton loader in container
   */
  show(containerId, type = 'table', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[SkeletonLoader] Container not found: ${containerId}`);
      return;
    }

    // Store original content
    if (!container.dataset.originalContent) {
      container.dataset.originalContent = container.innerHTML;
    }

    // Generate skeleton based on type
    let skeletonHTML = '';
    switch (type) {
      case 'table':
        skeletonHTML = this.createTableSkeleton(options.rows, options.columns);
        break;
      case 'cards':
        skeletonHTML = this.createCardSkeleton(options.count);
        break;
      case 'list':
        skeletonHTML = this.createListSkeleton(options.count);
        break;
      case 'form':
        skeletonHTML = this.createFormSkeleton(options.fields);
        break;
      default:
        skeletonHTML = '<div class="skeleton skeleton-text" style="width: 100%; height: 20px;"></div>';
    }

    // Add skeleton to container
    container.innerHTML = skeletonHTML;
    container.classList.add('skeleton-loading');
    
    // Track active loader
    this.activeLoaders.add(containerId);
    
    console.log(`[SkeletonLoader] Showing ${type} skeleton in ${containerId}`);
  }

  /**
   * Hide skeleton loader and restore original content
   */
  hide(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[SkeletonLoader] Container not found: ${containerId}`);
      return;
    }

    // Restore original content
    if (container.dataset.originalContent) {
      container.innerHTML = container.dataset.originalContent;
      delete container.dataset.originalContent;
    }

    container.classList.remove('skeleton-loading');
    this.activeLoaders.delete(containerId);
    
    console.log(`[SkeletonLoader] Hidden skeleton in ${containerId}`);
  }

  /**
   * Show loading spinner
   */
  showSpinner(elementId, text = 'Loading...') {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`[SkeletonLoader] Element not found: ${elementId}`);
      return;
    }

    // Store original content
    if (!element.dataset.originalContent) {
      element.dataset.originalContent = element.innerHTML;
    }

    element.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span class="loading-text">${text}</span>
      </div>
    `;
    element.classList.add('loading');
    
    console.log(`[SkeletonLoader] Showing spinner in ${elementId}`);
  }

  /**
   * Hide loading spinner
   */
  hideSpinner(elementId) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.warn(`[SkeletonLoader] Element not found: ${elementId}`);
      return;
    }

    // Restore original content
    if (element.dataset.originalContent) {
      element.innerHTML = element.dataset.originalContent;
      delete element.dataset.originalContent;
    }

    element.classList.remove('loading');
    
    console.log(`[SkeletonLoader] Hidden spinner in ${elementId}`);
  }

  /**
   * Hide all active loaders
   */
  hideAll() {
    this.activeLoaders.forEach(containerId => {
      this.hide(containerId);
    });
    this.activeLoaders.clear();
  }
}

// Create global instance
window.SkeletonLoader = new SkeletonLoader();

console.log('[SkeletonLoader] Module loaded');
