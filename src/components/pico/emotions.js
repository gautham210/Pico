const idleImg = '/emotions/idle.png';
const curiousImg = '/emotions/curious.png';
const excitedImg = '/emotions/excited.png';
const proudImg = '/emotions/proud.png';
const worriedImg = '/emotions/worried.png';
const lostImg = '/emotions/lost.png';
const sleepyImg = '/emotions/sleepy.png';
const convoyImg = '/emotions/convoy.png';

export const PICO_MOODS = {
  idle: {
    id: 'idle',
    label: 'Observant & Relaxed',
    image: idleImg,
    defaultQuote: 'Everywhere you\'ve been. Everywhere you\'re going.'
  },
  curious: {
    id: 'curious',
    label: 'Curious & Inquisitive',
    image: curiousImg,
    defaultQuote: 'Okay, this place looks interesting. Let\'s investigate!'
  },
  excited: {
    id: 'excited',
    label: 'Energetic & Eager',
    image: excitedImg,
    defaultQuote: 'Great taste! That one belongs in our travel plan.'
  },
  happy: {
    id: 'happy',
    label: 'Warm & Welcoming',
    image: curiousImg,
    defaultQuote: 'One step closer to our adventure!'
  },
  thinking: {
    id: 'thinking',
    label: 'Reflective & Calculating',
    image: idleImg,
    defaultQuote: 'Crunching travel times and budget trade-offs…'
  },
  planning: {
    id: 'planning',
    label: 'Purposeful & Strategic',
    image: convoyImg,
    defaultQuote: 'Putting the daily stops and routes into order.'
  },
  proud: {
    id: 'proud',
    label: 'Accomplished & Confident',
    image: proudImg,
    defaultQuote: 'Another milestone reached! You\'re an explorer.'
  },
  worried: {
    id: 'worried',
    label: 'Cautionary & Attentive',
    image: worriedImg,
    defaultQuote: 'Careful! That might push our budget envelope.'
  },
  disappointed: {
    id: 'disappointed',
    label: 'Subtly Baffled',
    image: worriedImg,
    defaultQuote: 'Couldn\'t quite reach that service. Let\'s try another route.'
  },
  encouraging: {
    id: 'encouraging',
    label: 'Supportive Companion',
    image: curiousImg,
    defaultQuote: 'No stress — travel at your own pace.'
  },
  celebrating: {
    id: 'celebrating',
    label: 'Full Celebration',
    image: excitedImg,
    defaultQuote: 'Destination Stamp unlocked! Pack your bags!'
  },
  sleepy: {
    id: 'sleepy',
    label: 'Resting & Recharging',
    image: sleepyImg,
    defaultQuote: 'Quiet hours. Rest up for tomorrow\'s journey.'
  },
  lost: {
    id: 'lost',
    label: 'Uncertain & Seeking Direction',
    image: lostImg,
    defaultQuote: 'Hmm, signal is faint or route deviated. Let\'s regroup!'
  }
};

/**
 * Resolves an active mascot mood based on real application events & store state.
 */
export function resolveMascotMood({
  activeRoute = 'discover',
  likedPlacesCount = 0,
  budgetRemaining = 20000,
  budgetEnvelope = 20000,
  isDisrupted = false,
  isAiGenerating = false,
  storageError = '',
  hasActiveConvoy = false,
  checklistCompleted = false,
  quietHours = false,
  recentAction = null
}) {
  // 1. Highest priority: Errors and disruptions
  if (storageError) return 'lost';
  if (isDisrupted) return 'worried';

  // 2. Direct user action overrides
  if (recentAction === 'swiped_like') return 'excited';
  if (recentAction === 'swiped_pass') return 'curious';
  if (recentAction === 'stamp_unlocked') return 'celebrating';
  if (recentAction === 'checklist_done') return 'proud';
  if (recentAction === 'budget_warning') return 'worried';

  // 3. Asynchronous states
  if (isAiGenerating) return 'thinking';
  if (hasActiveConvoy) return 'planning';

  // 4. Budget constraints
  if (budgetEnvelope > 0 && budgetRemaining < budgetEnvelope * 0.15) {
    return 'worried';
  }

  // 5. Route-based contextual states
  if (activeRoute === 'discover') return 'curious';
  if (activeRoute === 'plan') return likedPlacesCount ? 'planning' : 'curious';
  if (activeRoute === 'diary' && likedPlacesCount > 0) return 'proud';
  if (activeRoute === 'dna') return 'proud';
  if (activeRoute === 'ride') return 'planning';
  if (activeRoute === 'home') {
    if (likedPlacesCount === 0 && quietHours) return 'sleepy';
    if (likedPlacesCount > 0) return 'happy';
  }

  if (checklistCompleted) return 'celebrating';

  return 'idle';
}
