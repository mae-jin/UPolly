import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Sentence {
  text: string;
  start: number;
  end: number;
}

type RepeatMode = 'off' | 'sentence' | 'all';

interface AppState {
  // Form & Upload
  showForm: boolean;
  selectedFile: File | null;
  uploadMessage: string;
  
  // Audio & Sentences
  sentences: Sentence[];
  audioFilename: string;
  audioUrl: string;
  
  // Playback
  isPlaying: boolean;
  currentSentenceIndex: number;
  currentTime: number;
  playbackSpeed: number;
  
  // Repeat System
  repeatMode: RepeatMode;
  repeatCount: number;
  currentRepeat: number;
  isRepeating: boolean;
  repeatSentenceIndex: number;
  
  // Mobile Detection
  isMobile: boolean;
  showMobileHelp: boolean;
  isUploading: boolean;
}

// ============================================================================
// MOBILE DETECTION & HELPER FUNCTIONS
// ============================================================================

const detectMobile = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
    'windows phone', 'opera mini', 'iemobile', 'mobile', 'tablet'
  ];
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
};

const detectiOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isHTTPS = (): boolean => {
  return window.location.protocol === 'https:';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function App() {
  // ------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ------------------------------------------------------------------------
  
  const [state, setState] = useState<AppState>({
    // Form & Upload
    showForm: false,
    selectedFile: null,
    uploadMessage: '',
    
    // Audio & Sentences
    sentences: [],
    audioFilename: '',
    audioUrl: '',
    
    // Playback
    isPlaying: false,
    currentSentenceIndex: -1,
    currentTime: 0,
    playbackSpeed: 1,
    
    // Repeat System
    repeatMode: 'off',
    repeatCount: 3,
    currentRepeat: 0,
    isRepeating: false,
    repeatSentenceIndex: -1,
    
    // Mobile Detection
    isMobile: false,
    showMobileHelp: false,
    isUploading: false,
  });

  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize mobile detection
  useEffect(() => {
    const mobile = detectMobile();
    setState(prev => ({ ...prev, isMobile: mobile }));
    
    if (mobile) {
      console.log('📱 Mobile device detected:', navigator.userAgent);
      console.log('🔐 HTTPS:', isHTTPS());
      console.log('🍎 iOS:', detectiOS());
    }
  }, []);

  // ------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ------------------------------------------------------------------------

  const updateState = (updates: Partial<AppState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  const resetAudioState = () => {
    updateState({
      currentSentenceIndex: -1,
      currentTime: 0,
      currentRepeat: 0,
      isRepeating: false,
      repeatSentenceIndex: -1,
    });
  };

  const resetAllState = () => {
    updateState({
      showForm: true,
      uploadMessage: '',
      sentences: [],
      audioFilename: '',
      audioUrl: '',
      selectedFile: null,
      isPlaying: false,
      showMobileHelp: false,
      isUploading: false,
      ...{
        currentSentenceIndex: -1,
        currentTime: 0,
        currentRepeat: 0,
        isRepeating: false,
        repeatSentenceIndex: -1,
      }
    });
  };

  // ------------------------------------------------------------------------
  // MOBILE-ENHANCED FILE UPLOAD HANDLERS
  // ------------------------------------------------------------------------

  const handleNewAudioClick = () => {
    resetAllState();
  };

  const validateFile = (file: File): string | null => {
    console.log('📁 File validation:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Check file size (mobile limit: 100MB)
    const maxSize = state.isMobile ? 100 * 1024 * 1024 : 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File too large! Maximum size: ${state.isMobile ? '100MB' : '500MB'}`;
    }

    // Check file type
    const audioTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 
      'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm',
      'audio/mp4', 'audio/x-m4a'
    ];
    
    const isValidAudio = audioTypes.includes(file.type) || 
                        file.type.startsWith('audio/') ||
                        /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(file.name);
    
    if (!isValidAudio) {
      return 'Please select a valid audio file (MP3, WAV, M4A, AAC, OGG, FLAC)';
    }

    return null; // Valid file
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📱 File input change triggered');
    
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('❌ No file selected');
      updateState({ 
        selectedFile: null,
        uploadMessage: state.isMobile ? 'No file selected. Please try again.' : ''
      });
      return;
    }

    console.log('✅ File selected successfully:', file.name);

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      updateState({ 
        selectedFile: null,
        uploadMessage: `❌ ${validationError}`,
        showMobileHelp: state.isMobile
      });
      return;
    }

    updateState({ 
      selectedFile: file,
      uploadMessage: `✅ Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      showMobileHelp: false
    });
  };

  // 🚨 MOBILE-SPECIFIC FILE PICKER
  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      // Clear previous selection to ensure change event fires
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // 🚨 COMPLETELY REWRITTEN MOBILE-COMPATIBLE RESPONSE PROCESSING
  const processUploadResponseMobile = async (response: Response, originalFile: File) => {
    console.log('📱 Processing mobile upload response');
    
    try {
      // 🚨 FOR MOBILE: Try to read the entire response at once instead of streaming
      const responseText = await response.text();
      console.log('📱 Full response received:', responseText.length, 'characters');
      
      if (!responseText.trim()) {
        throw new Error('Empty response from server');
      }
      
      // Split by lines and process each JSON object
      const lines = responseText.split('\n').filter(line => line.trim());
      let finalData = null;
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          console.log('📱 Parsed data:', data);
          
          // Update progress
          if (data.progress) {
            updateState({ uploadMessage: data.progress });
          }
          
          // Store final result
          if (data.sentences && Array.isArray(data.sentences)) {
            finalData = data;
          }
          
        } catch (parseError) {
          console.log('📱 Skipping invalid JSON line:', line.substring(0, 100));
        }
      }
      
      // Process final sentences data
      if (finalData && finalData.sentences) {
        const convertedSentences = finalData.sentences
          .filter((s: any) => 
            s && 
            typeof s.text === 'string' && 
            typeof s.start_time === 'number' && 
            typeof s.end_time === 'number'
          )
          .map((s: any) => ({
            text: s.text,
            start: s.start_time,
            end: s.end_time
          }));
        
        if (convertedSentences.length > 0) {
          console.log('✅ Mobile processing successful:', convertedSentences.length, 'sentences');
          
          const audioBlob = new Blob([originalFile], { type: originalFile.type });
          const url = URL.createObjectURL(audioBlob);
          
          updateState({
            sentences: convertedSentences,
            audioFilename: finalData.original_filename || originalFile.name,
            audioUrl: url,
            uploadMessage: `✅ Processing complete! Found ${convertedSentences.length} sentences.`,
            showForm: false,
            selectedFile: null,
            isUploading: false,
          });
          
          resetAudioState();
          return;
        }
      }
      
      throw new Error('No valid sentence data found in response');
      
    } catch (error) {
      console.error('❌ Mobile response processing error:', error);
      throw error;
    }
  };

  // 🚨 DESKTOP STREAMING RESPONSE PROCESSING (original method)
  const processUploadResponseDesktop = async (response: Response, originalFile: File) => {
    console.log('💻 Processing desktop upload response with streaming');
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader');

    let receivedText = '';
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      receivedText += new TextDecoder().decode(value);
      const lines = receivedText.split('\n');
      
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
          const data = JSON.parse(line);
          
          // Update progress
          if (data.progress) {
            updateState({ uploadMessage: data.progress });
          }
          
          // Process sentences
          if (data.sentences && Array.isArray(data.sentences)) {
            const convertedSentences = data.sentences
              .filter((s: any) => 
                s && 
                typeof s.text === 'string' && 
                typeof s.start_time === 'number' && 
                typeof s.end_time === 'number'
              )
              .map((s: any) => ({
                text: s.text,
                start: s.start_time,
                end: s.end_time
              }));
            
            if (convertedSentences.length > 0) {
              console.log('✅ Desktop processing successful:', convertedSentences.length, 'sentences');
              
              const audioBlob = new Blob([originalFile], { type: originalFile.type });
              const url = URL.createObjectURL(audioBlob);
              
              updateState({
                sentences: convertedSentences,
                audioFilename: data.original_filename || originalFile.name,
                audioUrl: url,
                uploadMessage: `✅ Processing complete! Found ${convertedSentences.length} sentences.`,
                showForm: false,
                selectedFile: null,
                isUploading: false,
              });
              
              resetAudioState();
              return;
            }
          }
        } catch (parseError) {
          // Expected during streaming - ignore parse errors
        }
      }
      
      receivedText = lines[lines.length - 1];
    }
    
    throw new Error('No sentence data received from server');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.selectedFile) {
      updateState({ 
        uploadMessage: 'Please select a file first.',
        showMobileHelp: state.isMobile
      });
      return;
    }

    if (state.isUploading) {
      console.log('🚫 Upload already in progress, ignoring submit');
      return;
    }

    const formData = new FormData();
    formData.append('file', state.selectedFile);
    
    updateState({
      uploadMessage: '⏳ Uploading and processing... Please wait.',
      sentences: [],
      isUploading: true,
    });
    resetAudioState();

    try {
      console.log(`📤 Starting upload: ${state.selectedFile.name}`);
      console.log(`📱 Mobile device: ${state.isMobile}`);
      
      const response = await fetch('http://146.190.173.153:8000/api/upload-audio', {
        method: 'POST',
        body: formData,
        // 🚨 Mobile-specific headers
        headers: {
          'Accept': 'application/json, text/plain, */*',
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
      });

      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      console.log(`📊 Response headers:`, Array.from(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      // 🚨 CHOOSE PROCESSING METHOD BASED ON DEVICE
      if (state.isMobile) {
        console.log('📱 Using mobile-compatible response processing');
        await processUploadResponseMobile(response, state.selectedFile);
      } else {
        console.log('💻 Using desktop streaming response processing');
        await processUploadResponseDesktop(response, state.selectedFile);
      }
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      let mobileSpecificMessage = '';
      if (state.isMobile) {
        if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
          mobileSpecificMessage = ' This might be due to mobile network restrictions. Try refreshing the page and uploading again.';
        } else if (errorMessage.includes('timeout')) {
          mobileSpecificMessage = ' Mobile upload timed out. Try a smaller file or better network connection.';
        }
      }
      
      updateState({ 
        uploadMessage: `❌ Upload failed: ${errorMessage}${mobileSpecificMessage}`,
        showForm: false,
        selectedFile: null,
        showMobileHelp: state.isMobile,
        isUploading: false,
      });
    }
  };

  // ------------------------------------------------------------------------
  // AUDIO CONTROL HANDLERS
  // ------------------------------------------------------------------------

  const jumpToSentence = (index: number) => {
    if (audioRef.current && state.sentences[index]) {
      const time = state.sentences[index].start;
      audioRef.current.currentTime = time;
      
      updateState({
        currentSentenceIndex: index,
        currentRepeat: 0,
        isRepeating: false,
        repeatSentenceIndex: -1,
      });
      
      console.log(`🎯 JUMPED TO SENTENCE ${index + 1}`);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (state.isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const goToPrevSentence = () => {
    if (state.currentSentenceIndex > 0) {
      jumpToSentence(state.currentSentenceIndex - 1);
    } else if (state.sentences.length > 0) {
      jumpToSentence(0);
    }
  };

  const goToNextSentence = () => {
    if (state.currentSentenceIndex < state.sentences.length - 1) {
      jumpToSentence(state.currentSentenceIndex + 1);
    }
  };

  const changeSpeed = (speed: number) => {
    updateState({ playbackSpeed: speed });
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleRepeatModeChange = (mode: RepeatMode) => {
    updateState({ 
      repeatMode: mode,
      currentRepeat: 0,
      isRepeating: false,
      repeatSentenceIndex: -1,
    });
  };

  const handleRepeatCountChange = (count: number) => {
    updateState({ repeatCount: count });
  };

  // ------------------------------------------------------------------------
  // AUDIO EVENT HANDLERS & EFFECTS
  // ------------------------------------------------------------------------

  const updateCurrentSentence = () => {
    if (!audioRef.current) return;
    
    const time = audioRef.current.currentTime;
    updateState({ currentTime: time });
    
    // Find current sentence based on audio time
    let foundIndex = -1;
    for (let i = 0; i < state.sentences.length; i++) {
      const sentence = state.sentences[i];
      if (time >= sentence.start && time <= sentence.end) {
        foundIndex = i;
        break;
      }
    }
    
    // Update highlight
    updateState({ currentSentenceIndex: foundIndex });
  };

  const handleRepeatLogic = () => {
    if (!audioRef.current || state.repeatMode !== 'sentence' || state.currentSentenceIndex < 0) return;
    
    const time = audioRef.current.currentTime;
    const currentSentence = state.sentences[state.currentSentenceIndex];
    
    // Check if we're past the sentence end
    if (time >= currentSentence.end - 0.1) {
      console.log(`⏭️ SENTENCE ${state.currentSentenceIndex + 1} ENDED | isRepeating: ${state.isRepeating} | repeat: ${state.currentRepeat}/${state.repeatCount}`);
      
      // First time hitting the end
      if (!state.isRepeating) {
        updateState({
          isRepeating: true,
          repeatSentenceIndex: state.currentSentenceIndex,
          currentRepeat: 1,
        });
        
        if (state.currentRepeat < state.repeatCount - 1) {
          console.log(`🔄 STARTING REPEAT for sentence ${state.currentSentenceIndex + 1}`);
          setTimeout(() => {
            if (audioRef.current) audioRef.current.currentTime = currentSentence.start;
          }, 100);
          return;
        }
      }
      
      // Already repeating
      if (state.isRepeating && state.repeatSentenceIndex === state.currentSentenceIndex) {
        if (state.currentRepeat < state.repeatCount) {
          console.log(`🔄 CONTINUING REPEAT ${state.currentRepeat}/${state.repeatCount} for sentence ${state.currentSentenceIndex + 1}`);
          updateState({ currentRepeat: state.currentRepeat + 1 });
          setTimeout(() => {
            if (audioRef.current) audioRef.current.currentTime = currentSentence.start;
          }, 100);
          return;
        } else {
          // Done repeating
          console.log(`✅ FINISHED REPEATING sentence ${state.currentSentenceIndex + 1}`);
          updateState({
            isRepeating: false,
            repeatSentenceIndex: -1,
            currentRepeat: 0,
          });
          
          // Move to next sentence
          if (state.currentSentenceIndex < state.sentences.length - 1) {
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.currentTime = state.sentences[state.currentSentenceIndex + 1].start;
              }
            }, 200);
          } else {
            audioRef.current.pause();
          }
        }
      }
    }
    
    // Reset repeat state when moving to a different sentence naturally
    if (state.currentSentenceIndex >= 0 && 
        state.repeatSentenceIndex !== state.currentSentenceIndex && 
        state.isRepeating) {
      updateState({
        isRepeating: false,
        repeatSentenceIndex: -1,
        currentRepeat: 0,
      });
    }
  };

  // Main audio effect
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || state.sentences.length === 0) return;

    let intervalId: NodeJS.Timeout;

    const handleTimeUpdate = () => {
      updateCurrentSentence();
      handleRepeatLogic();
    };

    const handlePlay = () => {
      updateState({ isPlaying: true });
      audio.playbackRate = state.playbackSpeed;
      intervalId = setInterval(updateCurrentSentence, 100);
      console.log(`▶️ PLAY STARTED`);
    };
    
    const handlePause = () => {
      updateState({ isPlaying: false });
      if (intervalId) clearInterval(intervalId);
      console.log(`⏸️ PAUSED`);
    };

    const handleEnded = () => {
      updateState({
        isPlaying: false,
        currentSentenceIndex: -1,
        currentRepeat: 0,
        isRepeating: false,
        repeatSentenceIndex: -1,
      });
      if (intervalId) clearInterval(intervalId);
      console.log(`🏁 AUDIO ENDED`);
      
      if (state.repeatMode === 'all') {
        audio.currentTime = 0;
        audio.play();
      }
    };

    // Event listeners
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    if (!audio.paused) {
      handlePlay();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [state.sentences, state.repeatMode, state.repeatCount, state.currentRepeat, 
      state.currentSentenceIndex, state.isRepeating, state.repeatSentenceIndex, state.playbackSpeed]);

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        goToPrevSentence();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        goToNextSentence();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.isPlaying, state.currentSentenceIndex]);

  // ------------------------------------------------------------------------
  // MOBILE-ENHANCED RENDER COMPONENTS
  // ------------------------------------------------------------------------

  const renderMobileHelp = () => {
    if (!state.isMobile || !state.showMobileHelp) return null;

    return (
      <div style={{
        padding: '15px',
        margin: '15px 0',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📱 Mobile Upload Tips:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li>Make sure your file is under 100MB</li>
          <li>Supported formats: MP3, WAV, M4A, AAC, OGG</li>
          <li>Allow file access when prompted</li>
          <li>Wait for processing to complete (may take longer on mobile)</li>
          {!isHTTPS() && <li><strong>⚠️ For best results, use HTTPS connection</strong></li>}
          {detectiOS() && <li>On iOS: Use Safari or Chrome browser</li>}
          <li>If upload fails, try refreshing page and uploading again</li>
        </ul>
        <button 
          onClick={() => updateState({ showMobileHelp: false })} 
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#ffc107',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Got it! ✓
        </button>
      </div>
    );
  };

  const renderUploadForm = () => (
    <div>
      {renderMobileHelp()}
      
      <form className="upload-form" onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px',
            fontSize: state.isMobile ? '16px' : '14px'
          }}>
            Select audio file:
          </label>
          
          {/* 🚨 HIDDEN FILE INPUT for mobile */}
          <input 
            ref={fileInputRef}
            type="file" 
            accept="audio/*,audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/flac,.mp3,.wav,.m4a,.aac,.ogg,.flac"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={state.isUploading}
          />
          
          {/* 🚨 MOBILE-FRIENDLY FILE PICKER BUTTON */}
          <button
            type="button"
            onClick={triggerFilePicker}
            disabled={state.isUploading}
            style={{
              width: '100%',
              padding: state.isMobile ? '15px' : '12px',
              fontSize: state.isMobile ? '18px' : '16px',
              backgroundColor: state.selectedFile ? '#28a745' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: state.isUploading ? 'not-allowed' : 'pointer',
              marginBottom: '10px',
              minHeight: state.isMobile ? '50px' : 'auto',
              opacity: state.isUploading ? 0.6 : 1
            }}
          >
            {state.isUploading ? '⏳ Processing...' :
             state.selectedFile ? 
              `✅ ${state.selectedFile.name}` : 
              `📁 ${state.isMobile ? 'Tap to Select Audio File' : 'Choose Audio File'}`
            }
          </button>
          
          {state.selectedFile && !state.isUploading && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '5px' 
            }}>
              Size: {(state.selectedFile.size / 1024 / 1024).toFixed(1)}MB | 
              Type: {state.selectedFile.type || 'Unknown'}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="upload-btn"
          disabled={!state.selectedFile || state.isUploading}
          style={{
            width: '100%',
            padding: state.isMobile ? '15px' : '12px',
            fontSize: state.isMobile ? '18px' : '16px',
            minHeight: state.isMobile ? '50px' : 'auto',
            opacity: (state.selectedFile && !state.isUploading) ? 1 : 0.6,
            cursor: (state.selectedFile && !state.isUploading) ? 'pointer' : 'not-allowed'
          }}
        >
          {state.isUploading ? '⏳ Processing...' : '🚀 Upload & Process'}
        </button>
      </form>
    </div>
  );

  const renderPlayerControls = () => (
    <div className="player-controls">
      <audio ref={audioRef} src={state.audioUrl} />
      
      <button 
        onClick={goToPrevSentence} 
        className="nav-btn" 
        disabled={state.currentSentenceIndex <= 0}
        style={{
          padding: state.isMobile ? '12px' : '8px',
          fontSize: state.isMobile ? '16px' : '14px'
        }}
      >
        ⏮️ Prev
      </button>
      
      <button 
        onClick={togglePlayPause} 
        className="play-pause-btn"
        style={{
          padding: state.isMobile ? '12px 20px' : '8px 16px',
          fontSize: state.isMobile ? '16px' : '14px'
        }}
      >
        {state.isPlaying ? '⏸️ Pause' : '▶️ Play'}
      </button>
      
      <button 
        onClick={goToNextSentence} 
        className="nav-btn" 
        disabled={state.currentSentenceIndex >= state.sentences.length - 1}
        style={{
          padding: state.isMobile ? '12px' : '8px',
          fontSize: state.isMobile ? '16px' : '14px'
        }}
      >
        Next ⏭️
      </button>
      
      <select 
        value={state.playbackSpeed} 
        onChange={(e) => changeSpeed(Number(e.target.value))} 
        className="speed-select"
        style={{
          padding: state.isMobile ? '10px' : '6px',
          fontSize: state.isMobile ? '16px' : '14px'
        }}
      >
        <option value={0.5}>0.5x</option>
        <option value={0.75}>0.75x</option>
        <option value={1}>1x</option>
        <option value={1.25}>1.25x</option>
        <option value={1.5}>1.5x</option>
      </select>
      
      <select 
        value={state.repeatMode} 
        onChange={(e) => handleRepeatModeChange(e.target.value as RepeatMode)} 
        className="repeat-select"
        style={{
          padding: state.isMobile ? '10px' : '6px',
          fontSize: state.isMobile ? '16px' : '14px'
        }}
      >
        <option value="off">No Repeat</option>
        <option value="sentence">Repeat Sentence</option>
        <option value="all">Repeat All</option>
      </select>
      
      {state.repeatMode === 'sentence' && (
        <select 
          value={state.repeatCount} 
          onChange={(e) => handleRepeatCountChange(Number(e.target.value))} 
          className="repeat-count"
          style={{
            padding: state.isMobile ? '10px' : '6px',
            fontSize: state.isMobile ? '16px' : '14px'
          }}
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={3}>3x</option>
          <option value={5}>5x</option>
          <option value={10}>10x</option>
        </select>
      )}
    </div>
  );

  const renderStatusPanel = () => (
    <div style={{
      padding: '20px',
      backgroundColor: state.isRepeating ? '#fff3cd' : '#f8f9fa',
      borderRadius: '10px',
      margin: '20px 0',
      fontFamily: 'Arial, sans-serif',
      fontSize: state.isMobile ? '16px' : '14px',
      border: state.isRepeating ? '3px solid #ffc107' : '2px solid #dee2e6'
    }}>
      <div style={{ fontSize: state.isMobile ? '18px' : '16px', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
        {state.isRepeating ? '🔄 REPEATING MODE ACTIVE 🔄' : '📊 STATUS PANEL'}
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: state.isMobile ? '1fr' : '1fr 1fr', 
        gap: '10px', 
        marginBottom: '15px' 
      }}>
        <div>🕐 <strong>Time:</strong> {state.currentTime.toFixed(1)}s</div>
        <div>🎯 <strong>Sentence:</strong> #{state.currentSentenceIndex + 1}</div>
        <div>▶️ <strong>Playing:</strong> {state.isPlaying ? 'YES' : 'NO'}</div>
        <div>🔄 <strong>Mode:</strong> {state.repeatMode.toUpperCase()}</div>
      </div>
      
      {state.isRepeating && (
        <div style={{ 
          backgroundColor: '#ffeaa7',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center',
          fontSize: state.isMobile ? '16px' : '14px',
          fontWeight: 'bold'
        }}>
          🔄 REPEATING SENTENCE #{state.repeatSentenceIndex + 1}: {state.currentRepeat}/{state.repeatCount}
        </div>
      )}
    </div>
  );

  const renderSentencesList = () => (
    <div className="sentences-list">
      {state.sentences.map((sentence, idx) => {
        const isActive = state.currentSentenceIndex === idx;
        const isCurrentlyRepeating = state.isRepeating && state.repeatSentenceIndex === idx;
        
        return (
          <div 
            key={idx} 
            className={`sentence-item ${isActive ? 'active' : ''}`}
            onClick={() => jumpToSentence(idx)}
            style={{
              backgroundColor: isCurrentlyRepeating ? '#fff3cd' : isActive ? '#e3f2fd' : '#ffffff',
              borderLeft: isCurrentlyRepeating ? '4px solid #ffc107' : isActive ? '4px solid #2196f3' : '4px solid transparent',
              border: isCurrentlyRepeating ? '2px solid #ffc107' : isActive ? '2px solid #2196f3' : '1px solid #ecf0f1',
              padding: state.isMobile ? '16px' : '12px',
              margin: '4px 0',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isActive ? '0 2px 8px rgba(33, 150, 243, 0.3)' : 'none'
            }}
          >
            <div 
              className="sentence-number" 
              style={{
                backgroundColor: isCurrentlyRepeating ? '#ff9800' : isActive ? '#f44336' : '#3498db',
                color: 'white',
                width: state.isMobile ? '40px' : '35px',
                height: state.isMobile ? '40px' : '35px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontSize: state.isMobile ? '16px' : '14px',
                fontWeight: 'bold'
              }}
            >
              {isCurrentlyRepeating ? `${state.currentRepeat}` : idx + 1}
            </div>
            
            <div className="sentence-text" style={{
              display: 'inline',
              fontSize: isActive ? (state.isMobile ? '18px' : '16px') : (state.isMobile ? '16px' : '15px'),
              fontWeight: isActive ? '600' : 'normal',
              color: isActive ? '#1976d2' : '#2c3e50'
            }}>
              {sentence.text}
            </div>
            
            <div className="sentence-timing" style={{
              float: 'right',
              fontSize: state.isMobile ? '14px' : '12px',
              color: '#95a5a6',
              fontFamily: 'monospace'
            }}>
              {sentence.start.toFixed(1)}s - {sentence.end.toFixed(1)}s
              {isCurrentlyRepeating && (
                <span style={{
                  color: '#ff9800', 
                  marginLeft: '8px', 
                  fontWeight: 'bold',
                  fontSize: state.isMobile ? '14px' : '13px'
                }}>
                  ↻ REPEAT {state.currentRepeat}/{state.repeatCount}
                </span>
              )}
              {isActive && !isCurrentlyRepeating && (
                <span style={{
                  color: '#f44336', 
                  marginLeft: '8px', 
                  fontWeight: 'bold',
                  fontSize: state.isMobile ? '14px' : '13px'
                }}>
                  ◀ PLAYING
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ------------------------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------------------------

  return (
    <div className="App">
      <header className="dashboard-header">
        <h1 className="dashboard-title">UPolly</h1>
        <h2 className="dashboard-subtitle">
          Practise English via polly!
          {state.isMobile && <span style={{ fontSize: '14px', color: '#666' }}> (📱 Mobile)</span>}
        </h2>
      </header>

      <button 
        className="new-audio-btn" 
        onClick={handleNewAudioClick}
        disabled={state.isUploading}
        style={{
          padding: state.isMobile ? '15px 25px' : '10px 20px',
          fontSize: state.isMobile ? '18px' : '16px',
          minHeight: state.isMobile ? '50px' : 'auto',
          opacity: state.isUploading ? 0.6 : 1,
          cursor: state.isUploading ? 'not-allowed' : 'pointer'
        }}
      >
        + New Audio
      </button>

      {state.showForm && renderUploadForm()}

      {state.uploadMessage && (
        <div 
          className="upload-message"
          style={{
            fontSize: state.isMobile ? '16px' : '14px',
            padding: state.isMobile ? '15px' : '10px'
          }}
        >
          {state.uploadMessage}
        </div>
      )}

      {state.audioUrl && state.sentences.length > 0 && (
        <section className="audio-player-section">
          <h3>Audio Player</h3>
          {renderPlayerControls()}
          {renderStatusPanel()}
          <div className="keyboard-hints" style={{
            fontSize: state.isMobile ? '14px' : '12px'
          }}>
            💡 <strong>Shortcuts:</strong> Space = Play/Pause, ← → = Navigate sentences
          </div>
        </section>
      )}

      <section className="sentences-section">
        <h3>Sentences {state.sentences.length > 0 && `(${state.sentences.length} total)`}</h3>
        {state.sentences.length === 0 ? (
          <p>No sentences yet. Upload your first audio file!</p>
        ) : (
          renderSentencesList()
        )}
      </section>
    </div>
  );
}

export default App;
