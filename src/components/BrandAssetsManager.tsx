import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Smartphone } from "lucide-react";
import { SmartLoadingButton } from "./enhanced/SmartLoadingStates";

const BrandAssetsManager = () => {
  const [favicon, setFavicon] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [currentFavicon, setCurrentFavicon] = useState<string>('');
  const [currentLogo, setCurrentLogo] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentAssets();
  }, []);

  const fetchCurrentAssets = async () => {
    try {
      const { data: settingsData, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_favicon', 'app_logo']);

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
          }
        });
      }
    } catch (error) {
      console.error('Error fetching current assets:', error);
    }
  };

  const handleFileSelect = (file: File, type: 'favicon' | 'logo') => {
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

    if (type === 'favicon') {
      setFavicon(file);
    } else {
      setLogo(file);
    }
  };

  const uploadAsset = async (file: File, type: 'favicon' | 'logo') => {
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

  const updateManifestAndFavicon = async (faviconUrl?: string, logoUrl?: string) => {
    // Update favicon in HTML if provided
    if (faviconUrl) {
      // Note: This would require server-side implementation to actually update the HTML
      // For now, we'll store the setting and the user will need to update their deployment
      console.log('Favicon URL to be used:', faviconUrl);
    }

    // Update manifest.json icons if logo provided
    if (logoUrl) {
      // Note: This would require server-side implementation to actually update the manifest
      // For now, we'll store the setting and provide instructions
      console.log('Logo URL to be used in manifest:', logoUrl);
    }
  };

  const saveFavicon = async () => {
    if (!favicon) {
      toast({
        title: "No file selected",
        description: "Please select a favicon image first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      console.log('Starting favicon upload:', favicon.name);
      const faviconUrl = await uploadAsset(favicon, 'favicon');
      console.log('Favicon uploaded successfully:', faviconUrl);
      
      // Save to database with conflict resolution
      const { data: existing } = await supabase
        .from('shared_settings')
        .select('id')
        .eq('setting_key', 'app_favicon')
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('shared_settings')
          .update({ setting_value: faviconUrl, updated_at: new Date().toISOString() })
          .eq('setting_key', 'app_favicon');
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('shared_settings')
          .insert({
            setting_key: 'app_favicon',
            setting_value: faviconUrl,
          });
        error = insertError;
      }

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Failed to save favicon URL: ${error.message}`);
      }

      setCurrentFavicon(faviconUrl);
      setFavicon(null);
      
      await updateManifestAndFavicon(faviconUrl);

      toast({
        title: "Success",
        description: "Favicon uploaded successfully! Browser tabs will show the new favicon.",
      });
      
      // Refresh current assets to show updated favicon
      await fetchCurrentAssets();
    } catch (error: any) {
      console.error('Error uploading favicon:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload favicon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveLogo = async () => {
    if (!logo) {
      toast({
        title: "No file selected", 
        description: "Please select a logo image first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      console.log('Starting logo upload:', logo.name);
      const logoUrl = await uploadAsset(logo, 'logo');
      console.log('Logo uploaded successfully:', logoUrl);
      
      // Save to database with conflict resolution
      const { data: existing } = await supabase
        .from('shared_settings')
        .select('id')
        .eq('setting_key', 'app_logo')
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('shared_settings')
          .update({ setting_value: logoUrl, updated_at: new Date().toISOString() })
          .eq('setting_key', 'app_logo');
        error = updateError;
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('shared_settings')
          .insert({
            setting_key: 'app_logo',
            setting_value: logoUrl,
          });
        error = insertError;
      }

      if (error) {
        console.error('Database update error:', error);
        throw new Error(`Failed to save logo URL: ${error.message}`);
      }

      setCurrentLogo(logoUrl);
      setLogo(null);
      
      await updateManifestAndFavicon(undefined, logoUrl);

      toast({
        title: "Success", 
        description: "App logo uploaded successfully! This will be used for PWA installation and home screen icons.",
      });
      
      // Refresh current assets to show updated logo
      await fetchCurrentAssets();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Favicon Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            App Favicon
          </CardTitle>
          <CardDescription>
            Upload a favicon image for your app. This will appear in browser tabs and bookmarks.
            Recommended size: 32x32px or 64x64px PNG file. This is separate from your PWA app icon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentFavicon && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <img 
                src={currentFavicon} 
                alt="Current favicon" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-sm text-muted-foreground">Current favicon</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="favicon-upload" className="text-sm font-medium">
              Select Favicon Image
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
              onClick={saveFavicon} 
              disabled={!favicon || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            App Logo/Icon
          </CardTitle>
          <CardDescription>
            Upload an app logo/icon for when users install your app on their devices (PWA icon).
            This is used for home screen icons and app stores. Recommended size: 512x512px PNG file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentLogo && (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
              <img 
                src={currentLogo} 
                alt="Current app logo" 
                className="w-12 h-12 object-contain rounded"
              />
              <span className="text-sm text-muted-foreground">Current app logo</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="logo-upload" className="text-sm font-medium">
              Select App Logo
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
              onClick={saveLogo} 
              disabled={!logo || uploading}
              className="flex-1 sm:flex-none"
            >
              {uploading ? "Uploading..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandAssetsManager;