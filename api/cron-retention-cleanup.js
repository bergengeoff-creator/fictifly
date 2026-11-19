import crypto from 'crypto';
// /api/cron-retention-cleanup.js
// Vercel Cron target (see vercel.json). Runs daily.
//
// Soft-delete pass: assignment_feedback past its retention_date gets is_deleted=true.
// Hard-delete pass: rows soft-deleted 14+ days ago get permanently removed.
// Deleting assignment_feedback cascades (ON DELETE CASCADE, confirmed against the live
// schema) through feedback_comments and rubric_scores, and through feedback_comments on
// to feedback_replies — no manual child cleanup needed.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
  if (
    !process.env.CRON_SECRET ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    'Content-Type': 'application/json',
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    // ── SOFT-DELETE PASS ──────────────────────────────
    const todayStr = new Date().toISOString().split('T')[0];
    const softNowIso = new Date().toISOString();

    const softRes = await fetch(
      `${supabaseUrl}/rest/v1/assignment_feedback?retention_date=lte.${todayStr}&is_deleted=eq.false&select=id,teacher_id`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify({ is_deleted: true, deleted_at: softNowIso }),
      }
    );
    if (!softRes.ok) {
      throw new Error(`Soft-delete update failed: ${await softRes.text()}`);
    }
    const softDeletedRows = await softRes.json();

    if (softDeletedRows.length > 0) {
      const softAuditRes = await fetch(`${supabaseUrl}/rest/v1/feedback_deletion_audit_log`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(
          softDeletedRows.map((row) => ({
            feedback_id: row.id,
            teacher_id: row.teacher_id,
            deleted_by_id: null,
            reason: 'auto_deletion',
            deleted_at: softNowIso,
            school_id: null,
          }))
        ),
      });
      if (!softAuditRes.ok) {
        throw new Error(`Soft-delete audit log insert failed: ${await softAuditRes.text()}`);
      }
    }

    // ── HARD-DELETE PASS ──────────────────────────────
    const hardCutoff = new Date();
    hardCutoff.setDate(hardCutoff.getDate() - 14);
    const hardCutoffIso = hardCutoff.toISOString();

    const hardSelectRes = await fetch(
      `${supabaseUrl}/rest/v1/assignment_feedback?is_deleted=eq.true&deleted_at=lte.${encodeURIComponent(hardCutoffIso)}&select=id,teacher_id`,
      { headers }
    );
    if (!hardSelectRes.ok) {
      throw new Error(`Hard-delete candidate lookup failed: ${await hardSelectRes.text()}`);
    }
    const toHardDelete = await hardSelectRes.json();

    if (toHardDelete.length > 0) {
      const hardNowIso = new Date().toISOString();
      const hardIds = toHardDelete.map((row) => row.id);

      // Audit row goes in first. Same 'reason' value as the soft-delete row (the
      // audit_log.reason CHECK constraint only allows auto_deletion/manual_deletion/
      // teacher_request) — the two stages are distinguished by deleted_at: the
      // soft-delete row's deleted_at is ~14 days earlier than the hard-delete row's.
      const hardAuditRes = await fetch(`${supabaseUrl}/rest/v1/feedback_deletion_audit_log`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(
          toHardDelete.map((row) => ({
            feedback_id: row.id,
            teacher_id: row.teacher_id,
            deleted_by_id: null,
            reason: 'auto_deletion',
            deleted_at: hardNowIso,
            school_id: null,
          }))
        ),
      });
      if (!hardAuditRes.ok) {
        throw new Error(`Hard-delete audit log insert failed: ${await hardAuditRes.text()}`);
      }

      const hardDeleteRes = await fetch(
        `${supabaseUrl}/rest/v1/assignment_feedback?id=in.(${hardIds.join(',')})`,
        { method: 'DELETE', headers: { ...headers, Prefer: 'return=minimal' } }
      );
      if (!hardDeleteRes.ok) {
        throw new Error(`Hard-delete failed: ${await hardDeleteRes.text()}`);
      }
    }

    return res.status(200).json({
      softDeleted: softDeletedRows.length,
      hardDeleted: toHardDelete.length,
    });
  } catch (err) {
    console.error('cron-retention-cleanup error:', err);
    return res.status(500).json({ error: err.message });
  }
}
