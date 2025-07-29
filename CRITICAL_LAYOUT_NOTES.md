# CRITICAL LAYOUT & FUNCTIONALITY NOTES

## ⚠️ NAVIGATION BAR LAYOUT REQUIREMENTS

### Rule: Always account for navigation bar height in page layouts

**Height Calculation**: All pages MUST use `h-[calc(100vh-80px)]` instead of `h-screen`
- Navigation bar is fixed at bottom with ~80px height
- Using `h-screen` causes content to overflow behind navigation
- Results in horizontal scrolling and layout breaks

**Bottom Padding**: Input areas MUST have adequate bottom margin/padding
- Use `mb-16` or `pb-6 mb-16` for input containers
- Prevents input fields from being hidden behind navigation
- Ensures proper touch targets on mobile

### Files That MUST Follow This Rule:
- src/pages/Index.tsx ✅ FIXED
- src/pages/AiChat.tsx ✅ FIXED  
- src/pages/Timer.tsx ✅ FIXED
- src/pages/Walking.tsx ✅ FIXED
- src/pages/FoodTracking.tsx ✅ FIXED
- src/pages/Settings.tsx ✅ FIXED
- src/pages/Motivators.tsx ✅ FIXED
- Any page with input fields or full-height layouts ✅ VERIFIED

## ⚠️ TRANSCRIPTION FUNCTIONALITY 

### Rule: Always check for API key BEFORE attempting transcription

**Issue**: VoiceRecorder component fails silently when no API key is set
- Leads to "failed to transcribe audio" errors
- User gets false recording feedback
- This issue recurs when we make layout changes due to missing error boundaries

**Solution**: 
1. Always check localStorage for 'openai_api_key' first
2. Show clear error message if missing
3. Add defensive error handling in transcription chain

### Files That Handle This:
- src/components/VoiceRecorder.tsx ✅ FIXED
- supabase/functions/transcribe/index.ts ✅ VERIFIED

## 🔄 PREVENTING REGRESSIONS

When making changes to:
- Page layouts → Always verify navigation spacing
- Audio/voice components → Always test API key validation
- Input components → Always check bottom margin/padding

## 📱 Mobile Considerations

- Navigation is sticky bottom on mobile
- Touch targets must be accessible above navigation
- Horizontal scrolling indicates layout overflow
- Test on different screen sizes

---
**Last Updated**: When AiChat layout and VoiceRecorder transcription were fixed
**Next**: Apply same layout principles to other pages as needed