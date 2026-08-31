const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority';

// Strict Meta Page ID Mapping
const PAGE_BRAND_MAP = {
  '364879847573029': 'tzar',       // Tzar Venture - Digital Marketing Agency
  '1019277841258458': 'titepo',    // Titepo TOY STORE
  '837451012790051': 'crownleaf',  // Crownleaf Gift Shop
  '1245930131928783': 'adshalaa',  // Adshalaa Institute of Digital Marketing
};

const USER_TOKEN = 'EAAUIZCL1Afd8BSY4JszH1IEbP1Dp7V0UKPACyYdrZApz94VY88xo77Ld1qeGQZB1ZC7W2kNX6OGYRFPRdwVPHHWMCnsHOhqSX4S1EqyVX1LZBulrK3x6zOcFRltbLAkO5KZBI3364VvDoRJuBbz8kQ1VQRCrtsRAUhNocsZCELXTht8mZAXH6OG0bRd65U7HelZAezZBKdg4cfrbLOGvBHwQKhqrb4M1W1fZApjY9ZCok1VNOIoN4T7szjT2HKZCar7ZAvoJsOrplVV5RQy68ZD';

const LeadSchema = new mongoose.Schema(
  {
    leadCustomId: { type: String, unique: true },
    metaLeadId: String,
    business: { type: String, enum: ['tzar', 'adshalaa', 'crownleaf', 'titepo'] },
    name: String,
    email: String,
    phone: String,
    company: String,
    city: String,
    interestedServices: [String],
    source: { type: String, default: 'META_LEAD_AD' },
    stageId: { type: String, default: 'new-lead' },
    status: { type: String, default: 'ACTIVE' },
    metaFormFields: [{ label: String, value: String }],
    metaAdDetails: {
      formId: String,
      formName: String,
      adId: String,
      adName: String,
      campaignId: String,
      campaignName: String,
    },
    createdAt: Date,
    updatedAt: Date,
  },
  { timestamps: true }
);

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

let counter = 100;

async function syncAllStrict() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  // 1. Get Accounts / Pages
  const accRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${USER_TOKEN}`);
  const accData = await accRes.json();
  if (!accData.data) {
    console.error('Failed to fetch pages:', accData);
    return;
  }

  const counts = { tzar: 0, titepo: 0, crownleaf: 0, adshalaa: 0, skippedOtherPages: 0 };

  for (const page of accData.data) {
    const pageId = String(page.id);
    const assignedBusiness = PAGE_BRAND_MAP[pageId];

    if (!assignedBusiness) {
      console.log(`Skipping non-CRM page: ${page.name} (${pageId})`);
      counts.skippedOtherPages++;
      continue;
    }

    console.log(`\n--- Processing Page: ${page.name} (${pageId}) -> BRAND: [${assignedBusiness.toUpperCase()}] ---`);

    // 2. Get Leadgen Forms
    const formsRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?access_token=${page.access_token}`);
    const formsData = await formsRes.json();
    if (!formsData.data) continue;

    for (const form of formsData.data) {
      // 3. Fetch Leads for each Form
      const leadsRes = await fetch(`https://graph.facebook.com/v20.0/${form.id}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name&limit=100&access_token=${page.access_token}`);
      const leadsData = await leadsRes.json();
      if (!leadsData.data || leadsData.data.length === 0) continue;

      for (const item of leadsData.data) {
        let name = 'Meta Lead';
        let email = '';
        let phone = '';
        let company = '';
        let city = '';
        const metaFormFields = [];
        const dynamicLabels = [];

        if (Array.isArray(item.field_data)) {
          for (const field of item.field_data) {
            const rawName = (field.name || '').toLowerCase();
            const val = Array.isArray(field.values) ? field.values.join(', ') : field.values || '';

            if (val) {
              metaFormFields.push({ label: field.name || 'field', value: val });
            }

            if (rawName.includes('name') || rawName.includes('full_name')) name = val;
            else if (rawName.includes('email')) email = val;
            else if (rawName.includes('phone')) phone = val;
            else if (rawName.includes('company')) company = val;
            else if (rawName.includes('city') || rawName.includes('location')) city = val;
            else if (val) dynamicLabels.push(val);
          }
        }

        if (!phone && !email) continue;

        counter++;
        const prefix = assignedBusiness === 'tzar' ? 'TZ-LD' : assignedBusiness === 'titepo' ? 'TT-LD' : assignedBusiness === 'crownleaf' ? 'CL-LD' : 'AD-LD';
        const uniqueId = `${prefix}-${Date.now().toString().slice(-4)}${counter}`;
        const createdDate = item.created_time ? new Date(item.created_time) : new Date();

        const filter = item.id
          ? { metaLeadId: item.id }
          : email
          ? { email: email.toLowerCase() }
          : { phone: phone };

        const existingLead = await Lead.findOne(filter);

        if (existingLead) {
          existingLead.business = assignedBusiness; // STRICT PROPER BRAND ASSIGNMENT!
          existingLead.name = name || existingLead.name;
          existingLead.email = email ? email.toLowerCase() : existingLead.email;
          existingLead.phone = phone || existingLead.phone;
          existingLead.company = company || existingLead.company;
          existingLead.city = city || existingLead.city;
          existingLead.interestedServices = dynamicLabels.length > 0 ? dynamicLabels : existingLead.interestedServices;
          existingLead.metaFormFields = metaFormFields.length > 0 ? metaFormFields : existingLead.metaFormFields;
          existingLead.metaAdDetails = {
            formId: form.id,
            formName: form.name,
            adId: item.ad_id || '',
            adName: item.ad_name || '',
            campaignId: item.campaign_id || '',
            campaignName: item.campaign_name || '',
          };
          existingLead.createdAt = createdDate;

          // Normalize leadCustomId prefix
          if (existingLead.leadCustomId && !existingLead.leadCustomId.startsWith(prefix)) {
            const numPart = existingLead.leadCustomId.split('-').pop() || Math.floor(1000 + Math.random() * 9000);
            existingLead.leadCustomId = `${prefix}-${numPart}`;
          }

          await existingLead.save();
        } else {
          await Lead.create({
            leadCustomId: uniqueId,
            metaLeadId: item.id,
            business: assignedBusiness,
            name: name || 'Meta Lead',
            email: email ? email.toLowerCase() : '',
            phone: phone || '',
            company: company || '',
            city: city || '',
            interestedServices: dynamicLabels.length > 0 ? dynamicLabels : ['Meta Lead Form'],
            source: 'META_LEAD_AD',
            stageId: 'new-lead',
            status: 'ACTIVE',
            metaFormFields,
            metaAdDetails: {
              formId: form.id,
              formName: form.name,
              adId: item.ad_id || '',
              adName: item.ad_name || '',
              campaignId: item.campaign_id || '',
              campaignName: item.campaign_name || '',
            },
            createdAt: createdDate,
          });
        }

        counts[assignedBusiness]++;
      }
    }
  }

  console.log('\n=== STRICT BRAND ISOLATION SYNC COMPLETE ===');
  console.log('TZAR (Marketing & WebDev):', counts.tzar);
  console.log('TITEPO (Toys & Birthday Events):', counts.titepo);
  console.log('CROWNLEAF (Gifting):', counts.crownleaf);
  console.log('ADSHALAA (EdTech & Courses):', counts.adshalaa);

  await mongoose.disconnect();
}

syncAllStrict().catch(console.error);
