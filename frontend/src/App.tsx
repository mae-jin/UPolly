import React, { useState, useRef, useCallback } from 'react';
import { Upload, Play, Pause, SkipBack, SkipForward, Volume2, FileAudio, Mic } from 'lucide-react';
import { 
  AudioSegment, 
  mockTranscribeAudio, 
  processTranscriptionIntoSegments 
} from './components/AudioProcessor';
import { AudioVisualizer } from './components/AudioVisualizer';

function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState<number>(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file');
      return;
    }
    
    setAudioFile(file);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setSegments([]);
    setCurrentSegment(0);
    setPlayCount(0);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  // Update audio time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Mock transcription function - in production, you'd call an API like OpenAI Whisper
  const transcribeAudio = async () => {
    if (!audioFile) return;
    
    setIsTranscribing(true);
    
    try {
      // Get transcription with word-level timestamps
      const transcriptionResult = await mockTranscribeAudio(audioFile);
      
      // Process into properly segmented audio chunks
      const audioSegments = await processTranscriptionIntoSegments(transcriptionResult, audioFile);
      
      setSegments(audioSegments);
    } catch (error) {
      console.error('Transcription error:', error);
      alert('Error during transcription. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const playSegment = async (segmentIndex: number) => {
    if (!audioRef.current || !segments[segmentIndex]) return;
    
    const segment = segments[segmentIndex];
    const audio = audioRef.current;
    
    setIsPlaying(true);
    setCurrentSegment(segmentIndex);
    
    // Set the audio to start at the segment's start time
    audio.currentTime = segment.startTime;
    
    try {
      await audio.play();
      
      // Stop the audio when we reach the end time
      const checkTime = () => {
        if (audio.currentTime >= segment.endTime) {
          audio.pause();
          setIsPlaying(false);
          
          // If this was the first play, increment play count and play again
          if (playCount === 0) {
            setPlayCount(1);
            setTimeout(() => playSegment(segmentIndex), 500);
          } else {
            // Reset play count and move to next segment
            setPlayCount(0);
            if (segmentIndex < segments.length - 1) {
              setTimeout(() => playSegment(segmentIndex + 1), 1000);
            }
          }
        } else {
          requestAnimationFrame(checkTime);
        }
      };
      
      checkTime();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      setPlayCount(0);
    }
  };

  const previousSegment = () => {
    if (currentSegment > 0) {
      stopPlayback();
      setCurrentSegment(currentSegment - 1);
    }
  };

  const nextSegment = () => {
    if (currentSegment < segments.length - 1) {
      stopPlayback();
      setCurrentSegment(currentSegment + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Audio Learning Studio
            </h1>
            <p className="text-lg text-gray-600">
              Upload audio, get transcription, and learn with chunked playback
            </p>
          </div>

          {/* Upload Section */}
          {!audioFile && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <FileAudio className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Upload Audio File
                </h3>
                <p className="text-gray-500 mb-4">
                  Drag and drop your audio file here, or click to browse
                </p>
                <p className="text-sm text-gray-400">
                  Supports MP3, WAV, M4A, and other audio formats
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
            </div>
          )}

          {/* Audio Player */}
          {audioFile && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Volume2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{audioFile.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {!segments.length && (
                  <button
                    onClick={transcribeAudio}
                    disabled={isTranscribing}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}</span>
                  </button>
                )}
              </div>
              
              <AudioVisualizer 
                audioRef={audioRef}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
              />
              
              <audio 
                ref={audioRef} 
                src={audioUrl} 
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full mt-4" 
                controls
              />
            </div>
          )}

          {/* Transcription Loading */}
          {isTranscribing && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Transcribing Audio...
                </h3>
                <p className="text-gray-500">
                  Processing your audio file to create segments
                </p>
              </div>
            </div>
          )}

          {/* Segments Display */}
          {segments.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Audio Segments
                </h3>
                <div className="text-sm text-gray-500">
                  {segments.length} segments found
                </div>
              </div>

              {/* Current Segment Display */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-blue-600">
                    Segment {currentSegment + 1} of {segments.length}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${playCount === 0 ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {playCount === 0 ? 'Listen' : 'Read Along'} - Play {playCount + 1}/2
                    </span>
                  </div>
                </div>
                
                <div className="text-lg text-gray-800 leading-relaxed mb-4">
                  {segments[currentSegment]?.text}
                </div>
                
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={previousSegment}
                    disabled={currentSegment === 0}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => isPlaying ? stopPlayback() : playSegment(currentSegment)}
                    className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  
                  <button
                    onClick={nextSegment}
                    disabled={currentSegment === segments.length - 1}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((currentSegment / segments.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentSegment / segments.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* All Segments List */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 mb-3">All Segments</h4>
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      index === currentSegment
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentSegment(index)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Segment {index + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        {segment.startTime.toFixed(1)}s - {segment.endTime.toFixed(1)}s
                      </span>
                    </div>
                    <p className="text-gray-800">{segment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              How to Use
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">1.</span>
                <span>Upload your audio file using the upload area above</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">2.</span>
                <span>Click "Transcribe Audio" to process the file and create segments</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">3.</span>
                <span>Listen to each segment twice: first time to understand, second time to read along</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">4.</span>
                <span>Use the navigation controls to move between segments</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">5.</span>
                <span>Practice reading aloud during the second playback for better learning</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;