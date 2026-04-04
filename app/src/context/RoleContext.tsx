import { createContext, useContext, useState, useEffect } from 'react'

export type Role = 'creator' | 'viewer' | null

interface RoleContextValue {
  role: Role
  setRole: (r: Role) => void
  clearRole: () => void
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  setRole: () => {},
  clearRole: () => {},
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    const stored = localStorage.getItem('storii-role')
    if (stored === 'creator' || stored === 'viewer') return stored
    return null
  })

  const setRole = (r: Role) => {
    setRoleState(r)
    if (r) localStorage.setItem('storii-role', r)
    else localStorage.removeItem('storii-role')
  }

  const clearRole = () => setRole(null)

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
