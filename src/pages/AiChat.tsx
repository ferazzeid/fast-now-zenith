import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Send, Settings, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isAudio?: boolean;
}

// Audio utilities
class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

// Audio Queue for sequential playback
class AudioQueue {
  private queue: Uint8Array[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const audioData = this.queue.shift()!;

    try {
      const wavData = this.createWavFromPCM(audioData);
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer);
      
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => this.playNext();
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    const int16Data = new Int16Array(pcmData.length / 2);
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i];
    }
    
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + int16Data.byteLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, int16Data.byteLength, true);

    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength);
    
    return wavArray;
  }
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [useOwnKey, setUseOwnKey] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptRef = useRef<string>('');

  useEffect(() => {
    if (!user) return;

    const initializeAudio = async () => {
      audioContextRef.current = new AudioContext();
      audioQueueRef.current = new AudioQueue(audioContextRef.current);
    };

    const fetchUserSettings = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('use_own_api_key')
        .eq('user_id', user.id)
        .single();

      setUseOwnKey(profile?.use_own_api_key ?? true);

      if (profile?.use_own_api_key ?? true) {
        const apiKey = localStorage.getItem('openai_api_key');
        setHasApiKey(!!apiKey);
      } else {
        const { data: settings } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'shared_openai_key')
          .single();
        
        setHasApiKey(!!settings?.setting_value);
      }
    };

    initializeAudio();
    fetchUserSettings();
    connectToRealtimeChat();

    return () => {
      disconnectFromChat();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [user]);

  const connectToRealtimeChat = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // First, get a connection token
      const { data: tokenData, error: tokenError } = await supabase.functions.invoke('connection-token', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (tokenError || !tokenData?.connection_token) {
        console.error('Failed to get connection token:', tokenError);
        toast({
          title: "Connection Error",
          description: "Failed to get connection token",
          variant: "destructive"
        });
        return;
      }

      // Use the connection token in the WebSocket URL
      const wsUrl = `wss://texnkijwcygodtywgedm.functions.supabase.co/functions/v1/realtime-chat?token=${tokenData.connection_token}`;
      const ws = new WebSocket(wsUrl);

      ws.addEventListener('open', () => {
        console.log('Connected to realtime chat');
        setIsConnected(true);
        
        // Start session with API key
        const apiKey = useOwnKey ? localStorage.getItem('openai_api_key') : undefined;
        console.log('API Key available:', !!apiKey, 'Use own key:', useOwnKey);
        ws.send(JSON.stringify({
          type: 'start_session',
          apiKey: apiKey
        }));

        // Add welcome message
        if (messages.length === 0) {
          setMessages([{
            id: '1',
            content: 'Hello! I\'m your AI fasting companion. I can help you with questions about intermittent fasting, provide motivation, and support your journey. You can type or use voice input. How can I assist you today?',
            role: 'assistant',
            timestamp: new Date()
          }]);
        }
      });

      ws.addEventListener('message', async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received message:', data.type);
        
        if (data.type === 'response.audio.delta') {
          // Play audio chunk
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueueRef.current?.addToQueue(bytes);
        } else if (data.type === 'response.audio_transcript.delta') {
          // Update transcript
          currentTranscriptRef.current += data.delta;
        } else if (data.type === 'response.audio_transcript.done') {
          // Add complete message
          if (currentTranscriptRef.current.trim()) {
            const aiMessage: Message = {
              id: Date.now().toString(),
              content: currentTranscriptRef.current.trim(),
              role: 'assistant',
              timestamp: new Date(),
              isAudio: true
            };
            setMessages(prev => [...prev, aiMessage]);
            currentTranscriptRef.current = '';
          }
        } else if (data.type === 'error') {
          toast({
            title: "Error",
            description: data.message,
            variant: "destructive"
          });
        }
      });

      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      });

      ws.addEventListener('close', () => {
        console.log('WebSocket closed');
        setIsConnected(false);
      });

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to realtime chat:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to AI chat service",
        variant: "destructive"
      });
    }
  };

  const disconnectFromChat = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !wsRef.current || !isConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Send text message to AI
    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: inputMessage
        }]
      }
    }));

    wsRef.current.send(JSON.stringify({
      type: 'response.create'
    }));
  };

  const toggleListening = async () => {
    if (!wsRef.current || !isConnected) {
      toast({
        title: "Not connected",
        description: "Please wait for connection to establish",
        variant: "destructive"
      });
      return;
    }

    if (!isListening) {
      try {
        audioRecorderRef.current = new AudioRecorder((audioData) => {
          if (wsRef.current && isConnected) {
            const base64Audio = encodeAudioForAPI(audioData);
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio
            }));
          }
        });

        await audioRecorderRef.current.start();
        setIsListening(true);
        
        toast({
          title: "Voice input started",
          description: "Speak now... The AI will respond when you stop talking.",
        });
      } catch (error) {
        console.error('Error starting voice input:', error);
        toast({
          title: "Microphone Error",
          description: "Failed to access microphone. Please check permissions.",
          variant: "destructive"
        });
      }
    } else {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
        audioRecorderRef.current = null;
      }
      setIsListening(false);
      
      toast({
        title: "Voice input ended",
        description: "Processing your message...",
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20">
        <div className="max-w-md mx-auto">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold text-warm-text">AI Chat</h1>
            <p className="text-muted-foreground">Your fasting companion</p>
          </div>

          <Card className="p-8 bg-ceramic-plate border-ceramic-rim text-center space-y-6">
            <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-warm-text">
                {useOwnKey ? "API Key Required" : "Service Unavailable"}
              </h3>
              <p className="text-muted-foreground">
                {useOwnKey 
                  ? "To use the AI chat feature, you need to configure your OpenAI API key in the settings."
                  : "The AI chat service is currently unavailable. Please contact support."
                }
              </p>
            </div>
            
            {useOwnKey && (
              <Button
                onClick={() => navigate('/settings')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Go to Settings
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-3xl font-bold text-warm-text">AI Chat</h1>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-primary" />
            ) : (
              <WifiOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground">
            Your fasting companion {isConnected ? "(Connected)" : "(Connecting...)"}
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-4 h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-ceramic-plate border border-ceramic-rim text-warm-text'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {message.isAudio && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Voice
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me about fasting..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="pr-12 bg-ceramic-plate border-ceramic-rim"
              disabled={!isConnected}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              disabled={!isConnected}
              className={`absolute right-1 top-1 h-8 w-8 ${
                isListening ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Voice Status */}
        {isListening && (
          <div className="text-center">
            <span className="text-sm text-primary animate-pulse">
              🎤 Listening... (AI will respond when you stop talking)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
