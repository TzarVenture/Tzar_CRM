import mongoose, { Schema, Document, Model } from "mongoose";

export type BroadcastStatus = "SCHEDULED" | "DISPATCHING" | "COMPLETED" | "FAILED";

export interface IBroadcastCampaign extends Document {
  name: string;
  templateName: string;
  templateParams: string[];
  targetFilter: {
    stageId?: string;
    minBudget?: number;
    serviceTag?: string;
  };
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  status: BroadcastStatus;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BroadcastCampaignSchema: Schema<IBroadcastCampaign> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    templateName: { type: String, required: true },
    templateParams: [{ type: String }],
    targetFilter: {
      stageId: String,
      minBudget: Number,
      serviceTag: String,
    },
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["SCHEDULED", "DISPATCHING", "COMPLETED", "FAILED"],
      default: "SCHEDULED",
      index: true,
    },
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
