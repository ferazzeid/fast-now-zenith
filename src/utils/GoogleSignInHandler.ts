import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from '@/integrations/supabase/client';

interface OAuthResult {
  success: boolean;
  error?: string;
  session?: any;
}

export class GoogleSignInHandler {
  private isAuthInProgress = false;

  constructor() {
    this.initializeGoogleAuth();
  }

  /**
   * Initialize Google Auth plugin with configuration
   */
  private async initializeGoogleAuth(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('🌐 Web platform - Google Auth will use web flow');
      return;
    }

    try {
      await GoogleAuth.initialize({
        clientId: 'YOUR_WEB_CLIENT_ID_HERE', // This will be the Web client ID from Google Cloud
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      console.log('✅ Google Auth initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Auth:', error);
    }
  }

  /**
   * Check if we're running on a native mobile platform
   */
  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Start Google Sign-In flow using native SDK
   */
  public async signInWithGoogle(): Promise<OAuthResult> {
    if (this.isAuthInProgress) {
      console.log('🔄 Google Sign-In already in progress, skipping new request');
      return { success: false, error: 'Sign-in already in progress' };
    }

    this.isAuthInProgress = true;

    try {
      console.log('🚀 Starting native Google Sign-In flow');

      if (!this.isNativePlatform()) {
        // Fallback to web OAuth for web platform
        return await this.signInWithGoogleWeb();
      }

      // Native platform - use Google Auth plugin
      const googleUser = await GoogleAuth.signIn();
      
      if (!googleUser.authentication?.idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('✅ Google Sign-In successful, exchanging token with Supabase');

      // Exchange Google ID token with Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.authentication.idToken,
      });

      if (error) {
        throw new Error(`Supabase token exchange failed: ${error.message}`);
      }

      if (!data.session?.user?.id) {
        throw new Error('No valid session received from Supabase');
      }

      console.log('✅ Authentication completed successfully:', {
        userId: data.session.user.id,
        email: data.session.user.email,
      });

      this.isAuthInProgress = false;
      return { success: true, session: data.session };

    } catch (error) {
      console.error('❌ Google Sign-In failed:', error);
      this.isAuthInProgress = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Google Sign-In failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fallback web OAuth flow for web platform
   */
  private async signInWithGoogleWeb(): Promise<OAuthResult> {
    try {
      console.log('🌐 Using web OAuth flow');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        throw new Error(`Web OAuth failed: ${error.message}`);
      }

      this.isAuthInProgress = false;
      return { success: true };

    } catch (error) {
      console.error('❌ Web OAuth failed:', error);
      this.isAuthInProgress = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Web OAuth failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out from Google
   */
  public async signOut(): Promise<void> {
    try {
      if (this.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
      console.log('✅ Google Sign-Out completed');
    } catch (error) {
      console.error('❌ Google Sign-Out failed:', error);
    }
  }

  /**
   * Cancel ongoing authentication process
   */
  public async cancelAuth(): Promise<void> {
    if (this.isAuthInProgress) {
      console.log('🚫 Cancelling Google Sign-In process');
      this.isAuthInProgress = false;
    }
  }
}