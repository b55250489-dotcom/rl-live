// =============================================
// OVERTIME — DATABASE
// =============================================

const overtimeDB = window.supabase.createClient(
    OVERTIME_CONFIG.supabaseUrl,
    OVERTIME_CONFIG.supabaseKey
);

// =============================================
// AUTH
// =============================================

async function getCurrentUser() {
    const {
        data: { user },
        error
    } = await overtimeDB.auth.getUser();

    if (error) {
        return null;
    }

    return user;
}

async function adminLogin(email, password) {
    return await overtimeDB.auth.signInWithPassword({
        email,
        password
    });
}

async function adminLogout() {
    return await overtimeDB.auth.signOut();
}

// =============================================
// TEAMS
// =============================================

async function getTeams() {
    return await overtimeDB
        .from("teams")
        .select("*")
        .order("name");
}

async function getTeam(id) {
    return await overtimeDB
        .from("teams")
        .select("*")
        .eq("id", id)
        .single();
}

// =============================================
// PLAYERS
// =============================================

async function getPlayers() {
    return await overtimeDB
        .from("players")
        .select(`
            *,
            team:teams(*)
        `)
        .order("gamer_tag");
}

// =============================================
// EVENTS
// =============================================

async function getEvents() {
    return await overtimeDB
        .from("events")
        .select("*")
        .order("start_date", {
            ascending: false
        });
}

async function getFeaturedEvent() {
    return await overtimeDB
        .from("events")
        .select("*")
        .eq("featured", true)
        .limit(1)
        .maybeSingle();
}

// =============================================
// MATCHES
// =============================================

const MATCH_SELECT = `
    *,
    event:events(*),
    team1:teams!matches_team1_id_fkey(*),
    team2:teams!matches_team2_id_fkey(*)
`;

async function getMatches() {
    return await overtimeDB
        .from("matches")
        .select(MATCH_SELECT)
        .order("scheduled_at");
}

async function getLiveMatches() {
    return await overtimeDB
        .from("matches")
        .select(MATCH_SELECT)
        .eq("status", "live")
        .order("scheduled_at");
}

async function getUpcomingMatches(limit = 6) {
    return await overtimeDB
        .from("matches")
        .select(MATCH_SELECT)
        .eq("status", "upcoming")
        .order("scheduled_at")
        .limit(limit);
}

async function getRecentResults(limit = 6) {
    return await overtimeDB
        .from("matches")
        .select(MATCH_SELECT)
        .eq("status", "completed")
        .order("scheduled_at", {
            ascending: false
        })
        .limit(limit);
}

// =============================================
// STANDINGS
// =============================================

async function getStandings(eventId) {
    return await overtimeDB
        .from("standings")
        .select(`
            *,
            team:teams(*)
        `)
        .eq("event_id", eventId)
        .order("position");
}

// =============================================
// STREAMS
// =============================================

async function getStreams() {
    return await overtimeDB
        .from("streams")
        .select("*")
        .eq("active", true)
        .order("sort_order");
}

// =============================================
// NEWS
// =============================================

async function getNews(limit = 20) {
    return await overtimeDB
        .from("news")
        .select("*")
        .eq("published", true)
        .order("published_at", {
            ascending: false
        })
        .limit(limit);
}

async function getFeaturedNews(limit = 3) {
    return await overtimeDB
        .from("news")
        .select("*")
        .eq("published", true)
        .eq("featured", true)
        .order("published_at", {
            ascending: false
        })
        .limit(limit);
}

// =============================================
// SITE SETTINGS
// =============================================

async function getSiteSettings() {
    return await overtimeDB
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .single();
}

// =============================================
// ADMIN CRUD
// =============================================

async function adminInsert(table, values) {
    return await overtimeDB
        .from(table)
        .insert(values)
        .select();
}

async function adminUpdate(table, id, values) {
    return await overtimeDB
        .from(table)
        .update(values)
        .eq("id", id)
        .select();
}

async function adminDelete(table, id) {
    return await overtimeDB
        .from(table)
        .delete()
        .eq("id", id);
}

// =============================================
// EXPORT
// =============================================

window.OvertimeDB = {
    client: overtimeDB,

    getCurrentUser,
    adminLogin,
    adminLogout,

    getTeams,
    getTeam,
    getPlayers,

    getEvents,
    getFeaturedEvent,

    getMatches,
    getLiveMatches,
    getUpcomingMatches,
    getRecentResults,

    getStandings,
    getStreams,

    getNews,
    getFeaturedNews,

    getSiteSettings,

    adminInsert,
    adminUpdate,
    adminDelete
};
