import { MenuIcon } from "./Icons"
import { useContext } from "react"
import { AuthContext } from "../App"
import { useLocation } from "react-router-dom"

function MainNav({ logout, setMobileMenuOpen }) {
  const authContext = useContext(AuthContext) || {}
  const { currentUser = null, userType = null, isAdmin = () => false } = authContext
  const location = useLocation()

  const getPageHeader = () => {
    const path = location.pathname
    if (path === "/") return {
      title: "Leads To Order System",
      description: "Monitor your sales pipeline and track conversions in real-time"
    }
    if (path.startsWith("/leads")) return {
      title: "Lead Management",
      description: "Enter the details of the new lead"
    }
    if (path.startsWith("/call-tracker")) return {
      title: "Call Tracker",
      description: "Track and manage all your follow-up calls"
    }
    if (path.startsWith("/enquiry-tracker")) return {
      title: "Enquiry Tracker",
      description: "Track the progress of enquiries through the sales pipeline"
    }
    if (path.startsWith("/quotation")) return {
      title: "Quotation",
      description: "Create and manage quotations for your leads"
    }
    if (path.startsWith("/report")) return {
      title: "Reports",
      description: "View sales performance reports and charts"
    }
    if (path.startsWith("/master/lead")) return {
      title: "Lead Master",
      description: "Manage lead source configurations"
    }
    if (path.startsWith("/master/client")) return {
      title: "Client Master",
      description: "Manage client master list"
    }
    if (path.startsWith("/setting")) return {
      title: "Settings",
      description: "System settings and database management"
    }
    return { title: "", description: "" }
  }

  const { title, description } = getPageHeader()
  const showAdminView = (location.pathname.startsWith("/call-tracker") || location.pathname.startsWith("/enquiry-tracker")) && isAdmin && isAdmin()

  return (
    <header className="sticky top-0 z-40 flex h-auto min-h-[4rem] w-full items-center justify-between border-b bg-white px-4 py-2 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button
          type="button"
          className="text-slate-500 hover:text-slate-700 focus:outline-none md:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <MenuIcon className="h-6 w-6" />
        </button>

        <div className="flex flex-col">
          {title && <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">{title}</h1>}
          <div className="flex items-center gap-2 mt-0.5">
            {description && <p className="text-sm text-slate-500 hidden md:block">{description}</p>}
            {description && showAdminView && <span className="hidden md:block text-slate-300">|</span>}
            {showAdminView && <p className="text-green-600 font-semibold text-xs">Admin View: Showing all data</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {currentUser?.username || "User"}
          </span>
          {userType && (
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                userType === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {userType}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}

export default MainNav
