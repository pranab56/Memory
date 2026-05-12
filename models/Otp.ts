import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  email: string;
  otp: string;
  createdAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes expiry
    },
  },
  { timestamps: true }
);

const Otp = mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);

export default Otp;
