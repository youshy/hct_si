import { useState } from 'react'
import { DealList } from './components/DealList'
import { Dashboard } from './components/Dashboard'
import { BottomNav, type Tab } from './components/BottomNav'
import { SyncStatus } from './components/SyncStatus'
import { useSync } from './hooks/useSync'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('deals')
  const { isSyncing, lastSyncTime, error, syncNow } = useSync()

  return (
    <>
      <SyncStatus
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        error={error}
        onRetry={syncNow}
      />
      {activeTab === 'deals' ? <DealList /> : <Dashboard />}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

export default App
