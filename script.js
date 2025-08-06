class ImageAnnotationTool {
    constructor() {
        this.currentImage = null;
        this.jsonData = [];
        this.selectedBoxIndex = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.resizeHandle = null;
        this.imageScale = 1;
        
        this.initializeElements();
        this.bindEvents();
    }
    
    initializeElements() {
        // Get DOM elements
        this.imageInput = document.getElementById('imageInput');
        this.imageDropZone = document.getElementById('imageDropZone');
        this.imageContainer = document.getElementById('imageContainer');
        this.imageCanvas = document.getElementById('imageCanvas');
        this.boundingBoxesContainer = document.getElementById('boundingBoxes');
        this.jsonInput = document.getElementById('jsonInput');
        this.jsonEditor = document.getElementById('jsonEditor');
        this.selectedBoxInfo = document.getElementById('selectedBoxInfo');
        
        // Buttons
        this.jsonUploadBtn = document.getElementById('jsonUploadBtn');
        this.createNewBtn = document.getElementById('createNewBtn');
        this.addBoxBtn = document.getElementById('addBoxBtn');
        this.deleteBoxBtn = document.getElementById('deleteBoxBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.exportImageBtn = document.getElementById('exportImageBtn');
    }
    
    bindEvents() {
        // Image upload events
        this.imageDropZone.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Drag and drop for image
        this.imageDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.imageDropZone.classList.add('dragover');
        });
        
        this.imageDropZone.addEventListener('dragleave', () => {
            this.imageDropZone.classList.remove('dragover');
        });
        
        this.imageDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.imageDropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.loadImage(files[0]);
            }
        });
        
        // JSON upload events
        this.jsonUploadBtn.addEventListener('click', () => this.jsonInput.click());
        this.jsonInput.addEventListener('change', (e) => this.handleJsonUpload(e));
        this.createNewBtn.addEventListener('click', () => this.createNewJsonData());
        
        // JSON editor events
        this.jsonEditor.addEventListener('input', () => this.handleJsonEdit());
        
        // Button events
        this.addBoxBtn.addEventListener('click', () => this.addNewBoundingBox());
        this.deleteBoxBtn.addEventListener('click', () => this.deleteSelectedBox());
        this.exportBtn.addEventListener('click', () => this.exportJsonData());
        this.exportImageBtn.addEventListener('click', () => this.exportAnnotatedImage());
        
        // Global mouse events for dragging and resizing
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.handleMouseUp());
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        }
    }
    
    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentImage = img;
                this.displayImage();
                this.imageContainer.style.display = 'block';
                document.querySelector('.image-upload-area').style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    displayImage() {
        const ctx = this.imageCanvas.getContext('2d');
        
        // Set canvas size to match image
        this.imageCanvas.width = this.currentImage.width;
        this.imageCanvas.height = this.currentImage.height;
        
        // Draw image
        ctx.drawImage(this.currentImage, 0, 0);
        
        // Update bounding boxes container size
        this.boundingBoxesContainer.style.width = this.imageCanvas.offsetWidth + 'px';
        this.boundingBoxesContainer.style.height = this.imageCanvas.offsetHeight + 'px';
        
        // Calculate scale for coordinate conversion
        this.imageScale = this.imageCanvas.offsetWidth / this.currentImage.width;
        
        // Render existing bounding boxes
        this.renderBoundingBoxes();
    }
    
    handleJsonUpload(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.jsonData = JSON.parse(e.target.result);
                    this.updateJsonEditor();
                    this.renderBoundingBoxes();
                } catch (error) {
                    alert('Invalid JSON file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }
    
    createNewJsonData() {
        this.jsonData = [];
        this.updateJsonEditor();
        this.renderBoundingBoxes();
        this.clearSelectedBox();
    }
    
    handleJsonEdit() {
        try {
            const newData = JSON.parse(this.jsonEditor.value);
            this.jsonData = newData;
            this.renderBoundingBoxes();
        } catch (error) {
            // Invalid JSON, don't update
        }
    }
    
    updateJsonEditor() {
        this.jsonEditor.value = JSON.stringify(this.jsonData, null, 2);
    }
    
    renderBoundingBoxes() {
        if (!this.currentImage) return;
        
        // Clear existing boxes
        this.boundingBoxesContainer.innerHTML = '';
        
        this.jsonData.forEach((box, index) => {
            this.createBoundingBoxElement(box, index);
        });
    }
    
    createBoundingBoxElement(boxData, index) {
        const boxElement = document.createElement('div');
        boxElement.className = 'bounding-box';
        boxElement.dataset.index = index;
        
        // Convert normalized coordinates to pixel coordinates
        const left = boxData.bbox[0] * this.imageCanvas.offsetWidth;
        const top = boxData.bbox[1] * this.imageCanvas.offsetHeight;
        const width = (boxData.bbox[2] - boxData.bbox[0]) * this.imageCanvas.offsetWidth;
        const height = (boxData.bbox[3] - boxData.bbox[1]) * this.imageCanvas.offsetHeight;
        
        boxElement.style.left = left + 'px';
        boxElement.style.top = top + 'px';
        boxElement.style.width = width + 'px';
        boxElement.style.height = height + 'px';
        
        // Add label
        const label = document.createElement('div');
        label.className = 'box-label';
        label.textContent = `${index}`;
        boxElement.appendChild(label);
        
        // Add resize handles
        ['nw', 'ne', 'sw', 'se'].forEach(position => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${position}`;
            handle.dataset.position = position;
            boxElement.appendChild(handle);
        });
        
        // Add event listeners
        boxElement.addEventListener('mousedown', (e) => this.handleBoxMouseDown(e, index));
        boxElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectBox(index);
        });
        
        this.boundingBoxesContainer.appendChild(boxElement);
    }
    
    handleBoxMouseDown(event, index) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.target.classList.contains('resize-handle')) {
            this.isResizing = true;
            this.resizeHandle = event.target.dataset.position;
        } else {
            this.isDragging = true;
        }
        
        this.selectedBoxIndex = index;
        this.selectBox(index);
        
        const rect = this.boundingBoxesContainer.getBoundingClientRect();
        this.dragStartPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }
    
    handleMouseMove(event) {
        if (!this.isDragging && !this.isResizing) return;
        if (this.selectedBoxIndex === null) return;
        
        const rect = this.boundingBoxesContainer.getBoundingClientRect();
        const currentPos = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        const deltaX = currentPos.x - this.dragStartPos.x;
        const deltaY = currentPos.y - this.dragStartPos.y;
        
        const boxElement = this.boundingBoxesContainer.children[this.selectedBoxIndex];
        const boxData = this.jsonData[this.selectedBoxIndex];
        
        if (this.isDragging) {
            this.moveBoundingBox(boxElement, boxData, deltaX, deltaY);
        } else if (this.isResizing) {
            this.resizeBoundingBox(boxElement, boxData, deltaX, deltaY);
        }
        
        this.dragStartPos = currentPos;
        this.updateJsonEditor();
    }
    
    handleMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    }
    
    moveBoundingBox(boxElement, boxData, deltaX, deltaY) {
        const currentLeft = parseFloat(boxElement.style.left);
        const currentTop = parseFloat(boxElement.style.top);
        const width = parseFloat(boxElement.style.width);
        const height = parseFloat(boxElement.style.height);
        
        let newLeft = currentLeft + deltaX;
        let newTop = currentTop + deltaY;
        
        // Constrain to image bounds
        newLeft = Math.max(0, Math.min(newLeft, this.imageCanvas.offsetWidth - width));
        newTop = Math.max(0, Math.min(newTop, this.imageCanvas.offsetHeight - height));
        
        boxElement.style.left = newLeft + 'px';
        boxElement.style.top = newTop + 'px';
        
        // Update JSON data with normalized coordinates
        boxData.bbox[0] = newLeft / this.imageCanvas.offsetWidth;
        boxData.bbox[1] = newTop / this.imageCanvas.offsetHeight;
        boxData.bbox[2] = (newLeft + width) / this.imageCanvas.offsetWidth;
        boxData.bbox[3] = (newTop + height) / this.imageCanvas.offsetHeight;
    }
    
    resizeBoundingBox(boxElement, boxData, deltaX, deltaY) {
        const currentLeft = parseFloat(boxElement.style.left);
        const currentTop = parseFloat(boxElement.style.top);
        const currentWidth = parseFloat(boxElement.style.width);
        const currentHeight = parseFloat(boxElement.style.height);
        
        let newLeft = currentLeft;
        let newTop = currentTop;
        let newWidth = currentWidth;
        let newHeight = currentHeight;
        
        switch (this.resizeHandle) {
            case 'nw':
                newLeft += deltaX;
                newTop += deltaY;
                newWidth -= deltaX;
                newHeight -= deltaY;
                break;
            case 'ne':
                newTop += deltaY;
                newWidth += deltaX;
                newHeight -= deltaY;
                break;
            case 'sw':
                newLeft += deltaX;
                newWidth -= deltaX;
                newHeight += deltaY;
                break;
            case 'se':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
        }
        
        // Ensure minimum size
        if (newWidth < 10) newWidth = 10;
        if (newHeight < 10) newHeight = 10;
        
        // Constrain to image bounds
        if (newLeft < 0) {
            newWidth += newLeft;
            newLeft = 0;
        }
        if (newTop < 0) {
            newHeight += newTop;
            newTop = 0;
        }
        if (newLeft + newWidth > this.imageCanvas.offsetWidth) {
            newWidth = this.imageCanvas.offsetWidth - newLeft;
        }
        if (newTop + newHeight > this.imageCanvas.offsetHeight) {
            newHeight = this.imageCanvas.offsetHeight - newTop;
        }
        
        boxElement.style.left = newLeft + 'px';
        boxElement.style.top = newTop + 'px';
        boxElement.style.width = newWidth + 'px';
        boxElement.style.height = newHeight + 'px';
        
        // Update JSON data with normalized coordinates
        boxData.bbox[0] = newLeft / this.imageCanvas.offsetWidth;
        boxData.bbox[1] = newTop / this.imageCanvas.offsetHeight;
        boxData.bbox[2] = (newLeft + newWidth) / this.imageCanvas.offsetWidth;
        boxData.bbox[3] = (newTop + newHeight) / this.imageCanvas.offsetHeight;
    }
    
    selectBox(index) {
        // Clear previous selection
        document.querySelectorAll('.bounding-box').forEach(box => {
            box.classList.remove('selected');
        });
        
        // Select new box
        if (index !== null && index < this.boundingBoxesContainer.children.length) {
            this.selectedBoxIndex = index;
            this.boundingBoxesContainer.children[index].classList.add('selected');
            this.showBoxInfo(this.jsonData[index], index);
        } else {
            this.clearSelectedBox();
        }
    }
    
    clearSelectedBox() {
        this.selectedBoxIndex = null;
        document.querySelectorAll('.bounding-box').forEach(box => {
            box.classList.remove('selected');
        });
        this.selectedBoxInfo.innerHTML = '<p>Select a bounding box to edit its properties</p>';
    }
    
    showBoxInfo(boxData, index) {
        this.selectedBoxInfo.innerHTML = `
            <div class="property-group">
                <label>Box ID:</label>
                <input type="text" value="${index}" readonly>
            </div>
            <div class="property-group">
                <label>Type:</label>
                <input type="text" id="boxType" value="${boxData.type || ''}" onchange="annotationTool.updateBoxProperty('type', this.value)">
            </div>
            <div class="property-group">
                <label>Content:</label>
                <textarea id="boxContent" onchange="annotationTool.updateBoxProperty('content', this.value)">${boxData.content || ''}</textarea>
            </div>
            <div class="property-group">
                <label>Source:</label>
                <input type="text" id="boxSource" value="${boxData.source || ''}" onchange="annotationTool.updateBoxProperty('source', this.value)">
            </div>
            <div class="property-group checkbox-group">
                <input type="checkbox" id="boxInteractivity" ${boxData.interactivity ? 'checked' : ''} onchange="annotationTool.updateBoxProperty('interactivity', this.checked)">
                <label for="boxInteractivity">Interactive</label>
            </div>
        `;
    }
    
    updateBoxProperty(property, value) {
        if (this.selectedBoxIndex !== null) {
            this.jsonData[this.selectedBoxIndex][property] = value;
            this.updateJsonEditor();
            
            // Update label if content changed
            if (property === 'content') {
                const boxElement = this.boundingBoxesContainer.children[this.selectedBoxIndex];
                const label = boxElement.querySelector('.box-label');
                label.textContent = `${this.selectedBoxIndex}`;
            }
        }
    }
    
    addNewBoundingBox() {
        if (!this.currentImage) {
            alert('Please upload an image first');
            return;
        }
        
        // Create new bounding box in the center of the image
        const newBox = {
            type: "text",
            bbox: [0.4, 0.4, 0.6, 0.5],
            interactivity: false,
            content: "New Box",
            source: "manual"
        };
        
        this.jsonData.push(newBox);
        this.updateJsonEditor();
        this.renderBoundingBoxes();
        this.selectBox(this.jsonData.length - 1);
    }
    
    deleteSelectedBox() {
        if (this.selectedBoxIndex !== null) {
            this.jsonData.splice(this.selectedBoxIndex, 1);
            this.updateJsonEditor();
            this.renderBoundingBoxes();
            this.clearSelectedBox();
        } else {
            alert('Please select a bounding box to delete');
        }
    }
    
    exportJsonData() {
        const dataStr = JSON.stringify(this.jsonData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'annotations.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    exportAnnotatedImage() {
        if (!this.currentImage) {
            alert('Please upload an image first');
            return;
        }
        
        // Create a new canvas for export
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d');
        
        exportCanvas.width = this.currentImage.width;
        exportCanvas.height = this.currentImage.height;
        
        // Draw the original image
        ctx.drawImage(this.currentImage, 0, 0);
        
        // Draw bounding boxes
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
        ctx.font = '16px Arial';
        
        this.jsonData.forEach((box, index) => {
            const x = box.bbox[0] * this.currentImage.width;
            const y = box.bbox[1] * this.currentImage.height;
            const width = (box.bbox[2] - box.bbox[0]) * this.currentImage.width;
            const height = (box.bbox[3] - box.bbox[1]) * this.currentImage.height;
            
            // Draw box
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
            
            // Draw label
            const label = `${index}`;
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x, y - 20, ctx.measureText(label).width + 10, 20);
            ctx.fillStyle = 'white';
            ctx.fillText(label, x + 5, y - 5);
            ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
        });
        
        // Download the image
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'annotated_image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
}

// Initialize the application
const annotationTool = new ImageAnnotationTool();

// Handle window resize
window.addEventListener('resize', () => {
    if (annotationTool.currentImage) {
        annotationTool.displayImage();
    }
});

// Click outside to deselect
document.addEventListener('click', (e) => {
    if (!e.target.closest('.bounding-box') && !e.target.closest('#selectedBoxInfo')) {
        annotationTool.clearSelectedBox();
    }
});