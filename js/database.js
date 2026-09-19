"use strict";

(function () {
    if (!window.OVERTIME_CONFIG) {
        console.error("[OVERTIME] OVERTIME_CONFIG is missing.");
        return;
    }

    if (!window.supabase) {
        console.error("[OVERTIME] Supabase JS library is missing.");
        return;
    }

    const config = window.OVERTIME_CONFIG;

    const db = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseKey
    );

    const MATCH_SELECT = `
        *,
        event:events(*),
        team1:teams!matches_team1_id_fkey(*),
        team2:teams!matches_team2_id_fkey(*)
    `;

    async function run(query, label) {
        try {
            const { data, error } = await query;

            if (error) {
                console.error(`[OVERTIME] ${label}:`, error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`[OVERTIME] ${label} failed:`, error);
            throw error;
        }
    }

    async function getCurrentUser() {
        const {
            data: { user },
            error
        } = await db.auth.getUser();

        if (error) {
            console.error("[OVERTIME] getCurrentUser:", error);
            return null;
        }

        return user;
    }

    async function adminLogin(email, password) {
        const { data, error } =
            await db.auth.signInWithPassword({
                email,
                password
            });

        if (error) throw error;

        return data;
    }

    async function adminLogout() {
        const { error } = await db.auth.signOut();

        if (error) throw error;
    }

    function getTeams() {
        return run(
            db.from("teams")
                .select("*")
                .order("name"),
            "getTeams"
        );
    }

    function getTeam(id) {
        return run(
            db.from("teams")
                .select("*")
                .eq("id", id)
                .single(),
            "getTeam"
        );
    }

    function getPlayers() {
        return run(
            db.from("players")
                .select("*, team:teams(*)")
                .eq("active", true)
                .order("gamer_tag"),
            "getPlayers"
        );
    }

    function getEvents() {
        return run(
            db.from("events")
                .select("*")
                .order("start_date", { ascending: false }),
            "getEvents"
        );
    }

    function getFeaturedEvent() {
        return run(
            db.from("events")
                .select("*")
                .eq("featured", true)
                .limit(1)
                .maybeSingle(),
            "getFeaturedEvent"
        );
    }

    function getMatches() {
        return run(
            db.from("matches")
                .select(MATCH_SELECT)
                .order("scheduled_at", { ascending: true }),
            "getMatches"
        );
    }

    function getLiveMatches() {
        return run(
            db.from("matches")
                .select(MATCH_SELECT)
                .eq("status", "live")
                .order("scheduled_at"),
            "getLiveMatches"
        );
    }

    function getUpcomingMatches(limit = 6) {
        return run(
            db.from("matches")
                .select(MATCH_SELECT)
                .eq("status", "upcoming")
                .order("scheduled_at")
                .limit(limit),
            "getUpcomingMatches"
        );
    }

    function getRecentResults(limit = 6) {
        return run(
            db.from("matches")
                .select(MATCH_SELECT)
                .eq("status", "completed")
                .order("scheduled_at", { ascending: false })
                .limit(limit),
            "getRecentResults"
        );
    }

    function getStandings(eventId = null) {
        let query = db
            .from("standings")
            .select("*, team:teams(*), event:events(*)")
            .order("position");

        if (eventId) {
            query = query.eq("event_id", eventId);
        }

        return run(query, "getStandings");
    }

    function getStreams() {
        return run(
            db.from("streams")
                .select("*")
                .eq("active", true)
                .order("sort_order"),
            "getStreams"
        );
    }

    function getNews() {
        return run(
            db.from("news")
                .select("*")
                .eq("published", true)
                .order("published_at", { ascending: false }),
            "getNews"
        );
    }

    function getFeaturedNews(limit = 3) {
        return run(
            db.from("news")
                .select("*")
                .eq("published", true)
                .eq("featured", true)
                .order("published_at", { ascending: false })
                .limit(limit),
            "getFeaturedNews"
        );
    }

    function getSiteSettings() {
        return run(
            db.from("site_settings")
                .select("*")
                .eq("id", 1)
                .maybeSingle(),
            "getSiteSettings"
        );
    }

    async function adminInsert(table, values) {
        return run(
            db.from(table)
                .insert(values)
                .select(),
            `adminInsert:${table}`
        );
    }

    async function adminUpdate(table, id, values) {
        return run(
            db.from(table)
                .update(values)
                .eq("id", id)
                .select(),
            `adminUpdate:${table}`
        );
    }

    async function adminDelete(table, id) {
        return run(
            db.from(table)
                .delete()
                .eq("id", id),
            `adminDelete:${table}`
        );
    }

    window.OvertimeSupabase = db;

    window.OvertimeDB = {
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

    console.log("[OVERTIME] database.js loaded");
})();
