export type MediaType = 'image' | 'video';

export interface MediaItem {
  _id: string;
  type: MediaType;
  image?: string | null;
  video?: string | null;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

