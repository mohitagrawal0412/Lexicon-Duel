import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createPartyRoom } from '../../services/roomService';
import { Loader2 } from 'lucide-react';

export default function CreateParty() {
  const { user, isConfigured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConfigured || !user) {
      alert("You must be logged in to create an online party.");
      navigate('/');
      return;
    }

    const initRoom = async () => {
      try {
        const roomId = await createPartyRoom(user);
        navigate(`/party/${roomId}`);
      } catch (err) {
        console.error("Failed to create room", err);
        navigate('/');
      }
    };

    initRoom();
  }, [user, isConfigured, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-56px)] bg-black">
      <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
    </div>
  );
}
