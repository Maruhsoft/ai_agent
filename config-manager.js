// Configuration Manager for Miss Bukola Lukan AI Assistant
class ConfigManager {
  constructor() {
    this.config = null;
    this.configLoaded = false;
  }

  // Load configuration from JSON file
  async loadConfig() {
    try {
      const response = await fetch('./config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      
      this.config = await response.json();
      this.configLoaded = true;
      console.log('Configuration loaded successfully');
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      throw new Error('Configuration file could not be loaded. Please check config.json exists and is valid.');
    }
  }

  // Get configuration value by path (e.g., 'agent.openai.api_key')
  get(path) {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Set configuration value by path
  set(path, value) {
    if (!this.configLoaded) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }

    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  // Check if a feature is enabled
  isFeatureEnabled(feature) {
    return this.get(`features.${feature}`) === true;
  }

  // Get API configuration for a service
  getApiConfig(service) {
    const provider = this.get(`${service}.provider`);
    if (!provider) {
      throw new Error(`No provider configured for ${service}`);
    }

    const config = this.get(`${service}.${provider}`);
    if (!config) {
      throw new Error(`No configuration found for ${service}.${provider}`);
    }

    return { provider, ...config };
  }

  // Validate required configuration
  validateConfig() {
    const errors = [];

    // Check agent configuration
    const agentProvider = this.get('agent.provider');
    if (agentProvider === 'openai') {
      const apiKey = this.get('agent.openai.api_key');
      if (!apiKey || !apiKey.startsWith('sk-')) {
        errors.push('OpenAI API key is missing or invalid');
      }
    } else if (agentProvider === 'custom') {
      const apiUrl = this.get('agent.custom_backend.api_url');
      if (!apiUrl) {
        errors.push('Custom backend API URL is required');
      }
    }

    // Check voice output configuration if enabled
    if (this.isFeatureEnabled('voice_output')) {
      const voiceProvider = this.get('voice_output.provider');
      const voiceConfig = this.get(`voice_output.${voiceProvider}`);
      
      if (voiceProvider === 'elevenlabs') {
        if (!voiceConfig?.api_key) {
          errors.push('ElevenLabs API key is required for voice output');
        }
        if (!voiceConfig?.voice_id) {
          errors.push('ElevenLabs Voice ID is required');
        }
      } else if (voiceProvider === 'playht') {
        if (!voiceConfig?.api_key || !voiceConfig?.user_id) {
          errors.push('Play.ht API key and User ID are required');
        }
      } else if (voiceProvider === 'resemble') {
        if (!voiceConfig?.api_token) {
          errors.push('Resemble.ai API token is required');
        }
      }
    }

    // Check avatar configuration if enabled
    if (this.isFeatureEnabled('avatar_animations')) {
      const avatarProvider = this.get('avatar.provider');
      const avatarConfig = this.get(`avatar.${avatarProvider}`);
      
      if (avatarProvider === 'did' && !avatarConfig?.api_key) {
        errors.push('D-ID API key is required for avatar animations');
      }
    }

    return errors;
  }

  // Get missing configuration instructions
  getMissingConfigInstructions() {
    const errors = this.validateConfig();
    const instructions = [];

    errors.forEach(error => {
      if (error.includes('OpenAI')) {
        instructions.push({
          service: 'OpenAI',
          instructions: this.get('agent.openai._instructions'),
          error: error
        });
      } else if (error.includes('ElevenLabs')) {
        instructions.push({
          service: 'ElevenLabs',
          instructions: this.get('voice_output.elevenlabs._instructions'),
          error: error
        });
      } else if (error.includes('Play.ht')) {
        instructions.push({
          service: 'Play.ht',
          instructions: this.get('voice_output.playht._instructions'),
          error: error
        });
      } else if (error.includes('Resemble')) {
        instructions.push({
          service: 'Resemble.ai',
          instructions: this.get('voice_output.resemble._instructions'),
          error: error
        });
      } else if (error.includes('D-ID')) {
        instructions.push({
          service: 'D-ID',
          instructions: this.get('avatar.did._instructions'),
          error: error
        });
      }
    });

    return instructions;
  }

  // Save configuration to localStorage (for runtime changes)
  saveToStorage() {
    try {
      localStorage.setItem('bukola_config', JSON.stringify(this.config));
      console.log('Configuration saved to localStorage');
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }

  // Load configuration from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('bukola_config');
      if (stored) {
        const storedConfig = JSON.parse(stored);
        // Merge with default config, prioritizing stored values
        this.config = { ...this.config, ...storedConfig };
        console.log('Configuration loaded from localStorage');
        return true;
      }
    } catch (error) {
      console.error('Failed to load configuration from localStorage:', error);
    }
    return false;
  }

  // Get full configuration object
  getFullConfig() {
    return this.config;
  }

  // Check if configuration is loaded
  isLoaded() {
    return this.configLoaded;
  }
}

// Export for use in other files
window.ConfigManager = ConfigManager;