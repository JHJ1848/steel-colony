// 音频管理类
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.audioBuffers = new Map();
        this.audioSources = new Map();
        this.volume = 0.7;
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Audio context not supported:', error);
        }
    }
    
    async loadAudio(name, url) {
        if (!this.audioContext) return;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to load audio: ${url}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers.set(name, audioBuffer);
            console.log(`Loaded audio: ${name}`);
        } catch (error) {
            console.warn(`Failed to load audio ${name}:`, error);
        }
    }
    
    playSound(name, volume = this.volume) {
        if (!this.audioContext || !this.audioBuffers.has(name)) {
            console.log(`Playing ${name} sound (muted - audio not loaded)`);
            return;
        }
        
        try {
            // 停止之前的相同音效
            if (this.audioSources.has(name)) {
                this.audioSources.get(name).stop();
            }
            
            const source = this.audioContext.createBufferSource();
            source.buffer = this.audioBuffers.get(name);
            
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
            this.audioSources.set(name, source);
            
            source.onended = () => {
                this.audioSources.delete(name);
            };
        } catch (error) {
            console.warn(`Failed to play sound ${name}:`, error);
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
}

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
        
        // 初始化游戏对象管理器
        this.objectManager = new GameObjectManager(this.scene);
        
        // 初始化音频管理器
        this.audioManager = new AudioManager();
        
        // 初始化解锁系统
        this.unlockSystem = new UnlockSystem(this);
        
        // 初始化科技树系统
        this.techTree = new TechTree(this);
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
        
        // 键盘状态跟踪
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        // 相机移动速度
        this.cameraSpeed = 0.5;
        
        // 事件节流计时器
        this.lastKeyEventTime = 0;
        this.keyEventThrottle = 16; // 约60FPS
        
        // 实例化网格管理
        this.instancedMeshes = {
            tree: null,
            stone: null,
            iron: null,
            coal: null,
            oil: null
        };
        this.instanceCount = {
            tree: 0,
            stone: 0,
            iron: 0,
            coal: 0,
            oil: 0
        };
        this.maxInstances = 50; // 每种资源的最大实例数
        
        // 资源节点对象池
        this.resourcePool = {
            tree: [],
            stone: [],
            iron: [],
            coal: [],
            oil: []
        };
        this.poolSize = 20; // 每种资源的对象池大小
        
        // 殖民地状态
        this.colonyStatus = {
            level: 1,
            population: 10,
            prosperity: 25
        };
        
        // 运输工具系统
        this.transportation = {
            current: 'manual', // 当前使用的运输工具
            vehicles: {
                manual: {
                    name: '人工',
                    speed: 1,
                    capacity: 5,
                    unlocked: true,
                    purchased: true,
                    level: 1,
                    maxLevel: 3
                },
                cart: {
                    name: '推车',
                    speed: 2,
                    capacity: 15,
                    unlocked: false,
                    purchased: false,
                    level: 0,
                    maxLevel: 3
                },
                tractor: {
                    name: '拖拉机',
                    speed: 4,
                    capacity: 30,
                    unlocked: false,
                    purchased: false,
                    level: 0,
                    maxLevel: 3
                },
                truck: {
                    name: '货车',
                    speed: 6,
                    capacity: 50,
                    unlocked: false,
                    purchased: false,
                    level: 0,
                    maxLevel: 3
                },
                train: {
                    name: '火车',
                    speed: 10,
                    capacity: 100,
                    unlocked: false,
                    purchased: false,
                    level: 0,
                    maxLevel: 3
                }
            }
        };
        
        // 建筑预览
        this.previewMesh = null;
        
        // 初始化游戏设置
        this.settings = this.loadSettings();
        
        // 显示加载界面
        this.showLoadScreen();

        this.initCamera();
        this.initLighting();
        this.initTerrain();
        this.initResourceNodes();
        this.initEventListeners();
        this.initMessageWindow();
        this.updateGoalDisplay();
        this.updateColonyStatusDisplay();
        
        // 预加载资源并初始化游戏
        this.preloadResources();
    }
    
    async preloadResources() {
        try {
            // 预加载常用资源
            await resourceLoader.preloadCommonResources();
            
            // 初始化资源节点
            await this.initResourceNodes();
            
            // 隐藏加载屏幕并显示游戏
            this.hideLoadScreen();
            this.showStoryModal();
            this.animate();
        } catch (error) {
            console.error('Error preloading resources:', error);
            // 即使加载失败也继续游戏，使用fallback几何体
            this.hideLoadScreen();
            this.showStoryModal();
            this.animate();
        }
    }

    async initAudio() {
        await this.audioManager.init();
        this.audioManager.setVolume(this.settings.sound / 100);
        
        // 加载基础音效
        const sounds = [
            { name: 'collect', url: 'assets/audio/collect.mp3' },
            { name: 'build', url: 'assets/audio/build.mp3' },
            { name: 'upgrade', url: 'assets/audio/upgrade.mp3' },
            { name: 'notification', url: 'assets/audio/notification.mp3' },
            { name: 'success', url: 'assets/audio/success.mp3' }
        ];
        
        for (const sound of sounds) {
            await this.audioManager.loadAudio(sound.name, sound.url);
        }
    }

    initCamera() {
        this.camera.position.set(50, 100, 50);
        this.camera.lookAt(0, 0, 0);
    }

    initLighting() {
        // 使用更高效的环境光设置
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // 降低环境光强度
        this.scene.add(ambientLight);

        // 优化方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6); // 降低方向光强度
        directionalLight.position.set(50, 100, 50);
        
        // 优化阴影设置，减少阴影计算开销
        if (this.settings.shadows) {
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 512; // 减少阴影贴图大小
            directionalLight.shadow.mapSize.height = 512;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 200;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;
        }
        
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

    async initResourceNodes() {
        // 初始化实例化网格
        this.initInstancedMeshes();
        
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            await this.createTree(x, z);
        }

        for (let i = 0; i < 8; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            await this.createStone(x, z);
        }

        for (let i = 0; i < 6; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            await this.createIronOre(x, z);
        }

        for (let i = 0; i < 7; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            await this.createCoal(x, z);
        }

        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            await this.createOil(x, z);
        }
    }
    
    initInstancedMeshes() {
        // 不再使用实例化网格，改为使用GameObjectManager
        // 此方法保留以保持兼容性
    }
    
    initResourcePool() {
        // 不再使用对象池，改为使用GameObjectManager
        // 此方法保留以保持兼容性
    }

    async createTree(x, z) {
        // 使用GameObjectManager创建点表示的树木
        const position = new THREE.Vector3(x, 0, z);
        const treeObject = await this.objectManager.createObject('tree', position, {
            amount: 10
        });

        this.resourcesNodes.push({
            type: 'tree',
            position: position,
            mesh: [treeObject.mesh],
            objectId: treeObject.id,
            amount: 10
        });
    }

    async createStone(x, z) {
        // 使用GameObjectManager创建点表示的石头
        const position = new THREE.Vector3(x, 0, z);
        const stoneObject = await this.objectManager.createObject('stone', position, {
            amount: 8
        });

        this.resourcesNodes.push({
            type: 'stone',
            position: position,
            mesh: [stoneObject.mesh],
            objectId: stoneObject.id,
            amount: 8
        });
    }

    async createIronOre(x, z) {
        // 使用GameObjectManager创建点表示的铁矿
        const position = new THREE.Vector3(x, 0, z);
        const ironObject = await this.objectManager.createObject('iron', position, {
            amount: 6
        });

        this.resourcesNodes.push({
            type: 'iron',
            position: position,
            mesh: [ironObject.mesh],
            objectId: ironObject.id,
            amount: 6
        });
    }

    async createCoal(x, z) {
        // 使用GameObjectManager创建点表示的煤炭
        const position = new THREE.Vector3(x, 0, z);
        const coalObject = await this.objectManager.createObject('coal', position, {
            amount: 7
        });

        this.resourcesNodes.push({
            type: 'coal',
            position: position,
            mesh: [coalObject.mesh],
            objectId: coalObject.id,
            amount: 7
        });
    }

    async createOil(x, z) {
        // 使用GameObjectManager创建点表示的石油
        const position = new THREE.Vector3(x, 0, z);
        const oilObject = await this.objectManager.createObject('oil', position, {
            amount: 5
        });

        this.resourcesNodes.push({
            type: 'oil',
            position: position,
            mesh: [oilObject.mesh],
            objectId: oilObject.id,
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

        document.addEventListener('mousemove', (event) => {
            this.updatePreview(event);
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
        
        // 添加设置按钮点击事件
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.showSettingsMenu();
            });
        }
        
        // 添加商店按钮点击事件
        const shopBtn = document.getElementById('shop-btn');
        if (shopBtn) {
            shopBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.showShop();
            });
        }
        
        // 添加科技树按钮点击事件
        const techBtn = document.getElementById('tech-btn');
        if (techBtn) {
            techBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                this.showTechTree();
            });
        }
        
        // 点击其他地方隐藏商店面板和科技树面板
        document.addEventListener('click', (event) => {
            const shopPanel = document.getElementById('shop-panel');
            const shopBtn = document.getElementById('shop-btn');
            const techPanel = document.getElementById('tech-panel');
            const techBtn = document.getElementById('tech-btn');
            
            if (shopPanel && shopPanel.style.display === 'block') {
                if (!shopPanel.contains(event.target) && event.target !== shopBtn) {
                    this.hideShop();
                }
            }
            
            if (techPanel && techPanel.style.display === 'block') {
                if (!techPanel.contains(event.target) && event.target !== techBtn) {
                    this.hideTechTree();
                }
            }
        });
        
        // 添加键盘事件监听器
        window.addEventListener('keydown', (event) => {
            if (this.keys.hasOwnProperty(event.key.toLowerCase())) {
                this.keys[event.key.toLowerCase()] = true;
            }
        });
        
        window.addEventListener('keyup', (event) => {
            if (this.keys.hasOwnProperty(event.key.toLowerCase())) {
                this.keys[event.key.toLowerCase()] = false;
            }
        });
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
    
    showTechTree() {
        this.hideShop();
        const techPanel = document.getElementById('tech-panel');
        if (techPanel) {
            techPanel.style.display = 'block';
            this.updateTechTreeDisplay();
        }
    }
    
    hideTechTree() {
        const techPanel = document.getElementById('tech-panel');
        if (techPanel) {
            techPanel.style.display = 'none';
        }
    }
    
    updateTechTreeDisplay() {
        const techContent = document.getElementById('tech-tree-content');
        if (!techContent) return;
        
        techContent.innerHTML = '';
        
        const allTechs = this.techTree.getAllTechInfo();
        
        for (const [techId, techInfo] of Object.entries(allTechs)) {
            const techElement = document.createElement('div');
            techElement.className = 'tech-item';
            techElement.style.marginBottom = '15px';
            techElement.style.padding = '10px';
            techElement.style.border = '1px solid #444';
            techElement.style.borderRadius = '5px';
            
            if (techInfo.researched) {
                techElement.style.backgroundColor = 'rgba(0, 128, 0, 0.2)';
                techElement.style.borderColor = '#00ff00';
            } else if (techInfo.unlocked) {
                techElement.style.backgroundColor = 'rgba(0, 128, 255, 0.2)';
                techElement.style.borderColor = '#0099ff';
            } else {
                techElement.style.backgroundColor = 'rgba(64, 64, 64, 0.2)';
                techElement.style.borderColor = '#666';
            }
            
            techElement.innerHTML = `
                <h4 style="margin: 0 0 5px 0; color: ${techInfo.researched ? '#00ff00' : techInfo.unlocked ? '#0099ff' : '#ccc'}">${techInfo.name}</h4>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #aaa">${techInfo.description}</p>
                <div style="font-size: 12px; margin-bottom: 10px">
                    <strong>研究成本:</strong><br>
                    ${Object.entries(techInfo.cost).map(([resource, amount]) => 
                        `${this.getResourceName(resource)}: ${amount}`
                    ).join('<br>')}
                </div>
                ${!techInfo.researched && techInfo.unlocked ? `
                    <button class="research-btn" data-tech="${techId}" style="width: 100%; padding: 5px; background: #0066cc; color: #fff; border: none; border-radius: 3px; cursor: pointer;">研究</button>
                ` : techInfo.researched ? 
                    '<span style="color: #00ff00; font-size: 12px;">已研究</span>' : 
                    `<div style="color: #666; font-size: 12px;">解锁进度: ${techInfo.percentage}%</div>`
                }
            `;
            
            techContent.appendChild(techElement);
        }
        
        // 添加研究按钮点击事件
        document.querySelectorAll('.research-btn').forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                const techId = btn.dataset.tech;
                this.techTree.researchTech(techId);
                this.updateTechTreeDisplay();
                this.updateResourceDisplay();
            });
        });
    }
    
    showShop() {
        const shopPanel = document.getElementById('shop-panel');
        if (shopPanel) {
            shopPanel.style.display = 'block';
            this.updateShopDisplay();
        }
    }
    
    hideShop() {
        const shopPanel = document.getElementById('shop-panel');
        if (shopPanel) {
            shopPanel.style.display = 'none';
        }
    }
    
    updateShopDisplay() {
        const shopPanel = document.getElementById('transportation-shop');
        if (!shopPanel) return;
        
        shopPanel.innerHTML = '<h4>运输工具</h4>';
        
        Object.entries(this.transportation.vehicles).forEach(([type, vehicle]) => {
            const vehicleItem = document.createElement('div');
            vehicleItem.className = 'vehicle-item';
            vehicleItem.dataset.type = type;
            vehicleItem.style.marginBottom = '15px';
            vehicleItem.style.padding = '10px';
            vehicleItem.style.backgroundColor = 'rgba(30, 30, 40, 0.8)';
            vehicleItem.style.borderRadius = '3px';
            vehicleItem.style.border = '1px solid #555';
            
            let status = vehicle.unlocked ? '已解锁' : '未解锁';
            if (vehicle.purchased) status = '已购买';
            
            let buttons = '';
            if (vehicle.unlocked) {
                if (!vehicle.purchased) {
                    const cost = this.getVehicleCost(type);
                    buttons = `<button class="purchase-vehicle-btn" data-type="${type}" style="margin-top: 10px; padding: 5px 10px; background-color: #0066cc; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">购买 (${this.formatCost(cost)})</button>`;
                } else {
                    buttons = `
                        <button class="select-vehicle-btn" data-type="${type}" style="margin-top: 10px; padding: 5px 10px; background-color: ${this.transportation.current === type ? '#0099ff' : '#333'}; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-right: 5px;">${this.transportation.current === type ? '当前使用' : '使用'}</button>
                    `;
                    if (vehicle.level < vehicle.maxLevel) {
                        const upgradeCost = this.getVehicleUpgradeCost(type, vehicle.level);
                        buttons += `<button class="upgrade-vehicle-btn" data-type="${type}" style="margin-top: 10px; padding: 5px 10px; background-color: #663300; color: #fff; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">升级 (${this.formatCost(upgradeCost)})</button>`;
                    }
                }
            }
            
            vehicleItem.innerHTML = `
                <div style="font-weight: bold; color: #00ffff;">${vehicle.name} (${status})</div>
                <div style="font-size: 12px; margin: 5px 0;">速度: ${vehicle.speed.toFixed(1)}</div>
                <div style="font-size: 12px; margin: 5px 0;">载重: ${Math.floor(vehicle.capacity)}</div>
                <div style="font-size: 12px; margin: 5px 0;">等级: ${vehicle.level}/${vehicle.maxLevel}</div>
                ${buttons}
            `;
            
            shopPanel.appendChild(vehicleItem);
        });
        
        // 添加事件监听器
        this.addShopEventListeners();
    }
    
    addShopEventListeners() {
        // 购买按钮事件
        document.querySelectorAll('.purchase-vehicle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.purchaseVehicle(btn.dataset.type);
            });
        });
        
        // 升级按钮事件
        document.querySelectorAll('.upgrade-vehicle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.upgradeVehicle(btn.dataset.type);
            });
        });
        
        // 选择按钮事件
        document.querySelectorAll('.select-vehicle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectVehicle(btn.dataset.type);
            });
        });
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

    showStoryModal() {
        const modal = document.createElement('div');
        modal.className = 'story-modal';
        modal.id = 'story-modal';
        
        const content = document.createElement('div');
        content.className = 'story-content';
        
        content.innerHTML = `
            <h2>Steel Colony</h2>
            <p>在遥远的未来，人类文明扩张到了星际空间。你被任命为一个新殖民地的指挥官，负责在这个资源丰富但环境恶劣的星球上建立一个繁荣的工业殖民地。</p>
            <p>你的任务是管理资源、建造设施、发展科技，将这个荒芜的星球转变为一个充满活力的工业中心。</p>
            <p>钢铁是这个殖民地的基石，也是你成功的关键。通过开采矿物、发展农业、建立工厂，你将逐步实现殖民地的自给自足和繁荣发展。</p>
            <p>记住，每一个决策都将影响殖民地的命运。祝你好运，指挥官！</p>
            <button id="start-game-btn">开始游戏</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const startBtn = document.getElementById('start-game-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.hideStoryModal();
            });
        }
    }

    hideStoryModal() {
        const modal = document.getElementById('story-modal');
        if (modal) {
            modal.remove();
        }
    }

    updateColonyStatusDisplay() {
        document.getElementById('colony-level').textContent = this.colonyStatus.level;
        document.getElementById('total-buildings').textContent = this.buildings.length;
        document.getElementById('colony-population').textContent = this.colonyStatus.population;
        document.getElementById('colony-prosperity').textContent = `${this.colonyStatus.prosperity}%`;
    }

    updateColonyStatus() {
        // 根据建筑数量和类型更新殖民地状态
        const buildingCount = this.buildings.length;
        
        // 计算新的殖民地等级
        const newLevel = Math.floor(buildingCount / 5) + 1;
        if (newLevel > this.colonyStatus.level) {
            this.colonyStatus.level = newLevel;
        }
        
        // 计算新的人口
        const newPopulation = 10 + buildingCount * 2;
        this.colonyStatus.population = newPopulation;
        
        // 计算新的繁荣度
        const newProsperity = Math.min(100, 25 + buildingCount * 3);
        this.colonyStatus.prosperity = newProsperity;
        
        // 检查运输工具解锁
        this.checkTransportationUnlock();
        
        // 更新显示
        this.updateColonyStatusDisplay();
    }
    
    checkTransportationUnlock() {
        const level = this.colonyStatus.level;
        
        if (level >= 2 && !this.transportation.vehicles.cart.unlocked) {
            this.transportation.vehicles.cart.unlocked = true;
            this.showNotification('解锁了新的运输工具: 推车');
        }
        
        if (level >= 3 && !this.transportation.vehicles.tractor.unlocked) {
            this.transportation.vehicles.tractor.unlocked = true;
            this.showNotification('解锁了新的运输工具: 拖拉机');
        }
        
        if (level >= 4 && !this.transportation.vehicles.truck.unlocked) {
            this.transportation.vehicles.truck.unlocked = true;
            this.showNotification('解锁了新的运输工具: 货车');
        }
        
        if (level >= 5 && !this.transportation.vehicles.train.unlocked) {
            this.transportation.vehicles.train.unlocked = true;
            this.showNotification('解锁了新的运输工具: 火车');
        }
    }
    
    getVehicleCost(type) {
        const costs = {
            cart: { wood: 100, stone: 50 },
            tractor: { wood: 300, stone: 200, steel: 50 },
            truck: { wood: 500, stone: 400, steel: 200 },
            train: { wood: 1000, stone: 800, steel: 500, oil: 200 }
        };
        return costs[type] || {};
    }
    
    getVehicleUpgradeCost(type, level) {
        const baseCosts = {
            manual: { food: 10 },
            cart: { wood: 50, stone: 25 },
            tractor: { wood: 150, stone: 100, steel: 25 },
            truck: { wood: 250, stone: 200, steel: 100 },
            train: { wood: 500, stone: 400, steel: 250, oil: 100 }
        };
        
        const baseCost = baseCosts[type] || {};
        const costMultiplier = Math.pow(1.5, level - 1);
        const cost = {};
        
        for (const [resource, amount] of Object.entries(baseCost)) {
            cost[resource] = Math.floor(amount * costMultiplier);
        }
        
        return cost;
    }
    
    getVehicleMaintenanceCost(type) {
        const maintenanceCosts = {
            manual: { food: 1 },
            cart: { wood: 1, stone: 1 },
            tractor: { wood: 2, stone: 2, steel: 1 },
            truck: { wood: 3, stone: 3, steel: 2 },
            train: { wood: 5, stone: 5, steel: 3, oil: 2 }
        };
        return maintenanceCosts[type] || {};
    }
    
    purchaseVehicle(type) {
        const vehicle = this.transportation.vehicles[type];
        const cost = this.getVehicleCost(type);
        
        if (!vehicle.unlocked) {
            this.showNotification('该运输工具尚未解锁');
            return;
        }
        
        if (vehicle.purchased) {
            this.showNotification('该运输工具已购买');
            return;
        }
        
        if (this.canAfford(cost)) {
            this.payCost(cost);
            vehicle.purchased = true;
            vehicle.level = 1;
            this.showNotification(`成功购买 ${vehicle.name}`);
            this.updateShopDisplay();
        } else {
            this.showNotification('资源不足，无法购买');
        }
    }
    
    upgradeVehicle(type) {
        const vehicle = this.transportation.vehicles[type];
        
        if (!vehicle.purchased) {
            this.showNotification('请先购买该运输工具');
            return;
        }
        
        if (vehicle.level >= vehicle.maxLevel) {
            this.showNotification('该运输工具已达到最高等级');
            return;
        }
        
        const upgradeCost = this.getVehicleUpgradeCost(type, vehicle.level);
        if (this.canAfford(upgradeCost)) {
            this.payCost(upgradeCost);
            vehicle.level += 1;
            vehicle.speed *= 1.2; // 每级提升20%速度
            vehicle.capacity *= 1.3; // 每级提升30%载重
            this.showNotification(`成功升级 ${vehicle.name} 到等级 ${vehicle.level}`);
            this.updateShopDisplay();
        } else {
            this.showNotification('资源不足，无法升级');
        }
    }
    
    selectVehicle(type) {
        const vehicle = this.transportation.vehicles[type];
        
        if (!vehicle.purchased) {
            this.showNotification('请先购买该运输工具');
            return;
        }
        
        this.transportation.current = type;
        this.showNotification(`已切换到 ${vehicle.name}`);
        this.updateShopDisplay();
    }
    
    formatCost(cost) {
        let costString = '';
        for (const [resource, amount] of Object.entries(cost)) {
            costString += `${amount} ${this.getResourceName(resource)} `;
        }
        return costString.trim();
    }

    saveGame() {
        const gameData = {
            resources: this.resources,
            buildings: this.buildings,
            gameGoals: this.gameGoals,
            currentGoalIndex: this.currentGoalIndex,
            gameStartedTime: this.gameStartedTime,
            transportation: this.transportation
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
                if (gameData.transportation) {
                    this.transportation = gameData.transportation;
                }
                
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
    
    showModal(title, message, onClose) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.id = 'custom-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.background = 'rgba(0, 0, 0, 0.7)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '5000';
        
        const content = document.createElement('div');
        content.style.background = 'rgba(20, 20, 30, 0.95)';
        content.style.color = '#fff';
        content.style.padding = '20px';
        content.style.borderRadius = '10px';
        content.style.border = '1px solid #00ffff';
        content.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
        content.style.minWidth = '300px';
        content.style.textAlign = 'center';
        
        content.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 15px;">${title}</h2>
            <p style="margin-bottom: 20px;">${message}</p>
            <button id="modal-close-btn" style="padding: 8px 15px; background: #0066cc; color: #fff; border: none; border-radius: 3px; cursor: pointer;">确定</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const closeBtn = document.getElementById('modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
                if (onClose) {
                    onClose();
                }
            });
        }
        
        // 点击模态框外部关闭
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
                if (onClose) {
                    onClose();
                }
            }
        });
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

    async handleClick(event) {
        if (this.selectedBuildType) {
            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, this.camera);

            const intersects = raycaster.intersectObjects(this.scene.children);
            if (intersects.length > 0) {
                const hitPoint = intersects[0].point;
                await this.buildStructure(this.selectedBuildType, hitPoint);
            } else {
                // 点击空白处，取消选择
                this.selectedBuildType = null;
                this.clearPreviewMesh();
                this.updateBuildMenu();
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
        const particlesCount = 30; // 增加粒子数量

        const posArray = new Float32Array(particlesCount * 3);
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 3; // 增加粒子扩散范围
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.8, // 增加粒子大小
            color: color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true // 启用大小衰减，使粒子更有层次感
        });

        const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
        particleSystem.position.copy(position);
        particleSystem.position.y += 5;

        this.scene.add(particleSystem);
        this.particleSystems.push({
            system: particleSystem,
            age: 0,
            maxAge: 1200 // 增加粒子系统持续时间
        });

        return particleSystem;
    }
    
    playSound(type) {
        // 使用音频管理器播放音效
        this.audioManager.playSound(type, this.settings.sound / 100);
    }

    animateResourceNode(node) {
        if (!node.isAnimating) {
            node.isAnimating = true;
            node.animationStartTime = Date.now();
            node.originalScale = [];
            
            for (const mesh of node.mesh) {
                node.originalScale.push(mesh.scale.clone());
            }
            
            // 确保节点只被添加一次到动画数组
            const existingIndex = this.animatingNodes.findIndex(n => n === node);
            if (existingIndex === -1) {
                this.animatingNodes.push(node);
            }
        }
    }

    updateAnimations() {
        const now = Date.now();
        
        // Update particle systems
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const particleSystem = this.particleSystems[i];
            particleSystem.age += 16; // Assume 60 FPS
            
            if (particleSystem.age > particleSystem.maxAge) {
                // 从场景中移除粒子系统
                this.scene.remove(particleSystem.system);
                
                // 清理几何体和材质，避免内存泄漏
                if (particleSystem.system.geometry) {
                    particleSystem.system.geometry.dispose();
                }
                if (particleSystem.system.material) {
                    if (Array.isArray(particleSystem.system.material)) {
                        particleSystem.system.material.forEach(material => material.dispose());
                    } else {
                        particleSystem.system.material.dispose();
                    }
                }
                
                // 从数组中删除
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
                
                // Animate resource node
                this.animateResourceNode(node);
                
                // Play sound effect
                this.playSound('collect');
            }
        }

        node.amount -= 1;
        if (node.amount <= 0) {
            // 从GameObjectManager中移除对象
            if (node.objectId) {
                this.objectManager.removeObject(node.objectId);
            }
            
            // 从动画数组中移除节点
            const animatingIndex = this.animatingNodes.findIndex(n => n === node);
            if (animatingIndex !== -1) {
                this.animatingNodes.splice(animatingIndex, 1);
            }
            
            this.resourcesNodes.splice(index, 1);
        }

        this.updateResourceDisplay();
    }

    async buildStructure(type, position) {
        let cost = {};
        let model;

        switch (type) {
            case 'mine':
                cost = { stone: 10, wood: 5 };
                model = await this.createMineModel(position);
                break;
            case 'farm':
                cost = { wood: 8, stone: 3 };
                model = await this.createFarmModel(position);
                break;
            case 'factory':
                cost = { wood: 15, stone: 10 };
                model = await this.createFactoryModel(position);
                break;
            case 'warehouse':
                cost = { wood: 10, stone: 15, steel: 5 };
                model = await this.createWarehouseModel(position);
                break;
        }

        // 检查是否所有资源都已解锁
        const allResourcesUnlocked = Object.keys(cost).every(resource => 
            this.unlockSystem.isUnlocked(resource)
        );

        if (allResourcesUnlocked && this.canAfford(cost)) {
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
        this.clearPreviewMesh();
        this.updateBuildMenu();
        this.updateResourceDisplay();
        this.updateColonyStatus();
        } else if (!allResourcesUnlocked) {
            this.showNotification('需要解锁所有必要的资源才能建造此建筑！');
            this.selectedBuildType = null;
            this.clearPreviewMesh();
            this.updateBuildMenu();
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
        
        // 检查是否所有资源都已解锁
        const allResourcesUnlocked = Object.keys(upgradeCost).every(resource => 
            this.unlockSystem.isUnlocked(resource)
        );

        if (allResourcesUnlocked && this.canAfford(upgradeCost)) {
            this.payCost(upgradeCost);
            building.level += 1;
            building.productionRate = this.getBaseProductionRate(building.type) * (1 + (building.level - 1) * 0.5); // 每级提升 50% 效率
            this.updateResourceDisplay();
            return true;
        } else if (!allResourcesUnlocked) {
            this.showNotification('需要解锁所有必要的资源才能升级此建筑！');
            return false;
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

    async createMineModel(position) {
        // 使用GameObjectManager创建点表示的矿场
        const mineObject = await this.objectManager.createObject('mine', position);
        return mineObject.mesh;
    }

    async createFarmModel(position) {
        // 使用GameObjectManager创建点表示的农场
        const farmObject = await this.objectManager.createObject('farm', position);
        return farmObject.mesh;
    }

    async createFactoryModel(position) {
        // 使用GameObjectManager创建点表示的工厂
        const factoryObject = await this.objectManager.createObject('factory', position);
        return factoryObject.mesh;
    }

    async createWarehouseModel(position) {
        // 使用GameObjectManager创建点表示的仓库
        const warehouseObject = await this.objectManager.createObject('warehouse', position);
        return warehouseObject.mesh;
    }

    selectBuildType(type) {
        this.selectedBuildType = type;
        this.updateBuildMenu();
        this.createPreviewMesh(type);
    }
    
    createPreviewMesh(type) {
        // 清理之前的预览网格
        this.clearPreviewMesh();
        
        let geometry;
        switch (type) {
            case 'mine':
                geometry = new THREE.BoxGeometry(8, 4, 8);
                break;
            case 'farm':
                geometry = new THREE.BoxGeometry(8, 2, 8);
                break;
            case 'factory':
                geometry = new THREE.BoxGeometry(10, 6, 10);
                break;
            case 'warehouse':
                geometry = new THREE.BoxGeometry(12, 8, 12);
                break;
            default:
                return;
        }
        
        // 创建半透明的预览材质
        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5,
            wireframe: true
        });
        
        this.previewMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.previewMesh);
    }
    
    clearPreviewMesh() {
        if (this.previewMesh) {
            this.scene.remove(this.previewMesh);
            this.previewMesh.geometry.dispose();
            this.previewMesh.material.dispose();
            this.previewMesh = null;
        }
    }
    
    updatePreview(event) {
        if (!this.selectedBuildType || !this.previewMesh) return;
        
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);
        
        // 创建一个平面来检测鼠标位置
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersectionPoint = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
            // 限制预览位置在地形范围内
            const x = Math.max(-90, Math.min(90, intersectionPoint.x));
            const z = Math.max(-90, Math.min(90, intersectionPoint.z));
            
            // 调整预览网格的位置
            switch (this.selectedBuildType) {
                case 'mine':
                    this.previewMesh.position.set(x, 2, z);
                    break;
                case 'farm':
                    this.previewMesh.position.set(x, 1, z);
                    break;
                case 'factory':
                    this.previewMesh.position.set(x, 3, z);
                    break;
                case 'warehouse':
                    this.previewMesh.position.set(x, 4, z);
                    break;
            }
        }
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
        // 只显示已解锁的资源
        const resources = ['wood', 'stone', 'food', 'iron', 'coal', 'steel', 'oil'];
        
        resources.forEach(resource => {
            const countElement = document.getElementById(`${resource}-count`);
            const capacityElement = document.getElementById(`${resource}-capacity`);
            const resourceElement = countElement ? countElement.parentElement : null;
            
            if (resourceElement) {
                if (this.unlockSystem.isUnlocked(resource)) {
                    resourceElement.style.display = 'block';
                    if (countElement) countElement.textContent = this.resources[resource];
                    if (capacityElement) capacityElement.textContent = this.resourceCapacity[resource];
                } else {
                    resourceElement.style.display = 'none';
                }
            }
        });
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
        // 添加消息到消息窗口
        const messageContent = document.getElementById('message-content');
        if (messageContent) {
            const messageElement = document.createElement('div');
            messageElement.style.marginBottom = '8px';
            messageElement.style.padding = '5px';
            messageElement.style.backgroundColor = 'rgba(0, 102, 204, 0.3)';
            messageElement.style.borderRadius = '3px';
            messageElement.style.borderLeft = '3px solid #0099ff';
            messageElement.textContent = message;
            
            messageContent.appendChild(messageElement);
            
            // 滚动到最新消息
            messageContent.scrollTop = messageContent.scrollHeight;
            
            // 限制消息数量，最多保存20条
            if (messageContent.children.length > 20) {
                messageContent.removeChild(messageContent.firstChild);
            }
        }
    }
    
    initMessageWindow() {
        // 初始化消息窗口的最小化/最大化功能
        const toggleBtn = document.getElementById('message-window-toggle');
        const messageContent = document.getElementById('message-content');
        
        if (toggleBtn && messageContent) {
            let isMinimized = false;
            toggleBtn.addEventListener('click', () => {
                isMinimized = !isMinimized;
                if (isMinimized) {
                    messageContent.style.display = 'none';
                    toggleBtn.textContent = '▶';
                } else {
                    messageContent.style.display = 'block';
                    toggleBtn.textContent = '▼';
                }
            });
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateCamera();
        this.unlockSystem.update();
        this.techTree.update();
        this.updateObjectVisibility();
        this.render();
        this.updateBuildings();
        this.updateGoalDisplay();
        this.updateAnimations();
    }
    
    updateObjectVisibility() {
        // 更新对象的可见性，只渲染相机视野内的对象
        const allObjects = this.objectManager.getAllObjects();
        const frustum = new THREE.Frustum();
        const cameraViewProjectionMatrix = new THREE.Matrix4();
        
        // 更新视锥体
        this.camera.updateMatrixWorld();
        cameraViewProjectionMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);
        
        // 检查每个对象是否在视锥体内
        for (const object of allObjects) {
            if (object.mesh) {
                const boundingBox = new THREE.Box3().setFromObject(object.mesh);
                const isVisible = frustum.intersectsBox(boundingBox);
                object.mesh.visible = isVisible;
            }
        }
    }
    
    updateCamera() {
        const now = Date.now();
        
        // 事件节流，限制相机移动更新频率
        if (now - this.lastKeyEventTime >= this.keyEventThrottle) {
            // 根据键盘状态移动相机
            if (this.keys.w) {
                this.camera.position.z -= this.cameraSpeed;
            }
            if (this.keys.s) {
                this.camera.position.z += this.cameraSpeed;
            }
            if (this.keys.a) {
                this.camera.position.x -= this.cameraSpeed;
            }
            if (this.keys.d) {
                this.camera.position.x += this.cameraSpeed;
            }
            
            // 限制相机移动边界
            const boundary = 80;
            this.camera.position.x = Math.max(-boundary, Math.min(boundary, this.camera.position.x));
            this.camera.position.z = Math.max(-boundary, Math.min(boundary, this.camera.position.z));
            
            // 保持相机看向原点
            this.camera.lookAt(0, 0, 0);
            
            this.lastKeyEventTime = now;
        }
    }



    render() {
        // 优化渲染性能
        // 只在必要时渲染
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
        
        // 处理建筑维护成本和运输工具维护
        if (!this.lastMaintenanceTime) {
            this.lastMaintenanceTime = now;
        }
        
        const maintenanceTimeElapsed = (now - this.lastMaintenanceTime) / 1000;
        if (maintenanceTimeElapsed >= 5) { // 每5秒进行一次维护
            let allBuildingsFunctional = true;
            
            // 建筑维护
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
            
            // 运输工具维护
            const currentVehicle = this.transportation.vehicles[this.transportation.current];
            const maintenanceCost = this.getVehicleMaintenanceCost(this.transportation.current);
            
            if (this.canAfford(maintenanceCost)) {
                this.payCost(maintenanceCost);
            } else {
                // 运输工具损坏，降为基础速度
                currentVehicle.speed = Math.max(1, currentVehicle.speed * 0.5);
                this.showNotification(`${currentVehicle.name} 因维护不足而性能下降`);
            }
            
            this.lastMaintenanceTime = now;
            this.updateResourceDisplay();
        }
        
        // 处理资源生产
        for (const building of this.buildings) {
            if (building.type === 'warehouse' || (building.isFunctional === false)) continue; // 仓库不生产资源，非功能性建筑也不生产
            
            const timeElapsed = (now - building.lastProductionTime) / 1000; // 转换为秒
            
            if (timeElapsed >= 1) { // 每秒检查一次
                // 应用运输工具速度加成到建筑生产
                const currentVehicle = this.transportation.vehicles[this.transportation.current];
                const speedMultiplier = currentVehicle.speed / 2; // 基础速度为1时，生产速度不变
                const productionAmount = Math.floor(timeElapsed * building.productionRate * speedMultiplier);
                
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