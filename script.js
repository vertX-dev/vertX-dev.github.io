// Global variables
let selectedImageSrc = null;
let highlightedCells = [];
const totalRows = 16, totalCols = 16;
const gridContainer = document.getElementById('grid-container');
let clearMode = false;
let currentImageId = 1; // numeric ID for each uploaded image

// Helper function: generate a UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Create grid cells (each 16x16 pixels)
for (let row = 0; row < totalRows; row++) {
  for (let col = 0; col < totalCols; col++) {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell');
    cell.dataset.row = row;
    cell.dataset.col = col;
    gridContainer.appendChild(cell);
  }
}

// Handle grid cell clicks for image placement.
gridContainer.addEventListener('click', function(e) {
  if (clearMode) return; // Ignore clicks in clear mode

  let cell = e.target;
  if (!cell.classList.contains('grid-cell')) {
    cell = cell.closest('.grid-cell');
    if (!cell) return;
  }
  const anchorRow = parseInt(cell.dataset.row);
  const anchorCol = parseInt(cell.dataset.col);

  if (!selectedImageSrc) {
    alert("Please select an image from the gallery first.");
    return;
  }

  // If the clicked cell is already highlighted, place the image.
  if (highlightedCells.includes(cell)) {
    highlightedCells.forEach(c => c.classList.remove('highlighted'));

    // Generate a core UID using the current image id and a generated UUID.
    const uidCore = currentImageId + '.' + generateUUID();

    // Create a temporary image to determine its natural size.
    const tempImg = new Image();
    tempImg.onload = function() {
      const naturalWidth = tempImg.naturalWidth;
      const naturalHeight = tempImg.naturalHeight;

      // If the image is 16x16 or smaller, place it directly.
      if (naturalWidth <= 16 && naturalHeight <= 16) {
        cell.innerHTML = "";
        const placedImg = document.createElement('img');
        placedImg.src = selectedImageSrc;
        placedImg.style.width = "100%";
        placedImg.style.height = "100%";
        cell.appendChild(placedImg);
        cell.dataset.uid = uidCore + '.m';
      } else {
        // Calculate how many grid cells are needed.
        const cellsX = Math.ceil(naturalWidth / 16);
        const cellsY = Math.ceil(naturalHeight / 16);

        // Create an offscreen canvas scaled to the required size.
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = cellsX * 16;
        scaledCanvas.height = cellsY * 16;
        const scaledCtx = scaledCanvas.getContext('2d');
        scaledCtx.drawImage(tempImg, 0, 0, scaledCanvas.width, scaledCanvas.height);

        // Determine the top-left cell so that the anchor cell is centered.
        const anchorOffsetX = Math.floor(cellsX / 2);
        const anchorOffsetY = Math.floor(cellsY / 2);
        const topLeftCol = anchorCol - anchorOffsetX;
        const topLeftRow = anchorRow - anchorOffsetY;

        // Loop through each cell piece and place a cropped image.
        for (let j = 0; j < cellsY; j++) {
          for (let i = 0; i < cellsX; i++) {
            const cellCol = topLeftCol + i;
            const cellRow = topLeftRow + j;
            // Only place pieces that fall within the grid boundaries.
            if (cellCol >= 0 && cellCol < totalCols && cellRow >= 0 && cellRow < totalRows) {
              const index = cellRow * totalCols + cellCol;
              const gridCell = gridContainer.children[index];
              gridCell.innerHTML = "";

              // Create a canvas for each grid piece.
              const cellCanvas = document.createElement('canvas');
              cellCanvas.width = 16;
              cellCanvas.height = 16;
              const cellCtx = cellCanvas.getContext('2d');
              // Crop the 16x16 piece from the scaled canvas.
              cellCtx.drawImage(scaledCanvas, i * 16, j * 16, 16, 16, 0, 0, 16, 16);

              // Create an image element from the canvas.
              const pieceImg = document.createElement('img');
              pieceImg.src = cellCanvas.toDataURL();
              pieceImg.style.width = "100%";
              pieceImg.style.height = "100%";
              gridCell.appendChild(pieceImg);

              // Mark the central (anchor) cell with ".m" and others with ".s".
              if (parseInt(gridCell.dataset.row) === anchorRow &&
                  parseInt(gridCell.dataset.col) === anchorCol) {
                gridCell.dataset.uid = uidCore + '.m';
              } else {
                gridCell.dataset.uid = uidCore + '.s';
              }
            }
          }
        }
      }
      highlightedCells = [];
      currentImageId++;
    };
    tempImg.src = selectedImageSrc;
  } else {
    // Otherwise, highlight the potential cells for image placement.
    if (highlightedCells.length > 0) {
      highlightedCells.forEach(c => c.classList.remove('highlighted'));
      highlightedCells = [];
    }
    const tempImg = new Image();
    tempImg.onload = function() {
      const naturalWidth = tempImg.naturalWidth;
      const naturalHeight = tempImg.naturalHeight;
      const cellsX = Math.ceil(naturalWidth / 16);
      const cellsY = Math.ceil(naturalHeight / 16);
      const anchorOffsetX = Math.floor(cellsX / 2);
      const anchorOffsetY = Math.floor(cellsY / 2);
      const topLeftCol = anchorCol - anchorOffsetX;
      const topLeftRow = anchorRow - anchorOffsetY;

      for (let j = 0; j < cellsY; j++) {
        for (let i = 0; i < cellsX; i++) {
          const cellCol = topLeftCol + i;
          const cellRow = topLeftRow + j;
          if (cellCol >= 0 && cellCol < totalCols && cellRow >= 0 && cellRow < totalRows) {
            const index = cellRow * totalCols + cellCol;
            const gridCell = gridContainer.children[index];
            gridCell.classList.add('highlighted');
            highlightedCells.push(gridCell);
          }
        }
      }
    };
    tempImg.src = selectedImageSrc;
  }
});

// Handle image uploads and add thumbnails to the gallery.
const imageUpload = document.getElementById('image-upload');
const gallery = document.getElementById('gallery');

imageUpload.addEventListener('change', function(e) {
  const files = e.target.files;
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const img = document.createElement('img');
      img.src = event.target.result;
      // On clicking a thumbnail, mark it as selected.
      img.addEventListener('click', function() {
        document.querySelectorAll('#gallery img').forEach(el => el.classList.remove('selected'));
        img.classList.add('selected');
        selectedImageSrc = img.src;
      });
      gallery.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
  imageUpload.value = "";
});

// Clear grid cells with the same UID when double-clicked in clear mode.
gridContainer.addEventListener('dblclick', function(e) {
  if (!clearMode) return;
  let cell = e.target;
  if (!cell.classList.contains('grid-cell')) {
    cell = cell.closest('.grid-cell');
    if (!cell) return;
  }
  const fullUid = cell.dataset.uid;
  if (!fullUid) return;

  // Extract the core UID (everything before the trailing .m or .s).
  const parts = fullUid.split('.');
  let coreUid;
  if (parts.length >= 3) {
    coreUid = parts[0] + '.' + parts[1];
  } else {
    coreUid = fullUid;
  }
  // Find and clear all cells whose UID starts with the core UID.
  const matchingCells = gridContainer.querySelectorAll(`[data-uid^="${coreUid}"]`);
  matchingCells.forEach(c => {
    c.innerHTML = '';
    delete c.dataset.uid;
  });
});

// Toggle clear mode using the clear button.
const clearButton = document.getElementById('clear-button');
clearButton.addEventListener('click', () => {
  clearMode = !clearMode;
  if (clearMode) {
    clearButton.classList.add('active');
  } else {
    clearButton.classList.remove('active');
  }
});

// Generate and log a matrix containing grid cell information.
const generateButton = document.getElementById('generate-button');
generateButton.addEventListener('click', () => {
  let matrix = [];
  for (let i = 0; i < gridContainer.children.length; i++) {
    const cell = gridContainer.children[i];
    matrix.push({
      row: cell.dataset.row,
      col: cell.dataset.col,
      uid: cell.dataset.uid || null,
      hasImage: cell.innerHTML.trim() !== ''
    });
  }
  alert('Matrix: ' + JSON.stringify(matrix, null, 2));
});