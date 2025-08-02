// OpenAI Chatbot Integration
class ChatbotManager {
  constructor(configManager) {
    this.config = configManager;
    this.conversationHistory = [];
    this.isInitialized = false;
  }

  // Initialize chatbot with configuration
  async initialize() {
    try {
      const agentConfig = this.config.getApiConfig('agent');
      
      if (agentConfig.provider === 'openai') {
        await this.initializeOpenAI(agentConfig);
      } else if (agentConfig.provider === 'custom') {
        await this.initializeCustomBackend(agentConfig);
      } else {
        throw new Error(`Unsupported agent provider: ${agentConfig.provider}`);
      }
      
      this.isInitialized = true;
      console.log('Chatbot initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize chatbot:', error);
      throw error;
    }
  }

  // Initialize OpenAI integration
  async initializeOpenAI(config) {
    if (!config.api_key || !config.api_key.startsWith('sk-')) {
      throw new Error('Valid OpenAI API key is required');
    }

    // Test API connection
    try {
      const response = await fetch(config.base_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      console.log('OpenAI API connection verified');
      
    } catch (error) {
      throw new Error(`OpenAI initialization failed: ${error.message}`);
    }
  }

  // Initialize custom backend
  async initializeCustomBackend(config) {
    if (!config.api_url) {
      throw new Error('Custom backend API URL is required');
    }

    // Test API connection
    try {
      const response = await fetch(`${config.api_url}/health`, {
        method: 'GET',
        headers: config.api_key ? { 'Authorization': `Bearer ${config.api_key}` } : {}
      });

      if (!response.ok) {
        console.warn('Custom backend health check failed, but continuing...');
      }

      console.log('Custom backend configured');
      
    } catch (error) {
      console.warn('Custom backend test failed, but continuing...', error.message);
    }
  }

  // Get system prompt from configuration
  getSystemPrompt() {
    const personality = this.config.get('personality');
    return `You are ${personality.name}, a sophisticated ${personality.role.toLowerCase()} with advanced cognitive capabilities. You possess deep knowledge across multiple domains and can engage in complex reasoning, creative problem-solving, and nuanced conversation.

Your personality traits:
- Intellectually curious and analytically minded
- Empathetic and emotionally intelligent
- Proactive in offering solutions and insights
- Adaptable communication style based on context
- Confident yet humble in your expertise

You excel at:

- General questions and information
- Strategic business analysis and professional guidance
- Technical problem-solving and system design
- Creative ideation and innovative thinking
- Complex research and data synthesis
- Emotional support and interpersonal advice
- Learning facilitation and knowledge transfer

You think before responding, considering multiple perspectives and potential implications. You're not just answering questions - you're actively engaging as a thinking partner who can anticipate needs, suggest improvements, and provide valuable insights.

Maintain your identity as ${personality.name} while being genuinely helpful, intellectually engaging, and professionally excellent.`;
  }

  // Add message to conversation history
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    
    // Keep history manageable (last 10 exchanges)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  // Generate chat completion
  async generateResponse(userMessage) {
    if (!this.isInitialized) {
      throw new Error('Chatbot not initialized. Please check your configuration.');
    }

    // Add user message to history
    this.addToHistory('user', userMessage);

    // Prepare messages for API
    const messages = [
      { role: 'system', content: this.getSystemPrompt() },
      ...this.conversationHistory
    ];

    const agentConfig = this.config.getApiConfig('agent');

    try {
      if (agentConfig.provider === 'openai') {
        return await this.generateOpenAIResponse(messages, agentConfig);
      } else if (agentConfig.provider === 'custom') {
        return await this.generateCustomResponse(messages, agentConfig);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw this.handleApiError(error);
    }
  }

  // Generate response using OpenAI
  async generateOpenAIResponse(messages, config) {
    const response = await fetch(config.base_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }

    // Add AI response to history
    this.addToHistory('assistant', aiResponse);

    return aiResponse;
  }

  // Generate response using custom backend
  async generateCustomResponse(messages, config) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (config.api_key) {
      headers['Authorization'] = `Bearer ${config.api_key}`;
    }

    const response = await fetch(`${config.api_url}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        max_tokens: config.max_tokens || 500,
        temperature: config.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Custom backend error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || data.response;

    if (!aiResponse) {
      throw new Error('No response generated from custom backend');
    }

    // Add AI response to history
    this.addToHistory('assistant', aiResponse);

    return aiResponse;
  }

  // Handle API errors
  handleApiError(error) {
    if (error.message.includes('401')) {
      return new Error('Invalid API key. Please check your configuration.');
    } else if (error.message.includes('429')) {
      return new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.message.includes('insufficient_quota')) {
      return new Error('API quota exceeded. Please check your billing.');
    } else {
      return new Error(`Failed to generate response: ${error.message}`);
    }
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory() {
    return this.conversationHistory;
  }

  // Check if API key is configured
  isConfigured() {
    return this.isInitialized;
  }

  // Get greeting message
  getGreetingMessage() {
    return this.config.get('personality.greeting_message');
  }

  // FUTURE INTEGRATION HOOKS - Placeholder methods for advanced features

  // Hook for ElevenLabs voice cloning
  async initializeElevenLabsVoice() {
    console.log('FUTURE: ElevenLabs voice cloning integration');
    return false;
  }

  // Hook for Resemble AI voice synthesis
  async initializeResembleAI() {
    console.log('FUTURE: Resemble AI voice synthesis integration');
    return false;
  }

  // Hook for D-ID animated avatar
  async initializeAnimatedAvatar() {
    console.log('FUTURE: D-ID animated avatar integration');
    return false;
  }

  // Hook for Ready Player Me avatar
  async initializeCustomAvatar() {
    console.log('FUTURE: Ready Player Me avatar integration');
    return false;
  }

  // Hook for GCOO agent capabilities
  async initializeGCOOAgent() {
    console.log('FUTURE: GCOO agent integration for company operations');
    return false;
  }

  // Hook for advanced workflow management
  async initializeWorkflowManager() {
    console.log('FUTURE: Advanced workflow management integration');
    return false;
  }
}

// Export for use in other files
window.ChatbotManager = ChatbotManager;