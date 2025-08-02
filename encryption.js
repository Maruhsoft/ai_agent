// Advanced encryption utility for contact information
class ContactEncryption {
  constructor() {
    // Multiple layers of obfuscation
    this.keys = [0x47, 0x23, 0x91, 0x55, 0x77, 0x33, 0x88, 0x44];
    this.shift = 13;
    this.multiplier = 7;
    this.modulo = 256;
  }

  // Layer 1: Character shifting with Caesar cipher variant
  shiftChars(text, direction = 1) {
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(code + (this.shift * direction));
    }).join('');
  }

  // Layer 2: XOR encryption with rotating keys
  xorEncrypt(text, direction = 1) {
    return text.split('').map((char, index) => {
      const keyIndex = index % this.keys.length;
      const key = this.keys[keyIndex];
      const code = char.charCodeAt(0);
      return String.fromCharCode(code ^ key);
    }).join('');
  }

  // Layer 3: Mathematical transformation
  mathTransform(text, direction = 1) {
    return text.split('').map(char => {
      const code = char.charCodeAt(0);
      if (direction === 1) {
        return String.fromCharCode((code * this.multiplier) % this.modulo);
      } else {
        // Find modular multiplicative inverse
        for (let i = 1; i < this.modulo; i++) {
          if ((this.multiplier * i) % this.modulo === 1) {
            return String.fromCharCode((code * i) % this.modulo);
          }
        }
        return char;
      }
    }).join('');
  }

  // Layer 4: Base64 with custom padding
  base64Transform(text, direction = 1) {
    if (direction === 1) {
      return btoa(text).replace(/=/g, '_').split('').reverse().join('');
    } else {
      return atob(text.split('').reverse().join('').replace(/_/g, '='));
    }
  }

  // Layer 5: Hexadecimal representation with scrambling
  hexScramble(text, direction = 1) {
    if (direction === 1) {
      const hex = text.split('').map(char => 
        char.charCodeAt(0).toString(16).padStart(2, '0')
      ).join('');
      // Scramble pairs
      const pairs = hex.match(/.{2}/g) || [];
      return pairs.reverse().join('');
    } else {
      const pairs = text.match(/.{2}/g) || [];
      const unscrambled = pairs.reverse().join('');
      return unscrambled.match(/.{2}/g).map(hex => 
        String.fromCharCode(parseInt(hex, 16))
      ).join('');
    }
  }

  // Complete encryption pipeline
  encrypt(text) {
    let result = text;
    result = this.shiftChars(result, 1);
    result = this.xorEncrypt(result, 1);
    result = this.mathTransform(result, 1);
    result = this.base64Transform(result, 1);
    result = this.hexScramble(result, 1);
    return result;
  }

  // Complete decryption pipeline (reverse order)
  decrypt(encrypted) {
    let result = encrypted;
    result = this.hexScramble(result, -1);
    result = this.base64Transform(result, -1);
    result = this.mathTransform(result, -1);
    result = this.xorEncrypt(result, -1);
    result = this.shiftChars(result, -1);
    return result;
  }

  // Additional obfuscation: split into chunks with noise
  obfuscate(encrypted) {
    const chunks = encrypted.match(/.{1,4}/g) || [];
    const noise = ['zx', 'qw', 'er', 'ty', 'ui', 'op', 'as', 'df'];
    return chunks.map((chunk, index) => {
      const noiseIndex = index % noise.length;
      return chunk + noise[noiseIndex];
    }).join('');
  }

  // Remove noise and reconstruct
  deobfuscate(obfuscated) {
    const noise = ['zx', 'qw', 'er', 'ty', 'ui', 'op', 'as', 'df'];
    let result = obfuscated;
    noise.forEach(n => {
      result = result.replace(new RegExp(n, 'g'), '');
    });
    return result;
  }

  // Master encryption method
  masterEncrypt(text) {
    const encrypted = this.encrypt(text);
    return this.obfuscate(encrypted);
  }

  // Master decryption method
  masterDecrypt(obfuscated) {
    const encrypted = this.deobfuscate(obfuscated);
    return this.decrypt(encrypted);
  }
}

// Export for use in other files
window.ContactEncryption = ContactEncryption;