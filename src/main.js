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
    this.currentModel = null;
    this.fbxLoader = new FBXLoader();
    // 初始化关节控制器
    this.jointController = null;
    
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
    const loadBtn = $('#load-model-btn');
    const modelStatus = $('#model-status');

    modelSelect.on('change', function() {
      const selectedValue = $(this).val();
      loadBtn.prop('disabled', !selectedValue);
    });

    loadBtn.on('click', () => {
      const selectedModel = modelSelect.val();
      if (selectedModel) {
        this.loadModel(selectedModel);
      }
    });
  }

  async loadModelList() {
    try {
      // 这里模拟从models目录获取FBX文件列表
      // 在实际应用中，你需要通过Tauri的文件系统API来获取
      const modelList = [
        'female_base.fbx',
        'character2.fbx',
        'character3.fbx'
      ];

      const modelSelect = $('#model-select');
      modelSelect.empty().append('<option value="">请选择模型...</option>');
      
      modelList.forEach(model => {
        modelSelect.append(`<option value="${model}">${model}</option>`);
      });
    } catch (error) {
      console.error('加载模型列表失败:', error);
      $('#model-status').text('加载模型列表失败');
    }
  }

  loadModel(modelPath) {
    const loadingOverlay = $('#loading-overlay');
    const modelStatus = $('#model-status');
    
    loadingOverlay.addClass('show');
    modelStatus.text('正在加载模型...');

    // 移除当前模型
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.jointController.clearJointControllers();
    }

    // 加载新模型
    this.fbxLoader.load(
      `./models/${modelPath}`,
      (object) => {
        // 设置模型属性
        object.scale.setScalar(0.005);
        
        // 将模型放置在舞台中心，并调整到地面上
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const minY = box.min.y;
        
        // 设置位置：X和Z轴在中心(0,0)，Y轴让模型底部贴地
        object.position.set(0, -minY * object.scale.y, 0);
        
        // 启用阴影
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.currentModel = object;
        this.scene.add(object);

        // 添加关节控制器
        this.jointController.addJointControllers(object);
        console.log('模型加载完成，关节控制器已添加');
        
        loadingOverlay.removeClass('show');
        modelStatus.text(`已加载: ${modelPath}`);
        
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
