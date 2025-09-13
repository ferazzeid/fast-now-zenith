import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AudioItem {
  id: string;
  text: string;
  audioData?: string;
  status: 'pending' | 'generating' | 'ready' | 'playing' | 'completed' | 'error';
  audio?: HTMLAudioElement;
}

interface AudioCache {
  [textHash: string]: string; // base64 audio data
}

// Simple hash function for caching
const hashText = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Split text into chunks for better audio generation
const chunkText = (text: string, maxLength: number = 200): string[] => {
  if (text.length <= maxLength) return [text];
  
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    const sentenceWithPunctuation = trimmedSentence + '.';
    
    if (currentChunk.length + sentenceWithPunctuation.length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentenceWithPunctuation;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks.length > 0 ? chunks : [text];
};

export const useAudioManager = () => {
  const [audioQueue, setAudioQueue] = useState<AudioItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const cacheRef = useRef<AudioCache>({});
  const processingRef = useRef(false);

  const generateAudio = useCallback(async (text: string, voice: string = 'alloy'): Promise<string> => {
    console.log('🎵 Generating audio for text:', text.substring(0, 50) + '...');
    
    const textHash = hashText(text + voice);
    
    // Check cache first
    if (cacheRef.current[textHash]) {
      console.log('🎵 Audio found in cache');
      return cacheRef.current[textHash];
    }

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: text.slice(0, 500), voice }
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Cache the audio
        cacheRef.current[textHash] = data.audioContent;
        console.log('🎵 Audio generated and cached');
        return data.audioContent;
      }

      throw new Error('No audio content received');
    } catch (error) {
      console.error('🎵 Audio generation error:', error);
      throw error;
    }
  }, []);

  const createAudioElement = useCallback((audioData: string): HTMLAudioElement => {
    const audio = new Audio(`data:audio/mp3;base64,${audioData}`);
    audio.preload = 'auto';
    return audio;
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setIsProcessing(true);

    try {
      while (true) {
        const nextItem = audioQueue.find(item => 
          item.status === 'pending' || item.status === 'ready'
        );

        if (!nextItem) break;

        if (nextItem.status === 'pending') {
          // Generate audio for pending items
          setAudioQueue(prev => prev.map(item => 
            item.id === nextItem.id 
              ? { ...item, status: 'generating' as const }
              : item
          ));

          try {
            const audioData = await generateAudio(nextItem.text);
            const audioElement = createAudioElement(audioData);

            setAudioQueue(prev => prev.map(item => 
              item.id === nextItem.id 
                ? { ...item, status: 'ready' as const, audioData, audio: audioElement }
                : item
            ));
          } catch (error) {
            console.error('🎵 Failed to generate audio:', error);
            setAudioQueue(prev => prev.map(item => 
              item.id === nextItem.id 
                ? { ...item, status: 'error' as const }
                : item
            ));
            continue;
          }
        } else if (nextItem.status === 'ready' && nextItem.audio) {
          // Play ready items
          if (currentlyPlaying) {
            // Wait for current audio to finish
            break;
          }

          setCurrentlyPlaying(nextItem.id);
          setAudioQueue(prev => prev.map(item => 
            item.id === nextItem.id 
              ? { ...item, status: 'playing' as const }
              : item
          ));

          console.log('🎵 Playing audio chunk:', nextItem.text.substring(0, 50) + '...');

          await new Promise<void>((resolve, reject) => {
            if (!nextItem.audio) {
              reject(new Error('No audio element'));
              return;
            }

            const handleEnded = () => {
              console.log('🎵 Audio playback completed');
              setCurrentlyPlaying(null);
              setAudioQueue(prev => prev.map(item => 
                item.id === nextItem.id 
                  ? { ...item, status: 'completed' as const }
                  : item
              ));
              resolve();
            };

            const handleError = (error: Event) => {
              console.error('🎵 Audio playback error:', error);
              setCurrentlyPlaying(null);
              setAudioQueue(prev => prev.map(item => 
                item.id === nextItem.id 
                  ? { ...item, status: 'error' as const }
                  : item
              ));
              reject(new Error('Audio playback failed'));
            };

            nextItem.audio.addEventListener('ended', handleEnded, { once: true });
            nextItem.audio.addEventListener('error', handleError, { once: true });

            nextItem.audio.play().catch(handleError);
          });
        }
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      
      // Clean up completed items after a delay
      setTimeout(() => {
        setAudioQueue(prev => prev.filter(item => 
          item.status !== 'completed' && item.status !== 'error'
        ));
      }, 1000);
    }
  }, [audioQueue, currentlyPlaying, generateAudio, createAudioElement]);

  const queueTextForAudio = useCallback(async (text: string, voice: string = 'alloy') => {
    console.log('🎵 Queueing text for audio:', text.substring(0, 50) + '...');
    
    // Split text into manageable chunks
    const chunks = chunkText(text, 200);
    
    const newItems: AudioItem[] = chunks.map((chunk, index) => ({
      id: `${Date.now()}-${index}`,
      text: chunk,
      status: 'pending' as const
    }));

    setAudioQueue(prev => [...prev, ...newItems]);

    // Start processing queue
    setTimeout(() => processQueue(), 0);
  }, [processQueue]);

  const queueStreamingTextForAudio = useCallback(async (
    text: string, 
    onChunkReady?: (chunkIndex: number, totalChunks: number) => void,
    voice: string = 'alloy'
  ) => {
    console.log('🎵 Queueing streaming text for audio:', text.substring(0, 50) + '...');
    
    const chunks = chunkText(text, 150); // Smaller chunks for streaming
    
    // Add chunks to queue with parallel generation
    const chunkPromises = chunks.map(async (chunk, index) => {
      const item: AudioItem = {
        id: `${Date.now()}-${index}`,
        text: chunk,
        status: 'generating'
      };

      setAudioQueue(prev => [...prev, item]);

      try {
        const audioData = await generateAudio(chunk, voice);
        const audioElement = createAudioElement(audioData);

        setAudioQueue(prev => prev.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, status: 'ready' as const, audioData, audio: audioElement }
            : prevItem
        ));

        onChunkReady?.(index, chunks.length);
      } catch (error) {
        console.error('🎵 Failed to generate streaming audio chunk:', error);
        setAudioQueue(prev => prev.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, status: 'error' as const }
            : prevItem
        ));
      }
    });

    // Start processing queue immediately
    setTimeout(() => processQueue(), 0);

    // Wait for all chunks to be processed
    await Promise.allSettled(chunkPromises);
  }, [generateAudio, createAudioElement, processQueue]);

  const clearQueue = useCallback(() => {
    console.log('🎵 Clearing audio queue');
    
    audioQueue.forEach(item => {
      if (item.audio) {
        item.audio.pause();
        item.audio.currentTime = 0;
      }
    });

    setAudioQueue([]);
    setCurrentlyPlaying(null);
    processingRef.current = false;
    setIsProcessing(false);
  }, [audioQueue]);

  const clearCache = useCallback(() => {
    console.log('🎵 Clearing audio cache');
    cacheRef.current = {};
  }, []);

  return {
    queueTextForAudio,
    queueStreamingTextForAudio,
    clearQueue,
    clearCache,
    isProcessing,
    currentlyPlaying,
    queueLength: audioQueue.length,
    queueStatus: audioQueue.map(item => ({ 
      id: item.id, 
      status: item.status, 
      text: item.text.substring(0, 30) + '...' 
    }))
  };
};