import { useState, useEffect, useContext, useCallback } from "react"
import { AuthContext } from "../App"
import supabase from "../utils/supabase"
import DashboardMetrics from "../components/dashboard/DashboardMetrics"
import DashboardCharts from "../components/dashboard/DashboardCharts"
import PendingTasks from "../components/dashboard/PendingTasks"
import RecentActivities from "../components/dashboard/RecentActivities"

function Dashboard() {
  const { currentUser, userType, isAdmin } = useContext(AuthContext)
  
  // Filter States
  const [scNameFilter, setScNameFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [uniqueScNames, setUniqueScNames] = useState([])

  // Fetch unique SC names for admin filter
  const fetchUniqueScNames = useCallback(async () => {
    if (!isAdmin()) return

    try {
      const { data, error } = await supabase
        .from("leads_to_order")
        .select("SC_Name")
        .not("SC_Name", "is", null)
        .not("SC_Name", "eq", "")
      
      if (error) throw error
      
      if (data) {
        const uniqueNames = [...new Set(data.map(item => item.SC_Name))].sort()
        setUniqueScNames(uniqueNames)
      }
    } catch (err) {
      console.error("Error fetching SC names:", err)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchUniqueScNames()
  }, [fetchUniqueScNames])

  // Handlers
  const handleScChange = (e) => {
    setScNameFilter(e.target.value)
  }

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value)
  }

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value)
  }

  const handleResetFilters = () => {
    setScNameFilter("all")
    setStartDate("")
    setEndDate("")
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">Monitor your sales pipeline and track conversions in real-time</p>
          </div>

          {/* Global Filters Section */}
          {isAdmin() && (
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Filter by SC Name</span>
                <select
                  value={scNameFilter}
                  onChange={handleScChange}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 min-w-[160px]"
                >
                  <option value="all">All SC Coordinators</option>
                  {uniqueScNames.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          <DashboardMetrics 
            scNameFilter={scNameFilter}
            startDate={startDate}
            endDate={endDate}
          />

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6">
              <DashboardCharts 
                scNameFilter={scNameFilter}
                startDate={startDate}
                endDate={endDate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
