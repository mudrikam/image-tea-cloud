// Image Tea Versions Management
// Handles version loading for both landing page and versions page

// ===== LANDING PAGE VERSION LOADER =====
// Loads latest versions for desktop and online apps on landing page
async function loadLatestVersion() {
    try {
        // Load desktop version from Image-Tea-mini repo
        const desktopResponse = await fetch('https://api.github.com/repos/mudrikam/Image-Tea-mini/releases/latest');
        if (desktopResponse.ok) {
            const desktopData = await desktopResponse.json();

            // Update desktop version display
            const versionElement = document.getElementById('desktop-version');
            if (versionElement) {
                versionElement.textContent = desktopData.tag_name;
                versionElement.title = `Released: ${new Date(desktopData.published_at).toLocaleDateString()}`;
            }

            // Update download link to latest release
            const downloadButton = document.getElementById('download-latest');
            if (downloadButton && desktopData.zipball_url) {
                downloadButton.href = desktopData.zipball_url;
                downloadButton.title = `Download ${desktopData.tag_name}`;
            }
        } else {
            throw new Error('Failed to fetch desktop version');
        }
        // Load online version from image-tea-cloud repo
        const onlineResponse = await fetch('https://api.github.com/repos/mudrikam/image-tea-cloud/releases/latest');
        if (onlineResponse.ok) {
            const onlineData = await onlineResponse.json();

            // Update online version display
            const onlineVersionElement = document.getElementById('online-version');
            if (onlineVersionElement) {
                onlineVersionElement.textContent = `${onlineData.tag_name} Web`;
                onlineVersionElement.title = `Released: ${new Date(onlineData.published_at).toLocaleDateString()}`;
            }
        } else {
            // Try to get latest tag if no releases found
            try {
                const tagsResponse = await fetch('https://api.github.com/repos/mudrikam/image-tea-cloud/tags?per_page=1');
                if (tagsResponse.ok) {
                    const tagsData = await tagsResponse.json();
                    if (tagsData.length > 0) {
                        const onlineVersionElement = document.getElementById('online-version');
                        if (onlineVersionElement) {
                            onlineVersionElement.textContent = `${tagsData[0].name} Web`;
                            onlineVersionElement.title = 'Latest version from tags';
                        }
                    } else {
                        throw new Error('No tags found');
                    }
                } else {
                    throw new Error('Failed to fetch tags');
                }
            } catch (tagError) {
                // Final fallback for online version
                const onlineVersionElement = document.getElementById('online-version');
                if (onlineVersionElement) {
                    onlineVersionElement.textContent = 'v2.1.0 Web';
                    onlineVersionElement.classList.remove('bg-info');
                    onlineVersionElement.classList.add('bg-secondary');
                }
            }
        }

    } catch (error) {
        console.error('Error fetching latest version:', error);

        // Fallback for desktop version
        const versionElement = document.getElementById('desktop-version');
        if (versionElement) {
            versionElement.textContent = 'v2.1.0';
            versionElement.classList.remove('bg-success');
            versionElement.classList.add('bg-secondary');
        }

        // Fallback for online version
        const onlineVersionElement = document.getElementById('online-version');
        if (onlineVersionElement) {
            onlineVersionElement.textContent = 'v2.1.0 Web';
            onlineVersionElement.classList.remove('bg-info');
            onlineVersionElement.classList.add('bg-secondary');
        }
        // Fallback to main branch if API fails
        const downloadButton = document.getElementById('download-latest');
        if (downloadButton) {
            // Keep original href as fallback - should be latest release, not main branch
            downloadButton.title = 'Download latest version';
        }
    }
}

// ===== VERSIONS PAGE MANAGER =====
// Full version management for the dedicated versions page
class VersionManager {
    constructor() {
        this.versions = [];
        this.groupedVersions = {};
        this.webVersion = null;
    }

    async fetchVersions() {
        try {
            // Fetch desktop versions
            const response = await fetch('https://api.github.com/repos/mudrikam/Image-Tea-mini/tags?per_page=100');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const tags = await response.json();

            // Fetch commit details for each tag to get dates
            const versionsWithDates = await Promise.all(
                tags.map(async (tag) => {
                    try {
                        const commitResponse = await fetch(tag.commit.url);
                        if (commitResponse.ok) {
                            const commitData = await commitResponse.json();
                            return {
                                name: tag.name,
                                zipball_url: tag.zipball_url,
                                tarball_url: tag.tarball_url,
                                commit: tag.commit,
                                date: commitData.commit.committer.date
                            };
                        } else {
                            return {
                                name: tag.name,
                                zipball_url: tag.zipball_url,
                                tarball_url: tag.tarball_url,
                                commit: tag.commit,
                                date: null
                            };
                        }
                    } catch (error) {
                        return {
                            name: tag.name,
                            zipball_url: tag.zipball_url,
                            tarball_url: tag.tarball_url,
                            commit: tag.commit,
                            date: null
                        };
                    }
                })
            );

            this.versions = versionsWithDates
                .filter(version => this.isValidVersion(version.name))
                .sort((a, b) => this.compareVersions(b.name, a.name));

            // Fetch web version separately
            await this.fetchWebVersion();

            this.groupVersions();
            this.renderVersions();

        } catch (error) {
            console.error('Error fetching versions:', error);
            this.showError();
        }
    }

    async fetchWebVersion() {
        try {
            // Try to get latest release first
            const releaseResponse = await fetch('https://api.github.com/repos/mudrikam/image-tea-cloud/releases/latest');
            if (releaseResponse.ok) {
                const releaseData = await releaseResponse.json();
                this.webVersion = {
                    name: releaseData.tag_name,
                    date: releaseData.published_at,
                    description: releaseData.body || 'No release notes available',
                    url: releaseData.html_url
                };
            } else {
                // Fallback to tags if no releases
                const tagsResponse = await fetch('https://api.github.com/repos/mudrikam/image-tea-cloud/tags?per_page=1');
                if (tagsResponse.ok) {
                    const tagsData = await tagsResponse.json();
                    if (tagsData.length > 0) {
                        this.webVersion = {
                            name: tagsData[0].name,
                            date: null,
                            description: 'Latest web version from repository tags',
                            url: `https://github.com/mudrikam/image-tea-cloud/tree/${tagsData[0].name}`
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching web version:', error);
            // Set fallback web version
            this.webVersion = {
                name: 'v2.1.0',
                date: null,
                description: 'Current stable web version',
                url: 'https://github.com/mudrikam/image-tea-cloud'
            };
        }
    }

    isValidVersion(versionName) {
        return /^v?\d+\.\d+(\.\d+)?/.test(versionName);
    }

    compareVersions(a, b) {
        const cleanA = a.replace(/^v/, '');
        const cleanB = b.replace(/^v/, '');

        const partsA = cleanA.split('.').map(Number);
        const partsB = cleanB.split('.').map(Number);

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

    formatDate(dateString) {
        if (!dateString) return 'Tanggal tidak tersedia';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Tanggal tidak valid';
        }
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
            .sort((a, b) => b - a);
        let html = ''; // Add web version section first
        if (this.webVersion) {
            html += `
                <div class="row mb-5">
                    <div class="col-12">
                        <div class="bg-info text-white rounded-4 p-4">
                            <div class="row align-items-center">
                                <div class="col-md-8">
                                    <div class="text-center text-md-start">
                                        <div class="d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                                            <i class="fas fa-globe fa-3x me-3 text-white"></i>
                                            <div>
                                                <h3 class="fw-bold mb-1 text-white">Image Tea Web Version</h3>
                                                <h4 class="mb-1 text-white">${this.formatVersionNumber(this.webVersion.name)}</h4>
                                                ${this.webVersion.date ? `<small class="d-block opacity-75">${this.formatDate(this.webVersion.date)}</small>` : '<small class="d-block opacity-75">22 Juni 2025</small>'}
                                            </div>
                                        </div>
                                        <p class="mb-4 opacity-90 fs-6">${this.webVersion.description}</p>
                                        <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-md-start">
                                            <a href="https://www.image-tea.cloud" class="btn btn-light btn-lg">
                                                <i class="fas fa-play me-2"></i>Buka Web App
                                            </a>
                                            <a href="${this.webVersion.url}" target="_blank" class="btn btn-outline-light btn-lg">
                                                <i class="fab fa-github me-2"></i>Lihat di GitHub
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-4 text-center d-none d-md-block">
                                    <i class="fas fa-cloud fa-5x opacity-25"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }        // Desktop versions section
        if (latestVersion) {
            html += `
                <div class="row mb-5">
                    <div class="col-12">
                        <div class="bg-image-tea text-white rounded-4 p-4 text-center">
                            <i class="fas fa-desktop fa-2x mb-3"></i>
                            <h3 class="fw-bold mb-2">Desktop Version Terbaru</h3>
                            <h4 class="mb-2">${this.formatVersionNumber(latestVersion.name)}</h4>
                            <p class="mb-3 opacity-75">${this.formatDate(latestVersion.date)}</p>
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
              <div>
                <code class="text-image-tea fw-bold d-block">${this.formatVersionNumber(version.name)}</code>
                <small class="text-body-secondary">${this.formatDate(version.date)}</small>
              </div>
              ${isFirst ? '<span class="badge bg-success ms-2 small">Latest</span>' : ''}
            </div>            
            <div class="btn-group btn-group-sm">
              <a href="${version.zipball_url}" class="btn btn-outline-image-tea btn-sm hover-success" title="Download ZIP">
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

// ===== INITIALIZATION =====
// Auto-initialize based on page type
document.addEventListener('DOMContentLoaded', () => {
    // Check if this is the versions page
    if (document.getElementById('versions-container')) {
        const versionManager = new VersionManager();
        versionManager.fetchVersions();
    }

    // Check if this is the landing page
    if (document.getElementById('desktop-version') || document.getElementById('online-version')) {
        loadLatestVersion();
    }
});