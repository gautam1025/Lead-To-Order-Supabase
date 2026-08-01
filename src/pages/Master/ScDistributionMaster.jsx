import React, { useState, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, RefreshCw, CheckCircle, Circle, Users, ShieldCheck, ArrowRight, Database } from "lucide-react";
import supabase from "../../utils/supabase";
import { TABLES } from "../../constants/dbSchema";

export default function ScDistributionMaster() {
  const [activeGroup, setActiveGroup] = useState("RESELLER"); // 'RESELLER' | 'OTHER'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scOptions, setScOptions] = useState([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' | 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({
    sc_name: "",
    is_active: true,
    sequence_order: 1,
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
    fetchScOptions();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("sc_distribution")
        .select("*")
        .order("rule_group", { ascending: true })
        .order("sequence_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching SC distribution rules:", error);
        setData([]);
      } else {
        const res = records || [];
        if (res.length > 0) {
          const scNamesList = [...new Set(res.map((r) => r.sc_name).filter(Boolean))];
          const lastLeadMap = {};
          if (scNamesList.length > 0) {
            try {
              const { data: leadsBySc } = await supabase
                .from("leads")
                .select("lead_no, sc_name, created_at")
                .in("sc_name", scNamesList)
                .order("created_at", { ascending: false });

              for (const lead of (leadsBySc || [])) {
                if (lead.sc_name && !lastLeadMap[lead.sc_name] && lead.lead_no) {
                  lastLeadMap[lead.sc_name] = lead.lead_no;
                }
              }
            } catch (err) {
              console.error("Error fetching last assigned lead numbers:", err);
            }
          }
          const rowsWithLastLead = res.map((row) => ({
            ...row,
            last_assigned_lead: lastLeadMap[row.sc_name] || "—",
          }));
          setData(rowsWithLastLead);
        } else {
          setData([]);
        }
      }
    } catch (err) {
      console.error("Exception fetching sc_distribution:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScOptions = async () => {
    try {
      const { data: scData, error } = await supabase
        .from(TABLES.DROPDOWN)
        .select("value")
        .eq("category", "sc_name");

      if (!error && scData) {
        const unique = [...new Set(scData.map(item => item.value).filter(Boolean))].sort();
        setScOptions(unique);
      }
    } catch (err) {
      console.error("Error loading SC dropdown options:", err);
    }
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      const defaultPayloads = [
        { sc_name: "GANGA", rule_group: "RESELLER", is_active: true, is_next_in_line: true, sequence_order: 1 },
        { sc_name: "NIKITA", rule_group: "OTHER", is_active: true, is_next_in_line: true, sequence_order: 1 },
        { sc_name: "PRIYA", rule_group: "OTHER", is_active: true, is_next_in_line: false, sequence_order: 2 },
      ];

      const { error } = await supabase.from("sc_distribution").insert(defaultPayloads);
      if (error) {
        alert("Failed to seed default SCs: " + error.message);
      } else {
        await fetchData();
      }
    } catch (err) {
      console.error("Error seeding:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    if (item && mode === "edit") {
      setFormData({
        sc_name: item.sc_name || "",
        is_active: item.is_active ?? true,
        sequence_order: item.sequence_order || 1,
      });
    } else {
      // Auto sequence order to next available in current group
      const currentGroupCount = data.filter(r => r.rule_group === activeGroup).length;
      setFormData({
        sc_name: scOptions[0] || "",
        is_active: true,
        sequence_order: currentGroupCount + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sc_name.trim()) {
      alert("Please select or enter an SC Name.");
      return;
    }

    try {
      if (modalMode === "add") {
        // If adding to 'OTHER' and it is the first record, set is_next_in_line to true
        const existingGroup = data.filter(r => r.rule_group === activeGroup);
        const isFirst = existingGroup.length === 0;

        const { error } = await supabase.from("sc_distribution").insert([{
          sc_name: formData.sc_name.trim(),
          rule_group: activeGroup,
          is_active: formData.is_active,
          sequence_order: Number(formData.sequence_order) || 1,
          is_next_in_line: isFirst || activeGroup === "RESELLER",
        }]);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sc_distribution").update({
          sc_name: formData.sc_name.trim(),
          is_active: formData.is_active,
          sequence_order: Number(formData.sequence_order) || 1,
          updated_at: new Date().toISOString()
        }).eq("id", currentItem.id);
        if (error) throw error;
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert("Error saving record: " + err.message);
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this Sales Coordinator from the distribution pool?")) return;
    try {
      const { error } = await supabase.from("sc_distribution").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  const handleSetNextInLine = async (id) => {
    try {
      // First clear is_next_in_line for all in the same rule_group
      await supabase
        .from("sc_distribution")
        .update({ is_next_in_line: false })
        .eq("rule_group", activeGroup);

      // Then set true for selected ID
      await supabase
        .from("sc_distribution")
        .update({ is_next_in_line: true, updated_at: new Date().toISOString() })
        .eq("id", id);

      fetchData();
    } catch (err) {
      alert("Error updating next-in-line status: " + err.message);
      console.error(err);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await supabase
        .from("sc_distribution")
        .update({ is_active: !item.is_active, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      fetchData();
    } catch (err) {
      console.error("Error toggling active status:", err);
    }
  };

  const filteredRows = data.filter(item => {
    const matchesGroup = item.rule_group === activeGroup;
    const matchesSearch = !searchQuery || item.sc_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-600" />
              SC Distribution Master
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage automatic Sales Coordinator assignments for new Leads when companies do not exist in Client Master.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
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
              Add SC to Pool
            </button>
          </div>
        </div>

        {/* Empty State / Initialize Defaults Banner */}
        {!loading && data.length === 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center shadow-sm">
            <Database className="w-12 h-12 text-purple-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-purple-900">No SC Distribution Rules Configured Yet</h3>
            <p className="text-sm text-purple-700 max-w-md mx-auto my-2">
              Click the button below to instantly populate the discussed defaults: GANGA for Reseller leads, and a round-robin pool of NIKITA and PRIYA for other leads.
            </p>
            <button
              onClick={handleSeedDefaults}
              disabled={loading}
              className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg shadow transition duration-150"
            >
              Initialize Default SC Pool (GANGA, NIKITA, PRIYA)
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveGroup("RESELLER")}
            className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-colors duration-150 ${
              activeGroup === "RESELLER"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>NOB = RESELLER (Dedicated)</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-bold">
              {data.filter(i => i.rule_group === "RESELLER").length}
            </span>
          </button>
          <button
            onClick={() => setActiveGroup("OTHER")}
            className={`flex items-center gap-2 py-3 px-6 font-semibold text-sm border-b-2 transition-colors duration-150 ${
              activeGroup === "OTHER"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>NOB ≠ RESELLER (Round-Robin Pool)</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 font-bold">
              {data.filter(i => i.rule_group === "OTHER").length}
            </span>
          </button>
        </div>

        {/* Search Bar & Instructions */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Sales Coordinator name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div className="text-xs text-gray-500 max-w-lg">
            {activeGroup === "RESELLER" ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                All new leads with NOB = Reseller will be assigned to the active coordinator below.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                Leads with NOB ≠ Reseller rotate automatically between active pool members upon submission.
              </span>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Sequence</th>
                <th className="py-3.5 px-6">SC Name</th>
                <th className="py-3.5 px-6">Last Assigned Lead No.</th>
                <th className="py-3.5 px-6">Status</th>
                {activeGroup === "OTHER" && <th className="py-3.5 px-6 text-center">Next in Line</th>}
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {filteredRows.length > 0 ? (
                filteredRows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-gray-50/75 transition-colors">
                    <td className="py-4 px-6 font-medium text-gray-500">
                      #{row.sequence_order || index + 1}
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                        {row.sc_name?.slice(0, 2)?.toUpperCase()}
                      </span>
                      {row.sc_name}
                    </td>
                    <td className="py-4 px-6 font-medium">
                      {row.last_assigned_lead && row.last_assigned_lead !== "—" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold shadow-sm">
                          {row.last_assigned_lead}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-normal">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(row)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          row.is_active
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {row.is_active ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-gray-400" />}
                        {row.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    {activeGroup === "OTHER" && (
                      <td className="py-4 px-6 text-center">
                        {row.is_next_in_line ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-xs border border-purple-300">
                            <ArrowRight className="w-3.5 h-3.5 animate-pulse" /> Next Turn
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetNextInLine(row.id)}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full border border-gray-200 transition-colors"
                          >
                            Set as Next
                          </button>
                        )}
                      </td>
                    )}
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal("edit", row)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-400 font-medium">
                    {loading ? "Loading distribution pool..." : `No coordinators configured for ${activeGroup === "RESELLER" ? "Reseller" : "Round-Robin"} pool.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-5 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-gray-800">
              {modalMode === "add" ? "Add SC to Pool" : "Edit SC Rule"} ({activeGroup})
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Sales Coordinator Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  list="scOptionsList"
                  value={formData.sc_name}
                  onChange={(e) => setFormData({ ...formData, sc_name: e.target.value })}
                  placeholder="Select or enter SC name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  required
                />
                <datalist id="scOptionsList">
                  {scOptions.map((opt, idx) => (
                    <option key={idx} value={opt} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Sequence Order
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.sequence_order}
                  onChange={(e) => setFormData({ ...formData, sequence_order: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <p className="text-xs text-gray-400">Determines rotation sequence in the round-robin pool.</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <label htmlFor="isActiveCheck" className="text-sm font-medium text-gray-700">
                  Active in Distribution Pool
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm transition-colors"
                >
                  {modalMode === "add" ? "Add Coordinator" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
