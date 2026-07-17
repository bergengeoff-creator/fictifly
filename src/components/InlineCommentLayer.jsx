import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';

const B = {
  sand: '#F5EFE6',
  sandMid: '#EDE3D4',
  sandDeep: '#D9C9B0',
  terra: '#D4845A',
  terraDark: '#B56840',
  seaDeep: '#2E6DA4',
  ink: '#3A3226',
  inkMid: '#6B5D4E',
  inkLight: '#9A8878',
  white: '#FFFCF8',
};

const HIGHLIGHT_BG = 'rgba(46, 109, 164, 0.16)';
const HIGHLIGHT_BG_RESOLVED = 'rgba(154, 136, 120, 0.16)';
const HIGHLIGHT_BG_ACTIVE = 'rgba(46, 109, 164, 0.32)';

/**
 * InlineCommentLayer
 *
 * Renders `content` as plain readable text, letting a teacher select a
 * range and attach a comment to it. Existing comments render as highlighted
 * spans; clicking one opens a thread (comment + replies + resolve/delete).
 *
 * Props:
 *  - feedbackId (required): the assignment_feedback row these comments attach to
 *  - submissionVersion (default 1)
 *  - content: the submission's text
 *  - readOnly: if true, disables adding/editing (e.g. student view without reply rights)
 *  - onCommentsChange: optional callback(comments) fired after any mutation
 */
export default function InlineCommentLayer({
  feedbackId,
  submissionVersion = 1,
  content,
  readOnly = false,
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  const [selection, setSelection] = useState(null); // { start, end, text, rect }
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [replyDraft, setReplyDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const containerRef = useRef(null);

  const authHeaders = useCallback(
    (extra = {}) => ({ Authorization: `Bearer ${token}`, ...extra }),
    [token]
  );

  // Fetch session once, then load comments
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session?.access_token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      setToken(session.access_token);
      await loadComments(session.access_token);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId, submissionVersion]);

  const loadComments = async (authToken) => {
    if (!feedbackId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/teacher-features?action=getInlineComments&feedbackId=${feedbackId}&submissionVersion=${submissionVersion}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load comments');
      setComments(data.comments || []);
    } catch (err) {
      console.error('InlineCommentLayer load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute a global character offset for a DOM (node, offset) pair within containerRef
  const getGlobalOffset = (node, offset) => {
    let total = 0;
    let found = false;
    const walk = (el) => {
      for (const child of el.childNodes) {
        if (found) return;
        if (child === node) {
          total += offset;
          found = true;
          return;
        }
        if (child.nodeType === Node.TEXT_NODE) {
          total += child.textContent.length;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      }
    };
    walk(containerRef.current);
    return total;
  };

  const handleMouseUp = () => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      return;
    }
    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    const start = getGlobalOffset(range.startContainer, range.startOffset);
    const end = getGlobalOffset(range.endContainer, range.endOffset);
    const text = sel.toString();

    if (!text.trim() || start === end) return;

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelection({
      start: Math.min(start, end),
      end: Math.max(start, end),
      text,
      top: rect.bottom - containerRect.top + 8,
      left: Math.max(0, rect.left - containerRect.left),
    });
    setActiveCommentId(null);
  };

  const handleAddComment = async () => {
    if (!draftText.trim() || !selection) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/teacher-features?action=addInlineComment', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          feedbackId,
          submissionVersion,
          highlightedText: selection.text,
          startIndex: selection.start,
          endIndex: selection.end,
          commentText: draftText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add comment');
      setComments(prev => [...prev, data.comment].sort(
        (a, b) => a.highlighted_start_index - b.highlighted_start_index
      ));
      setSelection(null);
      setDraftText('');
      window.getSelection()?.removeAllRanges();
    } catch (err) {
      console.error('addInlineComment error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolved = async (comment) => {
    try {
      const res = await fetch('/api/teacher-features?action=updateInlineComment', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ commentId: comment.id, isResolved: !comment.is_resolved }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update comment');
      setComments(prev => prev.map(c => (c.id === comment.id ? data.comment : c)));
    } catch (err) {
      console.error('updateInlineComment error:', err);
      setError(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch('/api/teacher-features?action=deleteInlineComment', {
        method: 'DELETE',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ commentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete comment');
      }
      setComments(prev => prev.filter(c => c.id !== commentId));
      setActiveCommentId(null);
    } catch (err) {
      console.error('deleteInlineComment error:', err);
      setError(err.message);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyDraft.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/teacher-features?action=replyToComment', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ commentId, replyText: replyDraft.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reply');
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, feedback_replies: [...(c.feedback_replies || []), data.reply] }
            : c
        )
      );
      setReplyDraft('');
    } catch (err) {
      console.error('replyToComment error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Build non-overlapping text segments interleaved with highlighted spans
  const renderContent = () => {
    if (!content) return null;
    const sorted = [...comments].sort(
      (a, b) => a.highlighted_start_index - b.highlighted_start_index
    );

    const segments = [];
    let cursor = 0;

    sorted.forEach((comment) => {
      const start = comment.highlighted_start_index;
      const end = comment.highlighted_end_index;
      if (start < cursor || start >= content.length) return; // skip overlaps defensively

      if (start > cursor) {
        segments.push({ type: 'text', text: content.slice(cursor, start) });
      }
      segments.push({
        type: 'highlight',
        text: content.slice(start, Math.min(end, content.length)),
        comment,
      });
      cursor = Math.min(end, content.length);
    });

    if (cursor < content.length) {
      segments.push({ type: 'text', text: content.slice(cursor) });
    }

    return segments.map((seg, i) => {
      if (seg.type === 'text') {
        return <span key={i}>{seg.text}</span>;
      }
      const isActive = activeCommentId === seg.comment.id;
      return (
        <mark
          key={i}
          onClick={() => setActiveCommentId(isActive ? null : seg.comment.id)}
          style={{
            backgroundColor: isActive
              ? HIGHLIGHT_BG_ACTIVE
              : seg.comment.is_resolved
              ? HIGHLIGHT_BG_RESOLVED
              : HIGHLIGHT_BG,
            borderBottom: `2px solid ${seg.comment.is_resolved ? B.inkLight : B.seaDeep}`,
            cursor: 'pointer',
            padding: '1px 0',
          }}
        >
          {seg.text}
        </mark>
      );
    });
  };

  const activeComment = comments.find(c => c.id === activeCommentId);

  return (
    <div style={{ position: 'relative' }}>
      {error && (
        <div
          style={{
            backgroundColor: '#FDF0E8',
            border: `1px solid ${B.terra}`,
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            color: B.terraDark,
            fontSize: '0.85rem',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: B.inkMid, fontSize: '0.9rem' }}>Loading comments...</p>
      ) : (
        <div
          ref={containerRef}
          onMouseUp={handleMouseUp}
          style={{
            lineHeight: '1.8',
            fontSize: '1rem',
            color: B.ink,
            whiteSpace: 'pre-wrap',
            userSelect: readOnly ? 'text' : 'text',
            position: 'relative',
          }}
        >
          {renderContent()}
        </div>
      )}

      {/* Selection popover: write a new comment */}
      {selection && !readOnly && (
        <div
          style={{
            position: 'absolute',
            top: selection.top,
            left: selection.left,
            zIndex: 20,
            backgroundColor: B.white,
            border: `1px solid ${B.sandDeep}`,
            borderRadius: '8px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
            padding: '0.75rem',
            width: '280px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: B.inkLight, marginBottom: '0.5rem' }}>
            Commenting on: "{selection.text.slice(0, 60)}{selection.text.length > 60 ? '…' : ''}"
          </div>
          <textarea
            autoFocus
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${B.sandDeep}`,
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              marginBottom: '0.5rem',
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setSelection(null); setDraftText(''); }}
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: 'transparent',
                border: 'none',
                color: B.inkMid,
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddComment}
              disabled={submitting || !draftText.trim()}
              style={{
                padding: '0.4rem 0.9rem',
                backgroundColor: B.seaDeep,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? 'Saving...' : 'Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comment thread popover */}
      {activeComment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCommentId(null);
          }}
        >
          <div
            style={{
              backgroundColor: B.white,
              borderRadius: '10px',
              padding: '1.25rem',
              width: '360px',
              maxHeight: '70vh',
              overflowY: 'auto',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: activeComment.is_resolved ? B.inkLight : B.seaDeep,
                  textTransform: 'uppercase',
                }}
              >
                {activeComment.is_resolved ? 'Resolved' : 'Open'}
              </span>
              <button
                type="button"
                onClick={() => setActiveCommentId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: B.inkMid }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                fontSize: '0.85rem',
                color: B.inkMid,
                fontStyle: 'italic',
                borderLeft: `3px solid ${B.sandDeep}`,
                paddingLeft: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              "{activeComment.highlighted_text}"
            </div>

            <div style={{ fontSize: '0.95rem', color: B.ink, marginBottom: '1rem' }}>
              {activeComment.comment_text}
            </div>

            {(activeComment.feedback_replies || []).map((reply) => (
              <div
                key={reply.id}
                style={{
                  backgroundColor: B.sand,
                  borderRadius: '6px',
                  padding: '0.6rem 0.75rem',
                  marginBottom: '0.5rem',
                  fontSize: '0.85rem',
                  color: B.ink,
                }}
              >
                {reply.reply_text}
              </div>
            ))}

            {!readOnly && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => handleToggleResolved(activeComment)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    backgroundColor: activeComment.is_resolved ? B.sandMid : B.seaDeep,
                    color: activeComment.is_resolved ? B.ink : '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {activeComment.is_resolved ? 'Reopen' : 'Mark Resolved'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteComment(activeComment.id)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    backgroundColor: 'transparent',
                    color: B.terraDark,
                    border: `1px solid ${B.terra}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Delete
                </button>
              </div>
            )}

            {readOnly && (
              <div style={{ marginTop: '1rem' }}>
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder="Reply..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: `1px solid ${B.sandDeep}`,
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    marginBottom: '0.5rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleReply(activeComment.id)}
                  disabled={submitting || !replyDraft.trim()}
                  style={{
                    padding: '0.5rem 0.9rem',
                    backgroundColor: B.seaDeep,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  {submitting ? 'Sending...' : 'Reply'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}