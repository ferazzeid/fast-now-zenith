// Enhanced conversation memory system with cross-session context
import { supabase } from "@/integrations/supabase/client";

// Types for conversation memory
export interface ConversationContext {
  recentFoodActions: FoodAction[];
  conversationState: ConversationState;
  userPreferences: UserPreferences;
  workingMemory: WorkingMemoryItem[];
}

export interface FoodAction {
  id: string;
  timestamp: Date;
  type: 'add' | 'modify' | 'delete';
  foods: {
    name: string;
    serving_size: number;
    calories: number;
    carbs: number;
    originalRequest?: string;
  }[];
  userMessage: string;
}

export interface ConversationState {
  currentTopic: string;
  isProcessingFood: boolean;
  lastFoodAction?: FoodAction;
  awaitingClarification: boolean;
  sessionType: 'general' | 'food_tracking' | 'fasting' | 'walking';
}

export interface UserPreferences {
  preferredUnits: string;
  commonFoods: string[];
  typicalServingSizes: Record<string, number>;
  frequentClarifications: string[];
}

export interface WorkingMemoryItem {
  id: string;
  type: 'food' | 'session' | 'preference' | 'calculation';
  content: any;
  timestamp: Date;
  relevanceScore: number;
  expiresAt: Date;
}

// Types for cross-session context
interface CrossSessionContext {
  preferred_units: string;
  common_foods: string[];
  typical_serving_sizes: Record<string, number>;
  frequent_clarifications: string[];
  conversation_patterns: Record<string, any>;
  food_preferences: Record<string, any>;
}

interface ConversationSummary {
  summary_type: 'daily' | 'weekly' | 'food_patterns' | 'preferences';
  summary_data: Record<string, any>;
  date_range_start: string;
  date_range_end: string;
  relevance_score: number;
}

export class ConversationMemoryManager {
  private context: ConversationContext;
  private maxWorkingMemoryItems = 20;
  private maxFoodActions = 10;
  private crossSessionContext: CrossSessionContext | null = null;
  private userId: string | null = null;

  constructor() {
    this.context = {
      recentFoodActions: [],
      conversationState: {
        currentTopic: 'general',
        isProcessingFood: false,
        awaitingClarification: false,
        sessionType: 'general'
      },
      userPreferences: {
        preferredUnits: 'imperial',
        commonFoods: [],
        typicalServingSizes: {},
        frequentClarifications: []
      },
      workingMemory: []
    };
  }

  // Initialize with user context for cross-session functionality
  async initializeWithUser(userId: string) {
    this.userId = userId;
    await this.loadCrossSessionContext();
    this.applyContextToCurrentSession();
  }

  // Load persistent context from database
  private async loadCrossSessionContext() {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('user_conversation_context')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error loading cross-session context:', error);
        return;
      }

      if (data) {
        this.crossSessionContext = {
          preferred_units: data.preferred_units || 'imperial',
          common_foods: (data.common_foods as string[]) || [],
          typical_serving_sizes: (data.typical_serving_sizes as Record<string, number>) || {},
          frequent_clarifications: (data.frequent_clarifications as string[]) || [],
          conversation_patterns: (data.conversation_patterns as Record<string, any>) || {},
          food_preferences: (data.food_preferences as Record<string, any>) || {}
        };
      }
    } catch (error) {
      console.error('Failed to load cross-session context:', error);
    }
  }

  // Apply cross-session context to current session
  private applyContextToCurrentSession() {
    if (!this.crossSessionContext) return;

    // Apply preferences
    this.context.userPreferences.preferredUnits = this.crossSessionContext.preferred_units;
    this.context.userPreferences.commonFoods = this.crossSessionContext.common_foods;
    this.context.userPreferences.typicalServingSizes = this.crossSessionContext.typical_serving_sizes;
    this.context.userPreferences.frequentClarifications = this.crossSessionContext.frequent_clarifications;

    // Add common foods to working memory for immediate context
    if (this.crossSessionContext.common_foods.length > 0) {
      this.addToWorkingMemory(
        'preference',
        `User commonly eats: ${this.crossSessionContext.common_foods.slice(0, 8).join(', ')}`,
        0.9,
        120 // 2 hours TTL
      );
    }

    // Add frequent clarifications to working memory
    if (this.crossSessionContext.frequent_clarifications.length > 0) {
      this.addToWorkingMemory(
        'preference',
        `User often needs clarification about: ${this.crossSessionContext.frequent_clarifications.slice(0, 3).join(', ')}`,
        0.8,
        120
      );
    }
  }

  // Save current session learnings to persistent storage
  async saveCrossSessionLearnings() {
    if (!this.userId) return;

    try {
      // Extract learnings from current session
      const learnings = this.extractSessionLearnings();
      
      // Merge with existing context
      const updatedContext = this.mergeLearnings(learnings);

      // Upsert to database
      const { error } = await supabase
        .from('user_conversation_context')
        .upsert({
          user_id: this.userId,
          preferred_units: updatedContext.preferred_units,
          common_foods: updatedContext.common_foods,
          typical_serving_sizes: updatedContext.typical_serving_sizes,
          frequent_clarifications: updatedContext.frequent_clarifications,
          conversation_patterns: updatedContext.conversation_patterns,
          food_preferences: updatedContext.food_preferences
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving cross-session context:', error);
      }

      // Update local cross-session context
      this.crossSessionContext = updatedContext;
    } catch (error) {
      console.error('Failed to save cross-session learnings:', error);
    }
  }

  // Extract learnings from current conversation session
  private extractSessionLearnings(): Partial<CrossSessionContext> {
    const learnings: Partial<CrossSessionContext> = {};

    // Learn from food actions
    const foodNames = this.context.recentFoodActions.flatMap(action => 
      action.foods.map(food => food.name)
    );
    const uniqueFoods = [...new Set(foodNames)];
    
    if (uniqueFoods.length > 0) {
      learnings.common_foods = uniqueFoods;
    }

    // Learn serving size preferences
    const servingSizes: Record<string, number> = {};
    this.context.recentFoodActions.forEach(action => {
      action.foods.forEach(food => {
        if (food.serving_size && food.name) {
          servingSizes[food.name] = food.serving_size;
        }
      });
    });
    
    if (Object.keys(servingSizes).length > 0) {
      learnings.typical_serving_sizes = servingSizes;
    }

    // Learn preferred units
    if (this.context.userPreferences.preferredUnits) {
      learnings.preferred_units = this.context.userPreferences.preferredUnits;
    }

    return learnings;
  }

  // Merge new learnings with existing cross-session context
  private mergeLearnings(learnings: Partial<CrossSessionContext>): CrossSessionContext {
    const baseContext = this.crossSessionContext || {
      preferred_units: 'imperial',
      common_foods: [],
      typical_serving_sizes: {},
      frequent_clarifications: [],
      conversation_patterns: {},
      food_preferences: {}
    };

    return {
      preferred_units: learnings.preferred_units || baseContext.preferred_units,
      common_foods: this.mergeArrays(baseContext.common_foods, learnings.common_foods || []),
      typical_serving_sizes: { ...baseContext.typical_serving_sizes, ...learnings.typical_serving_sizes },
      frequent_clarifications: this.mergeArrays(baseContext.frequent_clarifications, learnings.frequent_clarifications || []),
      conversation_patterns: { ...baseContext.conversation_patterns, ...learnings.conversation_patterns },
      food_preferences: { ...baseContext.food_preferences, ...learnings.food_preferences }
    };
  }

  // Helper to merge arrays while keeping most recent/frequent items
  private mergeArrays<T>(existing: T[], newItems: T[], maxLength = 20): T[] {
    const combined = [...newItems, ...existing];
    const unique = [...new Set(combined)];
    return unique.slice(0, maxLength);
  }

  // Load relevant conversation summaries for context
  async loadRelevantSummaries(summaryTypes: string[] = ['food_patterns', 'preferences']): Promise<ConversationSummary[]> {
    if (!this.userId) return [];

    try {
      const { data, error } = await supabase
        .from('conversation_summaries')
        .select('*')
        .eq('user_id', this.userId)
        .in('summary_type', summaryTypes)
        .order('relevance_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error loading conversation summaries:', error);
        return [];
      }

      return data?.map(item => ({
        summary_type: item.summary_type as 'daily' | 'weekly' | 'food_patterns' | 'preferences',
        summary_data: item.summary_data as Record<string, any>,
        date_range_start: item.date_range_start,
        date_range_end: item.date_range_end,
        relevance_score: item.relevance_score
      })) || [];
    } catch (error) {
      console.error('Failed to load conversation summaries:', error);
      return [];
    }
  }

  // Create a conversation summary for long-term storage
  async createConversationSummary(
    summaryType: 'daily' | 'weekly' | 'food_patterns' | 'preferences',
    summaryData: Record<string, any>,
    dateRangeStart: Date,
    dateRangeEnd: Date,
    relevanceScore: number = 100
  ) {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('conversation_summaries')
        .insert({
          user_id: this.userId,
          summary_type: summaryType,
          summary_data: summaryData,
          date_range_start: dateRangeStart.toISOString().split('T')[0],
          date_range_end: dateRangeEnd.toISOString().split('T')[0],
          relevance_score: relevanceScore
        });

      if (error) {
        console.error('Error creating conversation summary:', error);
      }
    } catch (error) {
      console.error('Failed to create conversation summary:', error);
    }
  }

  // Add a food action to memory
  addFoodAction(userMessage: string, foods: any[], type: 'add' | 'modify' | 'delete' = 'add') {
    const action: FoodAction = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      foods: foods.map(food => ({
        name: food.name,
        serving_size: food.serving_size,
        calories: food.calories,
        carbs: food.carbs,
        originalRequest: userMessage
      })),
      userMessage
    };

    this.context.recentFoodActions.unshift(action);
    this.context.recentFoodActions = this.context.recentFoodActions.slice(0, this.maxFoodActions);
    this.context.conversationState.lastFoodAction = action;
    
    // Learn from this food action
    this.learnFromFoodAction(action);
  }

  // Learn patterns from food actions
  private learnFromFoodAction(action: FoodAction) {
    action.foods.forEach(food => {
      // Update common foods
      if (!this.context.userPreferences.commonFoods.includes(food.name)) {
        this.context.userPreferences.commonFoods.unshift(food.name);
        this.context.userPreferences.commonFoods = this.context.userPreferences.commonFoods.slice(0, 30);
      }
      
      // Update typical serving sizes
      this.context.userPreferences.typicalServingSizes[food.name] = food.serving_size;
    });
  }

  // Detect if a message is a food clarification
  detectFoodClarification(message: string): { isModification: boolean; targetAction?: FoodAction; modifications: any } {
    const message_lower = message.toLowerCase();
    const clarificationPatterns = [
      /each (.*?) (?:has|is|weighs) (\d+)g/i,
      /each (.*?) (?:has|is) (\d+) (?:grams|g)/i,
      /there are (?:actually )?(\d+) (.*?)s?$/i,
      /(\d+)g each/i,
      /make that (\d+) (.*?)s?/i,
      /actually (\d+) (.*?)s?/i,
      /each yogurt.*?(\d+)g/i,
      /per (.*?) (\d+)g/i
    ];

    // Check if this looks like a clarification
    const isLikelyClarification = clarificationPatterns.some(pattern => pattern.test(message)) ||
      message_lower.includes('each') || 
      message_lower.includes('actually') ||
      message_lower.includes('per') ||
      (message_lower.includes('there are') && /\d+/.test(message));

    if (!isLikelyClarification || this.context.recentFoodActions.length === 0) {
      return { isModification: false, modifications: {} };
    }

    const lastAction = this.context.recentFoodActions[0];
    const timeDiff = Date.now() - lastAction.timestamp.getTime();
    
    // Only consider it a modification if it's within 2 minutes of the last food action
    if (timeDiff > 120000) {
      return { isModification: false, modifications: {} };
    }

    // Parse specific modifications
    const modifications: any = {};
    
    // Check for serving size modifications (handle both "g" and "grams")
    const servingMatch = message.match(/(\d+)(?:\s*(?:grams?|g))/i);
    if (servingMatch) {
      modifications.serving_size = parseInt(servingMatch[1]);
    }

    // Check for quantity modifications
    const quantityMatch = message.match(/(?:there are|actually|make that) (\d+)/i);
    if (quantityMatch) {
      modifications.quantity = parseInt(quantityMatch[1]);
    }

    // Check for "each" modifications (handle both "g" and "grams")
    const eachMatch = message.match(/each.*?(\d+)(?:\s*(?:grams?|g))/i);
    if (eachMatch) {
      modifications.serving_size_each = parseInt(eachMatch[1]);
    }

    return {
      isModification: true,
      targetAction: lastAction,
      modifications
    };
  }

  // Process food modification based on clarification
  processModification(targetAction: FoodAction, modifications: any, originalFoods: any[]): any[] {
    if (!targetAction) return originalFoods;

    const modifiedFoods = [...originalFoods];

    // Handle serving size modifications
    if (modifications.serving_size) {
      modifiedFoods.forEach(food => {
        const ratio = modifications.serving_size / food.serving_size;
        food.serving_size = modifications.serving_size;
        food.calories = Math.round(food.calories * ratio);
        food.carbs = Math.round(food.carbs * ratio * 100) / 100;
      });
    }

    // Handle serving size per item modifications
    if (modifications.serving_size_each) {
      modifiedFoods.forEach(food => {
        const ratio = modifications.serving_size_each / food.serving_size;
        food.serving_size = modifications.serving_size_each;
        food.calories = Math.round(food.calories * ratio);
        food.carbs = Math.round(food.carbs * ratio * 100) / 100;
      });
    }

    // Handle quantity modifications
    if (modifications.quantity && modifications.quantity !== modifiedFoods.length) {
      const originalCount = modifiedFoods.length;
      const newCount = modifications.quantity;
      
      if (newCount > originalCount) {
        // Add more items
        const template = { ...modifiedFoods[0] };
        for (let i = originalCount; i < newCount; i++) {
          modifiedFoods.push({ ...template });
        }
      } else if (newCount < originalCount) {
        // Remove items
        modifiedFoods.splice(newCount);
      }
    }

    return modifiedFoods;
  }

  // Update conversation state
  updateConversationState(updates: Partial<ConversationState>) {
    this.context.conversationState = {
      ...this.context.conversationState,
      ...updates
    };
  }

  // Add item to working memory
  addToWorkingMemory(type: WorkingMemoryItem['type'], content: any, relevanceScore = 1.0, ttlMinutes = 30) {
    const item: WorkingMemoryItem = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      relevanceScore,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000)
    };

    this.context.workingMemory.unshift(item);
    this.cleanupWorkingMemory();
  }

  // Clean up expired items and maintain size limit
  private cleanupWorkingMemory() {
    const now = new Date();
    this.context.workingMemory = this.context.workingMemory
      .filter(item => item.expiresAt > now)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.maxWorkingMemoryItems);
  }

  // Get enhanced context for AI including working memory and cross-session data
  async getContextForAI(): Promise<string> {
    const recentFoods = this.context.recentFoodActions.slice(0, 3);
    const workingMemory = this.context.workingMemory.slice(0, 5);
    
    let contextStr = '\n--- CONVERSATION MEMORY ---\n';

    // Add cross-session context if available
    if (this.crossSessionContext && this.crossSessionContext.common_foods.length > 0) {
      contextStr += 'USER LEARNED PREFERENCES:\n';
      contextStr += `- Common foods: ${this.crossSessionContext.common_foods.slice(0, 10).join(', ')}\n`;
      
      if (Object.keys(this.crossSessionContext.typical_serving_sizes).length > 0) {
        const sizes = Object.entries(this.crossSessionContext.typical_serving_sizes)
          .slice(0, 5)
          .map(([food, size]) => `${food}: ${size}g`)
          .join(', ');
        contextStr += `- Typical serving sizes: ${sizes}\n`;
      }
      
      contextStr += `- Preferred units: ${this.crossSessionContext.preferred_units}\n`;
    }

    // Add recent conversation summaries
    const summaries = await this.loadRelevantSummaries(['food_patterns', 'preferences']);
    if (summaries.length > 0) {
      contextStr += '\nRECENT PATTERNS:\n';
      summaries.slice(0, 2).forEach((summary, index) => {
        const data = summary.summary_data;
        if (data.pattern) {
          contextStr += `${index + 1}. ${data.pattern}\n`;
        }
      });
    }
    
    if (recentFoods.length > 0) {
      contextStr += '\nRECENT FOOD ACTIONS:\n';
      recentFoods.forEach((action, index) => {
        const timeAgo = Math.round((Date.now() - action.timestamp.getTime()) / 1000);
        contextStr += `${index + 1}. ${timeAgo}s ago: "${action.userMessage}" -> Added ${action.foods.length} food(s)\n`;
        action.foods.forEach(food => {
          contextStr += `   - ${food.name}: ${food.serving_size}g, ${food.calories}cal, ${food.carbs}g carbs\n`;
        });
      });
    }

    if (this.context.conversationState.isProcessingFood) {
      contextStr += '\nCURRENT STATE: Processing food-related conversation\n';
    }

    if (workingMemory.length > 0) {
      contextStr += '\nWORKING MEMORY:\n';
      workingMemory.forEach(item => {
        contextStr += `- ${item.type}: ${JSON.stringify(item.content).slice(0, 100)}\n`;
      });
    }

    contextStr += '--- END MEMORY ---\n\n';
    return contextStr;
  }

  // Export/Import for persistence
  export(): string {
    return JSON.stringify(this.context);
  }

  import(data: string) {
    try {
      const parsed = JSON.parse(data);
      this.context = {
        ...this.context,
        ...parsed,
        recentFoodActions: parsed.recentFoodActions?.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        })) || [],
        workingMemory: parsed.workingMemory?.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
          expiresAt: new Date(item.expiresAt)
        })) || []
      };
      this.cleanupWorkingMemory();
    } catch (error) {
      console.error('Failed to import conversation memory:', error);
    }
  }

  // Get current context
  getContext(): ConversationContext {
    return { ...this.context };
  }

  // Get cross-session context (for debugging)
  getCrossSessionContext(): CrossSessionContext | null {
    return this.crossSessionContext;
  }

  // Reset session but keep cross-session learnings
  resetSession(): void {
    const preservedUnits = this.crossSessionContext?.preferred_units || this.context.userPreferences.preferredUnits;
    const preservedFoods = this.crossSessionContext?.common_foods || [];
    const preservedSizes = this.crossSessionContext?.typical_serving_sizes || {};
    
    this.context = {
      recentFoodActions: [],
      conversationState: {
        currentTopic: 'general',
        isProcessingFood: false,
        awaitingClarification: false,
        sessionType: 'general'
      },
      userPreferences: {
        preferredUnits: preservedUnits,
        commonFoods: preservedFoods,
        typicalServingSizes: preservedSizes,
        frequentClarifications: []
      },
      workingMemory: []
    };
    
    // Reapply cross-session context
    this.applyContextToCurrentSession();
  }
}

// Global instance
export const conversationMemory = new ConversationMemoryManager();
