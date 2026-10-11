import { createClient } from '@supabase/supabase-js';

function getCredentials() {
  if (typeof window !== 'undefined') {
    const url = import.meta.env?.VITE_SUPABASE_URL;
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http') && key.length > 20) {
      return { url, key };
    }
  } else if (typeof process !== 'undefined') {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http') && key.length > 20) {
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
// Authentication Helpers
// -------------------------------------------------------------------

export async function signUpWithEmail(email, password, displayName = 'Traveller') {
  if (!supabase) return { error: { message: 'Cloud service not configured. Operating in local guest mode.' }, user: null };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName }
    }
  });
  if (error) return { error, user: null };
  return { error: null, user: data.user, session: data.session };
}

export async function signInWithEmail(email, password) {
  if (!supabase) return { error: { message: 'Cloud service not configured. Operating in local guest mode.' }, session: null };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error, session: null, user: null };
  return { error: null, user: data.user, session: data.session };
}

export async function signInWithPhoneOtp(phone) {
  if (!supabase) return { error: { message: 'Phone OTP requires configured Supabase SMS provider.' } };
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  return { data, error };
}

export async function verifyPhoneOtp(phone, token) {
  if (!supabase) return { error: { message: 'Phone OTP requires configured Supabase SMS provider.' } };
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
  return { data, error };
}

export async function signInWithGoogle() {
  if (!supabase) return { error: { message: 'Google OAuth requires configured Supabase project.' } };
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/#profile` : undefined;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });
  return { data, error };
}

export async function signOutUser() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function requestPasswordReset(email) {
  if (!supabase) return { error: { message: 'Password recovery requires configured cloud service.' } };
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  return { data, error };
}

export async function getActiveSession() {
  if (!supabase) return { session: null, user: null };
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return { session: null, user: null };
  return { session, user: session.user };
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
// Trip Rooms & Group Travel Sync
// -------------------------------------------------------------------

export async function createCloudTrip(tripData, userId) {
  if (!supabase || !userId) return null;
  const inviteCode = (tripData.invite_code || Math.random().toString(36).slice(2, 8)).toUpperCase();
  const payload = {
    ...tripData,
    owner_id: userId,
    invite_code: inviteCode,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('trips').insert(payload).select().single();
  if (error) return { error, data: null };

  // Add owner to trip_members
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
  
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('*, trip_members(*)')
    .eq('invite_code', cleanCode)
    .single();

  if (tripError || !trip) {
    return { error: { message: 'Trip with this invite code was not found.' }, trip: null };
  }

  // Join if not already member
  const alreadyMember = trip.trip_members?.some(m => m.user_id === userId);
  if (!alreadyMember) {
    const { error: joinError } = await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: userId,
      role: 'member'
    });
    if (joinError) return { error: joinError, trip: null };
  }

  return { error: null, trip };
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
