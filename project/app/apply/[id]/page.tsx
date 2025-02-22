'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { Loader2, CheckCircle2, ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';

interface JobDetails {
  job_title: string;
  job_details: string;
  skills_requirement: string;
  education_requirement: string;
  experience_requirement: string;
  additional_requirements: string | null;
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    resume: null as File | null,
  });

  useEffect(() => {
    async function fetchJob() {
      const { data, error } = await supabase
        .from('job_details')
        .select('*')
        .eq('job_id', params.id)
        .single();

      if (error || !data) {
        router.push('/');
        return;
      }

      setJob(data);
      setLoading(false);
    }

    fetchJob();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.resume) {
        throw new Error('Resume is required');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('resume', formData.resume);
      formDataToSend.append('jobId', params.id as string);

      const response = await fetch('http://localhost:8000/submit-resume', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 p-8">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-in zoom-in duration-300" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            Application Submitted Successfully!
          </h2>
          <p className="text-muted-foreground">
            Thank you for your interest. We will review your application and get
            back to you soon.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-primary/80 mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Job Listings
        </Link>

        <div className="bg-card rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <Briefcase className="h-8 w-8 text-primary mr-3" />
            <h1 className="text-2xl font-bold text-card-foreground">
              Apply for {job?.job_title}
            </h1>
          </div>

          <div className="mb-8 space-y-4">
            <p className="text-muted-foreground">{job?.job_details}</p>
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Required Skills</h3>
              <p className="text-sm text-muted-foreground">{job?.skills_requirement}</p>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Education</h3>
              <p className="text-sm text-muted-foreground">{job?.education_requirement}</p>
            </div>
            <div>
              <h3 className="font-semibold text-card-foreground mb-2">Experience</h3>
              <p className="text-sm text-muted-foreground">{job?.experience_requirement}</p>
            </div>
            {job?.additional_requirements && (
              <div>
                <h3 className="font-semibold text-card-foreground mb-2">Additional Requirements</h3>
                <p className="text-sm text-muted-foreground">{job.additional_requirements}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                required
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                required
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <label
                htmlFor="resume"
                className="block text-sm font-medium text-card-foreground mb-2"
              >
                Resume (PDF)
              </label>
              <input
                type="file"
                id="resume"
                required
                accept=".pdf"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    resume: e.target.files ? e.target.files[0] : null,
                  })
                }
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}