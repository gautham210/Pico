import { useState, useEffect } from 'react';
import { useStore } from '../lib/store';
import { supportedCities } from '../../data/city-collections.js';
import { isSupabaseConfigured, submitCommunityGem, fetchCommunityGems } from '../../services/supabase.js';
import Button from './Button';
import { money } from '../lib/provider';

const seedCommunityGems = [
  {
    id: 'gem-seed-1',
    name: 'Loafer’s Corner Cafe Courtyard',
    city: 'Kochi',
    category: 'Cafe',
    description: 'Quiet balcony overlooking Princess Street with vintage posters and homemade passionfruit ginger iced tea.',
    whySpecial: 'Overlooked by large tour groups; peaceful sanctuary for reading and conversation.',
    caveat: 'Only cash and UPI accepted; no card machine.',
    estimatedCost: 280,
    contributorName: 'Aria (Kerala Local)',
    moderationStatus: 'approved'
  },
  {
    id: 'gem-seed-2',
    name: 'Vypin Island Dolphin Lookout Jetty',
    city: 'Kochi',
    category: 'Nature',
    description: 'Quiet stone breakwater near the Vypin ferry terminal where local fishermen point out morning dolphin pods.',
    whySpecial: 'Free accessible public spot where calm water invites early morning sea life.',
    caveat: 'Best early between 6:30 and 8:00 AM before heavy vessel traffic begins.',
    estimatedCost: 10,
    contributorName: 'Rahul T.',
    moderationStatus: 'approved'
  }
];

export default function CommunityGems() {
  const s = useStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [gemsList, setGemsList] = useState(seedCommunityGems);
  const [form, setForm] = useState({
    name: '',
    city: s.userPrefs?.city || 'Kochi',
    category: 'Cultural',
    description: '',
    whySpecial: '',
    caveat: '',
    estimatedCost: '150',
    dietary: 'any'
  });
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchCommunityGems(s.userPrefs?.city || 'Kochi')
        .then(data => {
          if (data && data.length > 0) {
            setGemsList([...data, ...seedCommunityGems]);
          }
        })
        .catch(() => {});
    }
  }, [s.userPrefs?.city]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setFeedback('Please enter a place name and description.');
      return;
    }

    setSubmitting(true);
    setFeedback('');

    const newGem = {
      id: `gem-${Date.now()}`,
      name: form.name.trim(),
      city: form.city,
      category: form.category,
      description: form.description.trim(),
      why_special: form.whySpecial.trim(),
      whySpecial: form.whySpecial.trim(),
      caveat: form.caveat.trim() || 'No caveat supplied by contributor.',
      estimated_cost_inr: Number(form.estimatedCost) || 0,
      estimatedCost: Number(form.estimatedCost) || 0,
      contributor_name: s.profile?.displayName || s.user?.name || 'Curious Traveller',
      contributorName: s.profile?.displayName || s.user?.name || 'Curious Traveller',
      status: 'pending',
      moderationStatus: 'pending'
    };

    try {
      if (isSupabaseConfigured() && s.user?.uid) {
        await submitCommunityGem(s.user.uid, newGem);
      }
      s.addCommunityGem(newGem);
      setGemsList(prev => [newGem, ...prev]);
      setFeedback('🎉 Thank you! Your hidden gem was submitted for community moderation.');
      setTimeout(() => {
        setShowSubmitModal(false);
        setFeedback('');
        setForm({
          name: '',
          city: s.userPrefs?.city || 'Kochi',
          category: 'Cultural',
          description: '',
          whySpecial: '',
          caveat: '',
          estimatedCost: '150',
          dietary: 'any'
        });
      }, 1500);
    } catch (err) {
      setFeedback(`Submitted locally: ${err.message || 'saved on this device.'}`);
      s.addCommunityGem(newGem);
      setGemsList(prev => [newGem, ...prev]);
      setTimeout(() => setShowSubmitModal(false), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel community-gems-section" style={{ marginTop: '16px' }}>
      <div className="row spread" style={{ marginBottom: '6px' }}>
        <div>
          <small className="eyebrow">COMMUNITY CONTRIBUTIONS · LOCAL DISCOVERIES</small>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Community Hidden Gems</h2>
        </div>
        <Button onClick={() => setShowSubmitModal(true)} style={{ fontSize: '12px' }}>
          + Suggest a Gem
        </Button>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' }}>
        Traveller-discovered spots and quiet secrets. Submissions are reviewed for accuracy before verified catalog inclusion.
      </p>

      {/* Gems List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {gemsList.map(gem => {
          const isPending = gem.moderationStatus === 'pending' || gem.status === 'pending';
          return (
            <article
              key={gem.id}
              className="panel gem-card"
              style={{
                margin: 0,
                border: isPending ? '1px dashed var(--border)' : '1px solid var(--border)',
                background: 'var(--card-bg, #fff)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="status-tag status-cached" style={{ fontSize: '11px' }}>{gem.category}</span>
                    <span className={`status-tag ${isPending ? 'status-demo' : 'status-live'}`} style={{ fontSize: '11px' }}>
                      {isPending ? 'UNDER MODERATION' : 'COMMUNITY VERIFIED'}
                    </span>
                    <small style={{ color: 'var(--muted)', fontSize: '12px' }}>{gem.city}</small>
                  </div>
                  <h3 style={{ margin: '4px 0 2px', fontSize: '16px' }}>{gem.name}</h3>
                </div>

                {gem.estimatedCost > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '15px' }}>{money(gem.estimatedCost)}</strong>
                    <small style={{ display: 'block', fontSize: '10px', color: 'var(--muted)' }}>est. cost</small>
                  </div>
                )}
              </div>

              <p style={{ fontSize: '13px', margin: '8px 0 6px', color: 'var(--ink)' }}>{gem.description}</p>

              {gem.whySpecial && (
                <div style={{ fontSize: '12px', margin: '4px 0', color: 'var(--coral)', fontWeight: 500 }}>
                  ✨ <strong>Why special:</strong> {gem.whySpecial}
                </div>
              )}

              {gem.caveat && (
                <details style={{ fontSize: '11px', color: 'var(--muted)', margin: '6px 0' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Contributor Reality Check</summary>
                  <p style={{ margin: '2px 0 0' }}>{gem.caveat}</p>
                </details>
              )}

              <small style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
                Shared by {gem.contributorName || 'Pico Traveller'}
              </small>
            </article>
          );
        })}
      </div>

      {/* Suggest Modal */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg, #FAF7F2)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', boxShadow: '0 -4px 24px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <small className="eyebrow">CONTRIBUTE TO PICO</small>
                <h2 style={{ margin: '2px 0 0', fontSize: '20px' }}>Suggest a Hidden Gem</h2>
              </div>
              <button type="button" onClick={() => setShowSubmitModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {feedback && (
              <div role="status" style={{ padding: '8px 12px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', marginBottom: '12px' }}>
                {feedback}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Place Name
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Hidden Rooftop Pottery Studio"
                  required
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  City
                  <select
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                  >
                    {supportedCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  Category
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                  >
                    {['Cultural', 'Nature', 'Foodie', 'Cafe', 'Beach', 'Hidden Gem'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Description
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What makes this place worth a visit?"
                  rows={3}
                  required
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Why is it special? (Secret tip)
                <input
                  value={form.whySpecial}
                  onChange={e => setForm({ ...form, whySpecial: e.target.value })}
                  placeholder="e.g. Sunset view over the canal without any crowds"
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Reality Check / Caveat
                <input
                  value={form.caveat}
                  onChange={e => setForm({ ...form, caveat: e.target.value })}
                  placeholder="e.g. Closed on Tuesdays, cash only"
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                Estimated Cost (₹)
                <input
                  type="number"
                  value={form.estimatedCost}
                  onChange={e => setForm({ ...form, estimatedCost: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)' }}
                />
              </label>

              <div className="actions" style={{ marginTop: '10px' }}>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit for Moderation'}
                </Button>
                <Button variant="ghost" type="button" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
