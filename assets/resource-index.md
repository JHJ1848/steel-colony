# 重工业与建筑资源索引

## 目录结构

```
assets/
├── animations/         # 动画效果
├── buildings/          # 建筑资源
│   ├── residential/    # 住宅建筑
│   ├── industrial/     # 工业建筑
│   └── commercial/     # 商业建筑
├── icons/              # 资源图标
├── images/             # 背景和装饰图像
├── infrastructure/     # 基础设施
├── machinery/          # 机械设备
├── resources/          # 资源相关
└── effects/            # 特效
```

## 工业建筑

### 工厂 (Factory)
- **路径**: `assets/buildings/industrial/factory.svg`
- **描述**: 工业工厂建筑，包含烟囱和烟雾效果
- **尺寸**: 128x128px
- **用途**: 生产钢铁等工业产品

### 矿场 (Mine)
- **路径**: `assets/buildings/industrial/mine.svg`
- **描述**: 矿石开采矿场，包含矿井入口和矿石堆
- **尺寸**: 128x128px
- **用途**: 开采铁矿、煤炭等资源

### 农场 (Farm)
- **路径**: `assets/buildings/industrial/farm.svg`
- **描述**: 农业农场建筑，包含农田和农作物
- **尺寸**: 128x128px
- **用途**: 生产食物资源

### 仓库 (Warehouse)
- **路径**: `assets/buildings/industrial/warehouse.svg`
- **描述**: 存储仓库建筑，包含大门和货物堆
- **尺寸**: 128x128px
- **用途**: 存储各种资源

### 发电厂 (Power Plant)
- **路径**: `assets/buildings/industrial/power-plant.svg`
- **描述**: 发电厂建筑，包含冷却塔和输电线路
- **尺寸**: 128x128px
- **用途**: 提供电力

### 基地 (Base)
- **路径**: `assets/buildings/industrial/base.svg`
- **描述**: 工业基地建筑，包含主体建筑、烟囱和工业设备
- **尺寸**: 240x160px
- **用途**: 工业中心和管理设施
- **动画**: `css/components/base-animation.css`

## 住宅建筑

### 房屋 (House)
- **路径**: `assets/buildings/residential/house.svg`
- **描述**:  residential house with chimney and smoke effect
- **尺寸**: 128x128px
- **用途**: 提供人口居住

## 基础设施

### 道路 (Road)
- **路径**: `assets/infrastructure/road.svg`
- **描述**: 城市道路，包含车道线和路边石
- **尺寸**: 128x64px
- **用途**: 连接不同建筑和区域

### 铁路 (Railway)
- **路径**: `assets/infrastructure/railway.svg`
- **描述**: 铁路轨道，包含铁轨和枕木
- **尺寸**: 128x64px
- **用途**: 运输资源和货物

### 铁轨 (Railway Track)
- **路径**: `assets/infrastructure/railway-track.svg`
- **描述**: 工业铁轨，包含铁轨、枕木和连接点
- **尺寸**: 200x40px
- **用途**: 火车行驶轨道
- **动画**: `css/components/railway-animation.css`

## 机械设备

### 传送带 (Conveyor)
- **路径**: `assets/machinery/conveyor.svg`
- **描述**: 工业传送带，包含滚轮和货物
- **尺寸**: 128x64px
- **用途**: 传输资源和材料

### 拖拉机 (Tractor)
- **路径**: `assets/machinery/tractor.svg`
- **描述**: 工业拖拉机，包含驾驶室和车轮
- **尺寸**: 120x80px
- **用途**: 农业和工业运输
- **动画**: `css/components/tractor-animation.css`

### 卡车 (Truck)
- **路径**: `assets/machinery/truck.svg`
- **描述**: 工业卡车，包含驾驶室和货箱
- **尺寸**: 160x80px
- **用途**: 货物运输
- **动画**: `css/components/truck-animation.css`

### 手推车 (Handcart)
- **路径**: `assets/machinery/handcart.svg`
- **描述**: 工业手推车，包含车斗和把手
- **尺寸**: 100x70px
- **用途**: 短途货物运输
- **动画**: `css/components/handcart-animation.css`

### 火车 (Train)
- **路径**: `assets/machinery/train.svg`
- **描述**: 工业火车，包含车头和车厢
- **尺寸**: 200x60px
- **用途**: 长距离货物运输
- **动画**: `css/components/train-animation.css`

## 资源图标

### 木材 (Wood)
- **路径**: `assets/icons/wood.svg`
- **描述**: 木材资源图标
- **尺寸**: 48x48px

### 石头 (Stone)
- **路径**: `assets/icons/stone.svg`
- **描述**: 石头资源图标
- **尺寸**: 48x48px

### 食物 (Food)
- **路径**: `assets/icons/food.svg`
- **描述**: 食物资源图标
- **尺寸**: 48x48px

### 钢铁 (Steel)
- **路径**: `assets/icons/steel.svg`
- **描述**: 钢铁资源图标
- **尺寸**: 48x48px

### 铁矿 (Iron)
- **路径**: `assets/icons/iron.svg`
- **描述**: 铁矿资源图标
- **尺寸**: 48x48px

### 煤炭 (Coal)
- **路径**: `assets/icons/coal.svg`
- **描述**: 煤炭资源图标
- **尺寸**: 48x48px

### 石油 (Oil)
- **路径**: `assets/icons/oil.svg`
- **描述**: 石油资源图标
- **尺寸**: 48x48px

## 背景与装饰

### 背景图案 (Background Pattern)
- **路径**: `assets/images/background-pattern.svg`
- **描述**: 工业风格网格背景图案
- **尺寸**: 100x100px
- **用途**: 游戏背景

## 动画效果

### 加载动画 (Loading Animations)
- **路径**: `assets/animations/loading.css`
- **描述**: 多种加载动画效果
- **包含动画**: 旋转、脉冲、波浪、闪烁、边框、文本、工业风格

## 使用建议

1. **SVG 资源**: 可直接在 HTML 中使用 `<img>` 标签或内联 SVG
2. **CSS 动画**: 通过添加相应的 CSS 类来应用动画效果
3. **资源绑定**: 可根据游戏模型的类型和功能，选择相应的资源进行绑定
4. **缩放建议**: SVG 资源支持任意缩放，建议根据游戏界面比例进行调整
5. **颜色调整**: 可通过修改 SVG 文件中的颜色值来适应不同的游戏主题

## 资源扩展

如需添加新资源，建议按照以下命名规范：
- 建筑类: `[building-type].svg`
- 机械类: `[machinery-type].svg`
- 基础设施类: `[infrastructure-type].svg`
- 资源图标类: `[resource-name].svg`

并在本索引文件中更新相应的条目。