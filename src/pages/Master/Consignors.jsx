import React, { useState, useEffect } from "react";
import supabase from "../../utils/supabase";
import { PlusIcon, PencilIcon, TrashIcon } from "../../components/Icons";

const Consignors = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("consignor"); // 'consignor' or 'references'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: consignorData, error } = await supabase
        .from("consignor_details")
        .select("*");

      if (error) throw error;
      setData(consignorData || []);
    } catch (error) {
      console.error("Error fetching consignors:", error);
      alert("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (editData = null) => {
    if (editData) {
      setIsEditing(true);
      setCurrentId(editData.uuid);
      if (activeTab === "consignor") {
        setFormData({
          state: editData.state || "",
          state_code: editData.state_code || "",
          address: editData.address || "",
          gstin: editData.gstin || "",
          msme_num: editData.msme_num || "",
          pan_num: editData.pan_num || "",
        });
      } else {
        setFormData({
          reference_name: editData.reference_name || "",
          contact_num: editData.contact_num || "",
        });
      }
    } else {
      setIsEditing(false);
      setCurrentId(null);
      if (activeTab === "consignor") {
        setFormData({
          state: "",
          state_code: "",
          address: "",
          gstin: "",
          msme_num: "",
          pan_num: "",
        });
      } else {
        setFormData({
          reference_name: "",
          contact_num: "",
        });
      }
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const { error } = await supabase
          .from("consignor_details")
          .update(formData)
          .eq("uuid", currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("consignor_details")
          .insert([formData]);
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
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      const { error } = await supabase.from("consignor_details").delete().eq("uuid", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting data:", error);
      alert("Error deleting data.");
    }
  };

  const filteredData = activeTab === "consignor"
    ? data.filter((item) => item.state || item.address || item.gstin) // Mostly consignor fields
    : data.filter((item) => item.reference_name || item.contact_num); // Mostly reference fields

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading Consignor Details...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="flex-none bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Consignors Master</h1>
              <p className="mt-1 text-sm text-slate-500">Manage consignors and reference details</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {activeTab === "consignor" ? "Add Consignor" : "Add Reference"}
            </button>
          </div>
          <div className="mt-4 flex space-x-4 border-b border-slate-200">
            <button
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "consignor" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => setActiveTab("consignor")}
            >
              Consignors
            </button>
            <button
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "references" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
              onClick={() => setActiveTab("references")}
            >
              References
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto max-w-full">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {activeTab === "consignor" ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">State</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">State Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">GSTIN</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">MSME No</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">PAN No</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Reference Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Number</th>
                  </>
                )}
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredData.map((item) => (
                <tr key={item.uuid} className="hover:bg-slate-50 transition-colors">
                  {activeTab === "consignor" ? (
                    <>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.state || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.state_code || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate" title={item.address}>{item.address || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.gstin || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.msme_num || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.pan_num || "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium text-slate-900">{item.reference_name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{item.contact_num || "—"}</td>
                    </>
                  )}
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleOpenModal(item)} className="text-sky-500 hover:text-sky-700 p-1.5 rounded-md hover:bg-sky-50 transition-colors">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(item.uuid)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={activeTab === "consignor" ? 7 : 3} className="px-6 py-8 text-center text-sm text-slate-500">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? "Edit" : "Add"} {activeTab === "consignor" ? "Consignor" : "Reference"}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {activeTab === "consignor" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={formData.state || ""}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">State Code</label>
                    <input
                      type="text"
                      value={formData.state_code || ""}
                      onChange={(e) => setFormData({ ...formData, state_code: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      rows={2}
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">GSTIN</label>
                    <input
                      type="text"
                      value={formData.gstin || ""}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">MSME No</label>
                    <input
                      type="text"
                      value={formData.msme_num || ""}
                      onChange={(e) => setFormData({ ...formData, msme_num: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">PAN No</label>
                    <input
                      type="text"
                      value={formData.pan_num || ""}
                      onChange={(e) => setFormData({ ...formData, pan_num: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Reference Name</label>
                    <input
                      type="text"
                      required
                      value={formData.reference_name || ""}
                      onChange={(e) => setFormData({ ...formData, reference_name: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                    <input
                      type="number"
                      value={formData.contact_num || ""}
                      onChange={(e) => setFormData({ ...formData, contact_num: e.target.value })}
                      className="w-full rounded-md border-slate-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>
              )}
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

export default Consignors;
