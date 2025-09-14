import React from 'react';
import { StaticPromptManagement } from "./StaticPromptManagement";

export const PromptManagement = () => {
  // Use the static version instead of database-dependent version
  return <StaticPromptManagement />;
};