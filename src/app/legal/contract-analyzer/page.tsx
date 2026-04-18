'use client';

import React, { useState, useRef } from 'react';
import { DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { analyzeContract, type ContractAnalysis } from '@/lib/ai/legalAnalyzer';

export default function LegalContractAnalyzerPage() {
  const [contractText, setContractText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setContractText(content);
      };
      reader.readAsText(file);
    } else {
      // For PDF files, in a real implementation you would use a PDF parser
      setContractText("PDF-Inhalt würde hier nach dem Parsen erscheinen...");
    }
  };

  const analyzeContractText = async () => {
    if (!contractText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const result = await analyzeContract(contractText.trim());
      setAnalysis(result);
    } catch (error) {
      console.error('Contract analysis failed:', error);
    }
    setIsAnalyzing(false);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'medium': return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'low': return <CheckCircleIcon className="h-5 w-5" />;
      default: return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <DocumentTextIcon className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Legal Contract Analyzer</h1>
            <p className="text-gray-600">KI-gestützte Analyse von Arbeitsverträgen und Rechtsdokumenten</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">Vertrag hochladen oder eingeben</h2>
              
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datei hochladen (PDF, TXT)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt"
                    className="hidden"
                  />
                  <div className="text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        Datei auswählen
                      </button>
                    </div>
                    {uploadedFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Ausgewählt: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-500 mb-4">oder</div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vertragstext direkt eingeben
                </label>
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Füge hier den Vertragstext ein..."
                  rows={12}
                  className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono"
                />
              </div>

              <button
                onClick={analyzeContractText}
                disabled={!contractText.trim() || isAnalyzing}
                className="w-full mt-4 bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Analysiere Vertrag...
                  </>
                ) : (
                  <>
                    <DocumentTextIcon className="h-5 w-5" />
                    Vertrag analysieren
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysis ? (
              <>
                {/* Risk Summary */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Risikobewertung</h3>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl font-bold text-gray-900">
                      {100 - analysis.overallScore}/100
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            (100 - analysis.overallScore) >= 70 ? 'bg-red-500' :
                            (100 - analysis.overallScore) >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${100 - analysis.overallScore}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {(100 - analysis.overallScore) >= 70 ? 'Hohes Risiko' :
                         (100 - analysis.overallScore) >= 40 ? 'Mittleres Risiko' : 'Niedriges Risiko'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {analysis.clauses.filter(c => c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL').length}
                      </div>
                      <div className="text-sm text-red-700">Hohes Risiko</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {analysis.clauses.filter(c => c.riskLevel === 'MEDIUM').length}
                      </div>
                      <div className="text-sm text-yellow-700">Mittleres Risiko</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {analysis.clauses.filter(c => c.riskLevel === 'LOW').length}
                      </div>
                      <div className="text-sm text-green-700">Niedriges Risiko</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-4">Detailierte Klauselanalyse</h3>
                  
                  <div className="space-y-4">
                    {analysis.clauses.map((clause, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${getRiskColor(clause.riskLevel)}`}>
                            {getRiskIcon(clause.riskLevel)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{clause.type}</h4>
                            <p className="text-sm text-gray-600 mt-1">{clause.riskExplanation}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(clause.riskLevel)}`}>
                            {clause.riskLevel === 'HIGH' || clause.riskLevel === 'CRITICAL' ? 'Hoch' :
                             clause.riskLevel === 'MEDIUM' ? 'Mittel' : 'Niedrig'}
                          </span>
                        </div>
                        
                        <div className="bg-gray-50 rounded p-3 mb-3">
                          <p className="text-sm text-gray-700 italic">
                            &quot;{clause.text}&quot;
                          </p>
                        </div>

                        {clause.recommendation && (
                          <div className="border-t pt-3 mt-3">
                            <h5 className="font-medium text-gray-900 mb-2">Empfehlungen:</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                              <li key={0}>{clause.recommendation}</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Bereit für die Analyse
                </h3>
                <p className="text-gray-600">
                  Lade einen Vertrag hoch oder füge den Text ein, um mit der 
                  KI-gestützten Risikoanalyse zu beginnen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Rechtlicher Hinweis</h3>
              <p className="text-yellow-700 text-sm leading-relaxed">
                Diese Software stellt keine Rechtsberatung dar. Die Analyse dient ausschließlich 
                der ersten Einschätzung und ersetzt nicht die Beratung durch einen qualifizierten 
                Rechtsanwalt. Für rechtlich bindende Bewertungen konsultieren Sie bitte einen 
                Fachanwalt für Arbeitsrecht.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}