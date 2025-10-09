// YAMNet Audio Classification Module
class YAMNetClassifier {
  constructor() {
    this.model = null;
    this.isLoading = false;
    this.isReady = false;
    this.classificationInterval = null;
    this.lastClassification = null;
    this.audioBuffer = null;
    this.sampleRate = 16000; // YAMNet expects 16kHz
    this.clipDuration = 0.975; // YAMNet expects ~1 second clips
    this.clipSamples = Math.floor(this.sampleRate * this.clipDuration);
    
    // Mood mapping from YAMNet classes to mood categories
    this.moodMapping = {
      // High Energy/Intense
      'Music': { mood: 'energetic', intensity: 0.8, color: '#ff6b6b' },
      'Rock music': { mood: 'intense', intensity: 0.9, color: '#ff4757' },
      'Heavy metal': { mood: 'aggressive', intensity: 1.0, color: '#ff3838' },
      'Electronic music': { mood: 'electronic', intensity: 0.8, color: '#ff9ff3' },
      'Dance music': { mood: 'dance', intensity: 0.9, color: '#ff6348' },
      'Pop music': { mood: 'upbeat', intensity: 0.7, color: '#ffa502' },
      'Jazz': { mood: 'sophisticated', intensity: 0.6, color: '#ff7675' },
      'Blues': { mood: 'melancholic', intensity: 0.5, color: '#74b9ff' },
      'Classical music': { mood: 'elegant', intensity: 0.4, color: '#a29bfe' },
      'Folk music': { mood: 'organic', intensity: 0.5, color: '#00b894' },
      'Country': { mood: 'rustic', intensity: 0.6, color: '#fdcb6e' },
      'R&B': { mood: 'smooth', intensity: 0.7, color: '#e17055' },
      'Hip hop music': { mood: 'urban', intensity: 0.8, color: '#636e72' },
      'Reggae': { mood: 'laid-back', intensity: 0.6, color: '#00cec9' },
      'Ska': { mood: 'bouncy', intensity: 0.7, color: '#6c5ce7' },
      
      // Ambient/Calm
      'Ambient music': { mood: 'ambient', intensity: 0.2, color: '#81ecec' },
      'New-age music': { mood: 'peaceful', intensity: 0.1, color: '#a8e6cf' },
      'Meditation music': { mood: 'meditative', intensity: 0.1, color: '#dda0dd' },
      'Nature sounds': { mood: 'natural', intensity: 0.3, color: '#98fb98' },
      
      // Speech/Voice
      'Speech': { mood: 'conversational', intensity: 0.4, color: '#ffeaa7' },
      'Male speech': { mood: 'masculine', intensity: 0.5, color: '#fab1a0' },
      'Female speech': { mood: 'feminine', intensity: 0.5, color: '#fd79a8' },
      'Child speech': { mood: 'playful', intensity: 0.6, color: '#fdcb6e' },
      'Conversation': { mood: 'social', intensity: 0.4, color: '#e17055' },
      'Narration': { mood: 'narrative', intensity: 0.3, color: '#a29bfe' },
      'Whispering': { mood: 'intimate', intensity: 0.2, color: '#fd79a8' },
      
      // Silence and noise
      'Silence': { mood: 'silent', intensity: 0.0, color: '#636e72' },
      'White noise': { mood: 'static', intensity: 0.3, color: '#b2bec3' },
      'Pink noise': { mood: 'ambient', intensity: 0.2, color: '#ddd6fe' },
      'Brown noise': { mood: 'deep', intensity: 0.1, color: '#8b5a2b' },
      
      // Default fallback
      'default': { mood: 'neutral', intensity: 0.5, color: '#74b9ff' }
    };
    
    this.init();
  }

  async init() {
    try {
      this.updateStatus('Loading YAMNet model...');
      this.isLoading = true;
      
      // Load YAMNet model from Kaggle
      this.model = await tf.loadGraphModel('https://www.kaggle.com/models/google/yamnet/TfJs/tfjs/1', { fromTFHub: true });
      this.isReady = true;
      this.isLoading = false;
      
      this.updateStatus('YAMNet ready');
      console.log('YAMNet model loaded successfully');
      console.log('Model inputs:', this.model.inputs);
      console.log('Model outputs:', this.model.outputs);
    } catch (error) {
      console.error('Failed to load YAMNet model:', error);
      this.updateStatus('YAMNet failed to load - using fallback');
      this.isLoading = false;
      
      // Create a fallback model for demonstration
      this.model = this.createFallbackModel();
      this.isReady = true;
    }
  }

  // Create a fallback model when YAMNet isn't available
  createFallbackModel() {
    return {
      predict: async (input) => {
        // Mock prediction that returns random but realistic audio classification scores
        // Input is 1D tensor, output should be 2D [frames, classes]
        const numFrames = 97; // YAMNet typically produces ~97 frames for 0.975s audio
        const numClasses = 521; // YAMNet has 521 classes
        
        // Generate mock scores with some structure
        const scores = new Float32Array(numFrames * numClasses);
        for (let i = 0; i < numFrames; i++) {
          // Make some classes more likely based on common audio patterns
          const musicClasses = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Mock music class indices
          const speechClasses = [30, 31, 32, 33, 34, 35, 36]; // Mock speech class indices
          const ambientClasses = [20, 21, 22, 23, 24, 25, 26, 27, 28]; // Mock ambient class indices
          
          // Randomly choose a category
          const category = Math.random();
          let targetClasses;
          if (category < 0.4) targetClasses = musicClasses;
          else if (category < 0.7) targetClasses = speechClasses;
          else targetClasses = ambientClasses;
          
          // Generate scores
          for (let j = 0; j < numClasses; j++) {
            const baseScore = Math.random() * 0.1; // Low base score
            const isTargetClass = targetClasses.includes(j);
            const targetScore = isTargetClass ? Math.random() * 0.8 + 0.2 : 0;
            scores[i * numClasses + j] = Math.max(baseScore, targetScore);
          }
        }
        
        return [
          {
            data: () => Promise.resolve(scores),
            mean: (axis) => {
              // Mock mean aggregation across frames
              const meanScores = new Float32Array(numClasses);
              for (let j = 0; j < numClasses; j++) {
                let sum = 0;
                for (let i = 0; i < numFrames; i++) {
                  sum += scores[i * numClasses + j];
                }
                meanScores[j] = sum / numFrames;
              }
              return {
                data: () => Promise.resolve(meanScores),
                dispose: () => {}
              };
            },
            dispose: () => {}
          },
          { dispose: () => {} }, // embeddings
          { dispose: () => {} }  // spectrogram
        ];
      }
    };
  }

  updateStatus(message) {
    const statusElement = document.getElementById('moodStatusText');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  updateMoodDisplay(mood, confidence) {
    const moodElement = document.getElementById('currentMood');
    const confidenceElement = document.getElementById('moodConfidence');
    
    if (moodElement) moodElement.textContent = mood;
    if (confidenceElement) confidenceElement.textContent = `${(confidence * 100).toFixed(1)}%`;
  }

  // Map YAMNet class index to mood based on YAMNet class map
    getMoodFromClassIndex(classIndex, confidence) {
    // YAMNet classes are divided roughly:
    if (classIndex <= 68) return this.moodMapping['Speech'] || this.moodMapping['default'];
    if (classIndex <= 228) return this.moodMapping['Music'] || this.moodMapping['default'];
    if (classIndex <= 451) return this.moodMapping['Environmental'] || this.moodMapping['default'];
    if (classIndex <= 521) return this.moodMapping['Silence'] || this.moodMapping['default'];
    return this.moodMapping['default'];
  }
  

  // Convert audio buffer to YAMNet input format
  preprocessAudio(audioBuffer) {
    if (!audioBuffer || audioBuffer.length === 0) return null;
  
    // 1️⃣ Mix stereo to mono
    let monoData;
    if (audioBuffer.numberOfChannels > 1) {
      const left = audioBuffer.getChannelData(0);
      const right = audioBuffer.getChannelData(1);
      monoData = new Float32Array(left.length);
      for (let i = 0; i < left.length; i++) {
        monoData[i] = 0.5 * (left[i] + right[i]);
      }
    } else {
      monoData = audioBuffer.getChannelData(0);
    }
  
    // 2️⃣ Resample to 16 kHz (YAMNet’s native rate)
    let resampled = monoData;
    if (audioBuffer.sampleRate !== this.sampleRate) {
      resampled = this.resample(monoData, audioBuffer.sampleRate, this.sampleRate);
    }
  
   // 3️⃣ Normalize to [-1, 1]
let maxVal = 0;
for (let i = 0; i < resampled.length; i++) {
  const absVal = Math.abs(resampled[i]);
  if (absVal > maxVal) maxVal = absVal;
}
if (maxVal < 1e-4) maxVal = 1.0; // avoid division by near-zero (silence)

const normalized = new Float32Array(resampled.length);
for (let i = 0; i < resampled.length; i++) {
  normalized[i] = resampled[i] / maxVal;
}

// 4️⃣ Clip or pad to the correct length
let finalBuffer;
if (normalized.length >= this.clipSamples) {
  finalBuffer = normalized.slice(-this.clipSamples);
} else {
  finalBuffer = new Float32Array(this.clipSamples);
  finalBuffer.set(normalized, this.clipSamples - normalized.length);
}
console.log('Tensor stats:', {
    min: finalBuffer.reduce((a,b)=>Math.min(a,b),1),
    max: finalBuffer.reduce((a,b)=>Math.max(a,b),-1),
    mean: finalBuffer.reduce((a,b)=>a+b,0)/finalBuffer.length
  });
  

// 5️⃣ Convert to Tensor
return tf.tensor1d(finalBuffer.map(v => v * 100));

  }
  
  // Simple linear interpolation resampling
  resample(inputBuffer, inputSampleRate, outputSampleRate) {
    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.floor(inputBuffer.length / ratio);
    const outputBuffer = new Float32Array(outputLength);
  
    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio;
      const index = Math.floor(inputIndex);
      const fraction = inputIndex - index;
  
      if (index + 1 < inputBuffer.length) {
        outputBuffer[i] =
          inputBuffer[index] * (1 - fraction) + inputBuffer[index + 1] * fraction;
      } else {
        outputBuffer[i] = inputBuffer[index] || 0;
      }
    }
  
    return outputBuffer;
  }
  

  // Classify audio and return mood information
  async classifyAudio(audioBuffer) {
    if (!this.isReady || !this.model) {
      return { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
    }

    try {
      const inputTensor = this.preprocessAudio(audioBuffer);
      if (!inputTensor) {
        return { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
      }

      // Run inference - YAMNet returns [scores, embeddings, spectrogram]
      // 1️⃣ Expand tensor to [1, num_samples]
    // Ensure tensor is 1D float32 and length == clipSamples
        const input = inputTensor.reshape([this.clipSamples]);

        // Some YAMNet models require a named input
        const [scores, embeddings, spectrogram] = this.model.predict(input);
      
      // Debug logging
      console.log('Input tensor shape:', inputTensor.shape);
      console.log('Scores shape:', scores.shape);
      console.log('Embeddings shape:', embeddings.shape);
      console.log('Spectrogram shape:', spectrogram.shape);
      
      // Get mean-aggregated scores across frames (as per YAMNet documentation)
      // scores shape is [N, 521] where N is number of frames
      const meanScores = scores.mean(0);
      const scoresData = await meanScores.data();
      
      // Clean up tensors
      inputTensor.dispose();
      scores.dispose();
      embeddings.dispose();
      spectrogram.dispose();
      meanScores.dispose();

      // Find the class with highest confidence
      let maxScore = 0;
      let maxIndex = 0;
      for (let i = 0; i < scoresData.length; i++) {
        if (scoresData[i] > maxScore) {
          maxScore = scoresData[i];
          maxIndex = i;
        }
      }

      // Debug logging
      console.log(`YAMNet classification: class ${maxIndex}, confidence: ${maxScore.toFixed(3)}`);
      console.log('Scores data:', scores);
      // Map to mood based on YAMNet class index
      const confidence = maxScore;
      const moodInfo = this.getMoodFromClassIndex(maxIndex, confidence);
      
      return {
        mood: moodInfo.mood,
        intensity: moodInfo.intensity * confidence,
        confidence: confidence,
        color: moodInfo.color,
        classIndex: maxIndex
      };
    } catch (error) {
      console.error('Classification error:', error);
      return { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
    }
  }

  // Start continuous classification
  startClassification(audioContext, analyser) {
    if (!this.isReady) return;
    
    const interval = parseInt(document.getElementById('moodInterval')?.value || '1000');
    
    this.classificationInterval = setInterval(async () => {
      if (!document.getElementById('moodEnabled')?.checked) return;
      
      try {
        // Get audio data from analyser
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        
        // Convert to Float32Array for processing
        const floatArray = new Float32Array(dataArray.length);
        for (let i = 0; i < dataArray.length; i++) {
          floatArray[i] = (dataArray[i] - 128) / 128;
        }
        
        // Create AudioBuffer-like object
        const audioBuffer = {
          getChannelData: () => floatArray,
          length: floatArray.length,
          sampleRate: audioContext.sampleRate,
          numberOfChannels: 1
        };
        
        const result = await this.classifyAudio(audioBuffer);
        this.lastClassification = result;
        this.updateMoodDisplay(result.mood, result.confidence);
        
        // Trigger mood change event
        window.dispatchEvent(new CustomEvent('moodChanged', { detail: result }));
        
      } catch (error) {
        console.error('Classification error:', error);
      }
    }, interval);
  }

  // Stop classification
  stopClassification() {
    if (this.classificationInterval) {
      clearInterval(this.classificationInterval);
      this.classificationInterval = null;
    }
  }

  // Get current mood classification
  getCurrentMood() {
    return this.lastClassification || { mood: 'neutral', intensity: 0.5, confidence: 0, color: '#74b9ff' };
  }
}

// Global YAMNet instance
window.yamnetClassifier = new YAMNetClassifier();
