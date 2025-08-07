# Image Annotation Tool

A modern web-based tool for annotating images with bounding boxes. Users can upload images, load JSON annotation data, edit bounding boxes visually, and export the results.

## Features

- **Image Upload**: Drag and drop or click to upload images
- **JSON Data Import**: Load existing annotation data from JSON files
- **Visual Editing**: Drag, resize, and modify bounding boxes directly on the image
- **Property Editing**: Edit box properties (type, content, source, interactivity) in a side panel
- **Add/Delete**: Create new bounding boxes or remove existing ones
- **JSON Editor**: Direct text editing of JSON data with real-time sync
- **Export**: Save annotation data as JSON and export annotated images

## Usage

1. **Open the tool**: Simply open `index.html` in a web browser
2. **Upload an image**: Click the upload area or drag and drop an image file
3. **Load JSON data**: 
   - Upload an existing JSON file using "Upload JSON File" button
   - Or click "Create New" to start with empty annotations
4. **Edit annotations**:
   - Click on bounding boxes to select them
   - Drag boxes to move them
   - Use corner handles to resize boxes
   - Edit properties in the right panel
5. **Add/Remove boxes**:
   - Click "Add Bounding Box" to create new annotations
   - Select a box and click "Delete Selected" to remove it
6. **Export**:
   - "Export Data" to download the JSON file
   - "Export Image" to download the image with annotations

## JSON Format

The tool expects JSON data as an array of objects with the following structure:

```json
[
  {
    "type": "text",
    "bbox": [x1, y1, x2, y2],
    "interactivity": false,
    "content": "Text content",
    "source": "source_info"
  }
]
```

Where:
- `bbox`: Normalized coordinates [left, top, right, bottom] (0-1 range)
- `type`: Type of the element (text, image, button, etc.)
- `interactivity`: Boolean indicating if the element is interactive
- `content`: Text content or description
- `source`: Source of the annotation (manual, ocr, etc.)

## Sample Data

A sample JSON file (`sample-annotations.json`) is included for testing.

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- File API
- CSS3
- ES6 JavaScript

## Technical Details

- Pure HTML/CSS/JavaScript - no external dependencies
- Responsive design that works on desktop and mobile
- Real-time synchronization between visual editor and JSON text
- Coordinate normalization for resolution independence
- Canvas-based image rendering for precise positioning
