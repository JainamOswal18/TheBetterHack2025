'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Briefcase, ChevronRight, Code, GraduationCap, Clock } from 'lucide-react';
import Link from 'next/link';

interface JobDetails {
  job_id: number;
  job_title: string;
  job_details: string;
  skills_requirement: string;
  education_requirement: string;
  experience_requirement: string;
  additional_requirements: string | null;
  created_at: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<JobDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from('job_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      setJobs(data || []);
      setLoading(false);
    }

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore exciting opportunities and take the next step in your career
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div
              key={job.job_id}
              className="bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <Briefcase className="h-6 w-6 text-primary mr-2" />
                  <h2 className="text-xl font-semibold text-card-foreground">
                    {job.job_title}
                  </h2>
                </div>
                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {job.job_details}
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-2">
                    <Code className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <strong>Skills:</strong> {job.skills_requirement}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <strong>Education:</strong> {job.education_requirement}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <strong>Experience:</strong> {job.experience_requirement}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/apply/${job.job_id}`}
                  className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
                >
                  Apply Now
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}