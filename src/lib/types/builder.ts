import type { BaseNode, BuilderLayout } from './common';

// ============================================
// BUILDER NODE TYPES
// ============================================

export interface GoalNode extends BaseNode {
  type: 'goal';
  metadata: GoalMetadata;
}

export interface GoalMetadata {
  targetDate?: string;
  status?: 'active' | 'achieved' | 'paused';
  priority?: 'low' | 'medium' | 'high';
}

export interface SkillNode extends BaseNode {
  type: 'skill';
  metadata: SkillMetadata;
}

export interface SkillMetadata {
  level?: 'learning' | 'practicing' | 'proficient' | 'expert';
  hoursSpent?: number;
  startedDate?: string;
}

export interface ProjectNode extends BaseNode {
  type: 'project';
  metadata: ProjectMetadata;
}

export interface ProjectMetadata {
  status?: 'idea' | 'in-progress' | 'completed' | 'archived';
  url?: string;
  repoUrl?: string;
  startDate?: string;
  endDate?: string;
}

export interface ResourceNode extends BaseNode {
  type: 'resource';
  metadata: ResourceMetadata;
}

export interface ResourceMetadata {
  resourceType?: 'course' | 'book' | 'video' | 'article' | 'tutorial' | 'documentation';
  url?: string;
  author?: string;
  completedDate?: string;
  rating?: number;
}

export interface ConceptNode extends BaseNode {
  type: 'concept';
  metadata: ConceptMetadata;
}

export interface ConceptMetadata {
  domain?: string;
}

export interface NoteNode extends BaseNode {
  type: 'note';
  metadata: NoteMetadata;
}

export interface NoteMetadata {
  content?: string;
}

// ============================================
// BUILDER NODE UNION
// ============================================

export type BuilderNode =
  | GoalNode
  | SkillNode
  | ProjectNode
  | ResourceNode
  | ConceptNode
  | NoteNode;

// ============================================
// BUILDER SETTINGS
// ============================================

export type BuilderNodeType = BuilderNode['type'];

export interface BuilderSettings {
  layout: BuilderLayout;
  showLabels: boolean;
  showConnections: boolean;
  highlightConnected: boolean;
  customNodeTypeLabels?: Partial<Record<BuilderNodeType, string>>;
}

export const DEFAULT_BUILDER_SETTINGS: BuilderSettings = {
  layout: 'physics',
  showLabels: true,
  showConnections: true,
  highlightConnected: true,
  customNodeTypeLabels: {},
};

// ============================================
// BUILDER NODE COLORS
// ============================================

export const BUILDER_NODE_COLORS: Record<BuilderNode['type'], string> = {
  goal: '#22c55e',
  skill: '#ec4899',
  project: '#06b6d4',
  resource: '#a855f7',
  concept: '#f59e0b',
  note: '#6b7280',
};
