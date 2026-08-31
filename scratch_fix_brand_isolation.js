const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority';

const PAGE_ID_TO_BUSINESS = {
  '364879847573029': 'tzar',       // Tzar Venture - Digital Marketing Agency
  '1019277841258458': 'titepo',    // Titepo TOY STORE
  '837451012790051': 'crownleaf',  // Crownleaf Gift Shop
  '1245930131928783': 'adshalaa',  // Adshalaa Institute of Digital Marketing
};

async function fixIsolation() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));

  const allLeads = await Lead.find({});
  console.log(`Total leads in DB: ${allLeads.length}`);

  let updatedCount = 0;
  let tzarCount = 0;
  let titepoCount = 0;
  let crownleafCount = 0;
  let adshalaaCount = 0;

  for (const lead of allLeads) {
    let targetBusiness = lead.business;

    // Check if metaFormFields or interestedServices contain birthday / kids / event keywords -> Titepo
    const formFieldsStr = JSON.stringify(lead.metaFormFields || []).toLowerCase();
    const servicesStr = (lead.interestedServices || []).join(' ').toLowerCase();

    if (
      formFieldsStr.includes('birthday') ||
      formFieldsStr.includes('return_gift') ||
      formFieldsStr.includes('kids') ||
      servicesStr.includes('birthday') ||
      servicesStr.includes('return_gift') ||
      servicesStr.includes('kids')
    ) {
      targetBusiness = 'titepo';
    } else if (
      formFieldsStr.includes('crownleaf') ||
      servicesStr.includes('crownleaf') ||
      servicesStr.includes('gifting')
    ) {
      targetBusiness = 'crownleaf';
    } else if (
      formFieldsStr.includes('adshalaa') ||
      servicesStr.includes('adshalaa') ||
      servicesStr.includes('course')
    ) {
      targetBusiness = 'adshalaa';
    }

    // Update if changed or normalize
    if (lead.business !== targetBusiness) {
      lead.business = targetBusiness;
      // update prefix of custom id if needed
      const prefix = targetBusiness === 'tzar' ? 'TZ-LD' : targetBusiness === 'titepo' ? 'TT-LD' : targetBusiness === 'crownleaf' ? 'CL-LD' : 'AD-LD';
      if (lead.leadCustomId && !lead.leadCustomId.startsWith(prefix)) {
        const numPart = lead.leadCustomId.split('-').pop() || Math.floor(1000 + Math.random() * 9000);
        lead.leadCustomId = `${prefix}-${numPart}`;
      }
      await lead.save();
      updatedCount++;
    }

    if (targetBusiness === 'tzar') tzarCount++;
    else if (targetBusiness === 'titepo') titepoCount++;
    else if (targetBusiness === 'crownleaf') crownleafCount++;
    else if (targetBusiness === 'adshalaa') adshalaaCount++;
  }

  console.log(`\n=== RE-ISOLATION SUMMARY ===`);
  console.log(`Updated Lead Records: ${updatedCount}`);
  console.log(`TZAR (Marketing/WebDev) Leads: ${tzarCount}`);
  console.log(`TITEPO (Toys/Events) Leads: ${titepoCount}`);
  console.log(`CROWNLEAF (Gifting) Leads: ${crownleafCount}`);
  console.log(`ADSHALAA (EdTech/Courses) Leads: ${adshalaaCount}`);

  await mongoose.disconnect();
}

fixIsolation().catch(console.error);
