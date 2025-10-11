import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

const supabase = createClient(config.supabase.url, config.supabase.anonKey);

export default supabase;
