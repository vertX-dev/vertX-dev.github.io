// Constants
const ROWS = 32;
const COLS = 32;
const SQUARE_SIZE = 20;
const GRID_COLOR = '#ddd';
const GRID_LINE_WIDTH = 1;
const OFFSET_INDICATOR_COLOR = 'red';

// Application state
let currentMode = 0; // 0 means "eraser" mode
let matrix = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let xOffset = 0;
let zOffset = 0;
let isDragging = false;
let lastCell = null;
//let mobile = "checked";
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

 //Draw the offset indicator in the grid
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
  let knbTags = [];
  let knbDamages = [];

  // Loop through the matrix
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const value = matrix[row][col];
      if (value > 0 && colorData[value].template) {
        // Calculate the actual coordinates with offsets
        const x = col + (xOffset * -1);
        const y = 0; // Y is always 0 for 2D grid
        const z = row + (zOffset * -1);
        
        // Special functions
        let command = colorData[value].template
          .replace(/{x}/g, x)
          .replace(/{y}/g, y)
          .replace(/{z}/g, z);


        //test crouch
        try {
          command = command.replace(/{crouch:True}/g, "execute at @s as @s positioned ~~1.5~ unless entity @s[dx=0] run");
          command = command.replace(/{crouch:False}/g, "execute at @s as @s positioned ~~1.5~ if entity @s[dx=0] run");
        } catch (e) {
          console.error("error in crouch test", e);
        }
        
        //trajectory
        try {
          command = command.replace(/{trajectory:(.+?)}/g, (_, expr) => {
            let [gravity, sy] = expr.split(",");
            gravity = Number(gravity);
            sy = Number(sy);
            return `execute at @s positioned ^${x}^{math:Math.floor(${sy} - Math.floor((${gravity} * (Math.floor((Math.sqrt(((${x})) ** 2 + ((${z})) ** 2)) * 100) / 100)) * 100)) / 100}^${z} run `;
          });
        } catch (e) {
          console.error("error in trajectory calculation", e);
        }
        
        //test water
        try {
          command = command.replace(/{inWater:True}/g, "execute at @s as @s if block ~~~ water run ");
          command = command.replace(/{inWater:False}/g, "execute at @s as @s unless block ~~-1~ water unless block ~~1~ water run ");
        } catch (e) {
          console.error("error in crouch test", e);
        }
        
        //test air
        try {
          command = command.replace(/{inAir:True}/g, "execute at @s as @s if block ~~-1~ air run ");
          command = command.replace(/{inAir:False}/g, "execute at @s as @s unless block ~~-1~ air run ");
        } catch (e) {
          console.error("error in crouch test", e);
        }
        
        //random num
        try {
          command = command.replace(/{random:(.+?)}/g, (_, expr) => {
            let [min, max] = expr.split(",");
            min = Number(min);
            max = Number(max);
            return Math.floor(Math.random() * (max - min) + min);
          });
        } catch (e) {
          console.error("error in random test", e);
        }
        
        //Knockback
        try {
          command = command.replace(/#knb:(.+?)#/g, (_, expr) => {
            //get all parameters
            let [range, pwr, dmtg] = expr.split("|");
            range = Number(range);
            let [hpower, vpower] = pwr.split(",");
            hpower = Number(hpower);
            vpower = Number(vpower);
            let [damage, tag] = dmtg.split(",");
            damage = Number(damage);
            
            //calculate distance
            let distance = Math.floor(Math.sqrt(((x) ** 2) + ((z) ** 2)) / 100) * 100;
            
            //Test if target in range
            let powerk;
            if (distance <= range) {
              powerk = 1;
            } else {
              powerk = range / distance;
            }
            //main part
            try {
              //test direction
              let dirx;
              let dirz;
              if (x > 0) {
                dirx = 1;
              } else if(x < 0) {
                dirx = (-1);
              } else {
                dirx = Math.floor(Math.random() * 2 - 1);
              }
              if (z > 0) {
                dirz = 1;
              } else if(z < 0) {
                dirz = (-1);
              } else {
                dirz = Math.floor(Math.random() * 2 - 1);
              }
              
              //get absolute position
              let xabs = Math.sqrt((x) ** 2);
              let zabs = Math.sqrt((z) ** 2);
              
              //get value of x and z
              const mltp = xabs + zabs;
              let xpower = x / mltp;
              let zpower = z / mltp;
              
              //get knb position
              let xknb = ((xabs + (hpower * powerk)) * dirx) * xpower;
              let zknb = ((zabs + (hpower * powerk)) * dirz) * zpower;
              let yknb = vpower * powerk;
              
              //generate command
              let result = `execute at @s positioned ^${x}^^${z} run tag @e[r=1] add ${tag}\n`;
              if ((x ==0) && (z ==0)) {
                result += `tag @s remove ${tag}\n`;
              }
              result += `execute at @s positioned ^${x}^^${z} run tp @e[r=1,tag=${tag}] ^${xknb}^${yknb}^${zknb}`;
              knbTags.push(tag);
              knbDamages.push(damage);
              return result;
              
            } catch(e) {
              console.error("error in main part of knockback", e);
            }
            return result;
          });
        } catch(e) {
          console.error("error in knockback calculation", e);
        }
        
        //Repeat
        let rptest = 0;
        try {
          command = command.replace(/#repeat:(.+?)#/g, (_, expr) => {
            let [cmd, loops, variables] = expr.split("|");
            loops = Number(loops);
            let result = "";
            console.log(cmd, loops, variables, expr);
            
            for (let i = 0; i < loops; i++) {
              try {
                // Replace {i} with the current iteration number
                let currentVariables = variables;
                try {
                  currentVariables = currentVariables.replace(/@i@/g, i);
                } catch (e) {
                  console.error("Error replacing {i}:", e);
                }
                
                // Split variables string into an array
                let varsArr = [];
                try {
                  varsArr = currentVariables.split(";");
                } catch (e) {
                  console.error("Error splitting variables:", e);
                }
                
                // Replace variable placeholders {var0}, {var1}, etc.
                let repeatedCmd = "";
                try {
                  repeatedCmd = cmd.replace(/@var(\d+)@/g, (_, index) => {
                    return varsArr[Number(index)];
                  });
                } catch (e) {
                  console.error("Error replacing {var} placeholders:", e);
                }
                
                // Replace math expressions
                try {
                  repeatedCmd = repeatedCmd.replace(/{math:(.+?)}/g, (_, expr) => eval(expr));
                } catch (e) {
                  console.error("Error evaluating math expression:", e);
                }
                
                result += repeatedCmd + "\n";
              } catch (e) {
                console.error(`Error processing iteration ${i}:`, e);
              }
            }
            result = result.trimEnd();
            rptest++;
            return result;
          });
        } catch (e) {
          console.error("Error in repeater:", e);
        }
        
        // Test math replacement outside the repeater if no repeats occurred
        if (rptest === 0) {
          try {
            command = command.replace(/{math:(.+?)}/g, (_, expr) => eval(expr));
          } catch (e) {
            console.error("Error evaluating math expression:", e);
          }
        } else {
          console.warn("Repeated:", rptest);
        }

        commands.push(command);
      }
    }
    //apply all repeating commands for optimization
    for(let i = 0; i < knbTags.length; i++) {
      commands.push(`damage @e[tag=${knbTags[i]}] ${knbDamages[i]}\ntag @e[tag=${knbTags[i]}] remove ${knbTags[i]}`);
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
  if (mobile == "checked" || moveGrid == "on") {
    return;
  }
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
  if (!isDragging || mobile == "checked" || moveGrid == "on") {
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

//mobile version
function handleCanvasClickm(e) {
  if (mobile == "unchecked" || moveGrid == "on") {
    return;
  }
  
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
function handleCanvasDragm(e) {
  if (!isDragging || mobile == "unchecked" || moveGrid == "on") {
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

function setupEventListeners() {
  let mobile;
  let moveGrid;
  setupControl();
  setupCanvasEvents();
  setupOffsetInputs();
  setupColorSelection();
  setupAddCommand();
  setupPreview();
  setupSave();
  setupModalCloseHandlers();
  setupTemplatesModal();
  setupControl();
}

function setupCanvasEvents() {
  const canvas = document.getElementById('grid-canvas');
  canvas.addEventListener('mousedown', handleCanvasClick);
  canvas.addEventListener('mousemove', handleCanvasDrag);
  window.addEventListener('mouseup', () => {
    isDragging = false;
    lastCell = null;
  });
  
  canvas.addEventListener('touchstart', handleCanvasClickm);
  canvas.addEventListener('touchmove', handleCanvasDragm);
  window.addEventListener('touchend', () => {
    isDragging = false;
    lastCell = null;
  });
}

function setupOffsetInputs() {
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
}

function setupColorSelection() {
  const selectColorBtn = document.getElementById('select-color-btn');
  const selectColorModal = document.getElementById('select-color-modal');

  selectColorBtn.addEventListener('click', () => {
    populateColorList();
    showModal(selectColorModal);
  });

  document.getElementById('color-list').addEventListener('click', (e) => {
    let targetItem = e.target;
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
}

function setupAddCommand() {
  const addCommandBtn = document.getElementById('add-command-btn');
  const addCommandModal = document.getElementById('add-command-modal');
  const addCommandForm = document.getElementById('add-command-form');
  const colorInput = document.getElementById('command-color');
  const colorPreview = document.getElementById('color-preview');

  addCommandBtn.addEventListener('click', () => {
    showModal(addCommandModal);
    // Update color preview on input
    const updatePreview = () => {
      colorPreview.style.backgroundColor = colorInput.value;
    };
    colorInput.addEventListener('input', updatePreview);
    updatePreview(); // Initial update
  });
  
  colorPreview.addEventListener('click', (e) => {
    const randomColor = () => {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
      };

    const newColor = randomColor();
    colorPreview.style.backgroundColor = newColor;
    colorInput.value = newColor;
    e.preventDefault();
  });

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

    // Reset the form to default values
    addCommandForm.reset();
    if (document.getElementById('debug-auto').checked ? true : false) {
      const randomColor = () => {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
      };

      const newColor = randomColor();
      document.getElementById('command-color').value = newColor;
      document.getElementById('command-template').value = '';
      document.getElementById('color-preview').style.backgroundColor = newColor;
      document.getElementById('command-name').value = randomColor();
    } else {
      document.getElementById('command-color').value = '';
      document.getElementById('command-template').value = '';
      document.getElementById('color-preview').style.backgroundColor = '#';
    }
    hideModal(addCommandModal);
  });
}

function setupPreview() {
  const previewBtn = document.getElementById('preview-btn');
  const previewModal = document.getElementById('preview-modal');
  const copyBtn = document.getElementById('copy-btn');

  previewBtn.addEventListener('click', () => {
    const previewContent = document.getElementById('preview-content');
    previewContent.textContent = getPreviewContent();
    showModal(previewModal);
  });

  copyBtn.addEventListener('click', () => {
    const previewContent = document.getElementById('preview-content');
    const textarea = document.createElement('textarea');
    textarea.value = previewContent.textContent;
    document.body.appendChild(textarea);
    textarea.select();

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
}

function setupSave() {
  const saveBtn = document.getElementById('save-btn');
  const saveModal = document.getElementById('save-modal');
  const saveForm = document.getElementById('save-form');

  saveBtn.addEventListener('click', () => {
    showModal(saveModal);
  });

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
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
    hideModal(saveModal);
  });
}

function setupModalCloseHandlers() {
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      hideModal(modal);
    });
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal);
      }
    });
  });
}

function setupTemplatesModal() {
  const templatesBtn = document.getElementById('templates-btn');
  const templatesModal = document.getElementById('templates-modal');
  const closeTemplateBtns = templatesModal.querySelectorAll('.close-modal');
  const commandTemplateTextarea = document.getElementById('command-template');
  const templateCopyButtons = document.querySelectorAll('.copy-template-btn');

  templatesBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent form submission if inside a form
    templatesModal.style.display = 'block';
  });

  closeTemplateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      templatesModal.style.display = 'none';
    });
  });

  // Close modal if clicking outside the modal-content
  window.addEventListener('click', (e) => {
    if (e.target === templatesModal) {
      templatesModal.style.display = 'none';
    }
  });

  // Copy template text on button click
  templateCopyButtons.forEach(button => {
    button.addEventListener('click', () => {
      const templateText = button.getAttribute('data-template');
      
      // Option 1: Insert into the command template textarea
      // commandTemplateTextarea.value = templateText;
      
      // Option 2: Copy to clipboard directly
      navigator.clipboard.writeText(templateText)
        .then(() => alert('Template copied to clipboard!'))
        .catch(err => console.error('Failed to copy!', err));

      // Optionally close the modal after selection
      templatesModal.style.display = 'none';
    });
  });
}

function setupControl() {
  const controlButton = document.getElementById('switch-mobile-pc');
  const moveControlBtn = document.getElementById('move-grid');
  const resetGrid = document.getElementById('reset-grid-btn');
  
  //Dragging setup
  mobile = controlButton.checked ? controlButton.value : "unchecked";
  controlButton.addEventListener('change', () => {
    mobile = controlButton.checked ? controlButton.value : "unchecked";
  });
  
  //Move on screen setup
  moveGrid = moveControlBtn.checked ? "on" : "off";
  moveControlBtn.addEventListener('change', () => {
    moveGrid = moveControlBtn.checked ? "on" : "off";
    const canvasMovingElement = document.getElementById('grid-canvas');
    canvasMovingElement.style.touchAction = moveControlBtn.checked ? "auto" : "none";
  });
  
  //reset grid
  let resetGridCounter = 0;
  resetGrid.addEventListener('click', () => {
    resetGridCounter++;
    if (resetGridCounter === 1) {
        // Add visual feedback for first click
        resetGrid.classList.add('clicked-once');
        // Remove the class after 2 seconds if second click doesn't happen
        setTimeout(() => {
            if (resetGridCounter === 1) {
                resetGridCounter = 0;
                resetGrid.classList.remove('clicked-once');
            }
        }, 2000);
    }
    if (resetGridCounter >= 2) {
        resetGridCounter = 0;
        resetGrid.classList.remove('clicked-once');
        // Clear the matrix
        matrix = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        // Redraw the grid
        drawGrid();
        console.log("grid was reset");
    }
  });
}