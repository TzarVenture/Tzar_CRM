import mongoose, { Schema, Document, Model } from "mongoose";
import { BusinessSlug } from "./Lead";

export type BroadcastStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "PAUSED"
  | "FAILED";

export interface IRecipientLog {
  leadId: mongoose.Types.ObjectId;
  phone: string;
  name: string;
  status: "SENT" | "DELIVERED" | "FAILED";
  messageId?: string;
  errorReason?: string;
  sentAt?: Date;
}

export interface IBroadcastCampaign extends Document {
  name: string;
  business?: BusinessSlug;
  templateName: string;
  templateLanguage: string;
  templateParams: string[];
  mediaAttachment?: {
    type: "document" | "image";
    url?: string;
    filename?: string;
    caption?: string;
  };
  buttons?: {
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
  }[];
  targetFilter: {
    business?: BusinessSlug;
    stageId?: string;
    minBudget?: number;
    serviceTag?: string;
    selectedLeadIds?: mongoose.Types.ObjectId[];
  };
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  readCount: number;
  status: BroadcastStatus;
  recipientLogs: IRecipientLog[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastCampaignSchema: Schema<IBroadcastCampaign> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    business: {
      type: String,
      enum: ["tzar", "titepo", "crownleaf", "adshalaa"],
    },
    templateName: { type: String, required: true },
    templateLanguage: { type: String, default: "en" },
    templateParams: [{ type: String }],
    mediaAttachment: {
      type: { type: String, enum: ["document", "image"] },
      url: String,
      filename: String,
      caption: String,
    },
    buttons: [
      {
        type: { type: String },
        text: String,
        url: String,
        phone_number: String,
      },
    ],
    targetFilter: {
      business: String,
      stageId: String,
      minBudget: Number,
      serviceTag: String,
      selectedLeadIds: [{ type: Schema.Types.ObjectId, ref: "Lead" }],
    },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["DRAFT", "SCHEDULED", "QUEUED", "PROCESSING", "COMPLETED", "PAUSED", "FAILED"],
      default: "QUEUED",
      index: true,
    },
    recipientLogs: [
      {
        leadId: { type: Schema.Types.ObjectId, ref: "Lead" },
        phone: String,
        name: String,
        status: { type: String, enum: ["SENT", "DELIVERED", "FAILED"], default: "SENT" },
        messageId: String,
        errorReason: String,
        sentAt: { type: Date, default: Date.now },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const BroadcastCampaign: Model<IBroadcastCampaign> =
  mongoose.models.BroadcastCampaign ||
  mongoose.model<IBroadcastCampaign>("BroadcastCampaign", BroadcastCampaignSchema);

export default BroadcastCampaign;
