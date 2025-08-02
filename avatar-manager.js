// Avatar Animation Manager
class AvatarManager {
  constructor(configManager) {
    this.config = configManager;
    this.currentProvider = null;
    this.isInitialized = false;
    this.avatarElement = null;
  }

  // Initialize avatar system based on configuration
  async initialize() {
    try {
      if (!this.config.isFeatureEnabled('avatar_animations')) {
        console.log('Avatar animations disabled in configuration');
        return;
      }

      const avatarConfig = this.config.getApiConfig('avatar');
      this.currentProvider = avatarConfig.provider;
      
      console.log(`Initializing avatar with ${this.currentProvider}`);
      
      switch (this.currentProvider) {
        case 'readyplayerme':
          await this.initializeReadyPlayerMe(avatarConfig);
          break;
        case 'did':
          await this.initializeDID(avatarConfig);
          break;
        default:
          throw new Error(`Unsupported avatar provider: ${this.currentProvider}`);
      }
      
      this.isInitialized = true;
      console.log('Avatar system initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize avatar system:', error);
      // Don't throw - avatar is optional, continue without it
    }
  }

  // Initialize Ready Player Me avatar
  async initializeReadyPlayerMe(config) {
    if (!config.avatar_url) {
      console.warn('Ready Player Me avatar URL not configured');
      return;
    }

    try {
      // Create avatar container in the existing avatar circle
      const avatarCircle = document.querySelector('.avatar-circle');
      if (avatarCircle) {
        // Hide the initials
        const initials = avatarCircle.querySelector('.avatar-initials');
        if (initials) initials.style.display = 'none';

        // Create 3D avatar container
        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'rpm-avatar-container';
        avatarContainer.style.cssText = `
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          position: relative;
        `;

        // For now, show a placeholder image until 3D integration
        const avatarImg = document.createElement('img');
        avatarImg.src = config.avatar_url.replace('.glb', '.png'); // Try PNG version
        avatarImg.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        `;
        
        avatarImg.onerror = () => {
          // Fallback to initials if image fails
          initials.style.display = 'flex';
          avatarContainer.remove();
        };

        avatarContainer.appendChild(avatarImg);
        avatarCircle.appendChild(avatarContainer);
        this.avatarElement = avatarContainer;
      }

      console.log('Ready Player Me avatar loaded');
      
    } catch (error) {
      throw new Error(`Ready Player Me initialization failed: ${error.message}`);
    }
  }

  // Initialize D-ID avatar
  async initializeDID(config) {
    if (!config.api_key) {
      throw new Error('D-ID API key is required');
    }

    try {
      // Test API connection
      const response = await fetch(`${config.api_url}/clips`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(config.api_key + ':')}`
        }
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.status}`);
      }

      // Set up video container for D-ID animations
      const avatarCircle = document.querySelector('.avatar-circle');
      if (avatarCircle) {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'did-avatar-container';
        videoContainer.style.cssText = `
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          position: absolute;
          top: 0;
          left: 0;
          display: none;
        `;

        const video = document.createElement('video');
        video.style.cssText = `
          width: 100%;
          height: 100%;
          object-fit: cover;
        `;
        video.muted = false;
        video.playsInline = true;

        videoContainer.appendChild(video);
        avatarCircle.appendChild(videoContainer);
        this.avatarElement = videoContainer;
      }

      console.log('D-ID avatar system ready');
      
    } catch (error) {
      throw new Error(`D-ID initialization failed: ${error.message}`);
    }
  }

  // Animate avatar with gesture
  async animateGesture(gesture, duration = 3000) {
    if (!this.isInitialized || !this.avatarElement) {
      console.log('Avatar not available, skipping gesture animation');
      return;
    }

    console.log(`Animating gesture: ${gesture}`);

    try {
      switch (this.currentProvider) {
        case 'readyplayerme':
          await this.animateReadyPlayerMeGesture(gesture, duration);
          break;
        case 'did':
          await this.animateDIDGesture(gesture, duration);
          break;
      }
    } catch (error) {
      console.error('❌ Avatar gesture animation failed:', error);
    }
  }

  // Animate Ready Player Me gesture
  async animateReadyPlayerMeGesture(gesture, duration) {
    // For now, add a simple CSS animation
    const avatar = this.avatarElement;
    
    switch (gesture) {
      case 'wave':
        avatar.style.animation = 'avatarWave 2s ease-in-out';
        break;
      case 'nod':
        avatar.style.animation = 'avatarNod 1s ease-in-out';
        break;
      case 'smile':
        avatar.style.animation = 'avatarSmile 1.5s ease-in-out';
        break;
    }

    // Add CSS animations if not already present
    this.addAvatarAnimations();

    // Clear animation after duration
    setTimeout(() => {
      avatar.style.animation = '';
    }, duration);
  }

  // Animate D-ID gesture with speech
  async animateDIDGesture(gesture, duration, audioUrl = null) {
    const config = this.config.get('avatar.did');
    
    try {
      // Create D-ID animation request
      const requestBody = {
        script: {
          type: 'text',
          input: this.getGestureText(gesture)
        },
        config: {
          fluent: true,
          pad_audio: 0
        }
      };

      // Add audio if provided
      if (audioUrl) {
        requestBody.script = {
          type: 'audio',
          audio_url: audioUrl
        };
      }

      // Add presenter
      if (config.presenter_id) {
        requestBody.presenter_id = config.presenter_id;
      }

      const response = await fetch(`${config.api_url}/clips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(config.api_key + ':')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`D-ID animation request failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Poll for completion and play video
      const videoUrl = await this.pollDIDClip(result.id, config);
      await this.playDIDVideo(videoUrl);
      
    } catch (error) {
      throw new Error(`D-ID gesture animation failed: ${error.message}`);
    }
  }

  // Poll D-ID clip for completion
  async pollDIDClip(clipId, config, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${config.api_url}/clips/${clipId}`, {
          headers: {
            'Authorization': `Basic ${btoa(config.api_key + ':')}`
          }
        });

        if (!response.ok) {
          throw new Error(`D-ID polling error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'done') {
          return result.result_url;
        } else if (result.status === 'error') {
          throw new Error('D-ID clip generation failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    
    throw new Error('D-ID clip generation timeout');
  }

  // Play D-ID video
  async playDIDVideo(videoUrl) {
    return new Promise((resolve, reject) => {
      const video = this.avatarElement.querySelector('video');
      const container = this.avatarElement;
      
      video.src = videoUrl;
      container.style.display = 'block';
      
      video.onended = () => {
        container.style.display = 'none';
        resolve();
      };
      
      video.onerror = () => {
        container.style.display = 'none';
        reject(new Error('Failed to play D-ID video'));
      };
      
      video.play().catch(reject);
    });
  }

  // Get text for gesture (for D-ID text-to-speech)
  getGestureText(gesture) {
    const texts = {
      wave: "Hello! Nice to meet you!",
      nod: "Yes, I understand.",
      smile: "I'm happy to help you today!",
      greeting: this.config.get('personality.greeting_message')
    };
    
    return texts[gesture] || texts.greeting;
  }

  // Add CSS animations for avatar gestures
  addAvatarAnimations() {
    if (document.getElementById('avatar-animations')) return;

    const style = document.createElement('style');
    style.id = 'avatar-animations';
    style.textContent = `
      @keyframes avatarWave {
        0%, 100% { transform: rotate(0deg) scale(1); }
        25% { transform: rotate(-5deg) scale(1.05); }
        75% { transform: rotate(5deg) scale(1.05); }
      }
      
      @keyframes avatarNod {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      
      @keyframes avatarSmile {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.02); filter: brightness(1.1); }
      }
    `;
    
    document.head.appendChild(style);
  }

  // Check if avatar is available
  isAvailable() {
    return this.isInitialized;
  }

  // Get current provider
  getProvider() {
    return this.currentProvider;
  }
}

// Export for use in other files
window.AvatarManager = AvatarManager;