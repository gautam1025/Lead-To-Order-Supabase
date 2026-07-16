import React from 'react';
import { SearchIcon, PlusIcon } from "../Icons";
import SearchableDropdown from "../SearchableDropdown";
import FilterTabs from "../FilterTabs";

const CallTrackerFilter = ({
  activeTab, setActiveTab,
  searchTerm, setSearchTerm,
  callingDaysFilter, setCallingDaysFilter,
  enquiryNoFilter, setEnquiryNoFilter,
  currentStageFilter, setCurrentStageFilter,
  filterCounts,
  showColumnDropdown, setShowColumnDropdown,
  visibleColumns, handleSelectAll, handleColumnToggle, columnOptions,
  visiblePendingColumns = {}, handleSelectAllPending = () => {}, handleColumnTogglePending = () => {}, pendingColumnOptions = [],
  setShowNewCallTrackerForm,
  pendingCallTrackers = [],
  historyCallTrackers = []
}) => {
  const activeData = activeTab === "pending"
    ? pendingCallTrackers
    : historyCallTrackers;

  return (
    <div className="flex flex-nowrap items-center gap-2 mb-2 shrink-0 pb-1 w-full">
      <FilterTabs
        tabs={[
          { id: 'pending', label: 'Pending' },
          { id: 'history', label: 'History' }
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <div className="flex gap-1.5 flex-nowrap items-center flex-1 min-w-0">
        <div className="relative flex-1 min-w-[120px]">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="search"
            placeholder="Search Enquiry trackers..."
            className="pl-8 w-full px-3 h-9 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Calling Days Filter */}
        <div className="flex-1 min-w-[120px] z-[60]">
          <SearchableDropdown
            isMulti={true}
            options={activeTab === "history"
              ? [
                { value: "today", label: "Today's Calls", count: filterCounts?.today || 0 },
                { value: "older", label: "Older Calls", count: filterCounts?.older || 0 }
              ]
              : [
                { value: "today", label: "Today", count: filterCounts?.today || 0 },
                { value: "overdue", label: "Overdue", count: filterCounts?.overdue || 0 },
                { value: "upcoming", label: "Upcoming", count: filterCounts?.upcoming || 0 }
              ]}
            value={callingDaysFilter}
            onChange={setCallingDaysFilter}
            placeholder="Calling Days"
            height="h-9"
            rounded="rounded-md"
            className="dropdown-container"
          />
        </div>

        {/* Lead No Filter */}
        <div className="flex-1 min-w-[120px] z-[50]">
          <SearchableDropdown
            isMulti={true}
            options={Array.from(new Set(activeData.map(c => activeTab === "history" ? c.enquiryNo : c.leadId).filter(Boolean))).map(l => ({ value: l, label: l, count: activeData.filter(d => (activeTab === "history" ? d.enquiryNo : d.leadId) === l).length }))}
            value={enquiryNoFilter}
            onChange={setEnquiryNoFilter}
            placeholder="Lead No."
            height="h-9"
            rounded="rounded-md"
            className="dropdown-container"
          />
        </div>

        {/* Current Stage Filter */}
        <div className="flex-1 min-w-[120px] z-[40]">
          <SearchableDropdown
            isMulti={true}
            options={Array.from(new Set(activeData.map(c => c.currentStage).filter(Boolean))).map(l => ({ value: l, label: l, count: activeData.filter(d => d.currentStage === l).length }))}
            value={currentStageFilter}
            onChange={setCurrentStageFilter}
            placeholder="Current Stage"
            height="h-9"
            rounded="rounded-md"
            className="dropdown-container"
          />
        </div>

        {/* Column Selection Dropdown for Pending tab */}
        {activeTab === "pending" && (
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-3 h-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white flex items-center text-sm"
            >
              <span>Select Columns</span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${showColumnDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showColumnDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {/* Select All Option */}
                  <div className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      id="select-all-pending"
                      checked={Object.values(visiblePendingColumns || {}).every(Boolean)}
                      onChange={handleSelectAllPending}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label htmlFor="select-all-pending" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer">
                      All Columns
                    </label>
                  </div>

                  <hr className="my-2" />

                  {/* Individual Column Options */}
                  {pendingColumnOptions.map((option) => (
                    <div key={option.key} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`column-pending-${option.key}`}
                        checked={visiblePendingColumns[option.key]}
                        onChange={() => handleColumnTogglePending(option.key)}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`column-pending-${option.key}`}
                        className="ml-2 text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Column Selection Dropdown - Only show for history tab */}
        {activeTab === "history" && (
          <div className="relative dropdown-container">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-3 h-9 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white flex items-center text-sm"
            >
              <span>Select Columns</span>
              <svg
                className={`w-4 h-4 ml-2 transition-transform ${showColumnDropdown ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showColumnDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2">
                  {/* Select All Option */}
                  <div className="flex items-center p-2 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      id="select-all-history"
                      checked={Object.values(visibleColumns).every(Boolean)}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                    />
                    <label htmlFor="select-all-history" className="ml-2 text-sm font-medium text-gray-900 cursor-pointer">
                      All Columns
                    </label>
                  </div>

                  <hr className="my-2" />

                  {/* Individual Column Options */}
                  {columnOptions.map((option) => (
                    <div key={option.key} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        id={`column-${option.key}`}
                        checked={visibleColumns[option.key]}
                        onChange={() => handleColumnToggle(option.key)}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`column-${option.key}`}
                        className="ml-2 text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clear Filters Button */}
        {(callingDaysFilter.length > 0 || enquiryNoFilter.length > 0 || currentStageFilter.length > 0) && (
          <button
            className="px-3 h-9 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 shrink-0"
            onClick={() => {
              setCallingDaysFilter([])
              setEnquiryNoFilter([])
              setCurrentStageFilter([])
            }}
          >
            Clear Filters
          </button>
        )}

        {activeTab !== "history" && (
          <button
            className="px-3 h-9 flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shrink-0 text-sm font-medium"
            onClick={() => setShowNewCallTrackerForm(true)}
          >
            <span>Direct Enquiry</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CallTrackerFilter;
