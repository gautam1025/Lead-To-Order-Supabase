"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { SearchIcon, ArrowRightIcon } from "../../components/Icons";
import { AuthContext } from "../../App";
import supabase from "../../utils/supabase";
import SearchableDropdown from "../../components/SearchableDropdown";
import DataTable from "../../components/DataTable";
import CallTrackerFilter from "../../components/call-tracker/CallTrackerFilter";

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
  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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

  // Pending column visibility (checked = visible by default)
  const [pendingVisibleColumns, setPendingVisibleColumns] = useState({
    actions: true,
    edit: true,
    lastFollowUpDate: true,
    noOfFollowUps: true,
    lastFollowUpStatus: true,
    nextCallDate: true,
    leadId: true,
    companyName: true,
    nextAction: true,
    personName: true,
    phoneNumber: true,
    leadSource: true,
    location: true,
    customerSay: true,
    enquiryStatus: true,
    assignedTo: true,
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
  });
  const [showPendingColumnDropdown, setShowPendingColumnDropdown] = useState(false);

  const pendingColumnOptions = [
    { key: "actions", label: "Actions" },
    { key: "edit", label: "Edit" },
    { key: "nextCallDate", label: "Next Call Date" },
    { key: "leadId", label: "Lead No." },
    { key: "companyName", label: "Company Name" },
    { key: "nextAction", label: "Next Action" },
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

  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return "";

    try {
      if (typeof dateValue === "string" && dateValue.includes("-")) {
        const [year, month, day] = dateValue.split("-");
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }

      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        const dateString = dateValue.substring(5, dateValue.length - 1);
        const [year, month, day] = dateString
          .split(",")
          .map((part) => Number.parseInt(part.trim()));

        return `${day.toString().padStart(2, "0")}/${(month + 1)
          .toString()
          .padStart(2, "0")}/${year}`;
      }

      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
      }

      return dateValue;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateValue;
    }
  };

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
          "Next_Call_Date": convertDateToYYYYMMDD(editedData.timestamp),
          "LD-Lead-No": editedData.leadId,
          "Company_Name": editedData.companyName,
          "Salesperson_Name": editedData.personName,
          "Phone_Number": editedData.phoneNumber,
          "Lead_Source": editedData.leadSource,
          "Lead_Receiver_Name": editedData.receiverName,
          "Enquiry_Type": editedData.enquiryType,
          "Location": editedData.location,
          "What_Did_The_Customer say?": editedData.customerSay,
          "Enquiry_Status": editedData.enquiryStatus,
          "SC_Name": editedData.assignedTo,
          "Email_Address": editedData.Email_Address,
          "State": editedData.State,
          "Address": editedData.Address,
          "Person_name_1": editedData.Person_name_1,
          "Designation_1": editedData.Designation_1,
          "Phone_Number_1": editedData.Phone_Number_1,
          "Person_Name_2": editedData.Person_Name_2,
          "Designation_2": editedData.Designation_2,
          "Phone_Number_2": editedData.Phone_Number_2,
          "Person_Name_3": editedData.Person_Name_3,
          "Designation_3": editedData.Designation_3,
          "Phone_Number_3": editedData.Phone_Number_3,
          "NOB": editedData.NOB,
          "GST_Number": editedData.GST_Number,
          "Customer_Registration Form": editedData.Customer_Registration_Form,
          "Credit _Access": editedData.Credit_Access,
          "Credit_Days": editedData.Credit_Days,
          "Credit_Limit": editedData.Credit_Limit,
          "Additional_Notes": editedData.Additional_Notes,
          "Next_Action": editedData.nextAction,
          "handle_person": editedData.handlePerson
        };

        // Remove undefined/null values
        Object.keys(pendingUpdateData).forEach((key) => {
          if (pendingUpdateData[key] === undefined || pendingUpdateData[key] === null) {
            delete pendingUpdateData[key];
          }
        });

        const { error } = await supabase
          .from("leads_to_order")
          .update(pendingUpdateData)
          .eq("id", editedData.id);

        if (error) throw error;

        alert("Updated successfully!");
        fetchFollowUpData(pendingPage, false, searchTerm);
        setEditingRowId(null);
        setEditedData({});
        return;
      }

      // Existing logic for History tab
      // Map the JavaScript field names to actual database column names
      const updateData = {
        Company_Name: editedData.companyName,
        "What_Did_The_Customer_say?": editedData.customerSay,
        Leads_Tracking_Status: editedData.status,
        Enquiry_Received_Status: editedData.enquiryStatus,
        Enquiry_Received_Date: convertDateToYYYYMMDD(editedData.enquiryReceivedDate),
        Enquiry_for_State: editedData.enquiryState,
        Project_Name: editedData.projectName,
        Enquiry_Type: editedData.salesType,
        Project_Approximate_Value: editedData.projectApproxValue,
        Item_Name1: editedData.itemName1,
        Quantity1: editedData.quantity1,
        Item_Name2: editedData.itemName2,
        Quantity2: editedData.quantity2,
        Item_Name3: editedData.itemName3,
        Quantity3: editedData.quantity3,
        Item_Name4: editedData.itemName4,
        Quantity4: editedData.quantity4,
        Item_Name5: editedData.itemName5,
        Quantity5: editedData.quantity5,
        Next_Action: editedData.nextAction,
        Next_Call_Date: convertDateToYYYYMMDD(editedData.nextCallDate),
        Next_Call_Time: convertTimeTo24Hour(editedData.nextCallTime),
        Item_Qty: editedData.itemQty,
      };

      // Remove undefined/null values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined || updateData[key] === null) {
          delete updateData[key];
        }
      });

      // Get the lead number for updating leads_to_order table
      const leadNo = editedData.leadNo;

      if (!leadNo) {
        throw new Error("Lead number is required for updating leads_to_order table");
      }

      // Define the fields to update in leads_to_order
      const leadsToOrderUpdateData = {
        "Status": editedData.status,
        "What_Did_The_Customer say?": editedData.customerSay,
        "Enquiry_Received_Status": editedData.enquiryStatus,
        "Enquiry_Received_Date": convertDateToYYYYMMDD(editedData.enquiryReceivedDate),
        "Enquiry_for_State": editedData.enquiryState,
        "Project_Name": editedData.projectName,
        "Enquiry_Type": editedData.salesType,
        "Project_Approximate_Value": editedData.projectApproxValue,
        "Item_Name1": editedData.itemName1,
        "Quantity1": editedData.quantity1,
        "Item_Name2": editedData.itemName2,
        "Quantity2": editedData.quantity2,
        "Item_Name3": editedData.itemName3,
        "Quantity3": editedData.quantity3,
        "Item_Name4": editedData.itemName4,
        "Quantity4": editedData.quantity4,
        "Item_Name5": editedData.itemName5,
        "Quantity5": editedData.quantity5,
        "Next_Action": editedData.nextAction,
        "Next_Call_Date": convertDateToYYYYMMDD(editedData.nextCallDate),
        "Next_Call_Time": convertTimeTo24Hour(editedData.nextCallTime),
      };

      // Remove undefined/null values from leads_to_order update
      Object.keys(leadsToOrderUpdateData).forEach((key) => {
        if (leadsToOrderUpdateData[key] === undefined || leadsToOrderUpdateData[key] === null) {
          delete leadsToOrderUpdateData[key];
        }
      });

      // Update both tables in parallel
      const [updateTrackerResult, updateLeadsOrderResult] = await Promise.allSettled([
        // Update leads_tracker table
        supabase
          .from("leads_tracker")
          .update(updateData)
          .eq("id", editedData.id),

        // Update leads_to_order table using LD-Lead-No
        supabase
          .from("leads_to_order")
          .update(leadsToOrderUpdateData)
          .eq("LD-Lead-No", leadNo)
      ]);

      // Check for errors in leads_tracker update
      if (updateTrackerResult.status === 'rejected') {
        throw new Error(`Error updating leads_tracker: ${updateTrackerResult.reason.message}`);
      }

      const trackerError = updateTrackerResult.value.error;
      if (trackerError) {
        throw new Error(`leads_tracker update failed: ${trackerError.message}`);
      }

      // Check for errors in leads_to_order update
      if (updateLeadsOrderResult.status === 'rejected') {
        console.warn(`Warning: Error updating leads_to_order: ${updateLeadsOrderResult.reason.message}`);
        // Continue anyway as leads_tracker was updated successfully
      } else {
        const leadsOrderError = updateLeadsOrderResult.value.error;
        if (leadsOrderError) {
          console.warn(`Warning: leads_to_order update failed: ${leadsOrderError.message}`);
          // Continue anyway as leads_tracker was updated successfully
        }
      }

      alert("Updated successfully in both tables!");

      // Refresh data
      fetchFollowUpData(historyPage, false, searchTerm);
      setEditingRowId(null);
      setEditedData({});
    } catch (error) {
      console.error("Error updating:", error);

      // If leads_tracker update failed but leads_to_order succeeded,
      // show a different message
      if (error.message.includes('leads_tracker') && !error.message.includes('leads_to_order')) {
        alert(`Partially updated: leads_to_order was updated but leads_tracker failed: ${error.message}`);
      } else {
        alert(`Error updating: ${error.message}`);
      }
    }
  };

  const handleCancelClick = () => {
    setEditingRowId(null);
    setEditedData({});
  };

  const handleFieldChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const checkDateFilter = (followUp, filterType) => {
    if (filterType === "all") return true;

    const nextCallDate = followUp.nextCallDate;
    if (!nextCallDate) return false;

    try {
      let followUpDate;

      if (nextCallDate.includes("-")) {
        const [year, month, day] = nextCallDate.split("-");
        followUpDate = new Date(year, month - 1, day);
      } else if (nextCallDate.includes("/")) {
        const [day, month, year] = nextCallDate.split("/");
        followUpDate = new Date(year, month - 1, day);
      } else {
        followUpDate = new Date(nextCallDate);
      }

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
    } catch (error) {
      console.error("Error parsing date:", error, "Date value:", nextCallDate);
      return false;
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
      const nextCallDate = followUp.nextCallDate;
      if (!nextCallDate) return;

      try {
        let followUpDate;

        if (nextCallDate.includes("-")) {
          const [year, month, day] = nextCallDate.split("-");
          followUpDate = new Date(year, month - 1, day);
        } else if (nextCallDate.includes("/")) {
          const [day, month, year] = nextCallDate.split("/");
          followUpDate = new Date(year, month - 1, day);
        } else {
          followUpDate = new Date(nextCallDate);
        }

        followUpDate.setHours(0, 0, 0, 0);

        if (followUpDate.getTime() === today.getTime()) {
          counts.today++;
        } else if (followUpDate < today) {
          counts.overdue++;
        } else if (followUpDate > today) {
          counts.upcoming++;
        }
      } catch (error) {
        console.error(
          "Error parsing date:",
          error,
          "Date value:",
          nextCallDate
        );
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
        .from("leads_tracker")
        .select("*", { count: "exact", head: true })
        .eq("Timestamp", todayStr);

      // Query for older count
      let olderQuery = supabase
        .from("leads_tracker")
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
      // Fetch unique SC names from leads_to_order for pending tab
      const { data: pendingScNames, error: pendingError } = await supabase
        .from("leads_to_order")
        .select("SC_Name")
        .not("SC_Name", "is", null)
        .not("SC_Name", "eq", "");

      if (pendingError) {
        console.error("Error fetching pending SC names:", pendingError);
      }

      // Fetch unique SC names from leads_tracker for history tab
      const { data: historyScNames, error: historyError } = await supabase
        .from("leads_tracker")
        .select("SC_Name")
        .not("SC_Name", "is", null)
        .not("SC_Name", "eq", "");

      if (historyError) {
        console.error("Error fetching history SC names:", historyError);
      }

      // Extract and deduplicate SC names for each tab
      const uniquePendingNames = Array.from(
        new Set((pendingScNames || []).map(item => item.SC_Name).filter(Boolean))
      ).sort();

      const uniqueHistoryNames = Array.from(
        new Set((historyScNames || []).map(item => item.SC_Name).filter(Boolean))
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
        const baseQuery = () => supabase
          .from("leads_to_order")
          .select("*", { count: "exact", head: true })
          .not("Planned", "is", null)
          .is("Actual", null);

        allQuery = baseQuery();
        firstQuery = baseQuery().or('Enquiry_Received_Status.is.null,Enquiry_Received_Status.eq.""');
        multiQuery = baseQuery().ilike("Enquiry_Received_Status", "%expected%");
      } else {
        const baseQuery = () => supabase
          .from("leads_tracker")
          .select("*", { count: "exact", head: true });

        allQuery = baseQuery();
        firstQuery = baseQuery().or('Enquiry_Received_Status.is.null,Enquiry_Received_Status.eq."",Enquiry_Received_Status.eq."New"');
        multiQuery = baseQuery().ilike("Enquiry_Received_Status", "%expected%");

        // Apply Company Filter to history counts for consistency
        if (companyFilter && companyFilter.length > 0) {
          allQuery = allQuery.in("Company_Name", companyFilter);
          firstQuery = firstQuery.in("Company_Name", companyFilter);
          multiQuery = multiQuery.in("Company_Name", companyFilter);
        }
      }

      // Apply SC Name Filter
      if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
        allQuery = allQuery.in("SC_Name", scNameFilter);
        firstQuery = firstQuery.in("SC_Name", scNameFilter);
        multiQuery = multiQuery.in("SC_Name", scNameFilter);
      } else if (!isAdmin() && currentUser && currentUser.username) {
        const usernamesToFilter = getUsernamesToFilter();
        allQuery = allQuery.in("SC_Name", usernamesToFilter);
        firstQuery = firstQuery.in("SC_Name", usernamesToFilter);
        multiQuery = multiQuery.in("SC_Name", usernamesToFilter);
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
    async (page = 1, isLoadMore = false, searchTerm = "") => {
      try {

        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setIsLoading(true);
        }

        const itemsPerPage = 50;
        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        if (activeTab === "pending") {
          let pendingQuery = supabase
            .from("leads_to_order")
            .select("*", { count: "exact" })
            .not("Planned", "is", null)
            .is("Actual", null);


          // Apply search filter to the query BEFORE pagination
          if (searchTerm) {
            pendingQuery = pendingQuery.or(
              `Company_Name.ilike.%${searchTerm}%,"LD-Lead-No".ilike.%${searchTerm}%,Salesperson_Name.ilike.%${searchTerm}%,Phone_Number.ilike.%${searchTerm}%,Lead_Source.ilike.%${searchTerm}%,Location.ilike.%${searchTerm}%,"What_Did_The_Customer say?".ilike.%${searchTerm}%,Enquiry_Received_Status.ilike.%${searchTerm}%,SC_Name.ilike.%${searchTerm}%`
            );
          }

          // Apply Filter Type (First Followup / Expected)
          if (filterType === "first") {
            pendingQuery = pendingQuery.or('Enquiry_Received_Status.is.null,Enquiry_Received_Status.eq.""');
          } else if (filterType === "multi") {
            pendingQuery = pendingQuery.ilike("Enquiry_Received_Status", "%expected%");
          }

          // Apply user filter if not admin
          if (!isAdmin() && currentUser && currentUser.username) {
            const usernamesToFilter = getUsernamesToFilter();
            pendingQuery = pendingQuery.in("SC_Name", usernamesToFilter);
          }

          // Apply SC name filter for admin
          if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
            pendingQuery = pendingQuery.in("SC_Name", scNameFilter);
          }

          // Add sorting by lead number (LD-Lead-No) in ascending order
          pendingQuery = pendingQuery.order("id", { ascending: true });

          // Apply pagination with range
          pendingQuery = pendingQuery.range(from, to);

          const { data, error, count } = await pendingQuery;

          if (error) throw error;

          const filteredPending = (data || []).map((row) => ({
            timestamp: row.Next_Call_Date
              ? formatDateToDDMMYYYY(row.Next_Call_Date)
              : "",
            id: row.id || "",
            leadId: row["LD-Lead-No"] || "",
            companyName: row["Company_Name"] || "",
            personName: row["Salesperson_Name"] || "",
            phoneNumber: row["Phone_Number"] || "",
            leadSource: row["Lead_Source"] || "",
            receiverName: row["Lead_Receiver_Name"] || "",
            enquiryType: row["Enquiry_Type"] || "",
            location: row["Location"] || "",
            customerSay: row["What_Did_The_Customer say?"] || "",
            enquiryStatus: row["Enquiry_Status"] || "",
            enquiryReceivedStatus: row["Enquiry_Received_Status"] || "",
            createdAt: row["Created_At"] || "",
            nextCallDate: row["Next_Call_Date"] || "",
            callingDays: row["Calling_Days"] || "",
            priority: determinePriority(row["Lead_Source"] || ""),
            assignedTo: row["SC_Name"] || row["assigned_user"] || "",
            nextAction: row["Next_Action"] || "",
            lastFollowUpDate: "", // will be enriched below
            // New customer detail columns
            Email_Address: row["Email_Address"] || "",
            State: row["State"] || "",
            Address: row["Address"] || "",
            Person_name_1: row["Person_name_1"] || "",
            Designation_1: row["Designation_1"] || "",
            Phone_Number_1: row["Phone_Number_1"] || "",
            Person_Name_2: row["Person_Name_2"] || "",
            Designation_2: row["Designation_2"] || "",
            Phone_Number_2: row["Phone_Number_2"] || "",
            Person_Name_3: row["Person_Name_3"] || "",
            Designation_3: row["Designation_3"] || "",
            Phone_Number_3: row["Phone_Number_3"] || "",
            NOB: row["NOB"] || "",
            GST_Number: row["GST_Number"] || "",
            Customer_Registration_Form: row["Customer_Registration Form"] || "",
            Credit_Access: row["Credit _Access"] || "",
            Credit_Days: row["Credit_Days"] || "",
            Credit_Limit: row["Credit_Limit"] || "",
            Additional_Notes: row["Additional_Notes"] || "",
            handlePerson: row["handle_person"] || "",
            groupName: row["Group_Name"] || "",
            noOfFollowUps: 0, // will be enriched below
            lastFollowUpStatus: "", // will be enriched below
          }));

          // Fetch most-recent Timestamp from leads_tracker per Lead_No
          try {
            const leadIds = [...new Set(filteredPending.map(r => r.leadId).filter(Boolean))];
            if (leadIds.length > 0) {
              const { data: trackerData } = await supabase
                .from("leads_tracker")
                .select('"LD-Lead-No", "Timestamp", "Enquiry_Received_Status"')
                .in('"LD-Lead-No"', leadIds)
                .order("Timestamp", { ascending: false }); // most recent first

              if (trackerData && trackerData.length > 0) {
                // Build map: first occurrence per lead = the most recent (latest) Timestamp
                const lastFollowUpMap = {};
                trackerData.forEach(tr => {
                  const leadNo = tr["LD-Lead-No"];
                  const ts = tr["Timestamp"];
                  const status = tr["Enquiry_Received_Status"];
                  if (!leadNo || !ts) return;
                  if (!lastFollowUpMap[leadNo]) {
                    lastFollowUpMap[leadNo] = {
                      date: ts,
                      status: status || "",
                      count: 1
                    }; // keep only the first = most recent
                  } else {
                    lastFollowUpMap[leadNo].count += 1;
                  }
                });
                // Enrich each pending row
                filteredPending.forEach(row => {
                  if (row.leadId && lastFollowUpMap[row.leadId]) {
                    row.lastFollowUpDate = formatDateToDDMMYYYY(lastFollowUpMap[row.leadId].date);
                    row.noOfFollowUps = lastFollowUpMap[row.leadId].count;
                    row.lastFollowUpStatus = lastFollowUpMap[row.leadId].status;
                  }
                });
              }
            }
          } catch (trackerErr) {
            console.warn("Could not fetch last follow-up dates:", trackerErr);
          }

          if (isLoadMore) {
            setPendingFollowUps((prev) => [...prev, ...filteredPending]);
          } else {
            setPendingFollowUps(filteredPending);
          }

          // Check if there's more data based on count and current data length
          const totalCount = count || 0;
          const currentDataLength = isLoadMore
            ? pendingFollowUps.length + filteredPending.length
            : filteredPending.length;

          const hasMore = currentDataLength < totalCount;
          setHasMorePending(hasMore);

        } else {
          // History tab data fetching
          let historyQuery = supabase
            .from("leads_tracker")
            .select("*", { count: "exact" });

          // Apply search filter to the query BEFORE pagination
          if (searchTerm) {
            historyQuery = historyQuery.or(
              `"LD-Lead-No".ilike.%${searchTerm}%,"What_Did_The_Customer say?".ilike.%${searchTerm}%,Leads_Tracking_Status.ilike.%${searchTerm}%,Enquiry_Received_Status.ilike.%${searchTerm}%,Enquiry_for_State.ilike.%${searchTerm}%,Project_Name.ilike.%${searchTerm}%,Enquiry_Type.ilike.%${searchTerm}%,Next_Action.ilike.%${searchTerm}%,SC_Name.ilike.%${searchTerm}%`
            );
            // historyQuery = historyQuery.or(
            //   `"LD-Lead-No".ilike.%${searchTerm}%`
            // );
          }

          // Apply user filter if not admin
          if (!isAdmin() && currentUser && currentUser.username) {
            const usernamesToFilter = getUsernamesToFilter();
            historyQuery = historyQuery.in("SC_Name", usernamesToFilter);
          }

          // Apply SC name filter for admin
          if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
            historyQuery = historyQuery.in("SC_Name", scNameFilter);
          }


          // Apply Company Name Filter
          if (companyFilter && companyFilter.length > 0) {
            // Handle precise matching or trim matching if necessary
            historyQuery = historyQuery.in("Company_Name", companyFilter);
          }

          // Apply Filter Type (First Followup / Expected)
          if (filterType === "first") {
            historyQuery = historyQuery.or('Enquiry_Received_Status.is.null,Enquiry_Received_Status.eq."",Enquiry_Received_Status.eq."New"');
          } else if (filterType === "multi") {
            historyQuery = historyQuery.ilike("Enquiry_Received_Status", "%expected%");
          }

          // Apply date filter at database level
          if (dateFilter === "today") {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(
              today.getMonth() + 1
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            historyQuery = historyQuery.eq("Timestamp", todayStr);
          } else if (dateFilter === "older") {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(
              today.getMonth() + 1
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
            historyQuery = historyQuery.lt("Timestamp", todayStr);
          }

          // Apply date range filter
          if (startDate) {
            historyQuery = historyQuery.gte("Timestamp", startDate);
          }
          if (endDate) {
            historyQuery = historyQuery.lte("Timestamp", endDate);
          }

          // Apply pagination with range
          historyQuery = historyQuery.range(from, to);

          const { data, error, count } = await historyQuery;

          if (error) throw error;

          // Update filtered count
          if (!isLoadMore) {
            setFilteredCount(count || 0);
          }

          // Fetch Company Counts
          const companyCountsMap = {};
          if (data && data.length > 0) {
            const uniqueCompanyNames = [...new Set(data.map(item => item["Company_Name"]).filter(Boolean))];

            if (uniqueCompanyNames.length > 0) {
              try {
                let countQuery = supabase
                  .from("leads_tracker")
                  .select('"Company_Name"');

                countQuery = countQuery.in('"Company_Name"', uniqueCompanyNames);

                // Apply SC name filter if needed (to be consistent with what user sees)
                if (!isAdmin() && currentUser && currentUser.username) {
                  const usernamesToFilter = getUsernamesToFilter();
                  countQuery = countQuery.in("SC_Name", usernamesToFilter);
                }


                if (isAdmin() && scNameFilter && scNameFilter.length > 0) {
                  countQuery = countQuery.in("SC_Name", scNameFilter);
                }

                // Apply Filter Type to Count Query
                if (filterType === "first") {
                  countQuery = countQuery.or('Enquiry_Received_Status.is.null,Enquiry_Received_Status.eq."",Enquiry_Received_Status.eq."New"');
                } else if (filterType === "multi") {
                  countQuery = countQuery.ilike("Enquiry_Received_Status", "%expected%");
                }

                // Apply Date Filters to Count Query
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

                // Consolidate date filter logic matching the main query patterns
                if (startDate) {
                  countQuery = countQuery.gte("Timestamp", startDate);
                }
                if (endDate) {
                  countQuery = countQuery.lte("Timestamp", endDate);
                }

                if (dateFilter === "today" && !startDate && !endDate) {
                  const formattedToday = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
                  countQuery = countQuery.eq("Timestamp", todayStr);
                } else if (dateFilter === "older" && !startDate && !endDate) {
                  countQuery = countQuery.lt("Timestamp", todayStr);
                }

                const { data: countData, error: countError } = await countQuery;

                if (!countError && countData) {
                  countData.forEach(item => {
                    const name = (item["Company_Name"] || "").trim(); // Normalize name
                    companyCountsMap[name] = (companyCountsMap[name] || 0) + 1;
                  });
                }
              } catch (err) {
                console.error("Error fetching company counts:", err);
              }
            }
          }

          // Fetch Enquiry Calling Counts (New Logic)
          const enquiryCountsMap = {};
          if (data && data.length > 0) {
            const uniqueLeadNos = [...new Set(data.map(item => item["LD-Lead-No"]).filter(Boolean))];

            if (uniqueLeadNos.length > 0) {
              try {
                let enquiryCountQuery = supabase
                  .from("enquiry_tracker")
                  .select('"Enquiry No."');

                enquiryCountQuery = enquiryCountQuery.in('"Enquiry No."', uniqueLeadNos);

                // Apply Date Filters to Enquiry Count Query (matching historyQuery logic)
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

                if (startDate) {
                  enquiryCountQuery = enquiryCountQuery.gte("Timestamp", startDate);
                }
                if (endDate) {
                  enquiryCountQuery = enquiryCountQuery.lte("Timestamp", endDate);
                }

                if (dateFilter === "today" && !startDate && !endDate) {
                  enquiryCountQuery = enquiryCountQuery.eq("Timestamp", todayStr);
                } else if (dateFilter === "older" && !startDate && !endDate) {
                  enquiryCountQuery = enquiryCountQuery.lt("Timestamp", todayStr);
                }

                const { data: enquiryCountData, error: enquiryCountError } = await enquiryCountQuery;

                if (!enquiryCountError && enquiryCountData) {
                  enquiryCountData.forEach(item => {
                    const leadNo = item["Enquiry No."];
                    enquiryCountsMap[leadNo] = (enquiryCountsMap[leadNo] || 0) + 1;
                  });
                }
              } catch (err) {
                console.error("Error fetching enquiry counts:", err);
              }
            }
          }

          // Fetch Follow-Ups Total Counts for History tab
          const historyFollowUpsCountMap = {};
          const historyLastStatusMap = {};
          if (data && data.length > 0) {
            const uniqueLeadNosHistory = [...new Set(data.map(item => item["LD-Lead-No"]).filter(Boolean))];

            if (uniqueLeadNosHistory.length > 0) {
              try {
                const { data: trackerCountData, error: trackerCountError } = await supabase
                  .from("leads_tracker")
                  .select('"LD-Lead-No", "Enquiry_Received_Status", "Timestamp"')
                  .in('"LD-Lead-No"', uniqueLeadNosHistory)
                  .order("Timestamp", { ascending: false });

                if (!trackerCountError && trackerCountData) {
                  trackerCountData.forEach(item => {
                    const leadNo = item["LD-Lead-No"];
                    historyFollowUpsCountMap[leadNo] = (historyFollowUpsCountMap[leadNo] || 0) + 1;
                    if (!historyLastStatusMap[leadNo]) {
                      historyLastStatusMap[leadNo] = item["Enquiry_Received_Status"] || "";
                    }
                  });
                }
              } catch (err) {
                console.error("Error fetching history total counts:", err);
              }
            }
          }

          // We need to fetch Phone_Number, Salesperson_Name, and handle_person from leads_to_order
          const leadsDataMap = {};
          if (data && data.length > 0) {
            const uniqueLeadNosHistory = [...new Set(data.map(item => item["LD-Lead-No"]).filter(Boolean))];
            if (uniqueLeadNosHistory.length > 0) {
              try {
                const { data: leadsData } = await supabase
                  .from("leads_to_order")
                  .select('"LD-Lead-No", "Salesperson_Name", "Phone_Number", "handle_person"')
                  .in('"LD-Lead-No"', uniqueLeadNosHistory);
                
                if (leadsData) {
                  leadsData.forEach(lead => {
                    leadsDataMap[lead["LD-Lead-No"]] = {
                      personName: lead["Salesperson_Name"] || "",
                      phoneNumber: lead["Phone_Number"] || "",
                      handlePerson: lead["handle_person"] || ""
                    };
                  });
                }
              } catch (err) {
                console.error("Error fetching leads_to_order data for history:", err);
              }
            }
          }

          const filteredHistory = (data || []).map((row) => ({
            id: row.id,
            timestamp: row["Timestamp"]
              ? formatDateToDDMMYYYY(row["Timestamp"])
              : "",
            leadNo: row["LD-Lead-No"] || "",
            personName: leadsDataMap[row["LD-Lead-No"]]?.personName || "",
            phoneNumber: leadsDataMap[row["LD-Lead-No"]]?.phoneNumber || "",
            handlePerson: leadsDataMap[row["LD-Lead-No"]]?.handlePerson || "",
            noOfFollowUps: historyFollowUpsCountMap[row["LD-Lead-No"]] || 0,
            lastFollowUpStatus: historyLastStatusMap[row["LD-Lead-No"]] || "",
            companyName: row["Company_Name"] || "",
            companyCount: companyCountsMap[(row["Company_Name"] || "").trim()] || 0,
            enquiryCallingCount: enquiryCountsMap[row["LD-Lead-No"]] || 0, // Map the new count
            customerSay: row["What_Did_The_Customer_say?"] || "",
            status: row["Leads_Tracking_Status"] || "",
            enquiryStatus: row["Enquiry_Received_Status"] || "",
            enquiryReceivedStatus: row["Enquiry_Received_Status"] || "",
            enquiryReceivedDate: row["Enquiry_Received_Date"]
              ? formatDateToDDMMYYYY(row["Enquiry_Received_Date"])
              : "",
            enquiryState: row["Enquiry_for_State"] || "",
            projectName: row["Project_Name"] || "",
            salesType: row["Enquiry_Type"] || "",
            requiredProductDate: "",
            projectApproxValue: row["Project_Approximate_Value"] || "",
            itemName1: row["Item_Name1"] || "",
            quantity1: row["Quantity1"] || "",
            itemName2: row["Item_Name2"] || "",
            quantity2: row["Quantity2"] || "",
            itemName3: row["Item_Name3"] || "",
            quantity3: row["Quantity3"] || "",
            itemName4: row["Item_Name4"] || "",
            quantity4: row["Quantity4"] || "",
            itemName5: row["Item_Name5"] || "",
            quantity5: row["Quantity5"] || "",
            nextAction: row["Next_Action"] || "",
            nextCallDate: row["Next_Call_Date"]
              ? formatDateToDDMMYYYY(row["Next_Call_Date"])
              : "",
            nextCallTime: row["Next_Call_Time"]
              ? formatNextCallTime(row["Next_Call_Time"])
              : "",
            historyDateFilter: "",
            assignedTo: row.SC_Name || row.assigned_user || "",
            itemQty: row.Item_Qty || "",
          }));

          if (isLoadMore) {
            setHistoryFollowUps((prev) => [...prev, ...filteredHistory]);
          } else {
            setHistoryFollowUps(filteredHistory);
          }

          // Check if there's more data based on count and current data length
          const totalCount = count || 0;
          const currentDataLength = isLoadMore
            ? historyFollowUps.length + filteredHistory.length
            : filteredHistory.length;

          const hasMore = currentDataLength < totalCount;
          setHasMoreHistory(hasMore);

        }
      } catch (error) {
        console.error("Error fetching follow-up data:", error);

        // Keep existing fallback logic...
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [currentUser, isAdmin, activeTab, dateFilter, startDate, endDate, scNameFilter, companyFilter, filterType]
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

  // Update the loadMoreData function to pass the current page correctly:
  const loadMoreData = useCallback(() => {
    if (isLoadingMore) return;

    if (activeTab === "pending" && hasMorePending) {
      fetchFollowUpData(pendingPage + 1, true, searchTerm);
      setPendingPage((prev) => prev + 1);
    } else if (activeTab === "history" && hasMoreHistory) {
      fetchFollowUpData(historyPage + 1, true, searchTerm);
      setHistoryPage((prev) => prev + 1);
    }
  }, [
    activeTab,
    isLoadingMore,
    hasMorePending,
    hasMoreHistory,
    pendingPage,
    historyPage,
    searchTerm,
    fetchFollowUpData,
  ]);

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
        // Fetch from leads_tracker (History)
        const { data: historyData, error: historyError } = await supabase
          .from("leads_tracker")
          .select('"Company_Name"');

        let companies = [];
        if (!historyError && historyData) {
          companies = historyData.map(item => item["Company_Name"]).filter(Boolean);
        }

        // Optional: Fetch from leads_to_order (Pending) if needed to be comprehensive
        const { data: pendingData, error: pendingError } = await supabase
          .from("leads_to_order")
          .select("Company_Name");

        if (!pendingError && pendingData) {
          companies = [...companies, ...pendingData.map(item => item.Company_Name).filter(Boolean)];
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

    setPendingPage(1);
    setHistoryPage(1);
    setHasMorePending(true);
    setHasMoreHistory(true);
    fetchFollowUpData(1, false, searchTerm);
  }, [activeTab, dateFilter, companyFilter, scNameFilter, filterType, currentUser, fetchFollowUpData]);

  // Fixed scroll event listener for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isBottom() && !isLoadingMore && !isLoading) {
        if (
          (activeTab === "pending" && hasMorePending) ||
          (activeTab === "history" && hasMoreHistory)
        ) {
          loadMoreData();
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    isLoadingMore,
    isLoading,
    activeTab,
    hasMorePending,
    hasMoreHistory,
    loadMoreData,
  ]);

  // Reset pagination when changing tabs
  useEffect(() => {

    setPendingPage(1);
    setHistoryPage(1);
    setHasMorePending(true);
    setHasMoreHistory(true);
    fetchFollowUpData(1, false, searchTerm);
  }, [activeTab, currentUser]);

  // Debounced search function
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {

      setPendingPage(1);
      setHistoryPage(1);
      setHasMorePending(true);
      setHasMoreHistory(true);
      fetchFollowUpData(1, false, searchTerm);
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
              <Link
                state={followUp.assignedTo}
                to={`/call-tracker/form?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}
              >
                <button className="w-full sm:w-auto px-2 sm:px-3 py-1 text-xs border border-purple-200 text-purple-600 hover:bg-purple-50 rounded-md transition-colors whitespace-nowrap">
                  Call Now <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                </button>
              </Link>
            </div>
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

  // ─── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const currentData = activeTab === "pending" ? filteredPendingFollowUps : filteredHistoryFollowUps;
  const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, companyFilter, personFilter, phoneFilter, dateFilter, filterType]);

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
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
            totalResults={currentData.length}
          />
        )}
      </div>
    </div>
  );
}

export default CallTracker;

