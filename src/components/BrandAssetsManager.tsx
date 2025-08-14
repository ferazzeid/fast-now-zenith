import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Smartphone, Monitor, Palette, User } from "lucide-react";
import { SmartLoadingButton } from "./enhanced/SmartLoadingStates";
import { AuthorTooltip } from "./AuthorTooltip";

const BrandAssetsManager = () => {
  const [appIcon, setAppIcon] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [currentAppIcon, setCurrentAppIcon] = useState<string>('');
  const [currentFavicon, setCurrentFavicon] = useState<string>('');
  const [currentLogo, setCurrentLogo] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  
  // Author tooltip state
  const [authorData, setAuthorData] = useState({
    image: '/lovable-uploads/default-author.png',
    name: 'Admin',
    title: 'Personal Insight'
  });
  const [authorDataDraft, setAuthorDataDraft] = useState({
    name: 'Admin',
    title: 'Personal Insight'
  });
  const [hasAuthorChanges, setHasAuthorChanges] = useState(false);

  useEffect(() => {
    fetchCurrentAssets();
    loadAuthorSettings();
  }, []);

  const fetchCurrentAssets = async () => {
    try {
      const { data: settingsData, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_logo', 'app_favicon', 'app_icon_url']);

      if (error) {
        console.error('Error fetching brand assets:', error);
        return;
      }

      if (settingsData) {
        settingsData.forEach(setting => {
          if (setting.setting_key === 'app_favicon') {
            setCurrentFavicon(setting.setting_value || '');
          } else if (setting.setting_key === 'app_logo') {
            setCurrentLogo(setting.setting_value || '');
          } else if (setting.setting_key === 'app_icon_url') {
            setCurrentAppIcon(setting.setting_value || '');
          }
        });
      }
    } catch (error) {
      console.error('Error fetching current assets:', error);
    }
  };

  const loadAuthorSettings = async () => {
    try {
      const { data: settings } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['author_tooltip_image', 'author_tooltip_name', 'author_tooltip_title']);

      if (settings) {
        const settingsMap = settings.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setAuthorData({
          image: settingsMap.author_tooltip_image || '/lovable-uploads/default-author.png',
          name: settingsMap.author_tooltip_name || 'Admin',
          title: settingsMap.author_tooltip_title || 'Personal Insight'
        });
        setAuthorDataDraft({
          name: settingsMap.author_tooltip_name || 'Admin',
          title: settingsMap.author_tooltip_title || 'Personal Insight'
        });
        setHasAuthorChanges(false);
      }
    } catch (error) {
      console.error('Failed to load author settings:', error);
    }
  };

  const handleFileSelect = (file: File, type: 'appIcon' | 'favicon' | 'logo') => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a valid image file (PNG, JPG, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    if (type === 'appIcon') {
      setAppIcon(file);
    } else if (type === 'favicon') {
      setFavicon(file);
    } else {
      setLogo(file);
    }
  };

  const uploadAsset = async (file: File, type: 'appIcon' | 'favicon' | 'logo') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `brand-assets/${fileName}`;

    console.log(`Uploading ${type}:`, { fileName, filePath, fileSize: file.size, fileType: file.type });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('website-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`Upload error for ${type}:`, uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log(`Upload successful for ${type}:`, uploadData);

    const { data } = supabase.storage
      .from('website-images')
      .getPublicUrl(filePath);

    console.log(`Public URL generated for ${type}:`, data.publicUrl);
    return data.publicUrl;
  };

  const handleAuthorImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `author-${Math.random()}.${fileExt}`;
      const filePath = `author/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('website-images')
        .getPublicUrl(filePath);

      await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: 'author_tooltip_image', 
          setting_value: publicUrl 
        }, { onConflict: 'setting_key' });

      setAuthorData(prev => ({ ...prev, image: publicUrl }));
      
      toast({
        title: "Author image updated",
        description: "The author tooltip image has been updated successfully.",
      });
    } catch (error) {
      console.error('Error uploading author image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the author image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateAuthorField = async (field: 'name' | 'title', value: string) => {
    setUploading(true);
    try {
      await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: `author_tooltip_${field}`, 
          setting_value: value 
        }, { onConflict: 'setting_key' });

      setAuthorData(prev => ({ ...prev, [field]: value }));
      setHasAuthorChanges(false);
      
      toast({
        title: "Author info updated",
        description: `Author ${field} has been updated successfully.`,
      });
    } catch (error) {
      console.error(`Error updating author ${field}:`, error);
      toast({
        title: "Update failed",
        description: `Failed to update author ${field}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveAuthorInfo = async () => {
    if (!hasAuthorChanges) return;
    
    setUploading(true);
    try {
      // Save both name and title
      await Promise.all([
        supabase
          .from('shared_settings')
          .upsert({ 
            setting_key: 'author_tooltip_name', 
            setting_value: authorDataDraft.name 
          }, { onConflict: 'setting_key' }),
        supabase
          .from('shared_settings')
          .upsert({ 
            setting_key: 'author_tooltip_title', 
            setting_value: authorDataDraft.title 
          }, { onConflict: 'setting_key' })
      ]);

      setAuthorData(prev => ({ 
        ...prev, 
        name: authorDataDraft.name,
        title: authorDataDraft.title 
      }));
      setHasAuthorChanges(false);
      
      toast({
        title: "Author info saved",
        description: "Author information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving author info:', error);
      toast({
        title: "Save failed",
        description: "Failed to save author information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAuthorDataChange = (field: 'name' | 'title', value: string) => {
    setAuthorDataDraft(prev => ({ ...prev, [field]: value }));
    setHasAuthorChanges(true);
  };

  const updateManifestAndFavicon = async () => {
    // Force manifest cache refresh by triggering service worker update
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          registration.update();
        }
      } catch (error) {
        console.log('Service worker update failed (non-critical):', error);
      }
    }

    // Force browser to refresh manifest by adding cache-busting parameter
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const url = new URL(manifestLink.href);
      url.searchParams.set('v', Date.now().toString());
      manifestLink.href = url.toString();
    }

    console.log('Manifest and PWA cache updated');
  };

  const saveAsset = async (file: File, type: 'appIcon' | 'favicon' | 'logo') => {
    if (!file) {
      toast({
        title: "No file selected",
        description: `Please select a ${type} image first`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      console.log(`Starting ${type} upload:`, file.name);
      const assetUrl = await uploadAsset(file, type);
      console.log(`${type} uploaded successfully:`, assetUrl);
      
      // Determine the database key
      let dbKey = '';
      if (type === 'appIcon') dbKey = 'app_icon_url';
      else if (type === 'favicon') dbKey = 'app_favicon';
      else dbKey = 'app_logo';
      
      // Save to database with conflict resolution
      const { data: existing } = await supabase
        .from('shared_settings')
        .select('setting_key')
        .eq('setting_key', dbKey)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('shared_settings')
          .update({ setting_value: assetUrl, updated_at: new Date().toISOString() })
          .eq('setting_key', dbKey);
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('shared_settings')
          .insert({
            setting_key: dbKey,
            setting_value: assetUrl,
          });
        error = insertError;
      }

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Failed to save ${type} URL: ${error.message}`);
      }

      // Update local state
      if (type === 'appIcon') {
        setCurrentAppIcon(assetUrl);
        setAppIcon(null);
      } else if (type === 'favicon') {
        setCurrentFavicon(assetUrl);
        setFavicon(null);
      } else {
        setCurrentLogo(assetUrl);
        setLogo(null);
      }
      
      await updateManifestAndFavicon();

      const messages = {
        appIcon: "App icon updated successfully! This will be used for PWA installation and home screen icons.",
        favicon: "Favicon uploaded successfully! The new favicon will appear on browser tabs.",
        logo: "Logo updated successfully! This will be used for app branding and headers."
      };

      toast({
        title: "Success",
        description: messages[type],
      });
      
      // Refresh current assets to show updated asset
      await fetchCurrentAssets();
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      toast({
        title: "Upload Failed",
        description: error?.message || `Failed to upload ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* App Icon Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            App Icon · 192x192/512x512
          </CardTitle>
          <p className="text-sm text-muted-foreground">Main app icon for home screen and app stores (used for PWA)</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentAppIcon && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
              <img 
                src={currentAppIcon} 
                alt="Current app icon" 
                className="w-12 h-12 object-contain rounded"
                style={{ backgroundColor: 'transparent' }}
              />
              <span className="text-sm text-muted-foreground">Current app icon</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="app-icon-upload" className="text-sm font-medium">
              Select App Icon (PNG with transparent background recommended)
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="app-icon-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'appIcon')}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('app-icon-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              {appIcon && (
                <span className="text-sm text-muted-foreground">
                  {appIcon.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => saveAsset(appIcon!, 'appIcon')} 
              disabled={!appIcon || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Favicon Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Favicon · 32x32
          </CardTitle>
          <p className="text-sm text-muted-foreground">Small icon shown in browser tabs and bookmarks</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentFavicon && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
              <img 
                src={currentFavicon} 
                alt="Current favicon" 
                className="w-8 h-8 object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
              <span className="text-sm text-muted-foreground">Current favicon</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="favicon-upload" className="text-sm font-medium">
              Select Favicon (PNG with transparent background recommended)
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="favicon-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'favicon')}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('favicon-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              {favicon && (
                <span className="text-sm text-muted-foreground">
                  {favicon.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => saveAsset(favicon!, 'favicon')} 
              disabled={!favicon || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Logo · Variable Size
          </CardTitle>
          <p className="text-sm text-muted-foreground">Main brand logo for headers, splash screens, and general branding</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLogo && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
              <img 
                src={currentLogo} 
                alt="Current logo" 
                className="w-12 h-12 object-contain rounded"
                style={{ backgroundColor: 'transparent' }}
              />
              <span className="text-sm text-muted-foreground">Current logo</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="logo-upload" className="text-sm font-medium">
              Select Logo (PNG with transparent background recommended)
            </Label>
            <div className="flex items-center gap-3">
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'logo')}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
              {logo && (
                <span className="text-sm text-muted-foreground">
                  {logo.name}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => saveAsset(logo!, 'logo')} 
              disabled={!logo || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Author Profile Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Author Profile</span>
            <AuthorTooltip content="This configures the author information shown in tooltips throughout the app where you can leave personal insights for users." />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Author Image Upload */}
          <div className="space-y-3">
            <Label>Author Image</Label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={authorData.image}
                  alt="Author"
                  className="w-16 h-16 rounded-full object-cover border-2 border-border"
                />
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAuthorImageSelect(file);
                  }}
                  className="hidden"
                  id="author-image-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="author-image-upload"
                  className={`flex items-center space-x-2 px-4 py-2 border border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload author image</span>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: Square image, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Author Name */}
          <div className="space-y-2">
            <Label htmlFor="author-name">Author Name</Label>
            <Input
              id="author-name"
              value={authorDataDraft.name}
              onChange={(e) => handleAuthorDataChange('name', e.target.value)}
              placeholder="Enter author name"
              disabled={uploading}
            />
          </div>

          {/* Author Title */}
          <div className="space-y-2">
            <Label htmlFor="author-title">Tooltip Title</Label>
            <Input
              id="author-title"
              value={authorDataDraft.title}
              onChange={(e) => handleAuthorDataChange('title', e.target.value)}
              placeholder="e.g., Personal Insight, Author Note"
              disabled={uploading}
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <Button 
              onClick={saveAuthorInfo}
              disabled={!hasAuthorChanges || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? "Saving..." : "Save Author Info"}
            </Button>
            {hasAuthorChanges && (
              <p className="text-xs text-muted-foreground self-center">
                You have unsaved changes
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="flex items-center space-x-3 p-3 border border-border rounded-lg bg-muted/30">
              <AuthorTooltip content="This is how your tooltips will appear throughout the app. You can customize the image, name, and title above." />
              <span className="text-sm text-muted-foreground">
                Hover or click the icon to see your tooltip
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandAssetsManager;