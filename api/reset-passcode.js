// /api/reset-passcode.js
// Teacher approves a student's passcode reset. The caller must be a signed-in teacher with
// the student in one of their classes. (This file had been overwritten with a copy of
// request-passcode-reset.js, which broke the "Approve" button in ClassroomDashboard.)
import { isTeacherRole, isStudentRole } from '../src/utils/accountTiers';
import {
  handleCors, requireUser, getProfile, teacherHasStudent, isUuid,
  getSupabaseUrl, getServiceHeaders,
} from './_lib/security';

const PASSCODE_RE = /^\d{6,12}$/;

export default async function handler(req, res) {
  if (handleCors(req, res, 'POST')) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await requireUser(req, res);
  if (!user) return;

  const { studentId, newPasscode } = req.body || {};
  if (!isUuid(studentId) || !PASSCODE_RE.test(newPasscode || '')) {
    return res.status(400).json({ error: 'Missing studentId or newPasscode' });
  }

  const teacher = await getProfile(user.id);
  if (!teacher || !isTeacherRole(teacher.account_type)) {
    return res.status(403).json({ error: 'Only teachers can reset passcodes.' });
  }
  const student = await getProfile(studentId);
  if (!student || !isStudentRole(student.account_type)) {
    return res.status(400).json({ error: 'That account does not use a passcode.' });
  }
  if (!(await teacherHasStudent(user.id, studentId))) {
    return res.status(403).json({ error: 'That student is not in one of your classes.' });
  }

  const response = await fetch(`${getSupabaseUrl()}/auth/v1/admin/users/${studentId}`, {
    method: 'PUT',
    headers: getServiceHeaders(),
    body: JSON.stringify({ password: newPasscode }),
  });
  if (!response.ok) {
    console.error('reset-passcode: admin update failed', response.status);
    return res.status(500).json({ error: 'Failed to reset passcode' });
  }
  return res.status(200).json({ success: true });
}
