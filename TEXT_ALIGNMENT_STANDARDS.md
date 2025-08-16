# Text Alignment Standards for Modal Windows

## Overview
This document establishes consistent text alignment rules for all modal windows in the FastPal app to ensure professional appearance and user experience consistency.

## Text Alignment Rules

### 1. **Modal Titles**
- **Rule**: Always left-aligned
- **Rationale**: Professional standard, matches modern UI conventions
- **Implementation**: Remove `text-center` class from modal titles
- **Example**: 
  ```tsx
  // ❌ Wrong
  <DialogTitle className="text-center">My Title</DialogTitle>
  
  // ✅ Correct
  <DialogTitle>My Title</DialogTitle>
  ```

### 2. **Form Content**
- **Rule**: Always left-aligned
- **Includes**: Labels, input descriptions, form text
- **Rationale**: Better readability and scanning for users
- **Example**:
  ```tsx
  // ✅ Correct
  <Label htmlFor="name">Food Name</Label>
  <p className="text-sm text-muted-foreground">Enter the name of the food item</p>
  ```

### 3. **Body Text & Descriptions**
- **Rule**: Always left-aligned
- **Includes**: Paragraphs, descriptions, help text
- **Rationale**: Standard reading pattern, better UX

### 4. **Empty States** 
- **Rule**: Center-aligned (exception)
- **Rationale**: Visual balance when no content is present
- **Example**:
  ```tsx
  // ✅ Correct for empty states
  <div className="text-center py-8">
    <Icon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
    <p className="text-muted-foreground">No items found</p>
  </div>
  ```

### 5. **Loading States**
- **Rule**: Center-aligned (exception)
- **Rationale**: Visual focus during loading
- **Example**:
  ```tsx
  // ✅ Correct for loading states
  <div className="text-center py-8">
    <p className="text-muted-foreground">Loading...</p>
  </div>
  ```

### 6. **Error Messages**
- **Rule**: Left-aligned
- **Rationale**: Consistency with form validation patterns

### 7. **Button Groups**
- **Rule**: Right-aligned in footer (UniversalModal handles this)
- **Rationale**: Standard modal footer pattern

### 8. **Confirmation Dialogs**
- **Rule**: Center-aligned (exception)
- **Rationale**: Draw attention to critical actions
- **Example**: Delete confirmations, important alerts

## Implementation Status

### ✅ Fixed
- ActivitySelector: Removed center-aligned title
- MotivatorsModal: Fixed header text alignment
- UniversalModal: Ensures left-aligned titles by default

### ✅ Already Correct
- MotivatorIdeasModal: Empty states properly center-aligned
- PageOnboardingModal: Title correctly left-aligned
- EditMotivatorModal: Title correctly left-aligned
- Most migrated modals: Following correct patterns

### 📝 Guidelines for Future Development
1. Always use UniversalModal for new modals (handles alignment correctly)
2. Only center-align for empty states, loading states, and critical confirmations
3. Keep form content and body text left-aligned
4. Test alignment consistency across all breakpoints

## Quality Checklist
When reviewing modal text alignment:
- [ ] Modal title is left-aligned
- [ ] Form labels and inputs are left-aligned  
- [ ] Body text and descriptions are left-aligned
- [ ] Empty states are center-aligned (if applicable)
- [ ] Loading states are center-aligned (if applicable)
- [ ] Button groups follow footer standards