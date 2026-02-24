# 3D模型资源目录

此目录用于存储游戏中使用的3D模型和纹理资源。

## 目录结构

```
assets/models/
├── transportation/      # 运输工具模型
│   ├── tractor/         # 拖拉机
│   ├── truck/           # 卡车
│   ├── handcart/        # 手推车
│   └── train/           # 火车
├── infrastructure/      # 基础设施模型
│   └── railway/         # 铁轨
├── buildings/           # 建筑模型
│   └── industrial/      # 工业建筑
└── textures/            # 纹理资源
    ├── materials/       # 材质纹理
    └── objects/         # 对象纹理
```

## 模型格式

推荐使用以下格式：
- **GLTF/GLB**：Three.js原生支持，文件小，加载快
- **OBJ**：通用3D模型格式，支持材质
- **FBX**：适用于复杂动画模型

## 纹理格式

推荐使用以下格式：
- **PNG**：支持透明通道，质量高
- **JPG**：文件小，加载快
- **DDS**：压缩纹理，适合大型场景

## 使用方法

1. 将模型文件放入对应目录
2. 在游戏中使用`ResourceLoader`加载模型和纹理
3. 通过`GameObjectManager`创建带有3D模型的游戏对象

## 性能优化

- 模型面数控制在合理范围内
- 使用纹理压缩
- 对静态模型使用实例化渲染
- 对远处对象使用LOD（细节层次）
