import { supabase } from '@/integrations/supabase/client';

interface WalkingStats {
  time: string;
  distance: number;
  calories: number;
  speed: number;
  units: 'metric' | 'imperial';
}

interface ShareSettings {
  motivationalText: string;
  hashtags: string;
}

export const getShareSettings = async (): Promise<ShareSettings> => {
  try {
    const { data, error } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['walking_share_motivational_text', 'walking_share_hashtags']);

    if (error) throw error;

    const settings: ShareSettings = {
      motivationalText: 'Staying active and feeling great! 💪',
      hashtags: '#FastNowApp'
    };

    if (data) {
      data.forEach(setting => {
        if (setting.setting_key === 'walking_share_motivational_text') {
          settings.motivationalText = setting.setting_value || settings.motivationalText;
        } else if (setting.setting_key === 'walking_share_hashtags') {
          settings.hashtags = setting.setting_value || settings.hashtags;
        }
      });
    }

    return settings;
  } catch (error) {
    console.error('Error loading share settings:', error);
    return {
      motivationalText: 'Staying active and feeling great! 💪',
      hashtags: '#FastNowApp'
    };
  }
};

export const formatWalkingShareMessage = async (stats: WalkingStats): Promise<string> => {
  const settings = await getShareSettings();
  
  const distanceUnit = stats.units === 'metric' ? 'km' : 'miles';
  const speedUnit = stats.units === 'metric' ? 'km/h' : 'mph';
  
  const formattedDistance = stats.distance.toFixed(1);
  const formattedSpeed = stats.speed.toFixed(1);
  
  const message = `🚶‍♂️ Walking Update!
⏱️ ${stats.time}
🔥 ${stats.calories} calories burned
📍 ${formattedDistance} ${distanceUnit} covered
⚡ ${formattedSpeed} ${speedUnit} pace

${settings.motivationalText}
${settings.hashtags}`;

  return message;
};

export const generateFacebookShareUrl = (message: string): string => {
  const encodedMessage = encodeURIComponent(message);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodedMessage}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
};