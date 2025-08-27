// Enhanced conversation memory system for better context awareness
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

export class ConversationMemoryManager {
  private context: ConversationContext;
  private maxWorkingMemoryItems = 20;
  private maxFoodActions = 10;

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
    
    // Check for serving size modifications
    const servingMatch = message.match(/(\d+)g/i);
    if (servingMatch) {
      modifications.serving_size = parseInt(servingMatch[1]);
    }

    // Check for quantity modifications
    const quantityMatch = message.match(/(?:there are|actually|make that) (\d+)/i);
    if (quantityMatch) {
      modifications.quantity = parseInt(quantityMatch[1]);
    }

    // Check for "each" modifications
    const eachMatch = message.match(/each.*?(\d+)g/i);
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

  // Get conversation context for AI
  getContextForAI(): string {
    const recentFoods = this.context.recentFoodActions.slice(0, 3);
    const workingMemory = this.context.workingMemory.slice(0, 5);
    
    let contextStr = '\n--- CONVERSATION MEMORY ---\n';
    
    if (recentFoods.length > 0) {
      contextStr += 'RECENT FOOD ACTIONS:\n';
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
}

// Global instance
export const conversationMemory = new ConversationMemoryManager();