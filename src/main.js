import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { JointController } from './JointController.js';

class AnyposeApp {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.loadedModels = []; // 改为数组存储多个模型
    this.fbxLoader = new FBXLoader();
    // 初始化关节控制器
    this.jointController = null;
    this.modelSpacing = 1; // 模型之间的间距
    
    this.init();
    this.setupUI();
    this.loadModelList();
  }

  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a2a2a);

    // 创建相机 - 调整为更好的舞台观察角度
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(3, 2, 5); // 稍微抬高并后退，更好地观察舞台

    // 调整相机位置：平视人体模型（假设人体高度约1.7米）
    this.camera.position.set(0, 0.85, 2); // Y轴设为人体中心高度的一半

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    const container = document.getElementById('three-container');
    container.appendChild(this.renderer.domElement);

    // 添加控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1, 0); // 目标点设在舞台中心稍微抬高的位置

    // 添加光照
    this.setupLighting();

    // 添加地面
    this.setupGround();

    // 初始化关节控制器
    this.jointController = new JointController(this.scene);

    // 开始渲染循环
    this.animate();

    // 处理窗口大小变化
    window.addEventListener('resize', () => this.onWindowResize());
  }

  setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);
  }

  setupGround() {
    // 创建主舞台地面
    const stageSize = 10;
    const geometry = new THREE.PlaneGeometry(stageSize, stageSize);
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x444444,
      transparent: true,
      opacity: 0.8
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 只保留网格线，移除其他装饰元素
    const gridHelper = new THREE.GridHelper(stageSize, 20, 0x666666, 0x333333);
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
}



  setupUI() {
    const modelSelect = $('#model-select');
    const modelStatus = $('#model-status');

    modelSelect.on('change', () => {
      const selectedValue = modelSelect.val();
      if (selectedValue) {
        this.loadModel(selectedValue);
        // 加载完成后重置选择框，允许重复选择
        setTimeout(() => {
          modelSelect.val('');
        }, 100);
      }
    });
  }

  async loadModelList() {
    try {
      // 定义模型选项和对应的文件映射
      const modelOptions = [
        { label: '女性', value: 'female', file: 'female_base.fbx' },
        { label: '男性', value: 'male', file: 'male_base.fbx' }
        // 可以在这里添加更多模型选项
      ];

      const modelSelect = $('#model-select');
      modelSelect.empty().append('<option value="">请选择模型...</option>');
      
      modelOptions.forEach(option => {
        modelSelect.append(`<option value="${option.value}">${option.label}</option>`);
      });
    } catch (error) {
      console.error('加载模型列表失败:', error);
      $('#model-status').text('加载模型列表失败');
    }
  }

  loadModel(modelType) {
    // 建立模型类型到文件的映射
    const modelFileMap = {
      'female': 'female_base.fbx',
      'male': 'male_base.fbx',
      // 可以在这里添加更多模型映射
    };

    const modelFile = modelFileMap[modelType];
    if (!modelFile) {
      console.error('未找到对应的模型文件:', modelType);
      $('#model-status').text('模型文件不存在');
      return;
    }

    const loadingOverlay = $('#loading-overlay');
    const modelStatus = $('#model-status');
    
    loadingOverlay.addClass('show');
    modelStatus.text('正在加载模型...');

    // 计算新模型的位置
    const newModelPosition = this.calculateNextModelPosition();

    // 加载新模型
    this.fbxLoader.load(
      `./models/${modelFile}`,
      (object) => {
        // 设置模型属性
        object.scale.setScalar(0.005);
        
        // 计算模型边界框
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const minY = box.min.y;
        
        // 设置模型位置：让模型底部贴地，并排列在旁边
        object.position.set(
          newModelPosition.x, 
          -minY * object.scale.y, 
          newModelPosition.z
        );
        
        // 启用阴影
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // 为模型添加标识信息
        object.userData = {
          modelType: modelType,
          modelFile: modelFile,
          loadTime: Date.now()
        };

        // 添加到场景和模型数组
        this.scene.add(object);
        this.loadedModels.push(object);

        // 为新模型添加关节控制器
        this.jointController.addJointControllers(object);
        
        console.log(`模型加载完成，当前场景中有 ${this.loadedModels.length} 个模型`);
        
        loadingOverlay.removeClass('show');
        const displayName = modelType === 'female' ? '女性模型' : '男性模型';
        modelStatus.text(`已加载: ${displayName} (共${this.loadedModels.length}个模型)`);
      },
      (progress) => {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        modelStatus.text(`加载中... ${percent}%`);
      },
      (error) => {
        console.error('模型加载失败:', error);
        loadingOverlay.removeClass('show');
        modelStatus.text('模型加载失败');
      }
    );
  }

  // 计算下一个模型的位置
  calculateNextModelPosition() {
    const modelCount = this.loadedModels.length;
    
    // 计算排列位置：一行排列，超过5个换行
    const modelsPerRow = 5;
    const row = Math.floor(modelCount / modelsPerRow);
    const col = modelCount % modelsPerRow;
    
    // 计算位置，让模型居中排列
    const startX = -(modelsPerRow - 1) * this.modelSpacing / 2;
    const x = startX + col * this.modelSpacing;
    const z = row * this.modelSpacing;
    
    return { x, z };
  }

  // 添加清除所有模型的方法
  clearAllModels() {
      // 清除所有模型的关节控制器
      this.loadedModels.forEach(model => {
          this.jointController.clearModelJointControllers(model);
      });
      
      // 从场景中移除所有模型
      this.loadedModels.forEach(model => {
          this.scene.remove(model);
      });
      
      // 清空模型数组
      this.loadedModels = [];
      
      // 更新状态显示
      $('#model-status').text('场景已清空');
      console.log('已清除所有模型');
  }

  // 获取模型信息
  getModelInfo() {
    return this.loadedModels.map((model, index) => ({
      index: index,
      type: model.userData.modelType,
      file: model.userData.modelFile,
      position: model.position,
      loadTime: new Date(model.userData.loadTime).toLocaleTimeString()
    }));
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // 更新控制器
    this.controls.update();
    
    this.renderer.render(this.scene, this.camera);
  }
}

// 当页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', () => {
  new AnyposeApp();
});
