// Constants
const ROWS = 32;
const COLS = 32;
const SQUARE_SIZE = 20;
const GRID_COLOR = '#ddd';
const GRID_LINE_WIDTH = 1;
const OFFSET_INDICATOR_COLOR = '#3498db';

// Application state
let currentMode = 0; // 0 means "eraser" mode
let matrix = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let xOffset = 0;
let zOffset = 0;
let isDragging = false;
let lastCell = null;

// Color data for different commands
const colorData = {
  0: {
    name: "None",
    fill: "#ffffff",
    template: ""
  }
};

// Initialize application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  setupEventListeners();
  
  // Add default colors/commands
  addCommand("Grass", "#8BC34A", "setblock {x} {y} {z} minecraft:grass_block");
  addCommand("Stone", "#9E9E9E", "setblock {x} {y} {z} minecraft:stone");
  addCommand("Water", "#42A5F5", "setblock {x} {y} {z} minecraft:water");
  addCommand("Redstone", "#F44336", "setblock {x} {y} {z} minecraft:redstone_block");
  
  updateCurrentModeDisplay();
});

// Initialize the canvas
function initCanvas() {
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas dimensions based on grid size
  canvas.width = COLS * SQUARE_SIZE;
  canvas.height = ROWS * SQUARE_SIZE;
  
  // Draw the initial grid
  drawGrid();
}

// Draw the grid and all filled squares
function drawGrid() {
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw all filled squares first
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const squareValue = matrix[row][col];
      if (squareValue > 0) {
        const x = col * SQUARE_SIZE;
        const y = row * SQUARE_SIZE;
        
        ctx.fillStyle = colorData[squareValue].fill;
        ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
      }
    }
  }
  
  // Draw grid lines
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = GRID_LINE_WIDTH;
  
  // Draw vertical grid lines
  for (let i = 0; i <= COLS; i++) {
    const x = i * SQUARE_SIZE;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  
  // Draw horizontal grid lines
  for (let i = 0; i <= ROWS; i++) {
    const y = i * SQUARE_SIZE;
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  
  ctx.stroke();
  
  // Draw the offset indicator
  drawOffsetIndicator(ctx);
}

// Draw the offset indicator in the grid
function drawOffsetIndicator(ctx) {
  const centerRow = Math.floor(ROWS / 2);
  const centerCol = Math.floor(COLS / 2);
  
  const x = centerCol * SQUARE_SIZE;
  const y = centerRow * SQUARE_SIZE;
  
  ctx.save();
  ctx.strokeStyle = OFFSET_INDICATOR_COLOR;
  ctx.lineWidth = 2;
  
  // Draw the crosshair
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.stroke();
  
  // Draw offset text
  ctx.fillStyle = OFFSET_INDICATOR_COLOR;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Offset: (${xOffset}, ${zOffset})`, x, y - 15);
  
  ctx.restore();
}

// Update the current mode display
function updateCurrentModeDisplay() {
  const modeNameElement = document.getElementById('mode-name');
  const modeColorElement = document.getElementById('mode-color');
  
  modeNameElement.textContent = colorData[currentMode].name;
  modeColorElement.style.backgroundColor = colorData[currentMode].fill;
}

// Update a square in the grid
function updateSquare(row, col, mode, toggle = false) {
  if (row < 0 || row >= ROWS || col < 0 || col >= COLS) {
    return; // Out of bounds
  }
  
  // If toggle is true, toggle between the current mode and 0 (none)
  if (toggle) {
    matrix[row][col] = matrix[row][col] === mode ? 0 : mode;
  } else {
    matrix[row][col] = mode;
  }
  
  // Redraw the grid
  drawGrid();
}

// Show an alert modal
function showAlert(title, message) {
  const modal = document.getElementById('alert-modal');
  const titleElement = document.getElementById('alert-title');
  const messageElement = document.getElementById('alert-message');
  
  titleElement.textContent = title;
  messageElement.textContent = message;
  
  showModal(modal);
}

// Add a new command/color
function addCommand(name, fill, template) {
  // Find the next available ID
  const nextId = Math.max(0, ...Object.keys(colorData).map(Number)) + 1;
  
  // Add the new command to colorData
  colorData[nextId] = {
    name,
    fill,
    template
  };
  
  // If this is the first real command (besides "None"), select it
  if (nextId === 1) {
    currentMode = nextId;
    updateCurrentModeDisplay();
  }
  
  return nextId;
}

// Get preview content for the generated commands
function getPreviewContent() {
  let commands = [];
  
  // Loop through the matrix
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const value = matrix[row][col];
      if (value > 0 && colorData[value].template) {
        // Calculate the actual coordinates with offsets
        const x = col + xOffset;
        const y = 0; // Y is always 0 for 2D grid
        const z = row + zOffset;
        
        // Replace placeholders in the template
        const command = colorData[value].template
          .replace(/{x}/g, x)
          .replace(/{y}/g, y)
          .replace(/{z}/g, z);
        
        commands.push(command);
      }
    }
  }
  
  if (commands.length === 0) {
    return "# No commands to preview";
  }
  
  return commands.join('\n');
}

// Get content for saving to a file
function getSaveContent() {
  // For now, save content is the same as preview content
  return getPreviewContent();
}

// Show a modal
function showModal(modal) {
  modal.classList.add('visible');
}

// Hide a modal
function hideModal(modal) {
  modal.classList.remove('visible');
}

// Populate the color selection list
function populateColorList() {
  const colorList = document.getElementById('color-list');
  colorList.innerHTML = '';
  
  // Create a color item for each entry in colorData
  Object.entries(colorData).forEach(([id, data]) => {
    const item = document.createElement('div');
    item.className = 'color-item';
    item.dataset.id = id;
    
    const colorSquare = document.createElement('div');
    colorSquare.className = 'color-square';
    colorSquare.style.backgroundColor = data.fill;
    
    const name = document.createElement('div');
    name.className = 'color-item-name';
    name.textContent = data.name;
    
    item.appendChild(colorSquare);
    item.appendChild(name);
    colorList.appendChild(item);
  });
}

// Handle canvas click
function handleCanvasClick(e) {
  const canvas = document.getElementById('grid-canvas');
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the grid cell from the click coordinates
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const col = Math.floor(x / SQUARE_SIZE);
  const row = Math.floor(y / SQUARE_SIZE);
  
  // Update the square (toggle behavior on click)
  updateSquare(row, col, currentMode, true);
  
  // Start dragging
  isDragging = true;
  lastCell = { row, col };
}

// Handle canvas drag
function handleCanvasDrag(e) {
  if (!isDragging) {
    return;
  }
  
  const canvas = document.getElementById('grid-canvas');
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the grid cell from the current coordinates
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  const col = Math.floor(x / SQUARE_SIZE);
  const row = Math.floor(y / SQUARE_SIZE);
  
  // Skip if we're still on the same cell
  if (lastCell && lastCell.row === row && lastCell.col === col) {
    return;
  }
  
  // Update the square (no toggle during drag)
  updateSquare(row, col, currentMode, false);
  
  // Update last cell
  lastCell = { row, col };
}

// Set up all event listeners
function setupEventListeners() {
  // Canvas events
  const canvas = document.getElementById('grid-canvas');
  canvas.addEventListener('mousedown', handleCanvasClick);
  canvas.addEventListener('mousemove', handleCanvasDrag);
  window.addEventListener('mouseup', () => {
    isDragging = false;
    lastCell = null;
  });
  
  // Offset inputs
  const xOffsetInput = document.getElementById('x-offset');
  const zOffsetInput = document.getElementById('z-offset');
  
  xOffsetInput.addEventListener('change', () => {
    xOffset = parseInt(xOffsetInput.value) || 0;
    drawGrid();
  });
  
  zOffsetInput.addEventListener('change', () => {
    zOffset = parseInt(zOffsetInput.value) || 0;
    drawGrid();
  });
  
  // Select color button
  const selectColorBtn = document.getElementById('select-color-btn');
  const selectColorModal = document.getElementById('select-color-modal');
  
  selectColorBtn.addEventListener('click', () => {
    populateColorList();
    showModal(selectColorModal);
  });
  
  // Color selection
  document.getElementById('color-list').addEventListener('click', (e) => {
    let targetItem = e.target;
    
    // Find the color-item element
    while (targetItem && !targetItem.classList.contains('color-item')) {
      targetItem = targetItem.parentElement;
    }
    
    if (targetItem) {
      const colorId = parseInt(targetItem.dataset.id);
      currentMode = colorId;
      updateCurrentModeDisplay();
      hideModal(selectColorModal);
    }
  });
  
  // Add command button
  const addCommandBtn = document.getElementById('add-command-btn');
  const addCommandModal = document.getElementById('add-command-modal');
  
  addCommandBtn.addEventListener('click', () => {
    showModal(addCommandModal);
    
    // Update color preview on input
    const colorInput = document.getElementById('command-color');
    const colorPreview = document.getElementById('color-preview');
    
    const updatePreview = () => {
      colorPreview.style.backgroundColor = colorInput.value;
    };
    
    colorInput.addEventListener('input', updatePreview);
    updatePreview(); // Initial update
  });
  
  // Add command form
  const addCommandForm = document.getElementById('add-command-form');
  
  addCommandForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('command-name').value;
    const fill = document.getElementById('command-color').value;
    const template = document.getElementById('command-template').value;
    
    if (!name || !fill || !template) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }
    
    const newId = addCommand(name, fill, template);
    currentMode = newId;
    updateCurrentModeDisplay();
    
    // Reset the form
    addCommandForm.reset();
    document.getElementById('command-color').value = '#ff0000';
    document.getElementById('command-template').value = 'execute positioned {x} {y} {z} run say Hello';
    document.getElementById('color-preview').style.backgroundColor = '#ff0000';
    
    hideModal(addCommandModal);
  });
  
  // Preview button
  const previewBtn = document.getElementById('preview-btn');
  const previewModal = document.getElementById('preview-modal');
  
  previewBtn.addEventListener('click', () => {
    const previewContent = document.getElementById('preview-content');
    previewContent.textContent = getPreviewContent();
    showModal(previewModal);
  });
  
  // Copy button in preview modal
  const copyBtn = document.getElementById('copy-btn');
  
  copyBtn.addEventListener('click', () => {
    const previewContent = document.getElementById('preview-content');
    
    // Create a temporary textarea to copy the text
    const textarea = document.createElement('textarea');
    textarea.value = previewContent.textContent;
    document.body.appendChild(textarea);
    textarea.select();
    
    // Copy the text
    try {
      document.execCommand('copy');
      showAlert('Success', 'Commands copied to clipboard');
    } catch (err) {
      showAlert('Error', 'Failed to copy commands');
    } finally {
      document.body.removeChild(textarea);
    }
    
    hideModal(previewModal);
  });
  
  // Save button
  const saveBtn = document.getElementById('save-btn');
  const saveModal = document.getElementById('save-modal');
  
  saveBtn.addEventListener('click', () => {
    showModal(saveModal);
  });
  
  // Save form
  const saveForm = document.getElementById('save-form');
  
  saveForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fileName = document.getElementById('file-name').value;
    
    if (!fileName) {
      showAlert('Error', 'Please enter a file name');
      return;
    }
    
    const content = getSaveContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    
    hideModal(saveModal);
  });
  
  // Close modal buttons
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      hideModal(modal);
    });
  });
  
  // Close modal when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal);
      }
    });
  });
}