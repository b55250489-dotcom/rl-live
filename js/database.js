// =============================================
// OVERTIME — DATABASE
// =============================================

"use strict";

(function () {

    // =========================================
    // SAFETY CHECKS
    // =========================================

    if (!window.supabase) {
        console.error(
            "[OVERTIME] Supabase library did not load."
        );
        return;
    }

    if (!window.OVERTIME_CONFIG) {
        console.error(
            "[OVERTIME] config.js did not load."
        );
        return;
    }


    // =========================================
    // SUPABASE CLIENT
    // =========================================

    const overtimeDB = window.supabase.createClient(
        window.OVERTIME_CONFIG.supabaseUrl,
        window.OVERTIME_CONFIG.supabaseKey
    );


    // =========================================
    // AUTH
    // =========================================

    async function getCurrentUser() {

        const {
            data: { user },
            error
        } = await overtimeDB.auth.getUser();

        if (error) {
            console.warn(
                "[OVERTIME] Could not get current user:",
                error.message
            );

            return null;
        }

        return user;
    }


    async function adminLogin(email, password) {

        try {

            return await overtimeDB.auth.signInWithPassword({
                email,
                password
            });

        } catch (error) {

            console.error(
                "[OVERTIME] Login error:",
                error
            );

            return {
                data: null,
                error
            };
        }
    }


    async function adminLogout() {

        try {

            return await overtimeDB.auth.signOut();

        } catch (error) {

            console.error(
                "[OVERTIME] Logout error:",
                error
            );

            return {
                error
            };
        }
    }


    // =========================================
    // TEAMS
    // =========================================

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


    // =========================================
    // PLAYERS
    // =========================================

    async function getPlayers() {

        return await overtimeDB
            .from("players")
            .select(`
                *,
                team:teams(*)
            `)
            .order("gamer_tag");

    }


    // =========================================
    // EVENTS
    // =========================================

    async function getEvents() {

        return await overtimeDB
            .from("events")
            .select("*")
            .order(
                "start_date",
                {
                    ascending: false
                }
            );

    }


    async function getFeaturedEvent() {

        return await overtimeDB
            .from("events")
            .select("*")
            .eq("featured", true)
            .limit(1)
            .maybeSingle();

    }


    // =========================================
    // MATCHES
    // =========================================

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
            .order(
                "scheduled_at",
                {
                    ascending: false
                }
            )
            .limit(limit);

    }


    // =========================================
    // STANDINGS
    // =========================================

    async function getStandings(eventId = null) {

        let query = overtimeDB
            .from("standings")
            .select(`
                *,
                team:teams(*)
            `)
            .order("position");


        if (eventId) {

            query = query.eq(
                "event_id",
                eventId
            );

        }


        return await query;

    }


    // =========================================
    // STREAMS
    // =========================================

    async function getStreams() {

        return await overtimeDB
            .from("streams")
            .select("*")
            .eq("active", true)
            .order("sort_order");

    }


    // =========================================
    // NEWS
    // =========================================

    async function getNews(limit = 20) {

        return await overtimeDB
            .from("news")
            .select("*")
            .eq("published", true)
            .order(
                "published_at",
                {
                    ascending: false
                }
            )
            .limit(limit);

    }


    async function getFeaturedNews(limit = 3) {

        return await overtimeDB
            .from("news")
            .select("*")
            .eq("published", true)
            .eq("featured", true)
            .order(
                "published_at",
                {
                    ascending: false
                }
            )
            .limit(limit);

    }


    // =========================================
    // SITE SETTINGS
    // =========================================

    async function getSiteSettings() {

        return await overtimeDB
            .from("site_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle();

    }


    // =========================================
    // ADMIN — INSERT
    // =========================================

    async function adminInsert(table, values) {

        try {

            return await overtimeDB
                .from(table)
                .insert(values)
                .select();

        } catch (error) {

            console.error(
                `[OVERTIME] Insert failed on ${table}:`,
                error
            );

            return {
                data: null,
                error
            };
        }

    }


    // =========================================
    // ADMIN — UPDATE
    // =========================================

    async function adminUpdate(
        table,
        id,
        values
    ) {

        try {

            return await overtimeDB
                .from(table)
                .update(values)
                .eq("id", id)
                .select();

        } catch (error) {

            console.error(
                `[OVERTIME] Update failed on ${table}:`,
                error
            );

            return {
                data: null,
                error
            };
        }

    }


    // =========================================
    // ADMIN — DELETE
    // =========================================

    async function adminDelete(
        table,
        id
    ) {

        try {

            return await overtimeDB
                .from(table)
                .delete()
                .eq("id", id);

        } catch (error) {

            console.error(
                `[OVERTIME] Delete failed on ${table}:`,
                error
            );

            return {
                data: null,
                error
            };
        }

    }


    // =========================================
    // EXPORT
    // =========================================

    /*
        IMPORTANT:

        admin.js directly uses:

        OvertimeDB.client
            .from(...)

        Therefore the actual Supabase client MUST
        be exported here.
    */

    window.OvertimeDB = {

        // Raw Supabase client
        client: overtimeDB,

        // Auth
        getCurrentUser,
        adminLogin,
        adminLogout,

        // Teams
        getTeams,
        getTeam,

        // Players
        getPlayers,

        // Events
        getEvents,
        getFeaturedEvent,

        // Matches
        getMatches,
        getLiveMatches,
        getUpcomingMatches,
        getRecentResults,

        // Standings
        getStandings,

        // Streams
        getStreams,

        // News
        getNews,
        getFeaturedNews,

        // Settings
        getSiteSettings,

        // Admin CRUD
        adminInsert,
        adminUpdate,
        adminDelete

    };


    // Optional direct reference for debugging
    window.OvertimeSupabase = overtimeDB;


    console.log(
        "[OVERTIME] database.js loaded"
    );

    console.log(
        "[OVERTIME] Supabase client ready:",
        !!window.OvertimeDB.client
    );

})();
