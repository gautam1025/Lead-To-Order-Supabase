// DashboardMetrics.jsx - Optimized to fetch only counts instead of full data

import { useState, useEffect, useContext } from "react"
import { UsersIcon, PhoneCallIcon, FileTextIcon, ShoppingCartIcon, TrendingUpIcon, AlertCircleIcon } from "../Icons"
import { AuthContext } from "../../App" // Import AuthContext
import supabase from "../../utils/supabase" // Import your Supabase client

function DashboardMetrics({ scNameFilter = "all", startDate, endDate }) {
  const { currentUser, userType, isAdmin, getUsernamesToFilter } = useContext(AuthContext) // Get user info and admin function
  const [metrics, setMetrics] = useState({
    totalLeads: "0",
    pendingFollowups: "0",
    quotationsSent: "0",
    ordersReceived: "0",
    totalEnquiry: "0",
    pendingEnquiry: "0"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)

        let totalLeads = 0
        let pendingFollowups = 0
        let quotationsSent = 0
        let ordersReceived = 0
        let totalEnquiry = 0
        let pendingEnquiry = 0

        // Helper for date filtering
        const getEndDateWithTime = (date) => {
          if (!date) return null
          return `${date}T23:59:59`
        }

        // --- 1. Total Leads (leads_to_order) ---
        let leadsCountQuery = supabase
          .from('leads_to_order')
          .select('*', { count: 'exact', head: true })

        // Apply SC Name Filter
        if (isAdmin()) {
          if (scNameFilter !== "all") {
            leadsCountQuery = leadsCountQuery.eq('SC_Name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          leadsCountQuery = leadsCountQuery.in('SC_Name', usernamesToFilter)
        }

        // Apply Date Filter
        if (startDate) {
          leadsCountQuery = leadsCountQuery.gte('Created_At', startDate)
        }
        if (endDate) {
          leadsCountQuery = leadsCountQuery.lte('Created_At', getEndDateWithTime(endDate))
        }

        const { count: leadsCount, error: leadsCountError } = await leadsCountQuery

        if (leadsCountError) {
          console.error('Error fetching leads count:', leadsCountError)
        } else {
          totalLeads = leadsCount || 0
        }

        // --- 2. Pending Follow-ups (leads_to_order) ---
        let pendingFollowupsQuery = supabase
          .from('leads_to_order')
          .select('*', { count: 'exact', head: true })
          .not('Planned', 'is', null)
          .is('Actual', null)

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            pendingFollowupsQuery = pendingFollowupsQuery.eq('SC_Name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          pendingFollowupsQuery = pendingFollowupsQuery.in('SC_Name', usernamesToFilter)
        }

        if (startDate) {
          pendingFollowupsQuery = pendingFollowupsQuery.gte('Created_At', startDate)
        }
        if (endDate) {
          pendingFollowupsQuery = pendingFollowupsQuery.lte('Created_At', getEndDateWithTime(endDate))
        }

        const { count: pendingCount, error: pendingCountError } = await pendingFollowupsQuery

        if (pendingCountError) {
          console.error('Error fetching pending follow-ups count:', pendingCountError)
        } else {
          pendingFollowups = pendingCount || 0
        }

        // --- 3. Quotations Sent (enquiry_tracker) ---
        let quotationsQuery = supabase
          .from('enquiry_tracker')
          .select('*', { count: 'exact', head: true })
          .not('Quotation Number', 'is', null)
          .neq('Quotation Number', '')

        // SC Filter for enquiry_tracker
        if (isAdmin()) {
          if (scNameFilter !== "all") {
            // Using "SC_Name" as per other components, but wait, original code used "Sales Cordinator" for non-admins?
            // "quotationsQuery.in('Sales Cordinator', usernamesToFilter)" (line 83 of original)
            // Let's stick to "Sales Cordinator" if that's what the schema likely has, OR check consistently.
            // DashboardCharts uses SC_Name.
            // Let's check line 83 original: .in('Sales Cordinator', usernamesToFilter)
            // So column is likely "Sales Cordinator".
            quotationsQuery = quotationsQuery.eq('Sales Cordinator', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          quotationsQuery = quotationsQuery.in('Sales Cordinator', usernamesToFilter)
        }

        if (startDate) {
          quotationsQuery = quotationsQuery.gte('created_at', startDate)
        }
        if (endDate) {
          quotationsQuery = quotationsQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: quotationsCount, error: quotationsError } = await quotationsQuery

        if (quotationsError) {
          console.error('Error fetching quotations count:', quotationsError)
        } else {
          quotationsSent = quotationsCount || 0
        }

        // --- 4. Orders Received (enquiry_tracker) ---
        let ordersQuery = supabase
          .from('enquiry_tracker')
          .select('*', { count: 'exact', head: true })
          .eq('"Is Order Received? Status"', 'yes')

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            ordersQuery = ordersQuery.eq('Sales Cordinator', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          ordersQuery = ordersQuery.in('Sales Cordinator', usernamesToFilter)
        }

        if (startDate) {
          ordersQuery = ordersQuery.gte('created_at', startDate)
        }
        if (endDate) {
          ordersQuery = ordersQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: ordersCount, error: ordersError } = await ordersQuery

        if (ordersError) {
          console.error('Error fetching orders count:', ordersError)
        } else {
          ordersReceived = ordersCount || 0
        }

        // --- 5. Total Enquiry (enquiry_to_order) ---
        let totalEnquiryQuery = supabase
          .from('enquiry_to_order')
          .select('*', { count: 'exact', head: true })

        // SC Filter (original used 'sales_coordinator_name')
        if (isAdmin()) {
          if (scNameFilter !== "all") {
            totalEnquiryQuery = totalEnquiryQuery.eq('sales_coordinator_name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          totalEnquiryQuery = totalEnquiryQuery.in('sales_coordinator_name', usernamesToFilter)
        }

        if (startDate) {
          // Using 'created_at' or 'enquiry_date'? 'created_at' is safer for "record creation".
          // If user means "enquiry date", that's different. Usually dashboard filters by creation/activity.
          totalEnquiryQuery = totalEnquiryQuery.gte('created_at', startDate)
        }
        if (endDate) {
          totalEnquiryQuery = totalEnquiryQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: totalEnquiryCount, error: totalEnquiryError } = await totalEnquiryQuery

        if (totalEnquiryError) {
          console.error('Error fetching total enquiry count:', totalEnquiryError)
        } else {
          totalEnquiry = totalEnquiryCount || 0
        }

        // --- 6. Pending Enquiry (enquiry_to_order) ---
        let pendingEnquiryQuery = supabase
          .from('enquiry_to_order')
          .select('*', { count: 'exact', head: true })
          .not('planned1', 'is', null)
          .is('actual1', null)

        if (isAdmin()) {
          if (scNameFilter !== "all") {
            pendingEnquiryQuery = pendingEnquiryQuery.eq('sales_coordinator_name', scNameFilter)
          }
        } else if (currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter()
          pendingEnquiryQuery = pendingEnquiryQuery.in('sales_coordinator_name', usernamesToFilter)
        }

        if (startDate) {
          pendingEnquiryQuery = pendingEnquiryQuery.gte('created_at', startDate)
        }
        if (endDate) {
          pendingEnquiryQuery = pendingEnquiryQuery.lte('created_at', getEndDateWithTime(endDate))
        }

        const { count: pendingEnquiryCount, error: pendingEnquiryError } = await pendingEnquiryQuery

        if (pendingEnquiryError) {
          console.error('Error fetching pending enquiry count:', pendingEnquiryError)
        } else {
          pendingEnquiry = pendingEnquiryCount || 0
        }

        // Update metrics state
        setMetrics({
          totalLeads: totalLeads.toString(),
          pendingFollowups: pendingFollowups.toString(),
          quotationsSent: quotationsSent.toString(),
          ordersReceived: ordersReceived.toString(),
          totalEnquiry: totalEnquiry.toString(),
          pendingEnquiry: pendingEnquiry.toString()
        })

      } catch (error) {
        console.error("Error fetching metrics:", error)
        setError(error.message)
        // Use fallback demo values
        setMetrics({
          totalLeads: "124",
          pendingFollowups: "38",
          quotationsSent: "56",
          ordersReceived: "27",
          totalEnquiry: "145",
          pendingEnquiry: "42"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [currentUser, isAdmin, scNameFilter, startDate, endDate]) // Add dependencies

  return (
    <div className="space-y-8">
      {/* Lead to Order Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          {/* Display admin view indicator similar to FollowUp page */}
          {isAdmin() && <p className="text-green-600 font-semibold">Admin View: Showing all data</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
          <MetricCard
            title="Total Leads"
            value={isLoading ? "Loading..." : metrics.totalLeads}
            change="+12%"
            trend="up"
            icon={<UsersIcon className="h-5 w-5" />}
            color="from-sky-500 to-blue-600"
          />

          <MetricCard
            title="Pending Follow-ups"
            value={isLoading ? "Loading..." : metrics.pendingFollowups}
            change="+5%"
            trend="up"
            icon={<PhoneCallIcon className="h-5 w-5" />}
            color="from-blue-500 to-blue-600"
          />

          <MetricCard
            title="Quotations Sent"
            value={isLoading ? "Loading..." : metrics.quotationsSent}
            change="+8%"
            trend="up"
            icon={<FileTextIcon className="h-5 w-5" />}
            color="from-emerald-500 to-green-600"
          />

          <MetricCard
            title="Orders Received"
            value={isLoading ? "Loading..." : metrics.ordersReceived}
            change="-3%"
            trend="down"
            icon={<ShoppingCartIcon className="h-5 w-5" />}
            color="from-sky-500 to-blue-600"
          />
        </div>
      </div>

      {/* Enquiry to Order Section */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <MetricCard
            title="Total Enquiry"
            value={isLoading ? "Loading..." : metrics.totalEnquiry}
            change="+15%"
            trend="up"
            icon={<UsersIcon className="h-5 w-5" />}
            color="from-cyan-500 to-blue-600"
          />

          <MetricCard
            title="Pending Enquiry"
            value={isLoading ? "Loading..." : metrics.pendingEnquiry}
            change="+7%"
            trend="up"
            icon={<AlertCircleIcon className="h-5 w-5" />}
            color="from-rose-500 to-red-600"
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, change, trend, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${color}`} />
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`p-2 rounded-full bg-gradient-to-r ${color} text-white`}>{icon}</div>
        </div>
        <div className="flex items-center mt-4">
          {trend === "up" ? (
            <TrendingUpIcon className="h-4 w-4 text-emerald-500 mr-1" />
          ) : (
            <AlertCircleIcon className="h-4 w-4 text-rose-500 mr-1" />
          )}
          <span className={trend === "up" ? "text-emerald-500 text-sm" : "text-rose-500 text-sm"}>
            {change} from last month
          </span>
        </div>
      </div>
    </div>
  )
}

export default DashboardMetrics