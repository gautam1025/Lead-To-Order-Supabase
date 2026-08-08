"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { SearchIcon, ArrowRightIcon, EyeIcon } from "../../components/Icons";
import { AuthContext } from "../../App";
import supabase from "../../utils/supabase";
import SearchableDropdown from "../../components/SearchableDropdown";
import DataTable from "../../components/DataTable";
import CallTrackerFilter from "../../components/call-tracker/CallTrackerFilter";
import NewCallTracker from "./CallTrackerForm";
import { formatDateToDDMMYYYY } from "../../utils/formatDate";

const slideIn = "animate-in slide-in-from-right duration-300";
const slideOut = "animate-out slide-out-to-right duration-300";
const fadeIn = "animate-in fade-in duration-300";
const fadeOut = "animate-out fade-out duration-300";

// Custom hook to detect mobile devices
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

function CallTracker() {
  const authContext = useContext(AuthContext) || {};
  const {
    currentUser = null,
    userType = null,
    isAdmin = () => false,
    getUsernamesToFilter = () => []
  } = authContext;
  const [searchTerm, setSearchTerm] = useState("");
  // Declared here (rather than near the pagination UI further down) because
  // fetchFollowUpData's useCallback below depends on itemsPerPage.
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(200);
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem("callTrackerActiveTab") || "pending";
  });
  const setActiveTab = (tabOrFn) => {
    setActiveTabState((prev) => {
      const nextTab = typeof tabOrFn === "function" ? tabOrFn(prev) : tabOrFn;
      if (typeof nextTab === "string") {
        localStorage.setItem("callTrackerActiveTab", nextTab);
      }
      return nextTab;
    });
  };
  const [pendingFollowUps, setPendingFollowUps] = useState([]);
  const [historyFollowUps, setHistoryFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [companyFilter, setCompanyFilter] = useState([]);
  const [personFilter, setPersonFilter] = useState([]);
  const [phoneFilter, setPhoneFilter] = useState([]);
  const [scNameFilter, setScNameFilter] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [uniqueScNames, setUniqueScNames] = useState({
    pending: [],
    history: [],
  });
  const [filterTypeCounts, setFilterTypeCounts] = useState({ all: 0, first: 0, multi: 0 });
  const [allCompanyNames, setAllCompanyNames] = useState([]); // State for all company names for filter

  // Fixed pagination state management
  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [editingRowId, setEditingRowId] = useState(null);
  const [editedData, setEditedData] = useState({});

  const [historyCounts, setHistoryCounts] = useState({ today: 0, older: 0 });
  const [filteredCount, setFilteredCount] = useState(0);

  const [visibleColumns, setVisibleColumns] = useState({
    actions: false, // Hidden by default for history as per request
    edit: true,
    timestamp: true,
    callingCount: true,
    enquiryCallingCount: true, // New column
    noOfFollowUps: true, // Output column for total records in leads_tracker
    lastFollowUpStatus: true,
    leadNo: true,
    companyName: true,
    personName: true,
    phoneNumber: true,
    enquiryStatus: true,
    receivedDate: true,
    state: true,
    projectName: true,
    salesType: true,
    productDate: true,
    projectValue: true,
    item1: true,
    qty1: true,
    item2: true,
    qty2: true,
    item3: true,
    qty3: true,
    item4: true,
    qty4: true,
    item5: true,
    qty5: true,
    nextAction: true,
    callDate: true,
    callTime: true,
    itemQty: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Modal states for Call Now and Details
  const [selectedDetailsRow, setSelectedDetailsRow] = useState(null);
  const [selectedCallNowRow, setSelectedCallNowRow] = useState(null);

  // Pending column visibility (checked = visible by default)
  const [pendingVisibleColumns, setPendingVisibleColumns] = useState({
    actions: true,
    edit: true,
    leadId: true,
    companyName: true,
    personName: true,
    phoneNumber: true,
    leadSource: true,
    location: true,
    customerSay: true,
    enquiryStatus: true,
    lastFollowUpDate: true,
    noOfFollowUps: true,
    lastFollowUpStatus: true,
    assignedTo: true,
    nextAction: true,
    nextCallDate: true,
    handlePerson: true,
    email: true,
    state: false,
    address: false,
    personName1: false,
    designation1: false,
    phoneNumber1: false,
    personName2: false,
    designation2: false,
    phoneNumber2: false,
    personName3: false,
    designation3: false,
    phoneNumber3: false,
    natureOfBusiness: false,
    gst: false,
    customerRegForm: false,
    creditAccess: false,
    creditDays: false,
    creditLimit: false,
    additionalNotes: false,
    groupName: false,
    details: true,
  });
  const [showPendingColumnDropdown, setShowPendingColumnDropdown] = useState(false);

  const pendingColumnOptions = [
    { key: "actions", label: "Actions" },
    { key: "edit", label: "Edit" },
    { key: "leadId", label: "Lead No." },
    { key: "companyName", label: "Company Name" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Phone No." },
    { key: "leadSource", label: "Enquiry Source" },
    { key: "location", label: "Location" },
    { key: "customerSay", label: "Customer Say" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "handlePerson", label: "Handle Person" },
    { key: "email", label: "Email Address" },
    { key: "lastFollowUpDate", label: "Last Follow Up Date" },
    { key: "noOfFollowUps", label: "No. of FollowUps" },
    { key: "lastFollowUpStatus", label: "Last FollowUp Status" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "nextAction", label: "Next Action" },
    { key: "nextCallDate", label: "Next Call Date" },
    { key: "state", label: "State" },
    { key: "address", label: "Address" },
    { key: "personName1", label: "Person Name 1" },
    { key: "designation1", label: "Designation 1" },
    { key: "phoneNumber1", label: "Phone Number 1" },
    { key: "personName2", label: "Person Name 2" },
    { key: "designation2", label: "Designation 2" },
    { key: "phoneNumber2", label: "Phone Number 2" },
    { key: "personName3", label: "Person Name 3" },
    { key: "designation3", label: "Designation 3" },
    { key: "phoneNumber3", label: "Phone Number 3" },
    { key: "natureOfBusiness", label: "Nature of Business" },
    { key: "gst", label: "GST Number" },
    { key: "customerRegForm", label: "Customer Registration Form" },
    { key: "creditAccess", label: "Credit Access" },
    { key: "creditDays", label: "Credit Days" },
    { key: "creditLimit", label: "Credit Limit" },
    { key: "additionalNotes", label: "Additional Notes" },
    { key: "groupName", label: "Group Name" },
    { key: "details", label: "Details" },
  ];

  // Helper functions
  const determinePriority = (source) => {
    if (!source) return "Low";
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes("indiamart")) return "High";
    if (sourceLower.includes("website")) return "Medium";
    return "Low";
  };

  const formatNextCallTime = (timeValue) => {
    if (!timeValue) return "";

    try {
      if (typeof timeValue === "string" && timeValue.startsWith("Date(")) {
        const timeString = timeValue.substring(5, timeValue.length - 1);
        const [year, month, day, hours, minutes, seconds] = timeString
          .split(",")
          .map((part) => Number.parseInt(part.trim()));

        const formattedHours = hours % 12 || 12;
        const period = hours >= 12 ? "PM" : "AM";
        const formattedMinutes = minutes.toString().padStart(2, "0");

        return `${formattedHours}:${formattedMinutes} ${period}`;
      }

      if (
        typeof timeValue === "string" &&
        /^\d{2}:\d{2}:\d{2}$/.test(timeValue)
      ) {
        const [hours, minutes] = timeValue.split(":").map(Number);
        const formattedHours = hours % 12 || 12;
        const period = hours >= 12 ? "PM" : "AM";
        const formattedMinutes = minutes.toString().padStart(2, "0");

        return `${formattedHours}:${formattedMinutes} ${period}`;
      }

      return timeValue;
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeValue;
    }
  };

  // Uses imported formatDateToDDMMYYYY from src/utils/formatDate

  // ✅ Filter History tab using Timestamp (not calling_days)
  const checkDateFilterHistory = (followUp, filterType) => {
    if (filterType === "all") return true;
    if (!followUp.timestamp) return false;

    try {
      const [day, month, year] = followUp.timestamp.split("/");
      const followUpDate = new Date(year, month - 1, day);
      followUpDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (filterType === "today")
        return followUpDate.getTime() === today.getTime();
      if (filterType === "older") return followUpDate < today;
      return true;
    } catch (err) {
      console.error("Error in checkDateFilterHistory:", err);
      return false;
    }
  };

  const formatItemQty = (itemQtyString) => {
    if (!itemQtyString) return "";

    try {
      const items = JSON.parse(itemQtyString);
      return items
        .filter((item) => item.name && item.quantity && item.quantity !== "0")
        .map((item) => `${item.name} : ${item.quantity}`)
        .join(", ");
    } catch (error) {
      console.error("Error parsing item quantity:", error);
      return itemQtyString;
    }
  };

  const handleEditClick = (followUp, index) => {
    setEditingRowId(index);
    setEditedData({ ...followUp, id: followUp.id });
  };


  const convertDateToYYYYMMDD = (dateStr) => {
    if (!dateStr) return null;

    try {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }

      // Convert DD/MM/YYYY to YYYY-MM-DD
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      return dateStr;
    } catch (error) {
      console.error("Error converting date:", error);
      return dateStr;
    }
  };

  const convertTimeTo24Hour = (timeStr) => {
    if (!timeStr) return null;

    try {
      // If already in HH:MM:SS format, return as is
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }

      // Convert "2:30 PM" to "14:30:00"
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2];
        const period = match[3].toUpperCase();

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, "0")}:${minutes}:00`;
      }

      return timeStr;
    } catch (error) {
      console.error("Error converting time:", error);
      return timeStr;
    }
  };

  const handleSaveClick = async (index) => {
    try {
      if (activeTab === "pending") {
        const pendingUpdateData = {
          planned_at: editedData.timestamp ? new Date(convertDateToYYYYMMDD(editedData.timestamp)).toISOString() : undefined,
          company_name: editedData.companyName,
          person_name: editedData.personName,
          phone_number: editedData.phoneNumber,
          lead_source: editedData.leadSource,
          lead_receiver_name: editedData.receiverName,
          sales_type: editedData.enquiryType,
          location: editedData.location,
          additional_notes: editedData.customerSay || editedData.Additional_Notes,
          sc_name: editedData.handlePerson || editedData.assignedTo,
          email_address: editedData.Email_Address,
          state: editedData.State,
          address: editedData.Address,
          nob: editedData.NOB,
          gst_number: editedData.GST_Number,
          customer_registration_form: editedData.Customer_Registration_Form,
          credit_access: editedData.Credit_Access,
          credit_days: editedData.Credit_Days ? Number(editedData.Credit_Days) : undefined,
          credit_limit: editedData.Credit_Limit ? Number(editedData.Credit_Limit) : undefined,
        };

        // Remove undefined/null values
        Object.keys(pendingUpdateData).forEach((key) => {
          if (pendingUpdateData[key] === undefined || pendingUpdateData[key] === null) {
            delete pendingUpdateData[key];
          }
        });

        const { error } = await supabase
          .from("leads")
          .update(pendingUpdateData)
          .eq("id", editedData.id);

        if (error) throw error;

        alert("Updated successfully!");
        fetchFollowUpData(pendingPage, false, searchTerm);
        setEditingRowId(null);
        setEditedData({});
        return;
      }

      // Logic for History tab (update call_tracker_for_leads)
      const updateData = {
        company_name: editedData.companyName,
        what_did_customer_say: editedData.customerSay,
        enquiry_received_status: editedData.enquiryStatus || editedData.status,
        enquiry_received_date: convertDateToYYYYMMDD(editedData.enquiryReceivedDate),
        enquiry_for_state: editedData.enquiryState,
        project_name: editedData.projectName,
        enquiry_type: editedData.salesType,
        project_approximate_value: editedData.projectApproxValue ? Number(editedData.projectApproxValue) : null,
        next_action: editedData.nextAction,
        next_call_date: convertDateToYYYYMMDD(editedData.nextCallDate),
        next_call_time: convertTimeTo24Hour(editedData.nextCallTime),
        sc_name: editedData.handlePerson || editedData.assignedTo,
      };

      // Remove undefined/null values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      const { error: trackerError } = await supabase
        .from("call_tracker_for_leads")
        .update(updateData)
        .eq("id", editedData.id);

      if (trackerError) {
        throw new Error(`call_tracker_for_leads update failed: ${trackerError.message}`);
      }

      alert("Updated successfully!");
      fetchFollowUpData(historyPage, false, searchTerm);
      setEditingRowId(null);
      setEditedData({});
    } catch (error) {
      console.error("Error updating:", error);
      alert(`Error updating: ${error.message}`);
    }
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditedData({});
  };

  const handleFieldChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const parseNextCallDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const cleanStr = String(dateStr).trim();
      if (cleanStr.includes("-") || cleanStr.includes("/")) {
        const separator = cleanStr.includes("-") ? "-" : "/";
        const parts = cleanStr.split(separator);
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          // DD-MM-YYYY
          return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
      }
      return new Date(cleanStr);
    } catch (e) {
      console.error("Error parsing nextCallDate:", e, "Value:", dateStr);
      return null;
    }
  };

  const checkDateFilter = (followUp, filterType) => {
    if (filterType === "all") return true;

    const followUpDate = parseNextCallDate(followUp.nextCallDate);
    if (!followUpDate || isNaN(followUpDate.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUpDate.setHours(0, 0, 0, 0);

    switch (filterType) {
      case "today":
        return followUpDate.getTime() === today.getTime();
      case "overdue":
        return followUpDate < today;
      case "upcoming":
        return followUpDate > today;
      default:
        return true;
    }
  };

  const calculateDateFilterCounts = () => {
    const counts = {
      today: 0,
      overdue: 0,
      upcoming: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    pendingFollowUps.forEach((followUp) => {
      const followUpDate = parseNextCallDate(followUp.nextCallDate);
      if (!followUpDate || isNaN(followUpDate.getTime())) return;

      followUpDate.setHours(0, 0, 0, 0);

      if (followUpDate.getTime() === today.getTime()) {
        counts.today++;
      } else if (followUpDate < today) {
        counts.overdue++;
      } else if (followUpDate > today) {
        counts.upcoming++;
      }
    });

    return counts;
  };

  // ✅ Count history calls (Today / Older)
  const calculateHistoryCounts = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

      // Query for today's count
      let todayQuery = supabase
        .from("call_tracker_for_leads")
        .select("*", { count: "exact", head: true })
        .eq("Timestamp", todayStr);

      // Query for older count
      let olderQuery = supabase
        .from("call_tracker_for_leads")
        .select("*", { count: "exact", head: true })
        .lt("Timestamp", todayStr);

      // Apply user filter if not admin
      if (!isAdmin() && currentUser && currentUser.username) {
        const usernamesToFilter = getUsernamesToFilter();
        todayQuery = todayQuery.in("SC_Name", usernamesToFilter);
        olderQuery = olderQuery.in("SC_Name", usernamesToFilter);
      }

      const [todayResult, olderResult] = await Promise.all([
        todayQuery,
        olderQuery,
      ]);

      return {
        today: todayResult.count || 0,
        older: olderResult.count || 0,
      };
    } catch (error) {
      console.error("Error calculating history counts:", error);
      return { today: 0, older: 0 };
    }
  }, [currentUser, isAdmin]);

  // Function to fetch all unique SC names for the filter dropdown
  const fetchUniqueScNames = useCallback(async () => {
    if (!isAdmin()) return; // Only admins need to see all SC names

    try {
      // Fetch unique SC names from leads for pending tab
      const { data: pendingScNames, error: pendingError } = await supabase
        .from("leads")
        .select("sc_name, person_name");

      if (pendingError) {
        console.error("Error fetching pending SC names:", pendingError);
      }

      // Fetch unique SC names from call_tracker_for_leads for history tab
      const { data: historyScNames, error: historyError } = await supabase
        .from("call_tracker_for_leads")
        .select("sc_name")
        .not("sc_name", "is", null)
        .not("sc_name", "eq", "");

      if (historyError) {
        console.error("Error fetching history SC names:", historyError);
      }

      // Extract and deduplicate SC names for each tab
      const uniquePendingNames = Array.from(
        new Set((pendingScNames || []).map(item => item.sc_name || item.person_name).filter(Boolean))
      ).sort();

      const uniqueHistoryNames = Array.from(
        new Set((historyScNames || []).map(item => item.sc_name || item.SC_Name).filter(Boolean))
      ).sort();

      setUniqueScNames({
        pending: uniquePendingNames,
        history: uniqueHistoryNames
      });
    } catch (error) {
      console.error("Error fetching unique SC names:", error);
    }
  }, [isAdmin]);

  // Implement DB counts for filter dropdown
  // Add 'Enquiry Calling Count' column to FollowUp.jsx
  const fetchFilterTypeCounts = useCallback(async () => {
    try {
      let allQuery, firstQuery, multiQuery;

      if (activeTab === "pending") {
          // Fetch all tracker leads with status to find latest per lead
          let allTrackerRecords = [];
          let fetchMoreTracker = true;
          let currentFromTracker = 0;
          
          while (fetchMoreTracker) {
              const { data, error } = await supabase
                .from("call_tracker_for_leads")
                .select("lead_id, enquiry_received_status, created_at, sc_name")
                .order("created_at", { ascending: false })
                .range(currentFromTracker, currentFromTracker + 999);
              
              if (error) break;
              if (data && data.length > 0) {
                 allTrackerRecords = [...allTrackerRecords, ...data];
                 currentFromTracker += 1000;
                 if (data.length < 1000) fetchMoreTracker = false;
              } else {
                 fetchMoreTracker = false;
              }
          }

          const latestTrackerPerLead = new Map();
          allTrackerRecords.forEach(row => {
              if (row.lead_id && !latestTrackerPerLead.has(row.lead_id)) {
                  latestTrackerPerLead.set(row.lead_id, row);
              }
          });

          const existingLeadIds = Array.from(latestTrackerPerLead.keys());

          const scCol = "sc_name";
          let group1Query = supabase
            .from("leads")
            .select("id")
            .not("planned_at", "is", null);

          if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
            group1Query = group1Query.in(scCol, scNameFilter);
          } else if (!isAdmin() && currentUser && currentUser.username) {
            const usernamesToFilter = getUsernamesToFilter();
            group1Query = group1Query.in(scCol, usernamesToFilter);
          }

          const { data: g1Leads } = await group1Query;
          const existingIdsSet = new Set(existingLeadIds);
          const g1Count = (g1Leads || []).filter(row => !existingIdsSet.has(row.id)).length;

          // Group 2 calculation in memory
          let group2Data = Array.from(latestTrackerPerLead.values()).filter(record => 
              !record.enquiry_received_status || record.enquiry_received_status.toLowerCase() !== 'yes'
          );

          if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
              group2Data = group2Data.filter(r => r.sc_name && scNameFilter.includes(r.sc_name));
          } else if (!isAdmin() && currentUser && currentUser.username) {
              const usernamesToFilter = getUsernamesToFilter();
              group2Data = group2Data.filter(r => r.sc_name && usernamesToFilter.includes(r.sc_name));
          }

          const totalPending = (g1Count || 0) + group2Data.length;

          setFilterTypeCounts({
            all: totalPending,
            first: totalPending,
            multi: totalPending,
          });
          return; // Early return since pending is calculated
      } else {
        const baseQuery = () => supabase
          .from("call_tracker_for_leads")
          .select("*", { count: "exact", head: true });

        allQuery = baseQuery();
        firstQuery = baseQuery().or('enquiry_received_status.is.null,enquiry_received_status.eq."",enquiry_received_status.eq."New"');
        multiQuery = baseQuery().ilike("enquiry_received_status", "%expected%");

        // Apply Company Filter to history counts for consistency
        if (companyFilter && companyFilter.length > 0) {
          allQuery = allQuery.in("company_name", companyFilter);
          firstQuery = firstQuery.in("company_name", companyFilter);
          multiQuery = multiQuery.in("company_name", companyFilter);
        }
      }

      // Apply SC Name Filter
      const scCol = "sc_name";
      if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
        allQuery = allQuery.in(scCol, scNameFilter);
        firstQuery = firstQuery.in(scCol, scNameFilter);
        multiQuery = multiQuery.in(scCol, scNameFilter);
      } else if (!isAdmin() && currentUser && currentUser.username) {
        const usernamesToFilter = getUsernamesToFilter();
        allQuery = allQuery.in(scCol, usernamesToFilter);
        firstQuery = firstQuery.in(scCol, usernamesToFilter);
        multiQuery = multiQuery.in(scCol, usernamesToFilter);
      }

      const [allRes, firstRes, multiRes] = await Promise.all([
        allQuery,
        firstQuery,
        multiQuery,
      ]);

      setFilterTypeCounts({
        all: allRes.count || 0,
        first: firstRes.count || 0,
        multi: multiRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching filter type counts:", error);
    }
  }, [activeTab, isAdmin, scNameFilter, currentUser, companyFilter]);

  // Fixed scroll detection function
  const isBottom = () => {
    return (
      window.innerHeight + window.scrollY >=
      document.documentElement.offsetHeight - 100
    );
  };

  // Fixed function to fetch data with pagination
  // Replace the existing fetchFollowUpData function with this updated version:

  const fetchFollowUpData = useCallback(
    async (page = 1, searchTerm = "") => {
      try {
        setIsLoading(true);

        // itemsPerPage here is the UI's page-size toggle state (declared
        // further down in the component, added to this callback's deps
        // below) so switching the toggle actually fetches that many rows.
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        if (activeTab === "pending") {
          // Fetch chunked data for call_tracker_for_leads to find latest per lead.
          // Chunks of 500 -- a single unpaginated select() is silently capped
          // at 1000 rows by PostgREST, which would otherwise lose data once
          // this table grows past that.
          let allTrackerRecords = [];
          let currentFromTracker = 0;
          let fetchMoreTracker = true;

          while (fetchMoreTracker) {
              const { data, error } = await supabase
                .from("call_tracker_for_leads")
                .select("*")
                .order("created_at", { ascending: false })
                .range(currentFromTracker, currentFromTracker + 499);

              if (error) {
                 console.error("Error fetching tracker records:", error);
                 break;
              }
              if (data && data.length > 0) {
                 allTrackerRecords = [...allTrackerRecords, ...data];
                 currentFromTracker += 500;
                 if (data.length < 500) fetchMoreTracker = false;
              } else {
                 fetchMoreTracker = false;
              }
          }

          const latestTrackerPerLead = new Map();
          allTrackerRecords.forEach(row => {
              if (row.lead_id && !latestTrackerPerLead.has(row.lead_id)) {
                  latestTrackerPerLead.set(row.lead_id, row);
              }
          });

          const existingLeadIds = Array.from(latestTrackerPerLead.keys());

          // Group 1: leads where planned_at IS NOT NULL, chunked in 500s for
          // the same reason as above.
          let g1DataRaw = [];
          let currentFromG1 = 0;
          let fetchMoreG1 = true;

          while (fetchMoreG1) {
            let group1Query = supabase
              .from("leads")
              .select("*")
              .not("planned_at", "is", null)
              .range(currentFromG1, currentFromG1 + 499);

            if (searchTerm) {
              group1Query = group1Query.or(
                `company_name.ilike.%${searchTerm}%,lead_no.ilike.%${searchTerm}%,person_name.ilike.%${searchTerm}%,sc_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,lead_source.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,additional_notes.ilike.%${searchTerm}%`
              );
            }

            if (!isAdmin() && currentUser && currentUser.username) {
              const usernamesToFilter = getUsernamesToFilter();
              group1Query = group1Query.in("sc_name", usernamesToFilter);
            }

            if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
              group1Query = group1Query.in("sc_name", scNameFilter);
            }

            const { data, error: g1Err } = await group1Query;
            if (g1Err) {
              console.error("Error fetching group 1 leads:", g1Err);
              break;
            }
            if (data && data.length > 0) {
              g1DataRaw = [...g1DataRaw, ...data];
              currentFromG1 += 500;
              if (data.length < 500) fetchMoreG1 = false;
            } else {
              fetchMoreG1 = false;
            }
          }

          // Filter out existingLeadIds in JS to avoid URL length limits
          const existingIdsSet = new Set(existingLeadIds);
          const g1Data = (g1DataRaw || []).filter(row => !existingIdsSet.has(row.id));

          // Group 2 Data: latest tracker records where enquiry_received_status != 'yes'
          let g2Data = Array.from(latestTrackerPerLead.values()).filter(record => 
              !record.enquiry_received_status || record.enquiry_received_status.toLowerCase() !== 'yes'
          );

          // Apply filters to Group 2 in memory
          if (searchTerm) {
              const lowerTerm = searchTerm.toLowerCase();
              g2Data = g2Data.filter(r => 
                  (r.what_did_customer_say && r.what_did_customer_say.toLowerCase().includes(lowerTerm)) ||
                  (r.sc_name && r.sc_name.toLowerCase().includes(lowerTerm)) ||
                  (r.enquiry_received_status && r.enquiry_received_status.toLowerCase().includes(lowerTerm))
              );
          }

          if (!isAdmin() && currentUser && currentUser.username) {
              const usernamesToFilter = getUsernamesToFilter();
              g2Data = g2Data.filter(r => r.sc_name && usernamesToFilter.includes(r.sc_name));
          } else if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
              g2Data = g2Data.filter(r => r.sc_name && scNameFilter.includes(r.sc_name));
          }

          // For Group 2, fetch parent lead info
          const g2LeadIds = Array.from(new Set(g2Data.map(r => r.lead_id).filter(Boolean)));
          const leadsMap = {};
          if (g2LeadIds.length > 0) {
            const { data: g2Leads } = await supabase.from("leads").select("*").in("id", g2LeadIds);
            (g2Leads || []).forEach(lead => {
              leadsMap[lead.id] = lead;
            });
          }

          // Map Group 1 (New leads never called before)
          const mappedG1 = (g1Data || []).map(row => ({
            timestamp: row.planned_at ? formatDateToDDMMYYYY(row.planned_at) : "",
            id: row.id || "",
            leadId: row.lead_no || "",
            companyName: row.company_name || "",
            personName: row.person_name || row.salesperson_name || "",
            phoneNumber: row.phone_number || "",
            leadSource: row.lead_source || "",
            receiverName: row.lead_receiver_name || "",
            enquiryType: row.sales_type || "",
            location: row.location || "",
            customerSay: row.additional_notes || "",
            enquiryStatus: row.lead_status || "",
            createdAt: row.created_at || "",
            nextCallDate: (row.next_call_date || row.planned_at) ? formatDateToDDMMYYYY(row.next_call_date || row.planned_at) : "",
            nextAction: "",
            priority: determinePriority(row.lead_source || ""),
            assignedTo: row.sc_name || row.handle_person || row.salesperson_name || "",
            handlePerson: row.sc_name || row.handle_person || "",
            Email_Address: row.email_address || "",
            State: row.state || "",
            Address: row.address || "",
            NOB: row.nob || "",
            GST_Number: row.gst_number || "",
            Customer_Registration_Form: row.customer_registration_form || "",
            Credit_Access: row.credit_access || "",
            Credit_Days: row.credit_days || "",
            Credit_Limit: row.credit_limit || "",
            Additional_Notes: row.additional_notes || "",
            noOfFollowUps: 0,
            lastFollowUpStatus: "",
            lastFollowUpDate: "",
          }));

          // Calculate accurate noOfFollowUps for Pending tab from allTrackerRecords
          const noOfFollowUpsMap = {};
          allTrackerRecords.forEach(row => {
             noOfFollowUpsMap[row.lead_id] = (noOfFollowUpsMap[row.lead_id] || 0) + 1;
          });

          // Map Group 2 (Existing call_tracker entries where enquiry_received_status != 'yes')
          const mappedG2 = g2Data.map(row => {
            const parentLead = leadsMap[row.lead_id] || {};
            const compName = (parentLead.company_name || row.company_name || "").trim();
            const leadNo = parentLead.lead_no || row.lead_id || "";
            return {
              timestamp: row.next_call_date ? formatDateToDDMMYYYY(row.next_call_date) : (row.created_at ? formatDateToDDMMYYYY(row.created_at) : ""),
              id: parentLead.id || row.lead_id || row.id,
              leadId: leadNo,
              companyName: parentLead.company_name || "",
              personName: parentLead.person_name || parentLead.salesperson_name || "",
              phoneNumber: parentLead.phone_number || "",
              leadSource: parentLead.lead_source || "",
              receiverName: parentLead.lead_receiver_name || "",
              enquiryType: row.enquiry_type || parentLead.sales_type || "",
              location: parentLead.location || "",
              customerSay: row.what_did_customer_say || parentLead.additional_notes || "",
              enquiryStatus: row.enquiry_received_status || parentLead.lead_status || "",
              createdAt: row.created_at || "",
              nextCallDate: row.next_call_date ? formatDateToDDMMYYYY(row.next_call_date) : "",
              nextAction: row.next_action || "",
              priority: determinePriority(parentLead.lead_source || ""),
              assignedTo: row.sc_name || parentLead.sc_name || parentLead.handle_person || parentLead.salesperson_name || "",
              handlePerson: row.sc_name || parentLead.sc_name || parentLead.handle_person || "",
              Email_Address: parentLead.email_address || "",
              State: row.enquiry_for_state || parentLead.state || "",
              Address: parentLead.address || "",
              NOB: row.project_name || parentLead.nob || "",
              GST_Number: parentLead.gst_number || "",
              Customer_Registration_Form: parentLead.customer_registration_form || "",
              Credit_Access: parentLead.credit_access || "",
              Credit_Days: parentLead.credit_days || "",
              Credit_Limit: parentLead.credit_limit || "",
              Additional_Notes: row.other_remarks || parentLead.additional_notes || "",
              noOfFollowUps: noOfFollowUpsMap[row.lead_id] || 1,
              lastFollowUpStatus: row.enquiry_received_status || "",
              lastFollowUpDate: row.created_at ? formatDateToDDMMYYYY(row.created_at) : "",
              callingCount: "-", // Pending tab typically doesn't need to do expensive lookups for these
              enquiryCallingCount: "-",
              companyCount: "-",
            };
          });

          const combinedPending = [...mappedG1, ...mappedG2];
          setPendingFollowUps(combinedPending);
          setHasMorePending(false);

        } else {
          // History tab data fetching from call_tracker_for_leads
          let historyQuery = supabase
            .from("call_tracker_for_leads")
            .select("*", { count: "exact" });

          if (searchTerm) {
            historyQuery = historyQuery.or(
              `what_did_customer_say.ilike.%${searchTerm}%,enquiry_received_status.ilike.%${searchTerm}%,enquiry_for_state.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,enquiry_type.ilike.%${searchTerm}%,next_action.ilike.%${searchTerm}%,sc_name.ilike.%${searchTerm}%`
            );
          }

          // Apply user filter if not admin
          if (!isAdmin() && currentUser && currentUser.username) {
            const usernamesToFilter = getUsernamesToFilter();
            historyQuery = historyQuery.in("sc_name", usernamesToFilter);
          }

          // Apply SC name filter for admin
          if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
            historyQuery = historyQuery.in("sc_name", scNameFilter);
          }

          // Apply Company Name Filter
          if (companyFilter && companyFilter.length > 0) {
            historyQuery = historyQuery.in("company_name", companyFilter);
          }

          // Apply Filter Type (First Followup / Expected)
          if (filterType === "first") {
            historyQuery = historyQuery.or('enquiry_received_status.is.null,enquiry_received_status.eq."",enquiry_received_status.eq."New"');
          } else if (filterType === "multi") {
            historyQuery = historyQuery.ilike("enquiry_received_status", "%expected%");
          }

          // Apply date filter
          if (dateFilter === "today") {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            historyQuery = historyQuery.gte("created_at", todayStr);
          } else if (dateFilter === "older") {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            historyQuery = historyQuery.lt("created_at", todayStr);
          }

          if (startDate) {
            historyQuery = historyQuery.gte("created_at", startDate);
          }
          if (endDate) {
            historyQuery = historyQuery.lte("created_at", endDate);
          }

          historyQuery = historyQuery.order("created_at", { ascending: false });

          // Fetch all matching rows in chunks of 500 to bypass 1000 limit
          let allData = [];
          let currentFrom = 0;
          let fetchMore = true;
          while (fetchMore) {
            const { data, error } = await historyQuery.range(currentFrom, currentFrom + 499);
            if (error) throw error;
            if (data && data.length > 0) {
              allData = [...allData, ...data];
              currentFrom += 500;
              if (data.length < 500) fetchMore = false;
            } else {
              fetchMore = false;
            }
          }
          const data = allData;
          const count = allData.length;

          setFilteredCount(count || 0);

          // Fetch parent lead details by lead_id
          const leadIds = [...new Set((data || []).map((item) => item.lead_id).filter(Boolean))];
          const leadsMap = {};
          const uniqueLeadNosHistory = new Set();
          
          if (leadIds.length > 0) {
            try {
              const { data: leadsData } = await supabase
                .from("leads")
                .select("id, lead_no, company_name, person_name, phone_number, sc_name, lead_source, lead_receiver_name")
                .in("id", leadIds);

              if (leadsData) {
                leadsData.forEach((lead) => {
                  leadsMap[lead.id] = lead;
                  if (lead.lead_no) uniqueLeadNosHistory.add(lead.lead_no);
                });
              }
            } catch (err) {
              console.error("Error fetching leads for history tab:", err);
            }
          }

          // Fetch Company Counts
          const companyCountsMap = {};
          const uniqueCompanyNames = [...new Set((data || []).map(item => item.company_name || (leadsMap[item.lead_id] && leadsMap[item.lead_id].company_name)).filter(Boolean))];
          if (uniqueCompanyNames.length > 0) {
              const { data: countData } = await supabase
                .from("call_tracker_for_leads")
                .select("company_name")
                .in("company_name", uniqueCompanyNames);
              (countData || []).forEach(item => {
                const name = (item.company_name || "").trim();
                companyCountsMap[name] = (companyCountsMap[name] || 0) + 1;
              });
          }

          // Fetch Enquiry Calling Counts
          const enquiryCountsMap = {};
          if (uniqueLeadNosHistory.size > 0) {
              const { data: enqCountData } = await supabase
                .from("enquiries")
                .select("lead_no")
                .in("lead_no", Array.from(uniqueLeadNosHistory));
              (enqCountData || []).forEach(item => {
                const ln = item.lead_no;
                enquiryCountsMap[ln] = (enquiryCountsMap[ln] || 0) + 1;
              });
          }

          // Fetch Follow-Ups Total Counts for History tab
          const historyFollowUpsCountMap = {};
          const historyLastStatusMap = {};
          if (leadIds.length > 0) {
            const { data: trackerCountData } = await supabase
              .from("call_tracker_for_leads")
              .select("lead_id, enquiry_received_status, created_at")
              .in("lead_id", leadIds)
              .order("created_at", { ascending: false });
              
            (trackerCountData || []).forEach(item => {
              const lid = item.lead_id;
              historyFollowUpsCountMap[lid] = (historyFollowUpsCountMap[lid] || 0) + 1;
              if (!historyLastStatusMap[lid]) {
                historyLastStatusMap[lid] = item.enquiry_received_status || "";
              }
            });
          }

          const filteredHistory = (data || []).map((row) => {
            const parentLead = leadsMap[row.lead_id] || {};
            const compName = (parentLead.company_name || row.company_name || "").trim();
            const leadNo = parentLead.lead_no || row.lead_id || "";
            return {
              id: row.id,
              leadId: parentLead.lead_no || row.lead_id || "",
              leadNo: parentLead.lead_no || "",
              companyName: parentLead.company_name || row.company_name || "",
              personName: parentLead.person_name || parentLead.salesperson_name || "",
              phoneNumber: parentLead.phone_number || "",
              handlePerson: row.sc_name || parentLead.sc_name || parentLead.handle_person || "",
              customerSay: row.what_did_customer_say || "",
              status: row.enquiry_received_status || "",
              enquiryStatus: row.enquiry_received_status || "",
              enquiryReceivedStatus: row.enquiry_received_status || "",
              enquiryReceivedDate: row.enquiry_received_date
                ? formatDateToDDMMYYYY(row.enquiry_received_date)
                : "",
              enquiryState: row.enquiry_for_state || "",
              projectName: row.project_name || "",
              salesType: row.enquiry_type || "",
              projectApproxValue: row.project_approximate_value || "",
              nextAction: row.next_action || "",
              nextCallDate: row.next_call_date
                ? formatDateToDDMMYYYY(row.next_call_date)
                : "",
              nextCallTime: row.next_call_time
                ? formatNextCallTime(row.next_call_time)
                : "",
              assignedTo: row.sc_name || "",
              timestamp: row.created_at
                ? formatDateToDDMMYYYY(row.created_at)
                : "",
              delay: row.delay || "",
              plannedAt: row.planned_at ? formatDateToDDMMYYYY(row.planned_at) : "",
              companyCount: companyCountsMap[compName] || 0,
              callingCount: companyCountsMap[compName] || 0,
              enquiryCallingCount: enquiryCountsMap[leadNo] || 0,
              noOfFollowUps: historyFollowUpsCountMap[row.lead_id] || 0,
              lastFollowUpStatus: historyLastStatusMap[row.lead_id] || "",
            };
          });

          setHistoryFollowUps(filteredHistory);

          const currentDataLength = filteredHistory.length;
          setHasMoreHistory(
            currentDataLength > 0 && from + currentDataLength < (count || 0)
          );
        }
      } catch (error) {
        console.error("Error fetching follow-up data:", error);

        // Keep existing fallback logic...
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentUser, isAdmin, activeTab, dateFilter, startDate, endDate, scNameFilter, companyFilter, filterType, itemsPerPage]
  );

  // Remove or comment out these filter functions since filtering now happens at database level:

  // const filteredPendingFollowUps = pendingFollowUps.filter((followUp) => {
  //   ... existing filter logic ...
  // })

  // const filteredHistoryFollowUps = historyFollowUps.filter((followUp) => {
  //   ... existing filter logic ...
  // })

  // Replace the filter variables with direct usage:
  // Change all instances of `filteredPendingFollowUps` to `pendingFollowUps`
  // Change all instances of `filteredHistoryFollowUps` to `historyFollowUps`


  useEffect(() => {
    if (activeTab === "history") {
      calculateHistoryCounts().then((counts) => {
        setHistoryCounts(counts);
      });
    }
  }, [activeTab, calculateHistoryCounts, dateFilter, searchTerm, startDate, endDate]); // Add date range filters

  // Fetch unique SC names on component mount
  useEffect(() => {
    fetchUniqueScNames();
  }, [fetchUniqueScNames]);

  // Fetch filter type counts when context changes
  useEffect(() => {
    fetchFilterTypeCounts();
  }, [fetchFilterTypeCounts]);

  // Fetch all unique company names for filter
  useEffect(() => {
    const fetchAllCompanyNames = async () => {
      try {
        // Fetch from call_tracker_for_leads (History)
        const { data: historyData, error: historyError } = await supabase
          .from("call_tracker_for_leads")
          .select("*");

        let companies = [];
        if (!historyError && historyData) {
          companies = historyData.map(item => item.company_name || item["Company_Name"]).filter(Boolean);
        }

        // Fetch from leads (Pending)
        const { data: pendingData, error: pendingError } = await supabase
          .from("leads")
          .select("company_name");

        if (!pendingError && pendingData) {
          companies = [...companies, ...pendingData.map(item => item.company_name || item["Company_Name"]).filter(Boolean)];
        }

        const uniqueCompanies = [...new Set(companies)].sort();
        setAllCompanyNames(uniqueCompanies);

      } catch (error) {
        console.error("Error fetching all company names:", error);
      }
    };

    fetchAllCompanyNames();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateFilter, companyFilter, scNameFilter, filterType, currentUser]);

  useEffect(() => {
    fetchFollowUpData(currentPage, searchTerm);
  }, [currentPage, itemsPerPage, activeTab, dateFilter, companyFilter, scNameFilter, filterType, currentUser, fetchFollowUpData]);


  // Debounced search function
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchFollowUpData(1, searchTerm);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm]);

  // Filter function for search in both sections
  const filteredPendingFollowUps = pendingFollowUps.filter((followUp) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      (followUp.companyName &&
        followUp.companyName.toLowerCase().includes(searchLower)) ||
      (followUp.leadId &&
        followUp.leadId.toLowerCase().includes(searchLower)) ||
      (followUp.personName &&
        followUp.personName.toLowerCase().includes(searchLower)) ||
      (followUp.phoneNumber &&
        followUp.phoneNumber.toString().toLowerCase().includes(searchLower)) ||
      (followUp.leadSource &&
        followUp.leadSource.toLowerCase().includes(searchLower)) ||
      (followUp.location &&
        followUp.location.toLowerCase().includes(searchLower)) ||
      (followUp.customerSay &&
        followUp.customerSay.toLowerCase().includes(searchLower)) ||
      (followUp.enquiryReceivedStatus &&
        followUp.enquiryReceivedStatus.toLowerCase().includes(searchLower)) ||
      (followUp.assignedTo &&
        followUp.assignedTo.toLowerCase().includes(searchLower));

    const matchesFilterType = true; // Filter handled at DB level

    const matchesDateFilter = checkDateFilter(followUp, dateFilter);
    const matchesCompanyFilter =
      !companyFilter || companyFilter.length === 0 || companyFilter.includes(followUp.companyName);
    const matchesPersonFilter =
      !personFilter || personFilter.length === 0 || personFilter.includes(followUp.personName);
    const phoneToCompare = followUp.phoneNumber
      ? followUp.phoneNumber.toString().trim()
      : "";
    const matchesPhoneFilter =
      !phoneFilter || phoneFilter.length === 0 || phoneFilter.map(p => p.toString().trim()).includes(phoneToCompare);

    return (
      matchesSearch &&
      matchesFilterType &&
      matchesDateFilter &&
      matchesCompanyFilter &&
      matchesPersonFilter &&
      matchesPhoneFilter
    );
  });



  // const filteredHistoryFollowUps = historyFollowUps.filter((followUp) => {
  //   const searchLower = searchTerm.toLowerCase()
  //   const matchesSearch =
  //     searchTerm === "" ||
  //     (followUp.leadNo && followUp.leadNo.toString().toLowerCase().includes(searchLower)) ||
  //     (followUp.customerSay && followUp.customerSay.toLowerCase().includes(searchLower)) ||
  //     (followUp.status && followUp.status.toLowerCase().includes(searchLower)) ||
  //     (followUp.enquiryReceivedStatus && followUp.enquiryReceivedStatus.toLowerCase().includes(searchLower)) ||
  //     (followUp.enquiryReceivedDate && followUp.enquiryReceivedDate.toLowerCase().includes(searchLower)) ||
  //     (followUp.enquiryState && followUp.enquiryState.toLowerCase().includes(searchLower)) ||
  //     (followUp.projectName && followUp.projectName.toLowerCase().includes(searchLower)) ||
  //     (followUp.salesType && followUp.salesType.toLowerCase().includes(searchLower)) ||
  //     (followUp.requiredProductDate && followUp.requiredProductDate.toLowerCase().includes(searchLower)) ||
  //     (followUp.projectApproxValue && followUp.projectApproxValue.toString().toLowerCase().includes(searchLower)) ||
  //     (followUp.itemName1 && followUp.itemName1.toLowerCase().includes(searchLower)) ||
  //     (followUp.itemName2 && followUp.itemName2.toLowerCase().includes(searchLower)) ||
  //     (followUp.itemName3 && followUp.itemName3.toLowerCase().includes(searchLower)) ||
  //     (followUp.itemName4 && followUp.itemName4.toLowerCase().includes(searchLower)) ||
  //     (followUp.itemName5 && followUp.itemName5.toLowerCase().includes(searchLower)) ||
  //     (followUp.nextAction && followUp.nextAction.toLowerCase().includes(searchLower)) ||
  //     (followUp.nextCallDate && followUp.nextCallDate.toLowerCase().includes(searchLower)) ||
  //     (followUp.nextCallTime && followUp.nextCallTime.toLowerCase().includes(searchLower))

  //   const matchesFilterType = (() => {
  //     if (filterType === "first") {
  //       return (
  //         followUp.enquiryReceivedStatus === "" ||
  //         followUp.enquiryReceivedStatus === null ||
  //         followUp.enquiryReceivedStatus === "New"
  //       )
  //     } else if (filterType === "multi") {
  //       return followUp.enquiryReceivedStatus === "Expected" || followUp.enquiryReceivedStatus === "expected"
  //     } else {
  //       return true
  //     }
  //   })()

  //   // const matchesDateFilter = checkDateFilter(followUp, dateFilter)
  //   const matchesDateFilter = checkDateFilterHistory(followUp, dateFilter)

  //   return matchesSearch && matchesFilterType && matchesDateFilter
  // })

  const filteredHistoryFollowUps = historyFollowUps.filter((followUp) => {
    // Only keep filterType filter on client side since search and date are handled at DB level
    const matchesFilterType = true; // Filter handled at DB level

    const matchesCompanyFilter =
      !companyFilter || companyFilter.length === 0 || companyFilter.includes(followUp.companyName);

    return matchesFilterType && matchesCompanyFilter;
  });

  const handleColumnToggle = (columnKey) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(visibleColumns).every(Boolean);
    const newState = Object.fromEntries(
      Object.keys(visibleColumns).map((key) => [key, !allSelected])
    );
    setVisibleColumns(newState);
  };

  const columnOptions = [
    { key: "actions", label: "Actions" },
    { key: "edit", label: "Edit" },
    { key: "timestamp", label: "Timestamp" },
    { key: "callingCount", label: "Calling Count" },
    { key: "enquiryCallingCount", label: "Enquiry Calling Count" }, // New column
    { key: "noOfFollowUps", label: "No. of FollowUps" }, // New column
    { key: "lastFollowUpStatus", label: "Last FollowUp Status" },
    { key: "leadNo", label: "Lead No." },
    { key: "companyName", label: "Company Name" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Phone Number" },
    { key: "customerSay", label: "Customer Say" },
    { key: "status", label: "Status" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "receivedDate", label: "Received Date" },
    { key: "state", label: "State" },
    { key: "projectName", label: "Project Name" },
    { key: "salesType", label: "Sales Type" },
    { key: "productDate", label: "Product Date" },
    { key: "projectValue", label: "Project Value" },
    { key: "item1", label: "Item 1" },
    { key: "qty1", label: "Qty 1" },
    { key: "item2", label: "Item 2" },
    { key: "qty2", label: "Qty 2" },
    { key: "item3", label: "Item 3" },
    { key: "qty3", label: "Qty 3" },
    { key: "item4", label: "Item 4" },
    { key: "qty4", label: "Qty 4" },
    { key: "item5", label: "Item 5" },
    { key: "qty5", label: "Qty 5" },
    { key: "nextAction", label: "Next Action" },
    { key: "callDate", label: "Call Date" },
    { key: "callTime", label: "Call Time" },
    { key: "itemQty", label: "Item/Qty" },
  ];

  const dateFilterCounts = calculateDateFilterCounts();
  // const historyCounts = calculateHistoryCounts();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnDropdown && !event.target.closest(".relative")) {
        setShowColumnDropdown(false);
      }
      if (showPendingColumnDropdown && !event.target.closest(".relative")) {
        setShowPendingColumnDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnDropdown, showPendingColumnDropdown]);

  // Cell rendering helpers for Pending tab
  const renderPendingCell = (followUp, columnKey, index) => {
    switch (columnKey) {
      case "actions":
        return (
          <td key="actions" className="sticky left-0 z-10 bg-white px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-r border-gray-200">
            <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
              <button
                onClick={() => setSelectedCallNowRow(followUp)}
                className="w-full sm:w-auto px-2 sm:px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md transition-colors whitespace-nowrap"
              >
                Call Now <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
              </button>
            </div>
          </td>
        );
      case "details":
        return (
          <td key="details" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap text-center">
            <button
              onClick={() => setSelectedDetailsRow(followUp)}
              title="View Details"
              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-full transition-colors inline-flex items-center justify-center"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          </td>
        );
      case "edit":
        return (
          <td key="edit" className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-r border-gray-200">
            {editingRowId === index ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSaveClick(index)}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelClick}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEditClick(followUp, index)}
                className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
            )}
          </td>
        );
      case "timestamp":
        return (
          <td key="timestamp" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="date"
                value={convertDateToYYYYMMDD(editedData.timestamp) || ""}
                onChange={(e) => handleFieldChange("timestamp", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.timestamp
            )}
          </td>
        );
      case "leadId":
        return (
          <td key="leadId" className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.leadId || ""}
                onChange={(e) => handleFieldChange("leadId", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.leadId
            )}
          </td>
        );
      case "enquiryType":
        return (
          <td key="enquiryType" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.enquiryType}
          </td>
        );
      case "leadSource":
        return (
          <td key="leadSource" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.leadSource || ""}
                onChange={(e) => handleFieldChange("leadSource", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${followUp.priority === "High"
                  ? "bg-red-100 text-red-800"
                  : followUp.priority === "Medium"
                    ? "bg-sky-100 text-sky-800"
                    : "bg-slate-100 text-slate-800"
                  }`}
              >
                {followUp.leadSource}
              </span>
            )}
          </td>
        );
      case "companyName":
        return (
          <td key="companyName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-900 font-semibold">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.companyName || ""}
                onChange={(e) => handleFieldChange("companyName", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[200px] whitespace-normal break-words">{followUp.companyName}</div>
            )}
          </td>
        );
      case "personName":
        return (
          <td key="personName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.personName || ""}
                onChange={(e) => handleFieldChange("personName", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[150px] whitespace-normal break-words">{followUp.personName}</div>
            )}
          </td>
        );
      case "handlePerson":
        return (
          <td key="handlePerson" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.handlePerson || ""}
                onChange={(e) => handleFieldChange("handlePerson", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.handlePerson || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "phoneNumber":
        return (
          <td key="phoneNumber" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.phoneNumber || ""}
                onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.phoneNumber
            )}
          </td>
        );
      case "lastFollowUpDate":
        return (
          <td key="lastFollowUpDate" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.lastFollowUpDate || <span className="text-gray-300">—</span>}
          </td>
        );
      case "nextCallDate":
        return (
          <td key="nextCallDate" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="date"
                value={convertDateToYYYYMMDD(editedData.nextCallDate) || ""}
                onChange={(e) => handleFieldChange("nextCallDate", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.nextCallDate || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "customerSay":
        return (
          <td key="customerSay" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <textarea
                value={editedData.customerSay || ""}
                onChange={(e) => handleFieldChange("customerSay", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                rows="2"
              />
            ) : (
              <div className="max-w-[200px] whitespace-normal break-words">{followUp.customerSay}</div>
            )}
          </td>
        );
      case "noOfFollowUps":
        return (
          <td key="noOfFollowUps" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.noOfFollowUps > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                {followUp.noOfFollowUps}
              </span>
            ) : (
              "-"
            )}
          </td>
        );
      case "address":
        return (
          <td key="address" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Address || ""}
                onChange={(e) => handleFieldChange("Address", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Address || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "receiverName":
        return (
          <td key="receiverName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.receiverName || <span className="text-gray-300">—</span>}
          </td>
        );
      case "assignedTo":
        return (
          <td key="assignedTo" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.assignedTo || ""}
                onChange={(e) => handleFieldChange("assignedTo", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.assignedTo
            )}
          </td>
        );
      case "lastFollowUpStatus":
        return (
          <td key="lastFollowUpStatus" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.lastFollowUpStatus || <span className="text-gray-300">—</span>}
          </td>
        );
      case "nextAction":
        return (
          <td key="nextAction" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.nextAction || ""}
                onChange={(e) => handleFieldChange("nextAction", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[150px] whitespace-normal break-words">{followUp.nextAction}</div>
            )}
          </td>
        );
      case "location":
        return (
          <td key="location" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.location || ""}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[150px] whitespace-normal break-words">{followUp.location}</div>
            )}
          </td>
        );
      case "enquiryStatus":
        return (
          <td key="enquiryStatus" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.enquiryStatus || ""}
                onChange={(e) => handleFieldChange("enquiryStatus", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.enquiryStatus || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "email":
        return (
          <td key="email" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Email_Address || ""}
                onChange={(e) => handleFieldChange("Email_Address", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Email_Address || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "state":
        return (
          <td key="state" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.State || ""}
                onChange={(e) => handleFieldChange("State", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.State || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "personName1":
        return (
          <td key="personName1" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Person_name_1 || ""}
                onChange={(e) => handleFieldChange("Person_name_1", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Person_name_1 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "designation1":
        return (
          <td key="designation1" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Designation_1 || ""}
                onChange={(e) => handleFieldChange("Designation_1", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Designation_1 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "phoneNumber1":
        return (
          <td key="phoneNumber1" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Phone_Number_1 || ""}
                onChange={(e) => handleFieldChange("Phone_Number_1", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Phone_Number_1 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "personName2":
        return (
          <td key="personName2" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Person_Name_2 || ""}
                onChange={(e) => handleFieldChange("Person_Name_2", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Person_Name_2 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "designation2":
        return (
          <td key="designation2" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Designation_2 || ""}
                onChange={(e) => handleFieldChange("Designation_2", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Designation_2 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "phoneNumber2":
        return (
          <td key="phoneNumber2" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Phone_Number_2 || ""}
                onChange={(e) => handleFieldChange("Phone_Number_2", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Phone_Number_2 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "personName3":
        return (
          <td key="personName3" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Person_Name_3 || ""}
                onChange={(e) => handleFieldChange("Person_Name_3", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Person_Name_3 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "designation3":
        return (
          <td key="designation3" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Designation_3 || ""}
                onChange={(e) => handleFieldChange("Designation_3", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Designation_3 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "phoneNumber3":
        return (
          <td key="phoneNumber3" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Phone_Number_3 || ""}
                onChange={(e) => handleFieldChange("Phone_Number_3", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Phone_Number_3 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "natureOfBusiness":
        return (
          <td key="natureOfBusiness" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.NOB || ""}
                onChange={(e) => handleFieldChange("NOB", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.NOB || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "gst":
        return (
          <td key="gst" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.GST_Number || ""}
                onChange={(e) => handleFieldChange("GST_Number", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.GST_Number || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "additionalNotes":
        return (
          <td key="additionalNotes" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Additional_Notes || ""}
                onChange={(e) => handleFieldChange("Additional_Notes", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[200px] whitespace-normal break-words">{followUp.Additional_Notes}</div>
            )}
          </td>
        );
      case "groupName":
        return (
          <td key="groupName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.groupName || <span className="text-gray-300">—</span>}
          </td>
        );
      case "customerRegForm":
        return (
          <td key="customerRegForm" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Customer_Registration_Form || ""}
                onChange={(e) => handleFieldChange("Customer_Registration_Form", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Customer_Registration_Form || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "creditAccess":
        return (
          <td key="creditAccess" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Credit_Access || ""}
                onChange={(e) => handleFieldChange("Credit_Access", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Credit_Access || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "creditDays":
        return (
          <td key="creditDays" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Credit_Days || ""}
                onChange={(e) => handleFieldChange("Credit_Days", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Credit_Days || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "creditLimit":
        return (
          <td key="creditLimit" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.Credit_Limit || ""}
                onChange={(e) => handleFieldChange("Credit_Limit", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.Credit_Limit || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      default:
        return null;
    }
  };

  // Cell rendering helpers for History tab
  const renderHistoryCell = (followUp, columnKey, index) => {
    switch (columnKey) {
      case "leadNo":
        return (
          <td key="leadNo" className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.leadNo || ""}
                onChange={(e) => handleFieldChange("leadNo", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.leadNo
            )}
          </td>
        );
      case "companyName":
        return (
          <td key="companyName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-900 font-semibold">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.companyName || ""}
                onChange={(e) => handleFieldChange("companyName", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[200px] whitespace-normal break-words">
                {followUp.companyName}
                {followUp.companyCount > 1 && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                    {followUp.companyCount}
                  </span>
                )}
              </div>
            )}
          </td>
        );
      case "personName":
        return (
          <td key="personName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            <div className="max-w-[150px] whitespace-normal break-words">{followUp.personName || <span className="text-gray-300">—</span>}</div>
          </td>
        );
      case "handlePerson":
        return (
          <td key="handlePerson" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.handlePerson || ""}
                onChange={(e) => handleFieldChange("handlePerson", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.handlePerson || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "phoneNumber":
        return (
          <td key="phoneNumber" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.phoneNumber || <span className="text-gray-300">—</span>}
          </td>
        );
      case "nextCallDate":
        return (
          <td key="nextCallDate" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="date"
                value={convertDateToYYYYMMDD(editedData.nextCallDate) || ""}
                onChange={(e) => handleFieldChange("nextCallDate", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.nextCallDate || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "customerSay":
        return (
          <td key="customerSay" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <textarea
                value={editedData.customerSay || ""}
                onChange={(e) => handleFieldChange("customerSay", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                rows="2"
              />
            ) : (
              <div className="max-w-[200px] whitespace-normal break-words">{followUp.customerSay}</div>
            )}
          </td>
        );
      case "noOfFollowUps":
        return (
          <td key="noOfFollowUps" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.noOfFollowUps > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                {followUp.noOfFollowUps}
              </span>
            ) : (
              "-"
            )}
          </td>
        );
      case "nextAction":
        return (
          <td key="nextAction" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.nextAction || ""}
                onChange={(e) => handleFieldChange("nextAction", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words">{followUp.nextAction}</div>
            )}
          </td>
        );
      case "timestamp":
        return (
          <td key="timestamp" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.timestamp}
          </td>
        );
      case "callingCount":
        return (
          <td key="callingCount" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.companyCount}
          </td>
        );
      case "enquiryCallingCount":
        return (
          <td key="enquiryCallingCount" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.enquiryCallingCount}
          </td>
        );
      case "lastFollowUpStatus":
        return (
          <td key="lastFollowUpStatus" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.lastFollowUpStatus || <span className="text-gray-300">—</span>}
          </td>
        );
      case "enquiryStatus":
        return (
          <td key="enquiryStatus" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.enquiryStatus || ""}
                onChange={(e) => handleFieldChange("enquiryStatus", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.enquiryStatus || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "receivedDate":
        return (
          <td key="receivedDate" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="date"
                value={convertDateToYYYYMMDD(editedData.enquiryReceivedDate) || ""}
                onChange={(e) => handleFieldChange("enquiryReceivedDate", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.enquiryReceivedDate || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "state":
        return (
          <td key="state" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.enquiryState || ""}
                onChange={(e) => handleFieldChange("enquiryState", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.enquiryState || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "projectName":
        return (
          <td key="projectName" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.projectName || ""}
                onChange={(e) => handleFieldChange("projectName", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              <div className="max-w-[150px] whitespace-normal break-words">{followUp.projectName}</div>
            )}
          </td>
        );
      case "salesType":
        return (
          <td key="salesType" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.salesType || ""}
                onChange={(e) => handleFieldChange("salesType", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.salesType || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "productDate":
        return (
          <td key="productDate" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {followUp.requiredProductDate || <span className="text-gray-300">—</span>}
          </td>
        );
      case "projectValue":
        return (
          <td key="projectValue" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input
                type="text"
                value={editedData.projectApproxValue || ""}
                onChange={(e) => handleFieldChange("projectApproxValue", e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
              />
            ) : (
              followUp.projectApproxValue || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "item1":
        return (
          <td key="item1" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.itemName1 || ""} onChange={(e) => handleFieldChange("itemName1", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.itemName1 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "qty1":
        return (
          <td key="qty1" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.quantity1 || ""} onChange={(e) => handleFieldChange("quantity1", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.quantity1 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "item2":
        return (
          <td key="item2" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.itemName2 || ""} onChange={(e) => handleFieldChange("itemName2", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.itemName2 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "qty2":
        return (
          <td key="qty2" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.quantity2 || ""} onChange={(e) => handleFieldChange("quantity2", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.quantity2 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "item3":
        return (
          <td key="item3" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.itemName3 || ""} onChange={(e) => handleFieldChange("itemName3", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.itemName3 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "qty3":
        return (
          <td key="qty3" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.quantity3 || ""} onChange={(e) => handleFieldChange("quantity3", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.quantity3 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "item4":
        return (
          <td key="item4" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.itemName4 || ""} onChange={(e) => handleFieldChange("itemName4", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.itemName4 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "qty4":
        return (
          <td key="qty4" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.quantity4 || ""} onChange={(e) => handleFieldChange("quantity4", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.quantity4 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "item5":
        return (
          <td key="item5" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.itemName5 || ""} onChange={(e) => handleFieldChange("itemName5", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.itemName5 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "qty5":
        return (
          <td key="qty5" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.quantity5 || ""} onChange={(e) => handleFieldChange("quantity5", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.quantity5 || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "callDate":
        return (
          <td key="callDate" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="date" value={convertDateToYYYYMMDD(editedData.nextCallDate) || ""} onChange={(e) => handleFieldChange("nextCallDate", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.nextCallDate || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "callTime":
        return (
          <td key="callTime" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.nextCallTime || ""} onChange={(e) => handleFieldChange("nextCallTime", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              followUp.nextCallTime || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "itemQty":
        return (
          <td key="itemQty" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
            {editingRowId === index ? (
              <input type="text" value={editedData.itemQty || ""} onChange={(e) => handleFieldChange("itemQty", e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm w-full bg-white" />
            ) : (
              formatItemQty(followUp.itemQty) || <span className="text-gray-300">—</span>
            )}
          </td>
        );
      case "actions":
        return (
          <td key="actions" className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
          </td>
        );
      case "edit":
        return (
          <td key="edit" className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-l border-gray-200">
            {editingRowId === index ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSaveClick(index)}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelClick}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEditClick(followUp, index)}
                className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
              >
                Edit
              </button>
            )}
          </td>
        );
      default:
        return null;
    }
  };

  // Row mapping helpers for DataTable
  const renderPendingRow = (followUp, index) => {
    return (
      <tr key={`${followUp.leadId}-${index}`} className="hover:bg-slate-50 transition-colors">
        {pendingColumnOptions.map(opt => {
          if (!pendingVisibleColumns[opt.key]) return null;
          return renderPendingCell(followUp, opt.key, index);
        })}
      </tr>
    );
  };

  const renderHistoryRow = (followUp, index) => {
    return (
      <tr key={`${followUp.id || index}-${index}`} className="hover:bg-slate-50 transition-colors">
        {columnOptions.map(opt => {
          if (!visibleColumns[opt.key]) return null;
          return renderHistoryCell(followUp, opt.key, index);
        })}
      </tr>
    );
  };

  // Card rendering helpers for Mobile DataTable
  const renderPendingCard = (followUp, index) => {
    return (
      <div
        key={`${followUp.leadId}-${index}`}
        className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col w-full text-left"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900 text-lg">
              {followUp.leadId}
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${followUp.priority === "High"
                ? "bg-red-100 text-red-700"
                : followUp.priority === "Medium"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 text-slate-700"
                }`}
            >
              {followUp.leadSource}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              ></path>
            </svg>
            <span>{followUp.personName}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Company</p>
              <p className="text-sm font-medium text-gray-900 truncate">
                {followUp.companyName}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="text-sm font-medium text-gray-900">
                {followUp.phoneNumber}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Call Date</p>
            <p className="text-sm font-medium text-gray-900">
              {followUp.timestamp}
            </p>
          </div>

          {followUp.customerSay && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  ></path>
                </svg>
                Customer Said
              </p>
              <p className="text-sm text-gray-800 italic">
                "{followUp.customerSay}"
              </p>
            </div>
          )}

          {isAdmin() && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Assigned To</p>
              <p className="text-sm font-medium text-gray-950">
                {followUp.assignedTo}
              </p>
            </div>
          )}

          {followUp.itemQty && (
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
              <p className="text-xs text-sky-600 font-medium mb-1">
                Items
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatItemQty(followUp.itemQty)}
              </p>
            </div>
          )}
        </div>

        {/* Action Section */}
        <div className="px-4 pb-4">
          <Link
            state={followUp.assignedTo}
            to={`/call-tracker/form?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              ></path>
            </svg>
            Call Now
          </Link>
        </div>
      </div>
    );
  };

  const renderHistoryCard = (followUp, index) => {
    return (
      <div
        key={index}
        className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden flex flex-col w-full text-left"
      >
        {/* Header Section */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-gray-900 text-lg">
              {followUp.leadNo}
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${followUp.status === "Completed"
                ? "bg-green-100 text-green-700"
                : followUp.status === "Pending"
                  ? "bg-sky-100 text-sky-700"
                  : "bg-red-100 text-red-700"
                }`}
            >
              {followUp.status}
            </span>
          </div>
          {followUp.timestamp && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                ></path>
              </svg>
              <span>{followUp.timestamp}</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3 flex-1">
          {followUp.customerSay && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-600 font-medium mb-1 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  ></path>
                </svg>
                Customer Said
              </p>
              <p className="text-sm text-gray-800 italic">
                "{followUp.customerSay}"
              </p>
            </div>
          )}

          {followUp.enquiryStatus && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Enquiry Status</p>
              <p className="text-sm font-medium text-gray-900">
                {followUp.enquiryStatus}
              </p>
            </div>
          )}

          {followUp.nextCallDate && (
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
                Next Follow-up
              </p>
              <p className="text-sm font-medium text-gray-900">
                {followUp.nextCallDate}{" "}
                {followUp.nextCallTime && `at ${followUp.nextCallTime}`}
              </p>
            </div>
          )}

          {followUp.itemQty && (
            <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
              <p className="text-xs text-sky-600 font-medium mb-1">
                Items
              </p>
              <p className="text-sm font-medium text-gray-900">
                {formatItemQty(followUp.itemQty)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Pagination (state declared near the top of the component, above) ─────

  const rawData = activeTab === "pending" ? filteredPendingFollowUps : historyFollowUps;
  const currentData = [...rawData].sort((a, b) => {
    const valA = String(a.leadId || a.lead_no || a.leadNo || "").trim();
    const valB = String(b.leadId || b.lead_no || b.leadNo || "").trim();
    const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
    return activeTab === "history" ? -cmp : cmp;
  });

  const totalResults = currentData.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / itemsPerPage));
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, companyFilter, personFilter, phoneFilter, dateFilter, filterType]);

  // History's server fetch batch size now matches itemsPerPage, so changing
  // the page-size toggle needs a re-fetch to actually pull that many rows.
  // Pending isn't affected -- it already loads its full matching set upfront
  // and paginates that client-side.
  useEffect(() => {
    if (activeTab !== "history") return;
    setHistoryPage(1);
    setHasMoreHistory(true);
    fetchFollowUpData(1, false, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]);

  // ─── Header builder ───────────────────────────────────────────────────────
  const getHeaders = () => {
    if (activeTab === "pending") {
      const base = [
        { label: "Actions", className: "sticky left-0 bg-gray-50 z-30 shadow-[1px_0_0_0_#e5e7eb] border-r border-gray-200" },
      ];
      pendingColumnOptions.forEach((opt) => {
        if (opt.key !== "actions" && pendingVisibleColumns[opt.key]) base.push(opt.label);
      });
      return base;
    }
    return columnOptions.filter((opt) => visibleColumns[opt.key]).map((opt) => opt.label);
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full p-1 md:p-1.5">
      <CallTrackerFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        companyFilter={companyFilter}
        setCompanyFilter={setCompanyFilter}
        personFilter={personFilter}
        setPersonFilter={setPersonFilter}
        phoneFilter={phoneFilter}
        setPhoneFilter={setPhoneFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        dateFilterCounts={dateFilterCounts}
        filterType={filterType}
        setFilterType={setFilterType}
        showColumnDropdown={showColumnDropdown}
        setShowColumnDropdown={setShowColumnDropdown}
        visibleColumns={visibleColumns}
        handleSelectAll={handleSelectAll}
        handleColumnToggle={handleColumnToggle}
        columnOptions={columnOptions}
        visibleColumnsPending={pendingVisibleColumns}
        handleSelectAllPending={() => {
          const all = Object.values(pendingVisibleColumns).every(Boolean);
          setPendingVisibleColumns(Object.fromEntries(Object.keys(pendingVisibleColumns).map(k => [k, !all])));
        }}
        handleColumnTogglePending={(key) => setPendingVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}
        columnOptionsPending={pendingColumnOptions}
        pendingFollowUps={pendingFollowUps}
      />

      <div className="flex-1 flex flex-col min-h-0 mt-1">
        {isLoading ? (
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-slate-500">Loading follow-up data...</p>
          </div>
        ) : (
          <DataTable
            headers={getHeaders()}
            data={paginatedData}
            renderRow={activeTab === "pending" ? renderPendingRow : renderHistoryRow}
            renderCard={activeTab === "pending" ? renderPendingCard : renderHistoryCard}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={[100, 200, 500]}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={totalResults}
          />
        )}
      </div>

      {/* Details Modal */}
      {selectedDetailsRow && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Lead Details</h3>
                <p className="text-purple-100 text-xs">{selectedDetailsRow.leadId}</p>
              </div>
              <button
                onClick={() => setSelectedDetailsRow(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase">Company Name</span>
                  <span className="font-semibold text-gray-900">{selectedDetailsRow.companyName || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase">Person Name</span>
                  <span className="font-medium text-gray-800">{selectedDetailsRow.personName || "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase">Phone Number</span>
                  <span className="font-medium text-gray-800">{selectedDetailsRow.phoneNumber || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase">Total Follow-ups</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                    {selectedDetailsRow.noOfFollowUps || 0}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-100">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase">Last Call Date</span>
                  <span className="font-medium text-gray-800">{formatDateToDDMMYYYY(selectedDetailsRow.lastFollowUpDate || selectedDetailsRow.timestamp) || "—"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block uppercase">Last Follow-up Status</span>
                  <span className="font-medium text-gray-800">{selectedDetailsRow.lastFollowUpStatus || selectedDetailsRow.enquiryStatus || "—"}</span>
                </div>
              </div>

              <div className="pb-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-gray-400 block uppercase mb-1">What We Talked About (Customer Say)</span>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-xs leading-relaxed border border-gray-100">
                  {selectedDetailsRow.customerSay || "No previous notes available."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Assigned To</span>
                  <span className="text-gray-700">{selectedDetailsRow.assignedTo || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Handle Person</span>
                  <span className="text-gray-700">{selectedDetailsRow.handlePerson || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Next Action</span>
                  <span className="text-gray-700">{selectedDetailsRow.nextAction || "—"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Next Call Date</span>
                  <span className="text-gray-700">{formatDateToDDMMYYYY(selectedDetailsRow.nextCallDate) || "—"}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDetailsRow(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium text-xs rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Now Form Modal */}
      {selectedCallNowRow && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <button
              onClick={() => setSelectedCallNowRow(null)}
              className="absolute top-3 right-3 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              ✕
            </button>
            <NewCallTracker
              initialLeadId={selectedCallNowRow.leadId}
              initialLeadNo={selectedCallNowRow.leadId}
              isModal={true}
              onClose={(refreshed) => {
                setSelectedCallNowRow(null);
                if (refreshed) {
                  fetchFollowUpData(historyPage, false, searchTerm);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default CallTracker;

