import mongoose, { Schema, Document, Model } from "mongoose";

export type MatchType = "EXACT" | "CONTAINS";
export type ActionType = "REPLY_TEXT" | "SEND_TEMPLATE" | "UPDATE_SCORE" | "CHANGE_STAGE";

export interface IChatbotRule extends Document {
  triggerKeyword: string;
  matchType: MatchType;
  actionType: ActionType;
  replyContent?: string;
  templateName?: string;
  targetStageId?: string;
  scoreBoost?: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatbotRuleSchema: Schema<IChatbotRule> = new Schema(
  {
    triggerKeyword: { type: String, required: true, trim: true, lowercase: true, index: true },
    matchType: {
      type: String,
      enum: ["EXACT", "CONTAINS"],
      default: "CONTAINS",
    },
    actionType: {
      type: String,
      enum: ["REPLY_TEXT", "SEND_TEMPLATE", "UPDATE_SCORE", "CHANGE_STAGE"],
      default: "REPLY_TEXT",
    },
    replyContent: { type: String },
    templateName: { type: String },
    targetStageId: { type: String },
    scoreBoost: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const ChatbotRule: Model<IChatbotRule> =
  mongoose.models.ChatbotRule ||
  mongoose.model<IChatbotRule>("ChatbotRule", ChatbotRuleSchema);

export default ChatbotRule;
