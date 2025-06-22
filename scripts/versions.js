// Image Tea Versions Management Script
// Fetches and displays version information from GitHub repository

class VersionManager {
  constructor() {
    this.versions = [];
    this.groupedVersions = {};
  }
  
  async fetchVersions() {
    try {
      const response = await fetch('https://api.github.com/repos/mudrikam/Image-Tea-mini/tags?per_page=100');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tags = await response.json();
      this.versions = tags
        .map(tag => ({
          name: tag.name,
          zipball_url: tag.zipball_url,
          tarball_url: tag.tarball_url,
          commit: tag.commit
        }))
        .filter(version => this.isValidVersion(version.name))
        .sort((a, b) => this.compareVersions(b.name, a.name)); // Descending order
      
      this.groupVersions();
      this.renderVersions();
      
    } catch (error) {
      console.error('Error fetching versions:', error);
      this.showError();
    }
  }
  
  isValidVersion(versionName) {
    // Accept versions like v1.0.0, v2.1, 1.0.0, etc.
    return /^v?\d+\.\d+(\.\d+)?/.test(versionName);
  }
  
  compareVersions(a, b) {
    const cleanA = a.replace(/^v/, '');
    const cleanB = b.replace(/^v/, '');
    
    const partsA = cleanA.split('.').map(Number);
    const partsB = cleanB.split('.').map(Number);
    
    // Pad arrays to same length
    while (partsA.length < 3) partsA.push(0);
    while (partsB.length < 3) partsB.push(0);
    
    for (let i = 0; i < 3; i++) {
      if (partsA[i] !== partsB[i]) {
        return partsA[i] - partsB[i];
      }
    }
    return 0;
  }
  
  groupVersions() {
    this.groupedVersions = {};
    
    this.versions.forEach(version => {
      const majorVersion = this.getMajorVersion(version.name);
      if (!this.groupedVersions[majorVersion]) {
        this.groupedVersions[majorVersion] = [];
      }
      this.groupedVersions[majorVersion].push(version);
    });
  }
  
  getMajorVersion(versionName) {
    const match = versionName.match(/^v?(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
  
  getLatestVersion() {
    return this.versions.length > 0 ? this.versions[0] : null;
  }
  
  formatVersionNumber(versionName) {
    return versionName.startsWith('v') ? versionName : `v${versionName}`;
  }
  
  renderVersions() {
    const container = document.getElementById('versions-container');
    const loadingState = document.getElementById('loading-state');
    
    if (this.versions.length === 0) {
      this.showError();
      return;
    }
    
    const latestVersion = this.getLatestVersion();
    const majorVersions = Object.keys(this.groupedVersions)
      .map(Number)
      .sort((a, b) => b - a); // Descending order
    
    let html = '';
    
    // Current Version Section
    if (latestVersion) {
      html += `
        <div class="row mb-5">
          <div class="col-12">
            <div class="bg-image-tea text-white rounded-4 p-4 text-center">
              <i class="fas fa-star fa-2x mb-3"></i>
              <h3 class="fw-bold mb-2">Versi Terbaru</h3>
              <h4 class="mb-3">${this.formatVersionNumber(latestVersion.name)}</h4>
              <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <a href="${latestVersion.zipball_url}" class="btn btn-light btn-lg">
                  <i class="fas fa-download me-2"></i>Download ZIP
                </a>
                <a href="${latestVersion.tarball_url}" class="btn btn-outline-light btn-lg">
                  <i class="fas fa-file-archive me-2"></i>Download TAR.GZ
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Version Groups
    html += '<div class="row g-4">';
    
    majorVersions.forEach(majorVersion => {
      const versions = this.groupedVersions[majorVersion];
      const isLatestMajor = majorVersion === Math.max(...majorVersions);
      const latestInGroup = versions[0];
      
      html += `
        <div class="col-lg-6 col-xl-4">
          <div class="h-100">
            <div class="bg-body-tertiary rounded-4 p-4 h-100 d-flex flex-column">
              <div class="text-center mb-4">
                <div class="icon-container-lg d-inline-flex align-items-center justify-content-center mb-3">
                  <i class="fas fa-code-branch fa-2x text-image-tea"></i>
                </div>
                <h3 class="fw-bold text-body-emphasis mb-2">
                  v${majorVersion}.x
                  ${isLatestMajor ? '<span class="badge bg-image-tea ms-2">Latest</span>' : ''}
                </h3>
                <p class="text-body-secondary mb-0">
                  ${this.getVersionDescription(majorVersion, versions.length)}
                </p>
              </div>
              
              <div class="flex-grow-1 mb-4">
                <div class="border rounded-3 bg-body">
      `;
      
      versions.slice(0, 8).forEach((version, index) => {
        const isFirst = index === 0;
        html += `
          <div class="d-flex align-items-center justify-content-between p-3 ${index > 0 ? 'border-top' : ''}">
            <div class="d-flex align-items-center">
              <code class="text-image-tea fw-bold">${this.formatVersionNumber(version.name)}</code>
              ${isFirst ? '<span class="badge bg-success ms-2 small">Latest</span>' : ''}
            </div>
            <div class="btn-group btn-group-sm">
              <a href="${version.zipball_url}" class="btn btn-outline-image-tea btn-sm" title="Download ZIP">
                <i class="fas fa-download"></i>
              </a>
            </div>
          </div>
        `;
      });
      
      if (versions.length > 8) {
        html += `
          <div class="text-center p-3 border-top">
            <small class="text-body-secondary">
              +${versions.length - 8} versi lainnya
            </small>
          </div>
        `;
      }
      
      html += `
                </div>
              </div>
              
              <div class="d-grid">
                <a href="${latestInGroup.zipball_url}" class="btn btn-image-tea">
                  <i class="fas fa-download me-2"></i>Download ${this.formatVersionNumber(latestInGroup.name)}
                </a>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // GitHub Link
    html += `
      <div class="mt-5 pt-4 border-top">
        <div class="text-center">
          <p class="text-body-secondary mb-3">
            Lihat semua versi dan changelog lengkap di GitHub
          </p>
          <a href="https://github.com/mudrikam/Image-Tea-mini/tags" target="_blank" class="btn btn-image-tea-outline">
            <i class="fab fa-github me-2"></i>Lihat di GitHub
          </a>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    loadingState.classList.add('d-none');
    container.classList.remove('d-none');
  }
  
  getVersionDescription(majorVersion, count) {
    const descriptions = {
      5: `Versi terbaru dengan fitur terlengkap. ${count} rilis tersedia.`,
      4: `Versi stabil sebelumnya. ${count} rilis tersedia.`,
      3: `Versi legacy yang masih didukung. ${count} rilis tersedia.`,
      2: `Versi lama untuk kompatibilitas. ${count} rilis tersedia.`,
      1: `Versi awal pengembangan. ${count} rilis tersedia.`
    };
    
    return descriptions[majorVersion] || `${count} rilis tersedia untuk versi ${majorVersion}.`;
  }
  
  showError() {
    document.getElementById('loading-state').classList.add('d-none');
    document.getElementById('error-state').classList.remove('d-none');
  }
}

// Initialize version manager when page loads
document.addEventListener('DOMContentLoaded', () => {
  const versionManager = new VersionManager();
  versionManager.fetchVersions();
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VersionManager;
}