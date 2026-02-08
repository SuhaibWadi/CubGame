import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://tamttktqradvgiekwkhg.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhbXR0a3RxcmFkdmdpZWt3a2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Mjc3MDMsImV4cCI6MjA4NjEwMzcwM30.LG5eh7wkeRCqDcitjEA70AWVP7l4R-V_0Eke9mUjbYU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
