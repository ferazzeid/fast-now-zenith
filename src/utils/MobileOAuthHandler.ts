import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

interface OAuthResult {
  success: boolean;
  error?: string;
  session?: any;
}

interface OAuthState {
  timestamp: number;
  inProgress: boolean;
  provider: string;
}

export class MobileOAuthHandler {
  private listeners: Array<() => void> = [];
  private isAuthInProgress = false;
  private authTimeout?: NodeJS.Timeout;
  private authStartTime = 0;
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly OAUTH_STATE_KEY = 'oauth_recovery_state';

  constructor() {
    this.cleanup = this.cleanup.bind(this);
    this.loadOAuthState();
  }

  /**
   * Check if we're running on a native mobile platform
   */
  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Generate OAuth URL with mobile-specific configuration
   */
  private async generateOAuthUrl(): Promise<string> {
    const redirectUrl = this.isNativePlatform() 
      ? 'com.fastnow.zenith://oauth/callback'
      : `${window.location.origin}/oauth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(`OAuth URL generation failed: ${error.message}`);
    }

    if (!data.url) {
      throw new Error('OAuth URL not generated');
    }

    return data.url;
  }

  /**
   * Handle app state changes (when user returns from browser)
   */
  private async handleAppStateChange(state: { isActive: boolean }) {
    if (!this.isAuthInProgress) return;
    
    console.log(`🔄 [${new Date().toISOString()}] App state changed:`, state.isActive);
    
    if (state.isActive) {
      console.log(`📱 [${new Date().toISOString()}] App resumed - OAuth completed, letting auth store handle session`);
      await this.handleAuthSuccess();
    }
  }

  /**
   * Handle deep link fallback
   */
  private async handleDeepLink(data: { url: string }) {
    if (!this.isAuthInProgress) return;
    
    console.log(`🔗 [${new Date().toISOString()}] Deep link received:`, data.url);
    
    if (data.url.includes('oauth/callback')) {
      await this.handleOAuthCallback(data.url);
    }
  }


  /**
   * Handle OAuth callback URL (deep link fallback)
   */
  private async handleOAuthCallback(url: string): Promise<void> {
    try {
      console.log('🔄 Processing OAuth callback:', url);
      
      // Convert custom scheme URL to HTTPS format if needed
      let processedUrl = url;
      if (url.startsWith('com.fastnow.zenith://')) {
        const urlObj = new URL(url);
        processedUrl = `https://go.fastnow.app${urlObj.pathname}${urlObj.search}`;
        console.log('✅ Converted URL:', processedUrl);
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(processedUrl);

      if (error) {
        console.error('❌ OAuth session exchange failed:', error.message);
        await this.handleAuthError(`Session exchange failed: ${error.message}`);
        return;
      }

      if (data.session?.user?.id) {
        console.log('✅ OAuth session exchanged successfully:', {
          userId: data.session.user.id,
          email: data.session.user.email
        });
        
        // Validate session with retries before success
        const isValid = await this.validateSessionWithRetries(data.session);
        if (isValid) {
          console.log('✅ Session validated successfully');
          await this.handleAuthSuccess();
        } else {
          console.error('❌ Session validation failed');
          await this.handleAuthError('Session validation failed');
        }
      } else {
        console.error('❌ Session exchange returned no valid session');
        await this.handleAuthError('Session exchange returned invalid session');
      }
    } catch (error) {
      console.error('❌ OAuth callback processing error:', error);
      await this.handleAuthError('OAuth callback processing failed');
    }
  }

  /**
   * Handle successful authentication
   */
  private async handleAuthSuccess(): Promise<void> {
    console.log(`✅ [${new Date().toISOString()}] OAuth flow completed successfully`);
    
    this.clearOAuthState();
    this.cleanup();
    
    // Close browser if still open
    try {
      await Browser.close();
    } catch {
      // Browser might already be closed
    }

    // Trigger auth success callback - let auth store handle session
    if (this.onAuthComplete) {
      this.onAuthComplete({ success: true });
    }
  }

  /**
   * Handle authentication error
   */
  private async handleAuthError(error: string): Promise<void> {
    console.error(`❌ [${new Date().toISOString()}] OAuth authentication failed:`, error);
    
    this.clearOAuthState();
    this.cleanup();
    
    // Close browser if still open
    try {
      await Browser.close();
    } catch {
      // Browser might already be closed
    }

    // Trigger auth error callback
    if (this.onAuthComplete) {
      this.onAuthComplete({ success: false, error });
    }
  }

  /**
   * Set up listeners for app state and deep links
   */
  private async setupListeners(): Promise<void> {
    if (!this.isNativePlatform()) {
      console.log('🌐 Web platform detected - using web OAuth flow');
      return;
    }

    try {
      // Listen for app state changes
      const appStateListener = await App.addListener('appStateChange', this.handleAppStateChange.bind(this));
      this.listeners.push(() => appStateListener.remove());

      // Listen for deep links as fallback
      const urlListener = await App.addListener('appUrlOpen', this.handleDeepLink.bind(this));
      this.listeners.push(() => urlListener.remove());

      console.log('🎧 Mobile OAuth listeners setup complete');
    } catch (error) {
      console.error('❌ Failed to setup OAuth listeners:', error);
    }
  }

  /**
   * Cleanup listeners and timeouts
   */
  private cleanup(): void {
    console.log('🧹 Cleaning up OAuth handlers');
    
    this.isAuthInProgress = false;
    
    // Remove all listeners
    this.listeners.forEach(remove => {
      try {
        remove();
      } catch (error) {
        console.warn('Warning: Failed to remove listener:', error);
      }
    });
    this.listeners = [];

    // Clear timeout
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = undefined;
    }
  }

  private onAuthComplete?: (result: OAuthResult) => void;

  /**
   * Start Google OAuth flow
   */
  public async signInWithGoogle(): Promise<OAuthResult> {
    if (this.isAuthInProgress) {
      console.log(`🔄 [${new Date().toISOString()}] OAuth already in progress, skipping new request`);
      return { success: false, error: 'OAuth already in progress' };
    }

    return new Promise(async (resolve) => {
      this.onAuthComplete = resolve;
      this.isAuthInProgress = true;
      this.authStartTime = Date.now(); // Record start time for performance tracking

      try {
        console.log(`🚀 [${new Date().toISOString()}] Starting Google OAuth flow`);

        // Save OAuth state for recovery
        this.saveOAuthState('google');

        // Setup listeners first
        await this.setupListeners();

        // Set timeout for user interaction (5 minutes)
        this.authTimeout = setTimeout(() => {
          console.log(`⏰ [${new Date().toISOString()}] OAuth timeout - user took too long to complete authentication`);
          this.handleAuthError('Authentication timeout - please try again');
        }, this.TIMEOUT_MS);

        // Generate OAuth URL
        const oauthUrl = await this.generateOAuthUrl();
        console.log(`🔗 [${new Date().toISOString()}] Generated OAuth URL`);

        if (this.isNativePlatform()) {
          // Open system browser on mobile
          console.log(`📱 [${new Date().toISOString()}] Opening system browser for OAuth`);
          await Browser.open({
            url: oauthUrl,
            windowName: '_system',
          });
          
          console.log(`🎯 [${new Date().toISOString()}] Waiting for user to complete OAuth and return to app...`);
        } else {
          // Fallback to web flow
          console.log(`🌐 [${new Date().toISOString()}] Redirecting to OAuth in web browser`);
          window.location.href = oauthUrl;
        }

      } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] OAuth initialization failed:`, error);
        await this.handleAuthError(
          error instanceof Error ? error.message : 'OAuth initialization failed'
        );
      }
    });
  }

  /**
   * Cancel ongoing OAuth process
   */
  public cancelAuth(): void {
    if (this.isAuthInProgress) {
      console.log('🚫 Cancelling OAuth process');
      this.handleAuthError('Authentication cancelled by user');
    }
  }

  private saveOAuthState(provider: string): void {
    try {
      const state: OAuthState = {
        timestamp: Date.now(),
        inProgress: true,
        provider
      };
      localStorage.setItem(MobileOAuthHandler.OAUTH_STATE_KEY, JSON.stringify(state));
      console.log('[MobileOAuth] OAuth state saved:', state);
    } catch (error) {
      console.error('[MobileOAuth] Failed to save OAuth state:', error);
    }
  }

  private loadOAuthState(): void {
    try {
      const stateJson = localStorage.getItem(MobileOAuthHandler.OAUTH_STATE_KEY);
      if (stateJson) {
        const state: OAuthState = JSON.parse(stateJson);
        console.log('[MobileOAuth] Loaded OAuth state:', state);
        
        // Check if state is recent and valid
        const elapsed = Date.now() - state.timestamp;
        if (elapsed > 5 * 60 * 1000) { // 5 minutes
          console.log('[MobileOAuth] OAuth state expired, clearing');
          this.clearOAuthState();
        }
      }
    } catch (error) {
      console.error('[MobileOAuth] Failed to load OAuth state:', error);
      this.clearOAuthState();
    }
  }

  private clearOAuthState(): void {
    try {
      localStorage.removeItem(MobileOAuthHandler.OAUTH_STATE_KEY);
      console.log('[MobileOAuth] OAuth state cleared');
    } catch (error) {
      console.error('[MobileOAuth] Failed to clear OAuth state:', error);
    }
  }

  private async validateSessionWithRetries(session: any, maxRetries: number = 3): Promise<boolean> {
    let retries = maxRetries;
    
    while (retries > 0) {
      try {
        console.log(`[MobileOAuth] Validating session (attempt ${maxRetries - retries + 1}/${maxRetries})`);
        
        // Try to use the session by making a simple authenticated request
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.warn('[MobileOAuth] Session validation failed:', error.message);
          retries--;
          if (retries > 0) {
            const delay = (maxRetries - retries) * 1000; // Exponential backoff
            console.log(`[MobileOAuth] Retrying session validation in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          return false;
        }

        if (data?.user) {
          console.log('[MobileOAuth] Session validation successful:', {
            userId: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata?.provider
          });
          return true;
        } else {
          console.warn('[MobileOAuth] No user in session validation response');
          retries--;
        }
      } catch (error) {
        console.error('[MobileOAuth] Session validation attempt failed:', error);
        retries--;
        if (retries > 0) {
          const delay = (maxRetries - retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error('[MobileOAuth] Session validation failed after all retries');
    return false;
  }
}