import React from "react";

interface ConfigPanelProps {
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
  lambdaUrlOverride: string;
  setLambdaUrlOverride: (url: string) => void;
  envUrl: string;
  effectiveLambdaUrl: string;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  showConfig,
  setShowConfig,
  lambdaUrlOverride,
  setLambdaUrlOverride,
  envUrl,
  effectiveLambdaUrl,
}) => {
  if (!showConfig) return null;

  return (
    <div className={`lambda-config-box ${!effectiveLambdaUrl ? 'needs-config' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
         <h2 style={{ margin: 0, fontSize: '1.1rem' }}>API Configuration</h2>
         <button onClick={() => setShowConfig(false)} className="close-btn" aria-label="Close configuration">&times;</button>
      </div>
      
      <div style={{ marginBottom: '1.5rem' }}>
         <p className="subtle-text" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
           This app uses a dedicated AWS Lambda to bypass regional restrictions and scrape global pricing data.
         </p>
         
         <div style={{ backgroundColor: 'light-dark(rgba(0,0,0,0.03), rgba(255,255,255,0.03))', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid light-dark(#e2e8f0, #334155)' }}>
           <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 0, marginBottom: '0.75rem', color: 'light-dark(#64748b, #94a3b8)' }}>Setup Instructions</h3>
           <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: 'light-dark(#475569, #cbd5e1)' }}>
             <li><strong>Download:</strong> Get the <a href="/scraper-lambda.zip" download className="subtle-link" style={{ color: '#2563eb', fontWeight: 600 }}>scraper-lambda.zip</a> package.</li>
             <li><strong>Create Lambda:</strong> In AWS Console, create a <strong>Node.js 24.x</strong> function.</li>
             <li><strong>Resources:</strong> Set Memory to <strong>3000 MB</strong> and Timeout to <strong>45 seconds</strong> (under Configuration &gt; General).</li>
             <li><strong>Upload:</strong> Click <strong>Upload from</strong> &gt; <strong>.zip file</strong>, and upload the zip.</li>
             <li><strong>Endpoint:</strong> Go to Configuration &gt; <strong>Function URL</strong>, click Create, and set Auth to <strong>NONE</strong>.</li>
             <li><strong>Paste:</strong> Copy the generated URL and enter it below.</li>
           </ol>
         </div>

         <a 
           href="/scraper-lambda.zip" 
           download="scraper-lambda.zip" 
           className="download-link"
           style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}
         >
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
             <polyline points="7 10 12 15 17 10"></polyline>
             <line x1="12" y1="3" x2="12" y2="15"></line>
           </svg>
           Download Scraper Package (.zip)
         </a>
      </div>

      <div className="search-form" style={{ maxWidth: 'none' }}>
        <input 
          type="text" 
          placeholder={envUrl || "Paste Function URL (https://...lambda-url.aws/)"}
          value={lambdaUrlOverride}
          onChange={(e) => setLambdaUrlOverride(e.target.value)}
          aria-label="Lambda Function URL"
        />
        {lambdaUrlOverride && (
          <button type="button" onClick={() => setLambdaUrlOverride("")} style={{ backgroundColor: '#64748b' }}>Reset</button>
        )}
      </div>
      {!effectiveLambdaUrl && <p className="error-text" style={{ marginTop: '0.5rem' }}>⚠️ A valid Lambda URL is required to fetch data.</p>}
    </div>
  );
};
