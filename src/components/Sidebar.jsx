import { Link, useLocation } from "react-router-dom"
import { HomeIcon, UsersIcon, PhoneCallIcon, BarChartIcon, FileTextIcon, ShieldIcon, LogoutIcon, DatabaseIcon, SettingsIcon } from "./Icons"
import { useContext, useState, useEffect } from "react"
import { AuthContext } from "../App"
import supabase from "../utils/supabase"
import logoSvg from "../assests/logo.jpeg"

function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
    const location = useLocation()
    const authContext = useContext(AuthContext) || {}
    const { userType = null, isAdmin = () => false, logout = () => {} } = authContext
    const [counts, setCounts] = useState({
        callTracker: null,
        enquiryTracker: null,
        clientMaster: null,
        itemsMaster: null
    })

    const isMasterActive = location.pathname.startsWith("/master")

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const safeFetch = async (queryPromise) => {
                    try {
                        const res = await queryPromise;
                        return res || { count: 0 };
                    } catch {
                        return { count: 0 };
                    }
                };

                // Call Tracker Pending count
                let callCount = 0;
                try {
                    // Group 1: leads where planned_at is not null and id not in call_tracker_for_leads
                    let allTrackerData = [];
                    let fetchMore = true;
                    let currentFrom = 0;
                    
                    while (fetchMore) {
                        const { data, error } = await supabase
                            .from("call_tracker_for_leads")
                            .select("lead_id, enquiry_received_status, created_at")
                            .order("created_at", { ascending: false })
                            .range(currentFrom, currentFrom + 999);
                        
                        if (error) break;
                        if (data && data.length > 0) {
                            allTrackerData = [...allTrackerData, ...data];
                            currentFrom += 1000;
                            if (data.length < 1000) fetchMore = false;
                        } else {
                            fetchMore = false;
                        }
                    }

                    const latestTrackerPerLead = new Map();
                    allTrackerData.forEach(row => {
                        if (row.lead_id && !latestTrackerPerLead.has(row.lead_id)) {
                            latestTrackerPerLead.set(row.lead_id, row);
                        }
                    });

                    const existingLeadIds = Array.from(latestTrackerPerLead.keys());

                    let group1Query = supabase
                        .from("leads")
                        .select("id")
                        .not("planned_at", "is", null);

                    const { data: g1Leads } = await group1Query;
                    const existingIdsSet = new Set(existingLeadIds);
                    const g1Count = (g1Leads || []).filter(lead => !existingIdsSet.has(lead.id)).length;

                    // Group 2 count: latest records where status != 'yes'
                    const group2Count = Array.from(latestTrackerPerLead.values()).filter(row => 
                        !row.enquiry_received_status || row.enquiry_received_status.toLowerCase() !== 'yes'
                    ).length;

                    callCount = g1Count + group2Count;
                } catch (e) {
                    console.error("Error fetching call tracker count:", e);
                }

                // Enquiry Tracker Pending count
                let enquiryCount = 0;
                try {
                    // 1. Pending leads count from call_tracker_for_leads
                    const { data: existingTrackerLeads } = await supabase
                        .from("enquiry_tracker_for_leads")
                        .select("lead_id")
                        .not("lead_id", "is", null);

                    const existingLeadIds = Array.from(
                        new Set((existingTrackerLeads || []).map((r) => r.lead_id).filter(Boolean))
                    );

                    let enquiryLeadsQuery = supabase
                        .from("call_tracker_for_leads")
                        .select("*", { count: "exact", head: true })
                        .not("planned_at", "is", null);

                    if (existingLeadIds.length > 0) {
                        enquiryLeadsQuery = enquiryLeadsQuery.not("lead_id", "in", `(${existingLeadIds.join(",")})`);
                    }

                    // 2. Pending direct enquiries count from enquiries
                    const { data: existingTrackerEnquiries } = await supabase
                        .from("enquiry_tracker")
                        .select("enquiry_id")
                        .not("enquiry_id", "is", null);

                    const existingEnquiryIds = Array.from(
                        new Set((existingTrackerEnquiries || []).map((r) => r.enquiry_id).filter(Boolean))
                    );

                    let enquiryDirectQuery = supabase
                        .from("enquiries")
                        .select("*", { count: "exact", head: true })
                        .not("planned_at", "is", null);

                    if (existingEnquiryIds.length > 0) {
                        enquiryDirectQuery = enquiryDirectQuery.not("id", "in", `(${existingEnquiryIds.join(",")})`);
                    }

                    const [enquiryLeadsRes, enquiryDirectRes] = await Promise.all([
                        safeFetch(enquiryLeadsQuery),
                        safeFetch(enquiryDirectQuery)
                    ]);

                    enquiryCount = (enquiryLeadsRes?.count || 0) + (enquiryDirectRes?.count || 0);
                } catch (e) {
                    console.error("Error fetching enquiry tracker count:", e);
                }

                const [
                    clientTotalRes, 
                    clientNotRelevantRes,
                    itemsRes
                ] = await Promise.all([
                    // Client Master total clients count
                    safeFetch(supabase.from("client_master").select("*", { count: "exact", head: true })),

                    // Client Master non-relevant clients count
                    safeFetch(supabase.from("client_master").select("*", { count: "exact", head: true }).eq("isRelevant", false)),

                    // Items total count
                    safeFetch(supabase.from("items").select("*", { count: "exact", head: true }))
                ]);

                const relevantClientCount = Math.max(0, (clientTotalRes?.count || 0) - (clientNotRelevantRes?.count || 0));
                const itemsCount = itemsRes?.count || 0;

                setCounts({
                    callTracker: callCount,
                    enquiryTracker: enquiryCount,
                    clientMaster: relevantClientCount,
                    itemsMaster: itemsCount
                });
            } catch (err) {
                console.error("Error fetching sidebar counts:", err);
            }
        };

        fetchCounts();
    }, [location.pathname]);

    // Base routes available to all users
    const routes = [
        {
            href: "/",
            label: "Dashboard",
            icon: <HomeIcon className="h-5 w-5 mr-3" />,
            active: location.pathname === "/",
        },
        {
            href: "/leads",
            label: "Leads",
            icon: <UsersIcon className="h-5 w-5 mr-3" />,
            active: location.pathname.startsWith("/leads"),
        },
        {
            href: "/call-tracker",
            label: "Call Tracker",
            icon: <PhoneCallIcon className="h-5 w-5 mr-3" />,
            active: location.pathname.startsWith("/call-tracker"),
        },
        {
            href: "/enquiry-tracker",
            label: "Enquiry Tracker",
            icon: <BarChartIcon className="h-5 w-5 mr-3" />,
            active: location.pathname.startsWith("/enquiry-tracker"),
        },
        {
            href: "/quotation",
            label: "Quotation",
            icon: <FileTextIcon className="h-5 w-5 mr-3" />,
            active: location.pathname.startsWith("/quotation"),
        },
    ]

    // Add admin-only route if needed
    if (isAdmin && isAdmin()) {
        routes.push({
            href: "/report",
            label: "Report",
            icon: <ShieldIcon className="h-5 w-5 mr-3" />,
            active: location.pathname.startsWith("/report"),
        })
    }

    return (
        <>
            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Component */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-52 transform bg-white border-r border-slate-100 text-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-16 items-center justify-start border-b border-slate-100 px-4">
                    <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex flex-row items-center gap-2">
                            <img src={logoSvg} alt="Divine" className="h-9 w-auto object-contain" />
                            <span className="text-lg font-bold text-sky-600">
                                Divine
                            </span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            to={route.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ${route.active
                                ? "bg-sky-500 text-white shadow-md shadow-sky-200 hover:bg-sky-600"
                                : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                                }`}
                        >
                            <div className="flex items-center truncate">
                                {route.icon}
                                <span className="truncate">{route.label}</span>
                            </div>
                            {route.href === "/call-tracker" && counts.callTracker !== null && (
                                <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${route.active ? "bg-white text-sky-600" : "bg-sky-100 text-sky-700"}`}>
                                    {counts.callTracker}
                                </span>
                            )}
                            {route.href === "/enquiry-tracker" && counts.enquiryTracker !== null && (
                                <span className={`px-1.5 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${route.active ? "bg-white text-sky-600" : "bg-sky-100 text-sky-700"}`}>
                                    {counts.enquiryTracker}
                                </span>
                            )}
                        </Link>
                    ))}

                    {/* Master Data Link */}
                    <Link
                        to="/master/client"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ${
                            isMasterActive
                                ? "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 font-semibold shadow-sm border border-sky-100/50"
                                : "text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:shadow-sm"
                        }`}
                    >
                        <DatabaseIcon className="h-5 w-5 mr-2.5 shrink-0" />
                        <span className="truncate">Master Data</span>
                    </Link>
                        {/* Settings for Admins (below Master) */}
                        {isAdmin && isAdmin() && (
                            <div className="pt-2 mt-2 border-t border-slate-100">
                                <Link
                                    to="/setting"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-200 ${
                                        location.pathname.startsWith("/setting")
                                            ? "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 font-semibold shadow-sm border border-sky-100/50"
                                            : "text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:shadow-sm"
                                    }`}
                                >
                                    <SettingsIcon className="h-5 w-5 mr-2.5 shrink-0" />
                                    <span className="truncate">Settings</span>
                                </Link>
                            </div>
                        )}
                </nav>

                <div className="border-t border-slate-100 p-3 space-y-2">
                    <button
                        onClick={logout}
                        className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <LogoutIcon className="h-4 w-4 mr-2 shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
