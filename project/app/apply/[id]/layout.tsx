import supabase from '@/lib/supabase';

export async function generateStaticParams() {
  const { data } = await supabase
    .from('job_details')
    .select('job_id');
  
  return (data || []).map((job) => ({
    id: job.job_id.toString(),
  }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
} 