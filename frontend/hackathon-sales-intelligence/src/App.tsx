import { useState, useCallback } from 'react'
import { DealList } from './components/DealList'
import { Dashboard } from './components/Dashboard'
import { DealDetail } from './components/DealDetail'
import { BottomNav, type Tab } from './components/BottomNav'
import { SyncStatus } from './components/SyncStatus'
import { useSync } from './hooks/useSync'
import type { Deal } from './lib/db'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('deals')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { isSyncing, lastSyncTime, error, syncNow } = useSync()

  const handleDealSelect = useCallback((deal: Deal) => {
    setSelectedDeal(deal)
  }, [])

  const handleBackFromDetail = useCallback(() => {
    setSelectedDeal(null)
  }, [])

  const handleDealUpdated = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  // Show deal detail view
  if (selectedDeal) {
    return (
      <>
        <SyncStatus
          isSyncing={isSyncing}
          lastSyncTime={lastSyncTime}
          error={error}
          onRetry={syncNow}
        />
        <DealDetail
          deal={selectedDeal}
          onBack={handleBackFromDetail}
          onDealUpdated={handleDealUpdated}
        />
      </>
    )
  }

  return (
    <>
      <SyncStatus
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        error={error}
        onRetry={syncNow}
      />
      {activeTab === 'deals' ? (
        <DealList
          key={refreshKey}
          onDealSelect={handleDealSelect}
        />
      ) : (
        <Dashboard key={refreshKey} />
      )}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  )
}

export default App
