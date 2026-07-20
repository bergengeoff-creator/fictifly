export const TEACHER_ROLE_TIERS = ['teacher', 'teacher_plus'];

export function isTeacherRole(accountType) {
  return TEACHER_ROLE_TIERS.includes(accountType);
}

export const CLASS_LIMIT_BY_TIER = { teacher: 1, teacher_plus: 5 };
export const STUDENT_LIMIT_BY_TIER = { teacher: 30 };

export function getClassLimit(accountType) {
  return CLASS_LIMIT_BY_TIER[accountType] ?? null;
}

export function getStudentLimitPerClass(accountType) {
  return STUDENT_LIMIT_BY_TIER[accountType] ?? null;
}

export function isPremiumWriter(profile) {
  if (!profile) return false;
  if (profile.is_premium) return true;
  if (profile.premium_expires_at) {
    return new Date(profile.premium_expires_at) > new Date();
  }
  return false;
}

export const STUDENT_ROLE_TYPES = ['minor', 'student'];

export function isStudentRole(accountType) {
  return STUDENT_ROLE_TYPES.includes(accountType);
}
