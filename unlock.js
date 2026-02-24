class UnlockSystem {
    constructor(game) {
        this.game = game;
        this.unlocks = new Map();
        this.unlockTree = this.createUnlockTree();
        this.initializeUnlocks();
    }
    
    createUnlockTree() {
        // 定义资源解锁树，每个资源有解锁条件
        return {
            wood: {
                name: '木材',
                description: '基础建筑材料',
                unlocked: true, // 初始解锁
                requires: []
            },
            stone: {
                name: '石头',
                description: '用于建造矿场和高级建筑',
                unlocked: true, // 初始解锁
                requires: []
            },
            food: {
                name: '食物',
                description: '维持殖民地人口',
                unlocked: true, // 初始解锁
                requires: []
            },
            iron: {
                name: '铁矿',
                description: '用于生产钢铁',
                unlocked: false,
                requires: [
                    { type: 'building', building: 'mine', count: 2 }
                ]
            },
            coal: {
                name: '煤炭',
                description: '用于能源生产',
                unlocked: false,
                requires: [
                    { type: 'building', building: 'mine', count: 3 }
                ]
            },
            steel: {
                name: '钢铁',
                description: '高级建筑材料',
                unlocked: false,
                requires: [
                    { type: 'resource', resource: 'iron', amount: 20 },
                    { type: 'resource', resource: 'coal', amount: 10 },
                    { type: 'building', building: 'factory', count: 1 }
                ]
            },
            oil: {
                name: '石油',
                description: '高级能源资源',
                unlocked: false,
                requires: [
                    { type: 'resource', resource: 'steel', amount: 30 },
                    { type: 'building', building: 'factory', count: 2 }
                ]
            }
        };
    }
    
    initializeUnlocks() {
        // 初始化解锁状态
        for (const [resource, data] of Object.entries(this.unlockTree)) {
            this.unlocks.set(resource, {
                unlocked: data.unlocked,
                progress: 0,
                total: this.calculateTotalRequirements(data.requires)
            });
        }
    }
    
    calculateTotalRequirements(requires) {
        // 计算总需求数量，用于进度显示
        return requires.length;
    }
    
    checkUnlock(resource) {
        // 检查资源是否可以解锁
        const unlockData = this.unlockTree[resource];
        if (!unlockData || unlockData.unlocked) {
            return true;
        }
        
        // 检查所有解锁条件
        let allConditionsMet = true;
        let progress = 0;
        
        for (const condition of unlockData.requires) {
            if (this.checkCondition(condition)) {
                progress++;
            } else {
                allConditionsMet = false;
            }
        }
        
        // 更新解锁进度
        const currentUnlock = this.unlocks.get(resource);
        currentUnlock.progress = progress;
        
        // 如果所有条件都满足，解锁资源
        if (allConditionsMet && !unlockData.unlocked) {
            this.unlockResource(resource);
            return true;
        }
        
        return unlockData.unlocked;
    }
    
    checkCondition(condition) {
        // 检查单个解锁条件
        switch (condition.type) {
            case 'building':
                const buildingCount = this.game.buildings.filter(b => b.type === condition.building).length;
                return buildingCount >= condition.count;
            case 'resource':
                return this.game.resources[condition.resource] >= condition.amount;
            default:
                return false;
        }
    }
    
    unlockResource(resource) {
        // 解锁资源
        const unlockData = this.unlockTree[resource];
        if (unlockData && !unlockData.unlocked) {
            unlockData.unlocked = true;
            const currentUnlock = this.unlocks.get(resource);
            currentUnlock.unlocked = true;
            currentUnlock.progress = currentUnlock.total;
            
            // 显示解锁通知
            this.game.showNotification(`已解锁新资源: ${unlockData.name}`);
            
            // 生成新的资源节点
            this.generateResourceNodes(resource);
        }
    }
    
    generateResourceNodes(resource) {
        // 根据解锁的资源生成新的资源节点
        const nodeCounts = {
            iron: 6,
            coal: 7,
            oil: 5
        };
        
        const count = nodeCounts[resource] || 5;
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 180 - 90;
            const z = Math.random() * 180 - 90;
            
            switch (resource) {
                case 'iron':
                    this.game.createIronOre(x, z);
                    break;
                case 'coal':
                    this.game.createCoal(x, z);
                    break;
                case 'oil':
                    this.game.createOil(x, z);
                    break;
            }
        }
    }
    
    isUnlocked(resource) {
        // 检查资源是否已解锁
        const unlockData = this.unlockTree[resource];
        return unlockData ? unlockData.unlocked : false;
    }
    
    getUnlockProgress(resource) {
        // 获取资源解锁进度
        const unlock = this.unlocks.get(resource);
        if (unlock) {
            return {
                progress: unlock.progress,
                total: unlock.total,
                percentage: unlock.total > 0 ? Math.floor((unlock.progress / unlock.total) * 100) : 100
            };
        }
        return { progress: 0, total: 0, percentage: 0 };
    }
    
    update() {
        // 定期检查所有资源的解锁状态
        for (const resource of Object.keys(this.unlockTree)) {
            this.checkUnlock(resource);
        }
    }
    
    getUnlockInfo(resource) {
        // 获取资源解锁信息
        const unlockData = this.unlockTree[resource];
        const unlock = this.unlocks.get(resource);
        
        if (unlockData && unlock) {
            return {
                name: unlockData.name,
                description: unlockData.description,
                unlocked: unlockData.unlocked,
                progress: unlock.progress,
                total: unlock.total,
                percentage: unlock.total > 0 ? Math.floor((unlock.progress / unlock.total) * 100) : 100,
                requires: unlockData.requires
            };
        }
        return null;
    }
    
    getAllUnlockInfo() {
        // 获取所有资源的解锁信息
        const info = {};
        for (const resource of Object.keys(this.unlockTree)) {
            info[resource] = this.getUnlockInfo(resource);
        }
        return info;
    }
}