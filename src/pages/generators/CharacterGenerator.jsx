import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { useAuth } from '../../context/AuthContext';
import BadgeModal from '../../components/BadgeModal';

import { playAudioCue, playBadgeCue } from '../../utils/audioCue';
import FictiflyLogo from '../../components/FictiflyLogo';

const B = {
  sand: '#F5EFE6', sandMid: '#EDE3D4', sandDeep: '#D9C9B0',
  terra: '#D4845A', terraDark: '#B56840', seaMid: '#5B9EC9', seaDeep: '#2E6DA4',
  ink: '#3A3226', inkMid: '#6B5D4E', inkLight: '#9A8878', white: '#FFFCF8',
};

const ALL_FIELDS = [
  { key: 'ageRange',       label: 'Age Range',       adultExample: 'Late 30s',                                          minorExample: 'Teenager' },
  { key: 'profession',     label: 'Profession',      adultExample: 'Disgraced architect',                               minorExample: 'Amateur inventor' },
  { key: 'background',     label: 'Background',      adultExample: 'Grew up in a fishing village, moved to the city at 16', minorExample: 'Moved schools three times, never stayed long enough to make real friends' },
  { key: 'motivation',     label: 'Motivation',      adultExample: 'Wants to reconnect with an estranged daughter',     minorExample: 'Trying to prove they belong on the team' },
  { key: 'hobbies',        label: 'Hobbies',         adultExample: 'Collects vintage maps, plays chess badly',          minorExample: 'Builds model rockets, terrible at sitting still' },
  { key: 'personality',    label: 'Personality',     adultExample: 'Quietly stubborn, disarmingly warm with strangers', minorExample: 'Loud around friends, completely silent around adults' },
  { key: 'talents',        label: 'Talents',         adultExample: 'Exceptional memory, can mimic any accent',          minorExample: 'Can fix almost anything with the wrong tools' },
  { key: 'flaw',           label: 'Flaw',            adultExample: 'Cannot accept help from anyone',                   minorExample: 'Gives up too easily when things get hard', adultOnly: false },
  { key: 'secret',         label: 'Secret',          adultExample: 'Changed their name 12 years ago',                  minorExample: 'Secretly entered a competition without telling anyone', adultOnly: true },
  { key: 'voice',          label: 'Voice',           adultExample: 'Speaks in understatements, rarely finishes sentences', minorExample: 'Talks too fast when nervous, goes quiet when angry' },
  { key: 'physicalDetail', label: 'Physical Detail', adultExample: 'Always wears the same worn leather bracelet',      minorExample: 'Always has paint on their hands' },
  { key: 'name',           label: 'Name',            adultExample: 'Optional — leave off for mystery',                 minorExample: 'Optional — leave off for mystery' },
];

const PRESETS = [
  {
    key: 'sketch',
    label: 'Sketch',
    desc: 'Age, occupation, background, personality',
    fields: ['ageRange', 'profession', 'background', 'personality'],
  },
  {
    key: 'portrait',
    label: 'Portrait',
    desc: 'Adds motivation, hobbies, talents, and a flaw',
    fields: ['ageRange', 'profession', 'background', 'personality', 'motivation', 'hobbies', 'talents', 'flaw'],
  },
  {
    key: 'full',
    label: 'Full',
    desc: 'Every field',
    fields: null,
  },
];

const GENRES = [
  'Action/Adventure', 'Comedy', 'Crime', 'Drama', 'Fairy Tale', 'Fantasy',
  'Ghost Story', 'Historical Fiction', 'Horror', 'Mystery', 'Romance',
  'Romantic Comedy', 'Sci-Fi', 'Spy', 'Suspense', 'Thriller', 'Open Genre',
];

// Genre-specific world and profession hints to replace generic ones when a genre is selected
const GENRE_WORLDS = {
  'Fantasy':           ['a hidden guild of craftspeople', 'a frontier settlement near wild lands', 'an ancient monastery', 'a port city on a trade route', 'a mining town beneath a mountain', 'a travelling merchant caravan', 'a remote farming village', 'a scholars archive'],
  'Sci-Fi':            ['a research vessel', 'an orbital station', 'a colony on a new world', 'a megacity', 'a covert government program', 'a generation ship', 'an asteroid mining operation', 'a terraforming outpost'],
  'Horror':            ['an isolated town', 'a decaying institution', 'a rural community with secrets', 'an old estate', 'a hospital after dark', 'a remote research station', 'a small island community'],
  'Ghost Story':       ['a boarding house', 'an old family home', 'a small coastal town', 'a historic inn', 'a recently sold property'],
  'Mystery':           ['a private detective agency', 'a small police department', 'a wealthy household', 'a tight-knit neighbourhood', 'a law firm'],
  'Thriller':          ['a government agency', 'a private security firm', 'a newsroom', 'a pharmaceutical company', 'an airport hub'],
  'Suspense':          ['an ordinary suburb', 'a remote workplace', 'a gated community', 'a cross-country journey', 'a high-rise apartment building'],
  'Crime':             ['a city precinct', 'an organised crime network', 'a public defenders office', 'a pawn shop', 'a prison'],
  'Spy':               ['an intelligence agency', 'a diplomatic posting', 'a cover business', 'an international airport', 'an embassy'],
  'Romance':           ['a small coastal town', 'a busy city neighbourhood', 'a family business', 'a destination wedding', 'a shared apartment building'],
  'Romantic Comedy':   ['an office', 'a neighbourhood bakery', 'a wedding planning business', 'a rival company', 'a shared house'],
  'Drama':             ['a family home under strain', 'a struggling business', 'a hospital ward', 'a university department', 'a theatre company'],
  'Historical Fiction':['a market town', 'a military campaign', 'a farming estate', 'a port town during wartime', 'a craftsmens district', 'a merchant ship', 'a rural parish', 'a working-class neighbourhood', 'a tradesmens guild', 'a city hospital'],
  'Action/Adventure':  ['a mercenary outfit', 'an archaeological expedition', 'a survival situation', 'a rebel organisation', 'a high-stakes competition'],
  'Comedy':            ['a dysfunctional workplace', 'a chaotic family home', 'a struggling startup', 'a local community group', 'a small-town event'],
  'Fairy Tale':        ['a village near enchanted lands', 'a hidden valley', 'a cursed castle', 'a forest settlement', 'a market town at the edge of the known world'],
  'Open Genre':        null,
};

// Genres where non-human characters are appropriate
const NON_HUMAN_GENRES = new Set(['Fantasy', 'Sci-Fi', 'Fairy Tale', 'Horror', 'Ghost Story']);

// Genre-specific age range overrides
const GENRE_AGE_HINTS = {
  'Fantasy':   ['Young adult', 'Middle-aged', 'Elder', 'Ancient — centuries old', 'Ageless', 'Early 30s', 'Late 40s', 'Young — barely of age'],
  'Sci-Fi':    ['Young adult', 'Middle-aged', 'Elder', 'Indeterminate — longevity treatments', 'Early career', 'Late career'],
  'Fairy Tale': ['Young', 'Ancient', 'Ageless', 'Middle years', 'Elder'],
};

// Historical Fiction eras
const HISTORICAL_ERAS = [
  'Ancient Egypt (3000–300 BCE)',
  'Classical Greece (500–300 BCE)',
  'Roman Empire (27 BCE–476 CE)',
  'Viking Age (793–1066 CE)',
  'Medieval Europe (1000–1400)',
  'The Black Death era (1340s–1350s)',
  'The Renaissance (1400–1600)',
  'Age of Exploration (1500s)',
  'Elizabethan England (1558–1603)',
  'The Thirty Years War (1618–1648)',
  'Colonial America (1600s–1770s)',
  'The French Revolution (1789–1799)',
  'Napoleonic Era (1799–1815)',
  'Regency England (1811–1820)',
  'American Civil War (1861–1865)',
  'Victorian England (1837–1901)',
  'The Gilded Age USA (1870s–1900)',
  'Meiji Japan (1868–1912)',
  'World War I (1914–1918)',
  'The Roaring Twenties (1920s)',
  'The Great Depression (1930s)',
  'World War II (1939–1945)',
  'Post-war America (1945–1960s)',
  'The Cold War (1947–1991)',
];

// Sci-Fi setting types
const SCIFI_SETTINGS = [
  'Near-future Earth (10–50 years ahead)',
  'Post-apocalyptic Earth',
  'Cyberpunk megacity',
  'Space opera — galactic civilisations',
  'Generation ship in deep space',
  'First colony on Mars',
  'Dystopian surveillance state',
  'Post-scarcity utopia (with cracks)',
  'Biopunk — genetic engineering era',
  'AI takeover aftermath',
  'Solarpunk — ecological future',
  'Far-future humanity — barely recognisable',
  'Alien contact — first encounter',
  'Time travel adjacent — fractured timelines',
  'Uploaded consciousness society',
  'Asteroid belt mining frontier',
];

const Label = ({ children }) => (
  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: B.inkLight }}>
    {children}
  </span>
);

const Divider = () => <div style={{ height: '1px', background: B.sandMid }} />;

// Individual character field row in the sheet
const FieldRow = ({ field, value, locked, onToggleLock, onDeselect, onRefresh, refreshing }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '0.85rem',
    padding: '0.85rem 0', borderBottom: `1px solid ${B.sandMid}`,
    animation: 'fadeUp 0.3s ease',
  }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Label>{field.label}</Label>
      <div style={{
        fontFamily: "'Fraunces', serif", fontSize: '1.05rem', fontWeight: 500,
        marginTop: '0.2rem', lineHeight: 1.5,
        fontStyle: value ? 'normal' : 'italic',
        color: value ? B.ink : B.inkLight,
      }}>
        {value || field.example}
      </div>
    </div>
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', paddingTop: '0.15rem', flexShrink: 0 }}>
      {/* Refresh individual field */}
      <button
        onClick={() => onRefresh(field.key)}
        disabled={locked || refreshing}
        title="Regenerate this field"
        style={{
          width: 28, height: 28, borderRadius: '7px', border: `1px solid ${B.sandDeep}`,
          background: 'transparent', color: B.inkLight, cursor: locked || refreshing ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', transition: 'all 0.15s',
          opacity: locked ? 0.35 : 1,
        }}
        onMouseEnter={e => { if (!locked && !refreshing) { e.currentTarget.style.background = B.sandMid; e.currentTarget.style.color = B.ink; }}}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = B.inkLight; }}
      >
        {refreshing ? '…' : '↻'}
      </button>
      {/* Lock toggle */}
      <button
        onClick={() => onToggleLock(field.key)}
        title={locked ? 'Unlock field' : 'Lock field'}
        style={{
          height: 28, borderRadius: '7px', padding: '0 0.5rem',
          border: `1px solid ${locked ? B.terra : B.sandDeep}`,
          background: locked ? '#FDF0E8' : 'transparent',
          color: locked ? B.terraDark : B.inkLight,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em',
          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
      >
        {locked ? 'Locked' : 'Lock'}
      </button>
      {/* Deselect */}
      <button
        onClick={() => onDeselect(field.key)}
        title="Remove this field"
        style={{
          width: 28, height: 28, borderRadius: '7px', border: `1px solid ${B.sandDeep}`,
          background: 'transparent', color: B.inkLight, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.78rem', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#FDF0E8'; e.currentTarget.style.color = B.terraDark; e.currentTarget.style.borderColor = B.terra; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = B.inkLight; e.currentTarget.style.borderColor = B.sandDeep; }}
      >
        ✕
      </button>
    </div>
  </div>
);

export default function CharacterGenerator() {
  const { user, profile } = useAuth();

  // Which fields are active (shown in sheet)
  const [activeFields, setActiveFields] = useState(new Set());
  // Which preset is selected
  const [activePreset, setActivePreset] = useState('basic');
  // Which fields are locked
  const [lockedFields, setLockedFields] = useState(new Set());
  // Generated values per field key
  const [values, setValues] = useState({});
  // AI summary
  const [summary, setSummary] = useState('');

  const [loading, setLoading] = useState(false);
  const valuesRef = React.useRef(values);
  useEffect(() => { valuesRef.current = values; }, [values]);
  const [refreshingField, setRefreshingField] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('generate');
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [copiedSheet, setCopiedSheet] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [newBadges, setNewBadges] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('random');
  const [historicalEra, setHistoricalEra] = useState(() => HISTORICAL_ERAS[Math.floor(Math.random() * HISTORICAL_ERAS.length)]);
  const [scifiSetting, setScifiSetting] = useState(() => SCIFI_SETTINGS[Math.floor(Math.random() * SCIFI_SETTINGS.length)]);

  const trialActive = profile?.premium_expires_at
    ? new Date(profile.premium_expires_at) > new Date()
    : false;
  const isPremiumUser = profile && (profile.is_premium || trialActive);
  const isTeacher = profile?.account_type === 'teacher';
  const canSave = isPremiumUser || isTeacher;
  const FREE_LIMIT =
    isTeacher ? Infinity
    : isPremiumUser ? Infinity
    : profile?.account_type === 'student' ? 15
    : profile?.account_type === 'minor' ? 10
    : 6;
  const isUnlimited = isPremiumUser || isTeacher;

  useEffect(() => {
    fetchUsage();
    if (canSave) fetchSavedCharacters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed active fields once profile is known (so minor users don't see adult-only fields)
  useEffect(() => {
    if (profile) {
      applyPreset('sketch', true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const fetchUsage = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('prompt_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('usage_date', today)
      .maybeSingle();
    setUsageCount(data ? data.count : 0);
  };

  const trackUsage = async () => {
    const today = new Date().toISOString().split('T')[0];
    const newCount = usageCount + 1;
    await supabase.from('prompt_usage').upsert(
      { user_id: user.id, usage_date: today, count: newCount },
      { onConflict: 'user_id,usage_date' }
    );
    setUsageCount(newCount);
  };

  const fetchSavedCharacters = async () => {
    setLoadingSaved(true);
    const { data } = await supabase
      .from('saved_characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setSavedCharacters(data || []);
    setLoadingSaved(false);
  };

  const isMinor = profile?.account_type === 'minor' || profile?.account_type === 'student';

  // Fields available to this user
  const availableFields = ALL_FIELDS.filter(f => !f.adultOnly || !isMinor);

  // Randomisation seeds to break model anchoring
  const AGE_RANGES = [
    'Early 20s', 'Mid 20s', 'Late 20s', 'Early 30s', 'Mid 30s', 'Late 30s',
    'Early 40s', 'Mid 40s', 'Late 40s', 'Early 50s', 'Late 50s', 'Early 60s',
    'Late 60s', '70s', 'Elderly', 'Teenage', 'College-age',
  ];
  const ADULT_WORLDS = [
    'medicine', 'law', 'farming', 'journalism', 'academia', 'the military',
    'construction', 'music', 'finance', 'retail', 'trucking and logistics', 'hospitality',
    'scientific research', 'local government', 'religion', 'teaching', 'software',
    'commercial fishing', 'social work', 'restaurant work', 'manufacturing', 'civil engineering',
    'dentistry', 'veterinary work', 'plumbing and trades', 'insurance', 'real estate',
  ];
  const MINOR_WORLDS = [
    'sport', 'art', 'music', 'coding', 'animals', 'cooking', 'gaming',
    'science', 'drama', 'writing', 'nature', 'history', 'languages', 'fashion',
    'volunteering', 'photography', 'robotics', 'dance', 'film',
  ];
  const TONES = [
    'funny', 'melancholic', 'optimistic', 'anxious', 'eccentric', 'stoic',
    'impulsive', 'cautious', 'idealistic', 'cynical', 'warm', 'prickly',
    'distracted', 'determined', 'conflicted', 'serene',
  ];
  const ORIGINS = [
    'a small town', 'a big city', 'a coastal village', 'the countryside',
    'abroad', 'a close-knit community', 'an isolated place', 'a busy suburb',
    'a military base', 'a farming region', 'a university town',
  ];

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Build the generation prompt
  // lockedContext = object of already-established field values to inform new generations
  // previousValues = object of values being replaced, so model avoids repeating them
  const buildPrompt = (fieldKeys, lockedContext = {}, previousValues = {}) => {
    const seed = Math.floor(Math.random() * 99999);
    const genre = selectedGenre === 'random' ? null : selectedGenre;
    const genreAgeRanges = genre && GENRE_AGE_HINTS[genre];
    const ageHint = pick(genreAgeRanges || AGE_RANGES);
    const genreWorlds = genre && GENRE_WORLDS[genre];
    const worldHint = genreWorlds
      ? pick(genreWorlds)
      : isMinor ? pick(MINOR_WORLDS) : pick(ADULT_WORLDS);
    const toneHint = pick(TONES);
    const originHint = pick(ORIGINS);
    const nonHumanLine = genre && NON_HUMAN_GENRES.has(genre)
      ? `- Species: this character does not have to be human — consider elves, dwarves, creatures, spirits, androids, aliens, or entirely invented beings, but only occasionally (roughly 1 in 3 times)\n`
      : '';
    const eraLine = genre === 'Historical Fiction'
      ? `- Time period: ${historicalEra} — ground profession, background, and details firmly in this era\n`
      : genre === 'Sci-Fi'
      ? `- Setting: ${scifiSetting} — let this define the technology level, society, and character's world\n`
      : '';
    const genreLine = genre
      ? `- Genre: ${genre} — let this shape profession, backstory, quirks, and traits appropriately\n${eraLine}${nonHumanLine}`
      : '';

    const fieldList = fieldKeys.map(key => {
      const f = ALL_FIELDS.find(f => f.key === key);
      return `- "${key}": ${f.label}`;
    }).join('\n');

    const lockedLines = Object.entries(lockedContext).map(([key, val]) => {
      const f = ALL_FIELDS.find(f => f.key === key);
      return `- ${f?.label || key}: ${val}`;
    }).join('\n');

    const previousLines = Object.entries(previousValues)
      .filter(([k]) => fieldKeys.includes(k))
      .map(([key, val]) => {
        const f = ALL_FIELDS.find(f => f.key === key);
        return `- ${f?.label || key}: ${val}`;
      }).join('\n');

    const lockedSection = lockedLines
      ? `\nEstablished character details (LOCKED — use these to inform your new values, keep everything consistent):\n${lockedLines}\n`
      : '';

    const previousSection = previousLines
      ? `\nPrevious values for fields you are replacing (do NOT repeat these — generate meaningfully different content):\n${previousLines}\n`
      : '';

    if (isMinor) {
      return `You are generating a random fictional character for a young writer. Randomisation seed: ${seed}.

Constraints for this character:
- Age: around ${ageHint}
- Their world involves: ${worldHint}
- Emotional tone: ${toneHint}
- Comes from: ${originHint}
${genreLine}${lockedSection}${previousSection}
Rules:
- Keep every field to the shortest possible phrase — a label, not an explanation
- Profession or role: just a simple title (e.g. "Hockey player", "Baker", "Coder")
- All other fields: one short phrase or sentence — no elaboration
- Be imaginative — avoid the obvious or the first thing that comes to mind
- Keep everything age-appropriate and positive in spirit
- If locked details are provided, make sure new fields feel like they belong to the same character

Fields to generate:
${fieldList}

Respond ONLY with a valid JSON object using exactly these keys. No markdown, no explanation.`;
    }

    return `You are generating a random fictional character. Randomisation seed: ${seed}.

Constraints for this character:
- Age: around ${ageHint}
- Their world: ${worldHint}
- Emotional register: ${toneHint}
- Comes from: ${originHint}
${genreLine}${lockedSection}${previousSection}
Rules:
- Keep every field to the shortest possible phrase — a label, not an explanation
- Profession: just the job title or role, nothing more — make it appropriate for the genre and world context
- For Historical Fiction: strongly favour ordinary working people (farmers, soldiers, merchants, midwives, sailors, servants, craftspeople) over royalty or nobility — avoid kings, queens, lords, ladies unless truly compelling
- Background: one sentence maximum, no sub-clauses
- All other fields: a short phrase or single sentence — no elaboration
- Be surprising and specific — avoid the obvious or the first thing that comes to mind
- Do NOT use niche sports, competitive hobbies, or obscure professions as the profession field
- If locked details are provided, make sure new fields feel like they belong to the same person

Fields to generate:
${fieldList}

Respond ONLY with a valid JSON object using exactly these keys. No markdown, no explanation.`;
  };

  const buildSummaryPrompt = (charValues) => {
    const details = Object.entries(charValues)
      .map(([key, val]) => {
        const f = ALL_FIELDS.find(f => f.key === key);
        return `${f?.label || key}: ${val}`;
      }).join('\n');

    const hasName = charValues.name;
    const nameInstruction = !hasName
      ? ' Do not invent or use a name — refer to them only as "they" or "them".'
      : '';
    const genre = selectedGenre !== 'random' ? selectedGenre : null;
    const eraContext = genre === 'Historical Fiction' ? ` Set in ${historicalEra}.`
      : genre === 'Sci-Fi' ? ` Setting: ${scifiSetting}.`
      : '';
    const genreInstruction = genre
      ? ` Write with an awareness that this is a ${genre} character.${eraContext} Let the genre inform tone and word choice without being heavy-handed about it.`
      : '';

    if (isMinor) {
      return `Given this character:\n\n${details}\n\nWrite 2 sentences introducing this character — who they are and what makes them interesting. Write in third person. Keep it simple and vivid, like the opening of a story.${genreInstruction}${nameInstruction}`;
    }

    return `Given this character:\n\n${details}\n\nWrite a short paragraph (2–3 sentences) capturing who this person is and what makes them compelling. Write in third person. Be specific — synthesise the details into a portrait, don't list them.${genreInstruction}${nameInstruction}`;
  };

    const applyPreset = (presetKey, skipPresetState = false) => {
    const preset = PRESETS.find(p => p.key === presetKey);
    if (!preset) return;
    if (!skipPresetState) setActivePreset(presetKey);
    setLockedFields(new Set());
    setValues({});
    setSummary('');
    if (preset.fields === null) {
      setActiveFields(new Set(availableFields.map(f => f.key)));
    } else {
      // Filter preset fields to only those available to this user
      const allowed = preset.fields.filter(k => availableFields.some(f => f.key === k));
      setActiveFields(new Set(allowed));
    }
  };

  const generate = useCallback(async () => {
    if (!isUnlimited && usageCount >= FREE_LIMIT) {
      setError(`Free accounts are limited to ${FREE_LIMIT} prompts per day. Upgrade to premium for unlimited generations.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSummary('');

    // Fields to generate = active & not locked
    const fieldsToGenerate = [...activeFields].filter(k => !lockedFields.has(k));

    if (fieldsToGenerate.length === 0) {
      setError('All active fields are locked. Unlock at least one field to generate new values.');
      setLoading(false);
      return;
    }

    try {
      // Step 1: Generate field values
      // Build locked context (established values to inform generation)
      const lockedContext = {};
      [...lockedFields].forEach(k => { if (valuesRef.current[k]) lockedContext[k] = valuesRef.current[k]; });
      // Build previous values (for anti-repeat instruction)
      const previousValues = {};
      fieldsToGenerate.forEach(k => { if (valuesRef.current[k]) previousValues[k] = valuesRef.current[k]; });

      const fieldRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: buildPrompt(fieldsToGenerate, lockedContext, previousValues) }],
        }),
      });
      const fieldData = await fieldRes.json();
      const fieldText = fieldData.content.map(b => b.text || '').join('');
      const clean = fieldText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      const newValues = { ...valuesRef.current, ...parsed };
      setValues(newValues);

      // Step 2: Generate summary from all active fields
      const summaryValues = {};
      [...activeFields].forEach(k => {
        if (newValues[k]) summaryValues[k] = newValues[k];
      });

      const summaryRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: buildSummaryPrompt(summaryValues) }],
        }),
      });
      const summaryData = await summaryRes.json();
      const summaryText = summaryData.content.map(b => b.text || '').join('').trim();
      setSummary(summaryText);

      await trackUsage();

      // Badge check
      const badgeRes = await fetch('/api/check-badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const badgeData = await badgeRes.json();
      if (badgeData.newlyEarned?.length > 0) {
        setNewBadges(badgeData.newlyEarned);
        playBadgeCue();
      } else {
        playAudioCue(false);
      }
    } catch {
      setError('Something went wrong generating the character. Please try again.');
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFields, lockedFields, values, usageCount, isUnlimited, selectedGenre, historicalEra, scifiSetting]);

  const refreshSingleField = async (key) => {
    if (!isUnlimited && usageCount >= FREE_LIMIT) {
      setError(`Daily limit reached. Come back tomorrow or upgrade to premium.`);
      return;
    }
    setRefreshingField(key);
    setError(null);
    try {
      // Build locked context from all other active fields that have values
      const lockedContext = {};
      [...activeFields].forEach(k => {
        if (k !== key && values[k]) lockedContext[k] = values[k];
      });
      const previousValues = values[key] ? { [key]: values[key] } : {};

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 200,
          messages: [{ role: 'user', content: buildPrompt([key], lockedContext, previousValues) }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const newValues = { ...values, [key]: parsed[key] };
      setValues(newValues);

      // Regenerate summary if we have enough fields
      const activeWithValues = [...activeFields].filter(k => newValues[k]);
      if (activeWithValues.length >= 2) {
        const summaryValues = {};
        activeWithValues.forEach(k => { summaryValues[k] = newValues[k]; });
        const sRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 400,
            messages: [{ role: 'user', content: buildSummaryPrompt(summaryValues) }],
          }),
        });
        const sData = await sRes.json();
        setSummary(sData.content.map(b => b.text || '').join('').trim());
      }
      playAudioCue(true);
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setRefreshingField(null);
  };

  const toggleLock = (key) => {
    setLockedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const deselect = (key) => {
    setActivePreset('custom');
    setActiveFields(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setLockedFields(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const reselect = (key) => {
    setActivePreset('custom');
    setActiveFields(prev => new Set([...prev, key]));
  };

  const copySheet = () => {
    const lines = [...activeFields].map(key => {
      const f = availableFields.find(f => f.key === key);
      return `${f.label.toUpperCase()}: ${values[key] || '—'}`;
    });
    const text = lines.join('\n') + (summary ? `\n\n---\n${summary}` : '');
    navigator.clipboard.writeText(text);
    setCopiedSheet(true);
    setTimeout(() => setCopiedSheet(false), 1800);
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 1800);
  };

  const saveCharacter = async () => {
    if (!canSave) return;
    setSavingId('saving');
    const characterData = {};
    [...activeFields].forEach(k => {
      if (values[k]) characterData[k] = values[k];
    });
    const insertPayload = {
      user_id: user.id,
      character_data: characterData,
      genre: selectedGenre !== 'random' ? selectedGenre : null,
    };
    // Only include summary if it exists — avoids column errors if summary col is missing
    if (summary) insertPayload.summary = summary;

    const { error: saveError } = await supabase.from('saved_characters').insert(insertPayload);
    if (saveError) {
      console.error('Save error:', saveError);
      setError(`Couldn't save character: ${saveError.message}`);
      setSavingId(null);
      return;
    }
    setSavingId('saved');
    if (canSave) fetchSavedCharacters();
    const badgeRes = await fetch('/api/check-badges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const badgeData = await badgeRes.json();
    if (badgeData.newlyEarned?.length > 0) {
      setNewBadges(badgeData.newlyEarned);
      playBadgeCue();
    } else {
      playAudioCue(true);
    }
    setTimeout(() => setSavingId(null), 2000);
  };

  const deleteCharacter = async (id) => {
    await supabase.from('saved_characters').delete().eq('id', id);
    setSavedCharacters(prev => prev.filter(c => c.id !== id));
  };

  const hasValues = Object.keys(values).length > 0;

  return (
    <div style={{ minHeight: '100vh', background: B.sand, backgroundImage: `radial-gradient(ellipse at 5% 5%, rgba(91,158,201,0.13) 0%, transparent 45%), radial-gradient(ellipse at 95% 90%, rgba(212,132,90,0.11) 0%, transparent 45%)`, fontFamily: "'DM Sans', sans-serif", color: B.ink, padding: '0 1.25rem 5rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; margin: 0; }
      `}</style>

      {/* Nav */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.25rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${B.sandDeep}`, marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ color: B.inkMid, textDecoration: 'none', fontSize: '0.85rem' }}>← Dashboard</Link>
        <Link to="/dashboard" style={{ textDecoration: 'none', display: 'block' }}>
          <FictiflyLogo />
        </Link>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <svg width="52" height="24" viewBox="0 0 52 24" fill="none" style={{ marginBottom: '1.2rem' }}>
            <circle cx="14" cy="10" r="6" stroke={B.seaMid} strokeWidth="2.2" fill="none"/>
            <path d="M2 22 C2 16, 26 16, 26 22" stroke={B.seaMid} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <circle cx="36" cy="10" r="5" stroke={B.terra} strokeWidth="2" fill="none" opacity="0.7"/>
            <path d="M24 22 C24 17, 46 17, 46 22" stroke={B.terra} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
          </svg>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: B.terra, marginBottom: '0.8rem' }}>Character Generator</div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(2.2rem, 6.5vw, 3.4rem)', fontWeight: 700, color: B.ink, lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Build a person,<br /><span style={{ color: B.seaDeep, fontStyle: 'italic', fontWeight: 500 }}>layer by layer.</span>
          </h1>
          <p style={{ color: B.inkMid, fontSize: '0.97rem', lineHeight: 1.65, maxWidth: 420, margin: '0 auto 1.5rem' }}>
            Choose your fields, generate a character, lock what you love, and regenerate the rest.
          </p>
          {!isUnlimited && (
            <div style={{ display: 'inline-block', background: B.sandMid, borderRadius: '8px', padding: '0.4rem 0.9rem', fontSize: '0.78rem', color: B.inkMid }}>
              {usageCount}/{FREE_LIMIT} prompts used today
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'inline-flex', background: B.sandMid, borderRadius: '12px', padding: '4px', gap: '2px', marginBottom: '1.75rem', width: '100%' }}>
          {['generate', canSave ? 'saved' : null].filter(Boolean).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? B.white : 'transparent', border: 'none', borderRadius: '9px', color: tab === t ? B.ink : B.inkLight, fontFamily: "'DM Sans', sans-serif", fontWeight: tab === t ? 600 : 400, fontSize: '0.85rem', padding: '0.5rem 1.35rem', transition: 'all 0.18s', boxShadow: tab === t ? '0 1px 4px rgba(58,50,38,0.1)' : 'none', cursor: 'pointer' }}>
              {t === 'generate' ? 'Generate' : `Saved${savedCharacters.length > 0 ? ` (${savedCharacters.length})` : ''}`}
            </button>
          ))}
        </div>

        {/* ── GENERATE TAB ── */}
        {tab === 'generate' && (
          <div>
            {/* Field selector panel */}
            <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.5rem 1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
              <div style={{ marginBottom: '1.1rem' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem', color: B.ink, marginBottom: '0.65rem' }}>Field set</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {PRESETS.map(p => {
                    const isActive = activePreset === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => applyPreset(p.key)}
                        style={{
                          padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer',
                          border: `1.5px solid ${isActive ? B.seaDeep : B.sandDeep}`,
                          background: isActive ? B.seaDeep : 'transparent',
                          color: isActive ? B.white : B.inkMid,
                          fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                {PRESETS.find(p => p.key === activePreset) && (
                  <div style={{ fontSize: '0.73rem', color: B.inkLight, marginTop: '0.5rem' }}>
                    {PRESETS.find(p => p.key === activePreset).desc} — toggle individual fields below
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {availableFields.map(f => {
                  const isActive = activeFields.has(f.key);
                  return (
                    <button
                      key={f.key}
                      onClick={() => isActive ? deselect(f.key) : reselect(f.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.7rem', borderRadius: '20px', cursor: 'pointer',
                        border: `1.5px solid ${isActive ? B.seaMid : B.sandDeep}`,
                        background: isActive ? '#EAF4FB' : 'transparent',
                        color: isActive ? B.seaDeep : B.inkLight,
                        fontFamily: "'DM Sans', sans-serif", fontSize: '0.78rem', fontWeight: 500,
                        transition: 'all 0.15s',
                      }}
                    >
                        <span>{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.25rem 1.75rem', marginBottom: '1.25rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
              {/* Genre row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: B.ink, minWidth: 44 }}>Genre</div>
                <button
                  onClick={() => setSelectedGenre('random')}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer',
                    border: `1.5px solid ${selectedGenre === 'random' ? B.seaDeep : B.sandDeep}`,
                    background: selectedGenre === 'random' ? B.seaDeep : 'transparent',
                    color: selectedGenre === 'random' ? B.white : B.inkMid,
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s',
                  }}
                >Random</button>
                <div style={{ position: 'relative' }}>
                  <select
                    value={selectedGenre !== 'random' ? selectedGenre : ''}
                    onChange={e => { if (e.target.value) setSelectedGenre(e.target.value); }}
                    style={{
                      height: 36, padding: '0 1.8rem 0 0.8rem', borderRadius: '8px',
                      border: `1.5px solid ${selectedGenre !== 'random' ? B.terra : B.sandDeep}`,
                      background: selectedGenre !== 'random' ? B.terra : 'transparent',
                      color: selectedGenre !== 'random' ? B.white : B.inkMid,
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 500,
                      cursor: 'pointer', outline: 'none', appearance: 'none',
                    }}
                  >
                    <option value="">Pick a genre…</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: '0.55rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.55rem', color: selectedGenre !== 'random' ? B.white : B.inkLight }}>▼</span>
                </div>
                {selectedGenre !== 'random' && (
                  <div style={{ fontSize: '0.73rem', color: B.inkLight }}>
                    Characters will be shaped by <strong style={{ color: B.ink }}>{selectedGenre}</strong> conventions
                  </div>
                )}
              </div>

              {/* Historical era chip */}
              {selectedGenre === 'Historical Fiction' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: B.ink, minWidth: 44 }}>Era</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#EAF4FB', border: `1.5px solid ${B.seaMid}`, borderRadius: '8px', padding: '0.35rem 0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 500, color: B.seaDeep }}>
                    {historicalEra}
                  </div>
                  <button
                    onClick={() => setHistoricalEra(HISTORICAL_ERAS[Math.floor(Math.random() * HISTORICAL_ERAS.length)])}
                    title="Pick a different era randomly"
                    style={{ width: 28, height: 28, borderRadius: '7px', border: `1px solid ${B.sandDeep}`, background: 'transparent', color: B.inkLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}
                  >↻</button>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={e => { if (e.target.value) setHistoricalEra(e.target.value); }}
                      style={{ height: 28, padding: '0 1.6rem 0 0.7rem', borderRadius: '7px', border: `1px solid ${B.sandDeep}`, background: 'transparent', color: B.inkMid, fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                    >
                      <option value="">Choose era…</option>
                      {HISTORICAL_ERAS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: '0.45rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.5rem', color: B.inkLight }}>▼</span>
                  </div>
                </div>
              )}

              {/* Sci-Fi setting chip */}
              {selectedGenre === 'Sci-Fi' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: B.ink, minWidth: 44 }}>Setting</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#EAF4FB', border: `1.5px solid ${B.seaMid}`, borderRadius: '8px', padding: '0.35rem 0.75rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem', fontWeight: 500, color: B.seaDeep }}>
                    {scifiSetting}
                  </div>
                  <button
                    onClick={() => setScifiSetting(SCIFI_SETTINGS[Math.floor(Math.random() * SCIFI_SETTINGS.length)])}
                    title="Pick a different setting randomly"
                    style={{ width: 28, height: 28, borderRadius: '7px', border: `1px solid ${B.sandDeep}`, background: 'transparent', color: B.inkLight, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}
                  >↻</button>
                  <div style={{ position: 'relative' }}>
                    <select
                      value=""
                      onChange={e => { if (e.target.value) setScifiSetting(e.target.value); }}
                      style={{ height: 28, padding: '0 1.6rem 0 0.7rem', borderRadius: '7px', border: `1px solid ${B.sandDeep}`, background: 'transparent', color: B.inkMid, fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', cursor: 'pointer', outline: 'none', appearance: 'none' }}
                    >
                      <option value="">Choose setting…</option>
                      {SCIFI_SETTINGS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: '0.45rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.5rem', color: B.inkLight }}>▼</span>
                  </div>
                </div>
              )}
              {/* Bottom row — lock count, usage, generate button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: B.inkMid }}>
                  {lockedFields.size > 0
                    ? <span><strong>{lockedFields.size}</strong> field{lockedFields.size !== 1 ? 's' : ''} locked — will stay on regenerate</span>
                    : <span style={{ color: B.inkLight }}>Lock fields you want to keep before regenerating</span>
                  }
                </div>
                {!isUnlimited && (
                  <div style={{ fontSize: '0.78rem', color: usageCount >= FREE_LIMIT ? B.terraDark : B.inkLight, background: usageCount >= FREE_LIMIT ? '#FDF0E8' : B.sandMid, borderRadius: '8px', padding: '0.35rem 0.8rem' }}>
                    {usageCount >= FREE_LIMIT ? 'Daily limit reached. Come back tomorrow!' : `${FREE_LIMIT - usageCount} of ${FREE_LIMIT} remaining today`}
                  </div>
                )}
                <button
                  onClick={generate}
                  disabled={loading || activeFields.size === 0}
                  style={{ background: loading || activeFields.size === 0 ? B.sandDeep : B.seaDeep, color: B.white, border: 'none', borderRadius: '10px', padding: '0.65rem 1.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.88rem', cursor: loading || activeFields.size === 0 ? 'not-allowed' : 'pointer', transition: 'background 0.18s', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = B.seaMid; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = B.seaDeep; }}
                >
                  {loading
                    ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', animation: 'spin 0.8s linear infinite' }} />Generating…</>
                    : hasValues ? 'Regenerate →' : 'Generate character →'
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FDF0E8', border: `1px solid ${B.terra}`, borderRadius: '10px', color: B.terraDark, padding: '0.8rem 1.1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {/* Character Sheet */}
            {hasValues && (
              <div style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.75rem', boxShadow: '0 2px 12px rgba(58,50,38,0.06)', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 500, color: B.ink }}>
                    {values.name ? values.name : 'Character Sheet'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={copySheet}
                      style={{ background: copiedSheet ? B.seaMid : 'transparent', border: `1px solid ${copiedSheet ? B.seaMid : B.sandDeep}`, color: copiedSheet ? B.white : B.inkMid, borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s' }}
                    >
                      {copiedSheet ? '✓ Copied' : 'Copy sheet'}
                    </button>
                    {canSave && (
                      <button
                        onClick={saveCharacter}
                        disabled={savingId === 'saving'}
                        style={{ background: savingId === 'saved' ? B.sandMid : 'transparent', border: `1px solid ${savingId === 'saved' ? B.sandDeep : B.sandDeep}`, color: savingId === 'saved' ? B.inkMid : B.inkMid, borderRadius: '8px', padding: '0.35rem 0.85rem', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: savingId === 'saving' ? 'not-allowed' : 'pointer', transition: 'all 0.18s' }}
                      >
                        {savingId === 'saved' ? '✓ Saved!' : savingId === 'saving' ? 'Saving…' : '☆ Save character'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Field rows — active fields only */}
                <div>
                  {availableFields.filter(f => activeFields.has(f.key)).map(f => (
                    <FieldRow
                      key={f.key}
                      field={f}
                      value={values[f.key]}
                      locked={lockedFields.has(f.key)}
                      onToggleLock={toggleLock}
                      onDeselect={deselect}
                      onRefresh={refreshSingleField}
                      refreshing={refreshingField === f.key}
                    />
                  ))}
                </div>

                {/* Summary */}
                {summary && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <Divider />
                    <div style={{ marginTop: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Label>Character Summary</Label>
                        <button
                          onClick={copySummary}
                          style={{ background: copiedSummary ? B.seaMid : 'transparent', border: `1px solid ${copiedSummary ? B.seaMid : B.sandDeep}`, color: copiedSummary ? B.white : B.inkMid, borderRadius: '8px', padding: '0.3rem 0.75rem', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, cursor: 'pointer', transition: 'all 0.18s' }}
                        >
                          {copiedSummary ? '✓ Copied' : 'Copy summary'}
                        </button>
                      </div>
                      <p style={{ fontFamily: "'Fraunces', serif", fontSize: '1.02rem', fontWeight: 400, fontStyle: 'italic', color: B.inkMid, lineHeight: 1.75 }}>
                        {summary}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!hasValues && !loading && (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: B.inkLight, fontSize: '0.93rem', fontStyle: 'italic' }}>
                Select your fields and press generate to build a character.
              </div>
            )}
          </div>
        )}

        {/* ── SAVED TAB ── */}
        {tab === 'saved' && (
          <div>
            {loadingSaved ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: B.inkLight, fontSize: '0.93rem', fontStyle: 'italic' }}>Loading saved characters…</div>
            ) : savedCharacters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 0', color: B.inkLight, fontSize: '0.93rem', fontStyle: 'italic' }}>No saved characters yet — generate one and press Save!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedCharacters.map(c => (
                  <div key={c.id} style={{ background: B.white, border: `1px solid ${B.sandDeep}`, borderRadius: '16px', padding: '1.5rem 1.75rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem' }}>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.05rem', fontWeight: 500, color: B.ink }}>
                        {c.character_data?.name || 'Unnamed Character'}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", color: B.inkLight }}>
                          {new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <button
                          onClick={() => deleteCharacter(c.id)}
                          style={{ background: 'transparent', border: `1px solid ${B.sandDeep}`, color: B.inkLight, borderRadius: '7px', padding: '0.2rem 0.55rem', fontSize: '0.72rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.color = B.terraDark; e.currentTarget.style.borderColor = B.terra; }}
                          onMouseLeave={e => { e.currentTarget.style.color = B.inkLight; e.currentTarget.style.borderColor = B.sandDeep; }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    {/* Quick summary of fields */}
                    <div>
                      {availableFields.filter(f => c.character_data?.[f.key]).map(f => (
                        <div key={f.key} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: `1px solid ${B.sandMid}` }}>

                          <div>
                            <Label>{f.label}</Label>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '0.95rem', color: B.ink, marginTop: '0.1rem' }}>{c.character_data[f.key]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {c.summary && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${B.sandMid}` }}>
                        <Label>Summary</Label>
                        <p style={{ fontFamily: "'Fraunces', serif", fontSize: '0.93rem', fontStyle: 'italic', color: B.inkMid, lineHeight: 1.7, marginTop: '0.35rem' }}>{c.summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {newBadges && newBadges.length > 0 && (
  <BadgeModal
    badges={newBadges}
    onDismiss={() => setNewBadges(prev => prev.slice(1))}
  />
)}
    </div>
  );
}