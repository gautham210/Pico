import assert from 'node:assert/strict';
import { PICO_MOODS, resolveMascotMood } from '../src/components/pico/emotions.js';
import { useStore } from '../src/lib/store.js';

console.log('--- Testing Pico 2.1 Mascot Emotions & React Bits Interaction Layer ---');

// 1. Verify all 13 required mascot moods exist with proper properties
const requiredMoods = [
  'idle', 'curious', 'excited', 'happy', 'thinking', 'planning',
  'proud', 'worried', 'disappointed', 'encouraging', 'celebrating',
  'sleepy', 'lost'
];

for (const mood of requiredMoods) {
  assert.ok(PICO_MOODS[mood], `Mood "${mood}" must exist in PICO_MOODS`);
  assert.ok(PICO_MOODS[mood].label, `Mood "${mood}" must have a readable label`);
  assert.ok(PICO_MOODS[mood].defaultQuote, `Mood "${mood}" must have a contextual quote`);
  assert.ok(PICO_MOODS[mood].image, `Mood "${mood}" must map to an Arctic Tern illustration`);
}
console.log('PASS: All 13 mascot moods defined with Arctic Tern asset bindings.');

// 2. Test event-to-mood state resolution mapping
// Event: storage error
assert.equal(
  resolveMascotMood({ storageError: 'Quota exceeded' }),
  'lost',
  'Storage error must map to lost mood'
);

// Event: disruption
assert.equal(
  resolveMascotMood({ isDisrupted: true }),
  'worried',
  'Active disruption must map to worried mood'
);

// Event: swiped like
assert.equal(
  resolveMascotMood({ recentAction: 'swiped_like' }),
  'excited',
  'Swiping like must trigger excited mood'
);

// Event: swiped pass
assert.equal(
  resolveMascotMood({ recentAction: 'swiped_pass' }),
  'curious',
  'Swiping pass must trigger curious mood without guilt-tripping'
);

// Event: stamp unlocked
assert.equal(
  resolveMascotMood({ recentAction: 'stamp_unlocked' }),
  'celebrating',
  'Stamp unlock must trigger celebrating mood'
);

// Event: AI generation running
assert.equal(
  resolveMascotMood({ isAiGenerating: true }),
  'thinking',
  'AI itinerary generation must trigger thinking mood'
);

// Event: active convoy
assert.equal(
  resolveMascotMood({ hasActiveConvoy: true }),
  'planning',
  'Active convoy lobby must trigger planning mood'
);

// Event: budget constrained (< 15% remaining)
assert.equal(
  resolveMascotMood({ budgetEnvelope: 20000, budgetRemaining: 1500 }),
  'worried',
  'Constrained budget must trigger worried mood'
);

// Event: Discover route open
assert.equal(
  resolveMascotMood({ activeRoute: 'discover' }),
  'curious',
  'Discover screen must default to curious mood'
);

// Event: quiet hours with no saved stops
assert.equal(
  resolveMascotMood({ activeRoute: 'home', likedPlacesCount: 0, quietHours: true }),
  'sleepy',
  'Quiet hours at home must map to sleepy mood'
);

// Fallback behavior for unhandled states
assert.equal(
  resolveMascotMood({ activeRoute: 'unknown_route' }),
  'idle',
  'Unknown route must gracefully fall back to idle'
);
console.log('PASS: Contextual event-to-mood mapping and fallback verified.');

// 3. Test Checklist state management & persistence
const store = useStore.getState();
const initialChecklistCount = (store.checklist || []).length;
assert.ok(initialChecklistCount >= 5, 'Checklist should initialize with standard preparation tasks');

// Toggle checklist item
const firstItemId = store.checklist[0].id;
const initialStatus = store.checklist[0].completed;
store.toggleChecklistItem(firstItemId);
assert.equal(
  useStore.getState().checklist.find(i => i.id === firstItemId).completed,
  !initialStatus,
  'toggleChecklistItem should invert task completion'
);

// Add custom checklist item
store.addChecklistItem('Test passport validity');
const updatedChecklist = useStore.getState().checklist;
const addedItem = updatedChecklist.find(i => i.text === 'Test passport validity');
assert.ok(addedItem, 'addChecklistItem should append new item');
assert.equal(addedItem.completed, false, 'New checklist items should start incomplete');

// Remove item
store.removeChecklistItem(addedItem.id);
assert.ok(
  !useStore.getState().checklist.some(i => i.id === addedItem.id),
  'removeChecklistItem should remove item from checklist'
);
console.log('PASS: Trip preparation checklist add/toggle/remove verified.');

// 4. Test Reminder / Bell Toggle state
store.setReminder({ enabled: true, offsetDays: 3 });
assert.equal(useStore.getState().reminders.enabled, true, 'Reminder enabled state should persist');
assert.equal(useStore.getState().reminders.offsetDays, 3, 'Reminder offset days should persist');

store.setReminder({ enabled: false });
assert.equal(useStore.getState().reminders.enabled, false, 'Reminder disabled state should persist');
console.log('PASS: Bell toggle reminder state persistence verified.');

// 5. Test Airplane mode / Squish Switch transport selection
const prevMode = store.mode;
const flightOk = store.setMode('fastest');
assert.ok(flightOk, 'Setting fastest/flight mode should succeed within budget');
assert.equal(useStore.getState().mode, 'fastest', 'Store mode should reflect flight selection');

// Revert mode
store.setMode(prevMode);
assert.equal(useStore.getState().mode, prevMode, 'Store mode should revert properly');
console.log('PASS: Flight transport mode selection and budget calculation verified.');

// 6. Test Public Likes vs Private Saved Places isolation
const testPlaceId = 'test-destination-001';
const initialLikesCount = useStore.getState().publicLikes?.[testPlaceId]?.count ?? 0;

// Toggle public like on
store.togglePublicLike(testPlaceId);
const likedState = useStore.getState().publicLikes[testPlaceId];
assert.equal(likedState.userLiked, true, 'togglePublicLike should set userLiked to true');
assert.equal(likedState.count, initialLikesCount + 1, 'togglePublicLike should increment like count');

// Ensure public like does NOT mutate private saved places
assert.ok(
  !useStore.getState().likedPlaces.some(p => p.id === testPlaceId),
  'Public like must remain isolated from private saved itinerary stops'
);

// Toggle public like off
store.togglePublicLike(testPlaceId);
const unlikedState = useStore.getState().publicLikes[testPlaceId];
assert.equal(unlikedState.userLiked, false, 'togglePublicLike should set userLiked to false');
assert.equal(unlikedState.count, initialLikesCount, 'togglePublicLike should decrement like count back');
console.log('PASS: Public likes decoupled from private saved itinerary places.');

console.log('ALL REACT BITS & MASCOT TESTS PASSED SUCCESSFULLY.');
