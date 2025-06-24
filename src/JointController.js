import * as THREE from 'three';

class JointController {
    constructor(scene) {
        this.scene = scene;
        this.jointControllers = [];
        this.mainJointNames = [
            // 根关节
            'mixamorigHips',
            
            // 脊椎链
            'mixamorigSpine',
            'mixamorigSpine1',
            'mixamorigSpine2',
            'mixamorigNeck',
            'mixamorigHead',
            
            // 左臂链
            'mixamorigLeftShoulder',
            'mixamorigLeftArm',
            'mixamorigLeftForeArm',
            'mixamorigLeftHand',
            
            // 右臂链
            'mixamorigRightShoulder',
            'mixamorigRightArm',
            'mixamorigRightForeArm',
            'mixamorigRightHand',
            
            // 左腿链
            'mixamorigLeftUpLeg',
            'mixamorigLeftLeg',
            'mixamorigLeftFoot',
            'mixamorigLeftToeBase',
            
            // 右腿链
            'mixamorigRightUpLeg',
            'mixamorigRightLeg',
            'mixamorigRightFoot',
            'mixamorigRightToeBase',
            
            // 主要手指关节（拇指、食指、中指）
            // 'mixamorigLeftHandThumb1',
            // 'mixamorigLeftHandThumb2',
            // 'mixamorigLeftHandIndex1',
            // 'mixamorigLeftHandIndex2',
            // 'mixamorigLeftHandMiddle1',
            // 'mixamorigLeftHandMiddle2',
            
            // 'mixamorigRightHandThumb1',
            // 'mixamorigRightHandThumb2',
            // 'mixamorigRightHandIndex1',
            // 'mixamorigRightHandIndex2',
            // 'mixamorigRightHandMiddle1',
            // 'mixamorigRightHandMiddle2'
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
        // 清除之前的控制器
        this.clearJointControllers();
        
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
                this.jointControllers.push(controller);
            }
        });
        
        console.log(`已添加 ${this.jointControllers.length} 个关节控制器`);
    }

    clearJointControllers() {
        this.jointControllers.forEach(controller => {
            // 从骨骼中移除控制器
            controller.bone.remove(controller.controller);
            // 清理材质和几何体
            controller.controller.geometry.dispose();
            controller.controller.material.dispose();
        });
        this.jointControllers = [];
    }

    // 显示/隐藏控制器
    setVisible(visible) {
        this.jointControllers.forEach(controller => {
            controller.controller.visible = visible;
        });
    }

    // 设置控制器颜色
    setColor(color) {
        this.jointControllers.forEach(controller => {
            controller.controller.material.color.setHex(color);
        });
    }

    // 设置控制器大小
    setSize(size) {
        this.jointControllers.forEach(controller => {
            controller.controller.scale.setScalar(size);
        });
    }
}

// 使用 ES6 模块导出语法
export { JointController };