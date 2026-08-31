const PAGES = [
  {
    name: 'Tzar Venture',
    pageId: '364879847573029',
    pageToken: 'EAAUIZCL1Afd8BSQCbyrPPKy8mhK6cHwacWDZAuBOCYETXbSUHIgZAnG7o3Kt0Gau7iu2vtSTp8sPEeHswaDMHBbDQFrhR4P4NXDftfq49VsRIiLk76yw4CNLs6o0kP8yDL6F0TTByxVHLctvJdFoXW0itflex3G7JZBKg5ESB4vdcRVYlnZAdYCZArhUDT7HmF6cgqgbqOn26LKZBVos1Y8Vf7ViFuqAoushSZBcXAZDZD',
  },
  {
    name: 'Titepo Toys',
    pageId: '1019277841258458',
    pageToken: 'EAAUIZCL1Afd8BSZAMRTOwMNwaxfwvcw0pkCZAZCmLTRcBj0ZB4fTZAZBtkKkBC4eAhQFBVZA5DYiVfOfAx8nfTwPaBoNeRiHnoafK90dM75lnmugY99yW8NFcVUrpSsMZBZCZAYoKqph8T1cgr7FRgMzoUI8K49F3JjAz9wkssR3dllj6xZCDxr2vLxF1Lp31z1bU9odk5nA0RKx62WmVbEoH0Rt4JuMVEPolj5fxgzguQZDZD',
  },
  {
    name: 'Adshalaa Institute',
    pageId: '1245930131928783',
    pageToken: 'EAAUIZCL1Afd8BSYn0vul1YsuzOB09ZCjWnqQxKa3AZBEujv8Wa0hwyuAhZChOmWwTsLdMSEGvZBOKvScwz2yKiQG5ZAxj9mGOGHNKxgXR0JzFsgCrUvuTiN4B8e7XIAUvwlZCbggN6ObzZB2ueMOqslAVIvw0dYMPtkTLuRhC45oTxQd1eOs7wSN4boawYwcBh8AyO4ZCtSKeuD6ciZAELECZB13xrRaJinbVb7zPWfSQZDZD',
  },
  {
    name: 'Crownleaf Gifting',
    pageId: '837451012790051',
    pageToken: 'EAAUIZCL1Afd8BSVcPIyBeoZAAFNDwbXb4YaR4bGnLgw5skJyj6R2y56ScABUTFDkwN7JhGZASxQd7klo5TdTfaq0I7AU82F6yur0rBMBNgen0TgjMJI1bUfBPpoaRv4WPczkgKvMBRZBd5DjQOneZAuA04Wx52tZBxryij8WhTXzvwUblQk8DVir4kZAgmiPVYhHWFn8I1HBIIuJEQhEZAZBvSddJettvbuZBu4e0ZCggZDZD',
  },
];

async function subscribeAll4Pages() {
  console.log('=== SUBSCRIBING ALL 4 FACEBOOK PAGES TO TZAR_APP META LEADGEN WEBHOOKS ===\n');

  for (const page of PAGES) {
    console.log(`Subscribing ${page.name} (Page ID: ${page.pageId})...`);

    const res = await fetch(
      `https://graph.facebook.com/v20.0/${page.pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${page.pageToken}`,
      { method: 'POST' }
    );

    const data = await res.json();
    console.log(`Result for ${page.name}:`, data);
  }

  console.log('\n=== ALL 4 PAGES SUCCESSFULLY SUBSCRIBED TO META LEADGEN WEBHOOKS! ===');
}

subscribeAll4Pages().catch(console.error);
