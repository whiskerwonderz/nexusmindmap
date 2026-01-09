import type { Theme, ThemeId, ThemeColors, NodeType } from './types';

export const themes: Record<ThemeId, Theme> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark theme with vibrant accents',
    colors: {
      background: '#0a0a12',
      goal: '#10b981',
      skill: '#ec4899',
      project: '#06b6d4',
      source: '#8b5cf6',
      cert: '#f59e0b',
      concept: '#64748b',
      edge: '#374151',
      edgeHighlight: '#6b7280',
      text: '#ffffff',
      textMuted: '#9ca3af',
      panelBg: 'rgba(18, 18, 26, 0.95)',
      panelBorder: 'rgba(255, 255, 255, 0.1)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      buttonPrimary: '#3b82f6',
      buttonHover: '#2563eb'
    }
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean Depths',
    description: 'Deep blue theme inspired by the sea',
    colors: {
      background: '#0c1929',
      goal: '#22d3ee',
      skill: '#38bdf8',
      project: '#818cf8',
      source: '#a78bfa',
      cert: '#fbbf24',
      concept: '#94a3b8',
      edge: '#1e3a5f',
      edgeHighlight: '#3b82f6',
      text: '#f0f9ff',
      textMuted: '#7dd3fc',
      panelBg: 'rgba(12, 25, 41, 0.95)',
      panelBorder: 'rgba(56, 189, 248, 0.2)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      buttonPrimary: '#0ea5e9',
      buttonHover: '#0284c7'
    }
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green theme',
    colors: {
      background: '#0f1a0f',
      goal: '#4ade80',
      skill: '#a3e635',
      project: '#34d399',
      source: '#fbbf24',
      cert: '#fb923c',
      concept: '#6b7280',
      edge: '#1a2e1a',
      edgeHighlight: '#4ade80',
      text: '#f0fdf4',
      textMuted: '#86efac',
      panelBg: 'rgba(15, 26, 15, 0.95)',
      panelBorder: 'rgba(74, 222, 128, 0.2)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      buttonPrimary: '#22c55e',
      buttonHover: '#16a34a'
    }
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and pink tones',
    colors: {
      background: '#1a0a0a',
      goal: '#f97316',
      skill: '#fb7185',
      project: '#fbbf24',
      source: '#a78bfa',
      cert: '#34d399',
      concept: '#78716c',
      edge: '#3d1f1f',
      edgeHighlight: '#f97316',
      text: '#fff7ed',
      textMuted: '#fdba74',
      panelBg: 'rgba(26, 10, 10, 0.95)',
      panelBorder: 'rgba(249, 115, 22, 0.2)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      buttonPrimary: '#ea580c',
      buttonHover: '#c2410c'
    }
  },

  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Northern lights inspired',
    colors: {
      background: '#0a0a1a',
      goal: '#c084fc',
      skill: '#22d3ee',
      project: '#4ade80',
      source: '#f472b6',
      cert: '#fbbf24',
      concept: '#64748b',
      edge: '#1e1e3f',
      edgeHighlight: '#a78bfa',
      text: '#f5f3ff',
      textMuted: '#c4b5fd',
      panelBg: 'rgba(10, 10, 26, 0.95)',
      panelBorder: 'rgba(192, 132, 252, 0.2)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      buttonPrimary: '#8b5cf6',
      buttonHover: '#7c3aed'
    }
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal Light',
    description: 'Clean light theme',
    colors: {
      background: '#fafafa',
      goal: '#18181b',
      skill: '#2563eb',
      project: '#0891b2',
      source: '#7c3aed',
      cert: '#d97706',
      concept: '#a1a1aa',
      edge: '#e4e4e7',
      edgeHighlight: '#3b82f6',
      text: '#18181b',
      textMuted: '#71717a',
      panelBg: 'rgba(255, 255, 255, 0.95)',
      panelBorder: 'rgba(0, 0, 0, 0.1)',
      inputBg: 'rgba(0, 0, 0, 0.03)',
      buttonPrimary: '#2563eb',
      buttonHover: '#1d4ed8'
    }
  },

  noir: {
    id: 'noir',
    name: 'Noir',
    description: 'Monochrome elegance',
    colors: {
      background: '#000000',
      goal: '#ffffff',
      skill: '#a1a1aa',
      project: '#d4d4d8',
      source: '#71717a',
      cert: '#fafafa',
      concept: '#52525b',
      edge: '#27272a',
      edgeHighlight: '#ffffff',
      text: '#fafafa',
      textMuted: '#a1a1aa',
      panelBg: 'rgba(0, 0, 0, 0.95)',
      panelBorder: 'rgba(255, 255, 255, 0.1)',
      inputBg: 'rgba(255, 255, 255, 0.05)',
      buttonPrimary: '#ffffff',
      buttonHover: '#d4d4d8'
    }
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon on dark',
    colors: {
      background: '#0d0d0d',
      goal: '#00ff9f',
      skill: '#ff00ff',
      project: '#00ffff',
      source: '#ff6b6b',
      cert: '#ffff00',
      concept: '#666666',
      edge: '#1a1a2e',
      edgeHighlight: '#00ff9f',
      text: '#ffffff',
      textMuted: '#00ff9f',
      panelBg: 'rgba(13, 13, 13, 0.95)',
      panelBorder: 'rgba(0, 255, 159, 0.3)',
      inputBg: 'rgba(0, 255, 159, 0.05)',
      buttonPrimary: '#00ff9f',
      buttonHover: '#00cc7f'
    }
  }
};

export function getTheme(id: ThemeId | string): Theme {
  return themes[id as ThemeId] ?? themes.midnight;
}

export function getAllThemes(): Theme[] {
  return Object.values(themes);
}

export function applyTheme(theme: Theme, element: HTMLElement = document.documentElement): void {
  const { colors } = theme;

  element.style.setProperty('--color-background', colors.background);
  element.style.setProperty('--color-goal', colors.goal);
  element.style.setProperty('--color-skill', colors.skill);
  element.style.setProperty('--color-project', colors.project);
  element.style.setProperty('--color-source', colors.source);
  element.style.setProperty('--color-cert', colors.cert);
  element.style.setProperty('--color-concept', colors.concept);
  element.style.setProperty('--color-edge', colors.edge);
  element.style.setProperty('--color-edge-highlight', colors.edgeHighlight);
  element.style.setProperty('--color-text', colors.text);
  element.style.setProperty('--color-text-muted', colors.textMuted);
  element.style.setProperty('--color-panel-bg', colors.panelBg);
  element.style.setProperty('--color-panel-border', colors.panelBorder);
  element.style.setProperty('--color-input-bg', colors.inputBg);
  element.style.setProperty('--color-button-primary', colors.buttonPrimary);
  element.style.setProperty('--color-button-hover', colors.buttonHover);
}

export function getNodeColor(theme: Theme, nodeType: NodeType): string {
  const colors = theme.colors;
  switch (nodeType) {
    case 'goal': return colors.goal;
    case 'skill': return colors.skill;
    case 'project': return colors.project;
    case 'source': return colors.source;
    case 'cert': return colors.cert;
    case 'concept': return colors.concept;
    default: return colors.concept;
  }
}

/**
 * Get explorer/traveler mode colors based on the current theme
 */
export function getExplorerColors(theme: Theme): {
  arcColors: [string, string];
  markerColor: string;
  homeColor: string;
  atmosphereColor: string;
} {
  const { colors } = theme;
  return {
    // Arc gradient uses skill and project colors
    arcColors: [colors.skill, colors.project],
    // Regular markers use cert color (usually warm/amber)
    markerColor: colors.cert,
    // Home marker uses goal color
    homeColor: colors.goal,
    // Atmosphere uses button primary
    atmosphereColor: colors.buttonPrimary,
  };
}

export default themes;
