// Main Application Controller
class ChatbotApp {
  constructor() {
    this.configManager = new ConfigManager();
    this.chatbot = null;
    this.speechManager = new SpeechManager();
    this.voiceCloning = null;
    this.avatarManager = null;
    this.encryptor = new ContactEncryption();
    this.officeTools = new OfficeToolsManager();
    this.workflowEngine = null;
    this.externalTools = null;
    
    this.isFirstVisit = true;
    this.initializationComplete = false;
    
    this.initialize();
  }

  // Initialize the entire application
  async initialize() {
    try {
      // Load configuration first
      await this.configManager.loadConfig();
      
      // Initialize DOM elements and basic UI
      this.initializeElements();
      this.initializeEventListeners();
      this.initializeSpeechCallbacks();
      this.initializeEncryptedContact();
      
      // Initialize AI services
      await this.initializeServices();
      
      // Show greeting on first visit
      if (this.configManager.get('personality.behavior.auto_greet_on_first_visit')) {
        await this.showGreeting();
      }
      
      this.initializationComplete = true;
      console.log('Miss Bukola Lukan is ready!');
      
    } catch (error) {
      console.error('Initialization failed:', error);
      this.showConfigurationError(error);
    }
  }

  // Initialize AI services based on configuration
  async initializeServices() {
    const errors = [];
    
    try {
      // Initialize chatbot
      this.chatbot = new ChatbotManager(this.configManager);
      await this.chatbot.initialize();
    } catch (error) {
      errors.push(`Chatbot: ${error.message}`);
    }
    
    try {
      // Initialize workflow engine
      this.workflowEngine = new WorkflowEngine(this.configManager);
      console.log('Workflow engine initialized');
    } catch (error) {
      console.warn('Workflow engine initialization failed:', error.message);
    }
    
    try {
      // Initialize external tools
      this.externalTools = new ExternalToolsManager(this.configManager);
      console.log('External tools manager initialized');
    } catch (error) {
      console.warn('External tools initialization failed:', error.message);
    }
    
    try {
      // Initialize voice cloning if enabled
      if (this.configManager.isFeatureEnabled('voice_output')) {
        this.voiceCloning = new VoiceCloningManager(this.configManager);
        await this.voiceCloning.initialize();
      }
    } catch (error) {
      console.warn('Voice cloning initialization failed:', error.message);
      // Continue without voice cloning
    }
    
    try {
      // Initialize avatar if enabled
      if (this.configManager.isFeatureEnabled('avatar_animations')) {
        this.avatarManager = new AvatarManager(this.configManager);
        await this.avatarManager.initialize();
      }
    } catch (error) {
      console.warn('Avatar initialization failed:', error.message);
      // Continue without avatar
    }
    
    if (errors.length > 0) {
      throw new Error(`Service initialization failed:\n${errors.join('\n')}`);
    }
  }

  // Show greeting with avatar gesture and voice
  async showGreeting() {
    try {
      const greetingMessage = this.configManager.get('personality.greeting_message');
      const greetingGesture = this.configManager.get('personality.greeting_gesture');
      
      // Add greeting message to chat
      this.addMessage(greetingMessage, 'ai');
      
      // Animate avatar gesture
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.playGesture('greeting', 4000);
      } else if (this.avatarManager && this.avatarManager.isAvailable()) {
        this.avatarManager.animateGesture(greetingGesture);
      }
      
      // Speak greeting with cloned voice or fallback to browser TTS
      await this.speakMessage(greetingMessage);
      
    } catch (error) {
      console.error('Failed to show greeting:', error);
    }
  }

  // Show configuration error dialog
  showConfigurationError(error) {
    const instructions = this.configManager.getMissingConfigInstructions();
    
    let message = `Configuration Error: ${error.message}\n\n`;
    
    if (instructions.length > 0) {
      message += 'Please configure the following services:\n\n';
      instructions.forEach(instruction => {
        message += `${instruction.service}:\n`;
        instruction.instructions.forEach((step, index) => {
          message += `${index + 1}. ${step}\n`;
        });
        message += '\n';
      });
    }
    
    message += 'Please check your config.json file and refresh the page.';
    
    this.addMessage(message, 'ai');
  }

  // Initialize DOM elements
  initializeElements() {
    this.elements = {
      messageInput: document.getElementById('messageInput'),
      sendButton: document.getElementById('sendButton'),
      micButton: document.getElementById('micButton'),
      chatMessages: document.getElementById('chatMessages'),
      voiceStatus: document.getElementById('voiceStatus'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      encryptedContact: document.getElementById('encryptedContact')
    };
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Send button click
    this.elements.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    // Enter key press
    this.elements.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Microphone button click
    this.elements.micButton.addEventListener('click', () => {
      this.toggleVoiceInput();
    });

    // Input field changes
    this.elements.messageInput.addEventListener('input', () => {
      this.updateSendButton();
    });
  }

  // Initialize speech callbacks
  initializeSpeechCallbacks() {
    this.speechManager.onSpeechStart = () => {
      this.elements.micButton.classList.add('recording');
      this.elements.voiceStatus.textContent = 'Listening... Speak now';
      
      // Animate avatar for listening
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.startListening();
      }
    };

    this.speechManager.onSpeechEnd = () => {
      this.elements.micButton.classList.remove('recording');
      this.elements.voiceStatus.textContent = '';
      
      // Stop avatar listening animation
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.stopListening();
      }
    };

    this.speechManager.onSpeechResult = (transcript) => {
      this.elements.messageInput.value = transcript;
      this.updateSendButton();
      this.elements.voiceStatus.textContent = `Recognized: "${transcript}"`;
      setTimeout(() => {
        this.elements.voiceStatus.textContent = '';
      }, 3000);
    };

    this.speechManager.onSpeechError = (error) => {
      this.elements.micButton.classList.remove('recording');
      this.elements.voiceStatus.textContent = `Voice error: ${error}`;
      
      // Stop avatar listening animation
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.stopListening();
      }
      
      setTimeout(() => {
        this.elements.voiceStatus.textContent = '';
      }, 3000);
    };
  }

  // Initialize encrypted contact information
  initializeEncryptedContact() {
    // Use the provided encrypted contact
    const encrypted = '6563zx5333qw6a48er5936ty2b68ui7a6dop3063as7877df646czx7569qw4279er4d5fty';
    const decrypted = this.encryptor.masterDecrypt(encrypted);
    this.elements.encryptedContact.textContent = `Contact: +234 813 788 1985`;
    
    // Store encrypted version for code reference
    this.elements.encryptedContact.dataset.encrypted = encrypted;
  }

  // Toggle voice input
  toggleVoiceInput() {
    if (!this.speechManager.isSpeechRecognitionAvailable()) {
      this.elements.voiceStatus.textContent = 'Voice input not available in this browser';
      return;
    }

    if (this.speechManager.isListening) {
      this.speechManager.stopListening();
    } else {
      this.speechManager.startListening();
    }
  }

  // Update send button state
  updateSendButton() {
    const hasText = this.elements.messageInput.value.trim().length > 0;
    this.elements.sendButton.disabled = !hasText;
  }

  // Send message
  async sendMessage() {
    if (!this.initializationComplete) {
      this.addMessage('Please wait, I\'m still initializing...', 'ai');
      return;
    }

    const message = this.elements.messageInput.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    
    // Clear input
    this.elements.messageInput.value = '';
    this.updateSendButton();

    // Show loading indicator
    this.showLoading(true);

    try {
      // Generate AI response
      const response = await this.chatbot.generateResponse(message);
      
      // Hide loading indicator
      this.showLoading(false);
      
      // Add AI response to chat
      this.addMessage(response, 'ai');
      
      // Animate avatar for response
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.playGesture('nod', 2000);
      }
      
      // Speak the response with cloned voice or fallback
      if (this.configManager.get('personality.behavior.auto_speak_responses')) {
        await this.speakMessage(response);
      }
      
    } catch (error) {
      // Hide loading indicator
      this.showLoading(false);
      
      // Show error message
      this.addMessage(`Sorry, I encountered an error: ${error.message}`, 'ai');
      
      // Animate avatar for error
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.playGesture('shake', 2000);
      }
    }
  }

  // Speak message using cloned voice or fallback to browser TTS
  async speakMessage(message) {
    try {
      // Start avatar speaking animation
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.startSpeaking();
      }
      
      // Try cloned voice first
      if (this.voiceCloning && this.voiceCloning.isAvailable()) {
        const audioUrl = await this.voiceCloning.generateSpeech(message);
        await this.voiceCloning.playAudio(audioUrl);
        
        // Stop avatar speaking animation
        if (window.avatar3D && window.avatar3D.isLoaded) {
          window.avatar3D.stopSpeaking();
        }
        return;
      }
      
      // Fallback to browser TTS
      if (this.speechManager.isSpeechSynthesisAvailable()) {
        const voiceConfig = this.configManager.get('personality.voice_characteristics');
        await this.speechManager.speak(message, {
          rate: voiceConfig.pace === 'fast' ? 1.2 : voiceConfig.pace === 'slow' ? 0.8 : 0.9,
          pitch: voiceConfig.pitch === 'high' ? 1.2 : voiceConfig.pitch === 'low' ? 0.8 : 1.0
        });
        
        // Stop avatar speaking animation
        if (window.avatar3D && window.avatar3D.isLoaded) {
          window.avatar3D.stopSpeaking();
        }
      }
      
    } catch (error) {
      console.error('Failed to speak message:', error);
      
      // Stop avatar speaking animation on error
      if (window.avatar3D && window.avatar3D.isLoaded) {
        window.avatar3D.stopSpeaking();
      }
      // Continue silently - speech is optional
    }
  }

  // Add message to chat
  addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    // Add thinking indicator for AI messages
    if (sender === 'ai') {
      const thinkingDiv = document.createElement('div');
      thinkingDiv.className = 'thinking-indicator';
      thinkingDiv.innerHTML = '<span>•</span><span>•</span><span>•</span>';
      messageDiv.appendChild(thinkingDiv);
      
      this.elements.chatMessages.appendChild(messageDiv);
      this.scrollToBottom();
      
      // Remove thinking indicator after delay and add actual content
      setTimeout(() => {
        thinkingDiv.remove();
        this.addMessageContent(messageDiv, content);
      }, 1200);
      return;
    }
    
    this.addMessageContent(messageDiv, content);
    this.elements.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  // Add message content (separated for thinking indicator)
  addMessageContent(messageDiv, content) {
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const contentP = document.createElement('p');
    contentP.textContent = content;
    contentDiv.appendChild(contentP);

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = this.formatTime(new Date());

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
  }

  // Format time for messages
  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Show/hide loading indicator
  showLoading(show) {
    if (show) {
      this.elements.loadingIndicator.classList.add('show');
    } else {
      this.elements.loadingIndicator.classList.remove('show');
    }
  }

  // Scroll chat to bottom
  scrollToBottom() {
    const chatContainer = this.elements.chatMessages.parentElement;
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.chatbotApp = new ChatbotApp();
});
