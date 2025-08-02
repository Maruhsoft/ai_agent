// 3D Avatar Manager
class Avatar3D {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.avatar = null;
    this.mixer = null;
    this.clock = new THREE.Clock();
    this.isLoaded = false;
    this.animations = [];
    this.currentAnimation = null;
    
    this.init();
  }

  async init() {
    try {
      await this.setupScene();
      await this.loadAvatar();
      this.animate();
      console.log('3D Avatar initialized successfully');
    } catch (error) {
      console.warn('3D Avatar initialization failed:', error);
      this.fallbackToDefault();
    }
  }

  async setupScene() {
    const canvas = document.getElementById('avatar-canvas');
    if (!canvas) {
      throw new Error('Avatar canvas not found');
    }

    // Scene setup
    this.scene = new THREE.Scene();
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.camera.position.set(0, 0, 2);
    
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: canvas,
      alpha: true, 
      antialias: true 
    });
    this.renderer.setSize(80, 80);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-1, 0, 1);
    this.scene.add(fillLight);
  }

  async loadAvatar() {
    return new Promise((resolve, reject) => {
      const loader = new THREE.GLTFLoader();
      
      loader.load(
        './avatar.glb',
        (gltf) => {
          this.avatar = gltf.scene;
          
          // Scale and position the avatar
          const box = new THREE.Box3().setFromObject(this.avatar);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Scale to fit nicely in the circle
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim;
          this.avatar.scale.setScalar(scale);
          
          // Center the avatar
          this.avatar.position.copy(center).multiplyScalar(-scale);
          this.avatar.position.y -= 0.2; // Adjust vertical position
          
          // Enable shadows
          this.avatar.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Setup animations if available
          if (gltf.animations && gltf.animations.length > 0) {
            this.mixer = new THREE.AnimationMixer(this.avatar);
            this.animations = gltf.animations;
            
            // Play idle animation if available
            const idleAnimation = this.animations.find(anim => 
              anim.name.toLowerCase().includes('idle') || 
              anim.name.toLowerCase().includes('breathing')
            );
            
            if (idleAnimation) {
              const action = this.mixer.clipAction(idleAnimation);
              action.play();
              this.currentAnimation = action;
            }
          }
          
          this.scene.add(this.avatar);
          this.isLoaded = true;
          
          // Hide default avatar
          const defaultAvatar = document.querySelector('.default-avatar');
          if (defaultAvatar) {
            defaultAvatar.style.opacity = '0';
            setTimeout(() => {
              defaultAvatar.style.display = 'none';
            }, 500);
          }
          
          resolve();
        },
        (progress) => {
          console.log('Avatar loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Avatar loading error:', error);
          reject(error);
        }
      );
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    if (this.isLoaded && this.avatar) {
      // Subtle rotation
      this.avatar.rotation.y += 0.002;
      
      // Gentle floating motion
      const time = Date.now() * 0.001;
      this.avatar.position.y += Math.sin(time * 2) * 0.002;
      
      // Update animations
      if (this.mixer) {
        this.mixer.update(this.clock.getDelta());
      }
    }
    
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Play specific gesture animation
  playGesture(gestureName, duration = 3000) {
    if (!this.isLoaded || !this.mixer) {
      console.log('Avatar not ready for gestures');
      return;
    }

    // Find gesture animation
    const gestureAnimation = this.animations.find(anim => 
      anim.name.toLowerCase().includes(gestureName.toLowerCase())
    );

    if (gestureAnimation) {
      // Stop current animation
      if (this.currentAnimation) {
        this.currentAnimation.fadeOut(0.5);
      }

      // Play gesture
      const gestureAction = this.mixer.clipAction(gestureAnimation);
      gestureAction.reset();
      gestureAction.setLoop(THREE.LoopOnce);
      gestureAction.clampWhenFinished = true;
      gestureAction.fadeIn(0.5);
      gestureAction.play();

      // Return to idle after duration
      setTimeout(() => {
        gestureAction.fadeOut(0.5);
        if (this.currentAnimation) {
          this.currentAnimation.fadeIn(0.5);
        }
      }, duration);
    } else {
      // Fallback to procedural animation
      this.playProceduralGesture(gestureName, duration);
    }
  }

  // Procedural gesture animations
  playProceduralGesture(gestureName, duration) {
    if (!this.isLoaded || !this.avatar) return;

    const originalRotation = { ...this.avatar.rotation };
    const originalPosition = { ...this.avatar.position };
    const startTime = Date.now();

    const animateGesture = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const time = elapsed * 0.01;

      switch (gestureName) {
        case 'wave':
          this.avatar.rotation.z = Math.sin(time * 3) * 0.2;
          this.avatar.rotation.y = originalRotation.y + Math.sin(time * 2) * 0.3;
          break;
          
        case 'nod':
          this.avatar.rotation.x = Math.sin(time * 4) * 0.3;
          break;
          
        case 'smile':
          const scale = 1 + Math.sin(time * 2) * 0.05;
          this.avatar.scale.setScalar(1.5 * scale);
          break;
          
        case 'greeting':
          this.avatar.rotation.y = originalRotation.y + Math.sin(time) * 0.5;
          this.avatar.position.y = originalPosition.y + Math.sin(time * 3) * 0.1;
          break;
      }

      if (progress < 1) {
        requestAnimationFrame(animateGesture);
      } else {
        // Reset to original state
        this.avatar.rotation.x = originalRotation.x;
        this.avatar.rotation.y = originalRotation.y;
        this.avatar.rotation.z = originalRotation.z;
        this.avatar.position.y = originalPosition.y;
        this.avatar.scale.setScalar(1.5);
      }
    };

    animateGesture();
  }

  // Speaking animation
  startSpeaking() {
    if (!this.isLoaded || !this.avatar) return;

    this.isSpeaking = true;
    const speakingAnimation = () => {
      if (!this.isSpeaking) return;

      const time = Date.now() * 0.01;
      // Subtle head movement while speaking
      this.avatar.rotation.x = Math.sin(time * 2) * 0.1;
      this.avatar.rotation.y += Math.sin(time * 1.5) * 0.005;

      requestAnimationFrame(speakingAnimation);
    };

    speakingAnimation();
  }

  stopSpeaking() {
    this.isSpeaking = false;
  }

  // Listening animation
  startListening() {
    if (!this.isLoaded || !this.avatar) return;

    this.isListening = true;
    const listeningAnimation = () => {
      if (!this.isListening) return;

      const time = Date.now() * 0.005;
      // Gentle attention pose
      this.avatar.rotation.x = Math.sin(time) * 0.05;
      this.avatar.position.y += Math.sin(time * 2) * 0.01;

      requestAnimationFrame(listeningAnimation);
    };

    listeningAnimation();
  }

  stopListening() {
    this.isListening = false;
  }

  // Fallback to default avatar
  fallbackToDefault() {
    const canvas = document.getElementById('avatar-canvas');
    if (canvas) {
      canvas.style.display = 'none';
    }
    
    const defaultAvatar = document.querySelector('.default-avatar');
    if (defaultAvatar) {
      defaultAvatar.style.display = 'block';
      defaultAvatar.style.opacity = '1';
    }
  }

  // Resize handler
  onResize() {
    if (this.renderer && this.camera) {
      this.renderer.setSize(80, 80);
      this.camera.aspect = 1;
      this.camera.updateProjectionMatrix();
    }
  }
}

// Initialize 3D Avatar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Three.js to load
  setTimeout(() => {
    if (window.THREE) {
      window.avatar3D = new Avatar3D();
    } else {
      console.warn('Three.js not loaded, using default avatar');
    }
  }, 1000);
});

// Export for use in other files
window.Avatar3D = Avatar3D;