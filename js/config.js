"use strict";

window.OVERTIME_CONFIG = {
    supabaseUrl: "https://iufyccdxkvhqlcpyxabv.supabase.co",

    // Publishable key only — never put a secret/service-role key here.
    supabaseKey: "sb_publishable_9v34ldcSrg3jvCFrdtjcfw_X-o3iXIY",

    siteName: "Overtime",
    siteDescription: "Rocket League Esports",

    // GitHub Pages project path
    basePath: "/rl-live",

    // Twitch requires the hostname, not /rl-live/
    twitchParent: "b55250489-dotcom.github.io"
};

console.log("[OVERTIME] config.js loaded");
