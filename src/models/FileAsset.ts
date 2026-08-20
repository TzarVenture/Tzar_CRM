import mongoose, { Schema, Document, Model } from "mongoose";

export type FileAccessLevel = "PUBLIC_CLIENT" | "INTERNAL_ONLY";
export type FileCategory =
  | "CONTRACT"
  | "PROPOSAL"
  | "DESIGN_ASSET"
  | "INVOICE"
  | "DESIGN_CONCEPT"
  | "BRAND_ASSET"
  | "SITE_MAP"
  | "REPORT"
  | "OTHER";

export interface IFileAsset extends Document {
  fileName: string;
  originalName?: string;
  fileUrl: string;
  fileKey?: string;
  s3Key?: string;
  fileType?: string;
  mimeType?: string;
  fileSize: number;
  category: FileCategory;
  uploadedBy: mongoose.Types.ObjectId;
  relatedLeadId?: mongoose.Types.ObjectId;
  relatedClientId?: mongoose.Types.ObjectId;
  accessLevel: FileAccessLevel;
  version?: number;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FileAssetSchema: Schema<IFileAsset> = new Schema(
  {
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String },
    fileUrl: { type: String, required: true },
    fileKey: { type: String },
    s3Key: { type: String, sparse: true },
    fileType: { type: String },
    mimeType: { type: String },
    fileSize: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "CONTRACT",
        "PROPOSAL",
        "DESIGN_ASSET",
        "INVOICE",
        "DESIGN_CONCEPT",
        "BRAND_ASSET",
        "SITE_MAP",
        "REPORT",
        "OTHER",
      ],
      default: "OTHER",
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    relatedLeadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      index: true,
      sparse: true,
    },
    relatedClientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      index: true,
      sparse: true,
    },
    accessLevel: {
      type: String,
      enum: ["PUBLIC_CLIENT", "INTERNAL_ONLY"],
      default: "INTERNAL_ONLY",
      index: true,
    },
    version: { type: Number, default: 1 },
    thumbnailUrl: { type: String },
  },
  { timestamps: true }
);

const FileAsset: Model<IFileAsset> =
  mongoose.models.FileAsset ||
  mongoose.model<IFileAsset>("FileAsset", FileAssetSchema);

export default FileAsset;
