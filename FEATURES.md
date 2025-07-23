# FastPal - Features Overview

A comprehensive fasting companion app with AI-powered motivation and community support.

## Core Features

### 🕐 Smart Fasting Timer
- **CeramicTimer Component**: Beautiful, plate-inspired design with ceramic textures
- **Multiple Fast Types**: Support for intermittent fasting (16:8, 18:6, etc.) and extended fasts
- **Database Integration**: All fasting sessions automatically saved to `fasting_sessions` table
- **Progress Tracking**: Visual progress indicators with customizable count-up/count-down
- **Eating Window Support**: Automatic transitions between fasting and eating periods
- **Motivator Slideshow**: Background display of user's motivational images during fasting
- **Real-time Sync**: Fasting data immediately available to AI for contextual support

### 🤖 AI-Powered Companion
- **Advanced Function Calling**: AI can create, edit, and manage user motivators
- **Contextual Coaching**: AI accesses real fasting data for personalized guidance
- **Smart Conversation Memory**: Persistent chat history with automatic context building
- **Multiple AI Models**: Support for GPT-4.1, GPT-4o-mini, and GPT-4o
- **Voice Integration**: Text-to-speech responses and voice transcription
- **Weak Moment Detection**: AI recognizes struggle keywords and provides targeted support
- **Adaptive Suggestions**: Learning from user behavior to suggest better motivators

### 🎯 AI-Enhanced Motivator System
- **Function-Based Creation**: AI can directly create motivators during conversations
- **Onboarding Wizard**: Step-by-step guided setup with predefined templates
- **AI Image Generation**: Automatic generation of motivational images using DALL-E
- **Smart Categorization**: Automatic categorization based on content analysis
- **Template Library**: Pre-built motivator templates for quick selection
- **Context-Aware Suggestions**: AI suggests motivators based on fasting stage and user needs
- **Admin Template Creation**: Voice-enabled admin tools for creating global templates
- **Image Storage**: Support for motivator images with slideshow functionality

### 👤 User Management & Authentication
- **Supabase Authentication**: Secure user registration and login
- **User Profiles**: Customizable profiles with fasting preferences
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **API Key Management**: Support for personal OpenAI keys or shared admin keys
- **Usage Tracking**: Monitor AI request limits and user activity

### 📊 Advanced Analytics & Tracking
- **Fasting Session History**: Complete database of all fasting sessions with start/end times
- **Progress Visualization**: Real-time tracking of fasting progress and goals
- **Achievement System**: Milestone tracking and celebration
- **Usage Statistics**: AI request monitoring and performance metrics
- **Real-time Context**: Live fasting data integration for AI conversations

### ⚙️ Admin Dashboard & Controls
- **Comprehensive Admin Panel**: Full control over app configuration
- **AI Behavior Controls**: Fine-tune AI responses and triggers
  - Weak moment keyword configuration (customizable trigger words)
  - Motivator suggestion frequency (1-10 scale)
  - Coaching encouragement level (education vs. encouragement balance)
  - Auto-trigger settings for motivators during fasting
  - Slideshow transition timing (5-60 seconds)
- **User Management**: Upgrade/downgrade users, reset usage limits
- **API Key Management**: Shared OpenAI key configuration
- **Voice-Enabled Admin Motivator Creation**: Create global template motivators using voice input
- **Storage Management**: Monitor and manage uploaded images
- **PWA Configuration**: Customize app appearance and behavior

### 🔧 Technical Features
- **Real-time Database Integration**: Live synchronization across all components
- **Offline Support**: PWA capabilities for offline usage
- **Responsive Design**: Optimized for mobile and desktop
- **Modern Tech Stack**: React, TypeScript, Tailwind CSS, Supabase
- **Image Storage**: Secure cloud storage for motivator images with `image_url` database field
- **Edge Functions**: Server-side AI processing and integrations

## AI Integration Capabilities

### Function Calling System
- **Motivator Management**: AI can create, update, and delete user motivators
- **Image Generation**: AI can generate motivational images on demand
- **Smart Suggestions**: Context-aware motivator recommendations
- **Real-time Updates**: Immediate reflection of AI actions in the UI

### Contextual Intelligence
- **Fasting Data Integration**: AI has access to current and historical fasting data
- **Conversation Memory**: Persistent chat history with smart context building
- **User Behavior Learning**: AI adapts suggestions based on user patterns
- **Weak Moment Support**: Automatic detection and response to user struggles

### Admin-Controlled AI Behavior
- **Configurable Responses**: Admins can tune AI personality and behavior
- **Template Management**: Voice-enabled creation of global motivator templates
- **Usage Monitoring**: Track AI requests and optimize performance
- **Safety Controls**: Configurable content filtering and response guidelines

## Implemented Features

### ✅ Timer-Database Integration
- **useFastingSession Hook**: Connects timer to database with full CRUD operations
- **Automatic Session Management**: Start/stop/cancel fasting sessions
- **Real-time Progress Tracking**: Live calculation of fasting duration and goals
- **AI Context Integration**: Immediate availability of fasting data to AI

### ✅ Motivator Slideshow
- **Background Image Display**: Subtle slideshow of motivator images in timer background
- **Configurable Transitions**: Admin-controlled timing (5-60 seconds)
- **Visual Effects**: Blur, brightness, and gradient overlays for optimal timer visibility
- **Smart Filtering**: Only shows motivators with images

### ✅ Admin AI Behavior Controls
- **Weak Moment Detection**: Configurable keywords that trigger AI support
- **Suggestion Frequency**: 1-10 scale for how often AI suggests new motivators
- **Coaching Style**: Balance between educational and encouraging responses
- **Auto-triggers**: Enable/disable automatic motivator displays during fasting

### ✅ Admin Motivator Creation
- **Voice Input Support**: Create motivators using voice transcription
- **Template Management**: Create global templates available to all users
- **Image Upload**: Support for motivator images with secure storage
- **Category Organization**: Structured categorization system

## Database Schema Updates

### Motivators Table
- Added `image_url` column for storing motivator images
- Full support for image-based motivational content
- Integrated with slideshow functionality

### Shared Settings
- AI behavior configuration settings
- Weak moment keywords management
- Suggestion frequency controls
- Admin template storage

## Planned Enhancements

### Smart Coaching System
- **Contextual Motivator Triggers**: Location and time-based motivator display
- **Predictive Support**: AI anticipates user needs based on patterns
- **Achievement Celebrations**: Automatic milestone recognition and rewards
- **Progressive Motivation**: Escalating support during difficult moments

### Social Features
- **Anonymous Buddy System**: Peer support without identity exposure
- **Group Challenges**: Community-based fasting goals
- **Success Story Sharing**: Inspirational content from the community
- **Shared Template Library**: User-contributed motivator templates

### Advanced Analytics
- **Health Integration**: Connect with fitness and health apps
- **Pattern Recognition**: AI-powered insights into fasting success factors
- **Personalized Recommendations**: Data-driven suggestions for optimal fasting
- **Predictive Modeling**: Forecast fasting success and suggest improvements

---

*Last updated: January 2025*
*Version: 2.1 - Complete Timer Integration & Admin Controls*