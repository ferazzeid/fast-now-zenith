# Goal Ideas Architecture Documentation

## Overview
The Goal Ideas feature allows users to browse and add professionally designed motivational goals to their personal collection. This document outlines the architecture and guidelines to prevent breakage.

## 🚨 CRITICAL: DO NOT BREAK THESE ROUTES

### Primary Route
- **`/motivator-ideas`** - Main goal ideas page (NEVER REMOVE OR MODIFY)
- **Navigation**: Motivators page → "Goal Ideas" button → `/motivator-ideas`

## Core Components

### 1. Page Component
- **File**: `src/pages/MotivatorIdeas.tsx`
- **Route**: `/motivator-ideas` in `App.tsx`
- **Purpose**: Main page displaying goal ideas with gender filtering
- **Protected by**: `GoalIdeasErrorBoundary`

### 2. Modal Component  
- **File**: `src/components/MotivatorIdeasModal.tsx`
- **Purpose**: Modal version of goal ideas (backward compatibility)
- **Protected by**: `ErrorBoundary`

### 3. Error Boundary
- **File**: `src/components/GoalIdeasErrorBoundary.tsx`
- **Purpose**: Catches errors and provides recovery options
- **Fallback**: Returns user safely to `/motivators`

## Data Flow

```
User Profile (gender) → useAdminGoalIdeas → Filter by Gender → Display Ideas
                                         ↓
                     Cache Management ← goalIdeasCache
```

## Key Hooks

### useAdminGoalIdeas
- **File**: `src/hooks/useAdminGoalIdeas.tsx`
- **Purpose**: Fetches and manages goal ideas with gender filtering
- **Cache**: Automatically cleared on gender changes

### useAdminGoalManagement  
- **File**: `src/hooks/useAdminGoalManagement.tsx`
- **Purpose**: Admin CRUD operations for goal ideas

### useGoalIdeasNavigation
- **File**: `src/hooks/useGoalIdeasNavigation.tsx`
- **Purpose**: Manages navigation between modal/page modes

## Navigation Flow

```
/motivators → [Goal Ideas Button] → /motivator-ideas
     ↑                                    ↓
     ← [Back Button] ←← ←← ←← ←← ←← ←← ←← ←←
```

## Prevention Guidelines

### ✅ SAFE Operations:
- Adding new UI components
- Updating styles and design
- Adding new fields to AdminGoalIdea interface  
- Improving performance and caching
- Adding analytics tracking

### ❌ DANGEROUS Operations:
- Removing `/motivator-ideas` route
- Modifying navigation from Motivators page
- Changing AdminGoalIdea interface structure
- Removing error boundaries
- Modifying core hook functionality without testing

## Testing Checklist

Before ANY changes to Goal Ideas:

1. ✅ `/motivator-ideas` page loads correctly
2. ✅ Navigation from Motivators page works
3. ✅ Gender filtering works (male/female)
4. ✅ Add button creates motivators correctly
5. ✅ Admin edit/delete functions work (if admin)
6. ✅ External links open properly
7. ✅ Back navigation returns to `/motivators`
8. ✅ Error boundaries catch and recover from errors
9. ✅ Loading states display correctly
10. ✅ Cache invalidation works on gender changes

## Error Recovery

If Goal Ideas breaks:
1. Check error boundaries are wrapped correctly
2. Verify route exists in `App.tsx`
3. Test navigation from Motivators page
4. Clear localStorage goal ideas cache
5. Check useAdminGoalIdeas gender filtering

## Cache Management

Goal ideas are cached for 5 minutes with the following keys:
- `goalIdeasCache` - Main data cache
- `goalIdeasCacheTimestamp` - Cache timestamp

Cache is automatically cleared when:
- Gender filter changes  
- Cache expires (5 minutes)
- Manual refresh triggered
- App startup

## Dependencies

Critical dependencies that must remain stable:
- `useAdminGoalIdeas` hook
- `AdminGoalIdea` interface
- `/motivator-ideas` route in App.tsx
- Navigation button in Motivators.tsx

## Performance Considerations

- Gender filtering happens client-side after data fetch
- Images use lazy loading with fallbacks
- Cache prevents unnecessary API calls
- Error boundaries prevent full page crashes

---

**Last Updated**: Implementation of restoration plan
**Maintainer**: Goal Ideas Feature Team