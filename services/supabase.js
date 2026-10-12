import { createClient } from '@supabase/supabase-js';

// -------------------------------------------------------------------
// Credential Resolution & Client Initialization
// -------------------------------------------------------------------

function getCredentials() {
  if (typeof window !== 'undefined') {
    const url = import.meta.env?.VITE_SUPABASE_URL;
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http') && key.length > 20 && !url.includes('your-project')) {
      return { url, key };
    }
  } else if (typeof process !== 'undefined') {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http') && key.length > 20 && !url.includes('your-project')) {
      return { url, key };
    }
  }
  return null;
}

const creds = getCredentials();
export const supabase = creds ? createClient(creds.url, creds.key) : null;

export function isSupabaseConfigured() {
  return supabase !== null;
}

// -------------------------------------------------------------------
// Phone Number Normalization (+91 Indian and E.164 formats)
// -------------------------------------------------------------------

export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const cleaned = rawPhone.replace(/[\s\-\(\)]/g, '').trim();

  // If already full international E.164
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // 10-digit Indian mobile number
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  // 11-digit with leading zero (e.g. 09876543210)
  if (/^0[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned.slice(1)}`;
  }

  // Default fallback if numbers present
  if (/^\d{10,13}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return cleaned;
}

// -------------------------------------------------------------------
// Real Authentication Lifecycle
// -------------------------------------------------------------------

export async function signUpWithEmail(email, password, displayName = 'Traveller') {
  if (!supabase) {
    return {
      error: {
        message: 'Supabase cloud service is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, or continue in Local Guest mode.'
      },
      user: null,
      session: null
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { display_name: displayName.trim() }
    }
  });

  if (error) return { error, user: null, session: null };
  return { error: null, user: data.user, session: data.session };
}

export async function signInWithEmail(email, password) {
  if (!supabase) {
    return {
      error: {
        message: 'Supabase cloud service is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, or continue in Local Guest mode.'
      },
      user: null,
      session: null
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error) return { error, user: null, session: null };
  return { error: null, user: data.user, session: data.session };
}

export async function signInWithPhoneOtp(rawPhone) {
  if (!supabase) {
    return {
      error: {
        message: 'Phone OTP requires configured Supabase SMS provider (Twilio or MessageBird). Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to proceed.'
      },
      data: null
    };
  }

  const phone = normalizePhone(rawPhone);
  if (!/^\+[1-9]\d{9,14}$/.test(phone)) {
    return {
      error: { message: 'Invalid phone format. Please enter a 10-digit number or international format (e.g. +91 9876543210).' },
      data: null
    };
  }

  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  return { data, error };
}

export async function verifyPhoneOtp(rawPhone, token) {
  if (!supabase) {
    return {
      error: {
        message: 'Phone OTP requires configured Supabase SMS provider. Cloud service is currently unconfigured.'
      },
      data: null
    };
  }

  const phone = normalizePhone(rawPhone);
  const cleanToken = String(token || '').trim();
  if (!cleanToken || cleanToken.length < 6) {
    return { error: { message: 'Please enter a 6-digit OTP code.' }, data: null };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: cleanToken,
    type: 'sms'
  });
  return { data, error };
}

export async function signInWithGoogle() {
  if (!supabase) {
    return {
      error: {
        message: 'Google OAuth requires configured Supabase project. Add VITE_SUPABASE_URL and configure Google provider in Supabase Dashboard.'
      },
      data: null
    };
  }

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/#profile`
    : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  return { data, error };
}

export async function signOutUser() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function requestPasswordReset(email) {
  if (!supabase) {
    return {
      error: { message: 'Password recovery requires configured cloud service.' },
      data: null
    };
  }

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/#login`
    : undefined;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo
  });
  return { data, error };
}

export async function getActiveSession() {
  if (!supabase) return { session: null, user: null };
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return { session: null, user: null };
    return { session, user: session.user };
  } catch {
    return { session: null, user: null };
  }
}

export function subscribeAuthState(callback) {
  if (!supabase) return () => {};
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription?.unsubscribe();
}

// -------------------------------------------------------------------
// Profile & Preferences Sync
// -------------------------------------------------------------------

export async function fetchProfile(userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function saveProfile(profile) {
  if (!supabase || !profile?.id) return null;
  const { data, error } = await supabase.from('profiles').upsert({
    ...profile,
    updated_at: new Date().toISOString()
  }).select().single();
  return { data, error };
}

export async function fetchPreferences(userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase.from('user_preferences').select('*').eq('user_id', userId).single();
  return data;
}

export async function savePreferences(prefs) {
  if (!supabase || !prefs?.user_id) return null;
  const { data, error } = await supabase.from('user_preferences').upsert({
    ...prefs,
    updated_at: new Date().toISOString()
  }).select().single();
  return { data, error };
}

// -------------------------------------------------------------------
// Trip Rooms & Group Travel Sync (Convoy Engine)
// -------------------------------------------------------------------

export function generateSecureInviteCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusable: 0/O, 1/I/L
  const values = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(values);
  } else {
    // Fallback for environments without Web Crypto (e.g. older Node in tests)
    for (let i = 0; i < length; i++) values[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(values, v => chars[v % chars.length]).join('');
}

export async function createCloudTrip(tripData, userId) {
  if (!supabase || !userId) return null;
  const inviteCode = tripData.invite_code || generateSecureInviteCode(6);
  const payload = {
    ...tripData,
    owner_id: userId,
    invite_code: inviteCode,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('trips').insert(payload).select().single();
  if (error) return { error, data: null };

  // Add owner to trip_members with 'owner' role
  await supabase.from('trip_members').insert({
    trip_id: data.id,
    user_id: userId,
    role: 'owner'
  });

  return { error: null, trip: data, inviteCode };
}

export async function joinCloudTrip(inviteCode, userId) {
  if (!supabase || !userId) return { error: { message: 'Cloud service required.' } };
  const cleanCode = inviteCode.trim().toUpperCase();
  if (cleanCode.length < 4) {
    return { error: { message: 'Invite code must be at least 4 characters.' }, trip: null };
  }

  // Use the secure SECURITY DEFINER stored procedure — it validates auth,
  // checks the code, and inserts a trip_members row atomically.
  const { data, error } = await supabase.rpc('join_trip_by_invite', {
    invite_code_input: cleanCode
  });

  if (error) {
    return {
      error: { message: error.message || 'Could not join trip. Please verify the invite code.' },
      trip: null
    };
  }

  return { error: null, trip: data };
}

export async function fetchUserTrips(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('trips')
    .select('*, itineraries(*), trip_members(*)')
    .order('updated_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function updateLiveLocation(tripId, userId, { lat, lng, heading, speed, accuracy, is_sharing = true }) {
  if (!supabase || !tripId || !userId) return null;
  const { data, error } = await supabase.from('trip_locations').upsert({
    trip_id: tripId,
    user_id: userId,
    lat,
    lng,
    heading,
    speed,
    accuracy,
    is_sharing,
    updated_at: new Date().toISOString()
  }, { onConflict: 'trip_id,user_id' }).select().single();
  return { data, error };
}

export function subscribeTripLocations(tripId, onUpdate) {
  if (!supabase || !tripId) return () => {};

  const channel = supabase
    .channel(`pico-trip-locs-${tripId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trip_locations',
      filter: `trip_id=eq.${tripId}`
    }, payload => {
      onUpdate(payload.new || payload.old);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// -------------------------------------------------------------------
// Public Likes & Social Data
// -------------------------------------------------------------------

export async function fetchPublicLikes(placeId, userId) {
  if (!supabase || !placeId) return { count: 0, userLiked: false };
  try {
    const { count, error } = await supabase
      .from('public_likes')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId);

    if (error) return { count: 0, userLiked: false };

    let userLiked = false;
    if (userId) {
      const { data: userLike } = await supabase
        .from('public_likes')
        .select('id')
        .eq('place_id', placeId)
        .eq('user_id', userId)
        .maybeSingle();
      userLiked = !!userLike;
    }

    return { count: count || 0, userLiked };
  } catch {
    return { count: 0, userLiked: false };
  }
}

export async function toggleCloudLike(placeId, userId) {
  if (!supabase || !placeId || !userId) return null;
  const { data: existing } = await supabase
    .from('public_likes')
    .select('id')
    .eq('place_id', placeId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('public_likes').delete().eq('id', existing.id);
    return { liked: false };
  } else {
    await supabase.from('public_likes').insert({ place_id: placeId, user_id: userId });
    return { liked: true };
  }
}

// -------------------------------------------------------------------
// Leave Trip Room
// -------------------------------------------------------------------

export async function leaveTripRoom(tripId, userId) {
  if (!supabase || !tripId || !userId) return { error: { message: 'Cloud service required.' } };

  // Stop location sharing first
  await supabase.from('trip_locations').delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  // Remove membership
  const { error } = await supabase.from('trip_members').delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);

  return { error };
}

// -------------------------------------------------------------------
// Realtime Trip Members Subscription
// -------------------------------------------------------------------

export function subscribeTripMembers(tripId, onUpdate) {
  if (!supabase || !tripId) return () => {};

  const channel = supabase
    .channel(`pico-trip-members-${tripId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trip_members',
      filter: `trip_id=eq.${tripId}`
    }, payload => {
      onUpdate(payload.eventType, payload.new || payload.old);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// -------------------------------------------------------------------
// Cloud Reviews Persistence
// -------------------------------------------------------------------

export async function fetchUserReviews(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveCloudReview(review, userId) {
  if (!supabase || !userId) return { data: null, error: { message: 'Cloud service required.' } };
  const payload = {
    user_id: userId,
    place_id: review.placeId || review.place_id || '',
    subject_name: review.subjectName || review.subject_name || '',
    ratings: review.ratings || {},
    title: review.title || '',
    body: review.body || '',
    status: review.status || 'draft',
    visibility: review.visibility || 'private',
    updated_at: new Date().toISOString()
  };

  // If review has a cloud UUID, update; otherwise insert
  if (review.cloudId) {
    const { data, error } = await supabase.from('reviews')
      .update(payload)
      .eq('id', review.cloudId)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase.from('reviews').insert(payload).select().single();
  return { data, error };
}

export async function deleteCloudReview(reviewId, userId) {
  if (!supabase || !reviewId || !userId) return { error: { message: 'Cloud service required.' } };
  const { error } = await supabase.from('reviews').delete()
    .eq('id', reviewId)
    .eq('user_id', userId);
  return { error };
}

// -------------------------------------------------------------------
// Cloud Diary Persistence
// -------------------------------------------------------------------

export async function fetchDiaryEntries(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('memory_date', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveDiaryEntry(entry, userId) {
  if (!supabase || !userId) return { data: null, error: { message: 'Cloud service required.' } };
  const payload = {
    user_id: userId,
    place_id: entry.placeId || entry.place_id || null,
    place_name: entry.placeName || entry.place_name || '',
    note: entry.note || '',
    photo_url: entry.photoUrl || entry.photo_url || null,
    rating: entry.rating || 'A',
    memory_date: entry.date ? entry.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString()
  };

  if (entry.cloudId) {
    const { data, error } = await supabase.from('diary_entries')
      .update(payload)
      .eq('id', entry.cloudId)
      .eq('user_id', userId)
      .select()
      .single();
    return { data, error };
  }

  const { data, error } = await supabase.from('diary_entries').insert(payload).select().single();
  return { data, error };
}

export async function deleteCloudDiaryEntry(entryId, userId) {
  if (!supabase || !entryId || !userId) return { error: { message: 'Cloud service required.' } };
  const { error } = await supabase.from('diary_entries').delete()
    .eq('id', entryId)
    .eq('user_id', userId);
  return { error };
}

// -------------------------------------------------------------------
// Cloud Passport Stamps
// -------------------------------------------------------------------

export async function fetchPassportStamps(userId) {
  if (!supabase || !userId) return [];
  const { data, error } = await supabase
    .from('passport_stamps')
    .select('*')
    .eq('user_id', userId)
    .order('stamped_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function savePassportStamp(destination, userId, tripId = null) {
  if (!supabase || !userId || !destination) return { data: null, error: { message: 'Cloud service required.' } };
  const { data, error } = await supabase.from('passport_stamps').upsert({
    user_id: userId,
    destination,
    trip_id: tripId,
    stamped_at: new Date().toISOString()
  }, { onConflict: 'user_id,destination' }).select().single();
  return { data, error };
}

// -------------------------------------------------------------------
// Guest to Account Migration Helper
// -------------------------------------------------------------------

export async function migrateGuestDataToCloud(userId, guestState) {
  if (!supabase || !userId || !guestState) {
    return { success: false, reason: 'Cloud service or user ID unavailable' };
  }

  const { likedPlaces = [], userPrefs = {}, diary = [], profile = {} } = guestState;
  let migratedTrip = null;

  try {
    // 1. Sync Profile & Preferences
    await saveProfile({
      id: userId,
      display_name: profile.displayName || 'Explorer',
      avatar_url: profile.avatar || '',
      home_city: userPrefs.origin || '',
      travel_style: profile.travelStyle || 'Balanced'
    });

    await savePreferences({
      user_id: userId,
      origin_city: userPrefs.origin || '',
      destination_city: userPrefs.city || 'Kochi',
      days: Number(userPrefs.days) || 3,
      travelers: Number(userPrefs.travelers) || 1,
      budget_envelope: Number(guestState.budgetEnvelope) || 20000,
      pace: userPrefs.pace || 'balanced',
      vibes: userPrefs.vibes || [],
      transport_mode: guestState.mode || 'convenient'
    });

    // 2. If guest had saved places, create a cloud trip
    if (likedPlaces.length > 0) {
      const tripRes = await createCloudTrip({
        title: `${userPrefs.city || 'Kochi'} Trip`,
        destination: userPrefs.city || 'Kochi',
        days: Number(userPrefs.days) || 3,
        travelers: Number(userPrefs.travelers) || 1,
        budget_envelope: Number(guestState.budgetEnvelope) || 20000,
        transport_mode: guestState.mode || 'convenient'
      }, userId);

      if (tripRes?.trip) {
        migratedTrip = tripRes.trip;
        // Also save itinerary stops
        await supabase.from('itineraries').insert({
          trip_id: tripRes.trip.id,
          source: 'DETERMINISTIC_FALLBACK',
          days: [{ day: 1, stops: likedPlaces }],
          budget: { envelope: Number(guestState.budgetEnvelope) || 20000 }
        });
      }
    }

    // 3. Upload guest diary entries
    if (diary.length > 0) {
      const diaryPayloads = diary.map(entry => ({
        user_id: userId,
        place_id: entry.placeId || null,
        place_name: entry.placeName || '',
        note: entry.note || '',
        rating: entry.rating || 'A',
        memory_date: entry.date ? entry.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
      }));
      await supabase.from('diary_entries').insert(diaryPayloads);
    }

    // 4. Create passport stamps for visited destinations
    const guestCities = [...new Set(likedPlaces.map(p => p.city).filter(Boolean))];
    for (const city of guestCities) {
      await savePassportStamp(city, userId, migratedTrip?.id || null);
    }

    return {
      success: true,
      tripId: migratedTrip?.id || null,
      placesCount: likedPlaces.length,
      memoriesCount: diary.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
