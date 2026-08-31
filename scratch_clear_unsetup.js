const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://crownleaf_db_user:Hw51WANeY8AMSSCC@cluster0.adkzcsy.mongodb.net/tzar_crm_db?retryWrites=true&w=majority';

async function clearUnsetup() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Lead = mongoose.model('Lead', new mongoose.Schema({}, { strict: false }));

  const delRes = await Lead.deleteMany({ business: { $in: ['adshalaa', 'crownleaf'] } });
  console.log(`Deleted ${delRes.deletedCount} dummy/unsetup leads for Adshalaa & Crownleaf!`);

  const tzarCount = await Lead.countDocuments({ business: 'tzar' });
  const titepoCount = await Lead.countDocuments({ business: 'titepo' });

  console.log(`Remaining Active Pipeline Leads:`);
  console.log(`TZAR: ${tzarCount}`);
  console.log(`TITEPO: ${titepoCount}`);

  await mongoose.disconnect();
}

clearUnsetup().catch(console.error);
