// Voice Cloning Integration Manager
class VoiceCloningManager {
  constructor(configManager) {
    this.config = configManager;
    this.currentProvider = null;
    this.isInitialized = false;
  }

  // Initialize voice cloning based on configuration
  async initialize() {
    try {
      const voiceConfig = this.config.getApiConfig('voice_output');
      this.currentProvider = voiceConfig.provider;
      
      console.log(`🎤 Initializing voice cloning with ${this.currentProvider}`);
      
      switch (this.currentProvider) {
        case 'elevenlabs':
          await this.initializeElevenLabs(voiceConfig);
          break;
        case 'playht':
          await this.initializePlayHT(voiceConfig);
          break;
        case 'resemble':
          await this.initializeResemble(voiceConfig);
          break;
        default:
          throw new Error(`Unsupported voice provider: ${this.currentProvider}`);
      }
      
      this.isInitialized = true;
      console.log('✅ Voice cloning initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize voice cloning:', error);
      throw error;
    }
  }

  // Initialize ElevenLabs voice cloning
  async initializeElevenLabs(config) {
    if (!config.api_key || !config.voice_id) {
      throw new Error('ElevenLabs API key and voice ID are required');
    }

    // Test API connection
    try {
      const response = await fetch(`${config.api_url}/voices`, {
        headers: {
          'xi-api-key': config.api_key
        }
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const voices = await response.json();
      const targetVoice = voices.voices.find(v => v.voice_id === config.voice_id);
      
      if (!targetVoice) {
        throw new Error('Configured voice ID not found in your ElevenLabs account');
      }

      console.log(`✅ ElevenLabs voice "${targetVoice.name}" ready`);
      
    } catch (error) {
      throw new Error(`ElevenLabs initialization failed: ${error.message}`);
    }
  }

  // Initialize Play.ht voice cloning
  async initializePlayHT(config) {
    if (!config.api_key || !config.user_id || !config.voice_id) {
      throw new Error('Play.ht API key, user ID, and voice ID are required');
    }

    // Test API connection
    try {
      const response = await fetch(`${config.api_url}/cloned-voices`, {
        headers: {
          'Authorization': `Bearer ${config.api_key}`,
          'X-User-ID': config.user_id
        }
      });

      if (!response.ok) {
        throw new Error(`Play.ht API error: ${response.status}`);
      }

      console.log('✅ Play.ht voice cloning ready');
      
    } catch (error) {
      throw new Error(`Play.ht initialization failed: ${error.message}`);
    }
  }

  // Initialize Resemble.ai voice cloning
  async initializeResemble(config) {
    if (!config.api_token || !config.voice_uuid) {
      throw new Error('Resemble.ai API token and voice UUID are required');
    }

    // Test API connection
    try {
      const response = await fetch(`${config.api_url}/projects/${config.project_uuid}/voices`, {
        headers: {
          'Authorization': `Token token="${config.api_token}"`
        }
      });

      if (!response.ok) {
        throw new Error(`Resemble.ai API error: ${response.status}`);
      }

      console.log('✅ Resemble.ai voice cloning ready');
      
    } catch (error) {
      throw new Error(`Resemble.ai initialization failed: ${error.message}`);
    }
  }

  // Generate speech using the configured voice cloning service
  async generateSpeech(text) {
    if (!this.isInitialized) {
      throw new Error('Voice cloning not initialized');
    }

    console.log(`🎤 Generating speech with ${this.currentProvider}: "${text.substring(0, 50)}..."`);

    switch (this.currentProvider) {
      case 'elevenlabs':
        return await this.generateElevenLabsSpeech(text);
      case 'playht':
        return await this.generatePlayHTSpeech(text);
      case 'resemble':
        return await this.generateResembleSpeech(text);
      default:
        throw new Error(`Unsupported voice provider: ${this.currentProvider}`);
    }
  }

  // Generate speech using ElevenLabs
  async generateElevenLabsSpeech(text) {
    const config = this.config.get(`voice_output.elevenlabs`);
    
    try {
      const response = await fetch(`${config.api_url}/text-to-speech/${config.voice_id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': config.api_key
        },
        body: JSON.stringify({
          text: text,
          model_id: config.model,
          voice_settings: {
            stability: config.stability,
            similarity_boost: config.similarity_boost,
            style: config.style
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
      
    } catch (error) {
      throw new Error(`ElevenLabs speech generation failed: ${error.message}`);
    }
  }

  // Generate speech using Play.ht
  async generatePlayHTSpeech(text) {
    const config = this.config.get(`voice_output.playht`);
    
    try {
      const response = await fetch(`${config.api_url}/tts`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`,
          'X-User-ID': config.user_id
        },
        body: JSON.stringify({
          text: text,
          voice: config.voice_id,
          voice_engine: config.voice_engine
        })
      });

      if (!response.ok) {
        throw new Error(`Play.ht API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
      
    } catch (error) {
      throw new Error(`Play.ht speech generation failed: ${error.message}`);
    }
  }

  // Generate speech using Resemble.ai
  async generateResembleSpeech(text) {
    const config = this.config.get(`voice_output.resemble`);
    
    try {
      const response = await fetch(`${config.api_url}/projects/${config.project_uuid}/clips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token token="${config.api_token}"`
        },
        body: JSON.stringify({
          body: text,
          voice_uuid: config.voice_uuid,
          is_public: false
        })
      });

      if (!response.ok) {
        throw new Error(`Resemble.ai API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Poll for completion
      const audioUrl = await this.pollResembleClip(result.item.uuid, config);
      return audioUrl;
      
    } catch (error) {
      throw new Error(`Resemble.ai speech generation failed: ${error.message}`);
    }
  }

  // Poll Resemble.ai clip for completion
  async pollResembleClip(clipUuid, config, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${config.api_url}/projects/${config.project_uuid}/clips/${clipUuid}`, {
          headers: {
            'Authorization': `Token token="${config.api_token}"`
          }
        });

        if (!response.ok) {
          throw new Error(`Resemble.ai polling error: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.item.status === 'finished') {
          return result.item.audio_src;
        } else if (result.item.status === 'error') {
          throw new Error('Resemble.ai clip generation failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }
    
    throw new Error('Resemble.ai clip generation timeout');
  }

  // Play generated audio
  async playAudio(audioUrl) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Clean up blob URL
        resolve();
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        reject(new Error('Failed to play audio'));
      };
      
      audio.play().catch(reject);
    });
  }

  // Check if voice cloning is available
  isAvailable() {
    return this.isInitialized;
  }

  // Get current provider
  getProvider() {
    return this.currentProvider;
  }
}

// Export for use in other files
window.VoiceCloningManager = VoiceCloningManager;