"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  UserPlus,
  BookOpen,
  Gift,
  ShoppingBag,
  Briefcase,
  Loader2,
  Calendar,
  DollarSign,
  MapPin,
  Building2,
  Tag,
  Clock,
  Sparkles,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { BusinessSlug } from "@/models/Lead";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: (newLead?: any) => void;
}

export function CreateLeadModal({ isOpen, onClose, onLeadCreated }: CreateLeadModalProps) {
  const [business, setBusiness] = useState<BusinessSlug>("titepo");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [requirementsMessage, setRequirementsMessage] = useState("");

  // 1. Tzar Specific Form States
  const [tzarCompanyName, setTzarCompanyName] = useState("");
  const [tzarService, setTzarService] = useState("Shopify E-Commerce Store");
  const [tzarBudget, setTzarBudget] = useState<number>(75000);
  const [tzarTimeline, setTzarTimeline] = useState("Immediately");
  const [tzarHasWebsite, setTzarHasWebsite] = useState("No (Need New Website)");
  const [tzarWebsiteUrl, setTzarWebsiteUrl] = useState("");
  const [tzarCompanyType, setTzarCompanyType] = useState("Bootstrapped (Self-Funded)");

  // 2. Adshalaa Specific Form States
  const [adshalaaCourse, setAdshalaaCourse] = useState("Certification in Advanced Digital Marketing & AI");
  const [adshalaaStatus, setAdshalaaStatus] = useState("Working Professional");
  const [adshalaaMode, setAdshalaaMode] = useState("Weekend Classroom (Offline)");
  const [adshalaaBatch, setAdshalaaBatch] = useState("Weekend Batch (Sat-Sun 10 AM - 2 PM)");
  const [adshalaaFeeBudget, setAdshalaaFeeBudget] = useState<number>(45000);
  const [adshalaaGoal, setAdshalaaGoal] = useState("High-Growth Agency Placement");

  // 3. Crownleaf Specific Form States
  const [crownleafCompanyName, setCrownleafCompanyName] = useState("");
  const [crownleafOccasion, setCrownleafOccasion] = useState("Corporate Festive Hampers");
  const [crownleafQty, setCrownleafQty] = useState<number>(50);
  const [crownleafBudgetPerBox, setCrownleafBudgetPerBox] = useState<number>(1500);
  const [crownleafRecipient, setCrownleafRecipient] = useState("Corporate Employees");
  const [crownleafBranding, setCrownleafBranding] = useState("Bespoke Custom Logo Box & Packaging");
  const [crownleafDeliveryDate, setCrownleafDeliveryDate] = useState("");

  // 4. Titepo Specific Form States
  const [titepoOccasion, setTitepoOccasion] = useState("Birthday Party");
  const [titepoKidsCount, setTitepoKidsCount] = useState<number>(35);
  const [titepoBudgetPerGift, setTitepoBudgetPerGift] = useState("₹501 - ₹1,000");
  const [titepoAvgPrice, setTitepoAvgPrice] = useState<number>(750);
  const [titepoAgeGroup, setTitepoAgeGroup] = useState("4 - 6 Years");
  const [titepoEventDate, setTitepoEventDate] = useState("");
  const [titepoDeliveryAddress, setTitepoDeliveryAddress] = useState("");
  const [titepoSpecialReqs, setTitepoSpecialReqs] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync budget estimates based on brand inputs
  useEffect(() => {
    if (titepoBudgetPerGift === "₹250 - ₹500") setTitepoAvgPrice(350);
    else if (titepoBudgetPerGift === "₹501 - ₹1,000") setTitepoAvgPrice(750);
    else if (titepoBudgetPerGift === "₹1,000 - ₹2,000") setTitepoAvgPrice(1500);
    else if (titepoBudgetPerGift === "₹2,000+") setTitepoAvgPrice(2500);
  }, [titepoBudgetPerGift]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let interestSummary = "Sales Inquiry";
      let finalEstimatedBudget = 0;
      let finalCompanyName = "";

      const payload: any = {
        business,
        fullName,
        email: email.toLowerCase(),
        phone,
        city: city || undefined,
        source,
        requirementsMessage,
      };

      if (business === "tzar") {
        finalEstimatedBudget = Number(tzarBudget) || 0;
        finalCompanyName = tzarCompanyName;
        interestSummary = `${tzarService} (${tzarTimeline})`;
        payload.tzarData = {
          serviceNeeded: tzarService,
          budget: `₹${finalEstimatedBudget.toLocaleString()}`,
          timeline: tzarTimeline,
          hasWebsite: tzarHasWebsite,
          domain: tzarWebsiteUrl || undefined,
          companyType: tzarCompanyType,
          companyName: tzarCompanyName || undefined,
          formType: "WEBDEV",
        };
      } else if (business === "adshalaa") {
        finalEstimatedBudget = Number(adshalaaFeeBudget) || 0;
        interestSummary = `${adshalaaCourse} (${adshalaaMode})`;
        payload.adshalaaData = {
          courseName: adshalaaCourse,
          studentStatus: adshalaaStatus,
          learningMode: adshalaaMode,
          batch: adshalaaBatch,
          careerGoal: adshalaaGoal,
          formType: "ENQUIRY",
        };
      } else if (business === "crownleaf") {
        finalCompanyName = crownleafCompanyName;
        finalEstimatedBudget = Number(crownleafQty) * Number(crownleafBudgetPerBox);
        interestSummary = `${crownleafOccasion} (${crownleafQty} Boxes @ ₹${crownleafBudgetPerBox}/box)`;
        payload.crownleafData = {
          giftingOccasion: crownleafOccasion,
          recipientType: crownleafRecipient,
          boxQuantity: `${crownleafQty} Boxes`,
          budgetPerBox: `₹${Number(crownleafBudgetPerBox).toLocaleString()}`,
          customBranding: crownleafBranding,
          quantityUnits: Number(crownleafQty),
        };
      } else if (business === "titepo") {
        finalEstimatedBudget = Number(titepoKidsCount) * Number(titepoAvgPrice);
        interestSummary = `${titepoOccasion} (${titepoKidsCount} Gifts · ${titepoBudgetPerGift})`;
        payload.titepoData = {
          eventType: titepoOccasion,
          kidsCount: `${titepoKidsCount} Gifts`,
          budgetPerGift: titepoBudgetPerGift,
          childAgeGroup: titepoAgeGroup,
          eventDate: titepoEventDate || undefined,
          specialRequirements: titepoSpecialReqs || undefined,
          streetAddress: titepoDeliveryAddress || city || undefined,
          platform: "manual",
        };
        payload.city = city || titepoDeliveryAddress || undefined;
      }

      payload.companyName = finalCompanyName || undefined;
      payload.estimatedBudget = finalEstimatedBudget;
      payload.interestedServices = [interestSummary];

      const res = await axios.post("/api/v1/leads", payload);
      onLeadCreated(res.data?.lead);
      onClose();
    } catch (err: any) {
      console.error("Failed to create manual lead:", err);
      setError(err.response?.data?.error || "Failed to create lead. Please verify inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 modal-overlay animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-slate-300 shadow-2xl overflow-hidden">
        {/* Brand Accent Top Line */}
        <div
          className="h-1.5 w-full shrink-0 transition-colors"
          style={{
            backgroundColor:
              business === "tzar"
                ? "#047857"
                : business === "adshalaa"
                ? "#1d4ed8"
                : business === "crownleaf"
                ? "#d97706"
                : "#e11d48",
          }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl text-white font-bold"
              style={{
                backgroundColor:
                  business === "tzar"
                    ? "#047857"
                    : business === "adshalaa"
                    ? "#1d4ed8"
                    : business === "crownleaf"
                    ? "#d97706"
                    : "#e11d48",
              }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Add New Manual Lead</h2>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
                Record authentic, brand-tailored sales inquiry across Tzar Group business units
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
              {error}
            </div>
          )}

          {/* 1. Business Unit Picker */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Business Unit *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "titepo", label: "Titepo Toys", sub: "Return Gifts", icon: ShoppingBag, color: "text-rose-600" },
                { id: "tzar", label: "Tzar Agency", sub: "Web & Ads", icon: Briefcase, color: "text-emerald-700" },
                { id: "adshalaa", label: "Adshalaa", sub: "EdTech Courses", icon: BookOpen, color: "text-blue-700" },
                { id: "crownleaf", label: "CrownLeaf", sub: "Luxury Gifting", icon: Gift, color: "text-amber-700" },
              ].map((b) => {
                const Icon = b.icon;
                const active = business === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBusiness(b.id as BusinessSlug)}
                    className={`flex flex-col items-start p-3 rounded-2xl border transition-all cursor-pointer ${
                      active
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : b.color}`} />
                      <span className="font-extrabold text-xs">{b.label}</span>
                    </div>
                    <span className={`text-[10px] font-medium ${active ? "text-slate-300" : "text-slate-400"}`}>
                      {b.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Brand-Specific Primary Contact Info */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-600" />
              {business === "titepo" && "1. Parent / Client Contact Details"}
              {business === "tzar" && "1. Founder / Business Contact Details"}
              {business === "adshalaa" && "1. Student / Applicant Contact Details"}
              {business === "crownleaf" && "1. Corporate Client & HR Contact Details"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {business === "titepo" && "Parent / Client Full Name *"}
                  {business === "tzar" && "Founder / Client Full Name *"}
                  {business === "adshalaa" && "Candidate Full Name *"}
                  {business === "crownleaf" && "Corporate Contact Person *"}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={
                    business === "titepo"
                      ? "e.g. Priya Sharma"
                      : business === "tzar"
                      ? "e.g. Vikram Mehta"
                      : business === "adshalaa"
                      ? "e.g. Rahul Verma"
                      : "e.g. Umesh Mestry"
                  }
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                />
              </div>

              {/* Tzar & Crownleaf require Company Name */}
              {(business === "tzar" || business === "crownleaf") && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {business === "tzar" ? "Brand / Company Name *" : "Corporate Organization / Company *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={business === "tzar" ? tzarCompanyName : crownleafCompanyName}
                    onChange={(e) =>
                      business === "tzar"
                        ? setTzarCompanyName(e.target.value)
                        : setCrownleafCompanyName(e.target.value)
                    }
                    placeholder={business === "tzar" ? "e.g. VaDarnci Footwear" : "e.g. ZTE Telecom"}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                  />
                </div>
              )}

              {/* City / Delivery Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {business === "titepo" ? "Delivery City / Location" : "City / Location"}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai / Bangalore"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none focus:border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* 3. 100% Brand-Specific Scope & Specifications Section */}

          {/* ─── TITEPO TOYS FORM ────────────────────────────────────────── */}
          {business === "titepo" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-pink-950 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-pink-600" />
                2. Titepo Return Gifts & Party Event Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Occasion / Event *</label>
                  <select
                    value={titepoOccasion}
                    onChange={(e) => setTitepoOccasion(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Baby Shower">Baby Shower</option>
                    <option value="Naming Ceremony">Naming Ceremony</option>
                    <option value="School Event / Annual Day">School Event / Annual Day</option>
                    <option value="Wedding / Sangeet Favors">Wedding / Sangeet Favors</option>
                    <option value="Festive Return Gifts">Festive Return Gifts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Return Gifts Quantity (Count) *</label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={titepoKidsCount}
                    onChange={(e) => setTitepoKidsCount(Number(e.target.value))}
                    placeholder="35"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Budget Per Return Gift *</label>
                  <select
                    value={titepoBudgetPerGift}
                    onChange={(e) => setTitepoBudgetPerGift(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="₹250 - ₹500">₹250 - ₹500 per gift</option>
                    <option value="₹501 - ₹1,000">₹501 - ₹1,000 per gift</option>
                    <option value="₹1,000 - ₹2,000">₹1,000 - ₹2,000 per gift</option>
                    <option value="₹2,000+">₹2,000+ per gift</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Child Age Group *</label>
                  <select
                    value={titepoAgeGroup}
                    onChange={(e) => setTitepoAgeGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="1 - 3 Years">1 - 3 Years (Toddlers)</option>
                    <option value="4 - 6 Years">4 - 6 Years (Pre-School)</option>
                    <option value="7 - 10 Years">7 - 10 Years (Primary)</option>
                    <option value="10+ Years">10+ Years (Pre-Teens)</option>
                    <option value="Mixed Age Group">Mixed Age Group</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-pink-600" /> Event Date (Party Date)
                  </label>
                  <input
                    type="date"
                    value={titepoEventDate}
                    onChange={(e) => setTitepoEventDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Customization & Personalization Requests
                </label>
                <input
                  type="text"
                  value={titepoSpecialReqs}
                  onChange={(e) => setTitepoSpecialReqs(e.target.value)}
                  placeholder="e.g. Personalized child name tags, unicorn theme, urgent delivery"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                />
              </div>

              {/* Titepo Dynamic Budget Calculation Box */}
              <div className="p-3.5 rounded-xl bg-white border border-pink-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-extrabold text-slate-800">Calculated Expected Event Budget:</p>
                  <p className="text-slate-500 text-[11px]">
                    {titepoKidsCount} gifts × {titepoBudgetPerGift}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-700">
                    ₹{(titepoKidsCount * titepoAvgPrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── TZAR AGENCY FORM ────────────────────────────────────────── */}
          {business === "tzar" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                2. Tzar Agency Project Scope & Marketing Investment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Service Needed *</label>
                  <select
                    value={tzarService}
                    onChange={(e) => setTzarService(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Shopify E-Commerce Store">Shopify E-Commerce Store</option>
                    <option value="Custom Next.js Web App">Custom Next.js Web Application</option>
                    <option value="UI/UX & Brand Identity">UI/UX & Brand Identity</option>
                    <option value="Performance Marketing & Meta Ads">Performance Marketing & Meta Ads</option>
                    <option value="SEO & Organic Growth">SEO & Organic Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Project / Contract Budget (₹) *</label>
                  <input
                    type="number"
                    min="10000"
                    step="5000"
                    required
                    value={tzarBudget}
                    onChange={(e) => setTzarBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Launch Timeline *</label>
                  <select
                    value={tzarTimeline}
                    onChange={(e) => setTzarTimeline(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Immediately">Immediately (Within 7-14 Days)</option>
                    <option value="Within 1 Month">Within 1 Month</option>
                    <option value="1 - 3 Months">1 - 3 Months</option>
                    <option value="Exploring / Planning">Exploring / Planning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Current Website Status *</label>
                  <select
                    value={tzarHasWebsite}
                    onChange={(e) => setTzarHasWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="No (Need New Website)">No (Need New Website)</option>
                    <option value="Yes (Need Redesign)">Yes (Need Redesign)</option>
                    <option value="Yes (Need Growth & SEO)">Yes (Need Growth & SEO)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Stage *</label>
                  <select
                    value={tzarCompanyType}
                    onChange={(e) => setTzarCompanyType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Bootstrapped (Self-Funded)">Bootstrapped (Self-Funded)</option>
                    <option value="Funded Startup">Funded Startup</option>
                    <option value="Enterprise / Corporate">Enterprise / Corporate</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ─── ADSHALAA EDTECH FORM ────────────────────────────────────── */}
          {business === "adshalaa" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-700" />
                2. Adshalaa EdTech Admission & Learning Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course / Certification Program *</label>
                  <select
                    value={adshalaaCourse}
                    onChange={(e) => setAdshalaaCourse(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Certification in Advanced Digital Marketing & AI">
                      Certification in Advanced Digital Marketing & AI
                    </option>
                    <option value="Performance Marketing & Meta Ads Masterclass">
                      Performance Marketing & Meta Ads Masterclass
                    </option>
                    <option value="SEO & Content Marketing Specialist">SEO & Content Marketing Specialist</option>
                    <option value="Full Stack Web Development & Growth">Full Stack Web Development & Growth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Profile *</label>
                  <select
                    value={adshalaaStatus}
                    onChange={(e) => setAdshalaaStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Working Professional">Working Professional</option>
                    <option value="College Student">College Student</option>
                    <option value="Job Seeker / Fresher">Job Seeker / Fresher</option>
                    <option value="Business Owner / Founder">Business Owner / Founder</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Learning Mode *</label>
                  <select
                    value={adshalaaMode}
                    onChange={(e) => setAdshalaaMode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Weekend Classroom (Offline)">Weekend Classroom (Offline)</option>
                    <option value="Weekday Classroom (Offline)">Weekday Classroom (Offline)</option>
                    <option value="Live Online Interactive">Live Online Interactive</option>
                    <option value="Online Self-Paced">Online Self-Paced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Batch Schedule *</label>
                  <select
                    value={adshalaaBatch}
                    onChange={(e) => setAdshalaaBatch(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Weekend Batch (Sat-Sun 10 AM - 2 PM)">Weekend (Sat-Sun 10 AM - 2 PM)</option>
                    <option value="Weekday Evening (7 PM - 9 PM)">Weekday Evening (7 PM - 9 PM)</option>
                    <option value="Morning Batch (9 AM - 12 PM)">Morning Batch (9 AM - 12 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Course Fee Budget (₹) *</label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    required
                    value={adshalaaFeeBudget}
                    onChange={(e) => setAdshalaaFeeBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Career Objective / Placement Goal</label>
                <input
                  type="text"
                  value={adshalaaGoal}
                  onChange={(e) => setAdshalaaGoal(e.target.value)}
                  placeholder="e.g. High-Growth Agency Placement, Freelancing, Startup Marketing"
                  className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                />
              </div>
            </div>
          )}

          {/* ─── CROWNLEAF GIFTING FORM ──────────────────────────────────── */}
          {business === "crownleaf" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-700" />
                2. Crownleaf Corporate Gifting & Hamper Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gifting Occasion *</label>
                  <select
                    value={crownleafOccasion}
                    onChange={(e) => setCrownleafOccasion(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Corporate Festive Hampers">Corporate Festive Hampers</option>
                    <option value="Employee Welcome Kits">Employee Welcome Kits</option>
                    <option value="Client Appreciation Gifts">Client Appreciation Gifts</option>
                    <option value="Annual Day Favors">Annual Day Favors</option>
                    <option value="Executive CXO Luxury Boxes">Executive CXO Luxury Boxes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expected Box Quantity *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={crownleafQty}
                    onChange={(e) => setCrownleafQty(Number(e.target.value))}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Budget Per Box (₹) *</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={crownleafBudgetPerBox}
                    onChange={(e) => setCrownleafBudgetPerBox(Number(e.target.value))}
                    placeholder="1500"
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Recipient Profile *</label>
                  <select
                    value={crownleafRecipient}
                    onChange={(e) => setCrownleafRecipient(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Corporate Employees">Corporate Employees</option>
                    <option value="HNI / VIP Clients">HNI / VIP Clients</option>
                    <option value="Channel Partners & Dealers">Channel Partners & Dealers</option>
                    <option value="Event Delegates">Event Delegates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Branding Requirement *</label>
                  <select
                    value={crownleafBranding}
                    onChange={(e) => setCrownleafBranding(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold bg-white rounded-xl border border-slate-300 outline-none cursor-pointer"
                  >
                    <option value="Bespoke Custom Logo Box & Packaging">Bespoke Custom Logo Box & Packaging</option>
                    <option value="Branded Ribbon & Personalized Card">Branded Ribbon & Personalized Card</option>
                    <option value="Standard Luxury Hamper (No Branding)">Standard Luxury Hamper (No Branding)</option>
                  </select>
                </div>
              </div>

              {/* Crownleaf Dynamic Deal Value */}
              <div className="p-3.5 rounded-xl bg-white border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-extrabold text-slate-800">Total Estimated Corporate Order Value:</p>
                  <p className="text-slate-500 text-[11px]">
                    {crownleafQty} Boxes × ₹{Number(crownleafBudgetPerBox).toLocaleString()} / box
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-emerald-700">
                    ₹{(crownleafQty * crownleafBudgetPerBox).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Lead Channel & Sales Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Inbound Channel / Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none cursor-pointer"
              >
                <option value="MANUAL">Manual Inbound Phone Call / Visit</option>
                <option value="WHATSAPP_INBOUND">Direct WhatsApp Chat</option>
                <option value="WEBSITE_ENQUIRY">Website Form Enquiry</option>
                <option value="REFERRAL">Client Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Executive Notes / Discussion</label>
              <input
                type="text"
                value={requirementsMessage}
                onChange={(e) => setRequirementsMessage(e.target.value)}
                placeholder="Key requirements from initial conversation..."
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 outline-none focus:border-slate-800"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor:
                  business === "tzar"
                    ? "#047857"
                    : business === "adshalaa"
                    ? "#1d4ed8"
                    : business === "crownleaf"
                    ? "#d97706"
                    : "#e11d48",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Save & Record Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
