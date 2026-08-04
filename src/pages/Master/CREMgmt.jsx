import React, { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, RefreshCw, UserCheck, Filter, ShieldCheck, Layers, MapPin, Briefcase } from "lucide-react";
import supabase from "../../utils/supabase";

export default function CREMgmt() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // 'ALL' | 'Group' | 'State' | 'NOB'

  // Dropdown option sources from database
  const [groupOptions, setGroupOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [nobOptions, setNobOptions] = useState([]);
  const [crmOptions, setCrmOptions] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    category: "Group",
    key: "",
    value: "",
  });

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("crm_distribution")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true });

      if (error) {
        console.error("Error fetching CRM distribution rules:", error);
        setData([]);
      } else {
        setData(records || []);
      }
    } catch (err) {
      console.error("Exception fetching crm_distribution:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      // 1. Fetch group names from client_master
      const { data: clients, error: clientErr } = await supabase
        .from("client_master")
        .select("company_group_name");

      if (!clientErr && clients) {
        const uniqueGroups = [...new Set(
          clients.map((c) => c.company_group_name).filter((g) => g && g.trim() !== "")
        )].sort();
        setGroupOptions(uniqueGroups);
      }

      // 2. Fetch state, nob, and crm_name from dropdown table
      const fetchDropdownCat = (category) =>
        supabase.from("dropdown").select("value").eq("category", category);

      const [
        { data: states },
        { data: nobs },
        { data: crms }
      ] = await Promise.all([
        fetchDropdownCat("state"),
        fetchDropdownCat("nob"),
        fetchDropdownCat("crm_name")
      ]);

      const cleanOptions = (arr) =>
        [...new Set((arr || []).map((r) => r.value).filter((v) => v && v.trim() !== ""))].sort();

      setStateOptions(cleanOptions(states));
      setNobOptions(cleanOptions(nobs));
      setCrmOptions(cleanOptions(crms));
    } catch (err) {
      console.error("Error fetching dynamic options for CRM Management:", err);
    }
  };

  const getOptionsForCategory = (category) => {
    if (category === "Group") return groupOptions;
    if (category === "State") return stateOptions;
    if (category === "NOB") return nobOptions;
    return [];
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    if (item && mode === "edit") {
      setFormData({
        category: item.category || "Group",
        key: item.key || "",
        value: item.value || "",
      });
    } else {
      // Default to first available options when adding new
      const initialCat = "Group";
      const availableKeys = getOptionsForCategory(initialCat);
      setFormData({
        category: initialCat,
        key: availableKeys.length > 0 ? availableKeys[0] : "",
        value: crmOptions.length > 0 ? crmOptions[0] : "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleCategoryChange = (newCat) => {
    const availableKeys = getOptionsForCategory(newCat);
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      key: availableKeys.length > 0 ? availableKeys[0] : "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.key || !formData.value) {
      alert("Please ensure Category, Name, and CRM are all selected.");
      return;
    }

    try {
      if (modalMode === "add") {
        // Check if rule already exists for this category and key
        const existing = data.find(
          (r) =>
            (r.category || "").toLowerCase() === formData.category.toLowerCase() &&
            (r.key || "").toLowerCase() === formData.key.toLowerCase()
        );
        if (existing) {
          if (!window.confirm(`A rule for ${formData.category} "${formData.key}" already exists. Do you want to overwrite it with the new CRM?`)) {
            return;
          }
          const { error } = await supabase
            .from("crm_distribution")
            .update({ value: formData.value, updated_at: new Date().toISOString() })
            .eq("uuid", existing.uuid || existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("crm_distribution").insert([{
            category: formData.category,
            key: formData.key,
            value: formData.value,
          }]);
          if (error) throw error;
        }
      } else {
        const targetId = currentItem.uuid || currentItem.id;
        const { error } = await supabase
          .from("crm_distribution")
          .update({
            category: formData.category,
            key: formData.key,
            value: formData.value,
            updated_at: new Date().toISOString()
          })
          .eq(currentItem.uuid ? "uuid" : "id", targetId);
        if (error) throw error;
      }

      handleCloseModal();
      fetchData();
    } catch (err) {
      alert("Error saving CRM rule: " + err.message);
      console.error(err);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete the CRM distribution rule for ${row.category}: "${row.key}"?`)) return;
    try {
      const targetId = row.uuid || row.id;
      const { error } = await supabase
        .from("crm_distribution")
        .delete()
        .eq(row.uuid ? "uuid" : "id", targetId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  const filteredRows = data.filter((item) => {
    const matchesFilter = activeFilter === "ALL" || (item.category || "").toUpperCase() === activeFilter.toUpperCase();
    const matchesSearch =
      !searchQuery ||
      (item.key && item.key.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.value && item.value.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getCategoryBadge = (cat) => {
    const norm = (cat || "").toUpperCase();
    if (norm === "GROUP") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
          <Layers className="w-3.5 h-3.5" />
          Group
        </span>
      );
    }
    if (norm === "STATE") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
          <MapPin className="w-3.5 h-3.5" />
          State
        </span>
      );
    }
    if (norm === "NOB") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
          <Briefcase className="w-3.5 h-3.5" />
          NOB
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
        {cat || "—"}
      </span>
    );
  };

  const currentDynamicOptions = getOptionsForCategory(formData.category);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-7 h-7 text-purple-600" />
              CRM Distribution Master
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure automatic CRM/CRE assignment rules based on Group, State, or NOB hierarchy upon order conversion.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchData();
                fetchOptions();
              }}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition duration-150"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            </button>
            <button
              onClick={() => handleOpenModal("add")}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition duration-150"
            >
              <Plus className="w-5 h-5" />
              Add CRM Rule
            </button>
          </div>
        </div>

        {/* Tab Filter Navigation */}
        <div className="flex items-center space-x-4 border-b border-gray-200 overflow-x-auto">
          {["ALL", "Group", "State", "NOB"].map((tab) => {
            const count = tab === "ALL" ? data.length : data.filter((i) => (i.category || "").toUpperCase() === tab.toUpperCase()).length;
            const isActive = activeFilter.toUpperCase() === tab.toUpperCase();
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab === "ALL" ? "All Categories" : tab}</span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-bold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Instructions */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name or assigned CRM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div className="text-xs text-gray-500 max-w-lg">
            <span className="flex items-center gap-1.5 font-medium text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              Hierarchy Order: Priority 1 (Group) &rarr; Priority 2 (State) &rarr; Priority 3 (NOB)
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">CRM</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    Loading rules...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-gray-500">
                    No CRM distribution rules found for this selection. Click "Add CRM Rule" to configure one.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.uuid || row.id} className="hover:bg-gray-50/70 transition duration-150">
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getCategoryBadge(row.category)}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-900">
                      {row.key || "—"}
                    </td>
                    <td className="py-4 px-6 text-gray-700 font-semibold">
                      {row.value || "—"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal("edit", row)}
                          className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition duration-150"
                          title="Edit CRM mapping"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-150"
                          title="Delete rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === "add" ? "Add CRM Distribution Rule" : "Edit CRM Distribution Rule"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Category Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm font-medium"
                  required
                >
                  <option value="Group">Group</option>
                  <option value="State">State</option>
                  <option value="NOB">NOB</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Selects the hierarchical tier to apply this rule to.
                </p>
              </div>

              {/* Name Dropdown (Dynamic based on Category) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  Name ({formData.category} Option) <span className="text-red-500">*</span>
                </label>
                {currentDynamicOptions.length === 0 ? (
                  <select
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-400 rounded-lg text-sm italic"
                  >
                    <option>No existing {formData.category.toLowerCase()}s found in database</option>
                  </select>
                ) : (
                  <select
                    value={formData.key}
                    onChange={(e) => setFormData((prev) => ({ ...prev, key: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                    required
                  >
                    <option value="" disabled>Select {formData.category}...</option>
                    {currentDynamicOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Options loaded directly from existing {formData.category === "Group" ? "client_master groups" : `dropdown (${formData.category.toLowerCase()} table)`}.
                </p>
              </div>

              {/* CRM Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                  CRM Name <span className="text-red-500">*</span>
                </label>
                {crmOptions.length === 0 ? (
                  <select
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-400 rounded-lg text-sm italic"
                  >
                    <option>No crm_name options found in dropdown table</option>
                  </select>
                ) : (
                  <select
                    value={formData.value}
                    onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm font-semibold text-purple-900"
                    required
                  >
                    <option value="" disabled>Select CRM Representative...</option>
                    {crmOptions.map((crm) => (
                      <option key={crm} value={crm}>
                        {crm}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Source: 'crm_name' records present in the dropdown table.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition duration-150"
                  disabled={currentDynamicOptions.length === 0 || crmOptions.length === 0}
                >
                  {modalMode === "add" ? "Save Rule" : "Update Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
