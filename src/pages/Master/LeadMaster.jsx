import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, RefreshCw, ChevronDown, CheckCircle, Circle } from "lucide-react";
import DataTable from "../../components/DataTable";
import SearchableDropdown from "../../components/SearchableDropdown";
import ModalForm from "../../components/ModalForm";
import supabase from "../../utils/supabase";
import { TABLES, COLUMNS } from "../../constants/dbSchema";

const CATEGORY_OPTIONS = [
  { value: "Lead Source", label: "Lead Source" },
  { value: "NOB", label: "Nature of Business" },
  { value: "State", label: "State" },
  { value: "Group Name", label: "Group Name" },
  { value: "Sales Type", label: "Sales Type" }
];

function LeadMaster() {
  const [activeMaster, setActiveMaster] = useState("Lead Source");
  const [globalActiveCategory, setGlobalActiveCategory] = useState(null); // fetched from SC_active_category
  const [searchQuery, setSearchQuery] = useState("");
  
  const [tableData, setTableData] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [scOptions, setScOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, [activeMaster]);

  const loadData = async () => {
    setIsLoading(true);
    // Fetch from SC_management where category = activeMaster
    const { data: scData, error: scError } = await supabase
      .from(TABLES.SC_MANAGEMENT)
      .select("*")
      .eq("category", activeMaster)
      .order('created_at', { ascending: false });
    if (scData) {
      setTableData(scData);
    }
    // Fetch global active category by checking which category is active in SC_management
    try {
      const { data: activeRows } = await supabase.from(TABLES.SC_MANAGEMENT).select("category").eq("isActive", true).limit(1);
      if (activeRows && activeRows.length > 0) {
        setGlobalActiveCategory(activeRows[0].category);
      } else {
        setGlobalActiveCategory(null);
      }
    } catch (error) {
      console.warn("Could not fetch active category from SC_management", error);
    }
    setIsLoading(false);
  };

  const loadDropdowns = async () => {
    // Helper: fetch all values for a given category from the normalized dropdown table
    const fetchCategory = (category) =>
      supabase.from(TABLES.DROPDOWN).select("value").eq("category", category);

    try {
      const [
        { data: scData },
        { data: sourcesData },
        { data: nobData },
        { data: statesData },
        { data: salesTypesData },
      ] = await Promise.all([
        fetchCategory("sc_name"),
        fetchCategory("lead_source"),
        fetchCategory("nob"),
        fetchCategory("state"),
        fetchCategory("sales_type"),
      ]);

      const toValues = (arr) =>
        [...new Set((arr || []).map(r => r.value).filter(Boolean))].sort();

      setScOptions(toValues(scData));

      setDropdownOptions({
        "Lead Source": toValues(sourcesData),
        "NOB": toValues(nobData),
        "State": toValues(statesData),
        "Sales Type": toValues(salesTypesData),
      });
    } catch (error) {
      console.error("Error loading dropdowns:", error);
    }
  };

  const handleSetActiveCategory = async () => {
    try {
      // First, set all currently active rows to false
      await supabase.from(TABLES.SC_MANAGEMENT).update({ isActive: false }).eq("isActive", true);
      
      // Then, set the rows matching the newly selected category to true
      await supabase.from(TABLES.SC_MANAGEMENT).update({ isActive: true }).eq("category", activeMaster);

      setGlobalActiveCategory(activeMaster);
    } catch (error) {
      alert("Error updating active category.");
      console.error(error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ key: "", value: "" });

  // Filter States
  const [keyFilter, setKeyFilter] = useState([]);
  const [valueFilter, setValueFilter] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    if (item && mode === "edit") {
      setFormData({ key: item.key, value: item.value });
    } else {
      setFormData({ key: "", value: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === "add") {
      await supabase.from(TABLES.SC_MANAGEMENT).insert([{
        key: formData.key,
        value: formData.value,
        category: activeMaster,
        isActive: activeMaster === globalActiveCategory
      }]);
    } else {
      await supabase.from(TABLES.SC_MANAGEMENT).update({
        key: formData.key,
        value: formData.value,
        updated_at: new Date().toISOString()
      }).eq("uuid", currentItem.uuid);
    }
    handleCloseModal();
    loadData();
  };

  const handleDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await supabase.from(TABLES.SC_MANAGEMENT).delete().eq("uuid", item.uuid);
      loadData();
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setKeyFilter([]);
    setValueFilter([]);
  };

  const filteredData = tableData.filter(item => {
    const matchesSearch = !searchQuery || 
      String(item.key).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.value).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesKey = keyFilter.length === 0 || keyFilter.includes(item.key);
    const matchesValue = valueFilter.length === 0 || valueFilter.includes(item.value);

    return matchesSearch && matchesKey && matchesValue;
  });

  const getHeaders = () => {
    return ["Serial No", "Timestamp", activeMaster + " Name", "Assign Name (SC)", "Actions"];
  };

  const renderRow = (row, index) => {
    return (
      <tr key={row.uuid} className="hover:bg-sky-50/30 transition-colors border-b border-gray-100 last:border-0">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{index + 1}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-sky-600">
          {new Date(row.created_at).toLocaleString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{row.key}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{row.value}</td>
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
      <div key={item.uuid} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-gray-800">#{index + 1}</span>
          <span className="text-xs font-medium text-sky-600">{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          <span className="font-medium text-gray-800">{activeMaster}:</span> {item.key}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-800">SC Name:</span> {item.value}
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
      {/* Top Controls Bar */}
      <div className="flex flex-col gap-3 mb-3 bg-white shrink-0 p-3 shadow-sm rounded-lg border border-gray-100">
        
        {/* Active Rule Banner */}
        <div className="flex justify-between items-center bg-sky-50 p-3 rounded-md border border-sky-100">
          <div className="flex items-center gap-2">
             <span className="text-sky-800 font-medium">Currently Viewing:</span>
             <span className="text-sky-900 font-bold px-2 py-1 bg-white rounded shadow-sm">{activeMaster}</span>
          </div>
          <div className="flex items-center gap-4">
             {globalActiveCategory === activeMaster ? (
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md font-medium border border-emerald-200">
                  <CheckCircle size={18} /> Active SC Rule
                </div>
             ) : (
                <button 
                  onClick={handleSetActiveCategory}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-md font-medium border border-gray-300 hover:border-emerald-300 transition-colors"
                >
                  <Circle size={18} /> Set as Active Rule
                </button>
             )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full">
          {/* Master Selector Dropdown */}
          <div className="relative shrink-0 z-[70] min-w-[200px]">
            <select 
              value={activeMaster}
              onChange={(e) => {
                setActiveMaster(e.target.value);
                clearFilters(); // Clear filters on tab change
              }}
              className="appearance-none w-full bg-white border border-sky-500 text-sky-600 font-semibold py-2 pl-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              {CATEGORY_OPTIONS.map(opt => (
                 <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-sky-600">
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[120px] max-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 block pl-10 h-10"
            />
          </div>

          <div className="flex-1 min-w-[120px] max-w-[200px] z-[60]">
            <SearchableDropdown
              isMulti={true}
              value={keyFilter}
              onChange={(val) => setKeyFilter(val)}
              options={Array.from(new Set(tableData.map(c => c.key))).map(l => ({ value: l, label: l, count: tableData.filter(d => d.key === l).length }))}
              placeholder={`All ${activeMaster}`}
              height="h-10"
              rounded="rounded-md"
              className="dropdown-container"
            />
          </div>

          <div className="flex-1 min-w-[120px] max-w-[200px] z-[50]">
            <SearchableDropdown
              isMulti={true}
              value={valueFilter}
              onChange={(val) => setValueFilter(val)}
              options={Array.from(new Set(tableData.map(c => c.value))).map(l => ({ value: l, label: l, count: tableData.filter(d => d.value === l).length }))}
              placeholder="All SC Names"
              height="h-10"
              rounded="rounded-md"
              className="dropdown-container"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {((keyFilter.length > 0) || (valueFilter.length > 0) || searchQuery) && (
              <button
                className="px-3 h-10 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors shrink-0"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
            <button onClick={loadData} className="px-3 h-10 bg-white border border-gray-300 rounded-md shadow-sm text-gray-600 hover:bg-gray-50 hover:text-sky-600 transition-colors">
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => handleOpenModal("add")} className="px-4 h-10 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2">
              <Plus size={18} />
              <span className="font-medium text-sm hidden sm:inline">Add New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <DataTable 
          headers={getHeaders()}
          data={filteredData}
          renderRow={renderRow}
          renderCard={renderCard}
          minWidth="1000px"
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
        title={modalMode === "add" ? `Add New ${activeMaster}` : `Edit ${activeMaster}`}
        onSubmit={handleSubmit}
      >
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {activeMaster}
            </label>
            <select
              required
              value={formData.key}
              onChange={e => setFormData({...formData, key: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Select {activeMaster}</option>
              {dropdownOptions[activeMaster]?.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Assign SC Name</label>
            <select
              required
              value={formData.value}
              onChange={e => setFormData({...formData, value: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Select SC Name</option>
              {scOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </ModalForm>
    </div>
  );
}

export default LeadMaster;
