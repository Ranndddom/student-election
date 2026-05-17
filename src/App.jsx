import React, { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle, AlertCircle, Users, Settings, Lock, Key, 
  CalendarClock, Unlock, ChevronRight, X, LayoutDashboard, Vote, ShieldAlert
} from "lucide-react";

export default function App() {
  // --- SYSTEM STATES ---
  const [electionActive, setElectionActive] = useState(() => {
    return localStorage.getItem("electionActive") === "true";
  });
  const [isTerminalUnlocked, setIsTerminalUnlocked] = useState(() => {
    return localStorage.getItem("isTerminalUnlocked") === "true";
  });
  
  // Credentials
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem("adminPin") || "1234");
  const [voterUnlockPin, setVoterUnlockPin] = useState(() => localStorage.getItem("voterUnlockPin") || "5678");
  
  // Time-Lock Configurations (Default: 8:00 AM to 4:00 PM)
  const [startTime, setStartTime] = useState(() => localStorage.getItem("startTime") || "08:00");
  const [endTime, setEndTime] = useState(() => localStorage.getItem("endTime") || "16:00");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Voting Session States
  const [step, setStep] = useState(1); // 1: Login, 2: Ballot, 3: Success
  const [studentId, setStudentId] = useState("");
  const [studentGrade, setStudentGrade] = useState("7");
  const [selectedCandidates, setSelectedCandidates] = useState({}); // { Position: CandidateId or [IDs] }
  
  // Input tracking for entry screens
  const [elecomInput, setElecomInput] = useState("");
  const [adminPinInput, setAdminPinInput] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard", "voter", "admin"
  
  // Hidden Controls Easter Egg
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSecretMenu, setShowSecretMenu] = useState(false);

  // Setup Modal States (When opening the election)
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState("");
  const [newElecomPin, setNewElecomPin] = useState("");

  // In-Memory & LocalStorage Database of Casted Votes
  const [votedStudentIds, setVotedStudentIds] = useState(() => {
    const saved = localStorage.getItem("votedStudentIds");
    return saved ? JSON.parse(saved) : [];
  });

  const [voteDatabase, setVoteDatabase] = useState(() => {
    const saved = localStorage.getItem("voteDatabase");
    return saved ? JSON.parse(saved) : {
      1: 42, 2: 38, // President
      3: 50, 4: 30, // VP
      5: 25, 6: 45, // Secretary
      7: 15, 8: 20, 9: 10, // Project Managers
      10: 12, 11: 8,  // Grade 7 Reps
      12: 15, 13: 11, // Grade 8 Reps
      14: 9, 15: 14,  // Grade 9 Reps
      16: 18, 17: 12  // Grade 10 Reps
    };
  });

  // Candidate Directory
  const candidatesList = [
    // Presidents
    { id: 1, name: "Maria Clara", position: "President", party: "Alab Party", grade: null },
    { id: 2, name: "Juan Dela Cruz", position: "President", party: "Siklab Party", grade: null },
    // Vice Presidents
    { id: 3, name: "Jose Rizal", position: "Vice President", party: "Alab Party", grade: null },
    { id: 4, name: "Andres Bonifacio", position: "Vice President", party: "Siklab Party", grade: null },
    // Secretaries
    { id: 5, name: "Apollinario Mabini", position: "Secretary", party: "Alab Party", grade: null },
    { id: 6, name: "Emilio Jacinto", position: "Secretary", party: "Siklab Party", grade: null },
    // Project Managers (Can vote up to 2)
    { id: 7, name: "Antonio Luna", position: "Project Manager", party: "Alab Party", grade: null },
    { id: 8, name: "Melchora Aquino", position: "Project Manager", party: "Siklab Party", grade: null },
    { id: 9, name: "Gabriela Silang", position: "Project Manager", party: "Independent", grade: null },
    // Grade Representatives
    { id: 10, name: "Sarah Geronimo", position: "Grade Rep", party: "Alab Party", grade: "7" },
    { id: 11, name: "Christian Bautista", position: "Grade Rep", party: "Siklab Party", grade: "7" },
    { id: 12, name: "Anne Curtis", position: "Grade Rep", party: "Alab Party", grade: "8" },
    { id: 13, name: "Vice Ganda", position: "Grade Rep", party: "Siklab Party", grade: "8" },
    { id: 14, name: "Kathryn Bernardo", position: "Grade Rep", party: "Alab Party", grade: "9" },
    { id: 15, name: "Daniel Padilla", position: "Grade Rep", party: "Siklab Party", grade: "9" },
    { id: 16, name: "Donny Pangilinan", position: "Grade Rep", party: "Alab Party", grade: "10" },
    { id: 17, name: "Belle Mariano", position: "Grade Rep", party: "Siklab Party", grade: "10" }
  ];

  // Save changes to localStorage to persist through browser restarts
  useEffect(() => {
    localStorage.setItem("electionActive", electionActive);
    localStorage.setItem("isTerminalUnlocked", isTerminalUnlocked);
    localStorage.setItem("adminPin", adminPin);
    localStorage.setItem("voterUnlockPin", voterUnlockPin);
    localStorage.setItem("startTime", startTime);
    localStorage.setItem("endTime", endTime);
    localStorage.setItem("votedStudentIds", JSON.stringify(votedStudentIds));
    localStorage.setItem("voteDatabase", JSON.stringify(voteDatabase));
  }, [electionActive, isTerminalUnlocked, adminPin, voterUnlockPin, startTime, endTime, votedStudentIds, voteDatabase]);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTimeString = useMemo(() => {
    return currentTime.toTimeString().split(' ')[0].substring(0, 5);
  }, [currentTime]);

  // Strict Time Lock Calculation
  const isAdminLockedOut = useMemo(() => {
    if (!electionActive) return false;
    return currentTimeString >= startTime && currentTimeString <= endTime;
  }, [electionActive, currentTimeString, startTime, endTime]);

  // Secret Easter Egg Handler
  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    setLogoClicks(nextClicks);
    if (nextClicks >= 5) {
      setShowSecretMenu(true);
      setLogoClicks(0);
    }
  };

  // --- CONTROLLER HANDLERS ---
  const handleOpenSetupModal = () => {
    setNewAdminPin("");
    setNewElecomPin("");
    setShowSetupModal(true);
  };

  const handleConfirmStartElection = (e) => {
    e.preventDefault();
    if (newAdminPin.trim().length < 4 || newElecomPin.trim().length < 4) {
      alert("Both pins must be at least 4 digits.");
      return;
    }
    setAdminPin(newAdminPin);
    setVoterUnlockPin(newElecomPin);
    setElectionActive(true);
    setIsTerminalUnlocked(false);
    setShowSetupModal(false);
  };

  const handleResetElection = () => {
    if (window.confirm("WARNING: This will completely delete all votes and clear the registered voter records. Are you sure?")) {
      setVotedStudentIds([]);
      setVoteDatabase({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0
      });
      setElectionActive(false);
      setIsTerminalUnlocked(false);
      setStep(1);
      setView("dashboard");
      setShowSecretMenu(false);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPinInput === adminPin) {
      setIsAdminAuthenticated(true);
      setAdminPinInput("");
    } else {
      alert("Incorrect Admin Access PIN!");
    }
  };

  const handleElecomUnlock = (e) => {
    e.preventDefault();
    if (elecomInput === voterUnlockPin) {
      setIsTerminalUnlocked(true);
      setStep(1);
      setElecomInput("");
    } else {
      alert("Invalid ELECOM Kiosk Passkey!");
    }
  };

  const handleStudentLogin = (e) => {
    e.preventDefault();
    const cleanId = studentId.trim().toUpperCase();
    if (!cleanId) {
      alert("Please enter your Student ID.");
      return;
    }
    
    // Check if student has already voted (Double-Voting Protection)
    if (votedStudentIds.includes(cleanId)) {
      alert("ACCESS DENIED: A ballot has already been submitted under this Student ID.");
      setStudentId("");
      return;
    }

    setStudentId(cleanId);
    setSelectedCandidates({});
    setStep(2); // Proceed to digital ballot
  };

  const handleSelectCandidate = (position, candidateId, maxAllowed = 1) => {
    if (maxAllowed === 1) {
      setSelectedCandidates(prev => ({ ...prev, [position]: candidateId }));
    } else {
      const currentSelected = selectedCandidates[position] || [];
      if (currentSelected.includes(candidateId)) {
        setSelectedCandidates(prev => ({
          ...prev,
          [position]: currentSelected.filter(id => id !== candidateId)
        }));
      } else {
        if (currentSelected.length >= maxAllowed) {
          alert(`You can only choose a maximum of ${maxAllowed} candidates for this position.`);
          return;
        }
        setSelectedCandidates(prev => ({
          ...prev,
          [position]: [...currentSelected, candidateId]
        }));
      }
    }
  };

  const handleCastVotes = () => {
    // Check if the student has selected at least one candidate
    if (Object.keys(selectedCandidates).length === 0) {
      alert("You must select at least one candidate before casting your ballot.");
      return;
    }

    // Process vote increment inside local database state
    const updatedDb = { ...voteDatabase };
    Object.values(selectedCandidates).forEach(val => {
      if (Array.isArray(val)) {
        val.forEach(id => {
          updatedDb[id] = (updatedDb[id] || 0) + 1;
        });
      } else {
        updatedDb[val] = (updatedDb[val] || 0) + 1;
      }
    });

    setVoteDatabase(updatedDb);
    setVotedStudentIds(prev => [...prev, studentId]);
    setStep(3); // Go to Success page
  };

  const handleResetForNextVoter = () => {
    setStudentId("");
    setSelectedCandidates({});
    setStep(1); // Return cleanly to student login
  };

  // Turnout Metrics
  const totalRegisteredVoters = 300;
  const transmittedVotesCount = votedStudentIds.length;
  const turnoutPercentage = ((transmittedVotesCount / totalRegisteredVoters) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      
      {/* HEADER BAR (Hidden in Vote Now to avoid student bypasses) */}
      {view !== "voter" && (
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-md">
          <div onClick={handleLogoClick} className="flex items-center space-x-3 cursor-pointer">
            <div className={`h-3.5 w-3.5 rounded-full ${electionActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-lg font-extrabold tracking-wider bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              CLARENDON COLLEGE ELECOM
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-md border border-slate-700 text-indigo-300">
              🕒 {currentTime.toLocaleTimeString()}
            </span>

            {/* Hidden Controls Container (Activated via Easter Egg) */}
            {showSecretMenu ? (
              <div className="flex gap-2 bg-slate-950/50 p-1 rounded-lg border border-indigo-500/30 animate-pulse">
                <button 
                  onClick={() => setView("dashboard")} 
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${view === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Live Board
                </button>
                <button 
                  onClick={() => setView("voter")} 
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${view === "voter" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Vote className="w-3.5 h-3.5" /> Vote Now Kiosk
                </button>
                <button 
                  onClick={() => { setView("admin"); setIsAdminAuthenticated(false); }} 
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 ${view === "admin" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
                >
                  <Settings className="w-3.5 h-3.5" /> Admin Panel
                </button>
              </div>
            ) : (
              <span className="text-[10px] text-slate-500 italic">Click Logo 5x to configure Kiosk</span>
            )}
          </div>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-4">

        {/* --- VIEW: LIVE PUBLIC DISPLAY BOARD --- */}
        {view === "dashboard" && (
          <div className="w-full max-w-5xl space-y-6">
            
            {/* Real-time Turnout banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Voter Turnout</p>
                  <h3 className="text-3xl font-extrabold text-indigo-400 mt-1">{turnoutPercentage}%</h3>
                </div>
                <Users className="w-8 h-8 text-indigo-500" />
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Transmitted Ballots</p>
                  <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{transmittedVotesCount} / {totalRegisteredVoters}</h3>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center justify-between shadow-lg">
                <div>
                  <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Polling Status</p>
                  <h3 className={`text-2xl font-extrabold mt-1 uppercase ${electionActive ? "text-emerald-500 animate-pulse" : "text-rose-500"}`}>
                    {electionActive ? "● Live / Open" : "Closed"}
                  </h3>
                </div>
                <CalendarClock className="w-8 h-8 text-slate-500" />
              </div>
            </div>

            {/* Election Results Grid grouped by positions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["President", "Vice President", "Secretary", "Project Manager"].map((position) => {
                const positionCandidates = candidatesList.filter(c => c.position === position);
                
                return (
                  <div key={position} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
                    <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2 flex justify-between items-center">
                      <span>{position}s</span>
                      <span className="text-[10px] bg-slate-900 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-900/50 uppercase">Live Audit</span>
                    </h3>

                    <div className="space-y-3">
                      {positionCandidates.map((candidate) => {
                        const votes = voteDatabase[candidate.id] || 0;
                        const totalPositionVotes = positionCandidates.reduce((acc, c) => acc + (voteDatabase[c.id] || 0), 0) || 1;
                        const sharePercent = ((votes / totalPositionVotes) * 100).toFixed(1);

                        return (
                          <div key={candidate.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <div>
                                <span className="font-semibold text-white">{candidate.name}</span>
                                <span className="text-xs text-slate-400 ml-2">({candidate.party})</span>
                              </div>
                              <span className="font-mono font-bold text-indigo-400">{votes} ({sharePercent}%)</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                              <div 
                                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-1000"
                                style={{ width: `${sharePercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Grade Representative Tabs */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-2">Grade Level Representatives</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {["7", "8", "9", "10"].map((grade) => {
                  const reps = candidatesList.filter(c => c.position === "Grade Rep" && c.grade === grade);
                  return (
                    <div key={grade} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1">Grade {grade}</p>
                      {reps.map(rep => {
                        const repVotes = voteDatabase[rep.id] || 0;
                        return (
                          <div key={rep.id} className="flex justify-between items-center text-xs">
                            <span className="text-slate-300 font-medium">{rep.name}</span>
                            <span className="font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-indigo-400 font-bold">{repVotes} votes</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: ADMIN PANEL --- */}
        {view === "admin" && (
          <div className="w-full max-w-xl bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
              <Settings className="w-5 h-5 text-indigo-400" /> Administrative Console
            </h2>

            {!isAdminAuthenticated ? (
              /* Auth Gate */
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-slate-400">Please verify your master PIN to access the election settings.</p>
                </div>
                <input 
                  type="password" 
                  placeholder="Enter Master Admin PIN" 
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center font-mono text-lg text-white focus:outline-none focus:border-indigo-500"
                />
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">
                  Confirm Admin Identity
                </button>
              </form>
            ) : isAdminLockedOut ? (
              /* Administrative lockout lock active during active voting hours */
              <div className="text-center p-6 space-y-4">
                <div className="p-3 bg-rose-500/15 text-rose-400 rounded-full inline-block border border-rose-500/30">
                  <ShieldAlert className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Console Lockout Active</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  The election is currently live and running within the scheduled hours of <span className="text-indigo-400 font-mono font-bold">{startTime} - {endTime}</span>. To protect the integrity of the ballot, all administrative adjustments are locked out until this period closes.
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left font-mono text-xs text-slate-300 space-y-1">
                  <p>• Machine Target Clock: {currentTimeString}</p>
                  <p>• Scheduled Polling Loop: {startTime} to {endTime}</p>
                  <p className="text-amber-400 font-semibold">• Status: Security override engaged.</p>
                </div>
              </div>
            ) : (
              /* Main Controls Panel */
              <div className="space-y-6">
                
                {/* Active States / Poll Operations */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white text-sm">Status: {electionActive ? "ACTIVE & SECURE" : "TERMINATED / OFFLINE"}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Setup state defines active client terminal rules.</p>
                  </div>
                  {!electionActive ? (
                    <button 
                      onClick={handleOpenSetupModal} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Open New Polls
                    </button>
                  ) : (
                    <button 
                      onClick={() => setElectionActive(false)} 
                      className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition"
                    >
                      Close Polls
                    </button>
                  )}
                </div>

                {/* Configurations parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 text-indigo-400"/> Polling Schedule</h5>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Open Time</label>
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Close Time</label>
                      <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-sm text-white" />
                    </div>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-indigo-400"/> Key Codes</h5>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Admin master PIN</label>
                      <input type="text" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-sm text-white" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">ELECOM Unlock key</label>
                      <input type="text" value={voterUnlockPin} onChange={(e) => setVoterUnlockPin(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-sm text-white" />
                    </div>
                  </div>
                </div>

                {/* Reset nuclear option button */}
                <div className="border-t border-slate-700 pt-4 flex justify-between items-center">
                  <p className="text-xs text-slate-400">To drop voter registrations and clear absolute audit logs:</p>
                  <button 
                    onClick={handleResetElection} 
                    className="bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 font-bold text-xs border border-rose-500/30 px-4 py-2 rounded-lg transition"
                  >
                    Nuclear Database Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: VOTER TERMINAL BOOTH LOOP --- */}
        {view === "voter" && (
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Condition A: Election Closed */}
            {!electionActive && (
              <div className="p-8 text-center space-y-4">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-full inline-block border border-rose-500/20">
                  <Lock className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-white">Terminal Offline</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  The active polling session has concluded or is temporarily offline. Please consult an ELECOM officer to begin.
                </p>
              </div>
            )}

            {/* Condition B: Active but terminal locked - waiting for ELECOM supervisor sign-in */}
            {electionActive && !isTerminalUnlocked && (
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">ELECOM Verification Required</h3>
                  <p className="text-xs text-slate-400 mt-1">An official supervisor must enter their passkey to prepare this computer terminal loop.</p>
                </div>
                <form onSubmit={handleElecomUnlock} className="space-y-3">
                  <input 
                    type="password" 
                    placeholder="Enter ELECOM Passkey" 
                    value={elecomInput}
                    onChange={(e) => setElecomInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center font-mono text-lg text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition">
                    Unlock Kiosk Loop
                  </button>
                </form>
              </div>
            )}

            {/* Condition C: Kiosk Active - Student Verification Loop */}
            {electionActive && isTerminalUnlocked && (
              <div className="p-6">
                
                {/* Voter Loop Step 1: Student Login */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <h3 className="text-xl font-extrabold text-white">Student Voting Kiosk</h3>
                      <p className="text-xs text-slate-400 mt-1">Please log in with your credentials to generate your ballot sheet.</p>
                    </div>

                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Student ID Number</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="e.g. CC-2026-0941" 
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center font-mono text-base uppercase text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Year/Grade Level</label>
                        <select 
                          value={studentGrade}
                          onChange={(e) => setStudentGrade(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                          <option value="7">Grade 7</option>
                          <option value="8">Grade 8</option>
                          <option value="9">Grade 9</option>
                          <option value="10">Grade 10</option>
                        </select>
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50">
                        Generate Digital Ballot <ChevronRight className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* Voter Loop Step 2: Digital Ballot Section */}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-700 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-white">Digital Ballot Sheet</h4>
                        <p className="text-[10px] text-slate-400">Registered ID: {studentId}</p>
                      </div>
                      <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-indigo-400 font-bold">Grade {studentGrade}</span>
                    </div>

                    {/* Scrollable Ballot Fields */}
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                      {["President", "Vice President", "Secretary", "Project Manager", "Grade Rep"].map((position) => {
                        // Dynamically filter Grade Rep candidates to match student's grade
                        const isGradeRep = position === "Grade Rep";
                        const positionCandidates = candidatesList.filter(c => {
                          if (isGradeRep) {
                            return c.position === position && c.grade === studentGrade;
                          }
                          return c.position === position;
                        });

                        const maxAllowed = position === "Project Manager" ? 2 : 1;
                        const selection = selectedCandidates[position];

                        return (
                          <div key={position} className="bg-slate-905 border border-slate-700/50 rounded-xl p-3.5 space-y-2">
                            <div className="flex justify-between items-center border-b border-slate-800 pb-1">
                              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{position}</span>
                              <span className="text-[10px] text-slate-400">Choose up to {maxAllowed}</span>
                            </div>

                            <div className="grid grid-cols-1 gap-1.5">
                              {positionCandidates.map((candidate) => {
                                const isSelected = maxAllowed === 1 
                                  ? selection === candidate.id 
                                  : (selection || []).includes(candidate.id);

                                return (
                                  <div 
                                    key={candidate.id}
                                    onClick={() => handleSelectCandidate(position, candidate.id, maxAllowed)}
                                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${isSelected ? "bg-indigo-600/20 border-indigo-500" : "bg-slate-950/40 border-slate-800 hover:border-slate-700"}`}
                                  >
                                    <div>
                                      <p className="text-xs font-bold text-white">{candidate.name}</p>
                                      <p className="text-[10px] text-slate-400">{candidate.party}</p>
                                    </div>
                                    <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${isSelected ? "bg-indigo-600 border-indigo-500" : "border-slate-700"}`}>
                                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={handleCastVotes} 
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl transition shadow-lg shadow-emerald-950/40"
                    >
                      Cast Secure Ballot
                    </button>
                  </div>
                )}

                {/* Voter Loop Step 3: Success Screen */}
                {step === 3 && (
                  <div className="text-center py-6 space-y-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full inline-block border border-emerald-500/20 animate-bounce">
                      <CheckCircle className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-white">Ballot Cast Successfully!</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        Thank you for executing your voter rights. Your votes have been sealed, validated, and logged inside the secure records directory.
                      </p>
                    </div>
                    <button 
                      onClick={handleResetForNextVoter} 
                      className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold py-3 rounded-xl transition"
                    >
                      Terminal Ready for Next Student
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        )}
      </main>

      {/* --- SETUP ACTIVE ELECTION MODAL DIALOG --- */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5"><Unlock className="w-4 h-4 text-emerald-400"/> Initialize Polling Station</h3>
              <button onClick={() => setShowSetupModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>
            
            <form onSubmit={handleConfirmStartElection} className="p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">Please set fresh passwords for this specific voting station before allowing students to cast ballots.</p>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">New Master Admin PIN</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. 1234" 
                  value={newAdminPin} 
                  onChange={(e) => setNewAdminPin(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-sm text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase">New ELECOM Kiosk Passkey</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. 5678" 
                  value={newElecomPin} 
                  onChange={(e) => setNewElecomPin(e.target.value)} 
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-sm text-white focus:outline-none focus:border-indigo-500" 
                />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition mt-2 shadow-lg text-sm">
                Deploy & Open Station
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
