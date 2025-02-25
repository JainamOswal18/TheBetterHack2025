'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { FileText, GitBranch, Percent, Star, ExternalLink, Check, X } from 'lucide-react';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Candidate {
  id: number;
  job_id: number;
  user_name: string;
  user_email: string;
  resume_url: string;
  parameter_score: number | null;
  job_similarity_score: number | null;
  github_score: number | null;
  total_score: number | null;
  match_percentage: number | null;
  isAccepted?: boolean;
}

export default function AdminDashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')  // Select all columns since we want everything
          .order('id', { ascending: false });  // Order by id for now since scores might be null

        if (error) {
          console.error('Error fetching candidates:', error);
          return;
        }

        console.log('Fetched data:', data);
        setCandidates(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchCandidates:', error);
        setLoading(false);
      }
    }

    fetchCandidates();
  }, []);

  const handleAccept = (candidateId: number, candidateName: string) => {
    setCandidates(prev => 
      prev.map(c => 
        c.id === candidateId 
          ? { ...c, isAccepted: true } 
          : c
      )
    );
    toast.success(`${candidateName} has been accepted!`, {
      duration: 3000,
    });
  };

  const handleReject = async (candidateId: number, resumeUrl: string, candidateName: string) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('candidates')
        .delete()
        .eq('id', candidateId);

      if (dbError) throw dbError;

      // Delete from storage - Fix for storage path
      const filePath = resumeUrl.split('resume/').pop(); // Get the correct file path
      if (filePath) {
        const { error: storageError } = await supabase
          .storage
          .from('resume')
          .remove([filePath]);

        if (storageError) throw storageError;
      }

      // Update local state
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      
      toast.success(`${candidateName} has been removed from candidates`, {
        duration: 3000,
      });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast.error('Failed to reject candidate');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-12 bg-card rounded-2xl p-6 shadow-lg border border-border/50">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage and review candidate applications</p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="bg-primary/10 rounded-2xl p-6 shadow-inner">
              <p className="text-sm text-primary/70 font-medium">Total Applications</p>
              <p className="text-4xl font-bold text-primary mt-1">{candidates.length}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="bg-secondary/80 text-secondary-foreground px-6 py-2.5 rounded-lg hover:bg-secondary/70 transition-all duration-200 flex items-center gap-2 shadow-md"
              >
                <Briefcase className="h-4 w-4" />
                Home
              </Link>
              <button
                onClick={handleLogout}
                className="bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/80 transition-all duration-200 flex items-center gap-2 shadow-md"
              >
                <ExternalLink className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="grid gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-card rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-border/50 hover:border-border group"
            >
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                  {/* Candidate Info Section */}
                  <div className="flex-1 min-w-[300px]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-primary/10 rounded-2xl p-4 group-hover:bg-primary/20 transition-colors duration-300">
                        <span className="text-2xl font-bold text-primary">
                          {candidate.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-card-foreground">
                          {candidate.user_name}
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                          <Briefcase className="h-4 w-4" />
                          {candidate.user_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-secondary/30 rounded-lg px-4 py-2 w-fit">
                      <Star className="h-4 w-4 text-primary" />
                      <span>Job ID: {candidate.job_id}</span>
                    </div>
                  </div>

                  {/* Scores Section */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                    <ScoreCard
                      icon={<Star className="h-6 w-6" />}
                      title="Parameter Score"
                      score={candidate.parameter_score}
                      colorClass="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                    />
                    <ScoreCard
                      icon={<FileText className="h-6 w-6" />}
                      title="Job Match"
                      score={candidate.job_similarity_score}
                      colorClass="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                    />
                    <ScoreCard
                      icon={<GitBranch className="h-6 w-6" />}
                      title="GitHub Score"
                      score={candidate.github_score}
                      colorClass="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
                    />
                    <div className="flex flex-col items-center justify-center bg-primary/10 rounded-xl p-6 hover:bg-primary/20 transition-all duration-300">
                      <Percent className="h-6 w-6 text-primary mb-2" />
                      <span className="text-sm text-primary font-medium">Total Score</span>
                      <span className="text-3xl font-bold text-primary mt-1">
                        {typeof candidate.total_score === 'number' ? candidate.total_score.toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-col gap-3 min-w-[160px]">
                    {!candidate.isAccepted && (
                      <div className="flex gap-2 mb-2">
                        <button
                          onClick={() => handleAccept(candidate.id, candidate.user_name)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <Check className="h-5 w-5" />
                          Accept
                        </button>
                        <button
                          onClick={() => handleReject(candidate.id, candidate.resume_url, candidate.user_name)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          <X className="h-5 w-5" />
                          Reject
                        </button>
                      </div>
                    )}
                    <a
                      href={candidate.resume_url}
                      download={`${candidate.user_name}_resume.pdf`}
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          const response = await fetch(candidate.resume_url);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${candidate.user_name}_resume.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          window.URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error downloading resume:', error);
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <FileText className="h-5 w-5" />
                      Download CV
                    </a>
                    <button
                      onClick={() => window.open(candidate.resume_url, '_blank')}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="h-5 w-5" />
                      View Online
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ScoreCardProps {
  icon: React.ReactNode;
  title: string;
  score: number | null;
  colorClass: string;
}

function ScoreCard({ icon, title, score, colorClass }: ScoreCardProps) {
  return (
    <div className={`flex flex-col items-center rounded-xl p-6 transition-all duration-300 ${colorClass}`}>
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-medium text-center">{title}</span>
      <span className="text-2xl font-bold mt-1">
        {typeof score === 'number' && score !== null ? score.toFixed(1) : 'N/A'}
      </span>
    </div>
  );
}