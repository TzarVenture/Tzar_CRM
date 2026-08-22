import mongoose, { Schema, Document, Model } from "mongoose";

export type MessageChannel = "WHATSAPP" | "GMAIL" | "SYSTEM_NOTE";
export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface IMessage extends Document {
  leadId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  channel: MessageChannel;
  direction: MessageDirection;
  senderId?: mongoose.Types.ObjectId;
  senderInfo?: {
    name: string;
    phoneOrEmail?: string;
  };
  content: string;
  mediaUrls?: string[];
  mediaType?: "image" | "document" | "audio" | "video";
  status: MessageStatus;
  externalMessageId?: string;
  gmailThreadId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", index: true },
    clientId: { type: Schema.Types.ObjectId, ref: "Client", index: true },
    channel: {
      type: String,
      enum: ["WHATSAPP", "GMAIL", "SYSTEM_NOTE"],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ["INBOUND", "OUTBOUND"],
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    senderInfo: {
      name: String,
      phoneOrEmail: String,
    },
    content: { type: String, required: true },
    mediaUrls: [{ type: String }],
    mediaType: {
      type: String,
      enum: ["image", "document", "audio", "video"],
    },
    status: {
      type: String,
      enum: ["QUEUED", "SENT", "DELIVERED", "READ", "FAILED"],
      default: "SENT",
      index: true,
    },
    externalMessageId: { type: String, index: true, sparse: true },
    gmailThreadId: { type: String, index: true, sparse: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Compound index for fast conversation thread loading
MessageSchema.index({ leadId: 1, channel: 1, createdAt: 1 });
MessageSchema.index({ clientId: 1, channel: 1, createdAt: 1 });

// Clear cached model in dev mode to ensure updated schema & enums apply
delete (mongoose.models as any).Message;

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
