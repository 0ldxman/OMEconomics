"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface ServerInfo {
  id: string
  name: string
  icon_url: string | null
  settings: any
}

interface ServerContextType {
  serverId: string | null
  serverInfo: ServerInfo | null
  isLoading: boolean
  error: string | null
  refreshServerInfo: () => Promise<void>
}

const ServerContext = createContext<ServerContextType | undefined>(undefined)

export function ServerProvider({ 
  children, 
  serverId 
}: { 
  children: React.ReactNode, 
  serverId: string 
}) {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServerInfo = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`http://localhost:8000/api/server/${serverId}`)
      if (!res.ok) throw new Error("Server not found")
      
      const data = await res.json()
      setServerInfo(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to load server info")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (serverId) {
      fetchServerInfo()
    }
  }, [serverId])

  return (
    <ServerContext.Provider value={{ 
      serverId, 
      serverInfo, 
      isLoading, 
      error, 
      refreshServerInfo: fetchServerInfo 
    }}>
      {children}
    </ServerContext.Provider>
  )
}

export function useServer() {
  const context = useContext(ServerContext)
  if (context === undefined) {
    throw new Error("useServer must be used within a ServerProvider")
  }
  return context
}
