import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import DataTable from "../../components/DataTable";
import SearchableDropdown from "../../components/SearchableDropdown";
import supabase from "../../utils/supabase";
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
    clientName: "",
    clientMobileNumber: "",
    state: "",
    billingAddress: "",
    gstNumber: "",
    companyGroupName: "",
    scName: "",
    crmName: "",
    stateCode: "",
    creditDays: "",
    creditLimit: ""
  });
  
  const fetchClients = async () => {
    setIsLoading(true);
    try {
      // Fetch ALL clients from Supabase using range pagination
      let clientsData = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error: clientErr } = await supabase
          .from("client_master")
          .select("*")
          .order('company_name', { ascending: true })
          .range(from, from + step - 1);

        if (clientErr) throw clientErr;

        if (data && data.length > 0) {
          clientsData = [...clientsData, ...data];
          from += step;
          if (data.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      // Fetch active tracking leads
      const { data: leadsData } = await supabase
        .from("leads_to_order")
        .select("Company_Name, Leads_Tracking_Status")
        .eq("Leads_Tracking_Status", "Pending");
      const { data: enquiryData } = await supabase
        .from("enquiry_to_order")
        .select("company_name, current_stage")
        .ilike("current_stage", "pending");

      const leadCompanies = new Set((leadsData || []).map(l => (l.Company_Name || "").toLowerCase().trim()).filter(Boolean));
      const enquiryCompanies = new Set((enquiryData || []).map(e => (e.company_name || "").toLowerCase().trim()).filter(Boolean));

      const formattedData = (clientsData || []).map((c, i) => {
        const nameLower = (c.company_name || "").toLowerCase().trim();
        const inLead = leadCompanies.has(nameLower);
        const inEnquiry = enquiryCompanies.has(nameLower);
        
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
          uuid: c.uuid,
          companyName: c.company_name || "",
          clientName: c.client_name || "",
          clientMobileNumber: c.client_mobile_number || "",
          state: c.state || "",
          billingAddress: c.billing_address || "",
          gstNumber: c.gst_number || "",
          companyGroupName: c.company_group_name || "",
          scName: c.sc_name || "",
          crmName: c.crm_name || "",
          stateCode: c.state_code || "",
          creditDays: c.credit_days ?? "",
          creditLimit: c.credit_limit ?? "",
          isRelevant: c.isRelevant !== false,
          trackerStatus
        };
      }).sort((a, b) => a.companyName.localeCompare(b.companyName, undefined, { sensitivity: 'base' }));

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
        clientName: client.clientName || "",
        clientMobileNumber: client.clientMobileNumber || "",
        state: client.state || "",
        billingAddress: client.billingAddress || "",
        gstNumber: client.gstNumber || "",
        companyGroupName: client.companyGroupName || "",
        scName: client.scName || "",
        crmName: client.crmName || "",
        stateCode: client.stateCode || "",
        creditDays: client.creditDays !== "" ? String(client.creditDays) : "",
        creditLimit: client.creditLimit !== "" ? String(client.creditLimit) : ""
      });
    } else {
      setFormData({
        companyName: "",
        clientName: "",
        clientMobileNumber: "",
        state: "",
        billingAddress: "",
        gstNumber: "",
        companyGroupName: "",
        scName: "",
        crmName: "",
        stateCode: "",
        creditDays: "",
        creditLimit: ""
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
    const supabaseData = {
      company_name: formData.companyName,
      client_name: formData.clientName || null,
      client_mobile_number: formData.clientMobileNumber || null,
      state: formData.state || null,
      billing_address: formData.billingAddress || null,
      gst_number: formData.gstNumber || null,
      company_group_name: formData.companyGroupName || null,
      sc_name: formData.scName || null,
      crm_name: formData.crmName || null,
      state_code: formData.stateCode || null,
      credit_days: formData.creditDays !== "" && formData.creditDays !== null ? parseInt(formData.creditDays, 10) : null,
      credit_limit: formData.creditLimit !== "" && formData.creditLimit !== null ? parseFloat(formData.creditLimit) : null,
      updated_at: new Date().toISOString()
    };

    try {
      if (modalMode === "add") {
        const { error } = await supabase.from("client_master").insert([supabaseData]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_master")
          .update(supabaseData)
          .eq("uuid", currentClient.uuid);
        if (error) throw error;
      }
      
      await fetchClients();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving client:", err);
      alert("Failed to save client: " + (err.message || err));
      setIsLoading(false);
    }
  };

  const handleDelete = async (client) => {
    if (window.confirm(`Are you sure you want to delete ${client.companyName}?`)) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("client_master")
          .delete()
          .eq("uuid", client.uuid);
        if (error) throw error;
        await fetchClients();
      } catch (err) {
        console.error("Error deleting client:", err);
        alert("Failed to delete client: " + (err.message || err));
        setIsLoading(false);
      }
    }
  };
  
  // Filter States
  const [companyFilter, setCompanyFilter] = useState([]);
  const [stateFilter, setStateFilter] = useState([]);
  const [relevanceFilter, setRelevanceFilter] = useState("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const headers = [
    "Actions",
    "Action 2",
    "Company Name", 
    "Relevance",
    "Already In Tracker",
    "Client Name", 
    "Mobile Number", 
    "Company Group",
    "SC Name", 
    "CRM Name", 
    "State", 
    "State Code",
    "GST Number",
    "Billing Address", 
    "Credit Days",
    "Credit Limit"
  ];

  const filteredData = clientData.filter(item => {
    const matchesSearch = !searchQuery || 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCompany = companyFilter.length === 0 || companyFilter.includes(item.companyName);
    const matchesState = stateFilter.length === 0 || stateFilter.includes(item.state);
    const matchesRelevance = relevanceFilter === "all" || 
      (relevanceFilter === "relevant" && item.isRelevant) ||
      (relevanceFilter === "not_relevant" && !item.isRelevant);

    return matchesSearch && matchesCompany && matchesState && matchesRelevance;
  });

  const renderRow = (row, index) => {
    const urlParams = new URLSearchParams({
      companyName: row.companyName || "",
      phoneNumber: row.clientMobileNumber || "",
      personName: row.clientName || "",
      state: row.state || "",
      groupName: row.companyGroupName || "",
      gstNumber: row.gstNumber || "",
      billingAddress: row.billingAddress || "",
      scName: row.scName || "",
      crmName: row.crmName || ""
    }).toString();

    return (
      <tr key={row.uuid || index} className="hover:bg-sky-50/30 transition-colors border-b border-gray-100 last:border-0">
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
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">{row.companyName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
          {row.isRelevant ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Relevant
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
              Not Relevant
            </span>
          )}
        </td>
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
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.clientName || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-sky-600 font-medium text-center">{row.clientMobileNumber || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.companyGroupName || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
          {row.scName ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              {row.scName}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.crmName || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.state || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.stateCode || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.gstNumber || "-"}</td>
        <td className="px-6 py-4 text-sm text-gray-600 min-w-[200px] truncate max-w-xs text-center" title={row.billingAddress}>{row.billingAddress || "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.creditDays !== "" ? row.creditDays : "-"}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{row.creditLimit !== "" ? row.creditLimit : "-"}</td>
      </tr>
    );
  };

  const renderCard = (item, index) => {
    return (
      <div key={item.uuid || index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
          <span className="text-xs font-medium text-sky-600">{item.clientMobileNumber}</span>
        </div>
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-800">Client Name:</span> {item.clientName || "-"}
        </div>
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-800">SC Name:</span> {item.scName || "-"}
        </div>
        <div className="text-sm text-gray-600 mb-1">
          <span className="font-medium text-gray-800">CRM Name:</span> {item.crmName || "-"}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-800">GST:</span> {item.gstNumber || "-"}
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

            <div className="flex-1 min-w-[120px] max-w-[200px] z-[30]">
              <select
                value={relevanceFilter}
                onChange={(e) => setRelevanceFilter(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="all">All Relevance</option>
                <option value="relevant">Relevant Only</option>
                <option value="not_relevant">Not Relevant Only</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {((companyFilter.length > 0) || (stateFilter.length > 0) || relevanceFilter !== "all" || searchQuery) && (
                <button
                  className="px-3 h-9 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors shrink-0"
                  onClick={() => {
                    setCompanyFilter([])
                    setStateFilter([])
                    setRelevanceFilter("all")
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
            minWidth="1600px"
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
              <label className="block text-sm font-medium text-gray-700">Company Name *</label>
              <input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Client Mobile Number</label>
              <input value={formData.clientMobileNumber} onChange={e => setFormData({...formData, clientMobileNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Company Group Name</label>
              <input value={formData.companyGroupName} onChange={e => setFormData({...formData, companyGroupName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">SC Name</label>
              <input value={formData.scName} onChange={e => setFormData({...formData, scName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">CRM Name</label>
              <input value={formData.crmName} onChange={e => setFormData({...formData, crmName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">State Code</label>
              <input value={formData.stateCode} onChange={e => setFormData({...formData, stateCode: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">GST Number</label>
              <input value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Credit Days</label>
              <input type="number" value={formData.creditDays} onChange={e => setFormData({...formData, creditDays: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Credit Limit</label>
              <input type="number" step="0.01" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Billing Address</label>
              <textarea value={formData.billingAddress} onChange={e => setFormData({...formData, billingAddress: e.target.value})} className="w-full px-3 py-2 border rounded-md" rows="2" />
            </div>
          </div>
        </ModalForm>
    </div>
  );
}

export default ClientMaster;
