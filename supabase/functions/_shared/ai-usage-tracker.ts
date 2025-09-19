/**
 * AI Usage Tracker - Centralized logging for AI API usage and costs
 * This module handles consistent logging of AI model usage across all edge functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

// Model pricing in USD per 1K tokens
const MODEL_PRICING = {
  // GPT-5 Series
  'gpt-5-2025-08-07': { input: 0.05, output: 0.20 },
  'gpt-5-mini-2025-08-07': { input: 0.0035, output: 0.014 },
  'gpt-5-nano-2025-08-07': { input: 0.002, output: 0.008 },
  
  // O-Series (Reasoning)
  'o3-2025-04-16': { input: 0.15, output: 0.60 },
  'o4-mini-2025-04-16': { input: 0.03, output: 0.12 },
  
  // GPT-4.1 Series
  'gpt-4.1-2025-04-14': { input: 0.025, output: 0.10 },
  'gpt-4.1-mini-2025-04-14': { input: 0.0015, output: 0.006 },
  
  // Legacy Models
  'gpt-4o': { input: 0.025, output: 0.10 },
  'gpt-4o-mini': { input: 0.0015, output: 0.006 },
  
  // Audio Models
  'whisper-1': { input: 0.006, output: 0 }, // per minute
  'tts-1': { input: 0.015, output: 0 }, // per 1K characters
  'tts-1-hd': { input: 0.030, output: 0 }, // per 1K characters
} as const;

interface UsageLogData {
  user_id: string;
  feature_type: 'voice_analysis' | 'image_analysis' | 'text_to_speech' | 'transcription' | 'general';
  model_used: string;
  input_tokens?: number;
  output_tokens?: number;
  input_characters?: number; // For TTS
  audio_duration_seconds?: number; // For Whisper
  estimated_cost: number;
  success: boolean;
  error_message?: string;
  request_metadata?: any;
}

export class AIUsageTracker {
  private supabase;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  /**
   * Calculate cost based on model and usage
   */
  calculateCost(modelName: string, usage: {
    inputTokens?: number;
    outputTokens?: number;
    inputCharacters?: number;
    audioDurationSeconds?: number;
  }): number {
    const pricing = MODEL_PRICING[modelName as keyof typeof MODEL_PRICING];
    if (!pricing) {
      console.warn(`Unknown model pricing for: ${modelName}, using default`);
      return 0.001; // Default fallback cost
    }
    
    let cost = 0;
    
    // Token-based pricing (most models)
    if (usage.inputTokens || usage.outputTokens) {
      cost += (usage.inputTokens || 0) / 1000 * pricing.input;
      cost += (usage.outputTokens || 0) / 1000 * pricing.output;
    }
    
    // Character-based pricing (TTS)
    if (usage.inputCharacters) {
      cost += usage.inputCharacters / 1000 * pricing.input;
    }
    
    // Time-based pricing (Whisper)
    if (usage.audioDurationSeconds) {
      cost += usage.audioDurationSeconds / 60 * pricing.input; // per minute
    }
    
    return Math.round(cost * 100000) / 100000; // Round to 5 decimal places
  }
  
  /**
   * Log AI usage to database
   */
  async logUsage(data: UsageLogData): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_usage_logs')
        .insert({
          user_id: data.user_id,
          feature_type: data.feature_type,
          model_used: data.model_used,
          input_tokens: data.input_tokens,
          output_tokens: data.output_tokens,
          input_characters: data.input_characters,
          audio_duration_seconds: data.audio_duration_seconds,
          estimated_cost: data.estimated_cost,
          success: data.success,
          error_message: data.error_message,
          request_metadata: data.request_metadata,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Failed to log AI usage:', error);
      }
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }
  
  /**
   * Create a usage entry for OpenAI chat completion
   */
  async logChatCompletion(params: {
    userId: string;
    featureType: UsageLogData['feature_type'];
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
  }): Promise<number> {
    const cost = this.calculateCost(params.modelName, {
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens
    });
    
    await this.logUsage({
      user_id: params.userId,
      feature_type: params.featureType,
      model_used: params.modelName,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      estimated_cost: cost,
      success: params.success,
      error_message: params.errorMessage,
      request_metadata: params.metadata
    });
    
    return cost;
  }
  
  /**
   * Create a usage entry for Whisper transcription
   */
  async logTranscription(params: {
    userId: string;
    audioDurationSeconds: number;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
  }): Promise<number> {
    const modelName = 'whisper-1';
    const cost = this.calculateCost(modelName, {
      audioDurationSeconds: params.audioDurationSeconds
    });
    
    await this.logUsage({
      user_id: params.userId,
      feature_type: 'transcription',
      model_used: modelName,
      audio_duration_seconds: params.audioDurationSeconds,
      estimated_cost: cost,
      success: params.success,
      error_message: params.errorMessage,
      request_metadata: params.metadata
    });
    
    return cost;
  }
  
  /**
   * Create a usage entry for TTS
   */
  async logTextToSpeech(params: {
    userId: string;
    textLength: number;
    modelName?: string;
    success: boolean;
    errorMessage?: string;
    metadata?: any;
  }): Promise<number> {
    const modelName = params.modelName || 'tts-1';
    const cost = this.calculateCost(modelName, {
      inputCharacters: params.textLength
    });
    
    await this.logUsage({
      user_id: params.userId,
      feature_type: 'text_to_speech',
      model_used: modelName,
      input_characters: params.textLength,
      estimated_cost: cost,
      success: params.success,
      error_message: params.errorMessage,
      request_metadata: params.metadata
    });
    
    return cost;
  }
}

/**
 * Helper function to extract token usage from OpenAI response
 */
export function extractTokenUsage(openAIResponse: any): { inputTokens: number; outputTokens: number } {
  const usage = openAIResponse?.usage;
  
  return {
    inputTokens: usage?.prompt_tokens || usage?.input_tokens || 0,
    outputTokens: usage?.completion_tokens || usage?.output_tokens || 0
  };
}

/**
 * Helper function to estimate audio duration from file size (rough approximation)
 */
export function estimateAudioDuration(fileSizeBytes: number): number {
  // Rough estimate: assuming ~8KB per second for compressed audio
  return Math.max(1, Math.round(fileSizeBytes / 8000));
}