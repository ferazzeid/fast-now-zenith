import { useState } from 'react';
import { Key, Bell, User, Info, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const [openAiKey, setOpenAiKey] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const { toast } = useToast();

  const handleSaveApiKey = () => {
    if (openAiKey.trim()) {
      // In a real app, this would be securely stored
      localStorage.setItem('openai_api_key', openAiKey);
      toast({
        title: "🔑 API Key Saved!",
        description: "AI features are now activated.",
      });
    }
  };

  const handleClearApiKey = () => {
    setOpenAiKey('');
    localStorage.removeItem('openai_api_key');
    toast({
      title: "🗑️ API Key Removed",
      description: "AI features have been disabled.",
    });
  };

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-warm-text">Settings</h1>
          <p className="text-muted-foreground">Customize your fasting experience</p>
        </div>

        {/* AI Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Features</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="api-key" className="text-warm-text">
                OpenAI API Key
              </Label>
              <div className="space-y-2">
                <Input
                  id="api-key"
                  type={isKeyVisible ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-key"
                    checked={isKeyVisible}
                    onCheckedChange={setIsKeyVisible}
                  />
                  <Label htmlFor="show-key" className="text-sm text-muted-foreground">
                    Show API key
                  </Label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={handleSaveApiKey}
                  disabled={!openAiKey.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Key
                </Button>
                <Button
                  onClick={handleClearApiKey}
                  variant="outline"
                  className="bg-ceramic-base border-ceramic-rim"
                >
                  Clear
                </Button>
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Your API key enables voice-to-text, AI chat, and smart motivator creation. 
                  Get your key from{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-warm-text font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders and encouragement during fasts
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  SMS and email notifications will be available in future updates
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Account */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Account</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🔒 Google authentication integration coming soon. 
                  Your data is currently stored locally on your device.
                </p>
              </div>
              
              <Button
                variant="outline"
                className="w-full bg-ceramic-base border-ceramic-rim"
                disabled
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out (Coming Soon)
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">About</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="text-warm-text font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Build</span>
                <span className="text-warm-text font-medium">Beta</span>
              </div>
            </div>
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Fast Now - Your mindful fasting companion
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;