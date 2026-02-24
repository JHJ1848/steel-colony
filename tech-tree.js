class TechTree {
    constructor(game) {
        this.game = game;
        this.techs = new Map();
        this.techTree = this.createTechTree();
        this.initializeTechs();
    }
    
    createTechTree() {
        // 定义科技树结构，每个科技有研究条件和效果
        return {
            // 基础科技
            basicTools: {
                name: '基础工具',
                description: '提高资源采集效率',
                cost: { wood: 50, stone: 30 },
                unlocked: false,
                requires: [],
                effects: [
                    { type: 'resourceRate', resource: 'wood', multiplier: 1.5 },
                    { type: 'resourceRate', resource: 'stone', multiplier: 1.5 }
                ]
            },
            agriculture: {
                name: '农业技术',
                description: '提高食物生产效率',
                cost: { wood: 40, stone: 20 },
                unlocked: false,
                requires: [],
                effects: [
                    { type: 'buildingRate', building: 'farm', multiplier: 1.5 }
                ]
            },
            
            // 中级科技
            miningTech: {
                name: '采矿技术',
                description: '提高矿石采集效率',
                cost: { wood: 100, stone: 80, iron: 50 },
                unlocked: false,
                requires: [
                    { type: 'tech', tech: 'basicTools' },
                    { type: 'building', building: 'mine', count: 2 }
                ],
                effects: [
                    { type: 'resourceRate', resource: 'iron', multiplier: 2 },
                    { type: 'resourceRate', resource: 'coal', multiplier: 2 }
                ]
            },
            industrialization: {
                name: '工业化',
                description: '提高工厂生产效率',
                cost: { wood: 150, stone: 120, iron: 80, coal: 60 },
                unlocked: false,
                requires: [
                    { type: 'tech', tech: 'basicTools' },
                    { type: 'building', building: 'factory', count: 1 }
                ],
                effects: [
                    { type: 'buildingRate', building: 'factory', multiplier: 1.5 },
                    { type: 'resourceRate', resource: 'steel', multiplier: 1.5 }
                ]
            },
            
            // 高级科技
            advancedMetallurgy: {
                name: '高级冶金',
                description: '提高钢铁生产效率',
                cost: { wood: 200, stone: 150, iron: 120, coal: 100, steel: 80 },
                unlocked: false,
                requires: [
                    { type: 'tech', tech: 'miningTech' },
                    { type: 'tech', tech: 'industrialization' }
                ],
                effects: [
                    { type: 'resourceRate', resource: 'steel', multiplier: 2.5 },
                    { type: 'buildingCost', multiplier: 0.8 } // 降低建筑成本
                ]
            },
            oilTechnology: {
                name: '石油技术',
                description: '提高石油采集和使用效率',
                cost: { wood: 250, stone: 200, iron: 150, steel: 100, oil: 50 },
                unlocked: false,
                requires: [
                    { type: 'tech', tech: 'industrialization' },
                    { type: 'resource', resource: 'oil', amount: 20 }
                ],
                effects: [
                    { type: 'resourceRate', resource: 'oil', multiplier: 2 },
                    { type: 'buildingRate', building: 'factory', multiplier: 2 }
                ]
            },
            
            // 终极科技
            automation: {
                name: '自动化',
                description: '全面提高生产效率',
                cost: { wood: 300, stone: 250, iron: 200, coal: 150, steel: 120, oil: 100 },
                unlocked: false,
                requires: [
                    { type: 'tech', tech: 'advancedMetallurgy' },
                    { type: 'tech', tech: 'oilTechnology' },
                    { type: 'building', building: 'factory', count: 3 }
                ],
                effects: [
                    { type: 'globalRate', multiplier: 2 }, // 全局生产效率提升
                    { type: 'buildingCost', multiplier: 0.6 } // 进一步降低建筑成本
                ]
            }
        };
    }
    
    initializeTechs() {
        // 初始化科技状态
        for (const [tech, data] of Object.entries(this.techTree)) {
            this.techs.set(tech, {
                unlocked: data.unlocked,
                researched: false,
                progress: 0,
                total: this.calculateTotalRequirements(data.requires)
            });
        }
    }
    
    calculateTotalRequirements(requires) {
        // 计算总需求数量，用于进度显示
        return requires.length;
    }
    
    checkTech(tech) {
        // 检查科技是否可以研究
        const techData = this.techTree[tech];
        if (!techData || techData.unlocked) {
            return true;
        }
        
        // 检查所有研究条件
        let allConditionsMet = true;
        let progress = 0;
        
        for (const condition of techData.requires) {
            if (this.checkCondition(condition)) {
                progress++;
            } else {
                allConditionsMet = false;
            }
        }
        
        // 更新科技进度
        const currentTech = this.techs.get(tech);
        currentTech.progress = progress;
        
        // 如果所有条件都满足，解锁科技
        if (allConditionsMet && !techData.unlocked) {
            techData.unlocked = true;
            currentTech.unlocked = true;
            currentTech.progress = currentTech.total;
            
            // 显示解锁通知
            this.game.showNotification(`已解锁新科技: ${techData.name}`);
        }
        
        return techData.unlocked;
    }
    
    checkCondition(condition) {
        // 检查单个研究条件
        switch (condition.type) {
            case 'tech':
                return this.isResearched(condition.tech);
            case 'building':
                const buildingCount = this.game.buildings.filter(b => b.type === condition.building).length;
                return buildingCount >= condition.count;
            case 'resource':
                return this.game.resources[condition.resource] >= condition.amount;
            default:
                return false;
        }
    }
    
    researchTech(tech) {
        // 研究科技
        const techData = this.techTree[tech];
        const currentTech = this.techs.get(tech);
        
        if (!techData || currentTech.researched) {
            return false;
        }
        
        // 检查是否已解锁
        if (!this.checkTech(tech)) {
            return false;
        }
        
        // 检查是否有足够的资源
        if (!this.game.canAfford(techData.cost)) {
            return false;
        }
        
        // 消耗资源
        this.game.payCost(techData.cost);
        
        // 标记为已研究
        currentTech.researched = true;
        
        // 应用科技效果
        this.applyTechEffects(techData.effects);
        
        // 显示研究完成通知
        this.game.showNotification(`研究完成: ${techData.name}`);
        
        return true;
    }
    
    applyTechEffects(effects) {
        // 应用科技效果
        for (const effect of effects) {
            switch (effect.type) {
                case 'resourceRate':
                    // 这里需要在game.js中实现资源采集速率的调整
                    // 暂时通过修改建筑生产速率来模拟
                    break;
                case 'buildingRate':
                    // 提高特定建筑的生产速率
                    for (const building of this.game.buildings) {
                        if (building.type === effect.building) {
                            building.productionRate *= effect.multiplier;
                        }
                    }
                    break;
                case 'globalRate':
                    // 提高所有建筑的生产速率
                    for (const building of this.game.buildings) {
                        if (building.productionRate) {
                            building.productionRate *= effect.multiplier;
                        }
                    }
                    break;
                case 'buildingCost':
                    // 降低建筑成本（需要在getUpgradeCost中实现）
                    break;
            }
        }
    }
    
    isUnlocked(tech) {
        // 检查科技是否已解锁
        const techData = this.techTree[tech];
        return techData ? techData.unlocked : false;
    }
    
    isResearched(tech) {
        // 检查科技是否已研究
        const currentTech = this.techs.get(tech);
        return currentTech ? currentTech.researched : false;
    }
    
    getTechProgress(tech) {
        // 获取科技研究进度
        const currentTech = this.techs.get(tech);
        if (currentTech) {
            return {
                progress: currentTech.progress,
                total: currentTech.total,
                percentage: currentTech.total > 0 ? Math.floor((currentTech.progress / currentTech.total) * 100) : 100
            };
        }
        return { progress: 0, total: 0, percentage: 0 };
    }
    
    update() {
        // 定期检查所有科技的解锁状态
        for (const tech of Object.keys(this.techTree)) {
            this.checkTech(tech);
        }
    }
    
    getTechInfo(tech) {
        // 获取科技信息
        const techData = this.techTree[tech];
        const currentTech = this.techs.get(tech);
        
        if (techData && currentTech) {
            return {
                name: techData.name,
                description: techData.description,
                cost: techData.cost,
                unlocked: techData.unlocked,
                researched: currentTech.researched,
                progress: currentTech.progress,
                total: currentTech.total,
                percentage: currentTech.total > 0 ? Math.floor((currentTech.progress / currentTech.total) * 100) : 100,
                requires: techData.requires,
                effects: techData.effects
            };
        }
        return null;
    }
    
    getAllTechInfo() {
        // 获取所有科技的信息
        const info = {};
        for (const tech of Object.keys(this.techTree)) {
            info[tech] = this.getTechInfo(tech);
        }
        return info;
    }
}