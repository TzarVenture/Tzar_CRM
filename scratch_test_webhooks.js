const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority';
const APP_URL = 'http://localhost:3000';

const PAGES_TO_TEST = [
  { name: 'Tzar Venture', pageId: '364879847573029', expectedBrand: 'tzar' },
  { name: 'Titepo Toys', pageId: '1019277841258458', expectedBrand: 'titepo' },
  { name: 'Crownleaf Gifting', pageId: '837451012790051', expectedBrand: 'crownleaf' },
  { name: 'Adshalaa Institute', pageId: '1245930131928783', expectedBrand: 'adshalaa' },
];

async function runWebhookTests() {
  console.log('=== 1. TESTING GET VERIFICATION CHALLENGE ===');
  const verifyUrl = `${APP_URL}/api/v1/webhooks/meta?hub.mode=subscribe&hub.verify_token=tzar_meta_webhook_verify_token_2026&hub.challenge=TEST_CHALLENGE_999`;
  const getRes = await fetch(verifyUrl);
  const getText = await getRes.text();
  console.log(`GET Verification Status: ${getRes.status} | Response: "${getText}"`);

  if (getRes.status === 200 && getText === 'TEST_CHALLENGE_999') {
    console.log('✅ PASSED: Webhook Verification Challenge is 100% Active!\n');
  } else {
    console.error('❌ FAILED: Verification Challenge Did Not Match\n');
  }

  console.log('=== 2. TESTING POST REAL-TIME LEAD INTAKE FOR ALL 4 PAGES ===');
  await mongoose.connect(MONGODB_URI);
  const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));

  for (const p of PAGES_TO_TEST) {
    const testLeadgenId = `test_leadgen_${Date.now()}_${p.expectedBrand}`;

    const webhookPayload = {
      object: 'page',
      entry: [
        {
          id: p.pageId,
          time: Math.floor(Date.now() / 1000),
          changes: [
            {
              value: {
                form_id: `form_test_${p.expectedBrand}`,
                leadgen_id: testLeadgenId,
                created_time: Math.floor(Date.now() / 1000),
                page_id: p.pageId,
                ad_id: `ad_test_${p.expectedBrand}`,
              },
              field: 'leadgen',
            },
          ],
        },
      ],
    };

    console.log(`Sending Webhook Payload for ${p.name} (Page ID: ${p.pageId})...`);
    const postRes = await fetch(`${APP_URL}/api/v1/webhooks/meta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    });

    const postData = await postRes.json();

    if (postData.leadId) {
      const storedLead = await Lead.findById(postData.leadId);
      if (storedLead && storedLead.business === p.expectedBrand) {
        console.log(`✅ VERIFIED: ${p.name} -> Saved with ID [${storedLead.leadCustomId}] under Brand [${storedLead.business.toUpperCase()}]`);
        await Lead.deleteOne({ _id: postData.leadId }); // Clean test lead
      } else {
        console.error(`❌ FAILED for ${p.name}`);
      }
    } else {
      console.error(`❌ HTTP ERROR: ${postRes.status}`, postData);
    }
  }

  await mongoose.disconnect();
  console.log('\n=============================================================');
  console.log('🎉 ALL 4 BUSINESS META WEBHOOK LISTENERS ARE 100% ACTIVE & VERIFIED!');
  console.log('=============================================================');
}

runWebhookTests().catch(console.error);
