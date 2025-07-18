// Audio processing utilities based on proper segmentation approach
export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionSegment {
  text: string;
  words: WordTimestamp[];
}

export interface TranscriptionResult {
  segments: TranscriptionSegment[];
  text: string;
}

export interface AudioSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  audioBlob?: Blob;
}

// Simple sentence tokenizer (mimics NLTK's sent_tokenize)
export function tokenizeSentences(text: string): string[] {
  // Remove extra whitespace and normalize
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Split on sentence endings, keeping the punctuation
  const sentences = cleanText.split(/(?<=[.!?])\s+/)
    .filter(sentence => sentence.trim().length > 0)
    .map(sentence => sentence.trim());
  
  return sentences;
}

// Build character to word index mapping
export function buildCharToWordMapping(words: WordTimestamp[]): number[] {
  const charToWord: number[] = [];
  
  for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
    const word = words[wordIdx].word;
    for (let i = 0; i < word.length; i++) {
      charToWord.push(wordIdx);
    }
  }
  
  return charToWord;
}

// Process transcription result into audio segments
export function processTranscriptionIntoSegments(
  result: TranscriptionResult,
  audioFile: File
): Promise<AudioSegment[]> {
  return new Promise((resolve) => {
    // Gather all words with timestamps from all segments
    const words: WordTimestamp[] = [];
    for (const segment of result.segments) {
      words.push(...(segment.words || []));
    }

    if (words.length === 0) {
      resolve([]);
      return;
    }

    // Build full transcript from words
    const fullText = words.map(w => w.word).join('').replace(/\n/g, '').trim();
    
    // Tokenize into sentences
    const sentences = tokenizeSentences(fullText);
    
    // Build character to word mapping
    const charToWord = buildCharToWordMapping(words);
    
    const audioSegments: AudioSegment[] = [];
    let prevEnd = 0;
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      // Find sentence position in full text
      const start = fullText.indexOf(sentence, prevEnd);
      if (start === -1) continue;
      
      const end = start + sentence.length;
      
      // Ensure we don't go out of bounds
      if (start >= charToWord.length || end - 1 >= charToWord.length) {
        continue;
      }
      
      // Get word indices for this sentence
      const wordStartIdx = charToWord[start];
      const wordEndIdx = charToWord[end - 1];
      
      // Get timestamps from words
      const startTime = words[wordStartIdx]?.start || 0;
      const endTime = words[wordEndIdx]?.end || 0;
      
      // Create audio segment
      const audioSegment: AudioSegment = {
        id: `segment_${i + 1}`,
        text: sentence,
        startTime,
        endTime
      };
      
      audioSegments.push(audioSegment);
      prevEnd = end;
    }
    
    resolve(audioSegments);
  });
}

// Mock transcription function that simulates Whisper API response
export async function mockTranscribeAudio(audioFile: File): Promise<TranscriptionResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock response with word-level timestamps (simulating Whisper output)
  const mockResult: TranscriptionResult = {
    text: "Welcome to our audio learning experience. This application helps you learn by listening and repeating. Each segment will play twice for optimal learning. Listen carefully the first time, then read along the second time. Practice makes perfect in language learning. Remember to focus on pronunciation and rhythm. Take your time with each segment. Learning a new language requires patience and consistent practice.",
    segments: [
      {
        text: "Welcome to our audio learning experience. This application helps you learn by listening and repeating.",
        words: [
          { word: "Welcome", start: 0.0, end: 0.8 },
          { word: " to", start: 0.8, end: 1.0 },
          { word: " our", start: 1.0, end: 1.3 },
          { word: " audio", start: 1.3, end: 1.8 },
          { word: " learning", start: 1.8, end: 2.4 },
          { word: " experience.", start: 2.4, end: 3.5 },
          { word: " This", start: 3.5, end: 3.8 },
          { word: " application", start: 3.8, end: 4.8 },
          { word: " helps", start: 4.8, end: 5.2 },
          { word: " you", start: 5.2, end: 5.4 },
          { word: " learn", start: 5.4, end: 5.8 },
          { word: " by", start: 5.8, end: 6.0 },
          { word: " listening", start: 6.0, end: 6.7 },
          { word: " and", start: 6.7, end: 6.9 },
          { word: " repeating.", start: 6.9, end: 8.2 }
        ]
      },
      {
        text: "Each segment will play twice for optimal learning. Listen carefully the first time, then read along the second time.",
        words: [
          { word: "Each", start: 8.2, end: 8.6 },
          { word: " segment", start: 8.6, end: 9.2 },
          { word: " will", start: 9.2, end: 9.5 },
          { word: " play", start: 9.5, end: 9.9 },
          { word: " twice", start: 9.9, end: 10.4 },
          { word: " for", start: 10.4, end: 10.6 },
          { word: " optimal", start: 10.6, end: 11.2 },
          { word: " learning.", start: 11.2, end: 12.8 },
          { word: " Listen", start: 12.8, end: 13.3 },
          { word: " carefully", start: 13.3, end: 14.0 },
          { word: " the", start: 14.0, end: 14.2 },
          { word: " first", start: 14.2, end: 14.6 },
          { word: " time,", start: 14.6, end: 15.1 },
          { word: " then", start: 15.1, end: 15.4 },
          { word: " read", start: 15.4, end: 15.7 },
          { word: " along", start: 15.7, end: 16.1 },
          { word: " the", start: 16.1, end: 16.3 },
          { word: " second", start: 16.3, end: 16.8 },
          { word: " time.", start: 16.8, end: 18.5 }
        ]
      },
      {
        text: "Practice makes perfect in language learning. Remember to focus on pronunciation and rhythm.",
        words: [
          { word: "Practice", start: 18.5, end: 19.1 },
          { word: " makes", start: 19.1, end: 19.5 },
          { word: " perfect", start: 19.5, end: 20.1 },
          { word: " in", start: 20.1, end: 20.3 },
          { word: " language", start: 20.3, end: 20.9 },
          { word: " learning.", start: 20.9, end: 22.3 },
          { word: " Remember", start: 22.3, end: 22.9 },
          { word: " to", start: 22.9, end: 23.1 },
          { word: " focus", start: 23.1, end: 23.5 },
          { word: " on", start: 23.5, end: 23.7 },
          { word: " pronunciation", start: 23.7, end: 24.8 },
          { word: " and", start: 24.8, end: 25.0 },
          { word: " rhythm.", start: 25.0, end: 26.2 }
        ]
      },
      {
        text: "Take your time with each segment. Learning a new language requires patience and consistent practice.",
        words: [
          { word: "Take", start: 26.2, end: 26.6 },
          { word: " your", start: 26.6, end: 26.9 },
          { word: " time", start: 26.9, end: 27.3 },
          { word: " with", start: 27.3, end: 27.6 },
          { word: " each", start: 27.6, end: 27.9 },
          { word: " segment.", start: 27.9, end: 28.8 },
          { word: " Learning", start: 28.8, end: 29.4 },
          { word: " a", start: 29.4, end: 29.5 },
          { word: " new", start: 29.5, end: 29.8 },
          { word: " language", start: 29.8, end: 30.4 },
          { word: " requires", start: 30.4, end: 31.0 },
          { word: " patience", start: 31.0, end: 31.7 },
          { word: " and", start: 31.7, end: 31.9 },
          { word: " consistent", start: 31.9, end: 32.7 },
          { word: " practice.", start: 32.7, end: 34.0 }
        ]
      }
    ]
  };
  
  return mockResult;
}