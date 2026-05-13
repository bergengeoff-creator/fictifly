const ADJECTIVES = ['Amber','Arctic','Bold','Brave','Bright','Bronze','Calm','Clever','Cosmic','Crisp','Crystal','Cunning','Daring','Dawn','Dusty','Echo','Epic','Fabled','Fierce','Fiery','Frosty','Gilded','Golden','Grand','Gritty','Hidden','Hollow','Icy','Indigo','Jade','Keen','Lofty','Lucky','Lunar','Maple','Marble','Misty','Mystic','Noble','Olive','Onyx','Ornate','Phantom','Plum','Polar','Quick','Quiet','Radiant','Rapid','Raven','Royal','Ruby','Rustic','Sandy','Scarlet','Shadow','Sharp','Silent','Silver','Slate','Smoky','Solar','Stark','Steel','Stormy','Swift','Tawny','Thunder','Timber','Twilight','Velvet','Vivid','Wild','Winter','Zephyr'];
const NOUNS = ['Author','Bard','Blade','Brook','Cloud','Comet','Craft','Creek','Crown','Dusk','Echo','Falcon','Fern','Flame','Flash','Flint','Fox','Frost','Grove','Hawk','Horizon','Hound','Ink','Isle','Jade','Leaf','Legend','Light','Lore','Lynx','Mage','Maple','Mist','Moon','Myth','Peak','Pen','Pine','Plot','Prose','Quest','Quill','Raven','Reed','Ridge','River','Rock','Rogue','Sage','Scout','Scribe','Scroll','Shade','Shore','Sketch','Sky','Spark','Star','Stone','Storm','Stream','Tale','Tide','Token','Tome','Trail','Vale','Verse','Voice','Wave','Wind','Wolf','Word','Writer','Yarn'];
const funUsername = () => { const a=ADJECTIVES[Math.floor(Math.random()*ADJECTIVES.length)]; const n=NOUNS[Math.floor(Math.random()*NOUNS.length)]; const num=Math.floor(10+Math.random()*90); return `${a}${n}${num}`; };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { accounts, classId } = req.body;

    if (!accounts || !classId) {
      return res.status(400).json({ error: 'Missing accounts or classId' });
    }

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const results = [];

    for (const account of accounts) {
      try {
        const { username, passcode } = account;
        const email = username.toLowerCase() + '@minor.fictifly.com';

        // Create auth user via admin API
        const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            email,
            password: passcode,
            email_confirm: true,
          }),
        });

        const authData = await authRes.json();
        if (!authData.id) {
          results.push({ username, passcode, error: authData.message || 'Failed to create auth user' });
          continue;
        }

        // Insert profile
        await fetch(`${supabaseUrl}/rest/v1/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            id: authData.id,
            username,
            account_type: 'student',
            is_minor: true,
            age_verified: true,
            profile_public: false,
            profile_complete: true,
            display_name: username,
          }),
        });

        // Link to class
        await fetch(`${supabaseUrl}/rest/v1/class_members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ class_id: classId, student_id: authData.id }),
        });

        results.push({ username, passcode, success: true });
      } catch (accountErr) {
        results.push({ username: account.username, passcode: account.passcode, error: accountErr.message });
      }
    }

    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}