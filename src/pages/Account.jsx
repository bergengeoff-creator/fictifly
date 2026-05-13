export default function Account({ profile, isPremium, isTeacher }) {
  // Determine tier label and limits based on account type
  const getTierInfo = () => {
    if (isTeacher) {
      return {
        tier: 'Educator',
        tierColor: '#2E6DA4',
        description: 'Full access to all generators for your students.',
        features: [
          { label: 'Generator requests', value: 'Unlimited' },
          { label: 'Classes', value: '1 class' },
          { label: 'Students per class', value: 'Up to 30' },
          { label: 'Student accounts', value: 'Included' },
        ],
        upgrade: {
          text: 'Upgrade for multiple classes',
          subtext: 'Manage up to 5 classes with unlimited students. School & district discounts available.',
          cta: 'View pricing',
          ctaEmail: true,
        },
      };
    }

    if (isPremium) {
      return {
        tier: 'Premium',
        tierColor: '#D4845A',
        description: 'You have unlimited access to all Fictifly features.',
        features: [
          { label: 'Generator requests', value: 'Unlimited' },
          { label: 'Daily challenges', value: 'All types' },
          { label: 'Story submission', value: 'Full text' },
          { label: 'Writer Directory', value: 'Access & appear' },
          { label: 'Community upvotes', value: 'Coming soon' },
          { label: 'Early access', value: 'New generators' },
        ],
        trial: profile?.premium_expires_at ? {
          expiresAt: new Date(profile.premium_expires_at),
          isPaid: profile?.is_premium,
        } : null,
      };
    }

    return {
      tier: 'Free',
      tierColor: '#6B5D4E',
      description: 'You have access to core writing tools.',
      features: [
        { label: 'Generator requests', value: '6 per day' },
        { label: 'Daily challenges', value: 'Standard prompts' },
        { label: 'Story submission', value: 'To assignments only' },
        { label: 'Writer Directory', value: 'Coming soon' },
      ],
      upgrade: {
        text: 'Upgrade to Premium',
        subtext: 'Unlimited prompts, full story submission, and access to the Writer Directory.',
        cta: 'Upgrade now',
        ctaEmail: true,
      },
    };
  };

  const tierInfo = getTierInfo();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: tierInfo.tierColor, marginBottom: '0.6rem' }}>
        Account
      </div>

      {/* Your Plan Card */}
      <div style={{ background: '#FFFCF8', border: `2px solid ${tierInfo.tierColor}`, borderRadius: '14px', padding: '2rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 700, color: tierInfo.tierColor }}>
            {tierInfo.tier}
          </span>
          {tierInfo.trial && !tierInfo.trial.isPaid && (
            <span style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#FDF5E8', color: '#9A6830', border: `1px solid ${tierInfo.tierColor}`, borderRadius: '20px', padding: '0.2rem 0.6rem' }}>
              Trial
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.95rem', color: '#6B5D4E', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {tierInfo.description}
        </p>

        {/* Trial expiry info */}
        {tierInfo.trial && (
          <div style={{ background: '#FDF5E8', border: '1px solid #C8A060', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#9A6830' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
              Trial expires{' '}
              {tierInfo.trial.expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#9A6830' }}>
              {Math.ceil((tierInfo.trial.expiresAt - new Date()) / (1000 * 60 * 60 * 24))} days remaining
            </div>
          </div>
        )}

        {/* Features grid */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.75rem' }}>
            What's included
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            {tierInfo.features.map(f => (
              <div key={f.label} style={{ background: '#F5EFE6', borderRadius: '10px', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A8878', marginBottom: '0.25rem' }}>
                  {f.label}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#3A3226' }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade CTA */}
        {tierInfo.upgrade && (
          <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '10px', padding: '1rem', marginBottom: '0' }}>
            <div style={{ fontWeight: 600, color: '#3A3226', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
              {tierInfo.upgrade.text}
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6B5D4E', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              {tierInfo.upgrade.subtext}
            </p>
            <a
              href={tierInfo.upgrade.ctaEmail ? "mailto:fictifly@gmail.com?subject=Premium Upgrade&body=Hi! I'm interested in upgrading to Premium." : '#'}
              style={{
                display: 'inline-block',
                background: tierInfo.tierColor,
                color: '#FFFCF8',
                borderRadius: '8px',
                padding: '0.5rem 1.1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {tierInfo.upgrade.cta} →
            </a>
          </div>
        )}
      </div>

      {/* Support Fictifly section */}
      <div style={{ background: '#FFFCF8', border: '1px solid #D9C9B0', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(58,50,38,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3A3226', margin: '0 0 0.5rem 0' }}>
          Support Fictifly
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#6B5D4E', lineHeight: 1.6, marginBottom: '1rem' }}>
          Your donation helps us offer free and discounted access to underfunded schools and students who need it most.
        </p>
        <a
          href="mailto:fictifly@gmail.com?subject=I'd like to donate to Fictifly&body=Hi! I'm interested in supporting Fictifly and helping students get free access."
          style={{
            display: 'inline-block',
            background: '#D4845A',
            color: '#FFFCF8',
            borderRadius: '8px',
            padding: '0.5rem 1.1rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Make a donation →
        </a>
      </div>
    </div>
  );
}