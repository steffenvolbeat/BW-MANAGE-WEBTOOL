'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, StopCircleIcon, PlayIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { startInterviewSession, analyzeMessage, endInterviewSession, MessageMetrics, InterviewFeedback } from '@/lib/ai/interviewSimulator';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  analysis?: MessageMetrics | InterviewFeedback;
}

export default function InterviewSimulatorPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startSession = async () => {
    if (!jobRole) return;
    
    try {
      const context = {
        jobTitle: jobRole,
        company: "Test Company",
        difficulty: difficulty as "EASY" | "MEDIUM" | "HARD"
      };
      const session = await startInterviewSession(context);
      setSessionId(session.sessionId);
      setSessionActive(true);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: session.firstQuestion,
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Session start failed:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    
    try {
      const report = await endInterviewSession(sessionId, messages.filter(m => m.role === 'assistant').map(m => ({
        role: m.role === 'assistant' ? 'interviewer' : 'candidate',
        content: m.content,
        metrics: m.analysis as MessageMetrics | undefined
      })));
      setSessionActive(false);
      
      // Add summary message
      const summaryMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `## Interview Summary\n\n**Overall Performance:** ${report.feedback.overallScore}/100\n\n**Strengths:**\n${report.feedback.strengths.map((s: string) => `• ${s}`).join('\n')}\n\n**Areas for Improvement:**\n${report.feedback.improvements.map((i: string) => `• ${i}`).join('\n')}`,
        timestamp: Date.now(),
        analysis: report.feedback
      };
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Session end failed:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!sessionId || !content.trim()) return;
    
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentInput('');
    setIsProcessing(true);
    
    try {
      const metrics = analyzeMessage(content.trim());
      const mockResponse = "Das ist eine interessante Antwort. Können Sie das weiter ausführen?";
      
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: mockResponse,
        timestamp: Date.now(),
        analysis: metrics
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Message analysis failed:', error);
    }
    
    setIsProcessing(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Here you would typically send to speech-to-text service
        // For now, we'll use a placeholder
        setCurrentInput("(Transkription würde hier erscheinen...)");
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <ChartBarIcon className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">KI-Interview Simulator</h1>
            <p className="text-(--muted)">Übe Bewerbungsgespräche mit adaptiver KI</p>
          </div>
        </div>

        {!sessionActive ? (
          <div className="bg-(--card) rounded-lg shadow-sm border border-(--border) p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Neues Interview starten</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Position/Rolle
                </label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="z.B. Software Engineer, Marketing Manager..."
                  className="w-full border border-(--border) rounded-md px-3 py-2 bg-(--surface) text-foreground placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Schwierigkeitsgrad
                </label>
                <div className="flex gap-3">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(level => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        value={level}
                        checked={difficulty === level}
                        onChange={(e) => setDifficulty(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="text-sm text-(--muted) capitalize">
                        {level === 'beginner' ? 'Einsteiger' : 
                         level === 'intermediate' ? 'Fortgeschritten' : 'Experte'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={startSession}
                disabled={!jobRole.trim()}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Interview starten
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chat Interface */}
            <div className="bg-(--card) rounded-lg shadow-sm border border-(--border)">
              <div className="p-4 border-b border-(--border) flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Interview Session</h3>
                  <p className="text-sm text-(--muted)">Position: {jobRole}</p>
                </div>
                <button
                  onClick={endSession}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Interview beenden
                </button>
              </div>
              
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-(--surface) text-foreground border border-(--border)'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.analysis && (
                        <div className="mt-2 pt-2 border-t border-purple-500/20">
                          <div className="text-xs opacity-80">
                            STAR: {(message.analysis as MessageMetrics)?.starMethodDetected ? '✓' : '✗'} |
                            Sentiment: {(message.analysis as MessageMetrics)?.sentiment}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-(--surface) border border-(--border) px-4 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                        <span className="text-sm text-(--muted)">KI analysiert...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-(--border)">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(currentInput)}
                    placeholder="Deine Antwort..."
                    className="flex-1 border border-(--border) rounded-md px-3 py-2 bg-(--surface) text-foreground placeholder:text-(--muted) focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isProcessing}
                  />
                  
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-md ${
                      isRecording 
                        ? 'bg-red-600 text-white' 
                        : 'bg-(--surface) border border-(--border) text-(--muted) hover:bg-(--card)'
                    }`}
                  >
                    {isRecording ? (
                      <StopCircleIcon className="h-5 w-5" />
                    ) : (
                      <MicrophoneIcon className="h-5 w-5" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => sendMessage(currentInput)}
                    disabled={!currentInput.trim() || isProcessing}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
                  >
                    Senden
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-8 bg-purple-950/20 dark:bg-purple-950/30 border border-purple-800/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">
            Interview-Tipps
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-purple-300 mb-2">📝 STAR-Methode nutzen</h4>
              <p className="text-(--muted)">
                Strukturiere deine Antworten: <strong>S</strong>ituation, <strong>T</strong>ask, 
                <strong>A</strong>ction, <strong>R</strong>esult
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-300 mb-2">🎤 Sprachaufnahme</h4>
              <p className="text-(--muted)">
                Nutze die Mikrofon-Funktion, um deine Aussprache und 
                Sprechgeschwindigkeit zu üben.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}