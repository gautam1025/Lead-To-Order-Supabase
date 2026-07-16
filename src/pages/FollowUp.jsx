"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { SearchIcon, ArrowRightIcon } from "../components/Icons";
import { AuthContext } from "../App";
import supabase from "../utils/supabase";

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

function FollowUp() {
  const isMobile = useIsMobile();
  const { currentUser, userType, isAdmin, getUsernamesToFilter } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingFollowUps, setPendingFollowUps] = useState([]);
  const [historyFollowUps, setHistoryFollowUps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [companyFilter, setCompanyFilter] = useState("all");
  const [personFilter, setPersonFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState("all");
  const [scNameFilter, setScNameFilter] = useState("all");
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
    leadNo: true,
    companyName: true,
    nextAction: true,
    personName: true,
    phoneNo: true,
    leadSource: true,
    location: true,
    customerSay: true,
    enquiryStatus: true,
    assignedTo: true,
    emailAddress: true,
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
    nob: false,
    gstNumber: false,
    customerRegForm: false,
    creditAccess: false,
    creditDays: false,
    creditLimit: false,
    additionalNotes: false,
  });
  const [showPendingColumnDropdown, setShowPendingColumnDropdown] = useState(false);

  const pendingColumnOptions = [
    { key: "actions", label: "Actions" },
    { key: "edit", label: "Edit" },
    { key: "nextCallDate", label: "Next Call Date" },
    { key: "leadNo", label: "Lead No." },
    { key: "companyName", label: "Company Name" },
    { key: "nextAction", label: "Next Action" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNo", label: "Phone No." },
    { key: "leadSource", label: "Lead Source" },
    { key: "location", label: "Location" },
    { key: "customerSay", label: "Customer Say" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "emailAddress", label: "Email Address" },
    { key: "lastFollowUpDate", label: "Last Follow Up Date" },
    { key: "noOfFollowUps", label: "No. of FollowUps" },
    { key: "lastFollowUpStatus", label: "Last FollowUp Status" },
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
    { key: "nob", label: "Nature of Business" },
    { key: "gstNumber", label: "GST Number" },
    { key: "customerRegForm", label: "Customer Registration Form" },
    { key: "creditAccess", label: "Credit Access" },
    { key: "creditDays", label: "Credit Days" },
    { key: "creditLimit", label: "Credit Limit" },
    { key: "additionalNotes", label: "Additional Notes" },
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
          "Next_Action": editedData.nextAction
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
        if (companyFilter !== "all") {
          allQuery = allQuery.eq("Company_Name", companyFilter);
          firstQuery = firstQuery.eq("Company_Name", companyFilter);
          multiQuery = multiQuery.eq("Company_Name", companyFilter);
        }
      }

      // Apply SC Name Filter
      if (isAdmin() && scNameFilter !== "all") {
        allQuery = allQuery.eq("SC_Name", scNameFilter);
        firstQuery = firstQuery.eq("SC_Name", scNameFilter);
        multiQuery = multiQuery.eq("SC_Name", scNameFilter);
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
        console.log(
          `Fetching data - Page: ${page}, LoadMore: ${isLoadMore}, ActiveTab: ${activeTab}`
        );

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
          if (isAdmin() && scNameFilter !== "all") {
            pendingQuery = pendingQuery.eq("SC_Name", scNameFilter);
          }

          // Add sorting by lead number (LD-Lead-No) in ascending order
          pendingQuery = pendingQuery.order("id", { ascending: true });

          // Apply pagination with range
          pendingQuery = pendingQuery.range(from, to);

          const { data, error, count } = await pendingQuery;

          if (error) throw error;

          console.log(
            `Fetched ${data?.length || 0} pending records for page ${page}`
          );

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

          console.log(
            `HasMorePending: ${hasMore}, Current: ${currentDataLength}, Total: ${totalCount}`
          );
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
          if (isAdmin() && scNameFilter !== "all") {
            historyQuery = historyQuery.eq("SC_Name", scNameFilter);
          }


          // Apply Company Name Filter
          if (companyFilter !== "all") {
            // Handle precise matching or trim matching if necessary
            historyQuery = historyQuery.eq("Company_Name", companyFilter);
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


                if (isAdmin() && scNameFilter !== "all") {
                  countQuery = countQuery.eq("SC_Name", scNameFilter);
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

          const filteredHistory = (data || []).map((row) => ({
            id: row.id,
            timestamp: row["Timestamp"]
              ? formatDateToDDMMYYYY(row["Timestamp"])
              : "",
            leadNo: row["LD-Lead-No"] || "",
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

          console.log(
            `HasMoreHistory: ${hasMore}, Current: ${currentDataLength}, Total: ${totalCount}`
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
      console.log(`Loading more pending data, page: ${pendingPage + 1}`);
      fetchFollowUpData(pendingPage + 1, true, searchTerm);
      setPendingPage((prev) => prev + 1);
    } else if (activeTab === "history" && hasMoreHistory) {
      console.log(`Loading more history data, page: ${historyPage + 1}`);
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
    console.log(`Tab or filter changed: ${activeTab}, ${dateFilter}, ${companyFilter}, ${scNameFilter}, ${filterType}`);
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
    console.log(`Tab changed to: ${activeTab}`);
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
      console.log(`Search term changed: ${searchTerm}`);
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
      companyFilter === "all" || followUp.companyName === companyFilter;
    const matchesPersonFilter =
      personFilter === "all" || followUp.personName === personFilter;
    const phoneToCompare = followUp.phoneNumber
      ? followUp.phoneNumber.toString().trim()
      : "";
    const matchesPhoneFilter =
      phoneFilter === "all" || phoneToCompare === phoneFilter.toString().trim();

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
      companyFilter === "all" || followUp.companyName === companyFilter;

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

  // Mobile Card View Component
  const MobileCardView = ({ data, type }) => {
    if (type === "pending") {
      return (
        <div className="space-y-4 md:hidden">
          {data.map((followUp, index) => (
            <div
              key={`${followUp.leadId}-${index}`}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-50 to-violet-50 p-4 border-b border-gray-200">
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
              <div className="p-4 space-y-3">
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
                    <p className="text-sm font-medium text-gray-900">
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
                  to={`/follow-up/new?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg shadow-md hover:from-violet-700 hover:to-blue-700 transition-all duration-200"
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
          ))}
        </div>
      );
    } else {
      // History tab mobile view
      return (
        <div className="space-y-4 md:hidden">
          {data.map((followUp, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
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
              <div className="p-4 space-y-3">
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
          ))}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 sm:py-6 lg:py-10 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:justify-between lg:items-start mb-6 lg:mb-8">
          {/* Title Section */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
              Call Tracker
            </h1>
            <p className="text-slate-600 mt-1 text-sm sm:text-base">
              Track and manage all your follow-up calls
            </p>
            {isAdmin() && (
              <p className="text-green-600 font-semibold mt-1 text-sm">
                Admin View: Showing all data
              </p>
            )}
          </div>

          {/* Filters Section */}
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:space-x-3 lg:items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-2 lg:gap-3">
              {/* Company Name Filter */}
              <div className="min-w-0">
                <input
                  list="company-options"
                  value={companyFilter === "all" ? "" : companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value || "all")}
                  placeholder="Select or type company"
                  className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
                <datalist id="company-options">
                  <option value="all">All Companies</option>
                  {allCompanyNames.map((company) => (
                    <option key={company} value={company} />
                  ))}
                </datalist>
              </div>

              {/* SC Name Filter - Only show for admin */}
              {isAdmin() && (
                <div className="min-w-0">
                  <input
                    list="sc-name-options"
                    value={scNameFilter === "all" ? "" : scNameFilter}
                    onChange={(e) => setScNameFilter(e.target.value || "all")}
                    placeholder="Select or type SC name"
                    className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <datalist id="sc-name-options">
                    <option value="all">All SC Names</option>
                    {activeTab === "pending" ? (
                      uniqueScNames.pending.map((scName) => (
                        <option key={scName} value={scName} />
                      ))
                    ) : (
                      uniqueScNames.history.map((scName) => (
                        <option key={scName} value={scName} />
                      ))
                    )}
                  </datalist>
                </div>
              )}

              {/* Person Name Filter - Only show for pending tab */}
              {activeTab === "pending" && (
                <div className="min-w-0">
                  <input
                    list="person-options"
                    value={personFilter === "all" ? "" : personFilter}
                    onChange={(e) => setPersonFilter(e.target.value || "all")}
                    placeholder="Select or type person"
                    className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <datalist id="person-options">
                    <option value="all">All Persons</option>
                    {Array.from(
                      new Set(pendingFollowUps.map((item) => item.personName))
                    )
                      .filter(Boolean)
                      .map((person) => (
                        <option key={person} value={person} />
                      ))}
                  </datalist>
                </div>
              )}

              {/* Phone Number Filter - Only show for pending tab */}
              {activeTab === "pending" && (
                <div className="min-w-0">
                  <input
                    list="phone-options"
                    value={phoneFilter === "all" ? "" : phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value || "all")}
                    placeholder="Select or type number"
                    className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                  <datalist id="phone-options">
                    <option value="all">All Numbers</option>
                    {Array.from(
                      new Set(
                        pendingFollowUps
                          .map((item) =>
                            item.phoneNumber
                              ? item.phoneNumber.toString().trim()
                              : ""
                          )
                          .filter(Boolean)
                      )
                    ).map((phone) => (
                      <option key={phone} value={phone} />
                    ))}
                  </datalist>
                </div>
              )}

              {/* Date Filter */}
              <div className="min-w-0">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="all">All</option>
                  {activeTab === "pending" ? (
                    <>
                      <option value="today">
                        Today ({dateFilterCounts.today})
                      </option>
                      <option value="overdue">
                        Overdue ({dateFilterCounts.overdue})
                      </option>
                      <option value="upcoming">
                        Upcoming ({dateFilterCounts.upcoming})
                      </option>
                    </>
                  ) : (
                    <>
                      <option value="today">
                        Today's Calls ({historyCounts.today})
                      </option>
                      <option value="older">
                        Older Calls ({historyCounts.older})
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* Date Range Filters - Only show for history tab */}
              {activeTab === "history" && (
                <>
                  <div className="min-w-0">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Start Date"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                  <div className="min-w-0">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End Date"
                      className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </>
              )}



              {/* Filter Dropdown */}
              <div className="min-w-0">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-2 sm:px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="all">All ({filterTypeCounts.all})</option>
                  <option value="first">First Followup ({filterTypeCounts.first})</option>
                  <option value="multi">Expected ({filterTypeCounts.multi})</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-auto lg:min-w-[250px]">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="search"
                placeholder="Search Call Tracker..."
                className="pl-8 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                All Call Tracker
              </h2>
              {activeTab === "history" && (startDate || endDate || dateFilter !== "all" || companyFilter !== "all") && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Showing:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-sky-100 text-sky-800">
                    {filteredCount} {filteredCount === 1 ? 'record' : 'records'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card Content */}
          <div className="p-4 sm:p-6">
            {/* Tab Navigation with Columns toggle */}
            <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-l-md transition-colors ${activeTab === "pending"
                    ? "bg-sky-100 text-sky-800 border-sky-200"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-gray-300"
                    } border`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-r-md transition-colors ${activeTab === "history"
                    ? "bg-sky-100 text-sky-800 border-sky-200"
                    : "bg-white text-slate-700 hover:bg-slate-50 border-gray-300"
                    } border border-l-0`}
                >
                  History
                </button>
              </div>

              {/* Column Toggle Button - right-aligned next to tabs */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => activeTab === "pending" ? setShowPendingColumnDropdown(!showPendingColumnDropdown) : setShowColumnDropdown(!showColumnDropdown)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:border-sky-300 transition-all duration-150 shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Columns
                  <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-sky-500 text-white rounded-full">
                    {activeTab === "pending"
                      ? Object.values(pendingVisibleColumns).filter(Boolean).length
                      : Object.values(visibleColumns).filter(Boolean).length}
                  </span>
                  <svg className={`w-3 h-3 transition-transform ${(activeTab === "pending" ? showPendingColumnDropdown : showColumnDropdown) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Pending column dropdown */}
                {activeTab === "pending" && showPendingColumnDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toggle Columns</p>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center p-2 hover:bg-sky-50 rounded-lg">
                        <input type="checkbox" id="pending-select-all"
                          checked={Object.values(pendingVisibleColumns).every(Boolean)}
                          onChange={() => { const all = Object.values(pendingVisibleColumns).every(Boolean); setPendingVisibleColumns(Object.fromEntries(Object.keys(pendingVisibleColumns).map(k => [k, !all]))); }}
                          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                        />
                        <label htmlFor="pending-select-all" className="ml-2 text-sm font-semibold text-gray-800 cursor-pointer">All Columns</label>
                      </div>
                      <hr className="my-1.5 border-gray-100" />
                      {pendingColumnOptions.map((option) => (
                        <div key={option.key} className="flex items-center p-2 hover:bg-sky-50 rounded-lg transition-colors">
                          <input type="checkbox" id={`pending-col-${option.key}`}
                            checked={pendingVisibleColumns[option.key]}
                            onChange={() => setPendingVisibleColumns(prev => ({ ...prev, [option.key]: !prev[option.key] }))}
                            className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`pending-col-${option.key}`} className="ml-2 text-sm text-gray-700 cursor-pointer flex-1">{option.label}</label>
                          {pendingVisibleColumns[option.key] && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-1"></span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* History column dropdown */}
                {activeTab === "history" && showColumnDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Toggle Columns</p>
                    </div>
                    <div className="p-2">
                      <div className="flex items-center p-2 hover:bg-sky-50 rounded-lg">
                        <input type="checkbox" id="history-select-all"
                          checked={Object.values(visibleColumns).every(Boolean)}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                        />
                        <label htmlFor="history-select-all" className="ml-2 text-sm font-semibold text-gray-800 cursor-pointer">All Columns</label>
                      </div>
                      <hr className="my-1.5 border-gray-100" />
                      {columnOptions.map((option) => (
                        <div key={option.key} className="flex items-center p-2 hover:bg-sky-50 rounded-lg transition-colors">
                          <input type="checkbox" id={`col-${option.key}`}
                            checked={visibleColumns[option.key]}
                            onChange={() => handleColumnToggle(option.key)}
                            className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`col-${option.key}`} className="ml-2 text-sm text-gray-700 cursor-pointer flex-1">{option.label}</label>
                          {visibleColumns[option.key] && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 ml-1"></span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                <p className="text-slate-500 mt-4">Loading follow-up data...</p>
              </div>
            ) : (
              <>
                {/* Content Tables/Cards */}
                {activeTab === "pending" && (
                  <>
                    {/* Mobile Card View */}
                    <MobileCardView
                      data={filteredPendingFollowUps}
                      type="pending"
                    />

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">

                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50">
                              <tr>
                                <th
                                  scope="col"
                                  className={`sticky left-0 z-10 bg-slate-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 ${!pendingVisibleColumns.actions ? 'hidden' : ''}`}
                                >
                                  Actions
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.edit ? 'hidden' : ''}`}
                                >
                                  Edit
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.nextCallDate ? 'hidden' : ''}`}
                                >
                                  Next Call Date
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.leadNo ? 'hidden' : ''}`}
                                >
                                  Lead No.
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.companyName ? 'hidden' : ''}`}
                                >
                                  Company Name
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.nextAction ? 'hidden' : ''}`}
                                >
                                  Next Action
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.personName ? 'hidden' : ''}`}
                                >
                                  Person Name
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.phoneNo ? 'hidden' : ''}`}
                                >
                                  Phone No.
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.leadSource ? 'hidden' : ''}`}
                                >
                                  Lead Source
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.location ? 'hidden' : ''}`}
                                >
                                  Location
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.customerSay ? 'hidden' : ''}`}
                                >
                                  Customer Say
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.enquiryStatus ? 'hidden' : ''}`}
                                >
                                  Enquiry Status
                                </th>
                                {isAdmin() && (
                                  <th
                                    scope="col"
                                    className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.assignedTo ? 'hidden' : ''}`}
                                  >
                                    Assigned To
                                  </th>
                                )}
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.emailAddress ? 'hidden' : ''}`}
                                >
                                  Email Address
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.lastFollowUpDate ? 'hidden' : ''}`}
                                >
                                  Last Follow Up Date
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.noOfFollowUps ? 'hidden' : ''}`}
                                >
                                  No. of FollowUps
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.lastFollowUpStatus ? 'hidden' : ''}`}
                                >
                                  Last FollowUp Status
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.state ? 'hidden' : ''}`}
                                >
                                  State
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.address ? 'hidden' : ''}`}
                                >
                                  Address
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.personName1 ? 'hidden' : ''}`}
                                >
                                  Person Name 1
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.designation1 ? 'hidden' : ''}`}
                                >
                                  Designation 1
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.phoneNumber1 ? 'hidden' : ''}`}
                                >
                                  Phone Number 1
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.personName2 ? 'hidden' : ''}`}
                                >
                                  Person Name 2
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.designation2 ? 'hidden' : ''}`}
                                >
                                  Designation 2
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.phoneNumber2 ? 'hidden' : ''}`}
                                >
                                  Phone Number 2
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.personName3 ? 'hidden' : ''}`}
                                >
                                  Person Name 3
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.designation3 ? 'hidden' : ''}`}
                                >
                                  Designation 3
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.phoneNumber3 ? 'hidden' : ''}`}
                                >
                                  Phone Number 3
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.nob ? 'hidden' : ''}`}
                                >
                                  Nature of Business
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.gstNumber ? 'hidden' : ''}`}
                                >
                                  GST Number
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.customerRegForm ? 'hidden' : ''}`}
                                >
                                  Customer Registration Form
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.creditAccess ? 'hidden' : ''}`}
                                >
                                  Credit Access
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.creditDays ? 'hidden' : ''}`}
                                >
                                  Credit Days
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.creditLimit ? 'hidden' : ''}`}
                                >
                                  Credit Limit
                                </th>
                                <th
                                  scope="col"
                                  className={`px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${!pendingVisibleColumns.additionalNotes ? 'hidden' : ''}`}
                                >
                                  Additional Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredPendingFollowUps.length > 0 ? (
                                filteredPendingFollowUps.map(
                                  (followUp, index) => (
                                    <tr
                                      key={`${followUp.leadId}-${index}`}
                                      className="hover:bg-slate-50 transition-colors"
                                    >
                                      <td className={`sticky left-0 z-10 bg-white px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-r border-gray-200 ${!pendingVisibleColumns.actions ? 'hidden' : ''}`}>
                                        <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                          <Link
                                            state={followUp.assignedTo}
                                            to={`/follow-up/new?leadId=${followUp.leadId}&leadNo=${followUp.leadId}`}
                                          >
                                            <button className="w-full sm:w-auto px-2 sm:px-3 py-1 text-xs border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md transition-colors whitespace-nowrap">
                                              Call Now{" "}
                                              <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
                                            </button>
                                          </Link>
                                        </div>
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-r border-gray-200 ${!pendingVisibleColumns.edit ? 'hidden' : ''}`}>
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
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.nextCallDate ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="date"
                                            value={convertDateToYYYYMMDD(editedData.timestamp) || ""}
                                            onChange={(e) => handleFieldChange("timestamp", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.timestamp
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium text-gray-900 whitespace-nowrap ${!pendingVisibleColumns.leadNo ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.leadId || ""}
                                            onChange={(e) => handleFieldChange("leadId", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.leadId
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 ${!pendingVisibleColumns.companyName ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.companyName || ""}
                                            onChange={(e) => handleFieldChange("companyName", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          <div
                                            className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words"
                                            title={followUp.companyName}
                                          >
                                            {followUp.companyName}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 ${!pendingVisibleColumns.nextAction ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.nextAction || ""}
                                            onChange={(e) => handleFieldChange("nextAction", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          <div
                                            className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words"
                                            title={followUp.nextAction}
                                          >
                                            {followUp.nextAction}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 ${!pendingVisibleColumns.personName ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.personName || ""}
                                            onChange={(e) => handleFieldChange("personName", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          <div
                                            className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words"
                                            title={followUp.personName}
                                          >
                                            {followUp.personName}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.phoneNo ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.phoneNumber || ""}
                                            onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.phoneNumber
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 ${!pendingVisibleColumns.leadSource ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.leadSource || ""}
                                            onChange={(e) => handleFieldChange("leadSource", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
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
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 ${!pendingVisibleColumns.location ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.location || ""}
                                            onChange={(e) => handleFieldChange("location", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          <div
                                            className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words"
                                            title={followUp.location}
                                          >
                                            {followUp.location}
                                          </div>
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 ${!pendingVisibleColumns.customerSay ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <textarea
                                            value={editedData.customerSay || ""}
                                            onChange={(e) => handleFieldChange("customerSay", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            rows="2"
                                          />
                                        ) : (
                                          <div
                                            className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words"
                                            title={followUp.customerSay}
                                          >
                                            {followUp.customerSay}
                                          </div>
                                        )}
                                      </td>

                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 ${!pendingVisibleColumns.enquiryStatus ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.enquiryStatus || ""}
                                            onChange={(e) => handleFieldChange("enquiryStatus", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          <div
                                            className="max-w-[100px] sm:max-w-[120px] truncate"
                                            title={followUp.enquiryStatus}
                                          >
                                            {followUp.enquiryStatus}
                                          </div>
                                        )}
                                      </td>
                                      {isAdmin() && (
                                        <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.assignedTo ? 'hidden' : ''}`}>
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.assignedTo || ""}
                                              onChange={(e) => handleFieldChange("assignedTo", e.target.value)}
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.assignedTo
                                          )}
                                        </td>
                                      )}
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.emailAddress ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Email_Address || ""}
                                            onChange={(e) => handleFieldChange("Email_Address", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Email_Address
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.lastFollowUpDate ? 'hidden' : ''}`}>
                                        {followUp.lastFollowUpDate || <span className="text-gray-300 text-xs">—</span>}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.noOfFollowUps ? 'hidden' : ''}`}>
                                        {followUp.noOfFollowUps > 0 ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {followUp.noOfFollowUps}
                                          </span>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.lastFollowUpStatus ? 'hidden' : ''}`}>
                                        {followUp.lastFollowUpStatus || <span className="text-gray-300 text-xs">—</span>}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.state ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.State || ""}
                                            onChange={(e) => handleFieldChange("State", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.State
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.address ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Address || ""}
                                            onChange={(e) => handleFieldChange("Address", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Address
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.personName1 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Person_name_1 || ""}
                                            onChange={(e) => handleFieldChange("Person_name_1", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Person_name_1
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.designation1 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Designation_1 || ""}
                                            onChange={(e) => handleFieldChange("Designation_1", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Designation_1
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.phoneNumber1 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Phone_Number_1 || ""}
                                            onChange={(e) => handleFieldChange("Phone_Number_1", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Phone_Number_1
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.personName2 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Person_Name_2 || ""}
                                            onChange={(e) => handleFieldChange("Person_Name_2", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Person_Name_2
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.designation2 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Designation_2 || ""}
                                            onChange={(e) => handleFieldChange("Designation_2", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Designation_2
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.phoneNumber2 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Phone_Number_2 || ""}
                                            onChange={(e) => handleFieldChange("Phone_Number_2", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Phone_Number_2
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.personName3 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Person_Name_3 || ""}
                                            onChange={(e) => handleFieldChange("Person_Name_3", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Person_Name_3
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.designation3 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Designation_3 || ""}
                                            onChange={(e) => handleFieldChange("Designation_3", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Designation_3
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.phoneNumber3 ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Phone_Number_3 || ""}
                                            onChange={(e) => handleFieldChange("Phone_Number_3", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Phone_Number_3
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.nob ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.NOB || ""}
                                            onChange={(e) => handleFieldChange("NOB", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.NOB
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.gstNumber ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.GST_Number || ""}
                                            onChange={(e) => handleFieldChange("GST_Number", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.GST_Number
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.customerRegForm ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Customer_Registration_Form || ""}
                                            onChange={(e) => handleFieldChange("Customer_Registration_Form", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Customer_Registration_Form
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.creditAccess ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Credit_Access || ""}
                                            onChange={(e) => handleFieldChange("Credit_Access", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Credit_Access
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.creditDays ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Credit_Days || ""}
                                            onChange={(e) => handleFieldChange("Credit_Days", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Credit_Days
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.creditLimit ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <input
                                            type="text"
                                            value={editedData.Credit_Limit || ""}
                                            onChange={(e) => handleFieldChange("Credit_Limit", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                          />
                                        ) : (
                                          followUp.Credit_Limit
                                        )}
                                      </td>
                                      <td className={`px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap ${!pendingVisibleColumns.additionalNotes ? 'hidden' : ''}`}>
                                        {editingRowId === index ? (
                                          <textarea
                                            value={editedData.Additional_Notes || ""}
                                            onChange={(e) => handleFieldChange("Additional_Notes", e.target.value)}
                                            className="w-full px-2 py-1 border rounded"
                                            rows="2"
                                          />
                                        ) : (
                                          followUp.Additional_Notes
                                        )}
                                      </td>
                                    </tr>
                                  )
                                )
                              ) : (
                                <tr>
                                  <td
                                    colSpan={isAdmin() ? 31 : 30}
                                    className="px-4 py-8 text-center text-sm text-slate-500"
                                  >
                                    <div className="flex flex-col items-center space-y-2">
                                      <svg
                                        className="h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      <p>No pending follow-ups found</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* History Tab Content */}
                {activeTab === "history" && (
                  <>
                    {/* Mobile Card View */}
                    <MobileCardView
                      data={filteredHistoryFollowUps}
                      type="history"
                    />

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto -mx-4 sm:mx-0">

                      <div className="inline-block min-w-full align-middle">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-slate-50 sticky top-0">
                              <tr>
                                {visibleColumns.actions && (
                                  <th className="sticky left-0 z-10 bg-slate-50 px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 whitespace-nowrap">
                                    Actions
                                  </th>
                                )}
                                {visibleColumns.edit && (
                                  <th
                                    scope="col"
                                    className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                  >
                                    Edit
                                  </th>
                                )}
                                {visibleColumns.timestamp && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Timestamp
                                  </th>
                                )}
                                {visibleColumns.callingCount && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Calling Count
                                  </th>
                                )}
                                {visibleColumns.enquiryCallingCount && (
                                  <th
                                    scope="col"
                                    className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                  >
                                    Enquiry Calling Count
                                  </th>
                                )}
                                {visibleColumns.noOfFollowUps && (
                                  <th
                                    scope="col"
                                    className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                  >
                                    No. of FollowUps
                                  </th>
                                )}
                                {visibleColumns.lastFollowUpStatus && (
                                  <th
                                    scope="col"
                                    className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                                  >
                                    Last FollowUp Status
                                  </th>
                                )}
                                {visibleColumns.leadNo && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Lead No.
                                  </th>
                                )}
                                {visibleColumns.companyName && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Company Name
                                  </th>
                                )}
                                {visibleColumns.customerSay && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Customer Say
                                  </th>
                                )}
                                {visibleColumns.status && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Status
                                  </th>
                                )}
                                {visibleColumns.enquiryStatus && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Enquiry Status
                                  </th>
                                )}
                                {visibleColumns.receivedDate && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Received Date
                                  </th>
                                )}
                                {visibleColumns.state && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    State
                                  </th>
                                )}
                                {visibleColumns.projectName && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Project Name
                                  </th>
                                )}
                                {visibleColumns.salesType && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Sales Type
                                  </th>
                                )}
                                {visibleColumns.productDate && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Product Date
                                  </th>
                                )}
                                {visibleColumns.projectValue && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Project Value
                                  </th>
                                )}
                                {visibleColumns.item1 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Item 1
                                  </th>
                                )}
                                {visibleColumns.qty1 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Qty 1
                                  </th>
                                )}
                                {visibleColumns.item2 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Item 2
                                  </th>
                                )}
                                {visibleColumns.qty2 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Qty 2
                                  </th>
                                )}
                                {visibleColumns.item3 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Item 3
                                  </th>
                                )}
                                {visibleColumns.qty3 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Qty 3
                                  </th>
                                )}
                                {visibleColumns.item4 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Item 4
                                  </th>
                                )}
                                {visibleColumns.qty4 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Qty 4
                                  </th>
                                )}
                                {visibleColumns.item5 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Item 5
                                  </th>
                                )}
                                {visibleColumns.qty5 && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Qty 5
                                  </th>
                                )}
                                {visibleColumns.nextAction && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Next Action
                                  </th>
                                )}
                                {visibleColumns.callDate && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Call Date
                                  </th>
                                )}
                                {visibleColumns.callTime && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Call Time
                                  </th>
                                )}
                                {visibleColumns.itemQty && (
                                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    Item/Qty
                                  </th>
                                )}
                              </tr>
                            </thead>


                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredHistoryFollowUps.length > 0 ? (
                                filteredHistoryFollowUps.map(
                                  (followUp, index) => (
                                    <tr
                                      key={index}
                                      className="hover:bg-slate-50 transition-colors"
                                    >
                                      {visibleColumns.actions && (
                                        <td className="sticky left-0 z-10 bg-white px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-r border-gray-200">
                                          {/* Action column content removed as per user request */}
                                        </td>
                                      )}
                                      {visibleColumns.edit && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium border-r border-gray-200">
                                          {editingRowId === index ? (
                                            <div className="flex space-x-2">
                                              <button
                                                onClick={() =>
                                                  handleSaveClick(index)
                                                }
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
                                              onClick={() =>
                                                handleEditClick(followUp, index)
                                              }
                                              className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                              Edit
                                            </button>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.timestamp && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {followUp.timestamp}
                                        </td>
                                      )}
                                      {visibleColumns.callingCount && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {followUp.companyCount > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                              {followUp.companyCount}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.enquiryCallingCount && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {followUp.enquiryCallingCount > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                              {followUp.enquiryCallingCount}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.noOfFollowUps && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {followUp.noOfFollowUps > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                              {followUp.noOfFollowUps}
                                            </span>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.lastFollowUpStatus && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {followUp.lastFollowUpStatus || <span className="text-gray-300 text-xs">—</span>}
                                        </td>
                                      )}

                                      {visibleColumns.leadNo && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                          {followUp.leadNo}
                                        </td>
                                      )}

                                      {visibleColumns.companyName && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          <div
                                            className="max-w-[120px] sm:max-w-[150px] truncate"
                                            title={followUp.companyName}
                                          >
                                            {followUp.companyName}
                                          </div>
                                        </td>
                                      )}

                                      {visibleColumns.customerSay && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <textarea
                                              value={
                                                editedData.customerSay || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "customerSay",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                              rows="2"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[150px] sm:max-w-[200px] whitespace-normal break-words"
                                              title={followUp.customerSay}
                                            >
                                              {followUp.customerSay}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.status && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                                          {editingRowId === index ? (
                                            <select
                                              value={editedData.status || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "status",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            >
                                              <option value="Completed">
                                                Completed
                                              </option>
                                              <option value="Pending">
                                                Pending
                                              </option>
                                              <option value="Failed">
                                                Failed
                                              </option>
                                            </select>
                                          ) : (
                                            <span
                                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${followUp.status === "Completed"
                                                ? "bg-green-100 text-green-800"
                                                : followUp.status ===
                                                  "Pending"
                                                  ? "bg-sky-100 text-sky-800"
                                                  : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                              {followUp.status}
                                            </span>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.enquiryStatus && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.enquiryStatus || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "enquiryStatus",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.enquiryStatus}
                                            >
                                              {followUp.enquiryStatus}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.receivedDate && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.enquiryReceivedDate ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "enquiryReceivedDate",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                              placeholder="DD/MM/YYYY"
                                            />
                                          ) : (
                                            followUp.enquiryReceivedDate
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.state && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.enquiryState || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "enquiryState",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[80px] sm:max-w-[100px] truncate"
                                              title={followUp.enquiryState}
                                            >
                                              {followUp.enquiryState}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.projectName && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.projectName || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "projectName",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.projectName}
                                            >
                                              {followUp.projectName}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.salesType && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.salesType || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "salesType",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.salesType
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.productDate && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.requiredProductDate ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "requiredProductDate",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.requiredProductDate
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.projectValue && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.projectApproxValue ||
                                                ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "projectApproxValue",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.projectApproxValue
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.item1 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.itemName1 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "itemName1",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.itemName1}
                                            >
                                              {followUp.itemName1}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.qty1 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.quantity1 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "quantity1",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.quantity1
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.item2 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.itemName2 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "itemName2",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.itemName2}
                                            >
                                              {followUp.itemName2}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.qty2 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.quantity2 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "quantity2",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.quantity2
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.item3 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.itemName3 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "itemName3",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.itemName3}
                                            >
                                              {followUp.itemName3}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.qty3 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.quantity3 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "quantity3",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.quantity3
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.item4 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.itemName4 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "itemName4",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.itemName4}
                                            >
                                              {followUp.itemName4}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.qty4 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.quantity4 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "quantity4",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.quantity4
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.item5 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.itemName5 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "itemName5",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.itemName5}
                                            >
                                              {followUp.itemName5}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.qty5 && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={editedData.quantity5 || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "quantity5",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            followUp.quantity5
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.nextAction && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.nextAction || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "nextAction",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                            />
                                          ) : (
                                            <div
                                              className="max-w-[100px] sm:max-w-[120px] truncate"
                                              title={followUp.nextAction}
                                            >
                                              {followUp.nextAction}
                                            </div>
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.callDate && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.nextCallDate || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "nextCallDate",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                              placeholder="DD/MM/YYYY"
                                            />
                                          ) : (
                                            followUp.nextCallDate
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.callTime && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500 whitespace-nowrap">
                                          {editingRowId === index ? (
                                            <input
                                              type="text"
                                              value={
                                                editedData.nextCallTime || ""
                                              }
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "nextCallTime",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                              placeholder="HH:MM AM/PM"
                                            />
                                          ) : (
                                            followUp.nextCallTime
                                          )}
                                        </td>
                                      )}

                                      {visibleColumns.itemQty && (
                                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm text-gray-500">
                                          {editingRowId === index ? (
                                            <textarea
                                              value={editedData.itemQty || ""}
                                              onChange={(e) =>
                                                handleFieldChange(
                                                  "itemQty",
                                                  e.target.value
                                                )
                                              }
                                              className="w-full px-2 py-1 border rounded"
                                              rows="2"
                                            />
                                          ) : (
                                            <div
                                              className="min-w-[300px] break-words whitespace-normal"
                                              title={formatItemQty(
                                                followUp.itemQty
                                              )}
                                            >
                                              {formatItemQty(followUp.itemQty)}
                                            </div>
                                          )}
                                        </td>
                                      )}
                                    </tr>
                                  )
                                )
                              ) : (
                                <tr>
                                  <td
                                    colSpan={
                                      Object.values(visibleColumns).filter(
                                        Boolean
                                      ).length + 1
                                    }
                                    className="px-4 py-8 text-center text-sm text-slate-500"
                                  >
                                    <div className="flex flex-col items-center space-y-2">
                                      <svg
                                        className="h-12 w-12 text-gray-300"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      <p>No history found</p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Loading indicator */}
                {isLoadingMore && (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">
                      Loading more data...
                    </span>
                  </div>
                )}

                {/* End of data message */}
                {!isLoading &&
                  ((activeTab === "pending" &&
                    !hasMorePending &&
                    pendingFollowUps.length > 0) ||
                    (activeTab === "history" &&
                      !hasMoreHistory &&
                      historyFollowUps.length > 0)) && (
                    <div className="text-center py-4 text-gray-500">
                      You've reached the end of the data
                    </div>
                  )}

                {/* No results message */}
                {!isLoading &&
                  ((activeTab === "pending" && pendingFollowUps.length === 0) ||
                    (activeTab === "history" &&
                      historyFollowUps.length === 0)) && (
                    <div className="text-center py-8 text-gray-500">
                      No results found
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FollowUp;
