import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Vote, LayoutDashboard, ShieldAlert, CheckCircle2, 
  Clock, AlertCircle, Plus, Trash2, Settings, UserCheck, 
  TrendingUp, BarChart3, ChevronRight, X, Lock, Key, CalendarClock, Unlock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, doc, setDoc, getDoc, collection, onSnapshot, 
  deleteDoc, updateDoc, increment 
} from 'firebase/firestore';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'student-council-v1';

// Strict Path Helpers (Rule 1)
const getPublicCollection = (collectionName) => collection(db, 'artifacts', appId, 'public', 'data', collectionName);
const getPublicDoc = (collectionName, docId) => doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);

const POSITIONS = [
  'President', 
  'Vice President', 
  'Secretary', 
  'Auditor', 
  'Treasurer', 
  'Project Manager', 
  'Grade Representative'
];

const GRADES = ['7', '8', '9', '10'];

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'vote', 'admin'
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [settings, setSettings] = useState({ 
    totalRegisteredVoters: 500, 
    electionActive: false, 
    adminPin: 'ADMIN2026',
    voterUnlockPin: 'VOTE2026',
    startTime: '08:00',
    endTime: '16:00'
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  const [secretClicks, setSecretClicks] = useState(0);
  const [showHiddenNav, setShowHiddenNav] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to Candidates
    const unsubCandidates = onSnapshot(
      getPublicCollection('candidates'),
      (snapshot) => {
        const cands = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setCandidates(cands);
      },
      (err) => console.error(err)
    );

    // Listen to Voters
    const unsubVoters = onSnapshot(
      getPublicCollection('voters'),
      (snapshot) => {
        const vts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setVoters(vts);
      },
      (err) => console.error(err)
    );

    // Listen to Settings
    const unsubSettings = onSnapshot(
      getPublicDoc('settings', 'config'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        } else {
          // Initialize default settings with election closed by default
          setDoc(getPublicDoc('settings', 'config'), { 
            totalRegisteredVoters: 500, 
            electionActive: false,
            adminPin: 'ADMIN2026',
            voterUnlockPin: 'VOTE2026',
            startTime: '08:00',
            endTime: '16:00'
          });
        }
        setLoading(false);
      },
      (err) => console.error(err)
    );

    return () => {
      unsubCandidates();
      unsubVoters();
      unsubSettings();
    };
  }, [user]);

  const isAdminLockoutActive = useMemo(() => {
    if (!settings.electionActive) return false;
    if (!settings.startTime || !settings.endTime) return false;

    // Convert current local time to total minutes past midnight
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Parse scheduled start/end times safely
    const [sH, sM] = settings.startTime.split(':').map(Number);
    const [eH, eM] = settings.endTime.split(':').map(Number);
    
    const startMinutes = sH * 60 + (sM || 0);
    const endMinutes = eH * 60 + (eM || 0);

    // Active lockout occurs only if the current time falls inside the scheduled window
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }, [settings.electionActive, settings.startTime, settings.endTime, currentTime]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <div className="animate-spin mr-3"><CheckCircle2 size={32} /></div>
        <span className="text-xl font-semibold tracking-wider">INITIALIZING SYSTEM...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl backdrop-blur-md border animate-in fade-in slide-in-from-top-5 ${
          toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-200' : 
          toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 
          'bg-indigo-500/20 border-indigo-500/50 text-indigo-200'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Top Navigation */}
      {currentView !== 'vote' && (
      <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <div 
              className="flex items-center gap-3 cursor-pointer select-none"
              onClick={() => {
                const newCount = secretClicks + 1;
                setSecretClicks(newCount);
                if (newCount >= 5) {
                  setShowHiddenNav(!showHiddenNav);
                  setSecretClicks(0);
                  showToast("Secret menu toggled. Supervised navigation unlocked.", "success");
                }
              }}
            >
              <div className="bg-indigo-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
                  Student Council
                  {!showHiddenNav && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase tracking-widest">Public</span>}
                </h1>
                <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider">Election System 2026</p>
              </div>
            </div>

            <div className="flex gap-2">
              <NavBtn active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} icon={<LayoutDashboard size={18}/>} label="Live Board" />
              {showHiddenNav && (
                <>
                  <NavBtn active={currentView === 'vote'} onClick={() => {setCurrentView('vote'); setShowHiddenNav(false);}} icon={<UserCheck size={18}/>} label="Vote Now" highlight />
                  <NavBtn active={currentView === 'admin'} onClick={() => setCurrentView('admin')} icon={<ShieldAlert size={18}/>} label="Admin Console" />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <LiveDashboard candidates={candidates} voters={voters} settings={settings} />}
        {currentView === 'vote' && <VotingInterface candidates={candidates} settings={settings} showToast={showToast} returnToDashboard={() => setCurrentView('dashboard')} />}
        {currentView === 'admin' && (
          <AdminDashboard 
            candidates={candidates} 
            settings={settings} 
            showToast={showToast} 
            isLockoutActive={isAdminLockoutActive}
            currentTime={currentTime}
          />
        )}
      </main>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        active 
          ? highlight ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-slate-800 text-white' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
      } ${highlight && !active ? 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : ''}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function LiveDashboard({ candidates, voters, settings }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalVotes = voters.length;
  const turnoutPercent = settings.totalRegisteredVoters > 0 
    ? Math.min(100, Math.round((totalVotes / settings.totalRegisteredVoters) * 100)) 
    : 0;

  // Group and sort candidates
  const groupedCandidates = useMemo(() => {
    const groups = {};
    POSITIONS.forEach(pos => groups[pos] = []);
    candidates.forEach(c => {
      if (groups[c.position]) {
        groups[c.position].push(c);
      }
    });
    
    // Sort by votes
    Object.keys(groups).forEach(pos => {
      groups[pos].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    });
    return groups;
  }, [candidates]);

  // Helper format time format
  const formatTimeTwelve = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Media Board Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-10">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-red-400 font-bold uppercase tracking-widest text-sm">Live Coverage</span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30 flex items-center gap-1">
                <Clock size={12} /> Scheduled Polling: {formatTimeTwelve(settings.startTime)} - {formatTimeTwelve(settings.endTime)}
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">Official Tally Board</h2>
            <p className="text-slate-400 mt-2 text-lg">Real-time election results synchronization</p>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 min-w-[200px] text-center backdrop-blur-sm">
            <Clock className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <div className="text-2xl font-mono font-bold text-white tracking-wider">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-xs text-slate-500 mt-1 uppercase">PST Standard Time</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard icon={<Users />} label="Registered Voters" value={settings.totalRegisteredVoters} color="indigo" />
        <MetricCard icon={<CheckCircle2 />} label="Transmitted Ballots" value={totalVotes} color="emerald" />
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Voter Turnout</span>
            <span className="text-2xl font-bold text-white">{turnoutPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${turnoutPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {POSITIONS.map(position => {
          if (position === 'Grade Representative') return null; // Handled separately
          
          const positionCandidates = groupedCandidates[position] || [];
          const totalPosVotes = positionCandidates.reduce((sum, c) => sum + (c.votes || 0), 0);
          const isProjectManager = position === 'Project Manager';

          return (
            <div key={position} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">{position}</h3>
                <span className="text-xs font-semibold px-3 py-1 bg-slate-950 rounded-full text-slate-300">
                  {totalPosVotes} votes cast
                </span>
              </div>
              <div className="p-6 space-y-4">
                {positionCandidates.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">No candidates registered.</p>
                ) : (
                  positionCandidates.map((candidate, idx) => {
                    const isWinning = isProjectManager ? idx < 2 && candidate.votes > 0 : idx === 0 && candidate.votes > 0;
                    const percent = totalPosVotes > 0 ? ((candidate.votes || 0) / totalPosVotes) * 100 : 0;
                    
                    return (
                      <div key={candidate.id} className={`relative rounded-xl p-4 transition-all ${isWinning ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-950/50 border border-slate-800'}`}>
                        {isWinning && (
                          <div className="absolute top-4 right-4 flex items-center gap-1 text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                            <TrendingUp size={14} /> Leading
                          </div>
                        )}
                        <div className="flex justify-between items-end mb-3">
                          <div>
                            <h4 className={`font-bold text-lg ${isWinning ? 'text-emerald-300' : 'text-slate-200'}`}>
                              {candidate.name}
                            </h4>
                            <p className="text-sm text-slate-400">{candidate.party}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{candidate.votes || 0}</div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-1 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-1000 ${isWinning ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-xs text-slate-500">{percent.toFixed(1)}%</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grade Representatives Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg mt-8">
        <div className="bg-slate-800/80 px-6 py-5 border-b border-slate-700">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-indigo-400" /> Grade Representatives
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {GRADES.map(grade => {
            const reps = (groupedCandidates['Grade Representative'] || []).filter(c => c.gradeLevel === grade);
            const totalRepVotes = reps.reduce((sum, c) => sum + (c.votes || 0), 0);
            return (
              <div key={grade} className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <h4 className="text-center font-bold text-indigo-300 mb-4 pb-2 border-b border-slate-800">Grade {grade}</h4>
                {reps.length === 0 ? (
                  <p className="text-slate-600 text-xs text-center">No candidates</p>
                ) : (
                  <div className="space-y-3">
                    {reps.map((c, idx) => (
                      <div key={c.id} className={`p-3 rounded-lg border ${idx === 0 && c.votes > 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm font-medium text-slate-200 leading-tight">{c.name}</div>
                          <div className="text-sm font-bold text-white bg-slate-800 px-2 rounded">{c.votes || 0}</div>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                          <div className={`h-1 rounded-full ${idx === 0 && c.votes > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} style={{ width: `${totalRepVotes > 0 ? ((c.votes || 0) / totalRepVotes) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }) {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  };
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center gap-5 shadow-sm">
      <div className={`p-4 rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</div>
        <div className="text-3xl font-extrabold text-white">{value.toLocaleString()}</div>
      </div>
    </div>
  );
}

function VotingInterface({ candidates, settings, showToast, returnToDashboard }) {
  const [step, setStep] = useState(0); // 0: ELECOM Unlock, 1: Voter Auth, 2: Ballot, 3: Review, 4: Success
  const [isTerminalUnlocked, setIsTerminalUnlocked] = useState(false);
  const [elecomUnlockPin, setElecomUnlockPin] = useState('');
  const [studentInfo, setStudentInfo] = useState({ id: '', grade: '7' });
  const [selections, setSelections] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if terminal is already unlocked in this memory state
  useEffect(() => {
    if (isTerminalUnlocked) {
      setStep(1); // Proceed directly to voter login
    } else {
      setStep(0); // Require initial ELECOM unlocking passkey
    }
  }, [isTerminalUnlocked]);

  // Handle transition to next voter
  const handleNextVoter = () => {
    setStudentInfo({ id: '', grade: '7' });
    setSelections({});
    
    // Instead of going to step 0 and asking ELECOM to type the password again,
    // we go straight to Step 1 (Voter Identification login screen).
    setStep(1); 
    showToast("Terminal ready for next student.", "info");
  };

  const handleElecomUnlock = (e) => {
    e.preventDefault();
    const correctPin = settings?.voterUnlockPin || 'VOTE2026';
    if (elecomUnlockPin === correctPin) {
      setIsTerminalUnlocked(true);
      setStep(1);
      showToast("Voting terminal unlocked for continuous student sessions.", "success");
    } else {
      showToast("Invalid ELECOM Passkey.", "error");
    }
  };

  const handleLockTerminal = () => {
    setIsTerminalUnlocked(false);
    setElecomUnlockPin('');
    setStep(0);
    showToast("Terminal locked manually.", "info");
  };

  // Group candidates for the ballot
  const groupedCandidates = useMemo(() => {
    const groups = {};
    POSITIONS.forEach(pos => groups[pos] = []);
    candidates.forEach(c => {
      if (groups[c.position]) groups[c.position].push(c);
    });
    return groups;
  }, [candidates]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!settings.electionActive) {
      showToast("The election is currently closed.", "error");
      return;
    }
    
    // Validate Student ID structure
    const cleanedId = studentInfo.id.trim().toUpperCase();
    if (cleanedId.length < 4) {
      showToast("Please enter a valid Student ID.", "error");
      return;
    }

    try {
      const docRef = getPublicDoc('voters', cleanedId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        showToast("Error: This Student ID has already cast a ballot.", "error");
        return;
      }
      setStep(2);
      showToast("Identity verified. Proceeding to ballot.", "success");
    } catch (error) {
      console.error(error);
      showToast("System error verifying ID.", "error");
    }
  };

  const handleSelection = (position, candidateId) => {
    if (position === 'Project Manager') {
      const current = selections[position] || [];
      if (current.includes(candidateId)) {
        setSelections({ ...selections, [position]: current.filter(id => id !== candidateId) });
      } else {
        if (current.length >= 2) {
          showToast("You can only select up to 2 Project Managers.", "error");
          return;
        }
        setSelections({ ...selections, [position]: [...current, candidateId] });
      }
    } else {
      setSelections({ ...selections, [position]: candidateId });
    }
  };

  const submitBallot = async () => {
    setIsSubmitting(true);
    const cleanedId = studentInfo.id.trim().toUpperCase();
    try {
      const voterRef = getPublicDoc('voters', cleanedId);
      const docSnap = await getDoc(voterRef);
      if (docSnap.exists()) throw new Error("ALREADY_VOTED");

      // Save Student ID block in Firestore with server metadata
      await setDoc(voterRef, {
        grade: studentInfo.grade,
        votedAt: new Date().toISOString()
      });

      const updates = [];
      for (const [position, selection] of Object.entries(selections)) {
        if (Array.isArray(selection)) {
          selection.forEach(id => {
            updates.push(updateDoc(getPublicDoc('candidates', id), { votes: increment(1) }));
          });
        } else if (selection) {
          updates.push(updateDoc(getPublicDoc('candidates', selection), { votes: increment(1) }));
        }
      }
      await Promise.all(updates);

      setStep(4);
      showToast("Ballot submitted successfully!", "success");
    } catch (error) {
      console.error(error);
      if (error.message === "ALREADY_VOTED") {
        showToast("Transaction Failed: Student has already voted.", "error");
      } else {
        showToast("Failed to submit ballot. Please try again.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!settings.electionActive && step !== 4) {
    return (
      <div className="max-w-xl mx-auto mt-20 bg-red-500/10 border border-red-500/30 rounded-2xl p-10 text-center animate-in fade-in">
        <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold text-white mb-2">Election Closed</h2>
        <p className="text-slate-400 mb-6">The voting portal is currently closed or in pre-election state.</p>
        <button 
          onClick={returnToDashboard} 
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Kiosk Escape & Continuous Lock controls (Supervisor Only) */}
      <div className="flex justify-between items-center mb-6 px-2 text-xs text-slate-500">
        <span>COMLAB KIOSK ACTIVE</span>
        {isTerminalUnlocked && (
          <div className="flex gap-4">
            <button 
              onClick={handleLockTerminal}
              className="text-amber-500/80 hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <Lock size={12} /> Lock Booth
            </button>
            <button 
              onClick={returnToDashboard}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Exit to Board
            </button>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      {step > 0 && step < 4 && (
        <div className="mb-8 flex items-center justify-center gap-4 text-sm font-medium">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : 'text-slate-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600'}`}>1</div>
            Authentication
          </div>
          <div className={`w-12 h-px ${step >= 2 ? 'bg-indigo-500/50' : 'bg-slate-800'}`}></div>
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : 'text-slate-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600'}`}>2</div>
            Official Ballot
          </div>
          <div className={`w-12 h-px ${step >= 3 ? 'bg-indigo-500/50' : 'bg-slate-800'}`}></div>
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400' : 'text-slate-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-indigo-400 bg-indigo-500/20' : 'border-slate-600'}`}>3</div>
            Review & Submit
          </div>
        </div>
      )}

      {/* STEP 0: ELECOM Unlock Station (Enter Passkey Once) */}
      {step === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl max-w-md mx-auto mt-10">
          <div className="text-center mb-8">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white">Voter Station Locked</h2>
            <p className="text-slate-400 text-sm mt-2">ELECOM Supervisor: Enter the <strong>Voter Station Passkey</strong> once to activate this terminal for all students.</p>
          </div>
          <form onSubmit={handleElecomUnlock} className="space-y-5">
            <div>
              <input 
                type="password" 
                required
                placeholder="ELECOM Vote Passkey"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-center text-white font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                value={elecomUnlockPin}
                onChange={e => setElecomUnlockPin(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-amber-500/35 transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              Unlock Station <ChevronRight size={18} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 1: Login */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl max-w-md mx-auto">
          <div className="text-center mb-8">
            <UserCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Voter Verification</h2>
            <p className="text-slate-400 text-sm mt-2">Provide voter credentials to retrieve ballot eligibility status.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Student ID Number</label>
              <input 
                type="text" 
                required
                placeholder="e.g. 2026-0001"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                value={studentInfo.id}
                onChange={e => setStudentInfo({...studentInfo, id: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Grade Level</label>
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
                value={studentInfo.grade}
                onChange={e => setStudentInfo({...studentInfo, grade: e.target.value})}
              >
                {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex justify-center items-center gap-2 mt-4"
            >
              Verify Credentials <ChevronRight size={18} />
            </button>
          </form>
          <div className="mt-6 p-4 bg-slate-950/50 rounded-lg border border-slate-800 text-xs text-slate-500 flex gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>Your choices are completely anonymous. Your Student ID is used exclusively to verify eligibility and block duplication.</p>
          </div>
        </div>
      )}

      {/* STEP 2: The Ballot */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex justify-between items-center sticky top-20 z-30 backdrop-blur-xl bg-slate-900/90">
            <div>
              <h2 className="text-xl font-bold text-white">Official Ballot Form</h2>
              <p className="text-slate-400 text-sm">Select your candidates carefully.</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Secured Session</div>
              <div className="font-mono font-bold text-indigo-400">{studentInfo.id} (Gr. {studentInfo.grade})</div>
            </div>
          </div>

          {POSITIONS.map(position => {
            let posCandidates = candidates.filter(c => c.position === position);
            if (position === 'Grade Representative') {
              posCandidates = posCandidates.filter(c => c.gradeLevel === studentInfo.grade);
            }
            
            const isPM = position === 'Project Manager';
            const selected = selections[position];

            return (
              <div key={position} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">{position}</h3>
                  {isPM && <span className="text-xs font-semibold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded">Select up to 2</span>}
                </div>
                <div className="p-6">
                  {posCandidates.length === 0 ? (
                    <p className="text-slate-500 italic">No candidates available for this position.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {posCandidates.map(c => {
                        const isSelected = isPM ? (selected || []).includes(c.id) : selected === c.id;
                        return (
                          <div 
                            key={c.id}
                            onClick={() => handleSelection(position, c.id)}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4
                              ${isSelected 
                                ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                : 'bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-${isPM ? 'sm' : 'full'} border-2 flex items-center justify-center shrink-0 transition-colors
                              ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-600'}`}>
                              {isSelected && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div>
                              <div className={`font-bold ${isSelected ? 'text-indigo-300' : 'text-slate-200'}`}>{c.name}</div>
                              <div className="text-sm text-slate-500">{c.party}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-4">
            <button 
              onClick={() => setStep(3)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2"
            >
              Review Choices <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review Selection */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <BarChart3 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Review Your Ballot</h2>
            <p className="text-slate-400 text-sm mt-2">Verify selections before final confirmation.</p>
          </div>
          
          <div className="space-y-4 mb-8">
            {POSITIONS.map(position => {
              const selected = selections[position];
              let displayName = <span className="text-slate-500 italic">Abstained</span>;
              
              if (selected) {
                if (Array.isArray(selected) && selected.length > 0) {
                  const names = selected.map(id => candidates.find(c => c.id === id)?.name).join(' & ');
                  displayName = <span className="font-semibold text-emerald-300">{names}</span>;
                } else if (!Array.isArray(selected)) {
                  const name = candidates.find(c => c.id === selected)?.name;
                  displayName = <span className="font-semibold text-emerald-300">{name}</span>;
                }
              }

              if (position === 'Grade Representative') {
                const hasCandidatesForGrade = candidates.some(c => c.position === position && c.gradeLevel === studentInfo.grade);
                if (!hasCandidatesForGrade) return null;
              }

              return (
                <div key={position} className="flex justify-between items-center py-3 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400 text-sm">{position}</span>
                  <div className="text-right text-sm">{displayName}</div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setStep(2)}
              disabled={isSubmitting}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              Modify Selection
            </button>
            <button 
              onClick={submitBallot}
              disabled={isSubmitting}
              className="flex-2 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-300 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-500/30 transition-all flex justify-center items-center gap-2"
            >
              {isSubmitting ? <span className="animate-spin"><CheckCircle2 size={18}/></span> : <CheckCircle2 size={18} />}
              {isSubmitting ? 'Submitting Ballot...' : 'Confirm Submission'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Success Screen */}
      {step === 4 && (
        <div className="max-w-md mx-auto mt-20 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-10 text-center animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Ballot Cast Successfully</h2>
          <p className="text-slate-400 mb-8">Thank you for voting. Your record has been registered. Please exit the booth so the next student can queue.</p>
          <button 
            onClick={handleNextVoter}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex justify-center items-center gap-2 text-sm"
          >
            Terminal Ready For Next Student
          </button>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ candidates, settings, showToast, isLockoutActive, currentTime }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates', 'settings'
  
  // Form State
  const [newCandidate, setNewCandidate] = useState({ name: '', position: 'President', party: '', gradeLevel: '7' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Security & Settings Form State
  const [securityForm, setSecurityForm] = useState({ 
    adminPin: '', 
    voterUnlockPin: '',
    startTime: '08:00',
    endTime: '16:00',
    totalRegisteredVoters: 500
  });
  
  // Custom Modal for opening election and changing credentials
  const [showOpenElectionModal, setShowOpenElectionModal] = useState(false);
  const [openElectionForm, setOpenElectionForm] = useState({
    newAdminPin: '',
    newVoterUnlockPin: ''
  });

  const [resetModal, setResetModal] = useState({ show: false, input: '' });

  useEffect(() => {
    if (settings) {
      setSecurityForm({ 
        adminPin: settings.adminPin || 'ADMIN2026',
        voterUnlockPin: settings.voterUnlockPin || 'VOTE2026',
        startTime: settings.startTime || '08:00',
        endTime: settings.endTime || '16:00',
        totalRegisteredVoters: settings.totalRegisteredVoters || 500
      });
    }
  }, [settings]);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctPin = settings?.adminPin || 'ADMIN2026';
    if (pin === correctPin) {
      setIsAuthenticated(true);
      showToast("Access granted to Admin Panel.", "success");
    } else {
      showToast("Invalid admin verification PIN.", "error");
      setPin('');
    }
  };

  const addCandidate = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const newRef = doc(getPublicCollection('candidates'));
      await setDoc(newRef, {
        ...newCandidate,
        votes: 0
      });
      showToast("Candidate registered successfully.", "success");
      setNewCandidate({ name: '', position: 'President', party: '', gradeLevel: '7' });
    } catch (err) {
      console.error(err);
      showToast("Failed to register candidate.", "error");
    }
    setIsProcessing(false);
  };

  const deleteCandidate = async (id) => {
    try {
      await deleteDoc(getPublicDoc('candidates', id));
      showToast("Candidate removed from pool.", "info");
    } catch (err) {
      showToast("Failed to remove candidate.", "error");
    }
  };

  const handleOpenElectionClick = () => {
    if (!settings.electionActive) {
      setOpenElectionForm({
        newAdminPin: settings.adminPin || '',
        newVoterUnlockPin: settings.voterUnlockPin || ''
      });
      setShowOpenElectionModal(true);
    } else {
      toggleElectionState(false);
    }
  };

  const toggleElectionState = async (targetActiveState, overrideKeys = null) => {
    try {
      const payload = {
        electionActive: targetActiveState
      };
      if (overrideKeys) {
        payload.adminPin = overrideKeys.adminPin;
        payload.voterUnlockPin = overrideKeys.voterUnlockPin;
      }
      await updateDoc(getPublicDoc('settings', 'config'), payload);
      showToast(`Election Portal is now ${targetActiveState ? 'OPENED' : 'CLOSED'}.`, "info");
      
      if (targetActiveState) {
        setShowOpenElectionModal(false);
      }
    } catch (err) {
      console.error(err);
      showToast("Error toggling election status.", "error");
    }
  };

  const confirmOpenWithNewCredentials = (e) => {
    e.preventDefault();
    if (!openElectionForm.newAdminPin || !openElectionForm.newVoterUnlockPin) {
      showToast("Both security codes must be configured.", "error");
      return;
    }
    toggleElectionState(true, {
      adminPin: openElectionForm.newAdminPin,
      voterUnlockPin: openElectionForm.newVoterUnlockPin
    });
  };

  const saveConfigSettings = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await updateDoc(getPublicDoc('settings', 'config'), {
        adminPin: securityForm.adminPin,
        voterUnlockPin: securityForm.voterUnlockPin,
        startTime: securityForm.startTime,
        endTime: securityForm.endTime,
        totalRegisteredVoters: Number(securityForm.totalRegisteredVoters)
      });
      showToast("Configuration profiles updated successfully.", "success");
    } catch(err) {
      showToast("Failed to update configurations.", "error");
    }
    setIsProcessing(false);
  };

  const initiateReset = () => {
    setResetModal({ show: true, input: '' });
  };

  const confirmReset = async () => {
    const correctPin = settings?.adminPin || 'ADMIN2026';
    if (resetModal.input !== correctPin) {
      showToast("Verification failed: Admin PIN incorrect.", "error");
      return;
    }
    
    setIsProcessing(true);
    try {
      const updates = candidates.map(c => updateDoc(getPublicDoc('candidates', c.id), { votes: 0 }));
      await Promise.all(updates);
      
      showToast("Vote counts successfully reset to 0.", "success");
      setResetModal({ show: false, input: '' });
    } catch (err) {
      showToast("Error resetting vote tallies.", "error");
    }
    setIsProcessing(false);
  };

  const formatTimeTwelve = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const timeDetails = useMemo(() => {
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [sH, sM] = (settings?.startTime || '08:00').split(':').map(Number);
    const [eH, eM] = (settings?.endTime || '16:00').split(':').map(Number);
    return {
      current: currentMins,
      start: sH * 60 + (sM || 0),
      end: eH * 60 + (eM || 0)
    };
  }, [settings, currentTime]);

  /* CRITICAL SECURITY FEATURE: Lockout screen during designated hours */
  if (isLockoutActive) {
    return (
      <div className="max-w-xl mx-auto mt-20 bg-slate-900 border border-red-500/30 rounded-2xl p-10 text-center shadow-2xl animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
          <Lock className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">COMLAB LOCKOUT ENFORCED</h2>
        <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-4">Secured Voting State - Overrides Blocked</p>
        
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-left space-y-3 mb-6">
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
            <span className="text-slate-400">Current Server/Browser Time:</span>
            <span className="font-mono font-semibold text-white">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
            <span className="text-slate-400">Active Lock Window:</span>
            <span className="font-semibold text-amber-400">{formatTimeTwelve(settings.startTime)} to {formatTimeTwelve(settings.endTime)}</span>
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            To guarantee complete ballot transparency and satisfy system compliance requirements, administrative modifications and results overrides are strictly locked down during operational polling hours.
          </div>
        </div>

        <div className="text-xs text-slate-400 italic">
          Admin dashboard will unlock automatically at the close of hours ({formatTimeTwelve(settings.endTime)}).
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
        <ShieldAlert className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Admin Panel Access</h2>
        <p className="text-xs text-slate-500 mb-6">Security Verification Level 1 Required.</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="Admin PIN"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-center text-white font-mono tracking-widest focus:outline-none focus:border-indigo-500 mb-4"
            value={pin}
            onChange={e => setPin(e.target.value)}
          />
          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors">
            Authorize Connection
          </button>
        </form>

        {/* Live status debugger on why admin is allowed/denied */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Unlock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Lockout Evaluation Status</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-1.5 text-[11px] text-slate-400 font-mono">
            <div>Current Local Time: <span className="text-slate-200">{currentTime.toLocaleTimeString()}</span></div>
            <div>Election Portal: <span className={settings.electionActive ? 'text-emerald-400' : 'text-amber-400'}>{settings.electionActive ? 'OPEN' : 'CLOSED'}</span></div>
            <div>Scheduled: <span className="text-slate-200">{settings.startTime} - {settings.endTime}</span></div>
            <div className="pt-2 border-t border-slate-900 text-slate-500 leading-normal font-sans">
              <strong>Info:</strong> Lockout initiates only when the election is <span className="text-slate-300">OPEN</span> and the current browser time falls inside the scheduled window.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-bold text-white">ELECOM Administrative console</h2>
          <p className="text-slate-400 text-sm">Control polling parameters, security protocols, and candidate registration.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'candidates' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>Candidates</button>
          <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>System Settings</button>
        </div>
      </div>

      {activeTab === 'candidates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Candidate Form */}
          <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit sticky top-24">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Plus size={18}/> New Registration</h3>
            <form onSubmit={addCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" value={newCandidate.name} onChange={e => setNewCandidate({...newCandidate, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Position</label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none" value={newCandidate.position} onChange={e => setNewCandidate({...newCandidate, position: e.target.value})}>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {newCandidate.position === 'Grade Representative' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Grade Level</label>
                  <select className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none" value={newCandidate.gradeLevel} onChange={e => setNewCandidate({...newCandidate, gradeLevel: e.target.value})}>
                    {GRADES.map(g => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Party / Affiliation</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" value={newCandidate.party} onChange={e => setNewCandidate({...newCandidate, party: e.target.value})} />
              </div>
              <button disabled={isProcessing} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors mt-2 text-sm">
                Register Candidate
              </button>
            </form>
          </div>

          {/* Candidates List */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            {POSITIONS.map(pos => {
              const posCands = candidates.filter(c => c.position === pos);
              if (posCands.length === 0) return null;
              return (
                <div key={pos} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700 text-sm font-bold text-slate-300">{pos}</div>
                  <div className="divide-y divide-slate-800">
                    {posCands.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-4 hover:bg-slate-800/30 transition-colors">
                        <div>
                          <div className="font-semibold text-white">{c.name} {pos === 'Grade Representative' && <span className="text-indigo-400 text-xs ml-2">(Gr. {c.gradeLevel})</span>}</div>
                          <div className="text-xs text-slate-500">{c.party} • {c.votes || 0} votes</div>
                        </div>
                        <button onClick={() => deleteCandidate(c.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-2">
          {/* Core Operations and Action Items */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Settings size={18}/> Active Operations</h3>
              <div className="space-y-6">
                
                {/* Voting Toggle Container */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <div className="font-bold text-white mb-1">Voting Portal</div>
                    <div className="text-xs text-slate-500">Starts or halts election ballot entry.</div>
                  </div>
                  <button 
                    onClick={handleOpenElectionClick}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${settings.electionActive ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'}`}
                  >
                    {settings.electionActive ? 'Close Election' : 'Open Election'}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-red-950/20 rounded-xl border border-red-900/30">
                  <div>
                    <div className="font-bold text-red-400 mb-1">Reset Vote Tallies</div>
                    <div className="text-xs text-red-400/70">Wipes all candidate tallies. Irreversible.</div>
                  </div>
                  <button 
                    disabled={isProcessing}
                    onClick={initiateReset}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors"
                  >
                    Reset Tallies
                  </button>
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><CalendarClock size={18}/> Operational Parameters</h3>
              <form onSubmit={saveConfigSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Start Time (Lockout Start)</label>
                    <input 
                      required 
                      type="time" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      value={securityForm.startTime} 
                      onChange={e => setSecurityForm({...securityForm, startTime: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">End Time (Lockout Release)</label>
                    <input 
                      required 
                      type="time" 
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                      value={securityForm.endTime} 
                      onChange={e => setSecurityForm({...securityForm, endTime: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Total Registered Voters (for Turnout Calculation)</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" 
                    value={securityForm.totalRegisteredVoters} 
                    onChange={e => setSecurityForm({...securityForm, totalRegisteredVoters: e.target.value})} 
                  />
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs text-indigo-300/80 leading-relaxed">
                  <strong>Operational Rule:</strong> Setting the operational window activates the automated administrative lockout. Between the start and end times, the system blocks access to this Admin page to verify complete polling integrity.
                </div>

                <button disabled={isProcessing} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors text-sm">
                  Save Setup Parameters
                </button>
              </form>
            </div>
          </div>

          {/* Security Credentials Setup */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Key size={18}/> Security Codes</h3>
            <form onSubmit={saveConfigSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Admin Configuration PIN</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono" 
                  value={securityForm.adminPin} 
                  onChange={e => setSecurityForm({...securityForm, adminPin: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">ELECOM Voter Station Passkey (Unlocks Kiosk)</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono" 
                  value={securityForm.voterUnlockPin} 
                  onChange={e => setSecurityForm({...securityForm, voterUnlockPin: e.target.value})} 
                />
              </div>
              <button disabled={isProcessing} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors mt-4 text-sm">
                Save Security Codes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Open Election Modal requiring New Password/PIN setup */}
      {showOpenElectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2"><Key className="text-amber-400" /> Security Override Prompt</h3>
              <button onClick={() => setShowOpenElectionModal(false)} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={confirmOpenWithNewCredentials} className="space-y-4">
              <p className="text-slate-300 text-xs leading-relaxed">
                Opening the election requires regenerating the system credentials. Enter the values to authorize this specific session.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New Admin Configuration PIN</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Set safe new admin password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  value={openElectionForm.newAdminPin}
                  onChange={e => setOpenElectionForm({...openElectionForm, newAdminPin: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">New ELECOM Voter Station Passkey</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Set safe new voter station code"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono"
                  value={openElectionForm.newVoterUnlockPin}
                  onChange={e => setOpenElectionForm({...openElectionForm, newVoterUnlockPin: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowOpenElectionModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/20"
                >
                  Confirm & Open Election
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Verification Modal */}
      {resetModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-400">Critical Action: Reset Votes</h3>
              <button onClick={() => setResetModal({ show: false, input: '' })} className="text-slate-500 hover:text-white transition-colors"><X size={20}/></button>
            </div>
            
            <div>
              <p className="text-slate-300 text-sm mb-4">
                You are resetting all candidate votes to zero. Enter the Admin PIN to confirm.
              </p>
              <input 
                type="password" 
                placeholder="Admin PIN"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-center text-white font-mono tracking-widest text-xl focus:outline-none focus:border-red-500 mb-6"
                value={resetModal.input}
                onChange={e => setResetModal({...resetModal, input: e.target.value})}
              />
              <button 
                disabled={isProcessing || !resetModal.input}
                onClick={confirmReset}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:text-red-300 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {isProcessing ? 'Resetting...' : 'Confirm Total Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}