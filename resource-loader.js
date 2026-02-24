class ResourceLoader {
    constructor() {
        this.loaders = {
            gltf: new THREE.GLTFLoader(),
            obj: new THREE.OBJLoader(),
            texture: new THREE.TextureLoader(),
            cubeTexture: new THREE.CubeTextureLoader()
        };
        this.resources = new Map();
        this.loadingPromises = new Map();
    }

    loadModel(url, type = 'gltf') {
        if (this.resources.has(url)) {
            return Promise.resolve(this.resources.get(url));
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            if (type === 'gltf') {
                this.loaders.gltf.load(url, 
                    (gltf) => {
                        this.resources.set(url, gltf.scene);
                        this.loadingPromises.delete(url);
                        resolve(gltf.scene);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading GLTF model:', error);
                        this.loadingPromises.delete(url);
                        reject(error);
                    }
                );
            } else if (type === 'obj') {
                this.loaders.obj.load(url, 
                    (object) => {
                        this.resources.set(url, object);
                        this.loadingPromises.delete(url);
                        resolve(object);
                    },
                    undefined,
                    (error) => {
                        console.error('Error loading OBJ model:', error);
                        this.loadingPromises.delete(url);
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Unsupported model type'));
            }
        });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    loadTexture(url) {
        if (this.resources.has(url)) {
            return Promise.resolve(this.resources.get(url));
        }

        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }

        const promise = new Promise((resolve, reject) => {
            this.loaders.texture.load(url, 
                (texture) => {
                    this.resources.set(url, texture);
                    this.loadingPromises.delete(url);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Error loading texture:', error);
                    this.loadingPromises.delete(url);
                    reject(error);
                }
            );
        });

        this.loadingPromises.set(url, promise);
        return promise;
    }

    loadCubeTexture(urls) {
        const key = JSON.stringify(urls);
        if (this.resources.has(key)) {
            return Promise.resolve(this.resources.get(key));
        }

        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }

        const promise = new Promise((resolve, reject) => {
            this.loaders.cubeTexture.load(urls, 
                (texture) => {
                    this.resources.set(key, texture);
                    this.loadingPromises.delete(key);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error('Error loading cube texture:', error);
                    this.loadingPromises.delete(key);
                    reject(error);
                }
            );
        });

        this.loadingPromises.set(key, promise);
        return promise;
    }

    getResource(url) {
        return this.resources.get(url);
    }

    hasResource(url) {
        return this.resources.has(url);
    }

    clear() {
        // 清理资源
        this.resources.forEach((resource, key) => {
            if (resource instanceof THREE.Object3D) {
                // 清理3D对象
                resource.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            } else if (resource instanceof THREE.Texture) {
                resource.dispose();
            }
        });
        this.resources.clear();
        this.loadingPromises.clear();
    }

    // 预加载常用资源
    preloadCommonResources() {
        const promises = [];
        
        // 预加载运输工具模型
        promises.push(this.loadModel('assets/models/transportation/tractor/tractor.glb'));
        promises.push(this.loadModel('assets/models/transportation/truck/truck.glb'));
        promises.push(this.loadModel('assets/models/transportation/handcart/handcart.glb'));
        promises.push(this.loadModel('assets/models/transportation/train/train.glb'));
        
        // 预加载基础设施模型
        promises.push(this.loadModel('assets/models/infrastructure/railway/railway.glb'));
        
        // 预加载工业建筑模型
        promises.push(this.loadModel('assets/models/buildings/industrial/base.glb'));
        
        // 预加载纹理
        promises.push(this.loadTexture('assets/models/textures/materials/metal.jpg'));
        promises.push(this.loadTexture('assets/models/textures/materials/concrete.jpg'));
        promises.push(this.loadTexture('assets/models/textures/materials/wood.jpg'));
        
        return Promise.all(promises);
    }
}

// 导出单例实例
const resourceLoader = new ResourceLoader();
