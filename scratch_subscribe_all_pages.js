const USER_TOKEN = 'EAAUIZCL1Afd8BSY4JszH1IEbP1Dp7V0UKPACyYdrZApz94VY88xo77Ld1qeGQZB1ZC7W2kNX6OGYRFPRdwVPHHWMCnsHOhqSX4S1EqyVX1LZBulrK3x6zOcFRltbLAkO5KZBI3364VvDoRJuBbz8kQ1VQRCrtsRAUhNocsZCELXTht8mZAXH6OG0bRd65U7HelZAezZBKdg4cfrbLOGvBHwQKhqrb4M1W1fZApjY9ZCok1VNOIoN4T7szjT2HKZCar7ZAvoJsOrplVV5RQy68ZD';

const TARGET_PAGES = [
  { name: 'Tzar Venture', pageId: '364879847573029' },
  { name: 'Titepo Toys', pageId: '1019277841258458' },
  { name: 'Crownleaf Gifting', pageId: '837451012790051' },
  { name: 'Adshalaa Institute', pageId: '1245930131928783' },
];

async function subscribeAllPages() {
  console.log('=== SUBSCRIBING ALL 4 PAGES TO TZAR_APP META WEBHOOKS ===\n');

  // 1. Get Accounts / Page Tokens
  const accRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${USER_TOKEN}`);
  const accData = await accRes.json();

  if (!accData.data) {
    console.error('Failed to fetch pages:', accData);
    return;
  }

  for (const target of TARGET_PAGES) {
    const pageObj = accData.data.find(p => String(p.id) === target.pageId);
    if (!pageObj) {
      console.error(`Page ${target.name} (${target.pageId}) not found in user account pages.`);
      continue;
    }

    const pageToken = pageObj.access_token;
    console.log(`Subscribing ${target.name} (Page ID: ${target.pageId}) using Page Token...`);

    const subRes = await fetch(`https://graph.facebook.com/v20.0/${target.pageId}/subscribed_apps?subscribed_fields=leadgen,messages&access_token=${pageToken}`, {
      method: 'POST',
    });
    const subData = await subRes.json();
    console.log(`Subscription Result for ${target.name}:`, subData);
  }

  console.log('\n=== PAGE WEBHOOK SUBSCRIPTION PROCESS COMPLETE ===');
}

subscribeAllPages().catch(console.error);
