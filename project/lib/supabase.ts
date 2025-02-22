import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mntnayhgfvauknsvzdqh.supabase.co"; // Replace with your actual project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udG5heWhnZnZhdWtuc3Z6ZHFoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIwMDY1OSwiZXhwIjoyMDU1Nzc2NjU5fQ.xGM_2lZTYZfsydj8hFK6yJ3IzUKqE-Hz-nXcbWL94gU"; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
