# Component Migration Guide

## 🏷️ **Annotation System for Lovable Compatibility**

### **Critical Annotations**
Every modified or new component MUST include these comments:

```typescript
/**
 * LOVABLE_COMPONENT_STATUS: [LEGACY|UPGRADED|PARALLEL]
 * LOVABLE_MIGRATION_PHASE: [1-6] 
 * LOVABLE_PRESERVE: [true|false]
 * LOVABLE_DESCRIPTION: Brief explanation of component purpose
 * LOVABLE_DEPENDENCIES: List of required dependencies
 * LOVABLE_PERFORMANCE_IMPACT: Description of performance changes
 */
```

### **Example: Modal Component Migration**

```typescript
/**
 * LOVABLE_COMPONENT_STATUS: PARALLEL
 * LOVABLE_MIGRATION_PHASE: 1
 * LOVABLE_PRESERVE: true
 * LOVABLE_DESCRIPTION: Unified modal system for consistent UI
 * LOVABLE_DEPENDENCIES: @radix-ui/react-dialog, tailwindcss
 * LOVABLE_PERFORMANCE_IMPACT: Reduces bundle size by 15% through shared components
 * 
 * MIGRATION_NOTE: This runs alongside legacy modals during Phase 1.
 * Legacy modals (ModalAiChat, MotivatorFormModal) remain functional.
 * New features should use UniversalModal. Legacy will be removed in Phase 6.
 */
export const UniversalModal = ({ ... }) => {
  // LOVABLE_PRESERVE: Core modal functionality
  // Implementation here...
}
```

## 🔄 **Parallel System Documentation**

### **Why Parallel Systems?**
During migration, we maintain both old and new implementations to:
1. **Preserve functionality** - nothing breaks during upgrade
2. **Enable gradual migration** - migrate one component at a time  
3. **Allow testing** - compare old vs new performance
4. **Provide fallbacks** - if new system fails, old system continues working

### **Parallel System Example**

```typescript
// LOVABLE_LEGACY: Original subscription hook - Phase out in Phase 6
export const useSubscription = () => {
  // LOVABLE_PRESERVE: Keep this working until migration complete
  // Original implementation...
}

// LOVABLE_UPGRADED: Optimized subscription hook - Use for new features
export const useOptimizedSubscription = () => {
  // PERFORMANCE: Reduces API calls by 70%
  // MEMORY: Implements intelligent caching
  // New implementation with React Query...
}

// LOVABLE_MIGRATION_NOTE: 
// During Phase 2-5: Both hooks exist and work
// Components gradually migrate from useSubscription to useOptimizedSubscription
// Phase 6: Remove useSubscription, rename useOptimizedSubscription to useSubscription
```

## 📂 **File Organization During Migration**

### **New Files Structure**
```
src/
├── components/
│   ├── legacy/          # LOVABLE_LEGACY: Original components
│   ├── upgraded/        # LOVABLE_UPGRADED: New implementations  
│   └── ui/
│       ├── universal-modal.tsx  # LOVABLE_UPGRADED
│       └── dialog.tsx           # LOVABLE_LEGACY
├── hooks/
│   ├── legacy/          # LOVABLE_LEGACY: Original hooks
│   └── optimized/       # LOVABLE_UPGRADED: Performance hooks
└── stores/              # LOVABLE_UPGRADED: New state management
```

### **Import Strategy**
```typescript
// LOVABLE_MIGRATION_PHASE_1: Use legacy components
import { ModalAiChat } from '@/components/ModalAiChat';

// LOVABLE_MIGRATION_PHASE_3: Switch to upgraded components  
import { UniversalModal } from '@/components/upgraded/UniversalModal';
```

## 🚨 **Critical Rules for Lovable**

### **DO NOT DELETE**
- Any component marked `LOVABLE_PRESERVE: true`
- Any file in `/legacy/` folders during migration
- Any component still used by other components

### **PREFER FOR NEW FEATURES**
- Components marked `LOVABLE_UPGRADED`
- Hooks in `/optimized/` folder
- New patterns over legacy patterns

### **UNDERSTAND CONTEXT**
- Read `LOVABLE_MIGRATION_NOTE` comments
- Check `LOVABLE_MIGRATION_PHASE` to understand timeline
- Respect parallel systems during migration period

## 🔧 **Testing Strategy**

### **Dual Testing**
```typescript
// LOVABLE_TEST: Both systems during migration
describe('Modal Systems', () => {
  // LOVABLE_LEGACY: Test original modal
  it('legacy modal works', () => { ... });
  
  // LOVABLE_UPGRADED: Test new modal  
  it('universal modal works', () => { ... });
  
  // LOVABLE_MIGRATION: Test compatibility
  it('can migrate from legacy to upgraded', () => { ... });
});
```

---
**Last Updated**: January 2025
**Migration Status**: Phase 1 - Modal System Foundation