import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMetaInsight extends Document {
  campaignId: string;
  campaignName: string;
  adAccountId: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpl: number;
  leadsCaptured: number;
  wonDeals: number;
  revenueGenerated: number;
  roas: number;
  datePreset: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MetaInsightSchema: Schema<IMetaInsight> = new Schema(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    campaignName: { type: String, required: true, trim: true },
    adAccountId: { type: String, required: true },
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "COMPLETED"],
      default: "ACTIVE",
      index: true,
    },
    spend: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpl: { type: Number, default: 0 },
    leadsCaptured: { type: Number, default: 0 },
    wonDeals: { type: Number, default: 0 },
    revenueGenerated: { type: Number, default: 0 },
    roas: { type: Number, default: 0 },
    datePreset: { type: String, default: "this_month" },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MetaInsight: Model<IMetaInsight> =
  mongoose.models.MetaInsight ||
  mongoose.model<IMetaInsight>("MetaInsight", MetaInsightSchema);

export default MetaInsight;
