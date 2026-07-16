import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import DataTable from "../../components/DataTable";
import SearchableDropdown from "../../components/SearchableDropdown";
import { mockApi } from "../../services/mockApi";
import ModalForm from "../../components/ModalForm";
import { AuthContext } from "../../App";

function ClientMaster() {
  const { currentUser, isAdmin } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [clientData, setClientData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentClient, setCurrentClient] = useState(null);
  const [formData, setFormData] = useState({
    companyName: "",
    personName: "",
    personNumber: "",
    location: "",
    emailAddress: "",
    state: "",
    gst: "",
    address: ""
  });
  
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const apiCompanies = await mockApi.fetchCompanies();
      const followUps = await mockApi.fetchFollowUps(currentUser, isAdmin);
      const callTrackers = await mockApi.fetchCallTrackers(currentUser, isAdmin);

      const followUpCompanies = new Set(
        (followUps.pending || [])
          .map(item => (item.companyName || "").toLowerCase().trim())
          .filter(Boolean)
      );

      const callTrackerCompanies = new Set(
        [...(callTrackers.pending || []), ...(callTrackers.directEnquiry || [])]
          .map(item => (item.companyName || "").toLowerCase().trim())
          .filter(Boolean)
      );

      const companyHandlePersonMap = {};
      [...(followUps.pending || []), ...(followUps.history || []), ...(callTrackers.pending || []), ...(callTrackers.history || [])].forEach(item => {
        const cName = (item.companyName || item.company || "").toLowerCase().trim();
        if (cName && item.handlePerson) {
          companyHandlePersonMap[cName] = item.handlePerson;
        }
      });

      const formattedData = apiCompanies.map((c, i) => {
        const nameLower = (c.name || "").toLowerCase().trim();
        const inLead = followUpCompanies.has(nameLower);
        const inEnquiry = callTrackerCompanies.has(nameLower);
        
        let trackerStatus = "-";
        if (inLead && inEnquiry) {
          trackerStatus = "Lead / Enquiry";
        } else if (inLead) {
          trackerStatus = "Lead";
        } else if (inEnquiry) {
          trackerStatus = "Enquiry";
        }

        return {
          id: i + 1,
          companyName: c.name || "",
          personName: c.salesPerson || "",
          handlePerson: c.handlePerson || companyHandlePersonMap[nameLower] || "-",
          personNumber: c.phoneNumber || "",
          location: c.location || "",
          emailAddress: c.email || "",
          state: c.consignorState || "",
          address: c.consignorAddress || "",
          gst: c.consignorGSTIN || c.gst || `27ABCDE${1000 + i}F1Z5`,
          trackerStatus
        };
      });

      setClientData(formattedData);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenModal = (mode, client = null) => {
    setModalMode(mode);
    setCurrentClient(client);
    if (client && mode === "edit") {
      setFormData({
        companyName: client.companyName || "",
        personName: client.personName || "",
        personNumber: client.personNumber || "",
        location: client.location || "",
        emailAddress: client.emailAddress || "",
        state: client.state || "",
        gst: client.gst || "",
        address: client.address || ""
      });
    } else {
      setFormData({
        companyName: "",
        personName: "",
        personNumber: "",
        location: "",
        emailAddress: "",
        state: "",
        gst: "",
        address: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentClient(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const apiData = {
      name: formData.companyName,
      salesPerson: formData.personName,
      phoneNumber: formData.personNumber,
      location: formData.location,
      email: formData.emailAddress,
      consignorState: formData.state,
      consignorGSTIN: formData.gst,
      consignorAddress: formData.address
    };

    if (modalMode === "add") {
      await mockApi.addCompany(apiData);
    } else {
      await mockApi.updateCompany(currentClient.companyName, apiData);
    }
    
    await fetchClients();
    handleCloseModal();
  };

  const handleDelete = async (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.companyName}?`)) {
      setIsLoading(true);
      await mockApi.deleteCompany(client.companyName);
      await fetchClients();
    }
  };
  
  // Filter States
  const [companyFilter, setCompanyFilter] = useState([]);
  const [locationFilter, setLocationFilter] = useState([]);
  const [stateFilter, setStateFilter] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const headers = [
    "Action 2",
    "Company Name", 
    "Already In Tracker",
    "Person Name", 
    "Handle Person",
    "Person Number", 
    "Location", 
    "Email Address", 
    "State", 
    "GST",
    "Billing Address", 
    "Actions"
  ];

  const filteredData = clientData.filter(item => {
    const matchesSearch = !searchQuery || 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCompany = companyFilter.length === 0 || companyFilter.includes(item.companyName);
    const matchesLocation = locationFilter.length === 0 || locationFilter.includes(item.location);
    const matchesState = stateFilter.length === 0 || stateFilter.includes(item.state);

    return matchesSearch && matchesCompany && matchesLocation && matchesState;
  });

  const renderRow = (row, index) => {
    const urlParams = new URLSearchParams({
      companyName: row.companyName || "",
      phoneNumber: row.personNumber || "",
      personName: row.personName || "",
      location: row.location || "",
      email: row.emailAddress || "",
      state: row.state || ""
    }).toString();

    return (
      <tr key={index} className="hover:bg-sky-50/30 transition-colors border-b border-gray-100 last:border-0">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={() => navigate(`/leads?${urlParams}`)}
              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-xs font-medium transition-colors"
            >
              Lead
            </button>
            <button 
              onClick={() => navigate(`/enquiry-tracker?action=new-enquiry&${urlParams}`)}
              className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-xs font-medium transition-colors"
            >
              Enquiry
            </button>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.companyName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          {row.trackerStatus === "Lead" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Lead
            </span>
          ) : row.trackerStatus === "Enquiry" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Enquiry
            </span>
          ) : row.trackerStatus === "Lead / Enquiry" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Lead / Enquiry
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.personName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
          {row.handlePerson !== "-" ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              {row.handlePerson}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-600 font-medium">{row.personNumber}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.location}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.emailAddress}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.state}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.gst}</td>
        <td className="px-6 py-4 text-sm text-gray-600 min-w-[200px] truncate max-w-xs" title={row.address}>{row.address}</td>
        
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => handleOpenModal("edit", row)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Edit">
              <Pencil size={16} />
            </button>
            <button onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700 transition-colors" title="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const renderCard = (item, index) => {
    return (
      <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item.companyName}</span>
            {item.trackerStatus !== "-" && (
              <span className={`inline-flex items-center w-fit mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                item.trackerStatus === "Lead" ? "bg-blue-100 text-blue-800" :
                item.trackerStatus === "Enquiry" ? "bg-emerald-100 text-emerald-800" :
                "bg-purple-100 text-purple-800"
              }`}>
                {item.trackerStatus}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-sky-600">{item.personNumber}</span>
        </div>
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-800">Contact:</span> {item.personName}
        </div>
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-800">Handle Person:</span> {item.handlePerson}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-800">Email:</span> {item.emailAddress}
        </div>
        <div className="flex justify-end gap-4 mt-2 pt-2 border-t border-gray-100">
          <button onClick={() => handleOpenModal("edit", item)} className="text-blue-500" title="Edit"><Pencil size={16} /></button>
          <button onClick={() => handleDelete(item)} className="text-red-500" title="Delete"><Trash2 size={16} /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
        
        {/* Top Filter & Controls Section */}
        <div className="flex flex-col gap-3 mb-3 bg-white shrink-0 p-1">
          <div className="flex flex-wrap items-center gap-2 shrink-0 pb-1 w-full">
            
            {/* Title / Label */}
            <div className="text-lg font-bold text-gray-800 shrink-0 mr-2 border-r border-gray-200 pr-4">
              Client Details
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 min-w-[150px] max-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 block pl-10 h-9"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex-1 min-w-[120px] max-w-[200px] z-[60]">
              <SearchableDropdown
                isMulti={true}
                value={companyFilter}
                onChange={(val) => setCompanyFilter(val)}
                options={clientData.map(c => ({ value: c.companyName, label: c.companyName, count: 1 }))}
                placeholder="All Companies"
                height="h-9"
                rounded="rounded-md"
                className="dropdown-container"
              />
            </div>

            <div className="flex-1 min-w-[120px] max-w-[200px] z-[50]">
              <SearchableDropdown
                isMulti={true}
                value={locationFilter}
                onChange={(val) => setLocationFilter(val)}
                options={Array.from(new Set(clientData.map(c => c.location).filter(Boolean))).map(l => ({ value: l, label: l, count: 1 }))}
                placeholder="All Locations"
                height="h-9"
                rounded="rounded-md"
                className="dropdown-container"
              />
            </div>

            <div className="flex-1 min-w-[120px] max-w-[200px] z-[40]">
              <SearchableDropdown
                isMulti={true}
                value={stateFilter}
                onChange={(val) => setStateFilter(val)}
                options={Array.from(new Set(clientData.map(c => c.state).filter(Boolean))).map(s => ({ value: s, label: s, count: 1 }))}
                placeholder="All States"
                height="h-9"
                rounded="rounded-md"
                className="dropdown-container"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {((companyFilter.length > 0) || (locationFilter.length > 0) || (stateFilter.length > 0) || searchQuery) && (
                <button
                  className="px-3 h-9 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors shrink-0"
                  onClick={() => {
                    setCompanyFilter([])
                    setLocationFilter([])
                    setStateFilter([])
                    setSearchQuery("")
                  }}
                >
                  Clear Filters
                </button>
              )}
              <button onClick={fetchClients} className="px-3 h-9 bg-white border border-gray-300 rounded-md shadow-sm text-gray-600 hover:bg-gray-50 hover:text-sky-600 transition-colors" title="Refresh">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>
              <button onClick={() => handleOpenModal("add")} className="px-3 h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2">
                <Plus size={16} />
                <span className="font-medium text-sm">Add Client</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Table Area */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <DataTable 
            headers={headers}
            data={filteredData}
            renderRow={renderRow}
            renderCard={renderCard}
            minWidth="1200px"
            currentPage={currentPage}
            totalPages={Math.ceil(filteredData.length / itemsPerPage) || 1}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            totalResults={filteredData.length}
            itemsPerPageOptions={[10, 15, 20, 50, 100]}
          />
        </div>

        <ModalForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={modalMode === "add" ? "Add Client" : "Edit Client"}
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Person Name</label>
              <input required value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Person Number</label>
              <input required value={formData.personNumber} onChange={e => setFormData({...formData, personNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input type="email" value={formData.emailAddress} onChange={e => setFormData({...formData, emailAddress: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">GST</label>
              <input value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Billing Address</label>
              <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-md" rows="2" />
            </div>
          </div>
        </ModalForm>
    </div>
  );
}

export default ClientMaster;
