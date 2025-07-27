import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Message } from './useSingleConversation';

export interface ArchivedConversation {
  id: string;
  title: string;
  created_at: Date;
  last_message_at: Date;
  messages: Message[];
}

export const useArchivedConversations = () => {
  const [archivedConversations, setArchivedConversations] = useState<ArchivedConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load archived conversations
  const loadArchivedConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', true)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const transformedConversations = data.map(conv => {
          let conversationMessages: Message[] = [];
          try {
            if (typeof conv.messages === 'string') {
              conversationMessages = JSON.parse(conv.messages);
            } else if (Array.isArray(conv.messages)) {
              conversationMessages = conv.messages as any[];
            }
          } catch (e) {
            console.error('Error parsing messages:', e);
          }
          
          return {
            id: conv.id,
            title: conv.title || 'Untitled Conversation',
            created_at: new Date(conv.created_at),
            last_message_at: new Date(conv.last_message_at),
            messages: conversationMessages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
        });
        
        setArchivedConversations(transformedConversations);
      }
    } catch (error) {
      console.error('Error loading archived conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load archived conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Restore an archived conversation (unarchive it)
  const restoreConversation = async (conversationId: string) => {
    if (!user) return false;

    try {
      // First, archive any existing active conversation
      await supabase
        .from('chat_conversations')
        .update({ archived: true })
        .eq('user_id', user.id)
        .eq('archived', false);

      // Then unarchive the selected conversation
      const { error } = await supabase
        .from('chat_conversations')
        .update({ archived: false })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from archived list
      setArchivedConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      );
      
      toast({
        title: "Success",
        description: "Conversation restored",
      });
      
      return true;
    } catch (error) {
      console.error('Error restoring conversation:', error);
      toast({
        title: "Error",
        description: "Failed to restore conversation",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete an archived conversation permanently
  const deleteArchivedConversation = async (conversationId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .eq('archived', true);

      if (error) throw error;

      // Remove from local state
      setArchivedConversations(prev => 
        prev.filter(conv => conv.id !== conversationId)
      );
      
      toast({
        title: "Success",
        description: "Archived conversation deleted",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting archived conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete archived conversation",
        variant: "destructive",
      });
      return false;
    }
  };

  // Load archived conversations when user changes
  useEffect(() => {
    if (user) {
      loadArchivedConversations();
    } else {
      setArchivedConversations([]);
    }
  }, [user]);

  return {
    archivedConversations,
    loading,
    loadArchivedConversations,
    restoreConversation,
    deleteArchivedConversation
  };
};