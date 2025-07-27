import { useState, useEffect } from 'react';
import { Users, Settings, Key, BarChart3, DollarSign, Eye, EyeOff, Smartphone, Image, Brain, MessageSquare, Sliders, Plus, AlertTriangle, CreditCard, MessageCircle, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { AdminMotivatorCreation } from '@/components/AdminMotivatorCreation';
import { CrisisModal } from '@/components/CrisisModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
  is_paid_user: boolean;
  monthly_ai_requests: number;
  ai_requests_reset_date: string;
  created_at: string;
}

interface UsageStats {
  total_users: number;
  paid_users: number;
  total_ai_requests: number;
  monthly_ai_requests: number;
  users_at_free_limit: number;
  users_near_premium_limit: number;
  conversion_opportunities: number;
  free_users_exhausted: number;
  premium_users_over_80_percent: number;
}

interface AISettings {
  system_prompt: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  include_user_context: boolean;
  response_style: string;
  prompt_templates: Array<{
    name: string;
    prompt: string;
  }>;
}

interface AIBehaviorSettings {
  weak_moment_keywords: string[];
  motivator_suggestion_frequency: number;
  coaching_encouragement_level: number;
  auto_motivator_triggers: boolean;
  slideshow_transition_time: number;
  crisis_style?: 'direct' | 'motivational' | 'tough_love' | 'psychological';
  admin_motivator_templates: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
  }>;
}

interface ImageGenerationSettings {
  style_prompt: string;
  image_model: string;
  image_size: string;
  image_quality: string;
}

const AdminOverview = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sharedApiKey, setSharedApiKey] = useState('');
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isStripeKeyVisible, setIsStripeKeyVisible] = useState(false);
  const [pwaSettings, setPwaSettings] = useState({
    app_name: '',
    short_name: '',
    description: '',
    theme_color: '#8B7355',
    background_color: '#F5F2EA'
  });
  const [brandColors, setBrandColors] = useState({
    primary: '140 35% 45%',
    primary_hover: '140 35% 40%',
    accent: '140 25% 85%'
  });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    total_users: 0,
    paid_users: 0,
    total_ai_requests: 0,
    monthly_ai_requests: 0,
    users_at_free_limit: 0,
    users_near_premium_limit: 0,
    conversion_opportunities: 0,
    free_users_exhausted: 0,
    premium_users_over_80_percent: 0,
  });
  const [aiSettings, setAiSettings] = useState<AISettings>({
    system_prompt: '',
    model_name: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 500,
    include_user_context: true,
    response_style: 'encouraging',
    prompt_templates: []
  });
  const [aiBehaviorSettings, setAiBehaviorSettings] = useState<AIBehaviorSettings>({
    weak_moment_keywords: [],
    motivator_suggestion_frequency: 3,
    coaching_encouragement_level: 7,
    auto_motivator_triggers: true,
    slideshow_transition_time: 15,
    admin_motivator_templates: []
  });
  const [imageGenSettings, setImageGenSettings] = useState<ImageGenerationSettings>({
    style_prompt: "Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.",
    image_model: "dall-e-3",
    image_size: "1024x1024",
    image_quality: "hd"
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [monthlyRequestLimit, setMonthlyRequestLimit] = useState('1000');
  const [freeRequestLimit, setFreeRequestLimit] = useState('15');
  const [updateLimitsLoading, setUpdateLimitsLoading] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [appIconFile, setAppIconFile] = useState<File | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);
  const [apiUsageStats, setApiUsageStats] = useState<any[]>([]);
  const [aiResponseLength, setAiResponseLength] = useState('medium');
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState('');
  const [currentAppIconUrl, setCurrentAppIconUrl] = useState('');
  const [showUsageStats, setShowUsageStats] = useState(false);
  const [showCrisisPreview, setShowCrisisPreview] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all users with profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) {
        setUsers(profilesData);
        
        // Calculate enhanced usage stats
        const freeLimit = parseInt(freeRequestLimit || '15');
        const premiumLimit = parseInt(monthlyRequestLimit || '1000');
        
        const freeUsers = profilesData.filter(u => !u.is_paid_user);
        const premiumUsers = profilesData.filter(u => u.is_paid_user);
        
        const stats = {
          total_users: profilesData.length,
          paid_users: premiumUsers.length,
          total_ai_requests: profilesData.reduce((sum, u) => sum + (u.monthly_ai_requests || 0), 0),
          monthly_ai_requests: profilesData.reduce((sum, u) => sum + (u.monthly_ai_requests || 0), 0),
          users_at_free_limit: freeUsers.filter(u => (u.monthly_ai_requests || 0) >= freeLimit).length,
          users_near_premium_limit: premiumUsers.filter(u => (u.monthly_ai_requests || 0) >= premiumLimit * 0.8).length,
          conversion_opportunities: freeUsers.filter(u => (u.monthly_ai_requests || 0) >= freeLimit * 0.8).length,
          free_users_exhausted: freeUsers.filter(u => (u.monthly_ai_requests || 0) >= freeLimit).length,
          premium_users_over_80_percent: premiumUsers.filter(u => (u.monthly_ai_requests || 0) >= premiumLimit * 0.8).length,
        };
        setUsageStats(stats);
      }

      // Fetch shared OpenAI key
      const { data: settingsData } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_openai_key')
        .single();

      if (settingsData) {
        setSharedApiKey(settingsData.setting_value || '');
      }

      // Fetch shared Stripe key
      const { data: stripeSettingsData } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'stripe_secret_key')
        .single();

      if (stripeSettingsData) {
        setStripeApiKey(stripeSettingsData.setting_value || '');
      }

      // Fetch PWA settings and icon URLs
      const { data: pwaData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['pwa_app_name', 'pwa_short_name', 'pwa_description', 'pwa_theme_color', 'pwa_background_color', 'brand_primary_color', 'brand_primary_hover', 'brand_accent_color', 'app_icon_url', 'favicon_url']);

      if (pwaData) {
        const pwaMap = pwaData.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setPwaSettings({
          app_name: pwaMap.pwa_app_name || '',
          short_name: pwaMap.pwa_short_name || '',
          description: pwaMap.pwa_description || '',
          theme_color: pwaMap.pwa_theme_color || '#8B7355',
          background_color: pwaMap.pwa_background_color || '#F5F2EA'
        });
        
        const savedColors = {
          primary: pwaMap.brand_primary_color || '140 35% 45%',
          primary_hover: pwaMap.brand_primary_hover || '140 35% 40%',
          accent: pwaMap.brand_accent_color || '140 25% 85%'
        };
        
        setBrandColors(savedColors);
        
        // Apply saved brand colors to CSS variables immediately
        const root = document.documentElement;
        root.style.setProperty('--primary', savedColors.primary);
        root.style.setProperty('--accent', savedColors.accent);
        
        // Apply saved app icons to DOM and update state
        if (pwaMap.favicon_url) {
          setCurrentFaviconUrl(pwaMap.favicon_url);
          const existingFavicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
          if (existingFavicon) {
            existingFavicon.href = pwaMap.favicon_url;
          } else {
            const favicon = document.createElement('link');
            favicon.rel = 'icon';
            favicon.href = pwaMap.favicon_url;
            document.head.appendChild(favicon);
          }
        }
        
        if (pwaMap.app_icon_url) {
          setCurrentAppIconUrl(pwaMap.app_icon_url);
          const existingIcon192 = document.querySelector("link[rel='icon'][sizes='192x192']") as HTMLLinkElement;
          if (existingIcon192) {
            existingIcon192.href = pwaMap.app_icon_url;
          }
          const existingIcon512 = document.querySelector("link[rel='icon'][sizes='512x512']") as HTMLLinkElement;
          if (existingIcon512) {
            existingIcon512.href = pwaMap.app_icon_url;
          }
        }
      }

      // Fetch request limits
      const { data: limitsData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['monthly_request_limit', 'free_request_limit']);

      if (limitsData) {
        const limitsMap = limitsData.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setMonthlyRequestLimit(limitsMap.monthly_request_limit || '1000');
        setFreeRequestLimit(limitsMap.free_request_limit || '15');
      }

      // Fetch AI settings
      const { data: aiData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'ai_system_prompt', 
          'ai_model_name', 
          'ai_temperature', 
          'ai_max_tokens', 
          'ai_include_user_context', 
          'ai_response_style',
          'ai_prompt_templates',
          'ai_weak_moment_keywords',
          'ai_motivator_suggestion_frequency',
          'ai_coaching_encouragement_level',
          'ai_auto_motivator_triggers',
          'ai_slideshow_transition_time',
          'ai_crisis_style',
          'ai_admin_motivator_templates',
          'ai_response_length',
          'image_gen_style_prompt',
          'image_gen_model',
          'image_gen_size',
          'image_gen_quality'
        ]);

      if (aiData) {
        const aiMap = aiData.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setAiSettings({
          system_prompt: aiMap.ai_system_prompt || '',
          model_name: aiMap.ai_model_name || 'gpt-4o-mini',
          temperature: parseFloat(aiMap.ai_temperature || '0.8'),
          max_tokens: parseInt(aiMap.ai_max_tokens || '500'),
          include_user_context: aiMap.ai_include_user_context === 'true',
          response_style: aiMap.ai_response_style || 'encouraging',
          prompt_templates: aiMap.ai_prompt_templates ? JSON.parse(aiMap.ai_prompt_templates) : []
        });

        setAiBehaviorSettings({
          weak_moment_keywords: aiMap.ai_weak_moment_keywords ? JSON.parse(aiMap.ai_weak_moment_keywords) : [],
          motivator_suggestion_frequency: parseInt(aiMap.ai_motivator_suggestion_frequency || '3'),
          coaching_encouragement_level: parseInt(aiMap.ai_coaching_encouragement_level || '7'),
          auto_motivator_triggers: aiMap.ai_auto_motivator_triggers === 'true',
          slideshow_transition_time: parseInt(aiMap.ai_slideshow_transition_time || '15'),
          crisis_style: (aiMap.ai_crisis_style as any) || 'psychological',
          admin_motivator_templates: aiMap.ai_admin_motivator_templates ? JSON.parse(aiMap.ai_admin_motivator_templates) : []
        });

        setAiResponseLength(aiMap.ai_response_length || 'medium');

        // Set image generation settings
        setImageGenSettings({
          style_prompt: aiMap.image_gen_style_prompt || "Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.",
          image_model: aiMap.image_gen_model || "dall-e-3",
          image_size: aiMap.image_gen_size || "1024x1024",
          image_quality: aiMap.image_gen_quality || "hd"
        });
      }

      // Fetch API usage statistics
      await fetchApiUsageStats();
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaidStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_paid_user: !currentStatus })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'upgraded to' : 'downgraded from'} paid status`,
      });
      fetchAdminData();
    }
  };

  const resetUserUsage = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        monthly_ai_requests: 0,
        ai_requests_reset_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reset user usage",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User AI usage reset successfully",
      });
      fetchAdminData();
    }
  };

  const saveSharedApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .update({ setting_value: sharedApiKey })
      .eq('setting_key', 'shared_openai_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save shared API key",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Shared OpenAI API key saved successfully",
      });
    }
  };

  const clearSharedApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .update({ setting_value: null })
      .eq('setting_key', 'shared_openai_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to clear shared API key",
        variant: "destructive",
      });
    } else {
      setSharedApiKey('');
      toast({
        title: "Success",
        description: "Shared OpenAI API key cleared",
      });
    }
  };

  const saveStripeApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .upsert({ 
        setting_key: 'stripe_secret_key',
        setting_value: stripeApiKey 
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save Stripe API key",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Stripe API key saved successfully",
      });
    }
  };

  const clearStripeApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .update({ setting_value: null })
      .eq('setting_key', 'stripe_secret_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to clear Stripe API key",
        variant: "destructive",
      });
    } else {
      setStripeApiKey('');
      toast({
        title: "Success",
        description: "Stripe API key cleared",
      });
    }
  };

  const savePwaSettings = async () => {
    try {
      const updates = Object.entries(pwaSettings).map(([key, value]) => ({
        setting_key: `pwa_${key}`,
        setting_value: value
      }));

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);
      }

      toast({
        title: "Success",
        description: "PWA settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save PWA settings",
        variant: "destructive",
      });
    }
  };

  const saveBrandColors = async () => {
    try {
      const updates = [
        { setting_key: 'brand_primary_color', setting_value: brandColors.primary },
        { setting_key: 'brand_primary_hover', setting_value: brandColors.primary_hover },
        { setting_key: 'brand_accent_color', setting_value: brandColors.accent }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });
      }

      // Update CSS variables in real-time
      const root = document.documentElement;
      root.style.setProperty('--primary', brandColors.primary);
      root.style.setProperty('--accent', brandColors.accent);

      toast({
        title: "Success",
        description: "Brand colors updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save brand colors",
        variant: "destructive",
      });
    }
  };

  // Helper function to convert HSL to Hex
  const hslToHex = (hslString: string): string => {
    try {
      // Parse HSL format "140 35% 45%"
      const parts = hslString.trim().split(/\s+/);
      if (parts.length !== 3) return '#8B7355';
      
      const h = parseFloat(parts[0]) / 360;
      const s = parseFloat(parts[1].replace('%', '')) / 100;
      const l = parseFloat(parts[2].replace('%', '')) / 100;

      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((h * 360 / 60) % 2) - 1));
      const m = l - c / 2;
      
      let r, g, b;
      const hue = h * 360;
      if (hue >= 0 && hue < 60) {
        r = c; g = x; b = 0;
      } else if (hue >= 60 && hue < 120) {
        r = x; g = c; b = 0;
      } else if (hue >= 120 && hue < 180) {
        r = 0; g = c; b = x;
      } else if (hue >= 180 && hue < 240) {
        r = 0; g = x; b = c;
      } else if (hue >= 240 && hue < 300) {
        r = x; g = 0; b = c;
      } else {
        r = c; g = 0; b = x;
      }

      r = Math.round((r + m) * 255);
      g = Math.round((g + m) * 255);
      b = Math.round((b + m) * 255);

      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    } catch (error) {
      return '#8B7355'; // fallback color
    }
  };

  // Helper function to convert Hex to HSL
  const hexToHsl = (hex: string): string => {
    try {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
          default: h = 0;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    } catch (error) {
      return '140 35% 45%'; // fallback HSL
    }
  };

  const saveAiSettings = async () => {
    try {
      const updates = [
        { key: 'ai_system_prompt', value: aiSettings.system_prompt },
        { key: 'ai_model_name', value: aiSettings.model_name },
        { key: 'ai_temperature', value: aiSettings.temperature.toString() },
        { key: 'ai_max_tokens', value: aiSettings.max_tokens.toString() },
        { key: 'ai_include_user_context', value: aiSettings.include_user_context.toString() },
        { key: 'ai_response_style', value: aiSettings.response_style },
        { key: 'ai_prompt_templates', value: JSON.stringify(aiSettings.prompt_templates) }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      toast({
        title: "Success",
        description: "AI settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    }
  };

  const fetchApiUsageStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setApiUsageStats(data || []);
    } catch (error) {
      console.error('Error fetching API usage stats:', error);
    }
  };

  const uploadFavicon = async () => {
    if (!faviconFile) return;

    setUploadingFavicon(true);
    try {
      const fileExt = faviconFile.name.split('.').pop();
      const fileName = `favicon.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('website-images')
        .upload(fileName, faviconFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-images')
        .getPublicUrl(fileName);

      // Save favicon URL to database for persistence
      const { error: dbError } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'favicon_url',
          setting_value: publicUrl
        });

      if (dbError) throw dbError;

      // Update state and DOM
      setCurrentFaviconUrl(publicUrl);
      setFaviconFile(null);
      
      // Update index.html favicon link
      const faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = publicUrl;
      }

      toast({
        title: "Success",
        description: "Favicon uploaded and saved successfully",
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({
        title: "Error",
        description: "Failed to upload favicon",
        variant: "destructive",
      });
    } finally {
      setUploadingFavicon(false);
      setFaviconFile(null);
    }
  };

  const uploadAppIcon = async () => {
    if (!appIconFile) return;

    setUploadingAppIcon(true);
    try {
      const fileExt = appIconFile.name.split('.').pop();
      const fileName = `app-icon.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('website-images')
        .upload(fileName, appIconFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-images')
        .getPublicUrl(fileName);

      // Update manifest.json icons
      // This would require server-side handling to update the actual manifest.json file
      await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: 'app_icon_url',
          setting_value: publicUrl 
        });

      toast({
        title: "Success",
        description: "App icon uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to upload app icon",
        variant: "destructive",
      });
    } finally {
      setUploadingAppIcon(false);
      setAppIconFile(null);
    }
  };

  const saveAiResponseLength = async () => {
    try {
      await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: 'ai_response_length',
          setting_value: aiResponseLength 
        });

      toast({
        title: "Success",
        description: "AI response length setting saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI response length setting",
        variant: "destructive",
      });
    }
  };

  const saveAiBehaviorSettings = async () => {
    try {
      const updates = [
        { key: 'ai_weak_moment_keywords', value: JSON.stringify(aiBehaviorSettings.weak_moment_keywords) },
        { key: 'ai_motivator_suggestion_frequency', value: aiBehaviorSettings.motivator_suggestion_frequency.toString() },
        { key: 'ai_coaching_encouragement_level', value: aiBehaviorSettings.coaching_encouragement_level.toString() },
        { key: 'ai_auto_motivator_triggers', value: aiBehaviorSettings.auto_motivator_triggers.toString() },
        { key: 'ai_slideshow_transition_time', value: aiBehaviorSettings.slideshow_transition_time.toString() },
        { key: 'ai_crisis_style', value: aiBehaviorSettings.crisis_style || 'psychological' },
        { key: 'ai_admin_motivator_templates', value: JSON.stringify(aiBehaviorSettings.admin_motivator_templates) }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      toast({
        title: "Success",
        description: "AI behavior settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI behavior settings",
        variant: "destructive",
      });
    }
  };

  const saveImageGenerationSettings = async () => {
    try {
      const updates = [
        { key: 'image_gen_style_prompt', value: imageGenSettings.style_prompt },
        { key: 'image_gen_model', value: imageGenSettings.image_model },
        { key: 'image_gen_size', value: imageGenSettings.image_size },
        { key: 'image_gen_quality', value: imageGenSettings.image_quality }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      toast({
        title: "Success",
        description: "Image generation settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save image generation settings",
        variant: "destructive",
      });
    }
  };

  const loadTemplate = (templateName: string) => {
    const template = aiSettings.prompt_templates.find(t => t.name === templateName);
    if (template) {
      setAiSettings(prev => ({
        ...prev,
        system_prompt: template.prompt
      }));
      toast({
        title: "Template Loaded",
        description: `Applied "${templateName}" template to system prompt`,
      });
    }
  };

  const updateRequestLimits = async () => {
    setUpdateLimitsLoading(true);
    try {
      await supabase
        .from('shared_settings')
        .update({ setting_value: monthlyRequestLimit })
        .eq('setting_key', 'monthly_request_limit');

      await supabase
        .from('shared_settings')
        .update({ setting_value: freeRequestLimit })
        .eq('setting_key', 'free_request_limit');

      toast({
        title: "Success",
        description: "Request limits updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request limits",
        variant: "destructive",
      });
    } finally {
      setUpdateLimitsLoading(false);
    }
  };

  const clearStorageStats = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('motivator-images')
        .list();

      const fileCount = files?.length || 0;
      const totalSize = files?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;

      toast({
        title: "Storage Info",
        description: `${fileCount} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB used`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get storage stats",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32 safe-bottom flex items-center justify-center">
        <div className="text-warm-text">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32 safe-bottom">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-warm-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">Total Users</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Total number of registered users in the system</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-warm-text">{usageStats.total_users}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">Paid Users</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Users with active premium subscriptions</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-warm-text">{usageStats.paid_users}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">AI Requests (24h)</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of AI requests made in the last 24 hours across all users</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-warm-text">{usageStats.monthly_ai_requests}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">Shared API Configured</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Status of shared API key configuration for all users</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-lg font-medium text-warm-text">
                      {sharedApiKey ? 'Configured' : 'Not Set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">Users at Free Limit</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Free users who have reached their monthly usage limit and cannot make more requests</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-warm-text">{usageStats.free_users_exhausted}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">Premium Near Limit</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Premium users who are approaching their monthly usage limit (80%+ used)</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-warm-text">{usageStats.premium_users_over_80_percent}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">Conversion Ready</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Free users who have hit their limit and are likely to convert to premium</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-warm-text">{usageStats.conversion_opportunities}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="h-full bg-ceramic-plate border-ceramic-rim">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-warm-text" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-warm-text">API Usage</p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-warm-text/60" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Current month's API costs vs allocated budget limits</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-warm-text/80">OpenAI: $12.45 / $100.00</p>
                      <p className="text-sm text-warm-text/80">Perplexity: $2.30 / $50.00</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Limit Recommendations */}
        {(usageStats.free_users_exhausted / Math.max(usageStats.total_users - usageStats.paid_users, 1) > 0.2) && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Recommendation: Consider Increasing Free Limit</p>
                <p className="text-sm text-yellow-700">
                  Over 20% of free users have hit their limit. Consider increasing from {freeRequestLimit} to {parseInt(freeRequestLimit) + 5} requests.
                </p>
              </div>
            </div>
          </Card>
        )}

        {(usageStats.premium_users_over_80_percent / Math.max(usageStats.paid_users, 1) > 0.1) && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Alert: Premium Users Approaching Limit</p>
                <p className="text-sm text-orange-700">
                  {usageStats.premium_users_over_80_percent} premium users are using over 80% of their {monthlyRequestLimit} monthly requests.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Subscription Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Subscription Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-warm-text">Monthly Request Limit (Premium Users)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={monthlyRequestLimit}
                    onChange={(e) => setMonthlyRequestLimit(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim"
                    min="100"
                    max="10000"
                    step="100"
                  />
                  <Button
                    onClick={updateRequestLimits}
                    disabled={updateLimitsLoading}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateLimitsLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {monthlyRequestLimit} requests per month
                </p>
              </div>

              <div>
                <Label className="text-warm-text">Free Request Limit (New Users)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={freeRequestLimit}
                    onChange={(e) => setFreeRequestLimit(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim"
                    min="5"
                    max="100"
                    step="5"
                  />
                  <Button
                    onClick={updateRequestLimits}
                    disabled={updateLimitsLoading}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateLimitsLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {freeRequestLimit} free requests per account
                </p>
              </div>
            </div>

            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium text-warm-text mb-2">Usage Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Set generous limits to prevent user frustration</li>
                <li>• Monitor usage analytics to adjust accordingly</li>
                <li>• Free limits encourage upgrades without being restrictive</li>
                <li>• Premium limits should feel unlimited for normal usage</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Shared OpenAI Key Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Shared OpenAI API Key</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="shared-api-key" className="text-warm-text">
                OpenAI API Key (Shared by all paid users)
              </Label>
              <div className="space-y-2">
                <Input
                  id="shared-api-key"
                  type={isKeyVisible ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={sharedApiKey}
                  onChange={(e) => setSharedApiKey(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-shared-key"
                    checked={isKeyVisible}
                    onCheckedChange={setIsKeyVisible}
                  />
                  <Label htmlFor="show-shared-key" className="text-sm text-muted-foreground">
                    Show API key
                  </Label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={saveSharedApiKey}
                  disabled={!sharedApiKey.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Shared Key
                </Button>
                <Button
                  onClick={clearSharedApiKey}
                  variant="outline"
                  className="bg-ceramic-base border-ceramic-rim"
                >
                  Clear
                </Button>
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  This API key will be used for all paid users. Usage: Free users (0 requests), 
                  Paid users (150 requests/month), Admin (unlimited).
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stripe Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Stripe Configuration</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="stripe-api-key" className="text-warm-text">
                Stripe Secret Key (Test or Live)
              </Label>
              <div className="space-y-2">
                <Input
                  id="stripe-api-key"
                  type={isStripeKeyVisible ? 'text' : 'password'}
                  placeholder="sk_test_... or sk_live_..."
                  value={stripeApiKey}
                  onChange={(e) => setStripeApiKey(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-stripe-key"
                    checked={isStripeKeyVisible}
                    onCheckedChange={setIsStripeKeyVisible}
                  />
                  <Label htmlFor="show-stripe-key" className="text-sm text-muted-foreground">
                    Show API key
                  </Label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={saveStripeApiKey}
                  disabled={!stripeApiKey.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Stripe Key
                </Button>
                <Button
                  onClick={clearStripeApiKey}
                  variant="outline"
                  className="bg-ceramic-base border-ceramic-rim"
                >
                  Clear
                </Button>
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {stripeApiKey.startsWith('sk_test_') ? (
                    <span className="text-yellow-600">⚠️ Test mode: Use this for testing. No real payments will be processed.</span>
                  ) : stripeApiKey.startsWith('sk_live_') ? (
                    <span className="text-green-600">✅ Live mode: Real payments will be processed.</span>
                  ) : stripeApiKey ? (
                    <span className="text-red-600">❌ Invalid key format. Must start with sk_test_ or sk_live_</span>
                  ) : (
                    "Configure your Stripe secret key to enable subscription payments. Test keys start with sk_test_, live keys with sk_live_."
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Behavior Controls */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Sliders className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Behavior Controls</h3>
            </div>

            {/* Weak Moment Detection */}
            <div className="space-y-3">
              <Label className="text-warm-text">Weak Moment Keywords</Label>
              <Textarea
                placeholder="Enter keywords separated by commas (e.g., hungry, craving, struggling)"
                value={aiBehaviorSettings.weak_moment_keywords.join(', ')}
                onChange={(e) => setAiBehaviorSettings(prev => ({ 
                  ...prev, 
                  weak_moment_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                }))}
                className="bg-ceramic-base border-ceramic-rim"
              />
              <div className="text-xs text-muted-foreground">
                AI will detect these words in conversations to trigger motivational support
              </div>
            </div>

            {/* Motivator Suggestion Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-warm-text">
                  Motivator Suggestion Frequency: {aiBehaviorSettings.motivator_suggestion_frequency}
                </Label>
                <Slider
                  value={[aiBehaviorSettings.motivator_suggestion_frequency]}
                  onValueChange={([value]) => setAiBehaviorSettings(prev => ({ ...prev, motivator_suggestion_frequency: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  How often AI suggests new motivators (1=rarely, 10=frequently)
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-warm-text">
                  Coaching Encouragement Level: {aiBehaviorSettings.coaching_encouragement_level}
                </Label>
                <Slider
                  value={[aiBehaviorSettings.coaching_encouragement_level]}
                  onValueChange={([value]) => setAiBehaviorSettings(prev => ({ ...prev, coaching_encouragement_level: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Balance between encouragement and education (1=educational, 10=encouraging)
                </div>
              </div>
            </div>

            {/* Timer & Motivator Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="auto-triggers"
                  checked={aiBehaviorSettings.auto_motivator_triggers}
                  onCheckedChange={(checked) => setAiBehaviorSettings(prev => ({ ...prev, auto_motivator_triggers: checked }))}
                />
                <Label htmlFor="auto-triggers" className="text-warm-text">
                  Auto-trigger motivators during fasting
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-warm-text">Slideshow Transition (seconds)</Label>
                <Input
                  type="number"
                  min="5"
                  max="60"
                  value={aiBehaviorSettings.slideshow_transition_time}
                  onChange={(e) => setAiBehaviorSettings(prev => ({ ...prev, slideshow_transition_time: parseInt(e.target.value) || 15 }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
            </div>

            <Button
              onClick={saveAiBehaviorSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Save Behavior Settings
            </Button>

            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                These controls let you fine-tune how the AI detects user needs and provides motivational support.
                All changes take effect immediately for new conversations.
              </p>
            </div>
          </div>
        </Card>

        {/* Image Generation Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Image Generation Settings</h3>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Two Different Prompts:</strong> "Visual Style Prompt" controls the overall aesthetic (colors, art style) while "AI Image Context Prompt" generates specific content descriptions for AI-created motivators to ensure relevance.
              </p>
            </div>

            {/* Style Prompt */}
            <div className="space-y-3">
              <Label className="text-warm-text">Visual Style Prompt</Label>
              <Textarea
                placeholder="Define the visual style and aesthetic for AI-generated motivator images..."
                value={imageGenSettings.style_prompt}
                onChange={(e) => setImageGenSettings(prev => ({ ...prev, style_prompt: e.target.value }))}
                className="bg-ceramic-base border-ceramic-rim min-h-[120px]"
              />
              <div className="text-xs text-muted-foreground">
                This prompt defines the visual style (colors, art style, mood) applied to ALL generated images
              </div>
            </div>


            {/* Content Integration Settings */}
            <div className="space-y-4">
              <Label className="text-warm-text">Motivator Content Integration</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-3 border border-ceramic-rim rounded-lg bg-ceramic-base/50">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Use Motivator Title</Label>
                    <p className="text-xs text-muted-foreground">Include motivator title in image prompt</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border border-ceramic-rim rounded-lg bg-ceramic-base/50">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Use Motivator Description</Label>
                    <p className="text-xs text-muted-foreground">Include motivator content in image prompt</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border border-ceramic-rim rounded-lg bg-ceramic-base/50">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Include User Demographics</Label>
                    <p className="text-xs text-muted-foreground">Match depicted people to user profile when available</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between p-3 border border-ceramic-rim rounded-lg bg-ceramic-base/50">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">AI-Enhanced Image Context</Label>
                    <p className="text-xs text-muted-foreground">For AI-created motivators, generate additional image-specific context</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* AI Image Context Generation */}
            <div className="space-y-3">
              <Label className="text-warm-text">AI Image Context Prompt</Label>
              <Textarea
                placeholder="Prompt for AI to generate image-specific context..."
                defaultValue="Based on this motivator's title and content, create a detailed visual description that would result in a highly relevant, inspiring image. Focus on specific visual elements, settings, objects, and concepts that directly support the motivator's message. Include details about mood, composition, and symbolic elements that reinforce the motivational theme."
                className="bg-ceramic-base border-ceramic-rim min-h-[80px]"
              />
              <div className="text-xs text-muted-foreground">
                When AI creates motivators, this prompt generates additional context specifically for image generation (different from style prompt above)
              </div>
            </div>

            {/* Model and Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-warm-text">Image Model</Label>
                <Select
                  value={imageGenSettings.image_model}
                  onValueChange={(value) => setImageGenSettings(prev => ({ ...prev, image_model: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-image-1">GPT-Image-1 (Highest Quality)</SelectItem>
                    <SelectItem value="dall-e-3">DALL-E 3 (High Quality)</SelectItem>
                    <SelectItem value="dall-e-2">DALL-E 2 (Faster)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-warm-text">Image Size</Label>
                <Select
                  value={imageGenSettings.image_size}
                  onValueChange={(value) => setImageGenSettings(prev => ({ ...prev, image_size: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024x1024">1024x1024 (Square)</SelectItem>
                    <SelectItem value="1024x1792">1024x1792 (Portrait)</SelectItem>
                    <SelectItem value="1792x1024">1792x1024 (Landscape)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-warm-text">Image Quality</Label>
                <Select
                  value={imageGenSettings.image_quality}
                  onValueChange={(value) => setImageGenSettings(prev => ({ ...prev, image_quality: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (Best Quality)</SelectItem>
                    <SelectItem value="hd">HD (DALL-E 3)</SelectItem>
                    <SelectItem value="standard">Standard (Faster)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={saveImageGenerationSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Image className="w-4 h-4 mr-2" />
              Save Image Generation Settings
            </Button>

            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Content Relevance:</strong> These settings ensure generated images directly relate to motivator content rather than being generic. 
                The AI will analyze the motivator's message and create visually relevant imagery that supports the specific motivational goal.
              </p>
            </div>
          </div>
        </Card>

        {/* AI Chat Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Chat Configuration</h3>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="text-warm-text">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                {aiSettings.prompt_templates.map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => loadTemplate(template.name)}
                    className="bg-ceramic-base border-ceramic-rim hover:bg-ceramic-base/80"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-3">
              <Label htmlFor="system-prompt" className="text-warm-text">
                System Prompt
              </Label>
              <Textarea
                id="system-prompt"
                placeholder="Define the AI's personality and behavior..."
                value={aiSettings.system_prompt}
                onChange={(e) => setAiSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                className="bg-ceramic-base border-ceramic-rim min-h-[120px]"
              />
              <div className="text-xs text-muted-foreground">
                Characters: {aiSettings.system_prompt.length}/2000
              </div>
            </div>

            {/* Model Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-warm-text">AI Model</Label>
                <Select
                  value={aiSettings.model_name}
                  onValueChange={(value) => setAiSettings(prev => ({ ...prev, model_name: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Latest)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-warm-text">Response Style</Label>
                <Select
                  value={aiSettings.response_style}
                  onValueChange={(value) => setAiSettings(prev => ({ ...prev, response_style: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                    <SelectItem value="scientific">Scientific</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Temperature & Max Tokens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-warm-text">
                  Creativity (Temperature): {aiSettings.temperature}
                </Label>
                <Slider
                  value={[aiSettings.temperature]}
                  onValueChange={([value]) => setAiSettings(prev => ({ ...prev, temperature: value }))}
                  max={2}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Lower = More focused, Higher = More creative
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens" className="text-warm-text">Max Response Length</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={aiSettings.max_tokens}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 500 }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="text-xs text-muted-foreground">
                  100-4000 tokens (shorter = faster responses)
                </div>
              </div>
            </div>

            {/* User Context Toggle */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Switch
                  id="include-context"
                  checked={aiSettings.include_user_context}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, include_user_context: checked }))}
                />
                <Label htmlFor="include-context" className="text-warm-text">
                  Include user context in AI responses
                </Label>
                <div className="relative group">
                  <AlertTriangle className="w-4 h-4 text-blue-500 cursor-help" />
                  <div className="absolute left-0 top-6 w-80 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <strong>User context includes:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Fasting data:</strong> Current session status, duration, goals, past fasting history</li>
                      <li><strong>Food tracking:</strong> Recent meals, calorie/carb goals, eating patterns, food library</li>
                      <li><strong>Walking activity:</strong> Sessions, distance, speed, calories burned, exercise goals</li>
                      <li><strong>Profile info:</strong> Weight, height, age, activity level, daily goals, units preference</li>
                      <li><strong>Usage patterns:</strong> AI request history, motivator preferences, crisis intervention style</li>
                      <li><strong>Motivators:</strong> Personal motivator collection, categories, recent interactions</li>
                    </ul>
                    <p className="mt-2 font-semibold">This data helps AI provide personalized, relevant responses based on user's current state and goals.</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, AI responses include personalized context from user's fasting, food, walking, and profile data. Hover the info icon for details.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={saveAiSettings}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Save AI Settings
              </Button>
            </div>

            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                These settings control how the AI companion behaves and responds to users. 
                Changes take effect immediately for new conversations.
              </p>
            </div>
          </div>
        </Card>

        {/* PWA Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">PWA Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app-name" className="text-warm-text">App Name</Label>
                <Input
                  id="app-name"
                  value={pwaSettings.app_name}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, app_name: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="short-name" className="text-warm-text">Short Name</Label>
                <Input
                  id="short-name"
                  value={pwaSettings.short_name}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, short_name: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme-color" className="text-warm-text">Theme Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={pwaSettings.theme_color}
                    onChange={(e) => setPwaSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                    className="w-12 h-10 rounded border-2 border-ceramic-rim cursor-pointer"
                  />
                  <Input
                    id="theme-color"
                    value={pwaSettings.theme_color}
                    onChange={(e) => setPwaSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                    className="bg-ceramic-base border-ceramic-rim"
                    placeholder="#8B7355"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bg-color" className="text-warm-text">Background Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={pwaSettings.background_color}
                    onChange={(e) => setPwaSettings(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-12 h-10 rounded border-2 border-ceramic-rim cursor-pointer"
                  />
                  <Input
                    id="bg-color"
                    value={pwaSettings.background_color}
                    onChange={(e) => setPwaSettings(prev => ({ ...prev, background_color: e.target.value }))}
                    className="bg-ceramic-base border-ceramic-rim"
                    placeholder="#F5F2EA"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-warm-text">Description</Label>
              <Input
                id="description"
                value={pwaSettings.description}
                onChange={(e) => setPwaSettings(prev => ({ ...prev, description: e.target.value }))}
                className="bg-ceramic-base border-ceramic-rim"
              />
            </div>
            
            <Button
              onClick={savePwaSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save PWA Settings
            </Button>
          </div>
        </Card>

        {/* Brand Colors */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Brand Colors</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Customize the primary action button colors to match your brand across all pages.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-warm-text">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hslToHex(brandColors.primary)}
                    onChange={(e) => {
                      setBrandColors(prev => ({ ...prev, primary: hexToHsl(e.target.value) }));
                    }}
                    className="w-12 h-10 rounded border-2 border-ceramic-rim cursor-pointer"
                  />
                  <Input
                    id="primary-color"
                    value={brandColors.primary}
                    onChange={(e) => setBrandColors(prev => ({ ...prev, primary: e.target.value }))}
                    placeholder="140 35% 45%"
                    className="bg-ceramic-base border-ceramic-rim"
                  />
                </div>
                <div 
                  className="w-full h-8 rounded border-2 border-ceramic-rim"
                  style={{ backgroundColor: `hsl(${brandColors.primary})` }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-hover" className="text-warm-text">Primary Hover</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hslToHex(brandColors.primary_hover)}
                    onChange={(e) => {
                      setBrandColors(prev => ({ ...prev, primary_hover: hexToHsl(e.target.value) }));
                    }}
                    className="w-12 h-10 rounded border-2 border-ceramic-rim cursor-pointer"
                  />
                  <Input
                    id="primary-hover"
                    value={brandColors.primary_hover}
                    onChange={(e) => setBrandColors(prev => ({ ...prev, primary_hover: e.target.value }))}
                    placeholder="140 35% 40%"
                    className="bg-ceramic-base border-ceramic-rim"
                  />
                </div>
                <div 
                  className="w-full h-8 rounded border-2 border-ceramic-rim"
                  style={{ backgroundColor: `hsl(${brandColors.primary_hover})` }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent-color" className="text-warm-text">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hslToHex(brandColors.accent)}
                    onChange={(e) => {
                      setBrandColors(prev => ({ ...prev, accent: hexToHsl(e.target.value) }));
                    }}
                    className="w-12 h-10 rounded border-2 border-ceramic-rim cursor-pointer"
                  />
                  <Input
                    id="accent-color"
                    value={brandColors.accent}
                    onChange={(e) => setBrandColors(prev => ({ ...prev, accent: e.target.value }))}
                    placeholder="140 25% 85%"
                    className="bg-ceramic-base border-ceramic-rim"
                  />
                </div>
                <div 
                  className="w-full h-8 rounded border-2 border-ceramic-rim"
                  style={{ backgroundColor: `hsl(${brandColors.accent})` }}
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Use the color picker for easy selection or HSL format (e.g., "140 35% 45%") for precise control. Changes apply immediately to buttons and action elements.
              </p>
            </div>
            
            <Button
              onClick={saveBrandColors}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Brand Colors
            </Button>
          </div>
        </Card>

        {/* SEO Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">SEO Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure meta title and description for search engine optimization.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title" className="text-warm-text">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="FastNow - Your Mindful Fasting Companion"
                  className="bg-ceramic-base border-ceramic-rim"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 50-60 characters for optimal search display
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta-description" className="text-warm-text">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  placeholder="Transform your relationship with food through mindful fasting. Track progress, get AI-powered motivation, and achieve your wellness goals with our comprehensive fasting companion."
                  className="bg-ceramic-base border-ceramic-rim min-h-[100px]"
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 150-160 characters for optimal search display
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-warm-text">Main Page Indexing</Label>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="allow-main-indexing"
                      defaultChecked={true}
                    />
                    <Label htmlFor="allow-main-indexing" className="text-warm-text">
                      Allow search engine indexing for main page (/)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Controls whether the homepage appears in search results
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-warm-text">Other Pages Indexing</Label>
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="allow-other-indexing"
                      defaultChecked={false}
                    />
                    <Label htmlFor="allow-other-indexing" className="text-warm-text">
                      Allow search engine indexing for all other pages (timer, settings, etc.)
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When disabled, all pages except the main page will have no-index meta tag
                  </p>
                </div>
              </div>
            </div>
            
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save SEO Settings
            </Button>
          </div>
        </Card>

        {/* App Icons and Branding */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">App Icons and Branding</h3>
            </div>
            
            {/* Favicon Upload */}
            <div className="space-y-3">
              <Label htmlFor="favicon-upload" className="text-sm font-medium text-warm-text">
                Favicon (Browser Icon)
              </Label>
              
              {/* Current Favicon Preview */}
              {currentFaviconUrl && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <img src={currentFaviconUrl} alt="Current favicon" className="w-8 h-8 rounded" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">✓ Favicon saved</p>
                    <p className="text-xs text-green-600 dark:text-green-400 truncate">{currentFaviconUrl}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentFaviconUrl('');
                      // Remove from database
                      supabase.from('shared_settings').delete().eq('setting_key', 'favicon_url');
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Input
                  id="favicon-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                  value={faviconFile ? undefined : ""}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <Button
                  onClick={uploadFavicon}
                  disabled={!faviconFile || uploadingFavicon}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {uploadingFavicon ? 'Uploading...' : currentFaviconUrl ? 'Replace Favicon' : 'Save Favicon'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PNG or JPG file for the browser favicon (16x16 or 32x32px recommended). 
                <strong>Note:</strong> ICO files are not supported - please use PNG/JPG instead.
              </p>
            </div>

            {/* App Icon Upload */}
            <div className="space-y-3">
              <Label htmlFor="app-icon-upload" className="text-sm font-medium text-warm-text">
                App Icon (Mobile Shortcut)
              </Label>
              
              {/* Current App Icon Preview */}
              {currentAppIconUrl && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <img src={currentAppIconUrl} alt="Current app icon" className="w-12 h-12 rounded-lg" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">✓ App icon saved</p>
                    <p className="text-xs text-green-600 dark:text-green-400 truncate">{currentAppIconUrl}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentAppIconUrl('');
                      // Remove from database
                      supabase.from('shared_settings').delete().eq('setting_key', 'app_icon_url');
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <Input
                  id="app-icon-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  onChange={(e) => setAppIconFile(e.target.files?.[0] || null)}
                  value={appIconFile ? undefined : ""}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <Button
                  onClick={uploadAppIcon}
                  disabled={!appIconFile || uploadingAppIcon}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {uploadingAppIcon ? 'Uploading...' : currentAppIconUrl ? 'Replace App Icon' : 'Save App Icon'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a PNG or JPG file for mobile app shortcuts (512x512px recommended)
              </p>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Click "Save" to permanently apply your icon changes. Files will be stored securely and persist across sessions.
              </p>
            </div>
          </div>
        </Card>

        {/* API Usage Statistics */}
        <Card className="p-6 bg-ceramic-base/50 border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">API Usage Analytics</h3>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>What this shows:</strong> Shared API usage statistics for all users using the common OpenAI API key (not personal API keys). These numbers track total consumption of the shared API resources across the entire platform.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-ceramic-rim rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {apiUsageStats.reduce((sum, log) => sum + (log.tokens_used || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Tokens</div>
                </div>
                <div className="p-3 bg-ceramic-rim rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    ${apiUsageStats.reduce((sum, log) => sum + (log.estimated_cost || 0), 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Cost</div>
                </div>
                <div className="p-3 bg-ceramic-rim rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {apiUsageStats.length.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">API Calls</div>
                </div>
                <div className="p-3 bg-ceramic-rim rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {[...new Set(apiUsageStats.map(log => log.model_used))].length}
                  </div>
                  <div className="text-xs text-muted-foreground">Models Used</div>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                <div className="text-sm space-y-2">
                  {apiUsageStats.slice(0, 20).map((log, index) => (
                    <div key={index} className="p-2 bg-ceramic-rim rounded text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{log.request_type}</span>
                        <span className="text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        {log.model_used} • {log.tokens_used} tokens • ${log.estimated_cost?.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Response Length Control */}
        <Card className="p-6 bg-ceramic-base/50 border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Response Settings</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-warm-text">
                  Response Length Preference
                </Label>
                <Select value={aiResponseLength} onValueChange={setAiResponseLength}>
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short (1-2 sentences)</SelectItem>
                    <SelectItem value="medium">Medium (2-4 sentences)</SelectItem>
                    <SelectItem value="long">Long (Detailed explanations)</SelectItem>
                    <SelectItem value="adaptive">Adaptive (Context-based)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls how detailed AI responses should be by default
                </p>
              </div>
              
              <Button
                onClick={saveAiResponseLength}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save Response Length Setting
              </Button>
            </div>
          </div>
        </Card>

        {/* Crisis Intervention Controls */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Crisis Intervention Controls</h3>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>What this does:</strong> Controls the emergency intervention system that appears when users are struggling with their fast. The red popup appears after the set time period to provide motivation and prevent users from breaking their fast.
              </p>
            </div>

            {/* Crisis Trigger Hours */}
            <div className="space-y-3">
              <Label className="text-warm-text">Crisis Button Appears After (Hours)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="72"
                  defaultValue="24"
                  className="bg-ceramic-base border-ceramic-rim w-32"
                  placeholder="24"
                />
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  Update
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Number of fasting hours before the crisis intervention button becomes available
              </p>
            </div>

            {/* Crisis Style Section */}
            <div className="space-y-3">
              <Label className="text-warm-text">Crisis Intervention Style</Label>
              <p className="text-xs text-muted-foreground">
                How the AI responds to panic button presses
              </p>
              <Select
                value={aiBehaviorSettings.crisis_style || 'psychological'}
                onValueChange={(value) => setAiBehaviorSettings(prev => ({
                  ...prev,
                  crisis_style: value as any
                }))}
              >
                <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct - Straightforward and assertive</SelectItem>
                  <SelectItem value="motivational">Motivational - Uplifting and encouraging</SelectItem>
                  <SelectItem value="tough_love">Tough Love - Firm but caring</SelectItem>
                  <SelectItem value="psychological">Psychological - Uses persuasive pressure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Crisis Response Preview Section */}
            <div className="space-y-3">
              <Label className="text-warm-text">Crisis Response Preview</Label>
              <p className="text-xs text-muted-foreground">
                Preview what users will see in the red crisis popup
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-semibold text-red-800 dark:text-red-200">Crisis Intervention</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {aiBehaviorSettings.crisis_style === 'psychological' ? 
                    "You've given up before, haven't you? This feeling will pass, but giving up lasts forever..." :
                    aiBehaviorSettings.crisis_style === 'tough_love' ?
                    "Stop right there! You're stronger than this craving. Don't throw away your progress now." :
                    aiBehaviorSettings.crisis_style === 'motivational' ?
                    "You've got this! This difficult moment is proof that your fast is working." :
                    "This is temporary. Your goals are permanent. Push through this moment."
                  }
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowCrisisPreview(true)}
                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Preview Crisis Popup
              </Button>
            </div>
            
            <Button 
              onClick={saveAiBehaviorSettings}
              className="bg-primary hover:bg-primary/90"
            >
              Save Crisis Settings
            </Button>
          </div>
        </Card>

        {/* Admin Motivator Creation */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Plus className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Admin Motivator Creation</h3>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>What this does:</strong> Create motivational templates that become available to all users as preset options. Unlike regular chat, this creates standardized motivators that appear in users' motivator libraries as starting points. These differ from AI chat by providing curated, admin-approved content that maintains consistent messaging across the platform.
              </p>
            </div>
            
            <AdminMotivatorCreation
              onTemplateCreated={(template) => {
                setAiBehaviorSettings(prev => ({
                  ...prev,
                  admin_motivator_templates: [...prev.admin_motivator_templates, template]
                }));
              }}
              existingTemplates={aiBehaviorSettings.admin_motivator_templates}
            />
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Difference from AI Chat:</strong> This creates permanent templates for all users, while AI chat provides personalized responses. Think of this as creating a library of motivational content vs. having a conversation.
              </p>
            </div>
          </div>
        </Card>

        {/* Storage Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Storage Management</h3>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>What this does:</strong> Manages file storage across the entire application. This tracks all user-uploaded images including motivator images, food photos, and profile pictures.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-warm-text">Maximum Upload Size (MB)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Select defaultValue="5">
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 MB</SelectItem>
                      <SelectItem value="10">10 MB</SelectItem>
                      <SelectItem value="15">15 MB</SelectItem>
                      <SelectItem value="20">20 MB</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    Update
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum file size per upload across all users
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={clearStorageStats}
                  variant="outline"
                  className="bg-ceramic-base border-ceramic-rim"
                >
                  Check Storage Usage
                </Button>
              </div>
            </div>
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Storage Usage:</strong> Shows total files and storage used by all users combined. Includes motivator images, food photos, and profile pictures. Current stats: 5 files, 5MB used (all users combined).
              </p>
            </div>
          </div>
        </Card>

        {/* User Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">User Management</h3>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Enhanced User Management:</strong> Comprehensive user administration with advanced analytics, filtering, search, and bulk operations. View detailed user profiles, track activity, and manage permissions efficiently.
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-ceramic-base rounded-lg border border-ceramic-rim">
                  <p className="text-lg font-bold text-warm-text">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
                <div className="p-3 bg-ceramic-base rounded-lg border border-ceramic-rim">
                  <p className="text-lg font-bold text-warm-text">{users.filter(u => u.is_paid_user).length}</p>
                  <p className="text-xs text-muted-foreground">Paid Users</p>
                </div>
                <div className="p-3 bg-ceramic-base rounded-lg border border-ceramic-rim">
                  <p className="text-lg font-bold text-warm-text">
                    {users.length > 0 ? Math.round((users.filter(u => u.is_paid_user).length / users.length) * 100) : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
              </div>
              <Button 
                onClick={() => window.open('/user-management', '_blank')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Open Full User Management
              </Button>
            </div>
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Reset Usage:</strong> Clears the monthly AI request counter for a user. 
                <strong> Upgrade/Downgrade:</strong> Changes between free tier (limited requests) and paid tier (higher limits).
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Crisis Preview Modal */}
      <CrisisModal 
        isOpen={showCrisisPreview}
        onClose={() => setShowCrisisPreview(false)}
      />
    </div>
    </TooltipProvider>
  );
};

export default AdminOverview;
