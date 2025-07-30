import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('Realtime chat function called');
  console.log('Request method:', req.method);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  console.log('Upgrade header:', upgradeHeader);

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log('Not a WebSocket request');
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    // Get connection token from query parameter
    const url = new URL(req.url);
    const connectionToken = url.searchParams.get('token');
    
    if (!connectionToken) {
      return new Response("Unauthorized - No connection token", { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify connection token and get user
    const { data: tokenData, error: tokenError } = await supabase
      .from('connection_tokens')
      .select('user_id, expires_at')
      .eq('token', connectionToken)
      .single();

    if (tokenError || !tokenData) {
      return new Response("Unauthorized - Invalid connection token", { status: 401 });
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      // Clean up expired token
      await supabase
        .from('connection_tokens')
        .delete()
        .eq('token', connectionToken);
      
      return new Response("Unauthorized - Connection token expired", { status: 401 });
    }

    // Get user profile with model preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('speech_model, use_own_api_key')
      .eq('user_id', tokenData.user_id)
      .single();

    // Get shared settings for default models
    const { data: sharedSettings } = await supabase
      .from('shared_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['default_speech_model', 'shared_openai_key']);

    const settings = Object.fromEntries(
      sharedSettings?.map(s => [s.setting_key, s.setting_value]) || []
    );

    // Determine which API key and model to use
    let apiKey = '';
    let speechModel = 'gpt-4o-realtime-preview-2024-12-17'; // Correct OpenAI Realtime model

    if (profile?.use_own_api_key) {
      // User should provide their own key via localStorage (handled in frontend)
      speechModel = profile.speech_model || 'gpt-4o-realtime-preview-2024-12-17';
    } else {
      // Use shared API key
      apiKey = settings.shared_openai_key;
      speechModel = settings.default_speech_model || 'gpt-4o-realtime-preview-2024-12-17';
    }

    if (!apiKey && !profile?.use_own_api_key) {
      return new Response("No API key configured", { status: 500 });
    }

    // Delete the used connection token for security
    await supabase
      .from('connection_tokens')
      .delete()
      .eq('token', connectionToken);

    const { socket, response } = Deno.upgradeWebSocket(req);
    let openAISocket: WebSocket | null = null;

    socket.onopen = () => {
      console.log('Client connected to relay');
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'start_session') {
          // Use provided API key for own-key users
          const finalApiKey = message.apiKey || apiKey;
          
          console.log('Start session - User API key:', !!message.apiKey, 'Shared API key:', !!apiKey, 'Final API key:', !!finalApiKey);
          
          if (!finalApiKey) {
            console.error('No API key available');
            socket.send(JSON.stringify({ 
              type: 'error', 
              message: 'No API key provided. Please add your OpenAI API key in Settings.' 
            }));
            return;
          }

          // Connect to OpenAI Realtime API
          openAISocket = new WebSocket(
            `wss://api.openai.com/v1/realtime?model=${speechModel}`,
            ['realtime', `Bearer.${finalApiKey}`]
          );

          openAISocket.onopen = () => {
            console.log('Connected to OpenAI Realtime API');
            
            // Send session configuration after connection
            const sessionConfig = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: `You are a helpful fasting companion AI assistant. You help users with their intermittent fasting journey by providing motivation, answering questions about fasting, and offering supportive guidance. Be encouraging, knowledgeable about fasting science, and personally supportive. Keep responses concise but warm.`,
                voice: "alloy",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: {
                  model: "whisper-1"
                },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1000
                },
                tools: [],
                tool_choice: "auto",
                temperature: 0.8,
                max_response_output_tokens: "inf"
              }
            };
            
            openAISocket?.send(JSON.stringify(sessionConfig));
          };

          openAISocket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            
            // Log usage for cost tracking
            if (data.type === 'response.done') {
              const usage = data.response?.usage;
              if (usage) {
                await supabase.from('ai_usage_logs').insert({
                  user_id: tokenData.user_id,
                  request_type: 'realtime_chat',
                  model_used: speechModel,
                  tokens_used: (usage.input_tokens || 0) + (usage.output_tokens || 0),
                  estimated_cost: calculateCost(usage, speechModel)
                });
              }
            }
            
            // Forward message to client
            socket.send(event.data);
          };

          openAISocket.onerror = (error) => {
            console.error('OpenAI WebSocket error:', error);
            socket.send(JSON.stringify({ 
              type: 'error', 
              message: 'Connection to AI service failed' 
            }));
          };

          openAISocket.onclose = () => {
            console.log('OpenAI WebSocket closed');
            socket.send(JSON.stringify({ 
              type: 'session_ended' 
            }));
          };

        } else if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          // Forward other messages to OpenAI
          openAISocket.send(event.data);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({ 
          type: 'error', 
          message: 'Failed to process message' 
        }));
      }
    };

    socket.onclose = () => {
      console.log('Client disconnected');
      if (openAISocket) {
        openAISocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (openAISocket) {
        openAISocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error('Error in realtime-chat function:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

function calculateCost(usage: any, model: string): number {
  // Cost calculation based on current OpenAI pricing
  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4o-realtime-preview-2024-12-17': { input: 0.000005000, output: 0.000020000 }
  };
  
  const modelCost = costs[model] || costs['gpt-4o-realtime-preview-2024-12-17'];
  const inputCost = (usage.input_tokens || 0) * modelCost.input;
  const outputCost = (usage.output_tokens || 0) * modelCost.output;
  
  return inputCost + outputCost;
}
