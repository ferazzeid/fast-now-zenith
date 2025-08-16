import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useAdminImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { user, session } = useAuth();
  const { toast } = useToast();

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file || !user || !session) {
      toast({
        title: "Error",
        description: "Authentication required for image upload",
        variant: "destructive"
      });
      return null;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive"
      });
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return null;
    }

    setIsUploading(true);
    
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-admin-upload.${fileExt}`;
      
      console.log('🔄 Starting admin image upload:', {
        fileName,
        fileSize: file.size,
        fileType: file.type,
        userId: user.id
      });

      // Upload directly using the service role client context
      const { data, error } = await supabase.storage
        .from('motivator-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('motivator-images')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('✅ Upload successful:', urlData.publicUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });

      return urlData.publicUrl;

    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    if (!imageUrl || !user) return false;

    try {
      // Extract path from URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'motivator-images');
      
      if (bucketIndex === -1) {
        console.warn('Could not extract path from URL:', imageUrl);
        return false;
      }
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      
      const { error } = await supabase.storage
        .from('motivator-images')
        .remove([filePath]);
        
      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    isUploading
  };
};