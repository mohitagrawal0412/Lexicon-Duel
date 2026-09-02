import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { History, Trophy } from 'lucide-react';
import { getUserHistory } from '../services/relationshipService';

const MatchHistoryPage = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getUserHistory(user.uid).then((data) => {
        setHistory(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-56px)] game-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-56px)] game-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <History className="text-yellow-400" size={32} />
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            MATCH HISTORY
          </h1>
        </div>
        
        {history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map(rel => {
              const opponentUid = Object.keys(rel.players || {}).find(uid => uid !== user.uid);
              const opponentName = rel.players?.[opponentUid]?.displayName || 'Unknown';
              const myWins = rel.stats?.overallWins?.[user.uid] || 0;
              const oppWins = rel.stats?.overallWins?.[opponentUid] || 0;
              const ties = rel.stats?.overallWins?.ties || 0;
              
              const totalGames = rel.stats?.totalGames || 0;
              const winRate = totalGames > 0 ? Math.round((myWins / totalGames) * 100) : 0;
              
              return (
                <div key={rel.id} className="bg-surface-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:border-teal-500/30 transition-all shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-1">Head-to-Head vs</div>
                      <div className="font-black text-2xl text-white truncate max-w-[200px]">{opponentName}</div>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="text-3xl font-black text-teal-400">{winRate}%</div>
                       <div className="text-[10px] uppercase font-bold text-gray-500">Win Rate</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 text-center">
                    <div className="flex-1 bg-teal-500/10 border border-teal-500/30 rounded-2xl p-3">
                      <div className="text-teal-400 font-bold text-xs uppercase mb-1">Wins</div>
                      <div className="text-2xl font-black text-white">{myWins}</div>
                    </div>
                    <div className="flex-1 bg-surface-800 border border-white/10 rounded-2xl p-3">
                      <div className="text-gray-400 font-bold text-xs uppercase mb-1">Ties</div>
                      <div className="text-2xl font-black text-white">{ties}</div>
                    </div>
                    <div className="flex-1 bg-red-500/10 border border-red-500/30 rounded-2xl p-3">
                      <div className="text-red-400 font-bold text-xs uppercase mb-1">Losses</div>
                      <div className="text-2xl font-black text-white">{oppWins}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full bg-surface-900/40 border border-dashed border-white/20 rounded-3xl p-16 flex flex-col items-center justify-center text-center">
             <Trophy className="text-gray-600 w-16 h-16 mb-4" />
             <h3 className="text-2xl font-bold text-gray-300 mb-2">No Rivals Found</h3>
             <p className="text-gray-500 text-base max-w-md">Create a Party Room and battle a friend. Your head-to-head records will automatically appear here!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchHistoryPage;
