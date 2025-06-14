document.addEventListener('DOMContentLoaded', function() {
    class LootTableEditor {
        constructor() {
            // Initialize variables
            this.selectedFolder = '';
            this.files = [];
            this.selectedFiles = [];
            
            // Initialize lore mappings with current UTC time
            const now = new Date();
            const timestamp = now.toISOString().replace('T', ' ').substr(0, 19);
            
            
            // Initialize UI elements
            this.folderPathInput = document.getElementById('folder-path');
            this.fileList = document.getElementById('file-list');
            this.createNewPoolCheckbox = document.getElementById('create-new-pool');
            
            // Initialize form elements
            this.itemIdInput = document.getElementById('item-id');
            this.weightInput = document.getElementById('weight');
            this.rollsInput = document.getElementById('rolls');
            this.enchantLevelInput = document.getElementById('enchant-level');
            
            // Set up event listeners
            this.setupEventListeners();
        }
        
        setupEventListeners() {
            // Folder selection
            document.getElementById('select-folder').addEventListener('click', () => this.selectFolder());
            
            // File selection buttons
            document.getElementById('select-all').addEventListener('click', () => this.selectAll());
            document.getElementById('deselect-all').addEventListener('click', () => this.deselectAll());
            
            // Action buttons
            document.getElementById('apply-changes').addEventListener('click', () => this.applyChanges());
        }
        
        async selectFolder() {
            try {
                // Check if browser supports the File System Access API
                if (!('showDirectoryPicker' in window)) {
                    // Fallback for browsers that don't support File System Access API
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.webkitdirectory = true;
                    input.directory = true;
                    
                    input.onchange = (e) => {
                        const files = Array.from(e.target.files);
                        this.selectedFolder = e.target.files[0].webkitRelativePath.split('/')[0];
                        this.folderPathInput.value = this.selectedFolder;
                        this.loadFilesFromInput(files);
                    };
                    
                    input.click();
                    return;
                }
        
                // Modern browsers with File System Access API support
                const handle = await window.showDirectoryPicker({
                    mode: 'readwrite'
                });
                this.selectedFolder = handle;
                this.folderPathInput.value = handle.name;
                await this.loadFiles();
            } catch (error) {
                console.error('Folder selection failed:', error);
                alert(`Failed to select folder: ${error.message}`);
            }
        }
        
        async loadFiles() {
            try {
                const files = [];
                
                if (this.selectedFolder instanceof FileSystemDirectoryHandle) {
                    // Using File System Access API
                    for await (const entry of this.selectedFolder.values()) {
                        if (entry.kind === 'file' && entry.name.toLowerCase().endsWith('.json')) {
                            files.push({
                                name: entry.name,
                                handle: entry
                            });
                        }
                    }
                }
                
                this.files = files;
                this.selectedFiles = [];
                
                // Populate file list
                this.fileList.innerHTML = '';
                
                this.files.sort((a, b) => a.name.localeCompare(b.name)).forEach(file => {
                    const nameWithoutExt = file.name.replace('.json', '');
                    
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    item.textContent = nameWithoutExt;
                    item.dataset.file = file.name;
                    
                    item.addEventListener('click', () => {
                        item.classList.toggle('selected');
                        
                        if (item.classList.contains('selected')) {
                            if (!this.selectedFiles.some(f => f.name === file.name)) {
                                this.selectedFiles.push(file);
                            }
                        } else {
                            this.selectedFiles = this.selectedFiles.filter(f => f.name !== file.name);
                        }
                    });
                    
                    this.fileList.appendChild(item);
                });
            } catch (error) {
                console.error('Loading files failed:', error);
                alert(`Failed to load files: ${error.message}`);
            }
        }                
        
        // Add this new method to handle files from input element
        async loadFilesFromInput(inputFiles) {
            try {
                const files = [];
                
                // Filter JSON files
                for (const file of inputFiles) {
                    if (file.name.toLowerCase().endsWith('.json')) {
                        files.push({
                            name: file.name,
                            handle: file
                        });
                    }
                }
                
                this.files = files;
                this.selectedFiles = [];
                
                // Populate file list
                this.fileList.innerHTML = '';
                
                this.files.sort((a, b) => a.name.localeCompare(b.name)).forEach(file => {
                    const nameWithoutExt = file.name.replace('.json', '');
                    
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    item.textContent = nameWithoutExt;
                    item.dataset.file = file.name;
                    
                    item.addEventListener('click', () => {
                        item.classList.toggle('selected');
                        
                        if (item.classList.contains('selected')) {
                            this.selectedFiles.push(file);
                        } else {
                            const index = this.selectedFiles.findIndex(f => f.name === file.name);
                            if (index !== -1) {
                                this.selectedFiles.splice(index, 1);
                            }
                        }
                    });
                    
                    this.fileList.appendChild(item);
                });
            } catch (error) {
                console.error('Loading files failed:', error);
                alert(`Failed to load files: ${error.message}`);
            }
        }                
        
        selectAll() {
            const items = this.fileList.querySelectorAll('.file-item');
            items.forEach(item => {
                item.classList.add('selected');
                const fileName = item.dataset.file;
                const file = this.files.find(f => f.name === fileName);
                if (file && !this.selectedFiles.includes(file)) {
                    this.selectedFiles.push(file);
                }
            });
        }                
        
        deselectAll() {
            const items = this.fileList.querySelectorAll('.file-item');
            items.forEach(item => {
                item.classList.remove('selected');
            });
            this.selectedFiles = [];
        }
        
        validateInput() {
            if (!this.itemIdInput.value) {
                alert("Item ID is required!");
                return false;
            }
            
            const weight = parseInt(this.weightInput.value);
            if (isNaN(weight) || weight < 1 || weight > 100) {
                alert("Weight must be a number between 1 and 100!");
                return false;
            }
            
            const rolls = parseInt(this.rollsInput.value);
            if (isNaN(rolls) || rolls < 1) {
                alert("Number of rolls must be a positive integer!");
                return false;
            }
            
            const level = this.enchantLevelInput.value ? parseInt(this.enchantLevelInput.value) : 0;
            if (isNaN(level) || level < 0) {
                alert("Enchantment level must be a positive integer!");
                return false;
            }
            
            return true;
        }
        
        generateNewEntry(fileName) {
            const baseName = fileName.replace('.json', '');
            
            const entry = {
                "type": "item",
                "name": this.itemIdInput.value,
                "weight": parseInt(this.weightInput.value),
                "functions": [] // Initialize functions array
            };
        
            // Add enchantments if specified
            if (this.enchantLevelInput.value) {
                entry.functions.push({
                    "function": "enchant_with_levels",
                    "levels": parseInt(this.enchantLevelInput.value)
                });
            }
        
            // Always add lore using the loot table name
            entry.functions.push({
                "function": "set_lore",
                "lore": [`§klt{${baseName}}`]
            });
        
            return entry;
        }
        
        async generateModifiedLootTable(content, fileName) {
            try {
                const lootTable = JSON.parse(content);
                
                // Ensure pools array exists
                if (!lootTable.pools) {
                    lootTable.pools = [];
                }
                
                if (this.createNewPoolCheckbox.checked) {
                    // Create new pool
                    const newPool = {
                        rolls: parseInt(this.rollsInput.value),
                        entries: [this.generateNewEntry(fileName)]
                    };
                    lootTable.pools.push(newPool);
                } else {
                    // Modify last existing pool
                    let targetPool;
                    if (lootTable.pools.length > 0) {
                        targetPool = lootTable.pools[lootTable.pools.length - 1];
                        targetPool.rolls = parseInt(this.rollsInput.value);
                        targetPool.entries.push(this.generateNewEntry(fileName));
                    } else {
                        // If no pools exist, create one anyway
                        targetPool = {
                            rolls: parseInt(this.rollsInput.value),
                            entries: [this.generateNewEntry(fileName)]
                        };
                        lootTable.pools.push(targetPool);
                    }
                }
                
                return JSON.stringify(lootTable, null, 2);
            } catch (error) {
                throw new Error(`Failed to modify loot table: ${error.message}`);
            }
        }
    
         async applyChanges() {
             // 1. Validate inputs
             if (!this.validateInput()) {
                 return;
             }
             if (this.selectedFiles.length === 0) {
                 alert("No files selected!");
                 return;
             }
         
             // 2. Confirm action
             const poolAction = this.createNewPoolCheckbox.checked ? "create new pools" : "modify existing pools";
             const confirmResult = confirm(
                 `Are you sure you want to modify ${this.selectedFiles.length} file(s)?\n` +
                 `Action: ${poolAction}\n` +
                 `This will create a zip file with the modified files and backups.`
             );
             if (!confirmResult) {
                 return;
             }
         
             try {
                 // 3. Show progress UI
                 const progressContainer = document.getElementById('progress-container');
                 const progressFill = document.getElementById('progress-fill');
                 const progressText = document.getElementById('progress-text');
                 progressContainer.style.display = 'block';
         
                 // 4. Prepare ZIP
                 const zip = new JSZip();
                 const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                 const modifiedFolder = zip.folder("modified_loot_tables");
                 const backupFolder   = zip.folder("backups");
         
                 let processedCount = 0;
                 const totalFiles   = this.selectedFiles.length;
         
                 // 5. Process each file
                 for (const fileObj of this.selectedFiles) {
                     try {
                         if (!fileObj || !fileObj.name) {
                             console.error('Invalid file object:', fileObj);
                             continue;
                         }
         
                         console.log('Processing file:', fileObj.name);
         
                         // 5a. Read file contents (modern FS API vs. legacy)
                         let content;
                         if (this.selectedFolder instanceof FileSystemDirectoryHandle) {
                             // Desktop/modern
                             const fileHandle = await this.selectedFolder.getFileHandle(fileObj.name);
                             const file       = await fileHandle.getFile();
                             content = await file.text();
                         } else {
                             // iOS/other-legacy
                             content = await fileObj.handle.text();
                         }
         
                         // 5b. Backup original
                         backupFolder.file(
                             `${fileObj.name}.${timestamp}.backup`,
                             content
                         );
         
                         // 5c. Modify loot table
                         const modifiedContent = await this.generateModifiedLootTable(content, fileObj.name);
         
                         // 5d. Add modified
                         modifiedFolder.file(fileObj.name, modifiedContent);
         
                         // 5e. Update progress
                         processedCount++;
                         const pct = (processedCount / totalFiles) * 100;
                         progressFill.style.width   = `${pct}%`;
                         progressText.textContent   = `Processing files: ${processedCount}/${totalFiles}`;
         
                     } catch (fileError) {
                         progressContainer.style.display = 'none';
                         alert(`Error processing ${fileObj.name}: ${fileError.message}`);
                         return;
                     }
                 }
         
                 // 6. Generate & download ZIP
                 progressText.textContent = 'Generating zip file...';
                 const zipBlob = await zip.generateAsync({ type: "blob" });
                 const downloadLink = document.createElement('a');
                 downloadLink.href = URL.createObjectURL(zipBlob);
                 downloadLink.download = `loot_tables_${timestamp}.zip`;
                 document.body.appendChild(downloadLink);
                 downloadLink.click();
                 document.body.removeChild(downloadLink);
                 URL.revokeObjectURL(downloadLink.href);
         
                 // 7. Final alert & reset
                 alert(
                     `Successfully processed ${processedCount} file(s)!\n` +
                     `Action performed: ${poolAction}\n` +
                     `Modified files and backups are in the downloaded zip file.`
                 );
                 progressContainer.style.display = 'none';
                 progressFill.style.width = '0%';
                 progressText.textContent = 'Processing files: 0/0';
         
             } catch (zipError) {
                 // Overall failure
                 const progressContainer = document.getElementById('progress-container');
                 progressContainer.style.display = 'none';
                 console.error('Failed to create zip file:', zipError);
                 alert(`Failed to create zip file: ${zipError.message}`);
             }
         }        
                                            
        async readFile(filePath) {
            try {
                const handle = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: {'application/json': ['.json']}
                    }],
                });
                const file = await handle.getFile();
                const content = await file.text();
                return JSON.parse(content);
            } catch (error) {
                console.error('File reading failed:', error);
                throw new Error(`Failed to read file: ${error.message}`);
            }
        }          
    }
      
    // Initialize the application
    const app = new LootTableEditor();
});

