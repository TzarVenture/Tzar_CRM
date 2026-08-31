const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority';

const BRANDS_TO_SYNC = [
  {
    name: 'Tzar Venture',
    pageId: '364879847573029',
    business: 'tzar',
    token: 'EAAUIZCL1Afd8BSQCbyrPPKy8mhK6cHwacWDZAuBOCYETXbSUHIgZAnG7o3Kt0Gau7iu2vtSTp8sPEeHswaDMHBbDQFrhR4P4NXDftfq49VsRIiLk76yw4CNLs6o0kP8yDL6F0TTByxVHLctvJdFoXW0itflex3G7JZBKg5ESB4vdcRVYlnZAdYCZArhUDT7HmF6cgqgbqOn26LKZBVos1Y8Vf7ViFuqAoushSZBcXAZDZD',
  },
  {
    name: 'Titepo Toys',
    pageId: '1019277841258458',
    business: 'titepo',
    token: 'EAAUIZCL1Afd8BSZAMRTOwMNwaxfwvcw0pkCZAZCmLTRcBj0ZB4fTZAZBtkKkBC4eAhQFBVZA5DYiVfOfAx8nfTwPaBoNeRiHnoafK90dM75lnmugY99yW8NFcVUrpSsMZBZCZAYoKqph8T1cgr7FRgMzoUI8K49F3JjAz9wkssR3dllj6xZCDxr2vLxF1Lp31z1bU9odk5nA0RKx62WmVbEoH0Rt4JuMVEPolj5fxgzguQZDZD',
  },
  {
    name: 'Adshalaa Institute',
    pageId: '1245930131928783',
    business: 'adshalaa',
    token: 'EAAUIZCL1Afd8BSYn0vul1YsuzOB09ZCjWnqQxKa3AZBEujv8Wa0hwyuAhZChOmWwTsLdMSEGvZBOKvScwz2yKiQG5ZAxj9mGOGHNKxgXR0JzFsgCrUvuTiN4B8e7XIAUvwlZCbggN6ObzZB2ueMOqslAVIvw0dYMPtkTLuRhC45oTxQd1eOs7wSN4boawYwcBh8AyO4ZCtSKeuD6ciZAELECZB13xrRaJinbVb7zPWfSQZDZD',
  },
  {
    name: 'Crownleaf Gifting',
    pageId: '837451012790051',
    business: 'crownleaf',
    token: 'EAAUIZCL1Afd8BSVcPIyBeoZAAFNDwbXb4YaR4bGnLgw5skJyj6R2y56ScABUTFDkwN7JhGZASxQd7klo5TdTfaq0I7AU82F6yur0rBMBNgen0TgjMJI1bUfBPpoaRv4WPczkgKvMBRZBd5DjQOneZAuA04Wx52tZBxryij8WhTXzvwUblQk8DVir4kZAgmiPVYhHWFn8I1HBIIuJEQhEZAZBvSddJettvbuZBu4e0ZCggZDZD',
  },
];

const LeadSchema = new mongoose.Schema({}, { strict: false });
const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

async function syncAll4Brands() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas\n');

  const totals = { tzar: 0, titepo: 0, adshalaa: 0, crownleaf: 0 };

  for (const b of BRANDS_TO_SYNC) {
    console.log(`--- SYNCING [${b.name.toUpperCase()}] (Page ID: ${b.pageId}) ---`);

    // 1. Fetch Leadgen Forms
    const formsRes = await fetch(`https://graph.facebook.com/v20.0/${b.pageId}/leadgen_forms?access_token=${b.token}`);
    const formsData = await formsRes.json();

    if (!formsData.data || formsData.data.length === 0) {
      console.log(`No active lead forms found for ${b.name}`);
      continue;
    }

    console.log(`Found ${formsData.data.length} active lead forms for ${b.name}`);

    for (const form of formsData.data) {
      // 2. Fetch Leads per Form
      const leadsRes = await fetch(`https://graph.facebook.com/v20.0/${form.id}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name&limit=100&access_token=${b.token}`);
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

        const prefix = b.business === 'tzar' ? 'TZ-LD' : b.business === 'titepo' ? 'TT-LD' : b.business === 'crownleaf' ? 'CL-LD' : 'AD-LD';
        const uniqueId = `${prefix}-${Date.now().toString().slice(-4)}${Math.floor(1000 + Math.random() * 8999)}`;
        const createdDate = item.created_time ? new Date(item.created_time) : new Date();

        const filter = item.id
          ? { metaLeadId: item.id }
          : email
          ? { email: email.toLowerCase() }
          : { phone: phone };

        const existingLead = await Lead.findOne(filter);

        if (existingLead) {
          existingLead.business = b.business; // STRICT ISOLATION!
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
          await existingLead.save();
        } else {
          await Lead.create({
            leadCustomId: uniqueId,
            metaLeadId: item.id,
            business: b.business,
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

        totals[b.business]++;
      }
    }
  }

  console.log('\n=== INGESTION & SYNC SUMMARY ACROSS ALL 4 BRANDS ===');
  console.log('TZAR (WebDev & Digital Marketing):', totals.tzar);
  console.log('TITEPO (Toys & Birthday Gifts):', totals.titepo);
  console.log('ADSHALAA (EdTech & Courses):', totals.adshalaa);
  console.log('CROWNLEAF (Corporate Gifting):', totals.crownleaf);

  await mongoose.disconnect();
}

syncAll4Brands().catch(console.error);
