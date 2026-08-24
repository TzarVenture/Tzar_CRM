import mongoose, { Schema, Document, Model } from "mongoose";

export type BusinessSlug = "tzar" | "adshalaa" | "crownleaf" | "titepo";

export type LeadSource =
  | "WEBSITE_CONTACT"
  | "WEBSITE_WEBDEV"
  | "WEBSITE_HIREUS"
  | "WEBSITE_ENQUIRY"
  | "WEBSITE_REGISTRATION"
  | "WEBSITE_WEBINAR"
  | "WEBSITE_BROCHURE"
  | "META_LEAD_AD"
  | "GOOGLE_SHEETS_SYNC"
  | "WHATSAPP_INBOUND"
  | "MANUAL";

export type LeadStatus = "ACTIVE" | "CONVERTED" | "ARCHIVED" | "LOST";

export type KanbanStage =
  | "new-lead"
  | "contacted"
  | "discovery-call"
  | "proposal-sent"
  | "negotiation"
  | "closed-won"
  | "closed-lost";

export interface ILead extends Document {
  leadCustomId: string;
  business: BusinessSlug;
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  city?: string;
  country?: string;
  pincode?: string;
  source: LeadSource;
  interestedServices: string[];
  estimatedBudget?: number;
  requirementsMessage?: string;
  pipelineId?: mongoose.Types.ObjectId;
  stageId: KanbanStage;
  assignedTo?: mongoose.Types.ObjectId;
  score: number;
  status: LeadStatus;
  clientId?: mongoose.Types.ObjectId;
  convertedClientId?: mongoose.Types.ObjectId;

  // 1. Tzar Agency Specific Sub-Schema
  tzarData?: {
    formType?: "CONTACT" | "WEBDEV" | "HIREUS" | "PAYMENT";
    domain?: string;
    internshipType?: string;
    resumeUrl?: string;
    checkboxConsent?: string;
  };

  // 2. Adshalaa EdTech Specific Sub-Schema
  adshalaaData?: {
    formType?: "ENQUIRY" | "REGISTRATION" | "WEBINAR" | "BROCHURE" | "CONTACT";
    programName?: string;
    dob?: string;
    professionalStatus?: string;
    company?: string;
    designation?: string;
    experience?: string;
    batch?: string;
    goals?: string;
    emergencyContact?: {
      name?: string;
      relation?: string;
      phone?: string;
    };
  };

  // 3. CrownLeaf Corporate Gifting Sub-Schema
  crownleafData?: {
    giftingCategory?: string;
    quantityUnits?: number;
  };

  // 4. Titepo Kids Toys Sub-Schema
  titepoData?: {
    eventType?: string;
    kidsCount?: number;
  };

  // Payment Tracking
  paymentData?: {
    amount?: number;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    paymentStatus?: "PENDING" | "PAID" | "FAILED";
  };

  // Meta Ads Attribution Data
  metaAdDetails?: {
    adId?: string;
    adName?: string;
    campaignId?: string;
    campaignName?: string;
    formId?: string;
    pageId?: string;
  };

  utmData?: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    landingPageUrl?: string;
  };

  syncedFrom?: string;
  slaDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema<ILead> = new Schema(
  {
    leadCustomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    business: {
      type: String,
      enum: ["tzar", "adshalaa", "crownleaf", "titepo"],
      default: "tzar",
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: false, lowercase: true, index: true, default: "" },
    phone: { type: String, required: true, index: true },
    companyName: { type: String, trim: true },
    city: { type: String },
    country: { type: String },
    pincode: { type: String },
    source: {
      type: String,
      enum: [
        "WEBSITE_CONTACT",
        "WEBSITE_WEBDEV",
        "WEBSITE_HIREUS",
        "WEBSITE_ENQUIRY",
        "WEBSITE_REGISTRATION",
        "WEBSITE_WEBINAR",
        "WEBSITE_BROCHURE",
        "META_LEAD_AD",
        "GOOGLE_SHEETS_SYNC",
        "WHATSAPP_INBOUND",
        "MANUAL",
      ],
      default: "WEBSITE_CONTACT",
      index: true,
    },
    interestedServices: [{ type: String }],
    estimatedBudget: { type: Number, default: 0 },
    requirementsMessage: { type: String },
    pipelineId: {
      type: Schema.Types.ObjectId,
      ref: "Pipeline",
      index: true,
    },
    stageId: {
      type: String,
      enum: [
        "new-lead",
        "contacted",
        "discovery-call",
        "proposal-sent",
        "negotiation",
        "closed-won",
        "closed-lost",
      ],
      default: "new-lead",
      required: true,
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    score: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "CONVERTED", "ARCHIVED", "LOST"],
      default: "ACTIVE",
      index: true,
    },
    clientId: { type: Schema.Types.ObjectId, ref: "Client" },

    tzarData: {
      formType: { type: String, enum: ["CONTACT", "WEBDEV", "HIREUS", "PAYMENT"] },
      domain: String,
      internshipType: String,
      resumeUrl: String,
      checkboxConsent: String,
    },

    adshalaaData: {
      formType: { type: String, enum: ["ENQUIRY", "REGISTRATION", "WEBINAR", "BROCHURE", "CONTACT"] },
      programName: String,
      dob: String,
      professionalStatus: String,
      company: String,
      designation: String,
      experience: String,
      batch: String,
      goals: String,
      emergencyContact: {
        name: String,
        relation: String,
        phone: String,
      },
    },

    crownleafData: {
      giftingCategory: String,
      quantityUnits: Number,
    },

    titepoData: {
      eventType: String,
      kidsCount: Number,
    },

    paymentData: {
      amount: Number,
      razorpayPaymentId: String,
      razorpayOrderId: String,
      paymentStatus: String,
    },

    metaAdDetails: {
      adId: String,
      adName: String,
      campaignId: String,
      campaignName: String,
      formId: String,
      pageId: String,
    },

    utmData: {
      utmSource: String,
      utmMedium: String,
      utmCampaign: String,
      landingPageUrl: String,
    },

    syncedFrom: { type: String },
    slaDeadline: { type: Date },
  },
  { timestamps: true }
);

// Compound indexes for fast multi-tenant queries
LeadSchema.index({ business: 1, status: 1 });
LeadSchema.index({ business: 1, stageId: 1, status: 1 });
LeadSchema.index({ business: 1, createdAt: -1 });
LeadSchema.index({ assignedTo: 1, status: 1 });
LeadSchema.index({ email: 1, createdAt: -1 });
LeadSchema.index({ phone: 1, createdAt: -1 });

// Clear cached model in dev mode to ensure updated schema & enums apply
delete (mongoose.models as any).Lead;

const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;


