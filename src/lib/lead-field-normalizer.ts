import { BusinessSlug } from "@/models/Lead";

export interface NormalizedLeadData {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  companyName?: string;
  interestLabel: string;
  metaFormFields: { label: string; value: string }[];
  titepoData?: {
    eventType?: string;
    kidsCount?: string | number;
    budgetPerGift?: string;
    childAgeGroup?: string;
    eventDate?: string;
    specialRequirements?: string;
    streetAddress?: string;
    platform?: string;
  };
  tzarData?: {
    serviceNeeded?: string;
    budget?: string;
    timeline?: string;
    hasWebsite?: string;
    companyType?: string;
    companyName?: string;
    formType?: "CONTACT" | "WEBDEV" | "HIREUS" | "PAYMENT";
  };
  adshalaaData?: {
    courseName?: string;
    studentStatus?: string;
    learningMode?: string;
    careerGoal?: string;
    formType?: "ENQUIRY" | "REGISTRATION" | "WEBINAR" | "BROCHURE" | "CONTACT";
  };
  crownleafData?: {
    giftingOccasion?: string;
    recipientType?: string;
    boxQuantity?: string | number;
    budgetPerBox?: string;
    customBranding?: string;
  };
}

/**
 * Converts raw Meta slugs and text with underscores or weird characters
 * into clean, title-cased professional strings.
 * e.g., "birthday_party" -> "Birthday Party"
 *       "₹501_–_₹1,000" -> "₹501 - ₹1,000"
 *       "4–6_years" -> "4 - 6 Years"
 *       "e-commerce_store_-_shopify" -> "Shopify E-Commerce Store"
 *       "bootstrapped_(self-funded)_company" -> "Bootstrapped (Self-Funded)"
 */
export function formatFormFieldValue(val: string): string {
  if (!val || typeof val !== "string") return "";

  let cleaned = val.trim();

  // Strip wrapping double quotes
  cleaned = cleaned.replace(/^"+|"+$/g, "");

  // Common Meta-specific dictionary replacements
  const DICT: Record<string, string> = {
    birthday_party: "Birthday Party",
    wedding_party: "Wedding / Sangeet Favors",
    baby_shower: "Baby Shower",
    naming_ceremony: "Naming Ceremony",
    school_event: "School Event / Annual Day",
    festival_gifts: "Festive Gifting",
    corporate_event: "Corporate Event",
    "e-commerce_store_-_shopify": "Shopify E-Commerce Store",
    custom_web_app: "Custom Web Application",
    ui_ux_design: "UI/UX & Branding Design",
    performance_marketing: "Performance Marketing & Meta Ads",
    seo_services: "SEO & Growth Marketing",
    immediately: "Immediately",
    within_1_month: "Within 1 Month",
    exploring: "Exploring / Planning",
    business_owner: "Business Owner / Founder",
    marketing_head: "Marketing Head / CMO",
    "bootstrapped_(self-funded)_company": "Bootstrapped (Self-Funded)",
    funded_startup: "Funded Startup",
    enterprise_corporate: "Enterprise / Corporate",
    "no_(need_new_website)": "No (Needs New Website)",
    yes_needs_redesign: "Yes (Needs Redesign)",
    working_professional: "Working Professional",
    college_student: "College Student",
    job_seeker: "Job Seeker / Fresher",
    classroom_offline: "Classroom (Offline)",
    live_online: "Live Online Interactive",
    weekend_batch: "Weekend Batch",
  };

  const lower = cleaned.toLowerCase();
  if (DICT[lower]) return DICT[lower];

  // Clean up currency and range dashes
  cleaned = cleaned
    .replace(/–/g, "-")
    .replace(/_+/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ");

  // Capitalize words nicely
  return cleaned
    .split(" ")
    .map((w) => {
      if (w.startsWith("₹") || w.startsWith("$")) return w;
      if (w.toLowerCase() === "and" || w.toLowerCase() === "or" || w.toLowerCase() === "of") return w.toLowerCase();
      if (w.length <= 1) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * Converts field name labels to clean, human-readable titles.
 */
export function formatFieldLabel(label: string): string {
  if (!label) return "";
  let clean = label.replace(/_/g, " ").replace(/\?/g, "").trim();
  // Remove parenthetical examples if too long
  if (clean.includes("any special requirements")) {
    return "Special Requirements";
  }
  if (clean.includes("how many return gifts")) {
    return "Return Gifts Quantity";
  }
  if (clean.includes("what is the occasion")) {
    return "Occasion / Event";
  }
  if (clean.includes("what is your budget per return gift")) {
    return "Budget Per Return Gift";
  }
  if (clean.includes("child's age group")) {
    return "Child Age Group";
  }
  if (clean.includes("what do you need")) {
    return "Required Service";
  }
  if (clean.includes("what is your budget")) {
    return "Estimated Budget";
  }
  if (clean.includes("when do you want to start")) {
    return "Start Timeline";
  }
  if (clean.includes("which best describes your company")) {
    return "Company Type";
  }
  if (clean.includes("do you currently have a website")) {
    return "Existing Website";
  }
  if (clean.includes("how would you like to attend classes")) {
    return "Preferred Learning Mode";
  }
  if (clean.includes("what's your current status") || clean.includes("whats your current status")) {
    return "Candidate Profile";
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Strictly parses raw Meta Lead Ads `field_data` array or flat CSV record
 * into structured entity records with zero name collisions.
 */
export function parseMetaLeadPayload(
  fields: Array<{ name: string; values?: string[] } | { label: string; value: string }>,
  business: BusinessSlug
): NormalizedLeadData {
  let fullName = "";
  let email = "";
  let phone = "";
  let city = "";
  let companyName = "";

  // Titepo Fields
  let eventType = "";
  let kidsCount = "";
  let budgetPerGift = "";
  let childAgeGroup = "";
  let eventDate = "";
  let specialRequirements = "";
  let streetAddress = "";

  // Tzar Fields
  let tzarService = "";
  let tzarBudget = "";
  let tzarTimeline = "";
  let tzarHasWebsite = "";
  let tzarCompanyType = "";

  // Adshalaa Fields
  let adshalaaCourse = "";
  let adshalaaStatus = "";
  let adshalaaMode = "";
  let adshalaaGoal = "";

  // Crownleaf Fields
  let crownleafOccasion = "";
  let crownleafRecipient = "";
  let crownleafQty = "";
  let crownleafBudget = "";
  let crownleafBranding = "";

  const metaFormFields: { label: string; value: string }[] = [];

  // ─── STEP 1: Normalize Raw Fields ───────────────────────────────────────
  const normalizedRawList: { rawKey: string; key: string; val: string }[] = [];

  for (const item of fields) {
    const rawKey = ("name" in item ? item.name : item.label) || "";
    const rawVal = "values" in item && Array.isArray(item.values) ? item.values[0] : (item as any).value || "";
    if (!rawVal || typeof rawVal !== "string") continue;

    const trimmedVal = rawVal.trim();
    if (!trimmedVal) continue;

    normalizedRawList.push({
      rawKey,
      key: rawKey.toLowerCase().replace(/[^a-z0-9]/g, ""),
      val: trimmedVal,
    });

    metaFormFields.push({
      label: formatFieldLabel(rawKey),
      value: formatFormFieldValue(trimmedVal),
    });
  }

  // ─── STEP 2: Strict Name Extraction (Prevents "Personalised names" bug) ──
  // Candidate keys strictly for person's real name:
  const STRICT_NAME_KEYS = ["fullname", "firstandlastname", "name", "firstname", "customername", "clientname"];
  // Blacklisted substrings that should NEVER be considered a person's name:
  const NAME_BLACKLIST_SUBSTRINGS = [
    "special",
    "requirement",
    "gift",
    "return",
    "notes",
    "message",
    "company",
    "brand",
    "date",
    "city",
    "address",
    "budget",
    "occasion",
    "event",
    "status",
    "attend",
  ];

  for (const item of normalizedRawList) {
    const isBlacklisted = NAME_BLACKLIST_SUBSTRINGS.some((bl) => item.key.includes(bl));
    if (!isBlacklisted && STRICT_NAME_KEYS.includes(item.key)) {
      fullName = item.val;
      break;
    }
  }

  // Fallback name check if exact match wasn't found
  if (!fullName) {
    for (const item of normalizedRawList) {
      const isBlacklisted = NAME_BLACKLIST_SUBSTRINGS.some((bl) => item.key.includes(bl));
      if (!isBlacklisted && item.key.includes("name") && !item.key.includes("company")) {
        fullName = item.val;
        break;
      }
    }
  }

  // ─── STEP 3: Core Contact Extraction ────────────────────────────────────
  for (const item of normalizedRawList) {
    // Email
    if (!email && (item.key.includes("email") || item.key.includes("mail"))) {
      if (item.val.includes("@")) email = item.val.toLowerCase();
    }
    // Phone
    if (!phone && (item.key.includes("phone") || item.key.includes("mobile") || item.key.includes("contactnumber"))) {
      phone = item.val;
    }
    // City
    if (!city && (item.key === "city" || item.key === "location" || item.key === "state")) {
      city = formatFormFieldValue(item.val);
    }
    // Company Name
    if (!companyName && (item.key.includes("companyname") || item.key === "company" || item.key === "organization")) {
      companyName = formatFormFieldValue(item.val);
    }
    // Street Address
    if (!streetAddress && (item.key.includes("streetaddress") || item.key.includes("address") || item.key.includes("pincode"))) {
      streetAddress = formatFormFieldValue(item.val);
    }
  }

  // ─── STEP 4: Entity-Specific Field Extraction ───────────────────────────
  for (const item of normalizedRawList) {
    // ── TITEPO TOYS ──────────────────────────────────────────────────────
    if (business === "titepo") {
      if (!eventType && (item.key.includes("occasion") || item.key.includes("eventtype") || item.key.includes("event"))) {
        eventType = formatFormFieldValue(item.val);
      }
      if (!kidsCount && (item.key.includes("returngifts") || item.key.includes("quantity") || item.key.includes("kidscount") || item.key.includes("howmany"))) {
        kidsCount = formatFormFieldValue(item.val);
      }
      if (!budgetPerGift && (item.key.includes("budgetper") || item.key.includes("budget"))) {
        budgetPerGift = formatFormFieldValue(item.val);
      }
      if (!childAgeGroup && (item.key.includes("childsagegroup") || item.key.includes("agegroup") || item.key.includes("age"))) {
        childAgeGroup = formatFormFieldValue(item.val);
      }
      if (!eventDate && (item.key === "date" || item.key.includes("eventdate"))) {
        eventDate = formatFormFieldValue(item.val);
      }
      if (!specialRequirements && (item.key.includes("specialrequirement") || item.key.includes("personalizedname") || item.key.includes("giftwrapping"))) {
        specialRequirements = formatFormFieldValue(item.val);
      }
    }

    // ── TZAR AGENCY ──────────────────────────────────────────────────────
    if (business === "tzar") {
      if (!tzarService && (item.key.includes("whatdoyouneed") || item.key.includes("service") || item.key.includes("requirement"))) {
        tzarService = formatFormFieldValue(item.val);
      }
      if (!tzarBudget && (item.key.includes("budget") || item.key.includes("investment"))) {
        tzarBudget = formatFormFieldValue(item.val);
      }
      if (!tzarTimeline && (item.key.includes("start") || item.key.includes("timeline") || item.key.includes("launch"))) {
        tzarTimeline = formatFormFieldValue(item.val);
      }
      if (!tzarHasWebsite && (item.key.includes("website") || item.key.includes("currentwebsite"))) {
        tzarHasWebsite = formatFormFieldValue(item.val);
      }
      if (!tzarCompanyType && (item.key.includes("describesyourcompany") || item.key.includes("companytype") || item.key.includes("businessstage"))) {
        tzarCompanyType = formatFormFieldValue(item.val);
      }
    }

    // ── ADSHALAA EDTECH ──────────────────────────────────────────────────
    if (business === "adshalaa") {
      if (!adshalaaCourse && (item.key.includes("course") || item.key.includes("program") || item.key.includes("certification"))) {
        adshalaaCourse = formatFormFieldValue(item.val);
      }
      if (!adshalaaStatus && (item.key.includes("currentstatus") || item.key.includes("profile") || item.key.includes("profession"))) {
        adshalaaStatus = formatFormFieldValue(item.val);
      }
      if (!adshalaaMode && (item.key.includes("attendclasses") || item.key.includes("learningmode") || item.key.includes("batch"))) {
        adshalaaMode = formatFormFieldValue(item.val);
      }
      if (!adshalaaGoal && (item.key.includes("goal") || item.key.includes("objective"))) {
        adshalaaGoal = formatFormFieldValue(item.val);
      }
    }

    // ── CROWNLEAF GIFTING ────────────────────────────────────────────────
    if (business === "crownleaf") {
      if (!crownleafOccasion && (item.key.includes("occasion") || item.key.includes("giftingfor") || item.key.includes("conditionalquestion1"))) {
        crownleafOccasion = formatFormFieldValue(item.val);
      }
      if (!crownleafBudget && (item.key.includes("budget") || item.key.includes("conditionalquestion2"))) {
        crownleafBudget = formatFormFieldValue(item.val);
      }
      if (!crownleafQty && (item.key.includes("pcs") || item.key.includes("quantity") || item.key.includes("boxes") || item.key.includes("conditionalquestion3"))) {
        crownleafQty = formatFormFieldValue(item.val);
      }
      if (!crownleafRecipient && (item.key.includes("recipient") || item.key.includes("targetaudience"))) {
        crownleafRecipient = formatFormFieldValue(item.val);
      }
      if (!crownleafBranding && (item.key.includes("branding") || item.key.includes("customlogo"))) {
        crownleafBranding = formatFormFieldValue(item.val);
      }
    }
  }

  // Default Full Name if missing
  if (!fullName) {
    fullName = "Meta Lead";
  }

  // ─── STEP 5: Generate Smart, Honest Interest Label ───────────────────────
  let interestLabel = "Meta Lead Ad";

  if (business === "titepo") {
    if (eventType && kidsCount) {
      interestLabel = `${eventType} (${kidsCount} Gifts)`;
    } else if (eventType) {
      interestLabel = `${eventType} Return Gifts`;
    } else {
      interestLabel = "Titepo Return Gifts & Favors";
    }
  } else if (business === "tzar") {
    if (tzarService && tzarBudget) {
      interestLabel = `${tzarService} (${tzarBudget})`;
    } else if (tzarService) {
      interestLabel = tzarService;
    } else {
      interestLabel = "WebDev & Performance Marketing";
    }
  } else if (business === "adshalaa") {
    if (adshalaaCourse && adshalaaMode) {
      interestLabel = `${adshalaaCourse} (${adshalaaMode})`;
    } else if (adshalaaCourse) {
      interestLabel = adshalaaCourse;
    } else if (adshalaaStatus) {
      interestLabel = `Admission Inquiry (${adshalaaStatus})`;
    } else {
      interestLabel = "Digital Marketing Mastery Course";
    }
  } else if (business === "crownleaf") {
    if (crownleafOccasion && crownleafQty) {
      interestLabel = `${crownleafOccasion} (${crownleafQty})`;
    } else if (crownleafOccasion) {
      interestLabel = `${crownleafOccasion} Hampers`;
    } else {
      interestLabel = "Corporate Luxury Gifting";
    }
  }

  return {
    fullName,
    email,
    phone,
    city,
    companyName,
    interestLabel,
    metaFormFields,
    titepoData:
      business === "titepo"
        ? {
            eventType: eventType || undefined,
            kidsCount: kidsCount || undefined,
            budgetPerGift: budgetPerGift || undefined,
            childAgeGroup: childAgeGroup || undefined,
            eventDate: eventDate || undefined,
            specialRequirements: specialRequirements || undefined,
            streetAddress: streetAddress || undefined,
            platform: "meta_lead_ad",
          }
        : undefined,
    tzarData:
      business === "tzar"
        ? {
            serviceNeeded: tzarService || undefined,
            budget: tzarBudget || undefined,
            timeline: tzarTimeline || undefined,
            hasWebsite: tzarHasWebsite || undefined,
            companyType: tzarCompanyType || undefined,
            companyName: companyName || undefined,
            formType: "WEBDEV",
          }
        : undefined,
    adshalaaData:
      business === "adshalaa"
        ? {
            courseName: adshalaaCourse || undefined,
            studentStatus: adshalaaStatus || undefined,
            learningMode: adshalaaMode || undefined,
            careerGoal: adshalaaGoal || undefined,
            formType: "ENQUIRY",
          }
        : undefined,
    crownleafData:
      business === "crownleaf"
        ? {
            giftingOccasion: crownleafOccasion || undefined,
            recipientType: crownleafRecipient || undefined,
            boxQuantity: crownleafQty || undefined,
            budgetPerBox: crownleafBudget || undefined,
            customBranding: crownleafBranding || undefined,
          }
        : undefined,
  };
}
