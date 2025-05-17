"use client"

import React, {useState, useEffect, useRef} from 'react'
import {storageManager, Session} from '@/lib/storage'
import {MoreVertical, Trash} from "lucide-react"
import {Button} from "@/components/ui/button"

interface HistoryProps {
  setSessionAction: (session: Session) => void;
  goToPracticeAction: () => void;
}

export function History({setSessionAction, goToPracticeAction}: HistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      const savedSessions = await storageManager.getAllSessions()
      setSessions(savedSessions.slice(-15))
    }
    void fetchSessions()
  }, [])

  const handleSessionClick = (session: Session) => {
    if (window.confirm("Are you sure you want to override the current session?")) {
      setSessionAction(session)
      goToPracticeAction()
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground">No practice sessions yet</p>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session, index) => (
            <div key={index} className="relative">
              <button
                onClick={() => handleSessionClick(session)}
                className="w-full p-4 rounded-lg border bg-card text-left hover:bg-accent transition-colors">
                <h3 className="font-medium">{session.videoTitle}</h3>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(session.timestamp).toLocaleString()}
                </div>
                <div className="mt-2">
                  {session.note}
                </div>
              </button>
              <div className="absolute top-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(menuOpen === index ? null : index);
                  }}>
                  <MoreVertical className="h-4 w-4"/>
                </Button>
                {menuOpen === index && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <button
                        className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                        onClick={(e) => {
                          
                          e.stopPropagation();
                          if (window.confirm("Are you sure you want to delete this session?")) {
                            session.id && void storageManager.deleteSession(session.id);
                            setSessions(sessions.filter((s) => s.id !== session.id));
                          }
                          setMenuOpen(null);
                        }}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}