// Set up all event listeners
function setupEventListeners() {
  // Canvas events
  const canvas = document.getElementById('grid-canvas');
  
  // Mouse events
  canvas.addEventListener('mousedown', handleCanvasClick);
  canvas.addEventListener('mousemove', handleCanvasDrag);
  window.addEventListener('mouseup', () => {
    isDragging = false;
    lastCell = null;
  });

  // Touch events
  canvas.addEventListener('touchstart', handleCanvasClick);
  canvas.addEventListener('touchmove', handleCanvasDrag);
  window.addEventListener('touchend', () => {
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

// Handle canvas click/touch
function handleCanvasClick(e) {
  const canvas = document.getElementById('grid-canvas');
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the grid cell from the click/touch coordinates
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  
  const col = Math.floor(x / SQUARE_SIZE);
  const row = Math.floor(y / SQUARE_SIZE);
  
  // Update the square (toggle behavior on click/touch)
  updateSquare(row, col, currentMode, true);
  
  // Start dragging
  isDragging = true;
  lastCell = { row, col };
}

// Handle canvas drag/touch move
function handleCanvasDrag(e) {
  if (!isDragging) {
    return;
  }
  
  const canvas = document.getElementById('grid-canvas');
  const rect = canvas.getBoundingClientRect();
  
  // Calculate the grid cell from the current coordinates
  const x = (e.clientX || e.touches[0].clientX) - rect.left;
  const y = (e.clientY || e.touches[0].clientY) - rect.top;
  
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