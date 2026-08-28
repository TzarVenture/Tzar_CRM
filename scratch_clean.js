const mongoose = require("mongoose");

const uri =
  "mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority";

async function clean() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const res = await db.collection("metainsights").deleteMany({
    campaignId: {
      $in: [
        "cmp_web_revamp_2026",
        "cmp_seo_retainer_2026",
        "cmp_branding_promo_2026",
        "cmp_ppc_meta_growth_2026",
      ],
    },
  });
  console.log("DELETED DUMMY CAMPAIGNS:", res.deletedCount);
  await mongoose.disconnect();
}

clean();
