export type Role =
  'navigate' | 'introduce' | 'showcase' | 'compare' | 'answer' | 'act' | 'feedback' | 'theme';
export type Environment = {
  framework: 'react' | 'other' | 'unknown';
  input: 'pointer' | 'touch' | 'unknown';
  motion: 'normal' | 'reduced';
  navigation: 'occasional' | 'frequent';
  externalData: 'allowed' | 'blocked' | 'unknown';
  allowAdaptation: boolean;
};

export type Requirement = {
  key: 'framework' | 'input' | 'externalData';
  value: string;
  reason: string;
  adaptation?: string;
};

export interface WorkCapability {
  id: string;
  slug: string;
  title: string;
  source?: string;
  sourceId?: string;
  sourceSlug?: string;
  reference?: string;
  family: string;
  roles: Role[];
  provides: string[];
  requires: Requirement[];
  resources: {
    name: string;
    scope: 'global' | 'instance';
    mode: 'exclusive' | 'read';
    phase: string;
  }[];
  adaptations: string[];
  reducedMotion: 'native' | 'adaptation' | 'unknown';
  decorativeTransition: boolean;
  sourceReviewed: boolean;
  browserObserved: boolean;
  sourceRevision: string;
  contentRevision: string;
  capabilityRevision: string;
}

export interface PathSlot {
  id: string;
  role: Role;
  title: string;
  purpose: string;
  required: boolean;
  signals: string[];
  base?: { title: string; provides: string[]; task: string };
}

export interface PathTemplate {
  id: string;
  title: string;
  slots: PathSlot[];
  handoffs: string[];
}

export interface PlanIssue {
  code: string;
  detail: string;
  severity: 'blocked' | 'adaptation' | 'unknown';
  workIds: string[];
  slotId?: string;
}

export interface PlanStep {
  slot: PathSlot;
  work: WorkCapability | null;
  omitted: boolean;
  issues: PlanIssue[];
}

export interface CompositionPlan {
  id: string;
  templateId: string;
  title: string;
  steps: PlanStep[];
  issues: PlanIssue[];
  status: 'suggested' | 'needs-adaptation' | 'verified';
  contextKey: string;
  ruleVersion: string;
}

export interface VerificationRecord {
  planId: string;
  contextKey: string;
  ruleVersion: string;
  works: {
    id: string;
    sourceRevision: string;
    contentRevision: string;
    capabilityRevision: string;
  }[];
  adapterRevision: string;
  references: string[];
  result: 'passed' | 'failed';
}
