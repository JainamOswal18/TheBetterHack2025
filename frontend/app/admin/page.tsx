'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import { FileText, GitBranch, Percent, Star, ExternalLink, Check, X } from 'lucide-react';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage and review candidate applications</p>
          </div>
          <div className="bg-card rounded-lg p-4 shadow-md">
            <p className="text-sm text-muted-foreground">Total Applications</p>
            <p className="text-2xl font-bold text-primary">{candidates.length}</p>
          </div>
        </div>

        <div className="grid gap-6">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-border"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Candidate Info Section */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 rounded-full p-2">
                        <span className="text-xl font-bold text-primary">
                          {candidate.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-card-foreground">
                          {candidate.user_name}
                        </h2>
                        <p className="text-muted-foreground">{candidate.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>Job ID: {candidate.job_id}</span>
                    </div>
                  </div>

                  {/* Scores Section */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                  
                    <ScoreCard
                      icon={<Star className="h-5 w-5" />}
                      title="Parameter"
                      score={candidate.parameter_score}
                      colorClass="bg-yellow-500/10 text-yellow-500"
                    />
                    <ScoreCard
                      icon={<FileText className="h-5 w-5" />}
                      title="Job Match"
                      score={candidate.job_similarity_score}
                      colorClass="bg-green-500/10 text-green-500"
                    />
                    <ScoreCard
                      icon={<GitBranch className="h-5 w-5" />}
                      title="GitHub"
                      score={candidate.github_score}
                      colorClass="bg-purple-500/10 text-purple-500"
                    />
                  </div>

                  {/* Total Score Section */}
                  <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-4 min-w-[120px]">
                    <span className="text-sm text-primary font-medium">Total Score</span>
                    <span className="text-3xl font-bold text-primary">
                      {typeof candidate.total_score === 'number' ? candidate.total_score.toFixed(1) : 'N/A'}
                    </span>
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {!candidate.isAccepted && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(candidate.id, candidate.user_name)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(candidate.id, candidate.resume_url, candidate.user_name)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                        >
                          <X className="h-4 w-4" />
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
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors duration-200"
                    >
                      Download CV
                      <FileText className="ml-2 h-4 w-4" />
                    </a>
                    <button
                      onClick={() => window.open(candidate.resume_url, '_blank')}
                      className="inline-flex items-center justify-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors duration-200"
                    >
                      View Online
                      <ExternalLink className="ml-2 h-4 w-4" />
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
    <div className={`flex flex-col items-center rounded-lg p-3 ${colorClass}`}>
      <div className="mb-1">{icon}</div>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-lg font-bold">
        {typeof score === 'number' && score !== null ? score.toFixed(1) : 'N/A'}
      </span>
    </div>
  );
}