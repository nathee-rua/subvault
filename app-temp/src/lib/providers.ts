// ============================================
// SubVault - Provider Catalog (Preset Providers)
// ============================================

import { Provider, Category } from '@/types';

export const PRESET_PROVIDERS: Provider[] = [
  // AI Category
  { id: 'chatgpt', name: 'ChatGPT', category: 'ai', website: 'https://chat.openai.com', color: '#10a37f', isPreset: true },
  { id: 'claude', name: 'Claude', category: 'ai', website: 'https://claude.ai', color: '#cc9b7a', isPreset: true },
  { id: 'gemini', name: 'Gemini', category: 'ai', website: 'https://gemini.google.com', color: '#4285f4', isPreset: true },
  { id: 'perplexity', name: 'Perplexity', category: 'ai', website: 'https://perplexity.ai', color: '#20b8cd', isPreset: true },
  { id: 'midjourney', name: 'Midjourney', category: 'ai', website: 'https://midjourney.com', color: '#e0e0e0', isPreset: true },
  { id: 'cursor', name: 'Cursor', category: 'ai', website: 'https://cursor.com', color: '#7c3aed', isPreset: true },
  { id: 'copilot', name: 'GitHub Copilot', category: 'ai', website: 'https://github.com/features/copilot', color: '#6e40c9', isPreset: true },
  { id: 'openrouter', name: 'OpenRouter', category: 'ai', website: 'https://openrouter.ai', color: '#6366f1', isPreset: true },
  { id: 'replit', name: 'Replit', category: 'ai', website: 'https://replit.com', color: '#f26207', isPreset: true },
  
  // VPN Category
  { id: 'nordvpn', name: 'NordVPN', category: 'vpn', website: 'https://nordvpn.com', color: '#4687ff', isPreset: true },
  { id: 'surfshark', name: 'Surfshark', category: 'vpn', website: 'https://surfshark.com', color: '#1fc5b0', isPreset: true },
  { id: 'protonvpn', name: 'Proton VPN', category: 'vpn', website: 'https://protonvpn.com', color: '#6d4aff', isPreset: true },
  { id: 'expressvpn', name: 'ExpressVPN', category: 'vpn', website: 'https://expressvpn.com', color: '#da3940', isPreset: true },
  { id: 'mullvad', name: 'Mullvad VPN', category: 'vpn', website: 'https://mullvad.net', color: '#294d73', isPreset: true },
  
  // Streaming Category
  { id: 'netflix', name: 'Netflix', category: 'streaming', website: 'https://netflix.com', color: '#e50914', isPreset: true },
  { id: 'youtube-premium', name: 'YouTube Premium', category: 'streaming', website: 'https://youtube.com/premium', color: '#ff0000', isPreset: true },
  { id: 'disney-plus', name: 'Disney+', category: 'streaming', website: 'https://disneyplus.com', color: '#0063e5', isPreset: true },
  { id: 'spotify', name: 'Spotify', category: 'streaming', website: 'https://spotify.com', color: '#1db954', isPreset: true },
  { id: 'apple-music', name: 'Apple Music', category: 'streaming', website: 'https://music.apple.com', color: '#fc3c44', isPreset: true },
  { id: 'hbo-max', name: 'HBO Max', category: 'streaming', website: 'https://max.com', color: '#5822b4', isPreset: true },
  { id: 'prime-video', name: 'Prime Video', category: 'streaming', website: 'https://primevideo.com', color: '#00a8e1', isPreset: true },
  { id: 'apple-tv', name: 'Apple TV+', category: 'streaming', website: 'https://tv.apple.com', color: '#1d1d1f', isPreset: true },
  
  // Cloud/SaaS Category
  { id: 'google-one', name: 'Google One', category: 'cloud', website: 'https://one.google.com', color: '#4285f4', isPreset: true },
  { id: 'icloud', name: 'iCloud+', category: 'cloud', website: 'https://icloud.com', color: '#3693f5', isPreset: true },
  { id: 'notion', name: 'Notion', category: 'cloud', website: 'https://notion.so', color: '#000000', isPreset: true },
  { id: 'canva', name: 'Canva', category: 'cloud', website: 'https://canva.com', color: '#00c4cc', isPreset: true },
  { id: 'github', name: 'GitHub', category: 'cloud', website: 'https://github.com', color: '#333333', isPreset: true },
  { id: 'vercel', name: 'Vercel', category: 'cloud', website: 'https://vercel.com', color: '#000000', isPreset: true },
  { id: 'figma', name: 'Figma', category: 'cloud', website: 'https://figma.com', color: '#f24e1e', isPreset: true },
  { id: 'dropbox', name: 'Dropbox', category: 'cloud', website: 'https://dropbox.com', color: '#0061ff', isPreset: true },
  { id: 'slack', name: 'Slack', category: 'cloud', website: 'https://slack.com', color: '#4a154b', isPreset: true },
  { id: '1password', name: '1Password', category: 'cloud', website: 'https://1password.com', color: '#0094f5', isPreset: true },
  
  // Gaming Category
  { id: 'steam', name: 'Steam', category: 'gaming', website: 'https://store.steampowered.com', color: '#171a21', isPreset: true },
  { id: 'ps-plus', name: 'PlayStation Plus', category: 'gaming', website: 'https://playstation.com', color: '#003791', isPreset: true },
  { id: 'xbox-gamepass', name: 'Xbox Game Pass', category: 'gaming', website: 'https://xbox.com/gamepass', color: '#107c10', isPreset: true },
  { id: 'nintendo-online', name: 'Nintendo Online', category: 'gaming', website: 'https://nintendo.com', color: '#e60012', isPreset: true },
  { id: 'ea-play', name: 'EA Play', category: 'gaming', website: 'https://ea.com/ea-play', color: '#1a1a2e', isPreset: true },
];

export function getProvidersByCategory(category?: Category): Provider[] {
  if (!category) return PRESET_PROVIDERS;
  return PRESET_PROVIDERS.filter(p => p.category === category);
}

export function searchProviders(query: string): Provider[] {
  const q = query.toLowerCase();
  return PRESET_PROVIDERS.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q)
  );
}

export function getProviderById(id: string): Provider | undefined {
  return PRESET_PROVIDERS.find(p => p.id === id);
}

// Get the initials for a provider (for avatar fallback)
export function getProviderInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
