import React, { useState, useEffect } from "react";
import supabase from "../../utils/supabase";
import { PlusIcon, PencilIcon, TrashIcon } from "../../components/Icons";

const Dropdowns = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ category: "", value: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: dropdownData, error } = await supabase
        .from("dropdown")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;

      setData(dropdownData || []);
      const uniqueCategories = [...new Set((dropdownData || []).map((item) => item.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching dropdowns:", error);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (editData = null) => {
    if (editData) {
      setIsEditing(true);
      setCurrentId(editData.id);
      setFormData({ category: editData.category, value: editData.value });
    } else {
      setIsEditing(false);
      setCurrentId(null);
      setFormData({ category: categories[0] || "", value: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ category: "", value: "" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (!formData.category || !formData.value) {
        alert("Please provide both Category and Value.");
        return;
      }

      if (isEditing) {
        const { error } = await supabase
          .from("dropdown")
          .update({ value: formData.value })
          .eq("id", currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dropdown")
          .insert([{ category: formData.category, value: formData.value }]);
        if (error) throw error;
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this value?")) return;
    try {
      const { error } = await supabase.from("dropdown").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Error deleting data.");
    }
  };

  const groupedData = categories.reduce((acc, cat) => {
    acc[cat] = data.filter((item) => item.category === cat);
    return acc;
  }, {});

  const maxRows = Math.max(0, ...categories.map((cat) => groupedData[cat].length));

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dropdowns...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex-none bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Dropdown Master</h1>
              <p className="mt-1 text-sm text-slate-500">Manage values for various dropdown categories</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Value
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 max-w-[100vw]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {categories.map((cat, idx) => (
                  <th key={idx} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 last:border-0 min-w-[200px]">
                    {cat.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {Array.from({ length: maxRows }).map((_, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                  {categories.map((cat, colIndex) => {
                    const item = groupedData[cat][rowIndex];
                    return (
                      <td key={colIndex} className="px-6 py-4 text-sm text-slate-700 border-r border-slate-200 last:border-0 align-top">
                        {item ? (
                          <div className="flex items-center justify-between group">
                            <span>{item.value}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                              <button onClick={() => handleOpenModal(item)} className="text-sky-500 hover:text-sky-700 p-1 rounded-full hover:bg-sky-50">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {maxRows === 0 && (
                <tr>
                  <td colSpan={categories.length || 1} className="px-6 py-8 text-center text-sm text-slate-500">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{isEditing ? "Edit Value" : "Add New Value"}</h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  required
                  disabled={isEditing}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border disabled:bg-slate-100"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                <input
                  type="text"
                  required
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                  placeholder="Enter dropdown value"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 border border-transparent rounded-md shadow-sm hover:bg-sky-700">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdowns;
