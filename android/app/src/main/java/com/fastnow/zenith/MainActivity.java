package com.fastnow.zenith;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register plugins
        registerPlugin(io.capawesome.capacitorjs.plugins.firebase.authentication.FirebaseAuthenticationPlugin.class);
    }
}
