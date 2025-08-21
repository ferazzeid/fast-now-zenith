import React from 'react';

/**
 * Hook Order Tracker - Ensures consistent hook execution order between builds
 * Critical for preventing React Error #300 in production AAB builds
 */

interface HookCall {
  name: string;
  component: string;
  order: number;
}

class HookOrderTracker {
  private hookCalls: Map<string, HookCall[]> = new Map();
  private currentComponent: string = 'unknown';
  private currentOrder: number = 0;
  private enabled: boolean = true;

  setCurrentComponent(componentName: string) {
    this.currentComponent = componentName;
    this.currentOrder = 0;
    
    if (!this.hookCalls.has(componentName)) {
      this.hookCalls.set(componentName, []);
    }
  }

  trackHook(hookName: string) {
    if (!this.enabled) return;

    this.currentOrder++;
    const call: HookCall = {
      name: hookName,
      component: this.currentComponent,
      order: this.currentOrder
    };

    const componentCalls = this.hookCalls.get(this.currentComponent) || [];
    
    // Check if this is a re-render and hooks are called in different order
    if (componentCalls.length >= this.currentOrder) {
      const expectedHook = componentCalls[this.currentOrder - 1];
      if (expectedHook && expectedHook.name !== hookName) {
        console.error(`Hook order violation in ${this.currentComponent}:`, {
          expected: expectedHook.name,
          actual: hookName,
          order: this.currentOrder
        });
        
        // In production, try to recover gracefully
        if (process.env.NODE_ENV === 'production') {
          this.resetComponent(this.currentComponent);
        } else {
          throw new Error(`Hook order violation: Expected ${expectedHook.name}, got ${hookName} at position ${this.currentOrder} in ${this.currentComponent}`);
        }
      }
    } else {
      // First time calling this hook in this order
      componentCalls.push(call);
      this.hookCalls.set(this.currentComponent, componentCalls);
    }
  }

  resetComponent(componentName: string) {
    this.hookCalls.set(componentName, []);
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }

  getStats() {
    const stats: Record<string, number> = {};
    this.hookCalls.forEach((calls, component) => {
      stats[component] = calls.length;
    });
    return stats;
  }
}

// Global instance
export const hookOrderTracker = new HookOrderTracker();

// Higher-order component to track hooks in a component
export function withHookTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Anonymous';
    
    React.useEffect(() => {
      hookOrderTracker.setCurrentComponent(name);
    });

    hookOrderTracker.setCurrentComponent(name);
    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withHookTracking(${componentName || Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Development-only hook to track hook calls
export function useHookTracker(hookName: string) {
  if (process.env.NODE_ENV === 'development') {
    hookOrderTracker.trackHook(hookName);
  }
}