// /api/award-badge.js
// Teacher-awarded badges. The awarding teacher is the signed-in caller (never a teacherId
// from the request body), and they can only award to students in one of their own classes.
import { isTeacherRole } from '../src/utils/accountTiers';
import {
  handleCors, requireUser, getProfile, teacherHasStudent, isUuid,
  getSupabaseUrl, getServiceHeaders,
} from './_lib/security';

export default async function handler(req, res) {
  if (handleCors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  try {
    const { studentId, badgeName } = req.body || {};
    if (!isUuid(studentId) || typeof badgeName !== 'string' || !badgeName.trim()) {
      return res.status(400).json({ error: 'Missing studentId or badgeName' });
    }

    const profile = await getProfile(user.id);
    if (!profile || !isTeacherRole(profile.account_type)) {
      return res.status(403).json({ error: 'Only teachers can award badges.' });
    }
    if (!(await teacherHasStudent(user.id, studentId))) {
      return res.status(403).json({ error: 'That student is not in one of your classes.' });
    }

    const supabaseUrl = getSupabaseUrl();
    const headers = getServiceHeaders();

    const badgeRes = await fetch(
      `${supabaseUrl}/rest/v1/badges?name=eq.${encodeURIComponent(badgeName)}&teacher_awarded=eq.true&select=id,name`,
      { headers }
    );
    const badgeData = await badgeRes.json();
    if (!badgeData[0]) {
      return res.status(400).json({ error: 'Badge not found or not teacher-awarded' });
    }

    const existingRes = await fetch(
      `${supabaseUrl}/rest/v1/user_badges?user_id=eq.${studentId}&badge_id=eq.${badgeData[0].id}&select=id`,
      { headers }
    );
    const existingData = await existingRes.json();
    if (existingData.length > 0) {
      return res.status(409).json({ error: 'Student already has this badge' });
    }

    await fetch(`${supabaseUrl}/rest/v1/user_badges`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: studentId,
        badge_id: badgeData[0].id,
        awarded_by: user.id,
        earned_at: new Date().toISOString(),
      }),
    });

    return res.status(200).json({ success: true, badge: badgeData[0] });
  } catch (err) {
    console.error('award-badge error:', err);
    return res.status(500).json({ error: 'Could not award badge.' });
  }
}
