import { useState, useEffect } from 'react';
import { MessageCircle, Send, Mic, MicOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const AiChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if API key is available
    const apiKey = localStorage.getItem('openai_api_key');
    setHasApiKey(!!apiKey);
    
    if (apiKey && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: '1',
        content: "Hello! I'm your AI fasting companion. I'm here to support you on your fasting journey, answer questions about fasting, and provide motivation when you need it most. How can I help you today?",
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !hasApiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response (in real implementation, this would call OpenAI API)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getSimulatedResponse(inputMessage),
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const getSimulatedResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('hungry') || lowerInput.includes('craving')) {
      return "I understand those cravings can be challenging! Remember that hunger waves typically pass within 20-30 minutes. Try drinking some water, herbal tea, or doing a brief meditation. Your body is adapting beautifully to this healing process. You've got this! 💪";
    }
    
    if (lowerInput.includes('tired') || lowerInput.includes('energy')) {
      return "Feeling tired during fasting is normal, especially in the beginning. Your body is switching from glucose to fat for energy. Make sure you're staying hydrated, getting enough electrolytes, and getting quality sleep. This adjustment period will pass, and many people report increased energy once adapted! ⚡";
    }
    
    if (lowerInput.includes('break') || lowerInput.includes('stop')) {
      return "Listen to your body - that's the most important thing. If you're feeling unwell or concerned, it's always okay to break your fast safely. You can always try again when you're ready. Fasting is a journey, not a destination. Your health and wellbeing come first! 🌟";
    }
    
    return "That's a great question about fasting! While I can provide general guidance and support, remember that everyone's fasting journey is unique. Stay hydrated, listen to your body, and consider consulting with a healthcare provider for personalized advice. Keep up the amazing work on your wellness journey! 🙏";
  };

  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // Voice recognition would be implemented here with OpenAI API
  };

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
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-warm-text">
                AI Features Locked
              </h3>
              <p className="text-muted-foreground">
                Add your OpenAI API key in Settings to unlock AI chat and voice features.
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/settings')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Go to Settings
            </Button>
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
          <h1 className="text-3xl font-bold text-warm-text">AI Chat</h1>
          <p className="text-muted-foreground">Your fasting companion</p>
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
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))}
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
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleVoiceInput}
              className={`absolute right-1 top-1 h-8 w-8 ${
                isListening ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Voice Status */}
        {isListening && (
          <div className="text-center">
            <span className="text-sm text-primary animate-pulse">
              🎤 Listening...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiChat;