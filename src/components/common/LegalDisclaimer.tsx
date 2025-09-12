import React from 'react'

export default function LegalDisclaimer() {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 backdrop-blur border border-white/20 rounded-xl p-4 text-center text-white/70 text-xs">
          <p className="mb-2">
             <strong>Educational Portfolio Project</strong> - For demonstration purposes only
          </p>
          <p>
            Music clips used under Fair Use for educational content. No commercial use intended. 
            All rights belong to respective copyright holders.
          </p>
        </div>
      </div>
    </div>
  )
}

export function FooterDisclaimer() {
  return (
    <footer className="bg-[#070a18] border-t border-white/10 py-8 px-4">
      <div className="max-w-4xl mx-auto text-center text-white/60 text-sm space-y-4">
        
        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <h3 className="font-bold text-white mb-2">📜 Legal Notice</h3>
          <p className="text-xs leading-relaxed">
            This is an educational portfolio project created for demonstration purposes only. 
            Music clips are used under Fair Use provisions for educational content, commentary, and criticism. 
            No commercial use is intended. All music content belongs to their respective copyright holders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <h4 className="font-semibold text-white/80 mb-1">🎯 Purpose</h4>
            <p>Educational demonstration<br/>Portfolio showcase<br/>No commercial use</p>
          </div>
          <div>
            <h4 className="font-semibold text-white/80 mb-1">⏱️ Usage</h4>
            <p>Short clips (15-30 seconds)<br/>Transformative content<br/>Educational context</p>
          </div>
          <div>
            <h4 className="font-semibold text-white/80 mb-1">🤝 Fair Use</h4>
            <p>Non-commercial<br/>Educational purpose<br/>Limited excerpt</p>
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 text-xs">
          <p>
            If you are a copyright holder and wish to have content removed, please contact: 
            <span className="text-fuchsia-400"> [your-email@domain.com]</span>
          </p>
        </div>

        <div className="text-xs text-white/40">
          © 2025 BeatBattle Quiz - Educational Portfolio Project by [Your Name]
        </div>
      </div>
    </footer>
  )
}
