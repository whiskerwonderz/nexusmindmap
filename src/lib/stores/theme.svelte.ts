import type { Theme, ThemeId } from '$lib/types';
import { themes, getTheme, applyTheme } from '$lib/themes';
import { browser } from '$app/environment';

// Create a reactive state class
class ThemeState {
  currentThemeId = $state<ThemeId>('midnight');

  get currentTheme(): Theme {
    return getTheme(this.currentThemeId);
  }

  get allThemes(): Theme[] {
    return Object.values(themes);
  }

  setTheme(id: ThemeId): void {
    console.log('ThemeState.setTheme called with:', id);
    this.currentThemeId = id;
    if (browser) {
      console.log('Applying theme:', id);
      applyTheme(getTheme(id));
      localStorage.setItem('skillgraph-theme', id);
    }
  }

  initTheme(): void {
    if (!browser) return;

    const saved = localStorage.getItem('skillgraph-theme') as ThemeId | null;
    console.log('initTheme, saved theme:', saved);
    if (saved && themes[saved]) {
      this.currentThemeId = saved;
    }
    applyTheme(getTheme(this.currentThemeId));
  }
}

// Export singleton instance
export const themeState = new ThemeState();

// Export actions
export const setTheme = (id: ThemeId) => {
  console.log('setTheme function called with:', id);
  themeState.setTheme(id);
};
export const initTheme = () => themeState.initTheme();
