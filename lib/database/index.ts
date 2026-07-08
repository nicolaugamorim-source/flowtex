/**
 * Database layer - centralized exports for all database operations
 * This file makes it easy to import all database functions from a single place
 */

// Profiles
export {
  createOrUpdateProfile,
  getProfile,
  updateProfile,
  completeOnboarding,
  markOnboardingComplete,
  type ProfileData,
} from './profiles';

// Integrations
export {
  saveGoogleIntegration,
  saveNotionIntegration,
  getIntegrations,
  getIntegration,
  updateIntegrationToken,
  deactivateIntegration,
  isIntegrationConnected,
  type GoogleIntegrationData,
  type NotionIntegrationData,
} from './integrations';

// Chat Messages
export {
  saveChatMessage,
  getChatHistory,
  getFullChatHistory,
  getRecentChatMessages,
  getChatMessagesWithActions,
  clearChatHistory,
  getTokenUsageStats,
  type ChatMessageData,
} from './chat';

// AI Context
export {
  saveAIContext,
  getAIContext,
  updateAIContext,
  buildAIContextString,
  type AIContextData,
} from './ai-context';
