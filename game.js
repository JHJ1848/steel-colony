class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('game-canvas'),
            antialias: true, // 启用抗锯齿
            alpha: false // 禁用alpha通道以提高性能
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x2a2a2a);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比以提高性能
        this.renderer.shadowMap.enabled = true; // 启用阴影以提高视觉效果
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 使用柔和阴影

        this.resources = {
            wood: 0,
            stone: 0,
            food: 0,
            steel: 0,
            iron: 0,
            coal: 0,
            oil: 0
        };

        this.resourceCapacity = {
            wood: 100,
            stone: 100,
            food: 100,
            steel: 100,
            iron: 100,
            coal: 100,
            oil: 100
        };

        this.buildings = [];
        this.resourcesNodes = [];
        this.selectedBuildType = null;
        this.gameGoals = [
            { type: 'build', target: 5, building: 'mine', description: '建造 5 个矿场' },
            { type: 'build', target: 3, building: 'farm', description: '建造 3 个农场' },
            { type: 'build', target: 2, building: 'factory', description: '建造 2 个工厂' },
            { type: 'resource', target: 100, resource: 'steel', description: '收集 100 个钢铁' },
            { type: 'build', target: 1, building: 'warehouse', description: '建造 1 个仓库' },
            { type: 'totalBuildings', target: 15, description: '建造总计 15 个建筑' }
        ];
        this.currentGoalIndex = 0;
        this.gameStartedTime = Date.now();
        this.particleSystems = [];
        this.animatingNodes = [];
        
        // 初始化游戏设置
        this.settings = this.loadSettings();
        
        // 显示加载界面
        this.showLoadScreen();

        this.initCamera();
        this.initLighting();
        this.initTerrain();
        this.initResourceNodes();
        this.initEventListeners();
        this.updateGoalDisplay();
        
        // 模拟加载过程
        setTimeout(() => {
            this.hideLoadScreen();
            this.animate();
        }, 2000);
    }

    initCamera() {
        this.camera.position.set(50, 100, 50);
        this.camera.lookAt(0, 0, 0);
    }

    initLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        this.scene.add(directionalLight);
    }

    initTerrain() {
        // 使用 BufferGeometry 替代 Geometry 以提高性能
        const geometry = new THREE.PlaneBufferGeometry(200, 200, 50, 50);
        
        // 添加随机高度以创建地形起伏
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] = Math.random() * 5 - 2.5;
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // 使用更高级的材质以提高视觉效果
        const material = new THREE.MeshStandardMaterial({
            color: 0x664422,
            side: THREE.DoubleSide,
            roughness: 0.8,
            vertexColors: false
        });
        
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        this.scene.add(terrain);
    }

    initResourceNodes() {
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            this.createTree(x, z);
        }

        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            this.createStone(x, z);
        }

        for (let i = 0; i < 6; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            this.createIronOre(x, z);
        }

        for (let i = 0; i < 7; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            this.createCoal(x, z);
        }

        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            this.createOil(x, z);
        }
    }

    createTree(x, z) {
        const trunkGeometry = new THREE.CylinderGeometry(1, 1.5, 10, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 5, z);

        const leavesGeometry = new THREE.SphereGeometry(5, 8, 8);
        const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.set(x, 15, z);

        this.scene.add(trunk);
        this.scene.add(leaves);

        this.resourcesNodes.push({
            type: 'tree',
            position: new THREE.Vector3(x, 0, z),
            mesh: [trunk, leaves],
            amount: 10
        });
    }

    createStone(x, z) {
        const geometry = new THREE.BoxGeometry(3, 3, 3);
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const stone = new THREE.Mesh(geometry, material);
        stone.position.set(x, 1.5, z);

        this.scene.add(stone);

        this.resourcesNodes.push({
            type: 'stone',
            position: new THREE.Vector3(x, 0, z),
            mesh: [stone],
            amount: 8
        });
    }

    createIronOre(x, z) {
        const geometry = new THREE.BoxGeometry(3, 2, 3);
        const material = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.7, roughness: 0.3 });
        const ironOre = new THREE.Mesh(geometry, material);
        ironOre.position.set(x, 1, z);

        this.scene.add(ironOre);

        this.resourcesNodes.push({
            type: 'iron',
            position: new THREE.Vector3(x, 0, z),
            mesh: [ironOre],
            amount: 6
        });
    }

    createCoal(x, z) {
        const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const coal = new THREE.Mesh(geometry, material);
        coal.position.set(x, 1.25, z);

        this.scene.add(coal);

        this.resourcesNodes.push({
            type: 'coal',
            position: new THREE.Vector3(x, 0, z),
            mesh: [coal],
            amount: 7
        });
    }

    createOil(x, z) {
        const baseGeometry = new THREE.CylinderGeometry(2, 2, 1, 8);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(x, 0.5, z);

        const pumpGeometry = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        const pumpMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const pump = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pump.position.set(x, 2, z);

        const oilGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 8);
        const oilMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const oil = new THREE.Mesh(oilGeometry, oilMaterial);
        oil.position.set(x, 1.25, z);

        this.scene.add(base);
        this.scene.add(pump);
        this.scene.add(oil);

        this.resourcesNodes.push({
            type: 'oil',
            position: new THREE.Vector3(x, 0, z),
            mesh: [base, pump, oil],
            amount: 5
        });
    }

    initEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener('click', (event) => {
            this.handleClick(event);
        });

        document.querySelectorAll('.build-item').forEach(item => {
            item.addEventListener('click', (event) => {
                event.stopPropagation();
                this.selectBuildType(item.dataset.type);
            });

            item.addEventListener('mouseover', (event) => {
                this.showTooltip(event, item.dataset.type);
            });

            item.addEventListener('mouseout', () => {
                this.hideTooltip();
            });
        });
        
        // 资源交易系统事件监听器
        const inputResource = document.getElementById('input-resource');
        const outputResource = document.getElementById('output-resource');
        const inputAmount = document.getElementById('input-amount');
        const outputAmount = document.getElementById('output-amount');
        const tradeRateInfo = document.getElementById('trade-rate-info');
        const tradeBtn = document.getElementById('trade-btn');
        const convertBtn = document.getElementById('convert-btn');
        
        const updateTradeOutput = () => {
            const inputRes = inputResource.value;
            const outputRes = outputResource.value;
            const amount = parseInt(inputAmount.value) || 0;
            
            if (inputRes === outputRes) {
                outputAmount.textContent = amount;
                tradeRateInfo.textContent = '转换比例: 1:1';
            } else {
                // 交易比率：不同资源之间的转换比例
                const tradeRate = this.getTradeRate(inputRes, outputRes);
                outputAmount.textContent = Math.floor(amount * tradeRate);
                tradeRateInfo.textContent = `转换比例: 1:${tradeRate.toFixed(2)}`;
            }
        };
        
        inputResource.addEventListener('change', updateTradeOutput);
        outputResource.addEventListener('change', updateTradeOutput);
        inputAmount.addEventListener('input', updateTradeOutput);
        
        tradeBtn.addEventListener('click', () => {
            const inputRes = inputResource.value;
            const outputRes = outputResource.value;
            const inputAmt = parseInt(inputAmount.value) || 0;
            const outputAmt = parseInt(outputAmount.textContent) || 0;
            
            if (inputRes !== outputRes && inputAmt > 0) {
                // 检查是否有足够的输入资源
                if (this.resources[inputRes] >= inputAmt) {
                    // 检查输出资源是否有足够的存储容量
                    if (this.resources[outputRes] + outputAmt <= this.resourceCapacity[outputRes]) {
                        // 执行交易
                        this.resources[inputRes] -= inputAmt;
                        this.resources[outputRes] += outputAmt;
                        this.updateResourceDisplay();
                        this.showNotification(`成功交易: ${inputAmt} ${this.getResourceName(inputRes)} → ${outputAmt} ${this.getResourceName(outputRes)}`);
                    } else {
                        alert('输出资源存储容量不足！');
                    }
                } else {
                    alert('输入资源不足！');
                }
            }
        });
        
        convertBtn.addEventListener('click', () => {
            const inputRes = inputResource.value;
            const outputRes = outputResource.value;
            const inputAmt = parseInt(inputAmount.value) || 0;
            
            if (inputRes !== outputRes && inputAmt > 0) {
                const success = this.convertResources(inputRes, outputRes, inputAmt);
                if (success) {
                    const outputAmt = Math.floor(inputAmt * this.getTradeRate(inputRes, outputRes));
                    this.showNotification(`成功转换: ${inputAmt + Math.floor(inputAmt * 0.1)} ${this.getResourceName(inputRes)} → ${outputAmt} ${this.getResourceName(outputRes)}`);
                }
            }
        });
        
        // 初始化交易输出显示
        updateTradeOutput();
        
        // 添加设置按钮点击事件
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.showSettingsMenu();
            });
        }
    }

    loadSettings() {
        const defaultSettings = {
            sound: 70,
            music: 50,
            graphics: 'medium',
            shadows: true
        };

        try {
            const savedSettings = localStorage.getItem('steelColonySettings');
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        } catch (error) {
            console.error('Failed to load settings:', error);
            return defaultSettings;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('steelColonySettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    showSettingsMenu() {
        this.hideBuildingMenu();
        
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.id = 'settings-modal';
        
        const content = document.createElement('div');
        content.className = 'settings-content';
        
        content.innerHTML = `
            <h2>游戏设置</h2>
            
            <div class="setting-item">
                <label for="sound-slider">音效音量: ${this.settings.sound}%</label>
                <input type="range" id="sound-slider" min="0" max="100" value="${this.settings.sound}">
            </div>
            
            <div class="setting-item">
                <label for="music-slider">音乐音量: ${this.settings.music}%</label>
                <input type="range" id="music-slider" min="0" max="100" value="${this.settings.music}">
            </div>
            
            <div class="setting-item">
                <label for="graphics-select">画质设置</label>
                <select id="graphics-select">
                    <option value="low" ${this.settings.graphics === 'low' ? 'selected' : ''}>低</option>
                    <option value="medium" ${this.settings.graphics === 'medium' ? 'selected' : ''}>中</option>
                    <option value="high" ${this.settings.graphics === 'high' ? 'selected' : ''}>高</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label for="shadows-toggle">阴影效果: ${this.settings.shadows ? '开启' : '关闭'}</label>
                <input type="checkbox" id="shadows-toggle" ${this.settings.shadows ? 'checked' : ''}>
            </div>
            
            <div class="setting-item">
                <button id="save-btn">保存设置</button>
                <button id="cancel-btn">取消</button>
                <button id="save-game-btn" style="margin-top: 10px; width: 100%;">保存游戏</button>
                <button id="load-game-btn" style="margin-top: 10px; width: 100%;">加载游戏</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 添加事件监听器
        const soundSlider = document.getElementById('sound-slider');
        if (soundSlider) {
            soundSlider.addEventListener('input', (e) => {
                this.settings.sound = parseInt(e.target.value);
                document.querySelector('label[for="sound-slider"]').textContent = `音效音量: ${this.settings.sound}%`;
            });
        }
        
        const musicSlider = document.getElementById('music-slider');
        if (musicSlider) {
            musicSlider.addEventListener('input', (e) => {
                this.settings.music = parseInt(e.target.value);
                document.querySelector('label[for="music-slider"]').textContent = `音乐音量: ${this.settings.music}%`;
            });
        }
        
        const graphicsSelect = document.getElementById('graphics-select');
        if (graphicsSelect) {
            graphicsSelect.addEventListener('change', (e) => {
                this.settings.graphics = e.target.value;
            });
        }
        
        const shadowsToggle = document.getElementById('shadows-toggle');
        if (shadowsToggle) {
            shadowsToggle.addEventListener('change', (e) => {
                this.settings.shadows = e.target.checked;
                document.querySelector('label[for="shadows-toggle"]').textContent = `阴影效果: ${this.settings.shadows ? '开启' : '关闭'}`;
            });
        }
        
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveSettings();
                this.applySettings();
                this.hideSettingsMenu();
            });
        }
        
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideSettingsMenu();
            });
        }
        
        const saveGameBtn = document.getElementById('save-game-btn');
        if (saveGameBtn) {
            saveGameBtn.addEventListener('click', () => {
                this.saveGame();
            });
        }
        
        const loadGameBtn = document.getElementById('load-game-btn');
        if (loadGameBtn) {
            loadGameBtn.addEventListener('click', () => {
                this.loadGame();
            });
        }
    }

    hideSettingsMenu() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.remove();
        }
    }

    applySettings() {
        // 应用图形设置
        if (this.settings.graphics === 'low') {
            this.renderer.setPixelRatio(1);
            this.renderer.shadowMap.enabled = false;
        } else if (this.settings.graphics === 'medium') {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            this.renderer.shadowMap.enabled = this.settings.shadows;
        } else if (this.settings.graphics === 'high') {
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
        }
    }

    showLoadScreen() {
        const loadScreen = document.createElement('div');
        loadScreen.className = 'load-screen';
        loadScreen.id = 'load-screen';
        
        loadScreen.innerHTML = `
            <h2>STEEL COLONY</h2>
            <div class="load-bar">
                <div class="load-progress" style="width: 0%"></div>
            </div>
            <div class="load-text">加载中...</div>
        `;
        
        document.body.appendChild(loadScreen);
        
        // 模拟加载进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 100) {
                clearInterval(interval);
                return;
            }
            
            const progressBar = document.querySelector('.load-progress');
            const loadText = document.querySelector('.load-text');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (loadText) {
                loadText.textContent = `加载中... ${progress}%`;
            }
        }, 100);
    }

    hideLoadScreen() {
        const loadScreen = document.getElementById('load-screen');
        if (loadScreen) {
            loadScreen.remove();
        }
    }

    saveGame() {
        const gameData = {
            resources: this.resources,
            buildings: this.buildings,
            gameGoals: this.gameGoals,
            currentGoalIndex: this.currentGoalIndex,
            gameStartedTime: this.gameStartedTime
        };
        
        try {
            localStorage.setItem('steelColonySave', JSON.stringify(gameData));
            this.showNotification('游戏保存成功！');
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showNotification('游戏保存失败！');
        }
    }

    loadGame() {
        try {
            const savedGame = localStorage.getItem('steelColonySave');
            if (savedGame) {
                const gameData = JSON.parse(savedGame);
                
                // 恢复游戏状态
                this.resources = gameData.resources;
                this.buildings = gameData.buildings;
                this.gameGoals = gameData.gameGoals;
                this.currentGoalIndex = gameData.currentGoalIndex;
                this.gameStartedTime = gameData.gameStartedTime;
                
                // 重新创建建筑模型
                for (const building of this.buildings) {
                    let model;
                    switch (building.type) {
                        case 'mine':
                            model = this.createMineModel(building.position);
                            break;
                        case 'farm':
                            model = this.createFarmModel(building.position);
                            break;
                        case 'factory':
                            model = this.createFactoryModel(building.position);
                            break;
                        case 'warehouse':
                            model = this.createWarehouseModel(building.position);
                            break;
                    }
                    building.mesh = model;
                }
                
                this.updateResourceDisplay();
                this.updateGoalDisplay();
                this.showNotification('游戏加载成功！');
                this.hideSettingsMenu();
            } else {
                this.showNotification('没有找到保存的游戏！');
            }
        } catch (error) {
            console.error('Failed to load game:', error);
            this.showNotification('游戏加载失败！');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.background = 'rgba(0, 102, 204, 0.9)';
        notification.style.color = '#fff';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '4000';
        notification.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    getTradeRate(inputRes, outputRes) {
        // 定义不同资源之间的交易比率
        // 高级资源的转换比例不同，保持游戏平衡性
        const rates = {
            wood: { stone: 0.8, food: 0.9, steel: 0.5, iron: 0.6, coal: 0.7, oil: 0.6 },
            stone: { wood: 0.8, food: 0.9, steel: 0.5, iron: 0.6, coal: 0.7, oil: 0.6 },
            food: { wood: 0.8, stone: 0.8, steel: 0.4, iron: 0.5, coal: 0.6, oil: 0.5 },
            steel: { wood: 1.5, stone: 1.5, food: 2.0, iron: 1.2, coal: 1.2, oil: 1.3 },
            iron: { wood: 1.0, stone: 1.0, food: 1.1, steel: 0.7, coal: 0.9, oil: 0.8 },
            coal: { wood: 1.0, stone: 1.0, food: 1.1, steel: 0.7, iron: 0.9, oil: 0.8 },
            oil: { wood: 1.1, stone: 1.1, food: 1.2, steel: 0.8, iron: 1.0, coal: 1.0 }
        };
        
        return rates[inputRes][outputRes] || 1;
    }
    
    convertResources(inputRes, outputRes, amount) {
        // 资源转换功能，包含消耗机制
        const baseRate = this.getTradeRate(inputRes, outputRes);
        const conversionCost = Math.floor(amount * 0.1); // 10% 的转换损耗
        const actualInput = amount + conversionCost;
        
        // 检查是否有足够的输入资源
        if (this.resources[inputRes] >= actualInput) {
            // 检查输出资源是否有足够的存储容量
            const outputAmount = Math.floor(amount * baseRate);
            if (this.resources[outputRes] + outputAmount <= this.resourceCapacity[outputRes]) {
                // 执行转换
                this.resources[inputRes] -= actualInput;
                this.resources[outputRes] += outputAmount;
                this.updateResourceDisplay();
                return true;
            } else {
                alert('输出资源存储容量不足！');
                return false;
            }
        } else {
            alert(`输入资源不足！需要 ${actualInput} ${this.getResourceName(inputRes)}`);
            return false;
        }
    }

    showTooltip(event, buildType) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.id = 'build-tooltip';

        let cost = {};
        switch (buildType) {
            case 'mine':
                cost = { stone: 10, wood: 5 };
                break;
            case 'farm':
                cost = { wood: 8, stone: 3 };
                break;
            case 'factory':
                cost = { wood: 15, stone: 10 };
                break;
        }

        let tooltipContent = `<strong>${this.getBuildTypeName(buildType)}</strong><br>`;
        tooltipContent += '成本:<br>';
        for (const [resource, amount] of Object.entries(cost)) {
            tooltipContent += `${this.getResourceName(resource)}: ${amount}<br>`;
        }
        tooltipContent += '<br>功能:<br>';
        tooltipContent += this.getBuildTypeDescription(buildType);

        tooltip.innerHTML = tooltipContent;
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';

        document.body.appendChild(tooltip);
    }

    hideTooltip() {
        const tooltip = document.getElementById('build-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    getBuildTypeName(type) {
        switch (type) {
            case 'mine': return '矿场';
            case 'farm': return '农场';
            case 'factory': return '工厂';
            default: return type;
        }
    }

    getResourceName(resource) {
        switch (resource) {
            case 'wood': return '木材';
            case 'stone': return '石头';
            case 'food': return '食物';
            case 'steel': return '钢铁';
            case 'iron': return '铁矿';
            case 'coal': return '煤炭';
            case 'oil': return '石油';
            default: return resource;
        }
    }

    getBuildTypeDescription(type) {
        switch (type) {
            case 'mine': return '自动生产石头资源';
            case 'farm': return '自动生产食物资源';
            case 'factory': return '自动生产木材、石头和钢铁资源';
            case 'warehouse': return '增加资源存储上限';
            default: return '';
        }
    }

    handleClick(event) {
        if (this.selectedBuildType) {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(this.scene.children);
            if (intersects.length > 0) {
                const hitPoint = intersects[0].point;
                this.buildStructure(this.selectedBuildType, hitPoint);
            }
        } else {
            if (!this.checkBuildingClick(event)) {
                this.checkResourceClick(event);
            }
        }
    }

    checkBuildingClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        for (const building of this.buildings) {
            const intersects = raycaster.intersectObject(building.mesh);
            if (intersects.length > 0) {
                this.showBuildingMenu(building);
                return true;
            }
        }
        
        this.hideBuildingMenu();
        return false;
    }

    showBuildingMenu(building) {
        this.hideBuildingMenu();
        
        const menu = document.createElement('div');
        menu.className = 'building-menu';
        menu.id = 'building-menu';
        
        const upgradeCost = this.getUpgradeCost(building.type, building.level);
        const canUpgrade = this.canAfford(upgradeCost);
        
        let menuContent = `<strong>${this.getBuildTypeName(building.type)}</strong><br>`;
        menuContent += `等级: ${building.level}<br>`;
        
        if (building.type === 'warehouse') {
            menuContent += `存储容量加成: ${50 * building.level}/单位<br><br>`;
        } else {
            menuContent += `生产速率: ${building.productionRate.toFixed(1)}/秒<br><br>`;
        }
        
        menuContent += `升级成本:<br>`;
        
        for (const [resource, amount] of Object.entries(upgradeCost)) {
            menuContent += `${this.getResourceName(resource)}: ${amount}<br>`;
        }
        
        menuContent += `<br><button id="upgrade-btn" ${!canUpgrade ? 'disabled' : ''}>
            ${canUpgrade ? '升级' : '资源不足'}
        </button>`;
        
        menu.innerHTML = menuContent;
        menu.style.position = 'absolute';
        menu.style.background = 'rgba(20, 20, 30, 0.9)';
        menu.style.color = '#fff';
        menu.style.padding = '15px';
        menu.style.borderRadius = '5px';
        menu.style.border = '1px solid #444';
        menu.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.3)';
        menu.style.pointerEvents = 'auto';
        menu.style.zIndex = '1000';
        menu.style.left = '50%';
        menu.style.top = '50%';
        menu.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(menu);
        
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn) {
            upgradeBtn.style.marginTop = '10px';
            upgradeBtn.style.padding = '8px 15px';
            upgradeBtn.style.backgroundColor = canUpgrade ? '#0066cc' : '#555';
            upgradeBtn.style.color = '#fff';
            upgradeBtn.style.border = 'none';
            upgradeBtn.style.borderRadius = '3px';
            upgradeBtn.style.cursor = canUpgrade ? 'pointer' : 'not-allowed';
            
            upgradeBtn.addEventListener('click', () => {
                if (this.upgradeBuilding(building)) {
                    this.showBuildingMenu(building);
                }
            });
        }
    }

    hideBuildingMenu() {
        const menu = document.getElementById('building-menu');
        if (menu) {
            menu.remove();
        }
    }

    checkResourceClick(event) {
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        for (let i = this.resourcesNodes.length - 1; i >= 0; i--) {
            const node = this.resourcesNodes[i];
            for (const mesh of node.mesh) {
                const intersects = raycaster.intersectObject(mesh);
                if (intersects.length > 0) {
                    this.collectResource(node, i);
                    return;
                }
            }
        }
    }

    createParticleSystem(position, color) {
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 20;

        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 2;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.5,
            color: color,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        particleSystem.position.copy(position);
        particleSystem.position.y += 5;

        this.scene.add(particleSystem);
        this.particleSystems.push({
            system: particleSystem,
            age: 0,
            maxAge: 1000
        });

        return particleSystem;
    }

    animateResourceNode(node) {
        if (!node.isAnimating) {
            node.isAnimating = true;
            node.animationStartTime = Date.now();
            node.originalScale = [];
            
            for (const mesh of node.mesh) {
                node.originalScale.push(mesh.scale.clone());
            }
            
            this.animatingNodes.push(node);
        }
    }

    updateAnimations() {
        const now = Date.now();
        
        // Update particle systems
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const particleSystem = this.particleSystems[i];
            particleSystem.age += 16; // Assume 60 FPS
            
            if (particleSystem.age > particleSystem.maxAge) {
                this.scene.remove(particleSystem.system);
                this.particleSystems.splice(i, 1);
            } else {
                // Animate particles
                particleSystem.system.rotation.y += 0.02;
                particleSystem.system.material.opacity = 1 - (particleSystem.age / particleSystem.maxAge);
                
                // Move particles upward
                const position = particleSystem.system.geometry.attributes.position;
                for (let j = 0; j < position.count; j++) {
                    position.setY(j, position.getY(j) + 0.01);
                }
                position.needsUpdate = true;
            }
        }
        
        // Update animating resource nodes
        for (let i = this.animatingNodes.length - 1; i >= 0; i--) {
            const node = this.animatingNodes[i];
            const elapsed = now - node.animationStartTime;
            const duration = 500;
            
            if (elapsed > duration) {
                // Reset scale
                for (let j = 0; j < node.mesh.length; j++) {
                    node.mesh[j].scale.copy(node.originalScale[j]);
                }
                node.isAnimating = false;
                this.animatingNodes.splice(i, 1);
            } else {
                // Animate scale
                const progress = elapsed / duration;
                const scaleFactor = 1 + Math.sin(progress * Math.PI) * 0.2;
                
                for (const mesh of node.mesh) {
                    mesh.scale.set(
                        node.originalScale[0].x * scaleFactor,
                        node.originalScale[0].y * scaleFactor,
                        node.originalScale[0].z * scaleFactor
                    );
                }
            }
        }
    }

    collectResource(node, index) {
        let resourceType;
        let particleColor;
        
        switch (node.type) {
            case 'tree':
                resourceType = 'wood';
                particleColor = 0x228B22;
                break;
            case 'stone':
                resourceType = 'stone';
                particleColor = 0x808080;
                break;
            case 'iron':
                resourceType = 'iron';
                particleColor = 0xb0b0b0;
                break;
            case 'coal':
                resourceType = 'coal';
                particleColor = 0x333333;
                break;
            case 'oil':
                resourceType = 'oil';
                particleColor = 0x111111;
                break;
        }

        if (resourceType) {
            // 检查是否有足够的存储容量
            if (this.resources[resourceType] < this.resourceCapacity[resourceType]) {
                this.resources[resourceType] += 1;
                
                // Create particle effect
                this.createParticleSystem(node.position, particleColor);
                
                // Animate resource node
                this.animateResourceNode(node);
                
                // Show resource gain text
                this.showResourceGainText(node.position, resourceType, 1);
            }
        }

        node.amount -= 1;
        if (node.amount <= 0) {
            for (const mesh of node.mesh) {
                this.scene.remove(mesh);
            }
            this.resourcesNodes.splice(index, 1);
        }

        this.updateResourceDisplay();
    }

    buildStructure(type, position) {
        let cost = {};
        let model;

        switch (type) {
            case 'mine':
                cost = { stone: 10, wood: 5 };
                model = this.createMineModel(position);
                break;
            case 'farm':
                cost = { wood: 8, stone: 3 };
                model = this.createFarmModel(position);
                break;
            case 'factory':
                cost = { wood: 15, stone: 10 };
                model = this.createFactoryModel(position);
                break;
            case 'warehouse':
                cost = { wood: 10, stone: 15, steel: 5 };
                model = this.createWarehouseModel(position);
                break;
        }

        if (this.canAfford(cost)) {
            this.payCost(cost);
            const building = {
                type: type,
                position: position,
                mesh: model,
                level: 1
            };
            
            if (type !== 'warehouse') {
                building.lastProductionTime = Date.now();
                building.productionRate = this.getBaseProductionRate(type);
            }
            
            this.buildings.push(building);
            this.selectedBuildType = null;
            this.updateBuildMenu();
            this.updateResourceDisplay();
        }
    }

    getBaseProductionRate(type) {
        switch (type) {
            case 'mine': return 1; // 每秒生成 1 个石头
            case 'farm': return 1; // 每秒生成 1 个食物
            case 'factory': return 0.5; // 每秒生成 0.5 个木材、石头和钢铁
            case 'warehouse': return 0; // 仓库不生产资源
            default: return 0;
        }
    }

    upgradeBuilding(building) {
        const upgradeCost = this.getUpgradeCost(building.type, building.level);
        if (this.canAfford(upgradeCost)) {
            this.payCost(upgradeCost);
            building.level += 1;
            building.productionRate = this.getBaseProductionRate(building.type) * (1 + (building.level - 1) * 0.5); // 每级提升 50% 效率
            this.updateResourceDisplay();
            return true;
        }
        return false;
    }

    getUpgradeCost(type, level) {
        const baseCost = {
            mine: { stone: 10, wood: 5 },
            farm: { wood: 8, stone: 3 },
            factory: { wood: 15, stone: 10 },
            warehouse: { wood: 10, stone: 15, steel: 5 }
        };
        
        const costMultiplier = Math.pow(1.5, level);
        const cost = {};
        
        for (const [resource, amount] of Object.entries(baseCost[type])) {
            cost[resource] = Math.floor(amount * costMultiplier);
        }
        
        return cost;
    }

    canAfford(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if (this.resources[resource] < amount) {
                return false;
            }
        }
        return true;
    }

    payCost(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            this.resources[resource] -= amount;
        }
    }

    createMineModel(position) {
        const geometry = new THREE.BoxGeometry(8, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const mine = new THREE.Mesh(geometry, material);
        mine.position.set(position.x, 2, position.z);
        this.scene.add(mine);
        return mine;
    }

    createFarmModel(position) {
        const geometry = new THREE.BoxGeometry(8, 2, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const farm = new THREE.Mesh(geometry, material);
        farm.position.set(position.x, 1, position.z);
        this.scene.add(farm);
        return farm;
    }

    createFactoryModel(position) {
        const geometry = new THREE.BoxGeometry(10, 6, 10);
        const material = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const factory = new THREE.Mesh(geometry, material);
        factory.position.set(position.x, 3, position.z);
        this.scene.add(factory);
        return factory;
    }

    createWarehouseModel(position) {
        const geometry = new THREE.BoxGeometry(12, 8, 12);
        const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const warehouse = new THREE.Mesh(geometry, material);
        warehouse.position.set(position.x, 4, position.z);
        this.scene.add(warehouse);
        return warehouse;
    }

    selectBuildType(type) {
        this.selectedBuildType = type;
        this.updateBuildMenu();
    }

    updateBuildMenu() {
        document.querySelectorAll('.build-item').forEach(item => {
            if (item.dataset.type === this.selectedBuildType) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateResourceDisplay() {
        document.getElementById('wood-count').textContent = this.resources.wood;
        document.getElementById('stone-count').textContent = this.resources.stone;
        document.getElementById('food-count').textContent = this.resources.food;
        document.getElementById('steel-count').textContent = this.resources.steel;
        document.getElementById('iron-count').textContent = this.resources.iron;
        document.getElementById('coal-count').textContent = this.resources.coal;
        document.getElementById('oil-count').textContent = this.resources.oil;
        
        // Update capacity display
        document.getElementById('wood-capacity').textContent = this.resourceCapacity.wood;
        document.getElementById('stone-capacity').textContent = this.resourceCapacity.stone;
        document.getElementById('food-capacity').textContent = this.resourceCapacity.food;
        document.getElementById('steel-capacity').textContent = this.resourceCapacity.steel;
        document.getElementById('iron-capacity').textContent = this.resourceCapacity.iron;
        document.getElementById('coal-capacity').textContent = this.resourceCapacity.coal;
        document.getElementById('oil-capacity').textContent = this.resourceCapacity.oil;
    }

    updateGoalDisplay() {
        if (this.currentGoalIndex >= this.gameGoals.length) {
            this.showGameComplete();
            return;
        }

        const currentGoal = this.gameGoals[this.currentGoalIndex];
        let progress = 0;

        switch (currentGoal.type) {
            case 'build':
                progress = this.buildings.filter(b => b.type === currentGoal.building).length;
                break;
            case 'resource':
                progress = this.resources[currentGoal.resource] || 0;
                break;
            case 'totalBuildings':
                progress = this.buildings.length;
                break;
        }

        const percentage = Math.min(Math.floor((progress / currentGoal.target) * 100), 100);

        if (document.getElementById('current-goal')) {
            document.getElementById('current-goal').textContent = currentGoal.description;
        }
        if (document.getElementById('goal-progress')) {
            document.getElementById('goal-progress').textContent = `进度: ${progress}/${currentGoal.target} (${percentage}%)`;
        }

        if (progress >= currentGoal.target) {
            this.currentGoalIndex++;
            this.updateGoalDisplay();
        }
    }

    showGameComplete() {
        const gameTime = Math.floor((Date.now() - this.gameStartedTime) / 1000);
        const totalBuildings = this.buildings.length;
        const totalResources = Object.values(this.resources).reduce((sum, value) => sum + value, 0);

        const modal = document.createElement('div');
        modal.className = 'game-complete-modal';
        modal.id = 'game-complete-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.background = 'rgba(0, 0, 0, 0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '2000';

        const content = document.createElement('div');
        content.style.background = 'rgba(20, 20, 30, 0.95)';
        content.style.color = '#fff';
        content.style.padding = '30px';
        content.style.borderRadius = '10px';
        content.style.border = '1px solid #00ffff';
        content.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        content.style.textAlign = 'center';
        content.style.minWidth = '300px';

        content.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px;">游戏完成！</h2>
            <div style="margin: 10px 0;">总游戏时间: ${Math.floor(gameTime / 60)}分${gameTime % 60}秒</div>
            <div style="margin: 10px 0;">建造的建筑总数: ${totalBuildings}</div>
            <div style="margin: 10px 0;">收集的资源总数: ${totalResources}</div>
            <button id="restart-btn" style="margin-top: 20px; padding: 10px 20px; background: #0066cc; color: #fff; border: none; border-radius: 5px; cursor: pointer;">重新开始</button>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                location.reload();
            });
        }
    }

    showResourceGainText(position, resourceType, amount) {
        const textElement = document.createElement('div');
        textElement.className = 'resource-gain-text';
        textElement.textContent = `+${amount} ${this.getResourceName(resourceType)}`;
        textElement.style.position = 'absolute';
        textElement.style.color = '#00ff00';
        textElement.style.fontSize = '12px';
        textElement.style.fontWeight = 'bold';
        textElement.style.pointerEvents = 'none';
        textElement.style.zIndex = '1000';
        textElement.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
        textElement.style.opacity = '1';
        
        // Convert 3D position to 2D screen coordinates
        const vector = new THREE.Vector3(position.x, position.y + 10, position.z);
        vector.project(this.camera);
        
        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
        
        textElement.style.left = `${x}px`;
        textElement.style.top = `${y}px`;
        
        document.body.appendChild(textElement);
        
        // Animate the text
        let startTime = Date.now();
        const duration = 1000;
        
        const animateText = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
            
            if (progress < 1) {
                textElement.style.top = `${y - progress * 30}px`;
                textElement.style.opacity = `${1 - progress}`;
                requestAnimationFrame(animateText);
            } else {
                document.body.removeChild(textElement);
            }
        };
        
        animateText();
    }
    
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'game-notification';
        notification.textContent = message;
        notification.style.position = 'absolute';
        notification.style.top = '50%';
        notification.style.left = '50%';
        notification.style.transform = 'translate(-50%, -50%)';
        notification.style.backgroundColor = 'rgba(0, 102, 204, 0.9)';
        notification.style.color = '#fff';
        notification.style.padding = '15px 25px';
        notification.style.borderRadius = '5px';
        notification.style.border = '1px solid #0099ff';
        notification.style.boxShadow = '0 0 15px rgba(0, 153, 255, 0.7)';
        notification.style.fontSize = '14px';
        notification.style.fontWeight = 'bold';
        notification.style.pointerEvents = 'none';
        notification.style.zIndex = '2000';
        notification.style.opacity = '0';
        notification.style.transition = 'all 0.3s ease';
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        // Fade out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.render();
        this.updateBuildings();
        this.updateGoalDisplay();
        this.updateAnimations();
    }

    updateAnimations() {
        // 为建筑添加动画效果
        for (const building of this.buildings) {
            if (building.mesh) {
                // 添加轻微的缩放动画
                const time = Date.now() * 0.001;
                const scale = 1 + Math.sin(time + building.position.x + building.position.z) * 0.01;
                building.mesh.scale.set(scale, scale, scale);
            }
        }
        
        // 为资源节点添加动画效果
        for (const node of this.resourcesNodes) {
            if (node.type === 'tree' && node.mesh) {
                // 为树木添加摇摆效果
                const time = Date.now() * 0.001;
                const swayAmount = 0.05;
                
                // 树干摇摆
                if (node.mesh[0]) {
                    node.mesh[0].rotation.z = Math.sin(time + node.position.x) * swayAmount;
                }
                
                // 树叶摇摆
                if (node.mesh[1]) {
                    node.mesh[1].rotation.z = Math.sin(time + node.position.x + 1) * swayAmount * 1.5;
                }
            }
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    updateBuildings() {
        const now = Date.now();
        
        // 计算仓库提供的存储容量加成
        let warehouseCapacityBonus = 0;
        for (const building of this.buildings) {
            if (building.type === 'warehouse') {
                warehouseCapacityBonus += 50 * building.level; // 每个仓库增加 50 * 等级 的存储容量
            }
        }
        
        // 更新资源存储上限
        const baseCapacity = 100;
        this.resourceCapacity = {
            wood: baseCapacity + warehouseCapacityBonus,
            stone: baseCapacity + warehouseCapacityBonus,
            food: baseCapacity + warehouseCapacityBonus,
            steel: baseCapacity + warehouseCapacityBonus,
            iron: baseCapacity + warehouseCapacityBonus,
            coal: baseCapacity + warehouseCapacityBonus,
            oil: baseCapacity + warehouseCapacityBonus
        };
        
        // 处理建筑维护成本
        if (!this.lastMaintenanceTime) {
            this.lastMaintenanceTime = now;
        }
        
        const maintenanceTimeElapsed = (now - this.lastMaintenanceTime) / 1000;
        if (maintenanceTimeElapsed >= 5) { // 每5秒进行一次维护
            let allBuildingsFunctional = true;
            
            for (const building of this.buildings) {
                if (building.type === 'warehouse') continue; // 仓库不需要维护
                
                const maintenanceCost = this.getMaintenanceCost(building.type, building.level);
                if (this.canAfford(maintenanceCost)) {
                    this.payCost(maintenanceCost);
                } else {
                    // 资源不足，建筑停止工作
                    building.isFunctional = false;
                    allBuildingsFunctional = false;
                }
            }
            
            this.lastMaintenanceTime = now;
            this.updateResourceDisplay();
        }
        
        // 处理资源生产
        for (const building of this.buildings) {
            if (building.type === 'warehouse' || (building.isFunctional === false)) continue; // 仓库不生产资源，非功能性建筑也不生产
            
            const timeElapsed = (now - building.lastProductionTime) / 1000; // 转换为秒
            
            if (timeElapsed >= 1) { // 每秒检查一次
                const productionAmount = Math.floor(timeElapsed * building.productionRate);
                
                if (productionAmount > 0) {
                    switch (building.type) {
                        case 'mine':
                            if (this.resources.stone < this.resourceCapacity.stone) {
                                this.resources.stone += Math.min(productionAmount, this.resourceCapacity.stone - this.resources.stone);
                            }
                            break;
                        case 'farm':
                            if (this.resources.food < this.resourceCapacity.food) {
                                this.resources.food += Math.min(productionAmount, this.resourceCapacity.food - this.resources.food);
                            }
                            break;
                        case 'factory':
                            if (this.resources.wood < this.resourceCapacity.wood) {
                                this.resources.wood += Math.min(productionAmount, this.resourceCapacity.wood - this.resources.wood);
                            }
                            if (this.resources.stone < this.resourceCapacity.stone) {
                                this.resources.stone += Math.min(productionAmount, this.resourceCapacity.stone - this.resources.stone);
                            }
                            if (this.resources.steel < this.resourceCapacity.steel) {
                                this.resources.steel += Math.min(productionAmount, this.resourceCapacity.steel - this.resources.steel);
                            }
                            break;
                    }
                    
                    building.lastProductionTime = now;
                    this.updateResourceDisplay();
                }
            }
        }
    }
    
    getMaintenanceCost(type, level) {
        const baseCost = {
            mine: { stone: 1, wood: 1 },
            farm: { wood: 1, food: 1 },
            factory: { wood: 2, stone: 2, steel: 1 }
        };
        
        const costMultiplier = Math.pow(1.2, level - 1);
        const cost = {};
        
        for (const [resource, amount] of Object.entries(baseCost[type])) {
            cost[resource] = Math.floor(amount * costMultiplier);
        }
        
        return cost;
    }
}

new Game();