import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Lead from "@/models/Lead";
import { getDefaultPipeline } from "@/lib/lead-utils";

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    await dbConnect();

    // 1. Create Super Admin User
    let adminUser = await User.findOne({ email: "admin@tzar.agency" });
    if (!adminUser) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      adminUser = await User.create({
        name: "Agency Owner (Admin)",
        email: "admin@tzar.agency",
        passwordHash,
        role: "SUPER_ADMIN",
        phone: "+91 98765 00001",
        isActive: true,
      });
    }

    // 2. Create BDE User (Sales Rep)
    let bdeUser = await User.findOne({ email: "bde@tzar.agency" });
    if (!bdeUser) {
      const passwordHash = await bcrypt.hash("bde123", 10);
      bdeUser = await User.create({
        name: "Alexander Wright (BDE)",
        email: "bde@tzar.agency",
        passwordHash,
        role: "BDE",
        phone: "+91 98765 00002",
        isActive: true,
      });
    }

    // 3. Ensure Default Pipeline exists
    const pipeline = await getDefaultPipeline();

    // 4. Create Sample Leads if collection is empty
    const leadCount = await Lead.countDocuments();
    if (leadCount === 0) {
      const sampleLeads = [
        // ─── BRAND 1: TZAR (Agency) ──────────────────────────────────
        {
          leadCustomId: "TZ-LD-1001",
          business: "tzar",
          fullName: "Vikram Malhotra",
          email: "vikram@innovatecorp.com",
          phone: "+91 98765 43210",
          companyName: "Innovate Corp Ltd",
          city: "Mumbai",
          country: "India",
          source: "WEBSITE_CONTACT",
          interestedServices: ["Websites Design & Development", "Search Engine Optimization (SEO)"],
          estimatedBudget: 15000,
          requirementsMessage: "Looking for a full revamp of our e-commerce platform and monthly SEO retainers.",
          tzarData: {
            formType: "CONTACT",
            domain: "innovatecorp.com",
          },
          pipelineId: pipeline._id,
          stageId: "new-lead",
          assignedTo: bdeUser._id,
          score: 45,
          status: "ACTIVE",
          slaDeadline: new Date(Date.now() + 18 * 3600 * 1000),
        },
        {
          leadCustomId: "TZ-LD-1002",
          business: "tzar",
          fullName: "Sophia Rodriguez",
          email: "sophia@nexusbranding.co",
          phone: "+1 415 555 0199",
          companyName: "Nexus Ventures",
          city: "San Francisco",
          country: "USA",
          source: "META_LEAD_AD",
          interestedServices: ["Brand Marketing", "Performance Marketing"],
          estimatedBudget: 8500,
          requirementsMessage: "Need complete brand strategy guidelines, logo redesign, and Meta ad campaign setup.",
          pipelineId: pipeline._id,
          stageId: "contacted",
          assignedTo: bdeUser._id,
          score: 35,
          status: "ACTIVE",
          slaDeadline: new Date(Date.now() + 8 * 3600 * 1000),
        },

        // ─── BRAND 2: ADSHALAA (EdTech) ──────────────────────────────
        {
          leadCustomId: "AD-LD-1001",
          business: "adshalaa",
          fullName: "Priya Sharma",
          email: "priya.sharma@gmail.com",
          phone: "+91 99887 76655",
          city: "Delhi",
          country: "India",
          source: "WEBSITE_ENQUIRY",
          interestedServices: ["Certification in Advanced Digital Marketing & AI"],
          estimatedBudget: 45000,
          requirementsMessage: "Interested in the offline weekend batch for Digital Marketing & AI in South Ex Delhi.",
          adshalaaData: {
            formType: "ENQUIRY",
            programName: "Certification in Advanced Digital Marketing & AI",
            professionalStatus: "Working Professional",
            batch: "Weekend Offline",
          },
          pipelineId: pipeline._id,
          stageId: "new-lead",
          assignedTo: bdeUser._id,
          score: 50,
          status: "ACTIVE",
          slaDeadline: new Date(Date.now() + 12 * 3600 * 1000),
        },
        {
          leadCustomId: "AD-LD-1002",
          business: "adshalaa",
          fullName: "Rohan Kapoor",
          email: "rohan.kapoor@techstart.io",
          phone: "+91 91234 56789",
          city: "Bengaluru",
          country: "India",
          source: "WEBSITE_REGISTRATION",
          interestedServices: ["Full Stack Web Development"],
          estimatedBudget: 60000,
          requirementsMessage: "Registered for MERN stack course. Paid ₹2000 registration fee via Razorpay.",
          adshalaaData: {
            formType: "REGISTRATION",
            programName: "Certification in Web Development",
            professionalStatus: "Student",
            batch: "Weekday Evening Online",
          },
          paymentData: {
            amount: 2000,
            razorpayPaymentId: "pay_NkJ8712aBczQ",
            razorpayOrderId: "order_NkJ8712aBczQ",
            paymentStatus: "PAID",
          },
          pipelineId: pipeline._id,
          stageId: "proposal-sent",
          assignedTo: bdeUser._id,
          score: 75,
          status: "ACTIVE",
          slaDeadline: new Date(Date.now() + 20 * 3600 * 1000),
        },

        // ─── BRAND 3: CROWNLEAF (Corporate Gifting) ───────────────────
        {
          leadCustomId: "CL-LD-1001",
          business: "crownleaf",
          fullName: "Amitabh Sen",
          email: "amitabh.sen@tata.com",
          phone: "+91 98200 11223",
          companyName: "Tata Consultancy Services",
          city: "Mumbai",
          country: "India",
          source: "META_LEAD_AD",
          interestedServices: ["Executive Festive Gift Hampers"],
          estimatedBudget: 350000,
          requirementsMessage: "Need 500 custom branded Diwali executive gift boxes with engraved leather diaries & brass pens.",
          crownleafData: {
            giftingCategory: "Festive Executive Hampers",
            quantityUnits: 500,
          },
          pipelineId: pipeline._id,
          stageId: "discovery-call",
          assignedTo: bdeUser._id,
          score: 80,
          status: "ACTIVE",
          slaDeadline: new Date(Date.now() - 3 * 3600 * 1000), // SLA Overdue
        },

        // ─── BRAND 4: TITEPO (Kids Toys & Gifts) ─────────────────────
        {
          leadCustomId: "TP-LD-1001",
          business: "titepo",
          fullName: "Neha Merchant",
          email: "neha.merchant@yahoo.com",
          phone: "+91 97690 98765",
          city: "Mumbai",
          country: "India",
          pincode: "400050",
          source: "META_LEAD_AD",
          interestedServices: ["Birthday Return Gifts Combo Packs"],
          estimatedBudget: 18000,
          requirementsMessage: "Looking for 35 customized STEM toy return gift sets for a 7th birthday party.",
          titepoData: {
            eventType: "Birthday Return Gifts",
            kidsCount: 35,
          },
          pipelineId: pipeline._id,
          stageId: "new-lead",
          assignedTo: bdeUser._id,
          score: 40,
          status: "ACTIVE",
          slaDeadline: new Date(Date.now() + 15 * 3600 * 1000),
        },
      ];

      await Lead.insertMany(sampleLeads);
    }

    return NextResponse.json({
      status: "success",
      message: "Database seeded successfully for all 4 brands (Tzar, Adshalaa, CrownLeaf, Titepo)!",
      credentials: [
        {
          role: "Super Admin",
          email: "admin@tzar.agency",
          password: "admin123",
        },
        {
          role: "BDE (Sales Rep)",
          email: "bde@tzar.agency",
          password: "bde123",
        },
      ],
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: String(error) },
      { status: 500 }
    );
  }
}

