import mongoose, { Schema, Document } from 'mongoose';

export interface IMedia extends Document {
  type: 'image' | 'video';
  image?: string;
  video?: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
}

const MediaSchema = new Schema<IMedia>(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    image: { type: String, default: null },
    video: { type: String, default: null },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: String, required: true, default: 'admin' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MediaSchema.index({ type: 1 });
MediaSchema.index({ uploadedAt: -1 });

const Media = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
