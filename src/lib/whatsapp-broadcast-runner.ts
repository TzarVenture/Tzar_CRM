import axios from "axios";
import dbConnect from "@/lib/db";
import BroadcastCampaign, { IRecipientLog } from "@/models/BroadcastCampaign";
import Lead from "@/models/Lead";
import Message from "@/models/Message";

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";

/**
 * Format phone number to E.164 without +
 */
function cleanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.substring(1)}`;
  return digits;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a live WhatsApp bulk broadcast campaign with paced rate-limiting,
 * rich media/document attachment support, and automatic activity timeline logging.
 */
export async function executeBroadcastCampaign(campaignId: string): Promise<void> {
  await dbConnect();

  const campaign = await BroadcastCampaign.findById(campaignId);
  if (!campaign) {
    console.error(`Broadcast campaign ${campaignId} not found.`);
    return;
  }

  campaign.status = "PROCESSING";
  await campaign.save();

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken =
    process.env.WHATSAPP_TOKEN ||
    process.env.WHATSAPP_PERMANENT_ACCESS_TOKEN ||
    process.env.META_SYSTEM_USER_TOKEN;

  if (!phoneNumberId || !accessToken || !accessToken.startsWith("EAA")) {
    console.error("Meta WhatsApp Cloud API credentials missing or invalid.");
    campaign.status = "FAILED";
    await campaign.save();
    return;
  }

  // 1. Resolve Target Leads
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let leadFilter: any = { status: "ACTIVE" };

  if (campaign.targetFilter.selectedLeadIds && campaign.targetFilter.selectedLeadIds.length > 0) {
    leadFilter = { _id: { $in: campaign.targetFilter.selectedLeadIds } };
  } else {
    if (campaign.targetFilter.business) {
      leadFilter.business = campaign.targetFilter.business;
    }
    if (campaign.targetFilter.stageId) {
      leadFilter.stageId = campaign.targetFilter.stageId;
    }
    if (campaign.targetFilter.minBudget) {
      leadFilter.estimatedBudget = { $gte: campaign.targetFilter.minBudget };
    }
    if (campaign.targetFilter.serviceTag) {
      leadFilter.interestedServices = campaign.targetFilter.serviceTag;
    }
  }

  const targetLeads = await Lead.find(leadFilter);
  campaign.totalRecipients = targetLeads.length;
  await campaign.save();

  if (targetLeads.length === 0) {
    campaign.status = "COMPLETED";
    await campaign.save();
    return;
  }

  const logs: IRecipientLog[] = [];
  let sent = 0;
  let failed = 0;

  for (const lead of targetLeads) {
    if (!lead.phone) {
      failed++;
      logs.push({
        leadId: lead._id,
        phone: "N/A",
        name: lead.fullName,
        status: "FAILED",
        errorReason: "Missing phone number",
        sentAt: new Date(),
      });
      continue;
    }

    const formattedPhone = cleanPhone(lead.phone);
    if (formattedPhone.length < 10) {
      failed++;
      logs.push({
        leadId: lead._id,
        phone: lead.phone,
        name: lead.fullName,
        status: "FAILED",
        errorReason: "Invalid phone format",
        sentAt: new Date(),
      });
      continue;
    }

    // Build personalized template parameters
    // {{1}} = Lead Name
    // {{2}} = Lead Interest or Default Value
    const firstParam = lead.fullName || "Valued Client";
    const secondParam =
      lead.interestedServices?.[0] ||
      (lead.business === "titepo"
        ? "Return Gift Favors"
        : lead.business === "tzar"
        ? "Website Development"
        : lead.business === "crownleaf"
        ? "Corporate Gifting Hampers"
        : "Digital Marketing Certification");

    const bodyParams = [firstParam, secondParam];
    if (campaign.templateParams && campaign.templateParams.length > 2) {
      bodyParams.push(...campaign.templateParams.slice(2));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components: any[] = [
      {
        type: "body",
        parameters: bodyParams.map((p) => ({
          type: "text",
          text: p,
        })),
      },
    ];

    // Rich Header Document/PDF Attachment
    if (campaign.mediaAttachment && campaign.mediaAttachment.url) {
      if (campaign.mediaAttachment.type === "document") {
        components.unshift({
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                link: campaign.mediaAttachment.url,
                filename: campaign.mediaAttachment.filename || "Catalog_Brochure.pdf",
              },
            },
          ],
        });
      } else if (campaign.mediaAttachment.type === "image") {
        components.unshift({
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: campaign.mediaAttachment.url,
              },
            },
          ],
        });
      }
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: campaign.templateName,
        language: { code: campaign.templateLanguage || "en_US" },
        components,
      },
    };

    try {
      const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      const messageId = res.data?.messages?.[0]?.id || `wmid.${Date.now()}`;
      sent++;

      logs.push({
        leadId: lead._id,
        phone: formattedPhone,
        name: lead.fullName,
        status: "SENT",
        messageId,
        sentAt: new Date(),
      });

      // Insert outbound message document into lead timeline
      await Message.create({
        leadId: lead._id,
        channel: "WHATSAPP",
        direction: "OUTBOUND",
        senderId: campaign.createdBy,
        senderInfo: {
          name: "Broadcast Campaign Bot",
          phoneOrEmail: "system@tzarcrm.com",
        },
        content: `[Bulk Broadcast: ${campaign.name}] Template: ${campaign.templateName}`,
        externalMessageId: messageId,
        status: "SENT",
        isRead: true,
      });
    } catch (err: any) {
      failed++;
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.error?.error_user_msg ||
        err.message ||
        "Meta API dispatch failed";

      logs.push({
        leadId: lead._id,
        phone: formattedPhone,
        name: lead.fullName,
        status: "FAILED",
        errorReason: errorMsg,
        sentAt: new Date(),
      });
    }

    // Rate pacing: 65ms sleep (~15 messages/second) to protect Meta phone number quality score
    await delay(65);
  }

  campaign.sentCount = sent;
  campaign.deliveredCount = sent; // Meta webhooks will update to read/delivered
  campaign.failedCount = failed;
  campaign.status = failed === targetLeads.length ? "FAILED" : "COMPLETED";
  campaign.recipientLogs = logs;

  await campaign.save();
}
