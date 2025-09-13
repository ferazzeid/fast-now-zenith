import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export type GoalIdeasViewMode = 'page' | 'modal';

interface UseGoalIdeasNavigationOptions {
  defaultMode?: GoalIdeasViewMode;
  onModeChange?: (mode: GoalIdeasViewMode) => void;
}

export const useGoalIdeasNavigation = (options: UseGoalIdeasNavigationOptions = {}) => {
  const { defaultMode = 'page', onModeChange } = options;
  const [viewMode, setViewMode] = useState<GoalIdeasViewMode>(defaultMode);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const openGoalIdeas = useCallback((mode?: GoalIdeasViewMode) => {
    const targetMode = mode || viewMode;
    
    try {
      if (targetMode === 'modal') {
        setShowModal(true);
      } else {
        navigate('/motivator-ideas');
      }
      
      onModeChange?.(targetMode);
    } catch (error) {
      console.error('Error opening goal ideas:', error);
      // Fallback to page mode if modal fails
      navigate('/motivator-ideas');
    }
  }, [viewMode, navigate, onModeChange]);

  const closeGoalIdeas = useCallback(() => {
    setShowModal(false);
  }, []);

  const switchToPageMode = useCallback(() => {
    setShowModal(false);
    setViewMode('page');
    navigate('/motivator-ideas');
  }, [navigate]);

  const switchToModalMode = useCallback(() => {
    setViewMode('modal');
    setShowModal(true);
  }, []);

  return {
    viewMode,
    showModal,
    openGoalIdeas,
    closeGoalIdeas,
    switchToPageMode,
    switchToModalMode,
    setViewMode
  };
};