class ImageConverter {
    constructor() {
        this.db = null;
        this.dbName = 'ImageConverterDB';
        this.dbVersion = 1;
        this.storeName = 'images';
        this.images = [];
        this.currentFilter = '';
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.selectedImages = new Set();
        this.init();
    }

    async init() {
        await this.initIndexedDB();
        await this.loadFromStorage();
        this.initializePDFJS();
        this.setupEventListeners();
        this.renderImages();
        this.updateQualityDisplay();
        this.updateCounts();
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
                    console.log('IndexedDB object store created');
                }
            };
        });
    }

    setupEventListeners() {
        // File input and browse button
        document.getElementById('browse-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });

        document.getElementById('file-input').addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        const dropZone = document.getElementById('drop-zone');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = 'rgba(83, 161, 27, 0.1)';
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = 'rgba(83, 161, 27, 0.05)';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.backgroundColor = 'rgba(83, 161, 27, 0.05)';
            this.handleFiles(e.dataTransfer.files);
        });

        // Quality slider
        document.getElementById('quality-slider').addEventListener('input', (e) => {
            document.getElementById('quality-value').textContent = e.target.value;
            this.updateEstimates();
        });

        // Format change
        document.getElementById('format-select').addEventListener('change', () => {
            this.updateEstimates();
        });

        // Resize options
        document.getElementById('resize-select').addEventListener('change', (e) => {
            const customContainer = document.getElementById('custom-size-container');
            if (e.target.value === 'custom') {
                customContainer.classList.remove('d-none');
            } else {
                customContainer.classList.add('d-none');
            }
            this.updateEstimates();
        });

        document.getElementById('custom-width').addEventListener('input', () => {
            this.updateEstimates();
        });

        // Crop preset
        document.getElementById('crop-select').addEventListener('change', () => {
            this.updateEstimates();
        });

        // Search
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.currentFilter = e.target.value.toLowerCase();
            this.currentPage = 1;
            this.renderImages();
        });

        // Bulk actions
        document.getElementById('clear-all-btn').addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin menghapus semua gambar?')) {
                this.clearAll();
            }
        });

        document.getElementById('convert-all-btn').addEventListener('click', () => {
            this.convertSelectedToZip();
        });

        document.getElementById('select-all-btn').addEventListener('click', () => {
            this.selectAll();
        });

        document.getElementById('deselect-all-btn').addEventListener('click', () => {
            this.deselectAll();
        });
    }

    async handleFiles(files) {
        const validFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/') || file.type === 'application/pdf'
        );

        if (validFiles.length === 0) {
            alert('Silakan pilih file gambar atau PDF yang valid');
            return;
        }

        this.showProgress();

        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const progress = ((i + 1) / validFiles.length) * 100;
            this.updateProgress(progress, `Memproses ${file.name}...`);

            try {
                if (file.type === 'application/pdf') {
                    await this.processPDF(file);
                    // Wait a bit for PDF processing to complete
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    const imageData = await this.processFile(file);
                    this.images.push(imageData);
                }
            } catch (error) {
                console.error('Error processing file:', file.name, error);
                // Show user-friendly error message
                alert(`Error memproses file ${file.name}: ${error.message}`);
            }
        }

        this.hideProgress();
        await this.saveToStorage();
        this.renderImages();
        this.updateCounts();
    }

    async processPDF(file) {
        try {
            // Check if PDF.js is available
            if (typeof pdfjsLib === 'undefined') {
                console.warn('PDF.js library not loaded, using placeholder');
                return this.createPDFPlaceholder(file);
            }

            // Load PDF document using the modern API
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/cmaps/',
                cMapPacked: true,
            });
            
            const pdf = await loadingTask.promise;
            
            console.log(`Processing PDF with ${pdf.numPages} pages using PDF.js v5.3.31`);

            // Process each page
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                try {
                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 }); // Higher resolution
                    
                    // Create canvas for rendering
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    // Render page to canvas with improved settings
                    const renderContext = {
                        canvasContext: ctx,
                        viewport: viewport,
                        intent: 'display'
                    };
                    
                    await page.render(renderContext).promise;

                    // Create image data for this page
                    const pdfPageData = {
                        id: Date.now() + Math.random() + pageNum,
                        name: `${file.name.replace('.pdf', '')}_page_${pageNum}.png`,
                        originalName: file.name,
                        size: Math.floor(file.size / pdf.numPages),
                        type: 'image/png',
                        width: viewport.width,
                        height: viewport.height,
                        filePath: canvas.toDataURL('image/png'),
                        thumbnail: canvas.toDataURL('image/png'), // Use same data for thumbnail
                        uploadDate: new Date().toISOString(),
                        isPDF: true,
                        pageNumber: pageNum
                    };
                    
                    this.images.push(pdfPageData);
                    
                    // Update progress for each page
                    this.updateProgress(
                        (pageNum / pdf.numPages) * 100, 
                        `Memproses halaman ${pageNum} dari ${pdf.numPages}...`
                    );
                    
                } catch (pageError) {
                    console.error(`Error processing page ${pageNum}:`, pageError);
                }
            }
            
            console.log(`Successfully processed ${pdf.numPages} pages from PDF`);
            
            // Show success message
            setTimeout(() => {
                alert(`PDF berhasil dikonversi menjadi ${pdf.numPages} halaman gambar!`);
            }, 500);

        } catch (error) {
            console.error('Error processing PDF:', error);
            // Fallback to placeholder if PDF processing fails
            return this.createPDFPlaceholder(file);
        }
    }

    createPDFPlaceholder(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                originalName: file.name,
                size: file.size,
                type: 'application/pdf',
                width: 595,
                height: 842,
                filePath: this.createPDFThumbnail(),
                thumbnail: this.createPDFThumbnail(),
                uploadDate: new Date().toISOString(),
                isPDF: true
            };
            this.images.push(imageData);
        };
        reader.readAsDataURL(file);
    }

    createPDFThumbnail() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 150;
        canvas.height = 200;
        
        // Create a simple PDF icon
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, 150, 200);
        ctx.fillStyle = '#dc3545';
        ctx.font = '16px FontAwesome';
        ctx.textAlign = 'center';
        ctx.fillText('📄', 75, 100);
        ctx.fillStyle = '#6c757d';
        ctx.font = '12px Arial';
        ctx.fillText('PDF', 75, 130);
        
        return canvas.toDataURL('image/png');
    }

    async processFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        originalName: file.name,
                        size: file.size,
                        type: file.type,
                        width: img.width,
                        height: img.height,
                        filePath: e.target.result, // Use data URL for consistent access
                        thumbnail: e.target.result, // Use same data URL for thumbnail
                        uploadDate: new Date().toISOString(),
                        isPDF: false
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    renderImages() {
        const container = document.getElementById('images-container');
        const emptyState = document.getElementById('empty-state');
        const noResultsState = document.getElementById('no-results-state');
        const paginationContainer = document.getElementById('pagination-container');

        const filteredImages = this.images.filter(img => 
            img.name.toLowerCase().includes(this.currentFilter)
        );

        if (this.images.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            noResultsState.style.display = 'none';
            paginationContainer.classList.add('d-none');
            return;
        }

        if (filteredImages.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'none';
            noResultsState.style.display = 'block';
            paginationContainer.classList.add('d-none');
            return;
        }

        emptyState.style.display = 'none';
        noResultsState.style.display = 'none';

        // Pagination
        const totalPages = Math.ceil(filteredImages.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentImages = filteredImages.slice(startIndex, endIndex);

        if (totalPages > 1) {
            paginationContainer.classList.remove('d-none');
            this.renderPagination(totalPages);
        } else {
            paginationContainer.classList.add('d-none');
        }

        container.innerHTML = currentImages.map(img => {
            const estimate = this.calculateEstimate(img);
            const isSelected = this.selectedImages.has(img.id);
            
            return `
                <div class="col-md-6 col-lg-4 col-xl-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="position-relative">
                            <div class="thumbnail-container">
                                <img src="${img.thumbnail || img.filePath}" class="img-fluid" alt="${img.name}">
                            </div>
                            <div class="position-absolute top-0 start-0 m-2">
                                <input type="checkbox" class="form-check-input" 
                                       ${isSelected ? 'checked' : ''}
                                       data-image-id="${img.id}">
                            </div>
                            <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2"
                                    onclick="imageConverter.removeImage('${img.id}')">
                                <i class="fas fa-times"></i>
                            </button>
                            ${img.isPDF && img.pageNumber ? `<div class="position-absolute bottom-0 start-0 m-2"><span class="badge bg-danger">PDF Page ${img.pageNumber}</span></div>` : 
                              img.isPDF ? '<div class="position-absolute bottom-0 start-0 m-2"><span class="badge bg-danger">PDF</span></div>' : ''}
                        </div>
                        <div class="card-body d-flex flex-column p-3">
                            <h6 class="card-title text-truncate mb-2" title="${img.name}">${img.name}</h6>
                            <div class="small text-body-secondary mb-2">
                                <div>${img.width} × ${img.height} px</div>
                                <div>Ukuran: ${this.formatFileSize(img.size)}</div>
                                <div class="text-success">Target: ~${estimate.size} (${estimate.format})</div>
                                <div class="text-info">Estimasi: ${estimate.compression}</div>
                            </div>
                            <div class="mt-auto d-grid gap-2">
                                <button class="btn btn-image-tea btn-sm"
                                        onclick="imageConverter.convertImage('${img.id}')">
                                    <i class="fas fa-download me-1"></i>Konversi & Unduh
                                </button>
                                <button class="btn btn-outline-secondary btn-sm"
                                        onclick="imageConverter.previewImage('${img.id}')">
                                    <i class="fas fa-eye me-1"></i>Preview
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners for checkboxes
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const imageId = e.target.getAttribute('data-image-id');
                this.handleCheckboxChange(imageId, e.target.checked);
            });
        });
    }

    renderPagination(totalPages) {
        const pageNumbers = document.getElementById('page-numbers');
        const prevPage = document.getElementById('prev-page');
        const nextPage = document.getElementById('next-page');

        // Clear existing page numbers
        pageNumbers.innerHTML = '';

        // Previous button
        if (this.currentPage > 1) {
            prevPage.classList.remove('disabled');
            prevPage.onclick = () => {
                this.currentPage--;
                this.renderImages();
            };
        } else {
            prevPage.classList.add('disabled');
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                const pageItem = document.createElement('li');
                pageItem.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
                pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
                pageItem.onclick = () => {
                    this.currentPage = i;
                    this.renderImages();
                };
                pageNumbers.appendChild(pageItem);
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                const ellipsis = document.createElement('li');
                ellipsis.className = 'page-item disabled';
                ellipsis.innerHTML = '<span class="page-link">...</span>';
                pageNumbers.appendChild(ellipsis);
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            nextPage.classList.remove('disabled');
            nextPage.onclick = () => {
                this.currentPage++;
                this.renderImages();
            };
        } else {
            nextPage.classList.add('disabled');
        }
    }

    calculateEstimate(image) {
        const format = document.getElementById('format-select').value;
        const quality = parseInt(document.getElementById('quality-slider').value) / 100;
        const resizeOption = document.getElementById('resize-select').value;
        
        let estimatedSize = image.size;
        let targetFormat = format.toUpperCase();
        
        // Calculate size reduction based on format
        switch (format) {
            case 'jpeg':
                estimatedSize = image.size * quality * 0.7;
                break;
            case 'webp':
                estimatedSize = image.size * quality * 0.5;
                break;
            case 'avif':
                estimatedSize = image.size * quality * 0.3;
                break;
            case 'png':
                estimatedSize = image.size * 0.9;
                break;
        }
        
        // Apply resize reduction
        if (resizeOption && resizeOption !== 'custom') {
            const percentage = parseInt(resizeOption) / 100;
            estimatedSize = estimatedSize * (percentage * percentage);
        } else if (resizeOption === 'custom') {
            const customWidth = parseInt(document.getElementById('custom-width').value) || image.width;
            const ratio = customWidth / image.width;
            estimatedSize = estimatedSize * (ratio * ratio);
        }
        
        const compression = ((image.size - estimatedSize) / image.size * 100).toFixed(1);
        
        return {
            size: this.formatFileSize(estimatedSize),
            format: targetFormat,
            compression: compression > 0 ? `-${compression}%` : 'Tidak ada kompresi'
        };
    }

    updateEstimates() {
        // Re-render images when estimates need to be updated
        // This ensures estimates reflect current settings
        this.renderImages();
    }

    toggleSelection(imageId, checked) {
        if (checked) {
            this.selectedImages.add(imageId);
        } else {
            this.selectedImages.delete(imageId);
        }
        this.updateCounts();
        // Don't re-render images to avoid resetting checkboxes
    }

    selectAll() {
        const filteredImages = this.images.filter(img => 
            img.name.toLowerCase().includes(this.currentFilter)
        );
        filteredImages.forEach(img => this.selectedImages.add(img.id));
        this.updateCounts();
        // Update checkboxes manually without re-rendering
        this.updateCheckboxes();
    }

    deselectAll() {
        this.selectedImages.clear();
        this.updateCounts();
        // Update checkboxes manually without re-rendering
        this.updateCheckboxes();
    }

    updateCheckboxes() {
        // Use the new method to update display
        this.updateSelectionDisplay();
    }

    handleCheckboxChange(imageId, checked) {
        // Handle individual checkbox changes without re-rendering
        if (checked) {
            this.selectedImages.add(imageId);
        } else {
            this.selectedImages.delete(imageId);
        }
        this.updateCounts();
        
        // Update visual feedback if needed (but avoid full re-render)
        this.updateSelectionDisplay();
    }

    updateSelectionDisplay() {
        // Update any visual indicators without full re-render
        const container = document.getElementById('images-container');
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const imageId = checkbox.getAttribute('data-image-id');
            const isSelected = this.selectedImages.has(imageId);
            
            // Ensure checkbox state matches internal state
            if (checkbox.checked !== isSelected) {
                checkbox.checked = isSelected;
            }
        });
    }

    updateCounts() {
        document.getElementById('total-images').textContent = this.images.length;
        document.getElementById('selected-count').textContent = this.selectedImages.size;
    }

    async convertSelectedToZip() {
        if (this.selectedImages.size === 0) {
            alert('Pilih minimal satu gambar untuk dikonversi');
            return;
        }

        const selectedImageData = this.images.filter(img => this.selectedImages.has(img.id));
        
        if (typeof JSZip === 'undefined') {
            alert('Library JSZip tidak tersedia. Silakan muat ulang halaman.');
            return;
        }

        const zip = new JSZip();
        this.showProgress();
        
        for (let i = 0; i < selectedImageData.length; i++) {
            const image = selectedImageData[i];
            const progress = ((i + 1) / selectedImageData.length) * 100;
            this.updateProgress(progress, `Memproses ${image.name}...`);

            try {
                const convertedBlob = await this.convertImageToBlob(image);
                const format = document.getElementById('format-select').value;
                const extension = format === 'jpeg' ? 'jpg' : format;
                const baseName = image.originalName.replace(/\.[^/.]+$/, '');
                const fileName = `${baseName}_converted.${extension}`;
                
                zip.file(fileName, convertedBlob);
            } catch (error) {
                console.error('Error converting image:', image.name, error);
            }
        }

        this.updateProgress(90, 'Membuat file ZIP...');
        
        try {
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `converted_images_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.updateProgress(100, 'Selesai!');
            setTimeout(() => this.hideProgress(), 1000);
        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Gagal membuat file ZIP');
            this.hideProgress();
        }
    }

    async convertImageToBlob(image) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const format = document.getElementById('format-select').value;
                const quality = parseInt(document.getElementById('quality-slider').value) / 100;
                const resizeOption = document.getElementById('resize-select').value;
                const cropOption = document.getElementById('crop-select').value;

                let { width, height } = this.calculateDimensions(img.width, img.height, resizeOption, cropOption);
                
                canvas.width = width;
                canvas.height = height;
                
                if (cropOption) {
                    this.applyCrop(ctx, img, cropOption, width, height);
                } else {
                    ctx.drawImage(img, 0, 0, width, height);
                }

                const mimeType = format === 'png' ? 'image/png' : 
                                format === 'jpeg' ? 'image/jpeg' :
                                format === 'webp' ? 'image/webp' :
                                'image/avif';

                canvas.toBlob(resolve, mimeType, format === 'png' ? undefined : quality);
            };
            img.onerror = reject;
            img.src = image.filePath;
        });
    }

    previewImage(imageId) {
        const image = this.images.find(img => img.id == imageId);
        if (!image) return;

        const modal = new bootstrap.Modal(document.getElementById('previewModal'));
        const previewImg = document.getElementById('preview-image');
        const modalTitle = document.getElementById('previewModalLabel');
        
        modalTitle.textContent = `Preview - ${image.name}`;
        previewImg.src = image.filePath;
        
        modal.show();
    }

    async convertImage(imageId) {
        const image = this.images.find(img => img.id == imageId);
        if (!image) return;

        // Handle PDF pages - they are already converted to images and ready for processing
        if (image.type === 'application/pdf' && image.isPDF && !image.pageNumber) {
            alert('PDF ini belum dikonversi ke gambar. Silakan upload ulang PDF untuk konversi otomatis.');
            return;
        }

        const format = document.getElementById('format-select').value;
        const quality = parseInt(document.getElementById('quality-slider').value) / 100;
        const resizeOption = document.getElementById('resize-select').value;
        const cropOption = document.getElementById('crop-select').value;

        this.showProgress();
        this.updateProgress(50, 'Mengkonversi gambar...');

        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let { width, height } = this.calculateDimensions(img.width, img.height, resizeOption, cropOption);
                
                canvas.width = width;
                canvas.height = height;
                
                // Apply crop if needed
                if (cropOption) {
                    this.applyCrop(ctx, img, cropOption, width, height);
                } else {
                    ctx.drawImage(img, 0, 0, width, height);
                }

                let mimeType, extension, fileName;

                switch (format) {
                    case 'png':
                        mimeType = 'image/png';
                        extension = 'png';
                        break;
                    case 'jpeg':
                        mimeType = 'image/jpeg';
                        extension = 'jpg';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        extension = 'webp';
                        break;
                    case 'avif':
                        mimeType = 'image/avif';
                        extension = 'avif';
                        break;
                    default:
                        mimeType = 'image/png';
                        extension = 'png';
                }

                const baseName = image.originalName.replace(/\.[^/.]+$/, '');
                fileName = `${baseName}_converted.${extension}`;
                
                // For PDF pages, include page number in filename
                if (image.isPDF && image.pageNumber) {
                    fileName = `${baseName}_page_${image.pageNumber}_converted.${extension}`;
                }

                this.updateProgress(80, 'Menyimpan file...');

                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    this.updateProgress(100, 'Selesai!');
                    setTimeout(() => this.hideProgress(), 1000);
                }, mimeType, format === 'png' ? undefined : quality);
            };
            
            img.onerror = () => {
                console.error('Error loading image for conversion');
                alert('Gagal memuat gambar untuk konversi');
                this.hideProgress();
            };
            
            img.src = image.filePath;
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Gagal mengkonversi gambar');
            this.hideProgress();
        }
    }

    calculateDimensions(originalWidth, originalHeight, resizeOption, cropOption) {
        let width = originalWidth;
        let height = originalHeight;

        // Apply resize first
        if (resizeOption && resizeOption !== 'custom') {
            const percentage = parseInt(resizeOption) / 100;
            width = Math.round(originalWidth * percentage);
            height = Math.round(originalHeight * percentage);
        } else if (resizeOption === 'custom') {
            const customWidth = parseInt(document.getElementById('custom-width').value) || originalWidth;
            const ratio = customWidth / originalWidth;
            width = customWidth;
            height = Math.round(originalHeight * ratio);
        }

        // Apply crop dimensions
        if (cropOption) {
            const cropDimensions = this.getCropDimensions(cropOption, width, height);
            width = cropDimensions.width;
            height = cropDimensions.height;
        }

        return { width, height };
    }

    getCropDimensions(cropOption, currentWidth, currentHeight) {
        const presets = {
            '1:1': { ratio: 1 },
            '4:5': { ratio: 4/5 },
            '16:9': { ratio: 16/9 },
            '1200:630': { width: 1200, height: 630 },
            '1080:1920': { ratio: 9/16 },
            'a4': { width: 595, height: 842 },
            'a3': { width: 842, height: 1191 },
            'letter': { width: 612, height: 792 },
            'business': { width: 252, height: 144 },
            'postcard': { width: 432, height: 288 },
            '1920:1080': { width: 1920, height: 1080 },
            '1366:768': { width: 1366, height: 768 },
            '1280:720': { width: 1280, height: 720 }
        };

        const preset = presets[cropOption];
        if (!preset) return { width: currentWidth, height: currentHeight };

        if (preset.width && preset.height) {
            return { width: preset.width, height: preset.height };
        } else if (preset.ratio) {
            if (currentWidth / currentHeight > preset.ratio) {
                return { width: Math.round(currentHeight * preset.ratio), height: currentHeight };
            } else {
                return { width: currentWidth, height: Math.round(currentWidth / preset.ratio) };
            }
        }

        return { width: currentWidth, height: currentHeight };
    }

    applyCrop(ctx, img, cropOption, targetWidth, targetHeight) {
        // Center crop the image to fit the target dimensions
        const sourceRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let sourceWidth, sourceHeight, sourceX, sourceY;

        if (sourceRatio > targetRatio) {
            sourceHeight = img.height;
            sourceWidth = img.height * targetRatio;
            sourceX = (img.width - sourceWidth) / 2;
            sourceY = 0;
        } else {
            sourceWidth = img.width;
            sourceHeight = img.width / targetRatio;
            sourceX = 0;
            sourceY = (img.height - sourceHeight) / 2;
        }

        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
    }

    async removeImage(imageId) {
        this.images = this.images.filter(img => img.id != imageId);
        this.selectedImages.delete(imageId);
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            await objectStore.delete(imageId);
            console.log(`Removed image ${imageId} from IndexedDB`);
        } catch (error) {
            console.error('Error removing image from IndexedDB:', error);
        }
        
        await this.saveToStorage();
        this.renderImages();
        this.updateCounts();
    }

    async clearAll() {
        this.images = [];
        this.selectedImages.clear();
        this.currentFilter = '';
        this.currentPage = 1;
        document.getElementById('search-input').value = '';
        
        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            await objectStore.clear();
            console.log('Cleared all images from IndexedDB');
        } catch (error) {
            console.error('Error clearing IndexedDB:', error);
        }
        
        this.renderImages();
        this.updateCounts();
    }

    showProgress() {
        document.getElementById('progress-container').classList.remove('d-none');
    }

    hideProgress() {
        document.getElementById('progress-container').classList.add('d-none');
    }

    updateProgress(percent, text) {
        document.getElementById('progress-bar').style.width = percent + '%';
        document.getElementById('progress-text').textContent = Math.round(percent) + '%';
        
        if (text) {
            document.getElementById('progress-text').textContent = text;
        }
    }

    updateQualityDisplay() {
        const slider = document.getElementById('quality-slider');
        const display = document.getElementById('quality-value');
        display.textContent = slider.value;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async saveToStorage() {
        if (!this.db) {
            console.error('IndexedDB not initialized');
            return;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            
            await objectStore.clear();
            
            for (const image of this.images) {
                await objectStore.put(image);
            }
            
            console.log(`Saved ${this.images.length} images to IndexedDB`);
        } catch (error) {
            console.error('Failed to save to IndexedDB:', error);
            alert('Gagal menyimpan gambar ke database browser. Beberapa gambar mungkin hilang setelah refresh.');
        }
    }

    async loadFromStorage() {
        if (!this.db) {
            console.error('IndexedDB not initialized');
            return;
        }

        try {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();
            
            return new Promise((resolve, reject) => {
                request.onsuccess = () => {
                    this.images = request.result || [];
                    console.log(`Loaded ${this.images.length} images from IndexedDB`);
                    resolve(this.images);
                };
                request.onerror = () => {
                    console.error('Failed to load from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.warn('Failed to load from IndexedDB:', error);
            this.images = [];
        }
    }

    // Initialize PDF.js when the page loads
    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            // Set worker path for PDF.js v5.3.31
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.3.31/build/pdf.worker.min.js';
            console.log('PDF.js v5.3.31 initialized successfully');
        } else {
            console.warn('PDF.js not loaded - PDF processing will use placeholder');
        }
    }
}

let imageConverter;
document.addEventListener('DOMContentLoaded', () => {
    imageConverter = new ImageConverter();
});