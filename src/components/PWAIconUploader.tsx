import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Upload, CheckCircle } from 'lucide-react';

export const PWAIconUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    favicon: boolean;
    apple: boolean;
    pwa: boolean;
  }>({ favicon: false, apple: false, pwa: false });
  const { toast } = useToast();

  const uploadIconsToStorage = async () => {
    setUploading(true);
    try {
      // Convert local asset files to blobs and upload to Supabase storage
      const icons = [
        { name: 'favicon-512.png', settingKey: 'app_favicon', path: '/src/assets/favicon-512.png' },
        { name: 'apple-touch-icon-512.png', settingKey: 'app_logo', path: '/src/assets/apple-touch-icon-512.png' },
        { name: 'pwa-icon-512x512.png', settingKey: 'app_icon_url', path: '/src/assets/pwa-icon-512x512.png' }
      ];

      for (const icon of icons) {
        try {
          // Fetch the local file
          const response = await fetch(icon.path);
          const blob = await response.blob();
          
          // Upload to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('website-images')
            .upload(icon.name, blob, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('website-images')
            .getPublicUrl(icon.name);

          // Update database setting
          const { error: dbError } = await supabase
            .from('shared_settings')
            .upsert({
              setting_key: icon.settingKey,
              setting_value: publicUrl
            });

          if (dbError) throw dbError;

          // Update status
          setUploadStatus(prev => ({
            ...prev,
            [icon.settingKey === 'app_favicon' ? 'favicon' : icon.settingKey === 'app_logo' ? 'apple' : 'pwa']: true
          }));

          console.log(`Uploaded ${icon.name} to: ${publicUrl}`);
        } catch (error) {
          console.error(`Error uploading ${icon.name}:`, error);
          throw error;
        }
      }

      toast({
        title: "Icons uploaded successfully",
        description: "All PWA icons have been uploaded to storage and database updated.",
      });
    } catch (error) {
      console.error('Error uploading icons:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload PWA icons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          PWA Icon Upload
        </CardTitle>
        <CardDescription>
          Upload the generated PWA icons to Supabase storage for proper PWA functionality.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            {uploadStatus.favicon ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span>Favicon</span>
          </div>
          <div className="flex items-center gap-2">
            {uploadStatus.apple ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span>Apple Touch Icon</span>
          </div>
          <div className="flex items-center gap-2">
            {uploadStatus.pwa ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
            )}
            <span>PWA Icon</span>
          </div>
        </div>
        
        <Button 
          onClick={uploadIconsToStorage} 
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Uploading Icons...' : 'Upload PWA Icons to Storage'}
        </Button>
      </CardContent>
    </Card>
  );
};