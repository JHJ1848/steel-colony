class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x2a2a2a);

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

        this.initCamera();
        this.initLighting();
        this.initTerrain();
        this.initResourceNodes();
        this.initEventListeners();
        this.animate();
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
        const geometry = new THREE.PlaneGeometry(200, 200, 20, 20);
        const material = new THREE.MeshStandardMaterial({
            color: 0x664422,
            side: THREE.DoubleSide,
            roughness: 0.8
        });
        const terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        this.scene.add(terrain);

        for (let i = 0; i < geometry.vertices.length; i++) {
            const vertex = geometry.vertices[i];
            vertex.z = Math.random() * 5 - 2.5;
        }
        geometry.verticesNeedUpdate = true;
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
            this.resources[resourceType] += 1;
            
            // Create particle effect
            this.createParticleSystem(node.position, particleColor);
            
            // Animate resource node
            this.animateResourceNode(node);
            
            // Show resource gain text
            this.showResourceGainText(node.position, resourceType, 1);
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
        if (document.getElementById('steel-count')) {
            document.getElementById('steel-count').textContent = this.resources.steel;
        }
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

    animate() {
        requestAnimationFrame(() => this.animate());
        this.render();
        this.updateBuildings();
        this.updateGoalDisplay();
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
            steel: baseCapacity + warehouseCapacityBonus
        };
        
        // 处理资源生产
        for (const building of this.buildings) {
            if (building.type === 'warehouse') continue; // 仓库不生产资源
            
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
}

new Game();