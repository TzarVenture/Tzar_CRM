"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { SpinnerGap, UserPlus, Check } from "@phosphor-icons/react";
import { BusinessSlug } from "@/models/Lead";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormSection, Select } from "@/components/ui/form-field";

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onLeadCreated: (newLead?: any) => void;
}

const BRANDS: { id: BusinessSlug; label: string; description: string; logo: string }[] = [
  { id: "titepo", label: "Titepo", description: "Return gifts", logo: "/titepo-logo.png" },
  { id: "tzar", label: "Tzar Digital Agency", description: "Web and ads", logo: "/tzar-logo.png" },
  { id: "adshalaa", label: "Adshalaa", description: "Courses", logo: "/adshalaa-logo.png" },
  { id: "crownleaf", label: "Crownleaf", description: "Corporate gifting", logo: "/Crownleaf-logo.png" },
];

const SOURCES = [
  { value: "MANUAL", label: "Phone call or visit" },
  { value: "WHATSAPP_INBOUND", label: "WhatsApp message" },
  { value: "WEBSITE_ENQUIRY", label: "Website enquiry" },
  { value: "REFERRAL", label: "Client referral" },
];

const rupees = (n: number) => `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN")}`;

export function CreateLeadModal({ isOpen, onClose, onLeadCreated }: CreateLeadModalProps) {
  const [business, setBusiness] = useState<BusinessSlug>("titepo");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [requirementsMessage, setRequirementsMessage] = useState("");

  // Tzar
  const [tzarCompanyName, setTzarCompanyName] = useState("");
  const [tzarService, setTzarService] = useState("Shopify E-Commerce Store");
  const [tzarBudget, setTzarBudget] = useState<number>(75000);
  const [tzarTimeline, setTzarTimeline] = useState("Immediately");
  const [tzarHasWebsite, setTzarHasWebsite] = useState("No (Need New Website)");
  const [tzarWebsiteUrl] = useState("");
  const [tzarCompanyType, setTzarCompanyType] = useState("Bootstrapped (Self-Funded)");

  // Adshalaa
  const [adshalaaCourse, setAdshalaaCourse] = useState("Certification in Advanced Digital Marketing & AI");
  const [adshalaaStatus, setAdshalaaStatus] = useState("Working Professional");
  const [adshalaaMode, setAdshalaaMode] = useState("Weekend Classroom (Offline)");
  const [adshalaaBatch, setAdshalaaBatch] = useState("Weekend Batch (Sat-Sun 10 AM - 2 PM)");
  const [adshalaaFeeBudget, setAdshalaaFeeBudget] = useState<number>(45000);
  const [adshalaaGoal, setAdshalaaGoal] = useState("High-Growth Agency Placement");

  // Crownleaf
  const [crownleafCompanyName, setCrownleafCompanyName] = useState("");
  const [crownleafOccasion, setCrownleafOccasion] = useState("Corporate Festive Hampers");
  const [crownleafQty, setCrownleafQty] = useState<number>(50);
  const [crownleafBudgetPerBox, setCrownleafBudgetPerBox] = useState<number>(1500);
  const [crownleafRecipient, setCrownleafRecipient] = useState("Corporate Employees");
  const [crownleafBranding, setCrownleafBranding] = useState("Bespoke Custom Logo Box & Packaging");

  // Titepo
  const [titepoOccasion, setTitepoOccasion] = useState("Birthday Party");
  const [titepoKidsCount, setTitepoKidsCount] = useState<number>(35);
  const [titepoBudgetPerGift, setTitepoBudgetPerGift] = useState("₹501 - ₹1,000");
  const [titepoAvgPrice, setTitepoAvgPrice] = useState<number>(750);
  const [titepoAgeGroup, setTitepoAgeGroup] = useState("4 - 6 Years");
  const [titepoEventDate, setTitepoEventDate] = useState("");
  const [titepoSpecialReqs, setTitepoSpecialReqs] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The per-gift price band decides the average used for the estimate
  useEffect(() => {
    if (titepoBudgetPerGift === "₹250 - ₹500") setTitepoAvgPrice(350);
    else if (titepoBudgetPerGift === "₹501 - ₹1,000") setTitepoAvgPrice(750);
    else if (titepoBudgetPerGift === "₹1,000 - ₹2,000") setTitepoAvgPrice(1500);
    else if (titepoBudgetPerGift === "₹2,000+") setTitepoAvgPrice(2500);
  }, [titepoBudgetPerGift]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let interestSummary = "Sales enquiry";
      let finalEstimatedBudget = 0;
      let finalCompanyName = "";

      // The server only accepts known source codes; a referral is recorded as a manual lead with a note
      const isReferral = source === "REFERRAL";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        business,
        fullName,
        email: email.toLowerCase(),
        phone,
        city: city || undefined,
        source: isReferral ? "MANUAL" : source,
        requirementsMessage: [isReferral ? "Came through a client referral." : "", requirementsMessage].filter(Boolean).join(" ") || undefined,
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
          streetAddress: city || undefined,
          platform: "manual",
        };
      }

      payload.companyName = finalCompanyName || undefined;
      payload.estimatedBudget = finalEstimatedBudget;
      payload.interestedServices = [interestSummary];

      const res = await axios.post("/api/v1/leads", payload);
      onLeadCreated(res.data?.lead);
      onClose();
    } catch (err) {
      console.error("Failed to create manual lead:", err);
      const message = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(message || "Could not save the lead. Check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactTitle: Record<BusinessSlug, string> = {
    titepo: "Parent or client",
    tzar: "Founder or client",
    adshalaa: "Student",
    crownleaf: "Company contact",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent scrollable={false} className="max-w-3xl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="border-b border-border px-6 py-5">
            <DialogTitle>Add a lead</DialogTitle>
            <DialogDescription>Record an enquiry that came in by phone, WhatsApp or in person.</DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-6">
            {error && (
              <p role="alert" className="rounded-lg border border-destructive bg-destructive-soft px-3.5 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">
                Brand <span className="text-destructive" aria-hidden="true">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4" role="radiogroup" aria-label="Brand">
                {BRANDS.map((b) => {
                  const active = business === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setBusiness(b.id)}
                      className={`relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                        active ? "border-primary bg-muted ring-1 ring-primary" : "border-input bg-card hover:bg-muted"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.logo} alt="" className="h-5 w-auto max-w-[96px] object-contain" />
                      <span className="text-sm text-muted-foreground">{b.description}</span>
                      {active && (
                        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check size={12} weight="bold" />
                        </span>
                      )}
                      <span className="sr-only">{b.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <FormSection title="Contact">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={`${contactTitle[business]} name`} htmlFor="lead-name" required>
                  <Input id="lead-name" required value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="off" />
                </Field>
                <Field label="Phone or WhatsApp" htmlFor="lead-phone" required>
                  <Input id="lead-phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Email" htmlFor="lead-email" required>
                  <Input id="lead-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label={business === "titepo" ? "Delivery city" : "City"} htmlFor="lead-city">
                  <Input id="lead-city" value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>
                {(business === "tzar" || business === "crownleaf") && (
                  <Field label="Company" htmlFor="lead-company" required className="sm:col-span-2">
                    <Input
                      id="lead-company"
                      required
                      value={business === "tzar" ? tzarCompanyName : crownleafCompanyName}
                      onChange={(e) => (business === "tzar" ? setTzarCompanyName(e.target.value) : setCrownleafCompanyName(e.target.value))}
                    />
                  </Field>
                )}
              </div>
            </FormSection>

            {business === "titepo" && (
              <FormSection title="Return gift order">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Occasion" htmlFor="titepo-occasion" required>
                    <Select id="titepo-occasion" value={titepoOccasion} onChange={(e) => setTitepoOccasion(e.target.value)}>
                      <option>Birthday Party</option>
                      <option>Baby Shower</option>
                      <option>Naming Ceremony</option>
                      <option>School Event / Annual Day</option>
                      <option>Wedding / Sangeet Favors</option>
                      <option>Festive Return Gifts</option>
                    </Select>
                  </Field>
                  <Field label="Number of gifts" htmlFor="titepo-count" required>
                    <Input id="titepo-count" type="number" min={5} required value={titepoKidsCount} onChange={(e) => setTitepoKidsCount(Number(e.target.value))} />
                  </Field>
                  <Field label="Budget per gift" htmlFor="titepo-budget" required>
                    <Select id="titepo-budget" value={titepoBudgetPerGift} onChange={(e) => setTitepoBudgetPerGift(e.target.value)}>
                      <option value="₹250 - ₹500">₹250 - ₹500</option>
                      <option value="₹501 - ₹1,000">₹501 - ₹1,000</option>
                      <option value="₹1,000 - ₹2,000">₹1,000 - ₹2,000</option>
                      <option value="₹2,000+">₹2,000+</option>
                    </Select>
                  </Field>
                  <Field label="Child age group" htmlFor="titepo-age" required>
                    <Select id="titepo-age" value={titepoAgeGroup} onChange={(e) => setTitepoAgeGroup(e.target.value)}>
                      <option value="1 - 3 Years">1 - 3 years</option>
                      <option value="4 - 6 Years">4 - 6 years</option>
                      <option value="7 - 10 Years">7 - 10 years</option>
                      <option value="10+ Years">10+ years</option>
                      <option value="Mixed Age Group">Mixed ages</option>
                    </Select>
                  </Field>
                  <Field label="Event date" htmlFor="titepo-date">
                    <Input id="titepo-date" type="date" value={titepoEventDate} onChange={(e) => setTitepoEventDate(e.target.value)} />
                  </Field>
                  <Field label="Customisation requests" htmlFor="titepo-reqs">
                    <Input id="titepo-reqs" value={titepoSpecialReqs} onChange={(e) => setTitepoSpecialReqs(e.target.value)} placeholder="Name tags, theme, urgent delivery" />
                  </Field>
                </div>
                <p className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Estimated value ({titepoKidsCount} gifts × {rupees(titepoAvgPrice)})
                  </span>
                  <span className="text-base font-semibold text-foreground">{rupees(titepoKidsCount * titepoAvgPrice)}</span>
                </p>
              </FormSection>
            )}

            {business === "tzar" && (
              <FormSection title="Project">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Service needed" htmlFor="tzar-service" required>
                    <Select id="tzar-service" value={tzarService} onChange={(e) => setTzarService(e.target.value)}>
                      <option value="Shopify E-Commerce Store">Shopify e-commerce store</option>
                      <option value="Custom Next.js Web App">Custom web application</option>
                      <option value="UI/UX & Brand Identity">UI/UX and brand identity</option>
                      <option value="Performance Marketing & Meta Ads">Performance marketing and Meta ads</option>
                      <option value="SEO & Organic Growth">SEO and organic growth</option>
                    </Select>
                  </Field>
                  <Field label="Budget (₹)" htmlFor="tzar-budget" required>
                    <Input id="tzar-budget" type="number" min={10000} step={5000} required value={tzarBudget} onChange={(e) => setTzarBudget(Number(e.target.value))} />
                  </Field>
                  <Field label="Start" htmlFor="tzar-timeline" required>
                    <Select id="tzar-timeline" value={tzarTimeline} onChange={(e) => setTzarTimeline(e.target.value)}>
                      <option value="Immediately">Immediately (7 to 14 days)</option>
                      <option value="Within 1 Month">Within 1 month</option>
                      <option value="1 - 3 Months">In 1 to 3 months</option>
                      <option value="Exploring / Planning">Still planning</option>
                    </Select>
                  </Field>
                  <Field label="Current website" htmlFor="tzar-site" required>
                    <Select id="tzar-site" value={tzarHasWebsite} onChange={(e) => setTzarHasWebsite(e.target.value)}>
                      <option value="No (Need New Website)">No, needs a new site</option>
                      <option value="Yes (Need Redesign)">Yes, needs a redesign</option>
                      <option value="Yes (Need Growth & SEO)">Yes, needs growth and SEO</option>
                    </Select>
                  </Field>
                  <Field label="Company stage" htmlFor="tzar-stage" required className="sm:col-span-2">
                    <Select id="tzar-stage" value={tzarCompanyType} onChange={(e) => setTzarCompanyType(e.target.value)}>
                      <option value="Bootstrapped (Self-Funded)">Bootstrapped (self-funded)</option>
                      <option value="Funded Startup">Funded startup</option>
                      <option value="Corporate">Corporate</option>
                    </Select>
                  </Field>
                </div>
              </FormSection>
            )}

            {business === "adshalaa" && (
              <FormSection title="Course enquiry">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Course" htmlFor="ad-course" required>
                    <Select id="ad-course" value={adshalaaCourse} onChange={(e) => setAdshalaaCourse(e.target.value)}>
                      <option value="Certification in Advanced Digital Marketing & AI">Advanced digital marketing and AI</option>
                      <option value="Performance Marketing & Meta Ads Masterclass">Performance marketing and Meta ads</option>
                      <option value="SEO & Content Marketing Specialist">SEO and content marketing</option>
                      <option value="Full Stack Web Development & Growth">Full stack web development</option>
                    </Select>
                  </Field>
                  <Field label="Student profile" htmlFor="ad-status" required>
                    <Select id="ad-status" value={adshalaaStatus} onChange={(e) => setAdshalaaStatus(e.target.value)}>
                      <option>Working Professional</option>
                      <option>College Student</option>
                      <option>Job Seeker / Fresher</option>
                      <option>Business Owner / Founder</option>
                    </Select>
                  </Field>
                  <Field label="Learning mode" htmlFor="ad-mode" required>
                    <Select id="ad-mode" value={adshalaaMode} onChange={(e) => setAdshalaaMode(e.target.value)}>
                      <option value="Weekend Classroom (Offline)">Weekend classroom</option>
                      <option value="Weekday Classroom (Offline)">Weekday classroom</option>
                      <option value="Live Online Interactive">Live online</option>
                      <option value="Online Self-Paced">Online, self-paced</option>
                    </Select>
                  </Field>
                  <Field label="Batch" htmlFor="ad-batch" required>
                    <Select id="ad-batch" value={adshalaaBatch} onChange={(e) => setAdshalaaBatch(e.target.value)}>
                      <option value="Weekend Batch (Sat-Sun 10 AM - 2 PM)">Weekend, Sat-Sun 10 AM - 2 PM</option>
                      <option value="Weekday Evening (7 PM - 9 PM)">Weekday evening, 7 PM - 9 PM</option>
                      <option value="Morning Batch (9 AM - 12 PM)">Morning, 9 AM - 12 PM</option>
                    </Select>
                  </Field>
                  <Field label="Fee budget (₹)" htmlFor="ad-fee" required>
                    <Input id="ad-fee" type="number" min={5000} step={1000} required value={adshalaaFeeBudget} onChange={(e) => setAdshalaaFeeBudget(Number(e.target.value))} />
                  </Field>
                  <Field label="Career goal" htmlFor="ad-goal">
                    <Input id="ad-goal" value={adshalaaGoal} onChange={(e) => setAdshalaaGoal(e.target.value)} placeholder="Agency job, freelancing, own business" />
                  </Field>
                </div>
              </FormSection>
            )}

            {business === "crownleaf" && (
              <FormSection title="Gifting order">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Occasion" htmlFor="cl-occasion" required>
                    <Select id="cl-occasion" value={crownleafOccasion} onChange={(e) => setCrownleafOccasion(e.target.value)}>
                      <option>Corporate Festive Hampers</option>
                      <option>Employee Welcome Kits</option>
                      <option>Client Appreciation Gifts</option>
                      <option>Annual Day Favors</option>
                      <option>Executive CXO Luxury Boxes</option>
                    </Select>
                  </Field>
                  <Field label="Number of boxes" htmlFor="cl-qty" required>
                    <Input id="cl-qty" type="number" min={10} required value={crownleafQty} onChange={(e) => setCrownleafQty(Number(e.target.value))} />
                  </Field>
                  <Field label="Budget per box (₹)" htmlFor="cl-box" required>
                    <Input id="cl-box" type="number" min={500} step={100} required value={crownleafBudgetPerBox} onChange={(e) => setCrownleafBudgetPerBox(Number(e.target.value))} />
                  </Field>
                  <Field label="Recipients" htmlFor="cl-recipient" required className="sm:col-span-1">
                    <Select id="cl-recipient" value={crownleafRecipient} onChange={(e) => setCrownleafRecipient(e.target.value)}>
                      <option>Corporate Employees</option>
                      <option>HNI / VIP Clients</option>
                      <option>Channel Partners & Dealers</option>
                      <option>Event Delegates</option>
                    </Select>
                  </Field>
                  <Field label="Branding" htmlFor="cl-brand" required className="sm:col-span-2">
                    <Select id="cl-brand" value={crownleafBranding} onChange={(e) => setCrownleafBranding(e.target.value)}>
                      <option value="Bespoke Custom Logo Box & Packaging">Custom logo box and packaging</option>
                      <option value="Branded Ribbon & Personalized Card">Branded ribbon and personalised card</option>
                      <option value="Standard Luxury Hamper (No Branding)">Standard hamper, no branding</option>
                    </Select>
                  </Field>
                </div>
                <p className="flex items-baseline justify-between gap-3 rounded-lg border border-border bg-muted px-4 py-3 text-sm">
                  <span className="text-muted-foreground">
                    Estimated value ({crownleafQty} boxes × {rupees(crownleafBudgetPerBox)})
                  </span>
                  <span className="text-base font-semibold text-foreground">{rupees(crownleafQty * crownleafBudgetPerBox)}</span>
                </p>
              </FormSection>
            )}

            <FormSection title="How it came in">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Source" htmlFor="lead-source">
                  <Select id="lead-source" value={source} onChange={(e) => setSource(e.target.value)}>
                    {SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Notes" htmlFor="lead-notes">
                  <Input id="lead-notes" value={requirementsMessage} onChange={(e) => setRequirementsMessage(e.target.value)} placeholder="What they asked for" />
                </Field>
              </div>
            </FormSection>
          </DialogBody>

          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <SpinnerGap size={18} className="animate-spin" /> : <UserPlus size={18} />}
              {isSubmitting ? "Saving" : "Save lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
