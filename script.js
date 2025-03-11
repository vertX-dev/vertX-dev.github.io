// Global variables
let selectedImageSrc = null;
let highlightedCells = [];
const totalRows = 21, totalCols = 25;
const gridContainer = document.getElementById('grid-container');

// Create grid cells (each cell represents one “unit” of 16x16 pixels)
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
    highlightedCells = [];

    // Create a temporary image to determine its natural size.
    const tempImg = new Image();
    tempImg.onload = function() {
      const naturalWidth = tempImg.naturalWidth;
      const naturalHeight = tempImg.naturalHeight;
      // If image is 16x16 or smaller, place directly.
      if (naturalWidth <= 16 && naturalHeight <= 16) {
        cell.innerHTML = "";
        const placedImg = document.createElement('img');
        placedImg.src = selectedImageSrc;
        placedImg.style.width = "100%";
        placedImg.style.height = "100%";
        cell.appendChild(placedImg);
      } else {
        // Determine how many 16x16 cells are needed.
        const cellsX = Math.ceil(naturalWidth / 16);
        const cellsY = Math.ceil(naturalHeight / 16);

        // Create an offscreen canvas to scale the entire image
        // to exactly cellsX*16 by cellsY*16 pixels.
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = cellsX * 16;
        scaledCanvas.height = cellsY * 16;
        const scaledCtx = scaledCanvas.getContext('2d');
        scaledCtx.drawImage(tempImg, 0, 0, scaledCanvas.width, scaledCanvas.height);

        // Calculate offsets so that the clicked cell is centered.
        const anchorOffsetX = Math.floor(cellsX / 2);
        const anchorOffsetY = Math.floor(cellsY / 2);
        const topLeftCol = anchorCol - anchorOffsetX;
        const topLeftRow = anchorRow - anchorOffsetY;

        // For each cell piece, crop out a 16x16 chunk from the scaled canvas.
        for (let j = 0; j < cellsY; j++) {
          for (let i = 0; i < cellsX; i++) {
            const cellCol = topLeftCol + i;
            const cellRow = topLeftRow + j;
            // Only place pieces within the grid boundaries.
            if (cellCol >= 0 && cellCol < totalCols && cellRow >= 0 && cellRow < totalRows) {
              const index = cellRow * totalCols + cellCol;
              const gridCell = gridContainer.children[index];
              gridCell.innerHTML = "";

              // Create a new canvas for each cell piece.
              const cellCanvas = document.createElement('canvas');
              cellCanvas.width = 16;
              cellCanvas.height = 16;
              const cellCtx = cellCanvas.getContext('2d');
              // Crop the 16x16 piece from the scaled canvas.
              cellCtx.drawImage(scaledCanvas, i * 16, j * 16, 16, 16, 0, 0, 16, 16);

              // Create an image from the canvas and insert it into the grid cell.
              const pieceImg = document.createElement('img');
              pieceImg.src = cellCanvas.toDataURL();
              pieceImg.style.width = "100%";
              pieceImg.style.height = "100%";
              gridCell.appendChild(pieceImg);
            }
          }
        }
      }
    }
    tempImg.src = selectedImageSrc;
  } else {
    if (highlightedCells.length > 0) {
      highlightedCells.forEach(c => c.classList.remove('highlighted'));
      highlightedCells = [];
    }

    // Create a temporary image to determine its natural size.
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
    }
    tempImg.src = selectedImageSrc;
  }
});

// Handle image uploads and add to gallery.
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
    }
    reader.readAsDataURL(file);
  }
  imageUpload.value = "";
});

document.addEventListener('DOMContentLoaded', () => {
  const gridContainer = document.getElementById('grid-container');
  const clearButton = document.getElementById('clear-button');
  const generateButton = document.getElementById('generate-button');
  const imageUpload = document.getElementById('image-upload');
  const gallery = document.getElementById('gallery');

  let matrix = [];
  let images = {};
  let currentImageId = 1;

  // Function to clear the grid
  clearButton.addEventListener('click', () => {
    gridContainer.innerHTML = '';
    matrix = [];
  });

  // Function to generate the matrix with information about each cell
  generateButton.addEventListener('click', () => {
    console.log('Matrix:', matrix);
    console.log('Images:', images);
  });

  // Handle image upload
  imageUpload.addEventListener('change', event => {
    const files = event.target.files;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.src = e.target.result;
        img.onload = function() {
          const imgId = currentImageId++;
          images[imgId] = {
            src: img.src,
            width: img.width,
            height: img.height
          };
          addImageToGallery(img, imgId);
        };
      };
      reader.readAsDataURL(file);
    });
  });

  // Add uploaded image to gallery
  function addImageToGallery(img, imgId) {
    const imgElement = document.createElement('img');
    imgElement.src = img.src;
    imgElement.dataset.imgId = imgId;
    imgElement.classList.add('gallery-image');
    gallery.appendChild(imgElement);

    imgElement.addEventListener('click', () => {
      addToGrid(imgElement);
    });
  }

  // Add image to grid
  function addToGrid(imgElement) {
    const imgId = imgElement.dataset.imgId;
    const gridItem = document.createElement('div');
    gridItem.classList.add('grid-item');
    gridItem.style.backgroundImage = `url(${images[imgId].src})`;

    gridItem.addEventListener('click', () => {
      const subId = imgId + '.' + (Math.random().toString(36).substring(2, 5));
      gridItem.dataset.imgId = subId;
      matrix.push({ cellId: subId, imgId: imgId });
    });

    gridContainer.appendChild(gridItem);
  }
});