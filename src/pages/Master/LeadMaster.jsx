import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import DataTable from "../../components/DataTable";
import SearchableDropdown from "../../components/SearchableDropdown";
import ModalForm from "../../components/ModalForm";

import { mockApi } from "../../services/mockApi";

const GroupMasterData = [
  { id: 1, timestamp: "2023-10-01 10:00", groupName: "Retail", personName: "Sneha Gupta" },
  { id: 2, timestamp: "2023-10-02 11:30", groupName: "Corporate", personName: "Vikram Reddy" },
];

const StateMasterData = [
  { id: 1, timestamp: "2023-10-01 10:00", stateName: "Maharashtra", personName: "Neha Desai" },
  { id: 2, timestamp: "2023-10-02 11:30", stateName: "Delhi", personName: "Arjun Verma" },
];

function LeadMaster() {
  const [activeMaster, setActiveMaster] = useState("sc"); // 'sc', 'group', 'state'
  const [searchQuery, setSearchQuery] = useState("");
  
  const [scData, setScData] = useState([]);
  const [groupData, setGroupData] = useState(GroupMasterData);
  const [stateData, setStateData] = useState(StateMasterData);

  useEffect(() => {
    const loadMasters = async () => {
      const fetchedSc = await mockApi.fetchScMaster();
      setScData(fetchedSc);
    };
    loadMasters();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({ nameValue: "", personName: "" });
  
  // Filter States
  const [sourceFilter, setSourceFilter] = useState([]);
  const [groupFilter, setGroupFilter] = useState([]);
  const [stateFilter, setStateFilter] = useState([]);
  const [personFilter, setPersonFilter] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const getHeaders = () => {
    if (activeMaster === "sc") {
      return ["Serial No", "Timestamp", "Source Name", "Person Name", "Actions"];
    } else if (activeMaster === "group") {
      return ["Serial No", "Timestamp", "Group Name", "Person Name", "Actions"];
    } else {
      return ["Serial No", "Timestamp", "State Name", "Person Name", "Actions"];
    }
  };

  const getData = () => {
    if (activeMaster === "sc") return scData;
    if (activeMaster === "group") return groupData;
    return stateData;
  };

  const data = getData();

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    if (item && mode === "edit") {
      setFormData({
        nameValue: activeMaster === "sc" ? item.sourceName : (activeMaster === "group" ? item.groupName : item.stateName),
        personName: item.personName
      });
    } else {
      setFormData({ nameValue: "", personName: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const timestamp = new Date().toISOString().slice(0,16).replace('T', ' ');
    
    if (activeMaster === "sc") {
      const dataPayload = { 
        sourceName: formData.nameValue, 
        personName: formData.personName,
        timestamp: timestamp
      };
      if (modalMode === "add") {
        mockApi.addScMaster(dataPayload).then(() => mockApi.fetchScMaster().then(setScData));
      } else {
        mockApi.updateScMaster(currentItem.id, dataPayload).then(() => mockApi.fetchScMaster().then(setScData));
      }
    } else if (activeMaster === "group") {
      if (modalMode === "add") {
        setGroupData([...groupData, { id: groupData.length + 1, timestamp, groupName: formData.nameValue, personName: formData.personName }]);
      } else {
        setGroupData(groupData.map(d => d.id === currentItem.id ? { ...d, groupName: formData.nameValue, personName: formData.personName } : d));
      }
    } else if (activeMaster === "state") {
      if (modalMode === "add") {
        setStateData([...stateData, { id: stateData.length + 1, timestamp, stateName: formData.nameValue, personName: formData.personName }]);
      } else {
        setStateData(stateData.map(d => d.id === currentItem.id ? { ...d, stateName: formData.nameValue, personName: formData.personName } : d));
      }
    }
    handleCloseModal();
  };

  const handleDelete = (item) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      if (activeMaster === "sc") {
        mockApi.deleteScMaster(item.id).then(() => mockApi.fetchScMaster().then(setScData));
      }
      if (activeMaster === "group") setGroupData(groupData.filter(d => d.id !== item.id));
      if (activeMaster === "state") setStateData(stateData.filter(d => d.id !== item.id));
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = !searchQuery || 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesSource = sourceFilter.length === 0 || sourceFilter.includes(item.sourceName);
    const matchesGroup = groupFilter.length === 0 || groupFilter.includes(item.groupName);
    const matchesState = stateFilter.length === 0 || stateFilter.includes(item.stateName);
    const matchesPerson = personFilter.length === 0 || personFilter.includes(item.personName);

    return matchesSearch && matchesSource && matchesGroup && matchesState && matchesPerson;
  });

  const renderRow = (row, index) => {
    return (
      <tr key={index} className="hover:bg-sky-50/30 transition-colors border-b border-gray-100 last:border-0">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{row.id}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-sky-600">{row.timestamp}</td>
        
        {/* Dynamic Column */}
        {activeMaster === "sc" && <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{row.sourceName}</td>}
        {activeMaster === "group" && <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{row.groupName}</td>}
        {activeMaster === "state" && <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">{row.stateName}</td>}
        
        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{row.personName}</td>
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
    // Basic mobile card view to satisfy DataTable component requirements
    return (
      <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-gray-800">#{item.id}</span>
          <span className="text-xs font-medium text-sky-600">{item.timestamp}</span>
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-800">Name:</span> {item.personName}
        </div>
        <div className="flex justify-end gap-4 mt-2 pt-2 border-t border-gray-100">
          <button onClick={() => handleOpenModal("edit", item)} className="text-blue-500" title="Edit"><Pencil size={16} /></button>
          <button onClick={() => handleDelete(item)} className="text-red-500" title="Delete"><Trash2 size={16} /></button>
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSourceFilter([]);
    setGroupFilter([]);
    setStateFilter([]);
    setPersonFilter([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
        
        {/* Top Controls Bar */}
        <div className="flex flex-col gap-3 mb-3 bg-white shrink-0 p-1">
          <div className="flex flex-wrap items-center gap-2 shrink-0 pb-1 w-full">
            
            {/* Master Selector Dropdown */}
            <div className="relative shrink-0 z-[70] min-w-[160px]">
              <select 
                value={activeMaster}
                onChange={(e) => {
                  setActiveMaster(e.target.value);
                  clearFilters(); // Clear filters on tab change
                }}
                className="appearance-none w-full bg-white border border-sky-500 text-sky-600 font-semibold py-1.5 pl-3 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 h-9 cursor-pointer"
              >
                <option value="sc">SC Master</option>
                <option value="group">Group Master</option>
                <option value="state">State Master</option>
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
                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 block pl-10 h-9"
              />
            </div>

            {/* Dynamic Filter Dropdowns based on active master */}
            {activeMaster === "sc" && (
              <div className="flex-1 min-w-[120px] max-w-[200px] z-[60]">
                <SearchableDropdown
                  isMulti={true}
                  value={sourceFilter}
                  onChange={(val) => setSourceFilter(val)}
                  options={Array.from(new Set(scData.map(c => c.sourceName))).map(l => ({ value: l, label: l, count: scData.filter(d => d.sourceName === l).length }))}
                  placeholder="All Sources"
                  height="h-9"
                  rounded="rounded-md"
                  className="dropdown-container"
                />
              </div>
            )}

            {activeMaster === "group" && (
              <div className="flex-1 min-w-[120px] max-w-[200px] z-[60]">
                <SearchableDropdown
                  isMulti={true}
                  value={groupFilter}
                  onChange={(val) => setGroupFilter(val)}
                  options={Array.from(new Set(groupData.map(c => c.groupName))).map(l => ({ value: l, label: l, count: groupData.filter(d => d.groupName === l).length }))}
                  placeholder="All Groups"
                  height="h-9"
                  rounded="rounded-md"
                  className="dropdown-container"
                />
              </div>
            )}

            {activeMaster === "state" && (
              <div className="flex-1 min-w-[120px] max-w-[200px] z-[60]">
                <SearchableDropdown
                  isMulti={true}
                  value={stateFilter}
                  onChange={(val) => setStateFilter(val)}
                  options={Array.from(new Set(stateData.map(c => c.stateName))).map(l => ({ value: l, label: l, count: stateData.filter(d => d.stateName === l).length }))}
                  placeholder="All States"
                  height="h-9"
                  rounded="rounded-md"
                  className="dropdown-container"
                />
              </div>
            )}

            <div className="flex-1 min-w-[120px] max-w-[200px] z-[50]">
              <SearchableDropdown
                isMulti={true}
                value={personFilter}
                onChange={(val) => setPersonFilter(val)}
                options={Array.from(new Set(data.map(c => c.personName))).map(l => ({ value: l, label: l, count: data.filter(d => d.personName === l).length }))}
                placeholder="All Persons"
                height="h-9"
                rounded="rounded-md"
                className="dropdown-container"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              {((sourceFilter.length > 0) || (groupFilter.length > 0) || (stateFilter.length > 0) || (personFilter.length > 0) || searchQuery) && (
                <button
                  className="px-3 h-9 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors shrink-0"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              )}
              <button className="px-3 h-9 bg-white border border-gray-300 rounded-md shadow-sm text-gray-600 hover:bg-gray-50 hover:text-sky-600 transition-colors">
                <RefreshCw size={16} />
              </button>
              <button onClick={() => handleOpenModal("add")} className="px-3 h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2">
                <Plus size={16} />
                <span className="font-medium text-sm hidden sm:inline">Add New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Table Area (flex-1 to take remaining height) */}
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
        title={modalMode === "add" ? `Add New ${activeMaster.toUpperCase()}` : `Edit ${activeMaster.toUpperCase()}`}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {activeMaster === "sc" ? "Source Name" : (activeMaster === "group" ? "Group Name" : "State Name")}
            </label>
            <input required value={formData.nameValue} onChange={e => setFormData({...formData, nameValue: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Assign Name (SC Name)</label>
            <input required value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}

export default LeadMaster;
