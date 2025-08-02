// Speech Recognition and Synthesis Manager
class SpeechManager {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.voiceInitialized = false;
    
    this.initializeSpeechRecognition();
    this.initializeVoices();
    
    // Event callbacks
    this.onSpeechResult = null;
    this.onSpeechError = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
  }

  // Initialize speech recognition
  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    // Configure recognition settings
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Set up event listeners
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onSpeechStart) this.onSpeechStart();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onSpeechEnd) this.onSpeechEnd();
    };

    this.recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      if (this.onSpeechResult) this.onSpeechResult(result);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (this.onSpeechError) this.onSpeechError(event.error);
    };

    this.recognition.onnomatch = () => {
      if (this.onSpeechError) this.onSpeechError('No speech was recognized');
    };
  }

  // Initialize voices for text-to-speech
  initializeVoices() {
    const loadVoices = () => {
      const voices = this.synthesis.getVoices();
      
      // Find British female voice
      this.selectedVoice = voices.find(voice => 
        voice.lang.includes('en-GB') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => 
        voice.lang.includes('en-GB')
      ) || voices.find(voice => 
        voice.lang.includes('en-US') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => 
        voice.lang.includes('en')
      ) || voices[0];

      this.voiceInitialized = true;
    };

    // Load voices when available
    if (this.synthesis.getVoices().length > 0) {
      loadVoices();
    } else {
      this.synthesis.onvoiceschanged = loadVoices;
    }
  }

  // Start speech recognition
  startListening() {
    if (!this.recognition) {
      if (this.onSpeechError) this.onSpeechError('Speech recognition not available');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      if (this.onSpeechError) this.onSpeechError('Failed to start speech recognition');
      return false;
    }
  }

  // Stop speech recognition
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // Speak text using text-to-speech
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not available'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Configure utterance
      utterance.voice = this.selectedVoice;
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 0.8;

      // Set up event listeners
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      // Start speaking
      this.synthesis.speak(utterance);
    });
  }

  // Stop current speech
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  // Check if speech recognition is available
  isSpeechRecognitionAvailable() {
    return this.recognition !== null;
  }

  // Check if text-to-speech is available
  isSpeechSynthesisAvailable() {
    return this.synthesis !== null;
  }

  // Get available voices
  getAvailableVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  // Set voice by name or language
  setVoice(voiceName) {
    const voices = this.getAvailableVoices();
    const voice = voices.find(v => 
      v.name === voiceName || 
      v.lang === voiceName ||
      v.name.toLowerCase().includes(voiceName.toLowerCase())
    );
    
    if (voice) {
      this.selectedVoice = voice;
      return true;
    }
    return false;
  }
}

// Export for use in other files
window.SpeechManager = SpeechManager;