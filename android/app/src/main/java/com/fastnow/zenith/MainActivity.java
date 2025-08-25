package com.fastnow.zenith;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import android.view.WindowManager;
import android.util.Log;
// Removed unused Firebase imports - now using Supabase directly
import androidx.annotation.NonNull;
import com.getcapacitor.BridgeActivity;

// Removed Firebase Authentication plugin import - now using Supabase directly

// Import Google Sign-In
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
// Removed unused Firebase imports - now using Supabase directly

// Removed Firebase Auth imports - now using Supabase directly

public class MainActivity extends BridgeActivity {
    
    private static final int RC_SIGN_IN = 9001;
    private GoogleSignInClient mGoogleSignInClient;
    // Removed Firebase Auth - now using Supabase directly
    
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Removed Firebase Auth initialization - now using Supabase directly
        
        // Configure Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();
        
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);
        
        // Removed Firebase Authentication plugin registration - now using Supabase directly
        
        hideSystemUI();
        configureWebView();
        handleOAuthIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleOAuthIntent(intent);
    }

    private void handleOAuthIntent(Intent intent) {
        if (intent != null && intent.getData() != null) {
            Uri data = intent.getData();
            String scheme = data.getScheme();
            String host = data.getHost();
            
            // Handle OAuth callback deep link
            if ("com.fastnow.zenith".equals(scheme) && "oauth".equals(host)) {
                // Force app back to fullscreen after OAuth
                hideSystemUI();
                
                // The Capacitor bridge will handle the OAuth callback
                // Just ensure we stay in native fullscreen mode
                if (getBridge() != null && getBridge().getWebView() != null) {
                    WebView webView = getBridge().getWebView();
                    webView.post(() -> {
                        // Re-apply native WebView settings
                        configureWebView();
                        hideSystemUI();
                    });
                }
            }
        }
    }

    private void hideSystemUI() {
        View decorView = getWindow().getDecorView();
        decorView.setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_FULLSCREEN
        );
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void configureWebView() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            // Enable local asset access - CRITICAL for app functionality
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            
            // CRITICAL: Remove ALL browser behavior and chrome
            webView.getSettings().setUserAgentString("FastNowApp/1.0 Native");
            webView.getSettings().setBuiltInZoomControls(false);
            webView.getSettings().setDisplayZoomControls(false);
            webView.getSettings().setSupportZoom(false);
            webView.getSettings().setLoadWithOverviewMode(false);
            webView.getSettings().setUseWideViewPort(false);
            
            // Remove browser interactions completely
            webView.setOnLongClickListener(v -> true);
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setLongClickable(false);
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            
            // Disable context menu and selection
            webView.setOnCreateContextMenuListener(null);
            webView.setTextClassifier(null);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            hideSystemUI();
        }
    }

    // Google Sign-In methods
    public void signInWithGoogle() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Result returned from launching the Intent from GoogleSignInApi.getSignInIntent(...);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                // Google Sign In was successful, now handled by Supabase
                GoogleSignInAccount account = task.getResult(ApiException.class);
                Log.d("GoogleSignIn", "Google Sign In successful: " + account.getId());
                // Token handling now done through Supabase OAuth flow
            } catch (ApiException e) {
                // Google Sign In failed, update UI appropriately
                Log.w("GoogleSignIn", "Google sign in failed", e);
            }
        }
    }

}