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
            food: 0
        };

        this.buildings = [];
        this.resourcesNodes = [];
        this.selectedBuildType = null;

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
            default: return resource;
        }
    }

    getBuildTypeDescription(type) {
        switch (type) {
            case 'mine': return '自动生产石头资源';
            case 'farm': return '自动生产食物资源';
            case 'factory': return '自动生产木材和石头资源';
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
            this.checkResourceClick(event);
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

    collectResource(node, index) {
        if (node.type === 'tree') {
            this.resources.wood += 1;
        } else if (node.type === 'stone') {
            this.resources.stone += 1;
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
        }

        if (this.canAfford(cost)) {
            this.payCost(cost);
            this.buildings.push({
                type: type,
                position: position,
                mesh: model
            });
            this.selectedBuildType = null;
            this.updateBuildMenu();
            this.updateResourceDisplay();
        }
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
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.render();
        this.updateBuildings();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    updateBuildings() {
        for (const building of this.buildings) {
            if (building.type === 'mine') {
                if (Math.random() < 0.01) {
                    this.resources.stone += 1;
                    this.updateResourceDisplay();
                }
            } else if (building.type === 'farm') {
                if (Math.random() < 0.01) {
                    this.resources.food += 1;
                    this.updateResourceDisplay();
                }
            } else if (building.type === 'factory') {
                if (Math.random() < 0.005) {
                    this.resources.wood += 1;
                    this.resources.stone += 1;
                    this.updateResourceDisplay();
                }
            }
        }
    }
}

new Game();