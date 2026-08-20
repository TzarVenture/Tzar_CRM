import mongoose, { Schema, Document, Model } from "mongoose";

export type OnboardingStatus =
  | "NOT_STARTED"
  | "FORM_SENT"
  | "IN_REVIEW"
  | "COMPLETED";

export interface IClient extends Document {
  clientCustomId?: string;
  companyName: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
    designation?: string;
  };
  industry?: string;
  status?: string;
  monthlyRetainerBudget?: number;
  totalRevenueToDate?: number;
  accountManagerId?: mongoose.Types.ObjectId;
  onboardingStatus?: OnboardingStatus;
  onboardingCompleted?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onboardingData?: any;
  activeServices?: string[];
  totalRevenue?: number;
  portalAccessEnabled?: boolean;
  portalAccessActive?: boolean;
  portalPasscode?: string;
  portalPasswordHash?: string;
  convertedFromLeadId?: mongoose.Types.ObjectId;
  sourcedFromLeadId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    clientCustomId: { type: String, unique: true, sparse: true, index: true },
    companyName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    primaryContact: {
      name: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, index: true },
      phone: { type: String, required: true },
      designation: { type: String },
    },
    industry: { type: String },
    status: { type: String, default: "ACTIVE" },
    monthlyRetainerBudget: { type: Number, default: 0 },
    totalRevenueToDate: { type: Number, default: 0 },
    accountManagerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    onboardingStatus: {
      type: String,
      enum: ["NOT_STARTED", "FORM_SENT", "IN_REVIEW", "COMPLETED"],
      default: "NOT_STARTED",
      index: true,
    },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingData: { type: Schema.Types.Mixed },
    activeServices: [{ type: String }],
    totalRevenue: { type: Number, default: 0 },
    portalAccessEnabled: { type: Boolean, default: false },
    portalAccessActive: { type: Boolean, default: false },
    portalPasscode: { type: String },
    portalPasswordHash: { type: String },
    convertedFromLeadId: { type: Schema.Types.ObjectId, ref: "Lead" },
    sourcedFromLeadId: { type: Schema.Types.ObjectId, ref: "Lead" },
  },
  { timestamps: true }
);

const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>("Client", ClientSchema);

export default Client;
