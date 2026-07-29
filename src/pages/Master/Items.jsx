import { useState, useEffect, useRef, useContext } from "react";
import { Search, Plus, Pencil, Trash2, RefreshCw, Eye } from "lucide-react";
import DataTable from "../../components/DataTable";
import ModalForm from "../../components/ModalForm";
import supabase from "../../utils/supabase";
import { AuthContext } from "../../App";

function Items() {
  const { showNotification } = useContext(AuthContext) || {};

  const [searchQuery, setSearchQuery] = useState("");
  const [itemsData, setItemsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "edit"
  const [currentItem, setCurrentItem] = useState(null);

  // Column Visibility State
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const columnToggleRef = useRef(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Form State
  const [formData, setFormData] = useState({
    item_name: "",
    item_code: "",
    rate: "",
    description: ""
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnToggleRef.current && !columnToggleRef.current.contains(event.target)) {
        setShowColumnToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchItems();
  }, []);

  // Reset to page 1 on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("item_name", { ascending: true });

      if (error) throw error;
      setItemsData(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      if (showNotification) {
        showNotification("Failed to fetch items: " + error.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode, item = null) => {
    setModalMode(mode);
    setCurrentItem(item);
    if (item && mode === "edit") {
      setFormData({
        item_name: item.item_name || "",
        item_code: item.item_code || "",
        rate: item.rate !== null && item.rate !== undefined ? String(item.rate) : "",
        description: item.description || ""
      });
    } else {
      setFormData({
        item_name: "",
        item_code: "",
        rate: "",
        description: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setFormData({
      item_name: "",
      item_code: "",
      rate: "",
      description: ""
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name.trim()) {
      if (showNotification) showNotification("Item Name is required", "error");
      return;
    }

    setIsLoading(true);
    const payload = {
      item_name: formData.item_name.trim(),
      item_code: formData.item_code.trim() || null,
      rate: formData.rate !== "" && formData.rate !== null ? parseFloat(formData.rate) : null,
      description: formData.description.trim() || null
    };

    try {
      if (modalMode === "add") {
        const { error } = await supabase.from("items").insert([payload]);
        if (error) throw error;
        if (showNotification) showNotification("Item added successfully", "success");
      } else {
        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("uuid", currentItem.uuid);
        if (error) throw error;
        if (showNotification) showNotification("Item updated successfully", "success");
      }

      await fetchItems();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving item:", err);
      if (showNotification) {
        showNotification("Failed to save item: " + (err.message || err), "error");
      } else {
        alert("Failed to save item: " + (err.message || err));
      }
      setIsLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.item_name}?`)) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("uuid", item.uuid);
        if (error) throw error;
        if (showNotification) showNotification("Item deleted successfully", "success");
        await fetchItems();
      } catch (err) {
        console.error("Error deleting item:", err);
        if (showNotification) {
          showNotification("Failed to delete item: " + (err.message || err), "error");
        } else {
          alert("Failed to delete item: " + (err.message || err));
        }
        setIsLoading(false);
      }
    }
  };

  // Header column configuration
  const allHeaders = [
    { key: "actions", label: "Actions" },
    { key: "item_name", label: "Item Name" },
    { key: "item_code", label: "Item Code" },
    { key: "rate", label: "Rate (₹)" },
    { key: "description", label: "Description" }
  ];

  const visibleHeaders = allHeaders.filter(col => !hiddenColumns.includes(col.key));
  const headers = visibleHeaders.map(col => col.label);

  // Filter items
  const filteredData = itemsData.filter(item => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.item_name || "").toLowerCase().includes(q) ||
      (item.item_code || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.rate !== null && item.rate !== undefined && String(item.rate).includes(q))
    );
  });

  // Slice paginated data
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderRow = (row, index) => {
    const columnCells = {
      actions: (
        <td key="actions" className="px-6 py-4 whitespace-nowrap text-sm text-center">
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleOpenModal("edit", row)}
              className="text-blue-500 hover:text-blue-700 transition-colors"
              title="Edit Item"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => handleDelete(row)}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete Item"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      ),
      item_name: (
        <td key="item_name" className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-center">
          {row.item_name}
        </td>
      ),
      item_code: (
        <td key="item_code" className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-sky-700 text-center">
          {row.item_code ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded border border-sky-200 bg-sky-50 text-sky-800 text-xs font-mono font-semibold">
              {row.item_code}
            </span>
          ) : (
            <span className="text-gray-400 font-normal italic">-</span>
          )}
        </td>
      ),
      rate: (
        <td key="rate" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
          {row.rate !== null && row.rate !== undefined ? (
            <span>₹{Number(row.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          ) : (
            <span className="text-gray-400 font-normal italic">-</span>
          )}
        </td>
      ),
      description: (
        <td key="description" className="px-6 py-4 text-sm text-gray-600 min-w-[200px] truncate max-w-xs text-center" title={row.description}>
          {row.description || <span className="text-gray-400 font-normal italic">-</span>}
        </td>
      )
    };

    return (
      <tr key={row.uuid || index} className="hover:bg-sky-50/30 transition-colors border-b border-gray-100 last:border-0">
        {visibleHeaders.map(col => columnCells[col.key])}
      </tr>
    );
  };

  const renderCard = (item, index) => {
    return (
      <div key={item.uuid || index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">{item.item_name}</span>
            {item.item_code && (
              <span className="text-xs font-semibold font-mono text-sky-700 mt-0.5">
                Code: {item.item_code}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-gray-900">
            {item.rate !== null && item.rate !== undefined ? `₹${Number(item.rate).toLocaleString('en-IN')}` : "-"}
          </span>
        </div>
        {item.description && (
          <div className="text-sm text-gray-600 mb-3 line-clamp-2">
            {item.description}
          </div>
        )}
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
            Items Master
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 min-w-[180px] max-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search items by name, code, rate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 block pl-10 h-9"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {searchQuery && (
              <button
                className="px-3 h-9 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors shrink-0"
                onClick={() => setSearchQuery("")}
              >
                Clear Filter
              </button>
            )}

            <button
              onClick={fetchItems}
              className="px-3 h-9 bg-white border border-gray-300 rounded-md shadow-sm text-gray-600 hover:bg-gray-50 hover:text-sky-600 transition-colors"
              title="Refresh Items"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* Column Visibility Toggle Button & Popover */}
            <div className="relative" ref={columnToggleRef}>
              <button
                type="button"
                onClick={() => setShowColumnToggle(prev => !prev)}
                className="px-3 h-9 bg-white border border-gray-300 rounded-md shadow-sm text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors flex items-center gap-2"
                title="Toggle Column Visibility"
              >
                <Eye size={16} />
                <span>Columns</span>
              </button>

              {showColumnToggle && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
                  <div className="text-xs font-bold text-gray-500 uppercase px-2 py-1 border-b border-gray-100 flex justify-between items-center mb-1">
                    <span>Visible Columns</span>
                    <button 
                      onClick={() => setHiddenColumns([])}
                      className="text-[11px] text-sky-600 hover:underline capitalize font-normal"
                    >
                      Show All
                    </button>
                  </div>
                  {allHeaders.map(col => (
                    <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded text-xs font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!hiddenColumns.includes(col.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHiddenColumns(hiddenColumns.filter(k => k !== col.key));
                          } else {
                            setHiddenColumns([...hiddenColumns, col.key]);
                          }
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenModal("add")}
              className="px-3 h-9 bg-sky-600 hover:bg-sky-700 text-white rounded-md shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="font-medium text-sm">Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <DataTable
          headers={headers}
          data={paginatedData}
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

      {/* Add / Edit Modal */}
      <ModalForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={modalMode === "add" ? "Add Item" : "Edit Item"}
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Item Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Solar Panel 400W"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Item Code</label>
            <input
              type="text"
              placeholder="e.g. ITM-001"
              value={formData.item_code}
              onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Rate (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 1500.00"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-2 col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              placeholder="Enter additional details or specifications..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>
      </ModalForm>
    </div>
  );
}

export default Items;
