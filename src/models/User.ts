import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole =
  | "SUPER_ADMIN"
  | "SALES_MANAGER"
  | "BDE"
  | "MEDIA_BUYER"
  | "ACCOUNT_MANAGER"
  | "CLIENT";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  assignedPipelineIds: mongoose.Types.ObjectId[];
  googleOAuthTokens?: {
    accessToken?: string;
    refreshToken?: string;
    expiryDate?: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "SUPER_ADMIN",
        "SALES_MANAGER",
        "BDE",
        "MEDIA_BUYER",
        "ACCOUNT_MANAGER",
        "CLIENT",
      ],
      default: "BDE",
      required: true,
      index: true,
    },
    phone: { type: String, trim: true },
    avatarUrl: { type: String },
    assignedPipelineIds: [{ type: Schema.Types.ObjectId, ref: "Pipeline" }],
    googleOAuthTokens: {
      accessToken: { type: String },
      refreshToken: { type: String },
      expiryDate: { type: Number },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
