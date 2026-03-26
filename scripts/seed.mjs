/**
 * Seed Script for ImpactLinks Golf
 * Creates 2 test accounts (admin + user) and populates test data.
 *
 * Usage:  node scripts/seed.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = 'https://llbxwluzbmkecorouvxa.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYnh3bHV6Ym1rZWNvcm91dnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNjM2MDIsImV4cCI6MjA4OTkzOTYwMn0.Yxh21bRZBkEIooB29YdG0tlJn_bHfDT5y-MErNAL89s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Test Credentials ──
const ADMIN_EMAIL    = 'admin@impactlinks.test';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME     = 'Sarah Mitchell';

const USER_EMAIL     = 'user@impactlinks.test';
const USER_PASSWORD  = 'User@1234';
const USER_NAME      = 'James Carter';

// ── Helper: sign up or sign in ──
async function getOrCreateUser(email, password, fullName) {
  // Try sign-up first
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: fullName } }
  });

  if (signUpErr && signUpErr.message.includes('already registered')) {
    // Already exists → sign in
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(`Sign-in failed for ${email}: ${signInErr.message}`);
    return signInData.user;
  }
  if (signUpErr) throw new Error(`Sign-up failed for ${email}: ${signUpErr.message}`);

  // If signup returned a user but no session (email confirmation required), sign in
  if (signUpData.user && !signUpData.session) {
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(`Sign-in after signup failed for ${email}: ${signInErr.message}`);
    return signInData.user;
  }

  return signUpData.user;
}

async function main() {
  console.log('🌱 Seeding ImpactLinks Golf...\n');

  // ════════════════════════════════════════════
  // 1. Create Admin Account
  // ════════════════════════════════════════════
  console.log('👤 Creating admin account...');
  const adminUser = await getOrCreateUser(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME);
  console.log(`   ✅ Admin UID: ${adminUser.id}`);

  // Sign in as admin to perform writes
  await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  // Update profile to admin role
  await supabase.from('profiles').upsert({
    id: adminUser.id,
    full_name: ADMIN_NAME,
    role: 'admin',
    charity_percentage: 15,
    created_at: new Date().toISOString()
  });
  console.log('   ✅ Profile set to admin role');

  // ════════════════════════════════════════════
  // 2. Seed Charities (admin creates them)
  // ════════════════════════════════════════════
  console.log('\n❤️  Seeding charities...');
  const charities = [
    { name: 'The Water Project',    description: 'Providing clean, safe water across sub-Saharan Africa through sustainable well construction.', featured: true,  website: 'https://thewaterproject.org' },
    { name: 'Code.org',             description: 'Expanding access to computer science in schools and increasing participation by underrepresented minorities.', featured: false, website: 'https://code.org' },
    { name: 'Caddie For A Cure',    description: 'Using the game of golf to support cancer research, treatment, and patient care programs.', featured: true,  website: 'https://caddieforcure.org' },
    { name: 'On Course Foundation', description: 'Using golf to aid the recovery and rehabilitation of wounded, injured, and sick military personnel.', featured: false, website: 'https://oncoursefoundation.com' },
    { name: 'First Tee',           description: 'Building game-changers by introducing young people to golf and its inherent values.', featured: true,  website: 'https://firsttee.org' },
    { name: 'Trees for the Future', description: 'Training communities to restore degraded land through Forest Garden planting initiatives.', featured: false, website: 'https://trees.org' },
  ];

  const { data: insertedCharities, error: charErr } = await supabase
    .from('charities')
    .upsert(charities, { onConflict: 'name' })
    .select();

  if (charErr) {
    console.log(`   ⚠️  Charity upsert issue: ${charErr.message} — trying insert...`);
    // If upsert fails (no unique constraint on name), just insert and ignore duplicates
    for (const c of charities) {
      await supabase.from('charities').insert(c);
    }
  }
  console.log(`   ✅ ${charities.length} charities seeded`);

  // Get charities from DB for IDs
  const { data: dbCharities } = await supabase.from('charities').select('id, name');
  const waterProjectId = dbCharities?.find(c => c.name === 'The Water Project')?.id;
  const firstTeeId     = dbCharities?.find(c => c.name === 'First Tee')?.id;

  // ════════════════════════════════════════════
  // 3. Seed Admin Subscription
  // ════════════════════════════════════════════
  console.log('\n💳 Seeding admin subscription...');
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  await supabase.from('subscriptions').upsert({
    user_id: adminUser.id,
    plan: 'yearly',
    status: 'active',
    stripe_sub_id: `sim_admin_${Date.now()}`,
    stripe_customer_id: `cus_sim_admin`,
    current_period_start: now.toISOString(),
    current_period_end: nextYear.toISOString(),
  }, { onConflict: 'user_id' });
  console.log('   ✅ Admin has yearly subscription');

  // ════════════════════════════════════════════
  // 4. Seed a Published Draw
  // ════════════════════════════════════════════
  console.log('\n🎰 Seeding published draw...');
  const drawNumbers = [7, 18, 25, 33, 41];
  const { data: draw } = await supabase.from('draws').insert({
    draw_date: now.toISOString(),
    status: 'published',
    draw_type: 'random',
    numbers: drawNumbers,
  }).select().single();
  console.log(`   ✅ Draw published with numbers: ${drawNumbers.join(' - ')}`);

  // Sign out admin
  await supabase.auth.signOut();

  // ════════════════════════════════════════════
  // 5. Create User Account
  // ════════════════════════════════════════════
  console.log('\n👤 Creating user account...');
  const regularUser = await getOrCreateUser(USER_EMAIL, USER_PASSWORD, USER_NAME);
  console.log(`   ✅ User UID: ${regularUser.id}`);

  // Sign in as user
  await supabase.auth.signInWithPassword({ email: USER_EMAIL, password: USER_PASSWORD });

  // Update profile with charity
  await supabase.from('profiles').upsert({
    id: regularUser.id,
    full_name: USER_NAME,
    role: 'user',
    charity_id: firstTeeId || null,
    charity_percentage: 10,
    created_at: new Date().toISOString()
  });
  console.log('   ✅ Profile set with First Tee charity');

  // ════════════════════════════════════════════
  // 6. Seed User Subscription
  // ════════════════════════════════════════════
  console.log('\n💳 Seeding user subscription...');
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await supabase.from('subscriptions').upsert({
    user_id: regularUser.id,
    plan: 'monthly',
    status: 'active',
    stripe_sub_id: `sim_user_${Date.now()}`,
    stripe_customer_id: `cus_sim_user`,
    current_period_start: now.toISOString(),
    current_period_end: nextMonth.toISOString(),
  }, { onConflict: 'user_id' });
  console.log('   ✅ User has monthly subscription');

  // ════════════════════════════════════════════
  // 7. Seed 5 Scores for User
  // ════════════════════════════════════════════
  console.log('\n🏌️ Seeding 5 scores for user...');
  const scores = [
    { user_id: regularUser.id, score: 33, played_date: '2026-03-01' },
    { user_id: regularUser.id, score: 25, played_date: '2026-03-05' },
    { user_id: regularUser.id, score: 41, played_date: '2026-03-10' },
    { user_id: regularUser.id, score: 18, played_date: '2026-03-15' },
    { user_id: regularUser.id, score: 29, played_date: '2026-03-20' },
  ];
  for (const s of scores) {
    await supabase.from('scores').insert(s);
  }
  console.log('   ✅ 5 Stableford scores seeded (33, 25, 41, 18, 29)');

  // ════════════════════════════════════════════
  // 8. Seed a Winner record for User (3-match)
  // ════════════════════════════════════════════
  console.log('\n🏆 Seeding winner record...');
  if (draw) {
    await supabase.from('winners').insert({
      user_id: regularUser.id,
      draw_id: draw.id,
      match_type: '3',
      prize_amount: 75.00,
      verification_status: 'pending',
      payout_status: 'pending',
    });
    console.log('   ✅ User is a 3-match winner (£75.00, pending verification)');
  }

  await supabase.auth.signOut();

  // ════════════════════════════════════════════
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 SEEDING COMPLETE!\n');
  console.log('  ADMIN ACCOUNT');
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  URL:      http://localhost:3000/admin\n`);
  console.log('  USER ACCOUNT');
  console.log(`  Email:    ${USER_EMAIL}`);
  console.log(`  Password: ${USER_PASSWORD}`);
  console.log(`  URL:      http://localhost:3000/dashboard`);
  console.log('═'.repeat(50));
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
