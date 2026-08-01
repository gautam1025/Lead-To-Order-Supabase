"use client"

import { useState, useEffect, useContext, useCallback } from "react"
import { AuthContext } from "../../App" // Import AuthContext
import supabase from "../../utils/supabase" // Import your Supabase client
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

// Fallback data in case of errors
const fallbackLeadData = [
  { month: "Jan", leads: 45, enquiries: 30, orders: 12 },
  { month: "Feb", leads: 52, enquiries: 35, orders: 15 },
  { month: "Mar", leads: 48, enquiries: 32, orders: 14 },
  { month: "Apr", leads: 70, enquiries: 45, orders: 20 },
  { month: "May", leads: 65, enquiries: 40, orders: 18 },
  { month: "Jun", leads: 58, enquiries: 38, orders: 16 },
]

const fallbackConversionData = [
  { name: "Leads", value: 124, color: "#0284c7" },
  { name: "Enquiries", value: 82, color: "#0ea5e9" },
  { name: "Quotations", value: 56, color: "#38bdf8" },
  { name: "Orders", value: 27, color: "#7dd3fc" },
]

const fallbackSourceData = [
  { name: "Indiamart", value: 45, color: "#0369a1" },
  { name: "Justdial", value: 28, color: "#0ea5e9" },
  { name: "Social Media", value: 20, color: "#38bdf8" },
  { name: "Website", value: 15, color: "#7dd3fc" },
  { name: "Referrals", value: 12, color: "#bae6fd" },
]

function DashboardCharts({ scNameFilter = "all", startDate, endDate }) {
  const authContext = useContext(AuthContext) || {}
  const {
    currentUser = null,
    userType = null,
    isAdmin = () => false,
    getUsernamesToFilter = () => []
  } = authContext
  const [activeTab, setActiveTab] = useState("overview")
  const [leadData, setLeadData] = useState(fallbackLeadData)
  const [conversionData, setConversionData] = useState(fallbackConversionData)
  const [sourceData, setSourceData] = useState(fallbackSourceData)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper to format date for database query (YYYY-MM-DD)
  // Assuming database uses standard date format or validation requires it
  const formatDateForDb = (dateString) => {
    if (!dateString) return null
    return dateString
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch counts for conversion funnel
        let totalLeads = 0
        let totalEnquiries = 0
        let totalQuotations = 0
        let totalOrders = 0

        // --- 1. LEADS COUNT ---
        let leadsCountQuery = supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })

        // Apply SC Name Filter
        if (isAdmin()) {
          if (scNameFilter !== "all") {
            leadsCountQuery = leadsCountQuery.eq('sc_name', scNameFilter)
          }
        } else if (currentUser?.username) {
          // Standard user filter
          const usernamesToFilter = getUsernamesToFilter()
          leadsCountQuery = leadsCountQuery.in('sc_name', usernamesToFilter)
        }

        // Apply Date Filter
        // Helper to adjust end date to cover the full day
        const getEndDateWithTime = (date) => {
          if (!date) return null
          return `${date}T23:59:59`
        }

        if (startDate) {
          leadsCountQuery = leadsCountQuery.gte('created_at', startDate)
        }
        if (endDate) {
          leadsCountQuery = leadsCountQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: leadsCount, error: leadsCountError } = await leadsCountQuery

        if (!leadsCountError) {
          totalLeads = leadsCount || 0
        }

        // --- 2. ENQUIRIES COUNT ---
        let enquiryCountQuery = supabase
          .from('enquiries')
          .select('*', { count: 'exact', head: true })
          .eq('Enquiry_Received_Status', 'yes')

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            enquiriesCountQuery = enquiriesCountQuery.eq('SC_Name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          enquiriesCountQuery = enquiriesCountQuery.in('SC_Name', usernamesToFilter)
        }

        if (startDate) {
          // Providing fallback to Timestamp if Created_At fails (though we can't easily try-catch query build)
          // We'll stick to Created_At as it's standard. If issues arise, we change to Timestamp.
          enquiriesCountQuery = enquiriesCountQuery.gte('created_at', startDate)
        }
        if (endDate) {
          enquiriesCountQuery = enquiriesCountQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: enquiriesCount, error: enquiriesCountError } = await enquiriesCountQuery
        if (!enquiriesCountError) {
          totalEnquiries = enquiriesCount || 0
        }

        // --- 3. QUOTATIONS COUNT ---
        // (rows with Quotation Number not null)
        let quotationsCountQuery = supabase
          .from('enquiry_tracker')
          .select('*', { count: 'exact', head: true })
          .not('Quotation Number', 'is', null)
          .neq('Quotation Number', '')

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            quotationsCountQuery = quotationsCountQuery.eq('SC_Name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          quotationsCountQuery = quotationsCountQuery.in('SC_Name', usernamesToFilter)
        }

        if (startDate) {
          quotationsCountQuery = quotationsCountQuery.gte('created_at', startDate)
        }
        if (endDate) {
          quotationsCountQuery = quotationsCountQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: quotationsCount, error: quotationsCountError } = await quotationsCountQuery

        if (!quotationsCountError) {
          totalQuotations = quotationsCount || 0
        }

        // --- 4. ORDERS COUNT ---
        // (where "Is Order Received? Status" = "yes")
        let ordersCountQuery = supabase
          .from('enquiry_tracker')
          .select('*', { count: 'exact', head: true })
          .eq('"Is Order Received? Status"', 'yes')

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            ordersCountQuery = ordersCountQuery.eq('SC_Name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          ordersCountQuery = ordersCountQuery.in('SC_Name', usernamesToFilter)
        }

        if (startDate) {
          ordersCountQuery = ordersCountQuery.gte('created_at', startDate)
        }
        if (endDate) {
          ordersCountQuery = ordersCountQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: ordersCount, error: ordersCountError } = await ordersCountQuery

        if (!ordersCountError) {
          totalOrders = ordersCount || 0
        }

        // Create conversion data
        const newConversionData = [
          { name: "Leads", value: totalLeads, color: "#0284c7" },
          { name: "Enquiries", value: totalEnquiries, color: "#0ea5e9" },
          { name: "Quotations", value: totalQuotations, color: "#38bdf8" },
          { name: "Orders", value: totalOrders, color: "#7dd3fc" }
        ]

        setConversionData(newConversionData)

        // --- LEADS SOURCES ---
        let leadSourcesQuery = supabase
          .from('leads')
          .select('lead_source')

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            leadSourcesQuery = leadSourcesQuery.eq('SC_Name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          leadSourcesQuery = leadSourcesQuery.in('SC_Name', usernamesToFilter)
        }

        if (startDate) {
          leadSourcesQuery = leadSourcesQuery.gte('Created_At', startDate)
        }
        if (endDate) {
          leadSourcesQuery = leadSourcesQuery.lte('Created_At', getEndDateWithTime(endDate))
        }

        const { data: leadSourcesData, error: leadSourcesError } = await leadSourcesQuery

        if (!leadSourcesError && leadSourcesData) {
          // Count leads by source
          const sourceCounter = {}

          // Define a color palette
          const colorPalette = [
            "#0369a1", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd",
            "#0284c7", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"
          ]

          leadSourcesData.forEach(row => {
            if (row.Lead_Source) {
              const source = row.Lead_Source
              sourceCounter[source] = (sourceCounter[source] || 0) + 1
            }
          })

          // Convert to array format for the chart
          const sourceNames = Object.keys(sourceCounter)
          const newSourceData = sourceNames.map((name, index) => ({
            name,
            value: sourceCounter[name],
            color: colorPalette[index % colorPalette.length]
          }))

          // Sort by value (descending)
          newSourceData.sort((a, b) => b.value - a.value)

          if (newSourceData.length > 0) {
            setSourceData(newSourceData)
          } else {
            // If filter yields no results, maybe empty? or keep previous/empty
            setSourceData([])
          }
        }

        // For monthly data, we'll use a simplified approach with current counts
        // Since we're optimizing for performance, we'll keep it simple for now
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' })
        const simplifiedMonthlyData = [{
          month: currentMonth,
          leads: totalLeads,
          enquiries: totalEnquiries,
          orders: totalOrders
        }]

        setLeadData(simplifiedMonthlyData)

      } catch (error) {
        console.error("Error fetching chart data:", error)
        setError(error.message)
        // Fallback to demo data is already handled since we initialized state with it
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, isAdmin, scNameFilter, startDate, endDate]) // Add dependencies

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h3 className="text-xl font-bold">Sales Analytics ( Lead To Order )</h3>
      </div>

      {isAdmin() && <p className="text-green-600 font-semibold mb-2">Admin View: Showing all data</p>}

      <div className="mb-4">
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${activeTab === "overview" ? "bg-sky-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("conversion")}
            className={`px-4 py-2 text-sm font-medium ${activeTab === "conversion" ? "bg-sky-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            Conversion
          </button>
          <button
            onClick={() => setActiveTab("sources")}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${activeTab === "sources" ? "bg-sky-500 text-white" : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
          >
            Enquiry Sources
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-slate-500">Loading chart data...</p>
        </div>
      ) : error ? (
        <div className="h-[350px] flex items-center justify-center">
          <p className="text-red-500">Error loading data. Using fallback data.</p>
        </div>
      ) : (
        <div className="h-[350px]">
          {activeTab === "overview" && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="leads" name="Leads" fill="#0ea5e9" />
                <Bar dataKey="enquiries" name="Enquiries" fill="#38bdf8" />
                <Bar dataKey="orders" name="Orders" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeTab === "conversion" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              <div className="h-full w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={conversionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {conversionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col justify-center overflow-y-auto max-h-[350px]">
                <h4 className="text-lg font-medium mb-4">Conversion Funnel</h4>
                <div className="space-y-4">
                  {conversionData.map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div
                          className="h-2.5 rounded-full"
                          style={{
                            width: `${(item.value / (conversionData[0].value || 1)) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "sources" && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
}

export default DashboardCharts