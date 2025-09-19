# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### Added
- Dynamic AI model selection system in admin dashboard
- Model cost calculator and comparison tools  
- Model testing interface for administrators
- Enhanced model performance comparison
- Capacitor microphone permissions setup
- Comprehensive admin model management interface

### Changed
- Upgraded from static to dynamic OpenAI model infrastructure
- Enhanced admin interface with advanced model testing capabilities
- Improved model parameter handling and cost optimization
- Updated edge functions to support multiple AI models dynamically

### Technical Details
- Created `AdminModelSelector`, `AdminCostCalculator`, `AdminModelComparison`, `AdminModelTester` components
- Updated `supabase/functions/_shared/protected-config.ts` for dynamic model resolution
- Modified `analyze-food-voice` and `analyze-food-image` functions to use selected models
- Implemented model-specific parameter handling and cost tracking
- Enhanced admin dashboard with comprehensive AI model management

### Performance Impact
- Flexible model switching allows cost optimization
- Dynamic parameter adjustment improves response quality
- Model comparison enables data-driven model selection decisions

---

## [1.0.0] - 2024-12-18

### Added
- Initial release of Fast Now nutrition tracking application
- Complete food tracking and logging system
- Intermittent fasting timer and tracking
- Walking session tracking and history
- Voice-powered food entry using OpenAI Whisper
- Image-based food analysis using OpenAI Vision
- Comprehensive user profile and goal management
- PWA support with offline capabilities
- Supabase backend integration
- Stripe subscription system
- Admin dashboard for system management

### Features
- Smart food library with nutritional information
- Quick meal and food entry systems
- Calorie and macro tracking
- Progress insights and analytics
- Cross-platform support (web, iOS, Android)
- Multi-tier subscription system
- Motivational content and goal tracking

### Technical Foundation
- React 18 with TypeScript
- Vite build system
- Tailwind CSS for styling
- Supabase for backend services
- Capacitor for mobile deployment
- PWA with service worker caching
- Comprehensive error handling and monitoring

---

## Version History Notes

**Previous Versioning System**: This project previously used a simple numeric system (versions 1-114). Starting with v1.1.0, we've adopted semantic versioning for better change tracking and deployment management.

**Migration**: Version 114 corresponds to v1.0.0 in the new system, representing the stable foundation before implementing dynamic AI model selection.