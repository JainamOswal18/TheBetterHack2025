'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { Briefcase, ChevronRight, Code, GraduationCap, Clock, Search, Building } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header with Admin Link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-end">
          <Link
            href="/admin"
            className="inline-flex items-center px-4 py-2 bg-secondary/80 text-secondary-foreground rounded-lg hover:bg-secondary/70 transition-all duration-200 shadow-md"
          >
            <Building className="mr-2 h-4 w-4" />
            Admin Dashboard
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-6">
            Join Our Team
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're looking for talented individuals to help shape the future of technology. 
            {jobs.length === 1 
              ? "Explore our current opening and take the next step in your career journey."
              : `Explore our ${jobs.length} open positions and take the next step in your career journey.`
            }
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {jobs.map((job) => (
            <div 
              key={job.job_id}
              className="bg-card rounded-2xl shadow-lg border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              {/* Job Header */}
              <div className="bg-primary/5 border-b border-border/50 p-8">
                <div className="flex items-start gap-6">
                  <div className="bg-primary/10 p-4 rounded-xl">
                    <Briefcase className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold text-card-foreground mb-2">
                      {job.job_title}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      {job.job_details}
                    </p>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-6">
                    <div className="bg-secondary/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Code className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Required Skills</h3>
                      </div>
                      <p className="text-muted-foreground">
                        {job.skills_requirement}
                      </p>
                    </div>

                    <div className="bg-secondary/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Education</h3>
                      </div>
                      <p className="text-muted-foreground">
                        {job.education_requirement}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-secondary/20 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Clock className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold text-primary">Experience</h3>
                      </div>
                      <p className="text-muted-foreground">
                        {job.experience_requirement}
                      </p>
                    </div>

                    {job.additional_requirements && (
                      <div className="bg-secondary/20 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Search className="h-6 w-6 text-primary" />
                          <h3 className="text-lg font-semibold text-primary">Additional Requirements</h3>
                        </div>
                        <p className="text-muted-foreground">
                          {job.additional_requirements}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Link
                    href={`/apply/${job.job_id}`}
                    className="inline-flex items-center px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
                  >
                    Apply for this Position
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}