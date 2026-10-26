// =====================================================================
// TSI Build Quality Hub - settings
// Fill these in from: Supabase Dashboard > Project Settings > API
//
//  - supabaseUrl      : "Project URL"            (https://xxxx.supabase.co)
//  - supabaseAnonKey  : "anon" / "public" key    (safe to put in the browser;
//                       access is protected by the database rules in /supabase)
//  - admins           : optional extra owner emails (the database list from
//                       03_first_admin.sql is the real source of truth)
//
// NEVER paste the "service_role" key here.
//
// Leave supabaseUrl empty to run in local DEMO mode (data stays in this
// browser only, everyone has full access).
// =====================================================================
window.APP_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
  admins: []
};
