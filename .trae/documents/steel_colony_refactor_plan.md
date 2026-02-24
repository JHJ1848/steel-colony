# Steel Colony - 游戏玩法重构计划

## 项目概述
Steel Colony 是一个基于 Three.js 的 3D 工业殖民地模拟游戏，玩家可以通过收集资源、建造建筑来发展自己的殖民地。

## 重构目标
1. **视角移动模块**：实现 WASD 键控制固定视角的移动
2. **对象表示**：每个对象用点表示，后续根据 id 外挂样式、贴图、动画等
3. **游戏流程**：设计循序渐进的游戏流程，逐步解锁资源

## 重构计划

### 1. 视角移动模块

#### 1.1 实现 WASD 键控制
- 添加键盘事件监听器，监听 WASD 键的按下和释放
- 实现相机位置的移动逻辑，保持相机的固定视角（看向原点）
- 添加移动速度控制，确保移动流畅自然

#### 1.2 视角边界控制
- 设置相机移动的边界，防止相机移动到地图外
- 添加相机高度限制，确保视角始终保持在合适的高度

### 2. 对象表示重构

#### 2.1 统一对象表示
- 将所有 3D 模型替换为简单的点（使用 THREE.Points 或小型球体）
- 为每个对象添加唯一 ID，用于后续的样式和动画绑定
- 设计对象属性系统，支持存储对象的类型、状态、等级等信息

#### 2.2 对象属性系统
- 实现对象属性的存储和管理
- 支持根据对象 ID 查找和修改属性
- 设计可扩展的属性结构，支持后续添加新的属性类型

#### 2.3 样式和动画系统
- 设计基于对象 ID 的样式系统，支持后续添加贴图和模型
- 实现基于对象 ID 的动画系统，支持后续添加动画效果
- 提供样式和动画的加载和切换机制

### 3. 游戏流程重构

#### 3.1 资源解锁系统
- 设计资源解锁树，定义资源解锁的顺序和条件
- 实现资源解锁的逻辑和条件判断
- 添加资源解锁的 UI 提示和反馈

#### 3.2 科技树系统
- 设计科技树结构，定义科技的解锁顺序和效果
- 实现科技研究的逻辑和资源消耗
- 添加科技树的 UI 界面和交互

#### 3.3 游戏进度跟踪
- 实现游戏进度的跟踪和存储
- 添加游戏进度的 UI 显示
- 设计基于游戏进度的事件触发系统

### 4. UI 调整

#### 4.1 科技树界面
- 设计科技树的 UI 界面
- 实现科技树的交互逻辑
- 添加科技研究的动画效果

#### 4.2 资源解锁界面
- 设计资源解锁的 UI 界面
- 实现资源解锁的交互逻辑
- 添加资源解锁的动画效果

#### 4.3 游戏进度界面
- 设计游戏进度的 UI 界面
- 实现游戏进度的显示和更新
- 添加游戏进度的动画效果

### 5. 性能优化

#### 5.1 渲染性能优化
- 优化点对象的渲染性能
- 实现对象的可见性判断，只渲染可见的对象
- 优化场景的渲染层次，提高渲染效率

#### 5.2 事件处理优化
- 优化键盘事件的处理，减少事件处理的开销
- 实现事件的节流和防抖，提高事件处理的效率
- 优化鼠标事件的处理，提高交互的响应速度

## 技术实现

### 1. 视角移动模块
```javascript
// 键盘事件监听
this.keys = {};
window.addEventListener('keydown', (e) => {
    this.keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    this.keys[e.key.toLowerCase()] = false;
});

// 相机移动逻辑
updateCamera() {
    const speed = 0.5;
    if (this.keys['w']) {
        this.camera.position.z -= speed;
        this.camera.position.x += speed;
    }
    if (this.keys['s']) {
        this.camera.position.z += speed;
        this.camera.position.x -= speed;
    }
    if (this.keys['a']) {
        this.camera.position.x -= speed;
        this.camera.position.z -= speed;
    }
    if (this.keys['d']) {
        this.camera.position.x += speed;
        this.camera.position.z += speed;
    }
    // 保持相机看向原点
    this.camera.lookAt(0, 0, 0);
    // 边界控制
    this.camera.position.x = Math.max(-80, Math.min(80, this.camera.position.x));
    this.camera.position.z = Math.max(-80, Math.min(80, this.camera.position.z));
}
```

### 2. 对象表示重构
```javascript
// 对象类
class GameObject {
    constructor(id, type, position) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.level = 1;
        this.state = 'active';
        this.mesh = this.createMesh();
    }
    
    createMesh() {
        // 创建点对象
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: this.getTypeColor() });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        return mesh;
    }
    
    getTypeColor() {
        const colors = {
            tree: 0x228B22,
            stone: 0x808080,
            iron: 0xb0b0b0,
            coal: 0x333333,
            oil: 0x111111,
            mine: 0x444444,
            farm: 0x228B22,
            factory: 0x666666,
            warehouse: 0x8B4513
        };
        return colors[this.type] || 0xffffff;
    }
}
```

### 3. 游戏流程重构
```javascript
// 资源解锁系统
this.unlockSystem = {
    resources: {
        wood: { unlocked: true, required: [] },
        stone: { unlocked: true, required: [] },
        food: { unlocked: true, required: [] },
        iron: { unlocked: false, required: [{ type: 'building', building: 'mine', count: 2 }] },
        coal: { unlocked: false, required: [{ type: 'building', building: 'mine', count: 3 }] },
        oil: { unlocked: false, required: [{ type: 'building', building: 'factory', count: 1 }] },
        steel: { unlocked: false, required: [{ type: 'resource', resource: 'iron', amount: 50 }, { type: 'resource', resource: 'coal', amount: 50 }] }
    },
    buildings: {
        mine: { unlocked: true, required: [] },
        farm: { unlocked: true, required: [] },
        factory: { unlocked: false, required: [{ type: 'building', building: 'mine', count: 1 }, { type: 'building', building: 'farm', count: 1 }] },
        warehouse: { unlocked: false, required: [{ type: 'building', building: 'factory', count: 1 }] }
    }
};

// 检查解锁条件
checkUnlockConditions() {
    // 检查资源解锁
    for (const [resource, data] of Object.entries(this.unlockSystem.resources)) {
        if (!data.unlocked) {
            let allConditionsMet = true;
            for (const condition of data.required) {
                if (condition.type === 'building') {
                    const count = this.buildings.filter(b => b.type === condition.building).length;
                    if (count < condition.count) {
                        allConditionsMet = false;
                        break;
                    }
                } else if (condition.type === 'resource') {
                    if (this.resources[condition.resource] < condition.amount) {
                        allConditionsMet = false;
                        break;
                    }
                }
            }
            if (allConditionsMet) {
                data.unlocked = true;
                this.showNotification(`${this.getResourceName(resource)} 已解锁！`);
            }
        }
    }
    
    // 检查建筑解锁
    for (const [building, data] of Object.entries(this.unlockSystem.buildings)) {
        if (!data.unlocked) {
            let allConditionsMet = true;
            for (const condition of data.required) {
                if (condition.type === 'building') {
                    const count = this.buildings.filter(b => b.type === condition.building).length;
                    if (count < condition.count) {
                        allConditionsMet = false;
                        break;
                    }
                } else if (condition.type === 'resource') {
                    if (this.resources[condition.resource] < condition.amount) {
                        allConditionsMet = false;
                        break;
                    }
                }
            }
            if (allConditionsMet) {
                data.unlocked = true;
                this.showNotification(`${this.getBuildTypeName(building)} 已解锁！`);
            }
        }
    }
}
```

## 项目结构调整

```
steel-colony/
├── index.html          # 游戏主页面
├── game.js             # 游戏主逻辑
├── objects.js          # 对象定义和管理
├── unlock.js           # 解锁系统
├── ui.js               # UI 管理
└── .trae/documents/    # 开发文档
    ├── steel_colony_plan.md       # 原始开发计划
    └── steel_colony_refactor_plan.md  # 重构计划
```

## 开发步骤

1. **步骤 1：实现视角移动模块**
   - 添加键盘事件监听器
   - 实现相机移动逻辑
   - 添加视角边界控制

2. **步骤 2：重构对象表示**
   - 创建 GameObject 类
   - 替换所有 3D 模型为点对象
   - 实现对象属性系统

3. **步骤 3：实现资源解锁系统**
   - 设计资源解锁树
   - 实现解锁条件检查
   - 添加解锁 UI 提示

4. **步骤 4：实现科技树系统**
   - 设计科技树结构
   - 实现科技研究逻辑
   - 添加科技树 UI 界面

5. **步骤 5：调整 UI 界面**
   - 更新资源面板
   - 添加科技树界面
   - 添加游戏进度界面

6. **步骤 6：性能优化**
   - 优化渲染性能
   - 优化事件处理
   - 测试和调试

## 预期成果

1. **视角移动**：玩家可以使用 WASD 键控制相机移动，保持固定视角
2. **对象表示**：所有对象都用点表示，具有唯一 ID 和属性系统
3. **游戏流程**：资源和建筑逐步解锁，游戏流程循序渐进
4. **UI 界面**：更新后的 UI 界面，显示资源解锁状态和科技树
5. **性能优化**：游戏运行流畅，响应迅速

## 后续扩展方向

1. **样式系统**：基于对象 ID 添加自定义样式和贴图
2. **动画系统**：基于对象 ID 添加动画效果
3. **多人游戏**：实现多人游戏功能
4. ** mod 支持**：添加 mod 支持，允许玩家自定义游戏内容
5. **更复杂的科技树**：扩展科技树，添加更多科技和升级选项