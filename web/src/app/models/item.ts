export interface Item {
  id: number;
  type: ItemType;
  poster?: string;
}

export type ItemType = 'movie' | 'show';
