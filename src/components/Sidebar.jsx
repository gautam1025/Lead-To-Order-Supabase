import { Link, useLocation } from "react-router-dom"
import { HomeIcon, UsersIcon, PhoneCallIcon, BarChartIcon, FileTextIcon, ShieldIcon, LogoutIcon, DatabaseIcon, ChevronDownIcon, ChevronUpIcon, SettingsIcon } from "./Icons"
import { useContext, useState, useEffect } from "react"
import { AuthContext } from "../App"
import supabase from "../utils/supabase"
import logoSvg from "../assests/logo.jpeg"

function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
    const location = useLocation()
    const authContext = useContext(AuthContext) || {}
    const { userType = null, isAdmin = () => false, logout = () => {} } = authContext
    const [isMasterOpen, setIsMasterOpen] = useState(() => location.pathname.startsWith("/master"))
    const [counts, setCounts] = useState({
        callTracker: null,
        enquiryTracker: null,
        clientMaster: null
    })

    const isMasterActive = location.pathname.startsWith("/master")

    useEffect(() => {
        if (isMasterActive) {
            setIsMasterOpen(true)
        }
    }, [location.pathname])

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [
                    callRes, 
                    enquiryLeadsRes, 
                    enquiryDirectRes, 
                    clientTotalRes, 
                    clientNotRelevantRes
                ] = await Promise.all([
                    // Call Tracker Pending Follow-ups
                    supabase
                        .from("leads_to_order")
                        .select("*", { count: "exact", head: true })
                        .not("Planned", "is", null)
                        .is("Actual", null),

                    // Enquiry Tracker Pending (leads_to_order)
                    supabase
                        .from("leads_to_order")
                        .select("*", { count: "exact", head: true })
                        .not("Planned1", "is", null)
                        .is("Actual1", null),

                    // Enquiry Tracker Pending (enquiry_to_order)
                    supabase
                        .from("enquiry_to_order")
                        .select("*", { count: "exact", head: true })
                        .not("planned1", "is", null)
                        .is("actual1", null),

                    // Client Master total clients count
                    supabase
                        .from("client_master")
                        .select("*", { count: "exact", head: true }),

                    // Client Master non-relevant clients count
                    supabase
                        .from("client_master")
                        .select("*", { count: "exact", head: true })
                        .eq("isRelevant", false)
                ]);

                const callCount = callRes.count || 0;
                const enquiryCount = (enquiryLeadsRes.count || 0) + (enquiryDirectRes.count || 0);
                const relevantClientCount = Math.max(0, (clientTotalRes.count || 0) - (clientNotRelevantRes.count || 0));

                setCounts({
                    callTracker: callCount,
                    enquiryTracker: enquiryCount,
                    clientMaster: relevantClientCount
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
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-slate-100 text-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex h-16 items-center justify-start border-b border-slate-100 px-6">
                    <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                        <div className="flex flex-row items-center gap-2">
                            <img src={logoSvg} alt="Divine" className="h-10 w-auto object-contain" />
                            <span className="text-xl font-bold text-sky-600">
                                Divine
                            </span>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            to={route.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${route.active
                                ? "bg-sky-500 text-white shadow-md shadow-sky-200 hover:bg-sky-600"
                                : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                                }`}
                        >
                            <div className="flex items-center">
                                {route.icon}
                                {route.label}
                            </div>
                            {route.href === "/call-tracker" && counts.callTracker !== null && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${route.active ? "bg-white text-sky-600" : "bg-sky-100 text-sky-700"}`}>
                                    {counts.callTracker}
                                </span>
                            )}
                            {route.href === "/enquiry-tracker" && counts.enquiryTracker !== null && (
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${route.active ? "bg-white text-sky-600" : "bg-sky-100 text-sky-700"}`}>
                                    {counts.enquiryTracker}
                                </span>
                            )}
                        </Link>
                    ))}

                    {/* Master Collapsible Menu */}
                    <div>
                        <button
                            onClick={() => setIsMasterOpen(!isMasterOpen)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isMasterActive || isMasterOpen
                                ? "bg-slate-100 text-sky-600"
                                : "text-slate-600 hover:bg-sky-50 hover:text-sky-600"
                                }`}
                        >
                            <div className="flex items-center">
                                <DatabaseIcon className="h-5 w-5 mr-3" />
                                Master
                            </div>
                            {isMasterOpen ? (
                                <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                                <ChevronDownIcon className="h-4 w-4" />
                            )}
                        </button>
                        
                        {/* Master Sub-menu */}
                        {isMasterOpen && (
                            <div className="mt-1 space-y-1 pl-11 pr-3">
                                <Link
                                    to="/master/lead"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        location.pathname === "/master/lead"
                                            ? "bg-sky-50 text-sky-600 font-semibold"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                                    }`}
                                >
                                    Lead Master
                                </Link>
                                <Link
                                    to="/master/client"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        location.pathname === "/master/client"
                                            ? "bg-sky-50 text-sky-600 font-semibold"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                                    }`}
                                >
                                    <span>Client Master</span>
                                    {counts.clientMaster !== null && (
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                                            {counts.clientMaster}
                                        </span>
                                    )}
                                </Link>
                                <Link
                                    to="/master/dropdowns"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        location.pathname === "/master/dropdowns"
                                            ? "bg-sky-50 text-sky-600 font-semibold"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                                    }`}
                                >
                                    Dropdowns
                                </Link>
                                <Link
                                    to="/master/consignors"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        location.pathname === "/master/consignors"
                                            ? "bg-sky-50 text-sky-600 font-semibold"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-sky-600"
                                    }`}
                                >
                                    Consignors
                                </Link>
                            </div>
                        )}
                        
                        {/* Settings for Admins (below Master) */}
                        {isAdmin && isAdmin() && (
                            <div className="pt-2 mt-2 border-t border-slate-100">
                                <Link
                                    to="/setting"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                                        location.pathname.startsWith("/setting")
                                            ? "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 font-semibold shadow-sm border border-sky-100/50"
                                            : "text-slate-600 hover:bg-sky-50 hover:text-sky-600 hover:shadow-sm"
                                    }`}
                                >
                                    <SettingsIcon className="h-5 w-5 mr-3" />
                                    Settings
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="border-t border-slate-100 p-4 space-y-2">
                    <button
                        onClick={logout}
                        className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <LogoutIcon className="h-5 w-5 mr-2" />
                        Logout
                    </button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar
