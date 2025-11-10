export interface SearchItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  shortcut?: {
    keys: string[];
    separator?: 'then' | '+';
  };
  href?: string;
}

export interface SearchGroup {
  id: string;
  label: string;
  items: SearchItem[];
}

export interface RecentItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  timestamp: number;
}
