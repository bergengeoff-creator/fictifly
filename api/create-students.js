import { isTeacherRole, getStudentLimitPerClass } from '../src/utils/accountTiers';
import { handleCors, requireUser, getProfile, teacherOwnsClass, getSupabaseUrl } from './_lib/security';

const ADJECTIVES = ['Amber','Arctic','Bold','Brave','Bright','Bronze','Calm','Clever','Cosmic','Crisp','Crystal','Cunning','Daring','Dawn','Dusty','Echo','Epic','Fabled','Fierce','Fiery','Frosty','Gilded','Golden','Grand','Gritty','Hidden','Hollow','Icy','Indigo','Jade','Keen','Lofty','Lucky','Lunar','Maple','Marble','Misty','Mystic','Noble','Olive','Onyx','Ornate','Phantom','Plum','Polar','Quick','Quiet','Radiant','Rapid','Raven','Royal','Ruby','Rustic','Sandy','Scarlet','Shadow','Sharp','Silent','Silver','Slate','Smoky','Solar','Stark','Steel','Stormy','Swift','Tawny','Thunder','Timber','Twilight','Velvet','Vivid','Wild','Winter','Zephyr'];
const NOUNS = ['Author','Bard','Blade','Brook','Cloud','Comet','Craft','Creek','Crown','Dusk','Echo','Falcon','Fern','Flame','Flash','Flint','Fox','Frost','Grove','Hawk','Horizon','Hound','Ink','Isle','Jade','Leaf','Legend','Light','Lore','Lynx','Mage','Maple','Mist','Moon','Myth','Peak','Pen','Pine','Plot','Prose','Quest','Quill','Raven','Reed','Ridge','River','Rock','Rogue','Sage','Scout','Scribe','Scroll','Shade','Shore','Sketch','Sky','Spark','Star','Stone','Storm','Stream','Tale','Tide','Token','Tome','Trail','Vale','Verse','Voice','Wave','Wind','Wolf','Word','Writer','Yarn'];
const funUsername = () => { const a=ADJECTIVES[Math.floor(Math.random()*ADJECTIVES.length)]; const n=NOUNS[Math.floor(Math.random()*NOUNS.length)]; const num=Math.floor(10+Math.random()*90); return `${a}${n}${num}`; };


const MAX_BATCH = 50;
const USERNAME_RE = /^[A-Za-z0-9_.-]{3,60}$/;
const PASSCODE_RE = /^\d{6,12}$/;

// Creates teacher-managed student accounts. The caller must be a signed-in teacher who
// owns the target class; per-class student limits are enforced here, not just in the UI.
export default async function handler(req, res) {
  if (handleCors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const { accounts, classId } = req.body || {};

    if (!Array.isArray(accounts) || accounts.length === 0 || !classId) {
      return res.status(400).json({ error: 'Missing accounts or classId' });
    }
    if (accounts.length > MAX_BATCH) {
      return res.status(400).json({ error: `You can create at most ${MAX_BATCH} accounts at a time.` });
    }
    for (const a of accounts) {
      if (!a || !USERNAME_RE.test(a.username || '') || !PASSCODE_RE.test(a.passcode || '')) {
        return res.status(400).json({ error: 'Usernames may only use letters, numbers, _ . and -' });
      }
    }

    const profile = await getProfile(user.id);
    if (!profile || !isTeacherRole(profile.account_type)) {
      return res.status(403).json({ error: 'Only teachers can create student accounts.' });
    }
    if (!(await teacherOwnsClass(user.id, classId))) {
      return res.status(403).json({ error: 'You can only add students to your own classes.' });
    }

    const supabaseUrl = getSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'Server is not configured.' });
    }

    const limit = getStudentLimitPerClass(profile.account_type);
    if (limit != null) {
      const countRes = await fetch(
        `${supabaseUrl}/rest/v1/class_members?class_id=eq.${classId}&select=student_id`,
        { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
      );
      const current = countRes.ok ? (await countRes.json()).length : 0;
      if (current + accounts.length > limit) {
        return res.status(403).json({ error: `Your plan is limited to ${limit} students per class.` });
      }
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
    console.error('create-students error:', err);
    res.status(500).json({ error: 'Could not create student accounts.' });
  }
}