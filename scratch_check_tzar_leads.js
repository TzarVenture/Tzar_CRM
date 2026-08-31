const pageToken = 'EAAUIZCL1Afd8BSdKQrMwwxj0kDTIgDHoI4vGNZAsLIbgOmQg9rBJ06QzMpCBfcNDJKLjacUJJGVCgAMWZCq30ybQk494U7JB9e3zJISaTUMn5ZB0dkiYaVpISyaC42QqXz3nU2zqdbt3LGstWlWjjR03guHZC4ZC4DZCJCwm5ii5nyKfcZB4gYRWsP2Ld4KyL0T4YPAiTtPOwRjnphJnlhVD60MOgw2wmu74qgOZCeZAZAs2ZCEZD';
const pageId = '364879847573029';

async function test() {
  const formsRes = await fetch(`https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?access_token=${pageToken}`);
  const formsData = await formsRes.json();
  console.log('Forms count:', formsData.data?.length);

  if (formsData.data) {
    for (const form of formsData.data) {
      console.log('\n--- Form:', form.name, '| Form ID:', form.id, '---');
      const leadsRes = await fetch(`https://graph.facebook.com/v20.0/${form.id}/leads?fields=id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name&limit=100&access_token=${pageToken}`);
      const leadsData = await leadsRes.json();
      console.log('Total leads for form:', leadsData.data?.length);
      if (leadsData.data && leadsData.data.length > 0) {
        leadsData.data.slice(0, 10).forEach(l => {
          console.log('Lead ID:', l.id, '| Created:', l.created_time);
        });
      }
    }
  }
}
test();
