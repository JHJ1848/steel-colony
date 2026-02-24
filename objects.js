class GameObject {
    constructor(type, position, properties = {}) {
        this.id = GameObject.generateId();
        this.type = type;
        this.position = position;
        this.properties = properties;
        this.mesh = null;
        this.isVisible = true;
        this.modelUrl = this.getModelUrl();
        this.textureUrl = this.getTextureUrl();
    }
    
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    getModelUrl() {
        // 根据对象类型返回模型URL
        const modelUrls = {
            tractor: 'assets/models/transportation/tractor/tractor.glb',
            truck: 'assets/models/transportation/truck/truck.glb',
            handcart: 'assets/models/transportation/handcart/handcart.glb',
            train: 'assets/models/transportation/train/train.glb',
            railway: 'assets/models/infrastructure/railway/railway.glb',
            base: 'assets/models/buildings/industrial/base.glb'
        };
        return modelUrls[this.type] || null;
    }
    
    getTextureUrl() {
        // 根据对象类型返回纹理URL
        const textureUrls = {
            tractor: 'assets/models/textures/objects/tractor.jpg',
            truck: 'assets/models/textures/objects/truck.jpg',
            handcart: 'assets/models/textures/objects/handcart.jpg',
            train: 'assets/models/textures/objects/train.jpg',
            railway: 'assets/models/textures/objects/railway.jpg',
            base: 'assets/models/textures/objects/base.jpg'
        };
        return textureUrls[this.type] || null;
    }
    
    async create3DMesh() {
        if (this.modelUrl && resourceLoader) {
            try {
                // 尝试加载3D模型
                const model = await resourceLoader.loadModel(this.modelUrl);
                this.mesh = model.clone();
                this.mesh.position.copy(this.position);
                
                // 根据类型设置适当的缩放
                this.setModelScale();
                
                return this.mesh;
            } catch (error) {
                console.warn(`Failed to load 3D model for ${this.type}, using fallback geometry`);
                // 如果加载失败，使用 fallback 几何体
                return this.createFallbackMesh();
            }
        } else {
            // 对于没有3D模型的对象，使用 fallback 几何体
            return this.createFallbackMesh();
        }
    }
    
    createFallbackMesh() {
        // 创建 fallback 几何体
        let geometry;
        let material;
        
        switch (this.type) {
            case 'tree':
                geometry = new THREE.ConeGeometry(1, 3, 8);
                material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
                break;
            case 'stone':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshStandardMaterial({ color: 0x808080 });
                break;
            case 'iron':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshStandardMaterial({ color: 0xb0b0b0 });
                break;
            case 'coal':
                geometry = new THREE.SphereGeometry(0.8, 8, 8);
                material = new THREE.MeshStandardMaterial({ color: 0x333333 });
                break;
            case 'oil':
                geometry = new THREE.CylinderGeometry(0.8, 0.8, 1, 8);
                material = new THREE.MeshStandardMaterial({ color: 0x111111 });
                break;
            case 'mine':
                geometry = new THREE.BoxGeometry(4, 2, 4);
                material = new THREE.MeshStandardMaterial({ color: 0x444444 });
                break;
            case 'farm':
                geometry = new THREE.BoxGeometry(4, 1, 4);
                material = new THREE.MeshStandardMaterial({ color: 0x228B22 });
                break;
            case 'factory':
                geometry = new THREE.BoxGeometry(5, 3, 5);
                material = new THREE.MeshStandardMaterial({ color: 0x666666 });
                break;
            case 'warehouse':
                geometry = new THREE.BoxGeometry(6, 4, 6);
                material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
                break;
            default:
                geometry = new THREE.SphereGeometry(1, 8, 8);
                material = new THREE.MeshStandardMaterial({ color: 0xffffff });
        }
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        return this.mesh;
    }
    
    setModelScale() {
        // 根据对象类型设置适当的缩放
        switch (this.type) {
            case 'tractor':
                this.mesh.scale.set(0.5, 0.5, 0.5);
                break;
            case 'truck':
                this.mesh.scale.set(0.6, 0.6, 0.6);
                break;
            case 'handcart':
                this.mesh.scale.set(0.4, 0.4, 0.4);
                break;
            case 'train':
                this.mesh.scale.set(0.3, 0.3, 0.3);
                break;
            case 'railway':
                this.mesh.scale.set(1, 0.5, 1);
                break;
            case 'base':
                this.mesh.scale.set(0.8, 0.8, 0.8);
                break;
            default:
                this.mesh.scale.set(1, 1, 1);
        }
    }
    
    update() {
        // 可以在子类中重写，用于更新对象状态
    }
    
    setProperty(key, value) {
        this.properties[key] = value;
    }
    
    getProperty(key) {
        return this.properties[key];
    }
    
    show() {
        this.isVisible = true;
        if (this.mesh) {
            this.mesh.visible = true;
        }
    }
    
    hide() {
        this.isVisible = false;
        if (this.mesh) {
            this.mesh.visible = false;
        }
    }
}

class GameObjectManager {
    constructor(scene) {
        this.scene = scene;
        this.objects = new Map();
    }
    
    async createObject(type, position, properties = {}) {
        const object = new GameObject(type, position, properties);
        const mesh = await object.create3DMesh();
        this.scene.add(mesh);
        this.objects.set(object.id, object);
        return object;
    }
    
    getObject(id) {
        return this.objects.get(id);
    }
    
    getAllObjects() {
        return Array.from(this.objects.values());
    }
    
    getObjectsByType(type) {
        return Array.from(this.objects.values()).filter(obj => obj.type === type);
    }
    
    removeObject(id) {
        const object = this.objects.get(id);
        if (object && object.mesh) {
            this.scene.remove(object.mesh);
            // 清理几何体和材质
            object.mesh.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
        this.objects.delete(id);
    }
    
    updateAll() {
        this.objects.forEach(object => object.update());
    }
}