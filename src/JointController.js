import * as THREE from 'three';

class JointController {
    constructor(scene) {
        this.scene = scene;
        // 改为按模型分组存储关节控制器
        this.modelJointControllers = new Map(); // key: model, value: controllers array
        
        // 主要关节名称列表 - 更新为实际的骨骼名称格式（无冒号）
        this.mainJointNames = [
            'mixamorigHips',
            'mixamorigSpine',
            'mixamorigSpine1', 
            'mixamorigSpine2',
            'mixamorigNeck',
            'mixamorigHead',
            'mixamorigLeftShoulder',
            'mixamorigLeftArm',
            'mixamorigLeftForeArm',
            'mixamorigLeftHand',
            'mixamorigRightShoulder',
            'mixamorigRightArm',
            'mixamorigRightForeArm',
            'mixamorigRightHand',
            'mixamorigLeftUpLeg',
            'mixamorigLeftLeg',
            'mixamorigLeftFoot',
            'mixamorigRightUpLeg',
            'mixamorigRightLeg',
            'mixamorigRightFoot'
        ];
    }

    createJointController(bone) {
        // 创建红色小球几何体 
        const geometry = new THREE.SphereGeometry(2, 16, 16); 
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.8,
            depthTest: false // 确保在最上层显示
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.renderOrder = 999; // 设置渲染优先级，确保在最上层
        
        // 将小球添加到骨骼上
        bone.add(sphere);
        
        return {
            bone: bone,
            controller: sphere
        };
    }

    addJointControllers(model) {
        // 不再清除所有控制器，只为当前模型添加
        const modelControllers = [];
        
        // 调试：打印所有骨骼名称
        console.log('=== 模型中的所有骨骼 ===');
        model.traverse((child) => {
            if (child.isBone) {
                console.log('骨骼名称:', child.name);
            }
        });
        console.log('=== 骨骼列表结束 ===');
        
        // 遍历模型的骨骼
        model.traverse((child) => {
            if (child.isBone && this.mainJointNames.includes(child.name)) {
                const controller = this.createJointController(child);
                modelControllers.push(controller);
            }
        });
        
        // 将控制器与模型关联
        this.modelJointControllers.set(model, modelControllers);
        
        console.log(`已为模型添加 ${modelControllers.length} 个关节控制器`);
    }

    // 清除特定模型的关节控制器
    clearModelJointControllers(model) {
        const controllers = this.modelJointControllers.get(model);
        if (controllers) {
            controllers.forEach(controller => {
                // 从骨骼中移除控制器
                controller.bone.remove(controller.controller);
                // 清理材质和几何体
                controller.controller.geometry.dispose();
                controller.controller.material.dispose();
            });
            this.modelJointControllers.delete(model);
        }
    }

    // 清除所有关节控制器
    clearAllJointControllers() {
        this.modelJointControllers.forEach((controllers, model) => {
            this.clearModelJointControllers(model);
        });
        this.modelJointControllers.clear();
    }

    // 显示/隐藏特定模型的控制器
    setModelVisible(model, visible) {
        const controllers = this.modelJointControllers.get(model);
        if (controllers) {
            controllers.forEach(controller => {
                controller.controller.visible = visible;
            });
        }
    }

    // 显示/隐藏所有控制器
    setVisible(visible) {
        this.modelJointControllers.forEach((controllers) => {
            controllers.forEach(controller => {
                controller.controller.visible = visible;
            });
        });
    }

    // 设置特定模型控制器颜色
    setModelColor(model, color) {
        const controllers = this.modelJointControllers.get(model);
        if (controllers) {
            controllers.forEach(controller => {
                controller.controller.material.color.setHex(color);
            });
        }
    }

    // 设置所有控制器颜色
    setColor(color) {
        this.modelJointControllers.forEach((controllers) => {
            controllers.forEach(controller => {
                controller.controller.material.color.setHex(color);
            });
        });
    }

    // 设置特定模型控制器大小
    setModelSize(model, size) {
        const controllers = this.modelJointControllers.get(model);
        if (controllers) {
            controllers.forEach(controller => {
                controller.controller.scale.setScalar(size);
            });
        }
    }

    // 设置所有控制器大小
    setSize(size) {
        this.modelJointControllers.forEach((controllers) => {
            controllers.forEach(controller => {
                controller.controller.scale.setScalar(size);
            });
        });
    }

    // 获取所有控制器总数
    getTotalControllerCount() {
        let total = 0;
        this.modelJointControllers.forEach((controllers) => {
            total += controllers.length;
        });
        return total;
    }
}

// 使用 ES6 模块导出语法
export { JointController };