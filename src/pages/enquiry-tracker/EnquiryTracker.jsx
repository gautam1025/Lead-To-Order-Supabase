"use client";

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  SearchIcon,
  ArrowRightIcon,
  BuildingIcon,
} from "../../components/Icons";
import { AuthContext } from "../../App";
import DirectEnquiryForm from "./DirectEnquiryForm";
import supabase from "../../utils/supabase";
import DataTable from "../../components/DataTable";
import EnquiryTrackerFilter from "../../components/enquiry-tracker/EnquiryTrackerFilter";

// Animation classes
const slideIn = "animate-in slide-in-from-right duration-300";
const slideOut = "animate-out slide-out-to-right duration-300";
const fadeIn = "animate-in fade-in duration-300";
const fadeOut = "animate-out fade-out duration-300";

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkIsMobile();

    // Add event listener
    window.addEventListener("resize", checkIsMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  return isMobile;
};

const columnsConfig = [
  { key: "timestamp", label: "Timestamp" },
  { key: "leadId", label: "Lead No." },
  { key: "leadSource", label: "Enquiry Source" },
  { key: "companyName", label: "Company Name" },
  { key: "phoneNumber", label: "Phone Number" },
  { key: "salespersonName", label: "Person Name" },
  { key: "nextCallDate", label: "Next Follow Update" },
  { key: "currentStage", label: "Current Stage" },
  { key: "callingDate", label: "Calling Date" },
  { key: "itemQty", label: "Item/Qty" },
  { key: "totalQty", label: "Total Qty" },
  { key: "shippingAddress", label: "Shipping Address" },
  { key: "enquiryReceiverName", label: "Enquiry Receiver Name" },
  { key: "enquiryAssignToProject", label: "Enquiry Assign to Person" },
  { key: "gstNumber", label: "GST Number" },
  { key: "enquiryDate", label: "Enquiry Date" },
  { key: "enquiryState", label: "Enquiry for State" },
  { key: "projectName", label: "Project Name" },
  { key: "salesType", label: "Sales Type" },
  { key: "enquiryApproach", label: "Enquiry Approach" },
  { key: "itemName1", label: "Item Name 1" },
  { key: "itemQty1", label: "Quantity 1" },
  { key: "itemName2", label: "Item Name 2" },
  { key: "itemQty2", label: "Quantity 2" },
  { key: "itemName3", label: "Item Name 3" },
  { key: "itemQty3", label: "Quantity 3" },
  { key: "itemName4", label: "Item Name 4" },
  { key: "itemQty4", label: "Quantity 4" },
  { key: "itemName5", label: "Item Name 5" },
  { key: "itemQty5", label: "Quantity 5" },
  { key: "enquiryStatus", label: "Enquiry Status" },
  { key: "customerFeedback", label: "Customer Feedback" },
  { key: "sendQuotationNo", label: "Send Quotation No." },
  { key: "quotationSharedBy", label: "Quotation Shared By" },
  { key: "quotationNumber", label: "Quotation Number" },
  { key: "valueWithoutTax", label: "Quotation Value Without Tax" },
  { key: "valueWithTax", label: "Quotation Value With Tax" },
  { key: "quotationUpload", label: "Quotation Copy" },
  { key: "quotationRemarks", label: "Quotation Remarks" },
  { key: "validatorName", label: "Quotation Validator Name" },
  { key: "sendStatus", label: "Quotation Send Status" },
  { key: "validationRemark", label: "Quotation Validation Remark" },
  { key: "faqVideo", label: "Send FAQ Video" },
  { key: "productVideo", label: "Send Product Video" },
  { key: "offerVideo", label: "Send Offer Video" },
  { key: "productCatalog", label: "Send Product Catalog" },
  { key: "productImage", label: "Send Product Image" },
  { key: "nextCallTime", label: "Next Follow Uptime" },
  { key: "orderStatus", label: "Order Received Status" },
  { key: "reasonStatus", label: "If No Reason Status" },
  { key: "reasonRemark", label: "If No Reason Remark" },
  { key: "holdReason", label: "Customer Order Hold Reason Category" },
  { key: "holdingDate", label: "Holding Date" },
  { key: "holdRemark", label: "Hold Remark" },
  { key: "transportMode", label: "Transport Mode" },
  { key: "conveyedForRegistration", label: "Conveyed For Registration Form" },
  { key: "orderNo", label: "Order No" },
  { key: "destination", label: "Destination" },
  { key: "poNumber", label: "PO Number" },
  { key: "acceptanceVia", label: "Acceptance Via" },
  { key: "acceptanceFile", label: "Acceptance File" },
];

const defaultVisibility = {
  timestamp: true,
  leadId: true,
  leadSource: true,
  companyName: true,
  phoneNumber: true,
  salespersonName: true,
  customerFeedback: true,
  nextCallDate: true,
  nextCallTime: true,
  currentStage: true,
  callingDate: false,
  itemQty: false,
  totalQty: false,
  shippingAddress: false,
  enquiryReceiverName: false,
  enquiryAssignToProject: false,
  gstNumber: false,
  enquiryDate: false,
  enquiryState: false,
  projectName: false,
  salesType: false,
  enquiryApproach: false,
  itemName1: false,
  itemQty1: false,
  itemName2: false,
  itemQty2: false,
  itemName3: false,
  itemQty3: false,
  itemName4: false,
  itemQty4: false,
  itemName5: false,
  itemQty5: false,
  enquiryStatus: false,
  sendQuotationNo: false,
  quotationSharedBy: false,
  quotationNumber: false,
  valueWithoutTax: false,
  valueWithTax: false,
  quotationUpload: false,
  quotationRemarks: false,
  validatorName: false,
  sendStatus: false,
  validationRemark: false,
  faqVideo: false,
  productVideo: false,
  offerVideo: false,
  productCatalog: false,
  productImage: false,
  orderStatus: false,
  reasonStatus: false,
  reasonRemark: false,
  holdReason: false,
  holdingDate: false,
  holdRemark: false,
  transportMode: false,
  conveyedForRegistration: false,
  orderNo: false,
  destination: false,
  poNumber: false,
  acceptanceVia: false,
  acceptanceFile: false,
};

const historyColumnsConfig = [
  { key: "timestamp", label: "Timestamp" },
  { key: "leadId", label: "Lead No." },
  { key: "companyName", label: "Company Name" },
  { key: "currentStage", label: "Current Stage" },
  { key: "callingDate", label: "Calling Date" },
  { key: "quotationNumber", label: "Quotation Number" },
  { key: "valueWithTax", label: "Quotation Value With Tax" },
  { key: "valueWithoutTax", label: "Quotation Value Without Tax" },
  { key: "quotationUpload", label: "Quotation Copy" },
  { key: "acceptanceVia", label: "Acceptance Via" },
  { key: "acceptanceFile", label: "Acceptance File" },
  ...columnsConfig.filter(opt => ![
    "timestamp", "leadId", "companyName", "currentStage", "callingDate", 
    "quotationNumber", "valueWithTax", "valueWithoutTax", "quotationUpload",
    "acceptanceVia", "acceptanceFile"
  ].includes(opt.key))
];

const historyDefaultVisibility = {
  ...Object.keys(defaultVisibility).reduce((acc, key) => { acc[key] = false; return acc; }, {}),
  timestamp: true,
  leadId: true,
  companyName: true,
  currentStage: true,
  callingDate: true,
  quotationNumber: true,
  valueWithTax: true,
  valueWithoutTax: true,
  quotationUpload: true,
  acceptanceVia: true,
  acceptanceFile: true,
};

function EnquiryTracker() {
  const authContext = useContext(AuthContext) || {};
  const {
    currentUser = null,
    userType = null,
    isAdmin = () => false,
    getUsernamesToFilter = () => []
  } = authContext;
  const [searchTerm, setSearchTerm] = useState("");
  const [tenDaysSearchTerm, setTenDaysSearchTerm] = useState("");
  const [activeTab, setActiveTabState] = useState(() => {
    return localStorage.getItem("enquiryTrackerActiveTab") || "pending";
  });
  const setActiveTab = (tabOrFn) => {
    setActiveTabState((prev) => {
      const nextTab = typeof tabOrFn === "function" ? tabOrFn(prev) : tabOrFn;
      if (typeof nextTab === "string") {
        localStorage.setItem("enquiryTrackerActiveTab", nextTab);
      }
      return nextTab;
    });
  };
  const [pendingCallTrackers, setPendingCallTrackers] = useState([]);
  const [historyCallTrackers, setHistoryCallTrackers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingData, setPendingData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [directEnquiryData, setDirectEnquiryData] = useState([]);
  const [showNewCallTrackerForm, setShowNewCallTrackerForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState(null);
  const [callingDaysFilter, setCallingDaysFilter] = useState([]);
  const [enquiryNoFilter, setEnquiryNoFilter] = useState([]);
  const [currentStageFilter, setCurrentStageFilter] = useState([]);
  const [scNameFilter, setScNameFilter] = useState("all");
  const [availableEnquiryNos, setAvailableEnquiryNos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uniqueScNames, setUniqueScNames] = useState({
    pending: [],
    directEnquiry: [],
    history: []
  });

  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [directEnquiryPage, setDirectEnquiryPage] = useState(1);
  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [hasMoreDirectEnquiry, setHasMoreDirectEnquiry] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const [orderStatuses, setOrderStatuses] = useState({});
  const [orderRemarks, setOrderRemarks] = useState({});

  const [orderDates, setOrderDates] = useState({});
  // NEW: Add serial number filter state
  const [serialFilter, setSerialFilter] = useState([]);
  const [showSerialDropdown, setShowSerialDropdown] = useState(false);
  const [tenDaysData, setTenDaysData] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown visibility states
  const [showCallingDaysDropdown, setShowCallingDaysDropdown] = useState(false);
  const [showEnquiryNoDropdown, setShowEnquiryNoDropdown] = useState(false);
  const [showCurrentStageDropdown, setShowCurrentStageDropdown] =
    useState(false);

  const [editingRowId, setEditingRowId] = useState(null);
  const [editedData, setEditedData] = useState({});

  const [callingDaysCounts, setCallingDaysCounts] = useState({
    pendingToday: 0,
    pendingOverdue: 0,
    pendingUpcoming: 0,
    directToday: 0,
    directOverdue: 0,
    directUpcoming: 0,
    historyToday: 0,
    historyOlder: 0,
  });

  const [visibleColumns, setVisibleColumns] = useState(historyDefaultVisibility);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Pending tab column visibility state
  const [visiblePendingColumns, setVisiblePendingColumns] = useState(defaultVisibility);
  const [showPendingColumnDropdown, setShowPendingColumnDropdown] = useState(false);

  // Direct Enquiry tab column visibility state
  const [visibleDirectEnquiryColumns, setVisibleDirectEnquiryColumns] = useState(defaultVisibility);
  const [showDirectEnquiryColumnDropdown, setShowDirectEnquiryColumnDropdown] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new-enquiry") {
      setShowNewCallTrackerForm(true);
    }
  }, []);

  // Refs for observer
  const observer = useRef();
  const lastElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMoreData();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, activeTab]
  );

  // 3. Fix the loadMoreData function to properly check conditions
  const loadMoreData = useCallback(() => {
    if (isLoading || isSearching) {
      return;
    }

    switch (activeTab) {
      case "pending":
        if (hasMorePending) {
          setPendingPage((prev) => prev + 1);
        }
        break;
      case "history":
        if (hasMoreHistory) {
          setHistoryPage((prev) => prev + 1);
        }
        break;
      case "directEnquiry":
        if (hasMoreDirectEnquiry) {
          setDirectEnquiryPage((prev) => prev + 1);
        }
        break;
    }
  }, [
    isLoading,
    isSearching,
    activeTab,
    hasMorePending,
    hasMoreHistory,
    hasMoreDirectEnquiry,
    pendingPage,
    historyPage,
    directEnquiryPage,
  ]);

  const handleEditClick = (tracker, index) => {
    setEditingRowId(index);
    setEditedData({
      ...tracker,
      id: tracker.id,
    });
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

  // Function to fetch all existing order numbers
  const fetchExistingOrderNumbers = async () => {
    try {
      const [trackerEnqRes, trackerLeadsRes] = await Promise.all([
        supabase
          .from("enquiry_tracker")
          .select('order_no')
          .not('order_no', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from("enquiry_tracker_for_leads")
          .select('order_no')
          .not('order_no', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1000)
      ]);

      const allNumbers = [
        ...(trackerEnqRes.data || []).map(item => item.order_no),
        ...(trackerLeadsRes.data || []).map(item => item.order_no)
      ];

      return allNumbers.filter(no => no && typeof no === 'string' && no.trim() !== "");
    } catch (error) {
      console.error("Exception fetching order numbers:", error);
      return [];
    }
  };

  // Function to generate the next order number
  const generateNextOrderNumber = async () => {
    try {
      const existingOrderNumbers = await fetchExistingOrderNumbers();
      const orderNumbers = existingOrderNumbers
        .map(orderNo => {
          const match = orderNo.match(/DO-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num) && num > 0);

      const maxOrderNumber = orderNumbers.length > 0 ? Math.max(...orderNumbers) : 0;
      const nextNumber = maxOrderNumber + 1;
      const paddedNumber = String(nextNumber).padStart(3, "0");
      return `DO-${paddedNumber}`;
    } catch (error) {
      console.error("Error generating order number:", error);
      const timestamp = Date.now().toString().slice(-4);
      return `DO-${timestamp}`;
    }
  };

const handleSaveClick = async (index) => {
  try {
    // Handle Pending tab - update leads_to_order table
    if (activeTab === "pending") {
      // Validate that we have a valid ID
      if (!editedData.id && !editedData.dbId) {
        alert("Error: No valid ID found for this record. Please refresh the page and try again.");
        console.error("Missing ID in editedData:", editedData);
        return;
      }

      const updateId = editedData.id || editedData.dbId;
      console.log("Updating record with ID:", updateId);

      const isEnquiryRecord = editedData.tableSource === "enquiry_to_order" || (editedData.leadNo && editedData.leadNo.toUpperCase().startsWith("EN-"));

      if (isEnquiryRecord) {
        // Parse items if available
        const items = editedData.quotationItems || [];
        const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
        
        const itemUpdates = {};
        if (items.length > 0) {
          for (let i = 0; i < 10; i++) {
            const itemNum = i + 1;
            if (i < items.length) {
              itemUpdates[`item_name${itemNum}`] = items[i].name || "";
              itemUpdates[`quantity${itemNum}`] = Number(items[i].qty) || null;
            } else {
              itemUpdates[`item_name${itemNum}`] = null;
              itemUpdates[`quantity${itemNum}`] = null;
            }
          }
        }
        
        let itemQtyJson = null;
        if (items.length > 10) {
          itemQtyJson = JSON.stringify(items.slice(10).map(item => ({
            name: item.name,
            quantity: item.qty
          })));
        }

        const directEnquiryUpdateData = {
          enquiry_no: editedData.lead_no || editedData.leadNo,
          lead_source: editedData.Lead_Source || editedData.leadSource,
          company_name: editedData.Company_Name || editedData.companyName,
          phone_number: editedData.Phone_Number || editedData.phoneNo,
          sales_person_name: editedData.salesperson_Name || editedData.salespersonName,
          enquiry_receiver_name: editedData.Lead_Receiver_Name || editedData.leadReceiverName,
          sales_coordinator_name: editedData.sc_name || editedData.assignedTo,
          customer_feedback: editedData.What_Did_The_Customer_Say || editedData.customerSay,
          current_stage: editedData.Current_Stage || editedData.currentStage,
          calling_days: editedData.Calling_Days || editedData.callingDate,
          enquiry_for_state: editedData.Enquiry_for_State || editedData.enquiryForState,
          project_name: editedData.Project_Name || editedData.projectName,
          sales_type: editedData.Enquiry_Type || editedData.enquiryType,
          enquiry_approach: editedData.Enquiry_Approach || editedData.enquiryApproach,
          next_call_date: convertDateToYYYYMMDD(editedData.Next_Call_Date_Field || editedData.nextCallDate),
          next_call_time: convertTimeTo24Hour(editedData.Next_Call_Time || editedData.nextCallTime),
        };

        if (editedData.orderStatus?.toLowerCase() === "yes") {
          Object.assign(directEnquiryUpdateData, {
            actual1: new Date().toISOString(),
            is_order_received_status: editedData.orderStatus,
            order_no: editedData.Order_No || editedData.order_no || await generateNextOrderNumber(),
            acceptance_via: editedData.acceptanceVia,
            payment_mode: editedData.paymentMode,
            destination: editedData.destination,
            po_number: editedData.poNumber,
            payment_terms_days: editedData.paymentTerms,
            transport_mode: editedData.transportMode,
            conveyed_for_registration_form: editedData.conveyedForRegistration === "yes",
            offer: editedData.orderVideo,
            acceptance_file_upload: editedData.acceptanceFile,
            remark: editedData.orderRemark,
            ...itemUpdates,
            ...(items.length > 0 ? {
              total_qty: String(totalQty),
              item_qty: itemQtyJson,
            } : {})
          });
        }

        Object.keys(directEnquiryUpdateData).forEach((key) => {
          if (directEnquiryUpdateData[key] === undefined || directEnquiryUpdateData[key] === null) {
            delete directEnquiryUpdateData[key];
          }
        });

        const { data: updatedData, error } = await supabase
          .from("enquiries")
          .update(directEnquiryUpdateData)
          .eq("id", updateId)
          .select();

        if (error) {
          console.error("Pending direct enquiry update error:", error);
          alert(`Error updating record: ${error.message}`);
          throw error;
        }

        alert("Updated successfully!");
        fetchPendingData(pendingPage, searchTerm, false, getDateFiltersFromCallingDays());
        setEditingRowId(null);
        setEditedData({});
        return;
      }

      // Parse items if available for leads
      const leadItems = editedData.quotationItems || [];
      const leadTotalQty = leadItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
      
      const leadItemUpdates = {};
      if (leadItems.length > 0) {
        for (let i = 0; i < 5; i++) {
          const itemNum = i + 1;
          if (i < leadItems.length) {
            leadItemUpdates[`Item_Name${itemNum}`] = leadItems[i].name || "";
            leadItemUpdates[`Quantity${itemNum}`] = String(leadItems[i].qty || 0);
          } else {
            leadItemUpdates[`Item_Name${itemNum}`] = null;
            leadItemUpdates[`Quantity${itemNum}`] = null;
          }
        }
      }
      
      let leadItemQtyJson = null;
      if (leadItems.length > 5) {
        leadItemQtyJson = JSON.stringify(leadItems.slice(5).map(item => ({
          name: item.name,
          quantity: item.qty
        })));
      }

      const pendingUpdateData = {
        lead_no: editedData.lead_no || editedData.leadNo,
        lead_receiver_name: editedData.Lead_Receiver_Name || editedData.leadReceiverName,
        lead_source: editedData.Lead_Source || editedData.leadSource,
        phone_number: editedData.Phone_Number || editedData.phoneNo,
        salesperson_name: editedData.salesperson_Name || editedData.salespersonName || editedData.sc_name,
        company_name: editedData.Company_Name || editedData.companyName,
        state: editedData.Enquiry_for_State || editedData.enquiryForState,
        sales_type: editedData.Enquiry_Type || editedData.enquiryType
      };

      // Remove undefined/null values
      Object.keys(pendingUpdateData).forEach((key) => {
        if (pendingUpdateData[key] === undefined || pendingUpdateData[key] === null) {
          delete pendingUpdateData[key];
        }
      });

      console.log("Pending Update Data:", pendingUpdateData);
      console.log("Updating record with ID:", updateId);

      const { data: updatedData, error } = await supabase
        .from("leads")
        .update(pendingUpdateData)
        .eq("id", updateId)
        .select();

      if (error) {
        console.error("Pending update error:", error);
        alert(`Error updating record: ${error.message}`);
        throw error;
      }

      console.log("Successfully updated record:", updatedData);
      alert("Updated successfully!");
      fetchPendingData(pendingPage, searchTerm, false, getDateFiltersFromCallingDays());
      setEditingRowId(null);
      setEditedData({});
      return;
    }

    // Handle Direct Enquiry tab - update enquiry_to_order table
    if (activeTab === "directEnquiry") {
      // Validate that we have a valid ID
      if (!editedData.id && !editedData.dbId) {
        alert("Error: No valid ID found for this record. Please refresh the page and try again.");
        console.error("Missing ID in editedData:", editedData);
        return;
      }

      const updateId = editedData.id || editedData.dbId;
      console.log("Updating Direct Enquiry record with ID:", updateId);

      // Helper function to parse integer or return null
      const parseIntOrNull = (value) => {
        if (value === null || value === undefined || value === "") return null;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? null : parsed;
      };

      const directEnquiryUpdateData = {
        enquiry_no: editedData.enquiry_no,
        lead_source: editedData.lead_source,
        company_name: editedData.company_name,
        phone_number: editedData.phone_number,
        sales_person_name: editedData.salesperson_name,
        location: editedData.location,
        email: editedData.email,
        shipping_address: editedData.shipping_address,
        enquiry_receiver_name: editedData.enquiry_receiver_name,
        enquiry_assign_to_project: editedData.enquiry_assign_to_project,
        gst_number: editedData.gst_number,
        enquiry_date: editedData.enquiry_date,
        enquiry_for_state: editedData.enquiry_for_state,
        project_name: editedData.project_name,
        sales_type: editedData.sales_type,
        enquiry_approach: editedData.enquiry_approach,
        item_name1: editedData.item_name1,
        quantity1: parseIntOrNull(editedData.quantity1),
        item_name2: editedData.item_name2,
        quantity2: parseIntOrNull(editedData.quantity2),
        item_name3: editedData.item_name3,
        quantity3: parseIntOrNull(editedData.quantity3),
        item_name4: editedData.item_name4,
        quantity4: parseIntOrNull(editedData.quantity4),
        item_name5: editedData.item_name5,
        quantity5: parseIntOrNull(editedData.quantity5),
        item_name6: editedData.item_name6,
        quantity6: parseIntOrNull(editedData.quantity6),
        item_name7: editedData.item_name7,
        quantity7: parseIntOrNull(editedData.quantity7),
        item_name8: editedData.item_name8,
        quantity8: parseIntOrNull(editedData.quantity8),
        item_name9: editedData.item_name9,
        quantity9: parseIntOrNull(editedData.quantity9),
        item_name10: editedData.item_name10,
        quantity10: parseIntOrNull(editedData.quantity10),
        enquiry_status: editedData.enquiry_status,
        customer_feedback: editedData.customer_feedback,
        current_stage: editedData.current_stage,
        next_call_date: convertDateToYYYYMMDD(editedData.next_call_date),
        next_call_time: convertTimeTo24Hour(editedData.next_call_time),
        sales_coordinator_name: editedData.sc_name,
        calling_days: editedData.calling_days,
      };

      // Remove undefined/null values
      Object.keys(directEnquiryUpdateData).forEach((key) => {
        if (directEnquiryUpdateData[key] === undefined || directEnquiryUpdateData[key] === null) {
          delete directEnquiryUpdateData[key];
        }
      });

      console.log("Direct Enquiry Update Data:", directEnquiryUpdateData);
      console.log("Updating record with ID:", updateId);

      const { data: updatedData, error } = await supabase
          .from("enquiries")
          .update(directEnquiryUpdateData)
          .eq("id", updateId)
          .select();

      if (error) {
        console.error("Direct Enquiry update error:", error);
        alert(`Error updating record: ${error.message}`);
        throw error;
      }

      console.log("Successfully updated Direct Enquiry record:", updatedData);
      alert("Updated successfully!");
      fetchDirectEnquiryData(directEnquiryPage, searchTerm, false, getDateFiltersFromCallingDays());
      setEditingRowId(null);
      setEditedData({});
      return;
    }

    // Handle History tab - existing logic for enquiry_tracker / enquiry_tracker_for_leads
    const parseNumericField = (val) => {
      if (val === "" || val === undefined || val === null) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    };

    const updateData = {
      enquiry_status: editedData.enquiryStatus,
      what_did_customer_say: editedData.customerFeedback,
      current_stage: editedData.currentStage,
      send_quotation_no: editedData.sendQuotationNo,
      quotation_shared_by: editedData.quotationSharedBy,
      quotation_number: editedData.quotationNumber,
      quotation_value_without_tax: parseNumericField(editedData.valueWithoutTax),
      quotation_value_with_tax: parseNumericField(editedData.valueWithTax),
      quotation_upload: editedData.quotationUpload,
      quotation_remarks: editedData.quotationRemarks,
      quotation_validator_name: editedData.validatorName,
      quotation_send_status: editedData.sendStatus,
      quotation_validation_remark: editedData.validationRemark,
      send_faq_video: editedData.faqVideo === "Yes" || editedData.faqVideo === true || editedData.faqVideo === "yes",
      send_product_video: editedData.productVideo === "Yes" || editedData.productVideo === true || editedData.productVideo === "yes",
      send_offer_video: editedData.offerVideo === "Yes" || editedData.offerVideo === true || editedData.offerVideo === "yes",
      send_product_catalog: editedData.productCatalog === "Yes" || editedData.productCatalog === true || editedData.productCatalog === "yes",
      send_product_image: editedData.productImage === "Yes" || editedData.productImage === true || editedData.productImage === "yes",
      next_call_date: convertDateToYYYYMMDD(editedData.nextCallDate),
      next_call_time: convertTimeTo24Hour(editedData.nextCallTime),
      is_order_received_status: editedData.orderStatus,
      acceptance_via: editedData.acceptanceVia,
      payment_mode: editedData.paymentMode,
      payment_terms_days: parseNumericField(editedData.paymentTerms),
      transport_mode: editedData.transportMode,
      conveyed_for_registration_form: editedData.registrationFrom === "Yes" || editedData.registrationFrom === true || editedData.registrationFrom === "yes",
      acceptance_file_upload: editedData.acceptanceFile,
      remark: editedData.orderRemark,
      order_lost_apology_video: editedData.apologyVideo,
      if_no_reason_status: editedData.reasonStatus,
      if_no_reason_remark: editedData.reasonRemark,
      customer_order_hold_reason_category: editedData.holdReason,
      holding_date: convertDateToYYYYMMDD(editedData.holdingDate),
      hold_remark: editedData.holdRemark,
    };

    // Remove undefined/null values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined || updateData[key] === null) {
        delete updateData[key];
      }
    });

    // Get the record identifier
    const identifier = editedData.enquiryNo;
    
    if (!identifier) {
      throw new Error("Record identifier is required");
    }

    // Check if it's a lead number (LD-*) or enquiry number (EN-*)
    const isLeadNumber = identifier.toUpperCase().startsWith('LD-');
    const isEnquiryNumber = identifier.toUpperCase().startsWith('EN-');

    // Update tracking table
    const tableName = isLeadNumber ? "enquiry_tracker_for_leads" : "enquiry_tracker";
    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq("id", editedData.id);

    if (error) {
      alert(`Error updating ${tableName}: ${error.message}`);
      console.error(`Error updating ${tableName}:`, error);
      return;
    }

    alert("Updated successfully!");

    // Refresh data
    fetchHistoryData(1, searchTerm, false, getDateFiltersFromCallingDays());
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

  // Helper function to determine priority based on status
  const determinePriority = (status) => {
    if (!status) return "Low";

    const statusLower = status.toLowerCase();
    if (statusLower === "hot") return "High";
    if (statusLower === "warm") return "Medium";
    return "Low";
  };

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return "";

    try {
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

  // Helper function to format time to 12-hour format with AM/PM
  const formatTimeTo12Hour = (timeValue) => {
    if (!timeValue) return "";

    try {
      if (typeof timeValue === "string" && timeValue.startsWith("Date(")) {
        const dateString = timeValue.substring(5, timeValue.length - 1);
        const parts = dateString.split(",");

        if (parts.length >= 5) {
          const hour = Number.parseInt(parts[3].trim());
          const minute = Number.parseInt(parts[4].trim());
          const period = hour >= 12 ? "PM" : "AM";
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minute
            .toString()
            .padStart(2, "0")} ${period}`;
        }
      }

      if (typeof timeValue === "string" && timeValue.includes(":")) {
        const [hour, minute] = timeValue
          .split(":")
          .map((part) => Number.parseInt(part));
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      }

      return timeValue;
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeValue;
    }
  };

  // Helper function to check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr.split("/").reverse().join("-"));
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  };

  // Helper function to check if a date is overdue
  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr.split("/").reverse().join("-"));
      const today = new Date();
      return date < today;
    } catch {
      return false;
    }
  };

  // Helper function to check if a date is upcoming
  const isUpcoming = (dateStr) => {
    if (!dateStr) return false;
    try {
      const date = new Date(dateStr.split("/").reverse().join("-"));
      const today = new Date();
      return date > today;
    } catch {
      return false;
    }
  };

  const formatItemQty = (itemQtyString) => {
    if (!itemQtyString) return "";

    // If it's already a nicely formatted string, just return it
    if (typeof itemQtyString === "string" && itemQtyString.includes(":")) {
      return itemQtyString;
    }

    try {
      // Try to parse as JSON
      const items = JSON.parse(itemQtyString);

      // Check if it's an array of objects with name/quantity properties
      if (
        Array.isArray(items) &&
        items.length > 0 &&
        typeof items[0] === "object"
      ) {
        return items
          .filter((item) => item.name && item.quantity && item.quantity !== "0")
          .map((item) => `${item.name} : ${item.quantity}`)
          .join(", ");
      }

      // If it's a different JSON format, return the string representation
      return JSON.stringify(items);
    } catch (error) {
      // If parsing fails, return the original string
      return itemQtyString;
    }
  };

  /**
   * Aggregates items from individual columns and JSON column for display summary
   */
  const aggregateItemsForSummary = (item, namePrefix, qtyPrefix, jsonField) => {
    const summaryItems = [];

    // Check individual columns 1-10
    for (let i = 1; i <= 10; i++) {
      const name = item[`${namePrefix}${i}`];
      const qty = item[`${qtyPrefix}${i}`];
      
      if (name && typeof name === 'string' && name.trim() !== "" && qty !== null && qty !== undefined && qty.toString() !== "0") {
        summaryItems.push(`${name.trim()} : ${qty}`);
      }
    }

    // Add items from the JSON column if any
    const jsonStr = item[jsonField];
    if (jsonStr) {
      try {
        const extraItems = typeof jsonStr === "string" ? JSON.parse(jsonStr) : jsonStr;
        if (Array.isArray(extraItems)) {
          extraItems.forEach(extra => {
            if (extra.name && extra.quantity && extra.quantity.toString() !== "0") {
              summaryItems.push(`${extra.name.trim()} : ${extra.quantity}`);
            }
          });
        }
      } catch (e) {
        // Silently skip if not a valid JSON array
      }
    }

    return summaryItems.join(", ");
  };

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

  const columnOptions = activeTab === "history" ? historyColumnsConfig : columnsConfig;
  const pendingColumnOptions = columnsConfig;
  const directEnquiryColumnOptions = columnsConfig;

  // Toggle functions for pending tab columns
  const handlePendingColumnToggle = (columnKey) => {
    setVisiblePendingColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const handlePendingSelectAll = () => {
    const allSelected = Object.values(visiblePendingColumns).every(Boolean);
    const newState = Object.fromEntries(
      Object.keys(visiblePendingColumns).map((key) => [key, !allSelected])
    );
    setVisiblePendingColumns(newState);
  };

  // Toggle functions for direct enquiry tab columns
  const handleDirectEnquiryColumnToggle = (columnKey) => {
    setVisibleDirectEnquiryColumns((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const handleDirectEnquirySelectAll = () => {
    const allSelected = Object.values(visibleDirectEnquiryColumns).every(Boolean);
    const newState = Object.fromEntries(
      Object.keys(visibleDirectEnquiryColumns).map((key) => [key, !allSelected])
    );
    setVisibleDirectEnquiryColumns(newState);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setShowCallingDaysDropdown(false);
        setShowEnquiryNoDropdown(false);
        setShowCurrentStageDropdown(false);
        setShowColumnDropdown(false);
        setShowSerialDropdown(false);
        setShowPendingColumnDropdown(false);
        setShowDirectEnquiryColumnDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add this function near your other fetch functions
  // Replace your fetchTenDaysData function with this fixed version
  // Replace your fetchTenDaysData function with this updated version
  const fetchTenDaysData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyzW8-RldYx917QpAfO4kY-T8_ntg__T0sbr7Yup2ZTVb1FC5H1g6TYuJgAU6wTquVM/exec?sheet=ORDER-DISPATCH&action=fetch"
      );

      const text = await response.text();

      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("Response is not JSON:", text);
        setTenDaysData([]);
        setIsLoading(false);
        return;
      }

      if (result.success && result.data) {
        const headers = result.data[0];
        const rows = result.data.slice(4);

        // Find column indices
        const awIndex = headers.findIndex(
          (h) =>
            h &&
            typeof h === "string" &&
            h.toLowerCase().includes("delivery status")
        );
        const cfIndex = headers.findIndex(
          (h) =>
            h &&
            typeof h === "string" &&
            h.toLowerCase().includes("revised order date")
        );
        const cgIndex = headers.findIndex(
          (h) =>
            h &&
            typeof h === "string" &&
            h.toLowerCase().includes("revised order status")
        );
        const chIndex = headers.findIndex(
          (h) =>
            h &&
            typeof h === "string" &&
            h.toLowerCase().includes("revised order date2")
        ); // New column for Date
        const ciIndex = headers.findIndex(
          (h) =>
            h &&
            typeof h === "string" &&
            h.toLowerCase().includes("sales coordinator")
        );
        const cjIndex = headers.findIndex(
          (h) =>
            h &&
            typeof h === "string" &&
            h.toLowerCase().includes("revised order remark")
        ); // New column for Remarks

        // Use fallback indices if specific column names not found
        const awCol = awIndex >= 0 ? awIndex : 48;
        const cfCol = cfIndex >= 0 ? cfIndex : 83;
        const cgCol = cgIndex >= 0 ? cgIndex : 84;
        const chCol = chIndex >= 0 ? chIndex : 85; // Date column - adjust this number if needed
        const ciCol = ciIndex >= 0 ? ciIndex : 86;
        const cjCol = cjIndex >= 0 ? cjIndex : 87; // Remarks column - adjust this number if needed

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tenDaysOrders = [];

        rows.forEach((row, index) => {
          try {
            const awValue = row[awCol];
            const cfValue = row[cfCol];
            const cgValue = row[cgCol]; // Status
            const chValue = row[chCol]; // Remarks (CH column)
            const ciValue = row[ciCol]; // Sales Coordinator
            const cjValue = row[cjCol]; // Date (CJ column)
            // Debug logging

            const statusStr = String(cgValue || "")
              .toLowerCase()
              .trim();

            const isUserRow =
              isAdmin() ||
              (currentUser?.username &&
                ciValue &&
                ciValue.toString().trim() === currentUser.username.trim());
            // Debug for DO-6 specifically - check if it exists at all

            // Check if order is not dispatched/completed
            const awValueLower = awValue
              ? awValue.toString().toLowerCase().trim()
              : "";
            const isNotDispatched =
              !awValueLower ||
              (!awValueLower.includes("dispatched") &&
                !awValueLower.includes("delivered") &&
                !awValueLower.includes("completed") &&
                !awValueLower.includes("done"));

            // Only include orders that are not done

            const includeByStatus =
              !statusStr ||
              statusStr === "" ||
              statusStr === "null" ||
              statusStr === "undefined" ||
              statusStr !== "done";
            if (isUserRow && isNotDispatched && includeByStatus && cfValue) {
              let cfDate = null;
              if (cfValue) {
                if (cfValue instanceof Date) {
                  cfDate = new Date(cfValue);
                } else if (typeof cfValue === "string") {
                  let parsed = new Date(cfValue);
                  if (isNaN(parsed.getTime())) {
                    const m = cfValue.match(
                      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/
                    );
                    if (m) {
                      const day = parseInt(m[1], 10);
                      const month = parseInt(m[2], 10) - 1;
                      const year =
                        parseInt(m[3], 10) + (m[3].length === 2 ? 2000 : 0);
                      parsed = new Date(year, month, day);
                    }
                  }
                  if (isNaN(parsed.getTime())) {
                    const serialDate = parseFloat(cfValue);
                    if (!isNaN(serialDate)) {
                      parsed = new Date((serialDate - 25569) * 86400 * 1000);
                    }
                  }
                  if (!isNaN(parsed.getTime())) {
                    cfDate = parsed;
                  }
                } else if (typeof cfValue === "number") {
                  const parsed = new Date((cfValue - 25569) * 86400 * 1000);
                  if (!isNaN(parsed.getTime())) {
                    cfDate = parsed;
                  }
                }
              }

              const order = {
                id: index + 2,
                timestamp: row[0] || "",
                orderNo: row[1] || "",
                quotationNo: row[2] || "",
                companyName: row[3] || "",
                contactPersonName: row[4] || "",
                contactNumber: row[5] || "",
                billingAddress: row[6] || "",
                shippingAddress: row[7] || "",
                paymentMode: row[8] || "",
                paymentTerms: row[9] || "",
                referenceName: row[10] || "",
                email: row[11] || "",
                transportMode: row[32] || "",
                destination: row[33] || "",
                itemQty: row[34] || "",
                poNumber: row[35] || "",
                totalOrderQty: row[40] || "",
                amountTotal: row[41] || "",
                dispatchStatus: row[48] || "",
                salesCoordinator: ciValue || "",
                existingStatus:
                  statusStr &&
                  statusStr !== "null" &&
                  statusStr !== "undefined" &&
                  statusStr !== ""
                    ? statusStr
                    : "pending",
                existingDate: (() => {
                  if (!cjValue) return "";
                  try {
                    let date;

                    // Handle different date formats
                    if (cjValue instanceof Date) {
                      date = new Date(cjValue);
                    } else if (typeof cjValue === "string") {
                      // Try parsing as string
                      date = new Date(cjValue);

                      // If invalid, try DD/MM/YYYY format
                      if (isNaN(date.getTime())) {
                        const match = cjValue.match(
                          /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/
                        );
                        if (match) {
                          const day = parseInt(match[1], 10);
                          const month = parseInt(match[2], 10) - 1; // Month is 0-indexed
                          const year =
                            parseInt(match[3], 10) +
                            (match[3].length === 2 ? 2000 : 0);
                          date = new Date(year, month, day);
                        }
                      }
                    } else if (typeof cjValue === "number") {
                      // Handle Excel serial date
                      date = new Date((cjValue - 25569) * 86400 * 1000);
                    }

                    if (date && !isNaN(date.getTime())) {
                      // Format as YYYY-MM-DD in local timezone to avoid timezone issues
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      return `${year}-${month}-${day}`;
                    }

                    return "";
                  } catch (e) {
                    console.error("Error parsing date:", cjValue, e);
                    return "";
                  }
                })(),
                existingRemarks: chValue || "",
              };

              if (cfDate && !isNaN(cfDate.getTime())) {
                const normalizedCfDate = new Date(cfDate);
                normalizedCfDate.setHours(0, 0, 0, 0);
                const normalizedToday = new Date(today);
                normalizedToday.setHours(0, 0, 0, 0);
                const diffTime =
                  normalizedToday.getTime() - normalizedCfDate.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0) {
                  order.cfDate = cfDate.toLocaleDateString();
                  order.daysAgo = diffDays;
                  order.status = diffDays <= 10 ? "within 10 days" : "overdue";
                } else {
                  order.cfDate = cfDate.toLocaleDateString();
                  order.daysAgo = diffDays;
                  order.status = "pending"; // Future date
                }
              } else {
                order.cfDate = "";
                order.daysAgo = "";
                order.status = "pending";
              }

              tenDaysOrders.push(order);
            }
          } catch (error) {
            console.error("Error processing row:", error, row);
          }
        });

        setTenDaysData(tenDaysOrders);

        // Initialize state with existing values
        const initialStatuses = {};
        const initialDates = {};
        const initialRemarks = {};

        tenDaysOrders.forEach((order) => {
          initialStatuses[order.orderNo] = order.existingStatus;
          initialDates[order.orderNo] = order.existingDate;
          initialRemarks[order.orderNo] = order.existingRemarks;
        });

        setOrderStatuses(initialStatuses);
        setOrderDates(initialDates);
        setOrderRemarks(initialRemarks);
      } else {
        console.error("Error fetching 10 days data:", result.error);
        setTenDaysData([]);
      }
    } catch (error) {
      console.error("Error fetching 10 days data:", error);
      setTenDaysData([]);
    }
    setIsLoading(false);
  };

  // Also update your useEffect to properly handle the 10 days tab
  useEffect(() => {
    if (isSearching) {
      return;
    }

    const fetchData = async () => {
      // Get date filters from callingDaysFilter
      const dateFilters = getDateFiltersFromCallingDays();

      switch (activeTab) {
        case "pending":
          await fetchPendingData(
            pendingPage,
            searchTerm,
            pendingPage > 1,
            dateFilters
          );
          break;
        case "history":
          await fetchHistoryData(
            historyPage,
            searchTerm,
            historyPage > 1,
            dateFilters
          );
          break;
        case "directEnquiry":
          await fetchDirectEnquiryData(
            directEnquiryPage,
            searchTerm,
            directEnquiryPage > 1,
            dateFilters
          );
          break;
        case "tenDays":
          await fetchTenDaysData(); // This was missing!
          break;
      }
    };

    fetchData();
  }, [
    activeTab,
    pendingPage,
    historyPage,
    directEnquiryPage,
    callingDaysFilter,
    scNameFilter,
  ]);

  // 1. Update the fetchPendingData function to pull from call_tracker_for_leads & enquiries
  const fetchPendingData = async (
    page = 1,
    searchTerm = "",
    isLoadMore = false,
    dateFilters = {}
  ) => {
    if (isLoadMore && !hasMorePending) return;

    setIsLoading(true);

    try {
      // 1. Existing lead_ids in enquiry_tracker_for_leads
      const { data: trackerLeads } = await supabase
        .from("enquiry_tracker_for_leads")
        .select("*")
        .order("created_at", { ascending: true });

      const latestLeadLogMap = {};
      const closedLeadIds = new Set();

      (trackerLeads || []).forEach((log) => {
        if (log.lead_id) {
          latestLeadLogMap[log.lead_id] = log;
          if (log.is_order_received_status && String(log.is_order_received_status).trim() !== "") {
            closedLeadIds.add(log.lead_id);
          }
        }
      });

      const existingClosedLeadIds = Array.from(closedLeadIds);

      // Query call_tracker_for_leads where planned_at IS NOT NULL and lead_id NOT IN closed list
      let callTrackerQuery = supabase
        .from("call_tracker_for_leads")
        .select("*", { count: "exact" })
        .not("planned_at", "is", null)
        .order("created_at", { ascending: false });

      if (existingClosedLeadIds.length > 0) {
        callTrackerQuery = callTrackerQuery.not("lead_id", "in", `(${existingClosedLeadIds.join(",")})`);
      }

      if (searchTerm) {
        callTrackerQuery = callTrackerQuery.or(
          `what_did_customer_say.ilike.%${searchTerm}%,enquiry_received_status.ilike.%${searchTerm}%,enquiry_for_state.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,enquiry_type.ilike.%${searchTerm}%,sc_name.ilike.%${searchTerm}%`
        );
      }

      if (!isAdmin() && currentUser && currentUser.username) {
        const usernamesToFilter = getUsernamesToFilter();
        callTrackerQuery = callTrackerQuery.in("sc_name", usernamesToFilter);
      }

      if (isAdmin() && scNameFilter !== "all") {
        callTrackerQuery = callTrackerQuery.eq("sc_name", scNameFilter);
      }

      // 2. Existing enquiry_ids in enquiry_tracker
      const { data: trackerEnquiries } = await supabase
        .from("enquiry_tracker")
        .select("*")
        .order("created_at", { ascending: true });

      const latestEnquiryLogMap = {};
      const closedEnquiryIds = new Set();

      (trackerEnquiries || []).forEach((log) => {
        if (log.enquiry_id) {
          latestEnquiryLogMap[log.enquiry_id] = log;
          if (log.is_order_received_status && String(log.is_order_received_status).trim() !== "") {
            closedEnquiryIds.add(log.enquiry_id);
          }
        }
      });

      const existingClosedEnquiryIds = Array.from(closedEnquiryIds);

      // Query enquiries where planned_at IS NOT NULL and id NOT IN closed list
      let enquiriesQuery = supabase
        .from("enquiries")
        .select("*", { count: "exact" })
        .not("planned_at", "is", null)
        .order("created_at", { ascending: false });

      if (existingClosedEnquiryIds.length > 0) {
        enquiriesQuery = enquiriesQuery.not("id", "in", `(${existingClosedEnquiryIds.join(",")})`);
      }

      if (searchTerm) {
        enquiriesQuery = enquiriesQuery.or(
          `enquiry_no.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%,sales_person_name.ilike.%${searchTerm}%`
        );
      }

      if (!isAdmin() && currentUser && currentUser.username) {
        const usernamesToFilter = getUsernamesToFilter();
        enquiriesQuery = enquiriesQuery.in("sales_coordinator_name", usernamesToFilter);
      }

      if (isAdmin() && scNameFilter !== "all") {
        enquiriesQuery = enquiriesQuery.eq("sales_coordinator_name", scNameFilter);
      }

      const [callTrackerRes, enquiriesRes] = await Promise.all([
        callTrackerQuery,
        enquiriesQuery,
      ]);

      const callTrackerData = callTrackerRes.data || [];
      const enquiriesData = enquiriesRes.data || [];

      // Deduplicate callTrackerData by lead_id (keep most recent)
      const seenLeadIds = new Set();
      const dedupedCallTracker = [];
      for (const item of callTrackerData) {
        if (item.lead_id && !seenLeadIds.has(item.lead_id)) {
          seenLeadIds.add(item.lead_id);
          dedupedCallTracker.push(item);
        }
      }

      // Fetch parent leads details for dedupedCallTracker
      const parentLeadIds = Array.from(seenLeadIds);
      const leadsMap = {};
      if (parentLeadIds.length > 0) {
        const { data: leadsData } = await supabase
          .from("leads")
          .select("*")
          .in("id", parentLeadIds);

        (leadsData || []).forEach((lead) => {
          leadsMap[lead.id] = lead;
        });
      }

      const transformedCallTracker = dedupedCallTracker.map((item) => {
        const parentLead = leadsMap[item.lead_id] || {};
        const latestLog = latestLeadLogMap[item.lead_id] || {};
        return {
          id: item.id,
          dbId: item.id,
          leadIdVal: item.lead_id,
          tableSource: "call_tracker_for_leads",
          sourceType: "lead",
          timestamp: formatDateToDDMMYYYY(latestLog.created_at || item.created_at) || "",
          leadNo: parentLead.lead_no || "",
          lead_no: parentLead.lead_no || "",
          leadReceiverName: parentLead.lead_receiver_name || "",
          leadSource: parentLead.lead_source || "",
          phoneNo: parentLead.phone_number || "",
          salespersonName: parentLead.salesperson_name || "",
          companyName: parentLead.company_name || item.company_name || "",
          currentStage: latestLog.current_stage || "Enquiry Tracker",
          callingDate: latestLog.created_at ? formatDateToDDMMYYYY(latestLog.created_at) : (item.created_at ? formatDateToDDMMYYYY(item.created_at) : ""),
          priority: determinePriority(parentLead.lead_source || ""),
          assignedTo: item.sc_name || parentLead.salesperson_name || "",
          nextCallDate: latestLog.next_call_date ? formatDateToDDMMYYYY(latestLog.next_call_date) : (item.planned_at ? formatDateToDDMMYYYY(item.planned_at) : ""),
          nextCallTime: latestLog.next_call_time || item.next_call_time || "",
          customerSay: latestLog.what_did_customer_say || item.what_did_customer_say || "",
          enquiryStatus: latestLog.enquiry_status || item.enquiry_received_status || "",
          enquiryReceivedStatus: item.enquiry_received_status || "",
          enquiryReceivedDate: item.enquiry_received_date
            ? formatDateToDDMMYYYY(item.enquiry_received_date)
            : "",
          enquiryForState: item.enquiry_for_state || parentLead.state || "",
          projectName: item.project_name || parentLead.nob || "",
          enquiryType: item.enquiry_type || parentLead.sales_type || "",
          enquiryApproach: item.enquiry_approach || "",
          projectApproximateValue: item.project_approximate_value || "",
          nextAction: item.next_action || "",
          plannedAt: latestLog.next_call_date ? formatDateToDDMMYYYY(latestLog.next_call_date) : (item.planned_at ? formatDateToDDMMYYYY(item.planned_at) : ""),
        };
      });

      const transformedEnquiries = enquiriesData.map((item) => {
        const latestLog = latestEnquiryLogMap[item.id] || {};
        return {
          id: item.id,
          dbId: item.id,
          enquiryIdVal: item.id,
          tableSource: "enquiries",
          sourceType: "enquiry",
          timestamp: formatDateToDDMMYYYY(latestLog.created_at || item.created_at || item.enquiry_date) || "",
          leadNo: item.enquiry_no || "",
          lead_no: item.enquiry_no || "",
          leadReceiverName: item.enquiry_receiver_name || "",
          leadSource: item.lead_source || "",
          phoneNo: item.phone_number || "",
          salespersonName: item.sales_person_name || "",
          companyName: item.company_name || "",
          currentStage: latestLog.current_stage || "Enquiry Tracker",
          callingDate: latestLog.created_at ? formatDateToDDMMYYYY(latestLog.created_at) : (item.enquiry_date ? formatDateToDDMMYYYY(item.enquiry_date) : ""),
          priority: determinePriority(item.lead_source || ""),
          assignedTo: item.sales_coordinator_name || "",
          nextCallDate: latestLog.next_call_date ? formatDateToDDMMYYYY(latestLog.next_call_date) : (item.planned_at ? formatDateToDDMMYYYY(item.planned_at) : ""),
          nextCallTime: latestLog.next_call_time || "",
          customerSay: latestLog.what_did_customer_say || latestLog.customer_feedback || "",
          enquiryStatus: latestLog.enquiry_status || "Direct Enquiry",
          enquiryReceivedStatus: "Direct Enquiry",
          enquiryReceivedDate: formatDateToDDMMYYYY(item.enquiry_date) || "",
          enquiryForState: item.enquiry_for_state || "",
          projectName: item.project_name || "",
          enquiryType: item.sales_type || "",
          enquiryApproach: item.enquiry_approach || "",
          plannedAt: latestLog.next_call_date ? formatDateToDDMMYYYY(latestLog.next_call_date) : (item.planned_at ? formatDateToDDMMYYYY(item.planned_at) : ""),
        };
      });

      const allCombined = [...transformedCallTracker, ...transformedEnquiries];
      const totalCount = (callTrackerRes.count || 0) + (enquiriesRes.count || 0);

      const itemsPerPage = 50;
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const paginated = allCombined.slice(from, to + 1).map((item, index) => ({
        ...item,
        serialNo: from + index + 1,
      }));

      if (isLoadMore) {
        setPendingData((prev) => [...prev, ...paginated]);
      } else {
        setPendingData(paginated);
      }

      setHasMorePending(paginated.length < totalCount);
    } catch (err) {
      console.error("Error fetching pending data for EnquiryTracker:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoryData = async (
    page = 1,
    searchTerm = "",
    isLoadMore = false,
    dateFilters = {}
  ) => {
    if (isLoadMore && !hasMoreHistory) return;

    setIsLoading(true);
    const itemsPerPage = 50;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      let trackerQuery = supabase
        .from("enquiry_tracker")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      let leadsTrackerQuery = supabase
        .from("enquiry_tracker_for_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (dateFilters.today) {
        const today = new Date().toISOString().split("T")[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        trackerQuery = trackerQuery.gte("next_call_date", today).lt("next_call_date", tomorrow);
        leadsTrackerQuery = leadsTrackerQuery.gte("next_call_date", today).lt("next_call_date", tomorrow);
      } else if (dateFilters.older) {
        const today = new Date().toISOString().split("T")[0];
        trackerQuery = trackerQuery.lt("next_call_date", today);
        leadsTrackerQuery = leadsTrackerQuery.lt("next_call_date", today);
      }

      const [trackerRes, leadsTrackerRes] = await Promise.all([
        trackerQuery,
        leadsTrackerQuery
      ]);

      if (trackerRes.error) console.error("Error fetching enquiry_tracker:", trackerRes.error.message);
      if (leadsTrackerRes.error) console.error("Error fetching enquiry_tracker_for_leads:", leadsTrackerRes.error.message);

      const trackerRows = (trackerRes.data || []).map(item => ({ ...item, isLead: false }));
      const leadsTrackerRows = (leadsTrackerRes.data || []).map(item => ({ ...item, isLead: true }));

      let allLogs = [...trackerRows, ...leadsTrackerRows];
      allLogs.sort((a, b) => new Date(b.created_at || b.Timestamp || 0) - new Date(a.created_at || a.Timestamp || 0));

      const leadIds = Array.from(new Set(allLogs.filter(i => i.isLead && i.lead_id).map(i => i.lead_id)));
      const enqIds = Array.from(new Set(allLogs.filter(i => !i.isLead && i.enquiry_id).map(i => i.enquiry_id)));

      let leadsMap = {};
      let enqMap = {};

      if (leadIds.length > 0) {
        const { data: ldData } = await supabase
          .from("leads")
          .select("*")
          .in("id", leadIds);
        if (ldData) {
          ldData.forEach(row => {
            leadsMap[row.id] = row;
            if (row.lead_no) leadsMap[row.lead_no] = row;
          });
        }
      }

      if (enqIds.length > 0) {
        const { data: enqData } = await supabase
          .from("enquiries")
          .select("*")
          .in("id", enqIds);
        if (enqData) {
          enqData.forEach(row => {
            enqMap[row.id] = row;
            if (row.enquiry_no) enqMap[row.enquiry_no] = row;
          });
        }
      }

      const transformedData = allLogs.map((item) => {
        const mL = item.isLead ? (leadsMap[item.lead_id] || leadsMap[item.lead_no] || {}) : {};
        const mE = !item.isLead ? (enqMap[item.enquiry_id] || enqMap[item.enquiry_no] || {}) : {};

        const enqNo = mL.lead_no || mE.enquiry_no || item.enquiry_no || item["Enquiry No."] || "";
        const companyName = mL.company_name || mL["Company_Name"] || mE.company_name || mE["company_name"] || item.company_name || "";
        const phoneNo = mL.phone_number || mL["Phone_Number"] || mE.phone_number || mE["phone_number"] || item.phone_number || "";
        const salespersonName = mL.salesperson_name || mL.sc_name || mE.sales_coordinator_name || mE.sales_person_name || item.sc_name || item.sales_coordinator_name || item["Sales Cordinator"] || "";
        const leadSource = mL.lead_source || mE.lead_source || "";
        const shippingAddress = mL.address || mE.shipping_address || "";
        const gstNumber = mL.gst_number || mE.gst_number || "";
        const enquiryReceiverName = mL.lead_receiver_name || mE.enquiry_receiver_name || "";
        const enquiryAssignToProject = mL.salesperson_name || mE.sales_coordinator_name || mE.enquiry_assign_to_project || salespersonName || "";
        const enquiryDate = formatDateToDDMMYYYY(mL.created_at || mL.enquiry_received_date || mE.created_at || mE.enquiry_date || item.created_at) || "";
        const enquiryState = mL.state || mE.enquiry_for_state || mE.state || "";
        const projectName = mL.nob || mE.project_name || "";
        const salesType = mL.sales_type || mE.sales_type || "";
        const enquiryApproach = mL.enquiry_approach || mE.enquiry_approach || "";
        const callingDate = item.calling_days || mL.calling_days || mE.calling_days || "";
        const totalQty = mL["Total Order Qty"] || mE["total_qty"] || "";
        const itemQty = aggregateItemsForSummary(mL.id ? mL : mE, mL.id ? "Item_Name" : "item_name", mL.id ? "Quantity" : "quantity", mL.id ? "Item/qty" : "item_qty") || "";

        return {
          id: item.id,
          uuid: item.id,
          serialNo: 0, // Assigned during pagination
          Timestamp: formatDateToDDMMYYYY(item.created_at || item.Timestamp) || "",
          enquiryNo: enqNo,
          leadNo: enqNo,
          lead_no: enqNo,
          companyName: companyName,
          Company_Name: companyName,
          phoneNo: phoneNo,
          Phone_Number: phoneNo,
          salespersonName: salespersonName,
          salesperson_Name: salespersonName,
          leadSource: leadSource,
          Lead_Source: leadSource,
          shippingAddress: shippingAddress,
          gstNumber: gstNumber,
          enquiryReceiverName: enquiryReceiverName,
          enquiryAssignToProject: enquiryAssignToProject,
          enquiryDate: enquiryDate,
          enquiryState: enquiryState,
          projectName: projectName,
          salesType: salesType,
          enquiryApproach: enquiryApproach,
          callingDate: callingDate,
          totalQty: totalQty,
          itemQty: itemQty,
          itemName1: mL["Item_Name1"] || mE["item_name1"] || "",
          quantity1: mL["Quantity1"] || mE["quantity1"] || "",
          itemName2: mL["Item_Name2"] || mE["item_name2"] || "",
          quantity2: mL["Quantity2"] || mE["quantity2"] || "",
          itemName3: mL["Item_Name3"] || mE["item_name3"] || "",
          quantity3: mL["Quantity3"] || mE["quantity3"] || "",
          itemName4: mL["Item_Name4"] || mE["item_name4"] || "",
          quantity4: mL["Quantity4"] || mE["quantity4"] || "",
          itemName5: mL["Item_Name5"] || mE["item_name5"] || "",
          quantity5: mL["Quantity5"] || mE["quantity5"] || "",
          enquiryStatus: item.enquiry_status || item["Enquiry Status"] || "Active",
          customerFeedback: item.what_did_customer_say || item.customer_feedback || item["What Did Customer Say"] || "",
          currentStage: item.current_stage || item["Current Stage"] || "",
          sendQuotationNo: item.send_quotation_no || item["Send Quotation No."] || "",
          quotationSharedBy: item.quotation_shared_by || item["Quotation Shared By"] || "",
          quotationNumber: item.quotation_number || item["Quotation Number"] || "",
          valueWithoutTax: item.quotation_value_without_tax || item["Quotation Value Without Tax"] || "",
          valueWithTax: item.quotation_value_with_tax || item.amount_with_tax || item["Quotation Value With Tax"] || "",
          quotationUpload: item.quotation_upload || item["Quotation Upload"] || item["Quotation Copy"] || mL.quotation_upload || mE.quotation_upload || "",
          quotationRemarks: item.quotation_remarks || item["Quotation Remarks"] || "",
          validatorName: item.quotation_validator_name || item["Quotation Validator Name"] || "",
          sendStatus: item.quotation_send_status || item["Quotation Send Status"] || "",
          validationRemark: item.quotation_validation_remark || item["Quotation Validation Remark"] || "",
          faqVideo: item.send_faq_video || item["Send Faq Video"] || "",
          productVideo: item.send_product_video || item["Send Product Video"] || "",
          offerVideo: item.send_offer_video || item["Send Offer Video"] || "",
          productCatalog: item.send_product_catalog || item["Send Product Catalog"] || "",
          productImage: item.send_product_image || item["Send Product Image"] || "",
          nextCallDate: formatDateToDDMMYYYY(item.next_call_date || item["Next Call Date"]) || "",
          nextCallTime: formatTimeTo12Hour(item.next_call_time || item["Next Call Time"]) || "",
          orderStatus: item.is_order_received_status || item["Is Order Received? Status"] || "",
          acceptanceVia: item.acceptance_via || item["Acceptance Via"] || mL.acceptance_via || mE.acceptance_via || "",
          paymentMode: item.payment_mode || item["Payment Mode"] || "",
          paymentTerms: item.payment_terms_days || item["Payment Terms (In Days)"] || "",
          transportMode: item.transport_mode || item["Transport Mode"] || "",
          registrationFrom: item.conveyed_for_registration_form || item["CONVEYED FOR REGISTRATION FORM"] || "",
          conveyedForRegistration: item.conveyed_for_registration_form || item["CONVEYED FOR REGISTRATION FORM"] || "",
          offer: item.offer || item["Offer"] || "",
          acceptanceFile: item.acceptance_file_upload || item["Acceptance File Upload"] || mL.acceptance_file_upload || mE.acceptance_file_upload || "",
          orderRemark: item.remark || item["Remark"] || "",
          apologyVideo: item.order_lost_apology_video || item["Order Lost Apology Video"] || "",
          reasonStatus: item.if_no_reason_status || item["If No Then Get Relevant Reason Status"] || "",
          reasonRemark: item.if_no_reason_remark || item["If No Then Get Relevant Reason Remark"] || "",
          holdReason: item.customer_order_hold_reason_category || item["Customer Order Hold Reason Category"] || "",
          holdingDate: formatDateToDDMMYYYY(item.holding_date || item["Holding Date"]) || "",
          holdRemark: item.hold_remark || item["Hold Remark"] || "",
          sales_coordinator: salespersonName,
          followup_status: item.followup_status || item["Followup Status"] || "",
          credit_days: mL.credit_days || mE.credit_days || item["Credit Days"] || "",
          credit_limit: mL.credit_limit || mE.credit_limit || item["Credit Limit"] || "",
          calling_days: item.calling_days || mL.calling_days || mE.calling_days || "",
          order_no: item.order_no || item["Order No."] || "",
          sc_name: salespersonName,
          destination: item.destination || item["Destination"] || "",
          po_number: item.po_number || item["PO Number"] || "",
          poNumber: item.po_number || item["PO Number"] || "",
          priority: determinePriority(leadSource || item.enquiry_status || ""),
        };
      });

      let finalRows = transformedData;

      if (!isAdmin() && currentUser && currentUser.username) {
        const usernamesToFilter = getUsernamesToFilter();
        finalRows = finalRows.filter((item) =>
          usernamesToFilter.includes(item.salespersonName) ||
          usernamesToFilter.includes(item.enquiryAssignToProject) ||
          usernamesToFilter.includes(item.sc_name)
        );
      }

      if (isAdmin() && scNameFilter !== "all") {
        finalRows = finalRows.filter((item) =>
          item.salespersonName === scNameFilter ||
          item.enquiryAssignToProject === scNameFilter ||
          item.sc_name === scNameFilter
        );
      }

      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        finalRows = finalRows.filter((item) =>
          String(item.enquiryNo || "").toLowerCase().includes(lowerSearch) ||
          String(item.companyName || "").toLowerCase().includes(lowerSearch) ||
          String(item.customerFeedback || "").toLowerCase().includes(lowerSearch) ||
          String(item.currentStage || "").toLowerCase().includes(lowerSearch) ||
          String(item.quotationNumber || "").toLowerCase().includes(lowerSearch) ||
          String(item.orderStatus || "").toLowerCase().includes(lowerSearch) ||
          String(item.order_no || "").toLowerCase().includes(lowerSearch)
        );
      }

      const totalCount = finalRows.length;
      const paginated = finalRows.slice(from, to + 1).map((item, index) => ({
        ...item,
        serialNo: from + index + 1,
      }));

      if (isLoadMore) {
        setHistoryData((prev) => [...prev, ...paginated]);
      } else {
        setHistoryData(paginated);
      }

      const hasMore = paginated.length === itemsPerPage && from + paginated.length < totalCount;
      setHasMoreHistory(hasMore);

      setIsLoading(false);
      return paginated;
    } catch (error) {
      console.error("Error fetching history data:", error);
      setIsLoading(false);
      return [];
    }
  };

  // 2. Fix the fetchDirectEnquiryData function to prevent duplicates
  const fetchDirectEnquiryData = async (
    page = 1,
    searchTerm = "",
    isLoadMore = false,
    dateFilters = {}
  ) => {
    if (isLoadMore && !hasMoreDirectEnquiry) return;

    setIsLoading(true);
    const itemsPerPage = 50;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("enquiries")
      .select("*", { count: "exact" })
      .not("planned_at", "is", null)
      .order("created_at", { ascending: true })
      .range(from, to);

    // Add date filtering for direct enquiry data
    if (dateFilters.today) {
      const today = new Date().toISOString().split("T")[0];
      query = query
        .gte("next_call_date", today)
        .lt(
          "next_call_date",
          new Date(Date.now() + 86400000).toISOString().split("T")[0]
        );
    } else if (dateFilters.overdue) {
      const today = new Date().toISOString().split("T")[0];
      query = query.lt("next_call_date", today);
    } else if (dateFilters.upcoming) {
      const today = new Date().toISOString().split("T")[0];
      query = query.gt("next_call_date", today);
    }

    if (searchTerm) {
      query = query.or(
        `enquiry_no.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,sales_person_name.ilike.%${searchTerm}%`
      );
    }

    if (!isAdmin() && currentUser && currentUser.username) {
      const usernamesToFilter = getUsernamesToFilter();
      query = query.in("sales_coordinator_name", usernamesToFilter);
    }

    // Apply SC name filter for admin
    if (isAdmin() && scNameFilter !== "all") {
      query = query.eq("sales_coordinator_name", scNameFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching direct enquiry:", error.message);
      setIsLoading(false);
      return [];
    } else {
      // ✅ Transform data first
      const transformedData = data.map((item, index) => ({
        id: item.id, // Use actual database ID
        dbId: item.id, // Store database ID separately for clarity
        serialNo: from + index + 1,
        timestamp: formatDateToDDMMYYYY(item.timestamp) || "",
        enquiry_no: item.enquiry_no || "",
        lead_receiver_name: item.enquiry_receiver_name || "",
        lead_source: item.lead_source || "",
        phone_number: item.phone_number || "",
        salesperson_name: item.sales_person_name || "",
        company_name: item.company_name || "",
        current_stage: item.current_stage || "",
        calling_days: item.calling_days || "",
        priority: determinePriority(item.lead_source || ""),
        item_qty: aggregateItemsForSummary(item, "item_name", "quantity", "item_qty") || "",
        sc_name: item.sales_coordinator_name || "",
        nextCallDate: item.next_call_date || "",
        // New columns added
        location: item.location || "",
        email: item.email || "",
        shipping_address: item.shipping_address || "",
        enquiry_receiver_name: item.enquiry_receiver_name || "",
        enquiry_assign_to_project: item.enquiry_assign_to_project || "",
        gst_number: item.gst_number || "",
        enquiry_date: item.enquiry_date || "",
        enquiry_for_state: item.enquiry_for_state || "",
        project_name: item.project_name || "",
        sales_type: item.sales_type || "",
        enquiry_approach: item.enquiry_approach || "",
        item_name1: item.item_name1 || "",
        quantity1: item.quantity1 || "",
        item_name2: item.item_name2 || "",
        quantity2: item.quantity2 || "",
        item_name3: item.item_name3 || "",
        quantity3: item.quantity3 || "",
        item_name4: item.item_name4 || "",
        quantity4: item.quantity4 || "",
        item_name5: item.item_name5 || "",
        quantity5: item.quantity5 || "",
        item_name6: item.item_name6 || "",
        quantity6: item.quantity6 || "",
        item_name7: item.item_name7 || "",
        quantity7: item.quantity7 || "",
        item_name8: item.item_name8 || "",
        quantity8: item.quantity8 || "",
        item_name9: item.item_name9 || "",
        quantity9: item.quantity9 || "",
        item_name10: item.item_name10 || "",
        quantity10: item.quantity10 || "",
        // Additional requested columns
        enquiry_status: item.enquiry_status || "",
        customer_feedback: item.customer_feedback || "",
        send_quotation_no: item.send_quotation_no || "",
        quotation_shared_by: item.quotation_shared_by || "",
        quotation_number: item.quotation_number || "",
        quotation_value_without_tax: item.quotation_value_without_tax || "",
        quotation_value_with_tax: item.quotation_value_with_tax || "",
        quotation_upload: item.quotation_upload || "",
        quotation_remarks: item.quotation_remarks || "",
        quotation_validator_name: item.quotation_validator_name || "",
        quotation_send_status: item.quotation_send_status || "",
        quotation_validation_remark: item.quotation_validation_remark || "",
        send_faq_video: item.send_faq_video || false,
        send_product_video: item.send_product_video || false,
        send_offer_video: item.send_offer_video || false,
        send_product_catalog: item.send_product_catalog || false,
        send_product_image: item.send_product_image || false,
        next_call_time: formatTimeTo12Hour(item.next_call_time) || "",
        is_order_received_status: item.is_order_received_status || "",
        if_no_reason_status: item.if_no_reason_status || "",
        if_no_reason_remark: item.if_no_reason_remark || "",
        customer_order_hold_reason_category: item.customer_order_hold_reason_category || "",
        holding_date: formatDateToDDMMYYYY(item.holding_date) || "",
        hold_remark: item.hold_remark || "",
        transport_mode: item.transport_mode || "",
        conveyed_for_registration_form: item.conveyed_for_registration_form || false,
        sales_coordinator_name: item.sales_coordinator_name || "",
        order_no: item.order_no || "",
        amount_with_gst: item.amount_with_gst || "",
        total_qty: item.total_qty || "",
        destination: item.destination || "",
        po_number: item.po_number || "",
      }));

      // ✅ Sort by numeric part of enquiry_no (e.g., "En-1" -> 1, "En-10" -> 10)
      const sortedData = transformedData.sort((a, b) => {
        const numA =
          parseInt((a.enquiry_no || "").replace(/^En-/i, ""), 10) || 0;
        const numB =
          parseInt((b.enquiry_no || "").replace(/^En-/i, ""), 10) || 0;
        return numA - numB;
      });

      if (isLoadMore) {
        setDirectEnquiryData((prev) => {
          // Merge with existing data and re-sort
          const existingMap = new Map(
            prev.map((item) => [item.enquiry_no, item])
          );

          // Add new items
          sortedData.forEach((item) => {
            existingMap.set(item.enquiry_no, item);
          });

          // Convert back to array and sort again
          const merged = Array.from(existingMap.values());
          return merged.sort((a, b) => {
            const numA =
              parseInt((a.enquiry_no || "").replace(/^En-/i, ""), 10) || 0;
            const numB =
              parseInt((b.enquiry_no || "").replace(/^En-/i, ""), 10) || 0;
            return numA - numB;
          });
        });
      } else {
        setDirectEnquiryData(sortedData);
      }

      // Check if there's more data
      const hasMore =
        sortedData.length === itemsPerPage &&
        from + sortedData.length < (count || 0);
      setHasMoreDirectEnquiry(hasMore);

      setIsLoading(false);
      return sortedData;
    }
  };

  // Add these handler functions
  const handleOrderSelect = (orderNo, isChecked) => {
    if (isChecked) {
      setSelectedOrders((prev) => [...prev, orderNo]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderNo));
    }
  };

  const handleSelectAllOrders = (isChecked) => {
    if (isChecked) {
      setSelectedOrders(tenDaysData.map((order) => order.orderNo));
    } else {
      setSelectedOrders([]);
    }
  };

  // const handleStatusChange = (orderNo, status) => {
  //   setOrderStatuses(prev => ({
  //     ...prev,
  //     [orderNo]: status
  //   }));
  // };

  const handleRemarkChange = (orderNo, remark) => {
    setOrderRemarks((prev) => ({
      ...prev,
      [orderNo]: remark,
    }));
  };

  // Update the submit function to include status and remarks
  const handleStatusChange = (orderNo, status) => {
    setOrderStatuses((prev) => ({
      ...prev,
      [orderNo]: status,
    }));

    // Clear date if status is "done"
    if (status === "done") {
      setOrderDates((prev) => ({
        ...prev,
        [orderNo]: "",
      }));
    }
  };

  // 3. Add handleDateChange function
  const handleDateChange = (orderNo, date) => {
    setOrderDates((prev) => ({
      ...prev,
      [orderNo]: date,
    }));
  };

  // 4. Update handleSubmitSelected function to include dates
  const handleSubmitSelected = async () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to submit");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("action", "updateTenDaysOrders");
      formData.append("sheetName", "ORDER-DISPATCH");

      // Prepare data with status, remarks, and dates
      const ordersData = selectedOrders.map((orderNo) => ({
        orderNo,
        status: orderStatuses[orderNo] || "pending",
        remark: orderRemarks[orderNo] || "",
        date: orderDates[orderNo] || "", // Add date to the data
      }));

      formData.append("ordersData", JSON.stringify(ordersData));

      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbyzW8-RldYx917QpAfO4kY-T8_ntg__T0sbr7Yup2ZTVb1FC5H1g6TYuJgAU6wTquVM/exec",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Selected orders updated successfully!");
        setSelectedOrders([]);
        // Clear the status, remarks, and dates for submitted orders
        const newStatuses = { ...orderStatuses };
        const newRemarks = { ...orderRemarks };
        const newDates = { ...orderDates };
        selectedOrders.forEach((orderNo) => {
          delete newStatuses[orderNo];
          delete newRemarks[orderNo];
          delete newDates[orderNo];
        });
        setOrderStatuses(newStatuses);
        setOrderRemarks(newRemarks);
        setOrderDates(newDates);
        // Refresh the data
        fetchTenDaysData();
      } else {
        alert("Error updating orders: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting orders:", error);
      alert("Error submitting orders: " + error.message);
    }
    setIsSubmitting(false);
  };

  // 4. Create a function to convert callingDaysFilter to dateFilters object
  const getDateFiltersFromCallingDays = () => {
    const dateFilters = {};

    if (callingDaysFilter.includes("today")) {
      dateFilters.today = true;
    }

    if (callingDaysFilter.includes("overdue")) {
      dateFilters.overdue = true;
    }

    if (callingDaysFilter.includes("upcoming")) {
      dateFilters.upcoming = true;
    }

    if (callingDaysFilter.includes("older")) {
      dateFilters.older = true;
    }

    return dateFilters;
  };

  // Fetch data when tab changes or page changes
  useEffect(() => {
    if (isSearching) {
      return;
    }

    const fetchData = async () => {
      // Get date filters from callingDaysFilter
      const dateFilters = getDateFiltersFromCallingDays();

      switch (activeTab) {
        case "pending":
          await fetchPendingData(
            pendingPage,
            searchTerm,
            pendingPage > 1,
            dateFilters
          );
          break;
        case "history":
          await fetchHistoryData(
            historyPage,
            searchTerm,
            historyPage > 1,
            dateFilters
          );
          break;
        case "directEnquiry":
          await fetchDirectEnquiryData(
            directEnquiryPage,
            searchTerm,
            directEnquiryPage > 1,
            dateFilters
          );
          break;
      }
    };

    fetchData();
  }, [
    activeTab,
    pendingPage,
    historyPage,
    directEnquiryPage,
    callingDaysFilter,
    scNameFilter,
  ]);

  // Handle search with debounce
  // 6. Update the search useEffect to handle date filters
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        setIsSearching(true);
        // Reset pagination and fetch with search term
        setPendingPage(1);
        setHistoryPage(1);
        setDirectEnquiryPage(1);

        // Reset hasMore flags for search
        setHasMorePending(true);
        setHasMoreHistory(true);
        setHasMoreDirectEnquiry(true);

        // Get date filters from callingDaysFilter
        const dateFilters = getDateFiltersFromCallingDays();

        const performSearch = async () => {
          switch (activeTab) {
            case "pending":
              await fetchPendingData(1, searchTerm, false, dateFilters);
              break;
            case "history":
              await fetchHistoryData(1, searchTerm, false, dateFilters);
              break;
            case "directEnquiry":
              await fetchDirectEnquiryData(1, searchTerm, false, dateFilters);
              break;
          }
          setIsSearching(false);
        };

        performSearch();
      } else if (isSearching) {
        // Clear search and reset to normal pagination
        setIsSearching(false);
        setPendingPage(1);
        setHistoryPage(1);
        setDirectEnquiryPage(1);

        // Reset hasMore flags
        setHasMorePending(true);
        setHasMoreHistory(true);
        setHasMoreDirectEnquiry(true);

        // Get date filters from callingDaysFilter
        const dateFilters = getDateFiltersFromCallingDays();

        const resetData = async () => {
          switch (activeTab) {
            case "pending":
              await fetchPendingData(1, "", false, dateFilters);
              break;
            case "history":
              await fetchHistoryData(1, "", false, dateFilters);
              break;
            case "directEnquiry":
              await fetchDirectEnquiryData(1, "", false, dateFilters);
              break;
          }
        };

        resetData();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm, activeTab, callingDaysFilter, scNameFilter]);

  // Handle checkbox selection - populate form fields with existing data
  useEffect(() => {
    selectedOrders.forEach((orderNo) => {
      const order = tenDaysData.find((o) => o.orderNo === orderNo);
      if (order) {
        // Only set if not already set (to avoid overwriting user changes)
        if (!orderStatuses[orderNo]) {
          setOrderStatuses((prev) => ({
            ...prev,
            [orderNo]: order.existingStatus || "pending",
          }));
        }
        if (!orderDates[orderNo]) {
          setOrderDates((prev) => ({
            ...prev,
            [orderNo]: order.existingDate || "",
          }));
        }
        if (!orderRemarks[orderNo]) {
          setOrderRemarks((prev) => ({
            ...prev,
            [orderNo]: order.existingRemarks || "",
          }));
        }
      }
    });
  }, [selectedOrders, tenDaysData]);

  const LoadingIndicator = () => {
    if (!isLoading) return null;

    return (
      <div className="flex justify-center items-center py-4 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-full border-b-2 border-purple-600 animate-spin"></div>
          <span className="text-sm text-gray-600">Loading more data...</span>
        </div>
      </div>
    );
  };

  // Function to fetch all unique SC names for the filter dropdown
  const fetchUniqueScNames = useCallback(async () => {
    if (!isAdmin()) return; // Only admins need to see all SC names

    try {
      const { data: scData, error: scError } = await supabase
        .from("dropdown")
        .select("value")
        .eq("category", "sc_name")
        .not("value", "is", null);

      if (scError) {
        console.error("Error fetching SC names from dropdown:", scError);
      }

      const uniqueNames = Array.from(
        new Set((scData || []).map(item => item.value).filter(Boolean))
      ).sort();

      setUniqueScNames({
        pending: uniqueNames,
        directEnquiry: uniqueNames,
        history: uniqueNames
      });
    } catch (error) {
      console.error("Error fetching unique SC names:", error);
    }
  }, [isAdmin]);



  // Reset pagination when tab changes
  useEffect(() => {
    // Reset all pagination when active tab changes
    setPendingPage(1);
    setHistoryPage(1);
    setDirectEnquiryPage(1);
    setHasMorePending(true);
    setHasMoreHistory(true);
    setHasMoreDirectEnquiry(true);

    // Clear existing data to prevent stale data
    if (activeTab === "pending") {
      setPendingData([]);
    } else if (activeTab === "history") {
      setHistoryData([]);
    } else if (activeTab === "directEnquiry") {
      setDirectEnquiryData([]);
    }
  }, [activeTab]);

  // Fetch unique SC names on component mount
  useEffect(() => {
    fetchUniqueScNames();
  }, [fetchUniqueScNames]);

  useEffect(() => {
    if (
      callingDaysFilter.length > 0 ||
      enquiryNoFilter.length > 0 ||
      currentStageFilter.length > 0
    ) {
      // Reset pagination when filters are applied
      setPendingPage(1);
      setHistoryPage(1);
      setDirectEnquiryPage(1);
      setHasMorePending(true);
      setHasMoreHistory(true);
      setHasMoreDirectEnquiry(true);
    }
  }, [callingDaysFilter, enquiryNoFilter, currentStageFilter]);

  // NEW: Update available enquiry numbers when data changes or tab changes
  useEffect(() => {
    let enquiryNos = [];

    switch (activeTab) {
      case "pending":
        enquiryNos = [
          ...new Set(pendingData.map((item) => item.lead_no).filter(Boolean)),
        ];
        break;
      case "directEnquiry":
        enquiryNos = [
          ...new Set(
            directEnquiryData.map((item) => item.enquiry_no).filter(Boolean)
          ),
        ];
        break;
      case "history":
        enquiryNos = [
          ...new Set(historyData.map((item) => item.enquiryNo).filter(Boolean)),
        ];
        break;
      default:
        enquiryNos = [];
    }

    setAvailableEnquiryNos(enquiryNos.sort());
  }, [activeTab, pendingData, directEnquiryData, historyData]);

  // Filter data based on current filters
  const filterTrackers = (tracker, activeTab) => {
    // Enquiry number filter
    if (enquiryNoFilter.length > 0) {
      let enquiryNo = "";

      if (activeTab === "pending") {
        enquiryNo = tracker.lead_no || "";
      } else if (activeTab === "directEnquiry") {
        enquiryNo = tracker.enquiry_no || "";
      } else if (activeTab === "history") {
        enquiryNo = tracker.enquiryNo || "";
      }

      if (!enquiryNoFilter.includes(enquiryNo)) return false;
    }

    // Current stage filter
    if (currentStageFilter.length > 0) {
      const currentStage =
        tracker.currentStage ||
        tracker.Current_Stage ||
        tracker.current_stage ||
        "";
      if (!currentStageFilter.includes(currentStage)) return false;
    }

    // Calling days filter
    if (callingDaysFilter.length > 0) {
      let dateValue = "";
      if (activeTab === "pending") {
        dateValue = tracker.nextCallDate1 || tracker.Calling_Days || "";
      } else if (activeTab === "directEnquiry") {
        dateValue = tracker.nextCallDate || tracker.calling_days || "";
      } else if (activeTab === "history") {
        dateValue = tracker.nextCallDate || "";
      }

      if (!matchesCallingDaysFilter(dateValue, activeTab)) return false;
    }

    return true;
  };

  const filteredPendingCallTrackers = pendingData;
  const filteredHistoryCallTrackers = historyData;
  const filteredDirectEnquiryPendingTrackers = directEnquiryData;

  // NEW: Get available serial numbers based on active tab
  const getAvailableSerialNumbers = () => {
    let data = [];
    switch (activeTab) {
      case "pending":
        data = pendingData;
        break;
      case "directEnquiry":
        data = directEnquiryData;
        break;
      case "history":
        data = historyData;
        break;
      default:
        data = [];
    }
    return data.map((item) => item.serialNo).sort((a, b) => a - b);
  };

  // Toggle dropdown visibility functions
  const toggleCallingDaysDropdown = (e) => {
    e.stopPropagation();
    setShowCallingDaysDropdown(!showCallingDaysDropdown);
    setShowEnquiryNoDropdown(false);
    setShowCurrentStageDropdown(false);
    setShowSerialDropdown(false); // NEW
  };

  const toggleEnquiryNoDropdown = (e) => {
    e.stopPropagation();
    setShowEnquiryNoDropdown(!showEnquiryNoDropdown);
    setShowCallingDaysDropdown(false);
    setShowCurrentStageDropdown(false);
    setShowSerialDropdown(false); // NEW
  };

  const toggleCurrentStageDropdown = (e) => {
    e.stopPropagation();
    setShowCurrentStageDropdown(!showCurrentStageDropdown);
    setShowCallingDaysDropdown(false);
    setShowEnquiryNoDropdown(false);
    setShowSerialDropdown(false); // NEW
  };

  // NEW: Toggle serial dropdown
  const toggleSerialDropdown = (e) => {
    e.stopPropagation();
    setShowSerialDropdown(!showSerialDropdown);
    setShowCallingDaysDropdown(false);
    setShowEnquiryNoDropdown(false);
    setShowCurrentStageDropdown(false);
  };

  // Handle checkbox changes
  const handleCallingDaysChange = (value) => {
    if (callingDaysFilter.includes(value)) {
      setCallingDaysFilter(callingDaysFilter.filter((item) => item !== value));
    } else {
      setCallingDaysFilter([...callingDaysFilter, value]);
    }
  };

  const handleEnquiryNoChange = (value) => {
    if (enquiryNoFilter.includes(value)) {
      setEnquiryNoFilter(enquiryNoFilter.filter((item) => item !== value));
    } else {
      setEnquiryNoFilter([...enquiryNoFilter, value]);
    }
  };

  useEffect(() => {
    if (isSearching) {
      return;
    }

    const fetchData = async () => {
      // Get date filters from callingDaysFilter
      const dateFilters = getDateFiltersFromCallingDays();

      switch (activeTab) {
        case "pending":
          await fetchPendingData(
            pendingPage,
            searchTerm,
            pendingPage > 1,
            dateFilters
          );
          break;
        case "history":
          await fetchHistoryData(
            historyPage,
            searchTerm,
            historyPage > 1,
            dateFilters
          );
          break;
        case "directEnquiry":
          await fetchDirectEnquiryData(
            directEnquiryPage,
            searchTerm,
            directEnquiryPage > 1,
            dateFilters
          );
          break;
        case "tenDays":
          await fetchTenDaysData();
          break;
      }
    };

    fetchData();
  }, [
    activeTab,
    pendingPage,
    historyPage,
    directEnquiryPage,
    callingDaysFilter,
    scNameFilter,
  ]);

  const handleCurrentStageChange = (value) => {
    if (currentStageFilter.includes(value)) {
      setCurrentStageFilter(
        currentStageFilter.filter((item) => item !== value)
      );
    } else {
      setCurrentStageFilter([...currentStageFilter, value]);
    }
  };

  // NEW: Handle serial number filter change
  const handleSerialChange = (value) => {
    if (serialFilter.includes(value)) {
      setSerialFilter(serialFilter.filter((item) => item !== value));
    } else {
      setSerialFilter([...serialFilter, value]);
    }
  };

  const fetchCallingDaysCounts = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      const role = localStorage.getItem("userType");
      // Helper function to conditionally apply user filter
      const withRoleFilter = (table) => {
        const query = supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        if (role === "user" && currentUser?.username && (table === "enquiries" || table === "client_master")) {
          const usernamesToFilter = getUsernamesToFilter();
          return query.in("sales_coordinator_name", usernamesToFilter);
        } else if (role === "user" && currentUser?.username && table === "leads") {
          const usernamesToFilter = getUsernamesToFilter();
          return query.in("sc_name", usernamesToFilter);
        }
        return query;
      };

      // Leads
      const { count: pendingToday } = await withRoleFilter("enquiry_tracker_for_leads")
        .is("is_order_received_status", null)
        .eq("next_call_date", today);

      const { count: pendingOverdue } = await withRoleFilter("enquiry_tracker_for_leads")
        .is("is_order_received_status", null)
        .lt("next_call_date", today);

      const { count: pendingUpcoming } = await withRoleFilter("enquiry_tracker_for_leads")
        .is("is_order_received_status", null)
        .gt("next_call_date", today);

      // Direct Enquiries
      const { count: directToday } = await withRoleFilter("enquiry_tracker")
        .is("is_order_received_status", null)
        .eq("next_call_date", today);

      const { count: directOverdue } = await withRoleFilter("enquiry_tracker")
        .is("is_order_received_status", null)
        .lt("next_call_date", today);

      const { count: directUpcoming } = await withRoleFilter("enquiry_tracker")
        .is("is_order_received_status", null)
        .gt("next_call_date", today);

      // History
      const { count: historyToday } = await withRoleFilter("enquiry_tracker")
        .not("is_order_received_status", "is", null)
        .eq("next_call_date", today);

      const { count: historyOlder } = await withRoleFilter(
        "enquiry_tracker"
      ).not("is_order_received_status", "is", null).lt("next_call_date", today);

      setCallingDaysCounts({
        pendingToday: pendingToday || 0,
        pendingOverdue: pendingOverdue || 0,
        pendingUpcoming: pendingUpcoming || 0,
        directToday: directToday || 0,
        directOverdue: directOverdue || 0,
        directUpcoming: directUpcoming || 0,
        historyToday: historyToday || 0,
        historyOlder: historyOlder || 0,
      });
    } catch (error) {
      console.error("Error fetching calling days counts:", error);
    }
  };

  useEffect(() => {
    fetchCallingDaysCounts();
  }, []);

  // Add this function inside your CallTracker component
  // Replace your calculateFilterCounts function with this:
  const calculateFilterCounts = () => {
    const counts = {
      today: 0,
      overdue: 0,
      upcoming: 0,
      older: 0,
    };

    if (activeTab === "pending") {
      pendingData.forEach((tracker) => {
        const nextCallDate1 =
          tracker.nextCallDate1 || tracker.Calling_Days || "";
        if (isToday(nextCallDate1)) counts.today++;
        else if (isOverdue(nextCallDate1)) counts.overdue++;
        else if (isUpcoming(nextCallDate1)) counts.upcoming++;
      });
    } else if (activeTab === "directEnquiry") {
      directEnquiryData.forEach((tracker) => {
        const nextCallDate = tracker.nextCallDate || tracker.calling_days || "";
        if (isToday(nextCallDate)) counts.today++;
        else if (isOverdue(nextCallDate)) counts.overdue++;
        else if (isUpcoming(nextCallDate)) counts.upcoming++;
      });
    } else if (activeTab === "history") {
      historyData.forEach((tracker) => {
        const nextCallDate = tracker.nextCallDate || "";
        if (isToday(nextCallDate)) counts.today++;
        else if (isOverdue(nextCallDate)) counts.older++;
        else if (nextCallDate) counts.older++; // Any date that's not today
      });
    }

    return counts;
  };

  const filterCounts = calculateFilterCounts();

  // Mobile Card View Component for CallTracker
  const MobileCardView = ({ data, type, onProcess, onView }) => {
    const formatItemQty = (itemQtyString) => {
      if (!itemQtyString) return "";

      // Since the data is now pre-formatted by aggregateItemsForSummary,
      // we don't need to parse it as JSON here.
      return itemQtyString;
    };

    if (type === "pending") {
      return (
        <div className="space-y-4 md:hidden">
          {data.map((tracker, index) => (
            <div
              key={index}
              className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-lg"
            >
              {/* Header Section */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {tracker.lead_no}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      tracker.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : tracker.priority === "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tracker.Lead_Source}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="mr-1 w-4 h-4"
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
                  <span>{tracker.Lead_Receiver_Name}</span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="mb-1 text-xs text-gray-500">Company</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tracker.Company_Name}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="mb-1 text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">
                      {tracker.Phone_Number}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="mb-1 text-xs text-gray-500">Salesperson</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tracker.salesperson_Name}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="mb-1 text-xs text-gray-500">Call Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {tracker.Timestamp}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="mb-1 text-xs text-gray-500">Current Stage</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tracker.Current_Stage}
                  </p>
                </div>

                {tracker.itemQty && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="mb-1 text-xs font-medium text-amber-600">
                      Items
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatItemQty(tracker.itemQty)}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="px-4 pb-4">
                <Link
                  state={{ activeTab: "pending", sc_name: tracker.sc_name }}
                  to={`/enquiry-tracker/form?leadId=${tracker.lead_no}`}
                  className="flex justify-center items-center px-4 py-3 w-full text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
                >
                  <ArrowRightIcon className="mr-2 w-5 h-5" />
                  Process Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      );
    } else if (type === "directEnquiry") {
      return (
        <div className="space-y-4 md:hidden">
          {data.map((tracker, index) => (
            <div
              key={index}
              className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-lg"
            >
              {/* Header Section */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {tracker.enquiry_no}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      tracker.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : tracker.priority === "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tracker.lead_source}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="mr-1 w-4 h-4"
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
                  <span>{tracker.lead_receiver_name}</span>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="mb-1 text-xs text-gray-500">Company</p>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tracker.company_name}
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="mb-1 text-xs text-gray-500">Call Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {tracker.timestamp}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="mb-1 text-xs text-gray-500">Current Stage</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tracker.current_stage}
                  </p>
                </div>

                {tracker.item_qty && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="mb-1 text-xs font-medium text-amber-600">
                      Items
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatItemQty(tracker.item_qty)}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Section */}
              <div className="flex px-4 pb-4 space-x-2">
                <Link
                  state={{
                    activeTab: "directEnquiry",
                    sc_name: tracker.sc_name,
                  }}
                  to={`/enquiry-tracker/form?leadId=${tracker.enquiry_no}`}
                  className="flex flex-1 justify-center items-center px-4 py-3 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-md transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
                >
                  <ArrowRightIcon className="mr-2 w-5 h-5" />
                  Process
                </Link>
                <button
                  onClick={() => onView(tracker)}
                  className="flex-1 px-4 py-3 text-gray-700 rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // History tab mobile view
      return (
        <div className="space-y-4 md:hidden">
          {data.map((tracker, index) => (
            <div
              key={index}
              className="overflow-hidden bg-white rounded-xl border border-gray-100 shadow-lg"
            >
              {/* Header Section */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {tracker.enquiryNo}
                  </h3>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      tracker.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : tracker.priority === "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {tracker.enquiryStatus}
                  </span>
                </div>
                {tracker.Timestamp && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg
                      className="mr-1 w-4 h-4"
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
                    <span>{tracker.Timestamp}</span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-4 space-y-3">
                {tracker.customerFeedback && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="flex items-center mb-1 text-xs font-medium text-blue-600">
                      <svg
                        className="mr-1 w-4 h-4"
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
                    <p className="text-sm italic text-gray-800">
                      "{tracker.customerFeedback}"
                    </p>
                  </div>
                )}

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="mb-1 text-xs text-gray-500">Current Stage</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tracker.currentStage}
                  </p>
                </div>

                {tracker.nextCallDate && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <p className="flex items-center mb-1 text-xs font-medium text-green-600">
                      <svg
                        className="mr-1 w-4 h-4"
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
                      {tracker.nextCallDate}{" "}
                      {tracker.nextCallTime && `at ${tracker.nextCallTime}`}
                    </p>
                  </div>
                )}

                {tracker.orderStatus && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="mb-1 text-xs font-medium text-purple-600">
                      Order Status
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {tracker.orderStatus}
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

  // ─── Merge directEnquiry into pending and Deduplicate ─────────────────────────
  const allPendingRaw = [
    ...(pendingData || []),
    ...(directEnquiryData || [])
  ];
  
  const pendingMap = new Map();
  allPendingRaw.forEach(item => {
    const id = item.lead_no || item.leadNo || item.enquiry_no || item.dbId || item.id;
    const isLead = item.tableSource === 'leads_to_order' || item.tableSource === 'leads' || String(id || '').toUpperCase().startsWith('LD-');
    if (id && !pendingMap.has(id)) {
      pendingMap.set(id, {
        ...item,
        enquiryType: isLead ? 'Lead' : 'Direct Enquiry'
      });
    } else if (!id) {
      // Fallback for items without a clear ID
      pendingMap.set(Math.random(), {
        ...item,
        enquiryType: isLead ? 'Lead' : 'Direct Enquiry'
      });
    }
  });
  
  const mergedPending = Array.from(pendingMap.values());

  // ─── Filtered data (client-side search + filter) ──────────────────────────
  const applyFilters = (list, tab) => list.filter(tracker => {
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      if (!Object.values(tracker).some(v => v && v.toString().toLowerCase().includes(t))) return false;
    }
    if (enquiryNoFilter.length > 0) {
      const no = tab === "history" ? tracker.enquiryNo : tracker.leadNo;
      if (!enquiryNoFilter.includes(no)) return false;
    }
    if (currentStageFilter.length > 0) {
      if (!currentStageFilter.includes(tracker.currentStage || "")) return false;
    }
    if (callingDaysFilter.length > 0) {
      const dateVal = tab === "history"
        ? (tracker.nextCallDate || "")
        : (tracker.nextCallDate1 || tracker.Calling_Days || tracker.callingDate || "");
      if (tab === "history") {
        const ok = callingDaysFilter.some(f => {
          if (f === "today") return isToday(dateVal);
          if (f === "older") return !isToday(dateVal) && !!dateVal;
          return false;
        });
        if (!ok) return false;
      } else {
        const dl = dateVal.toLowerCase();
        const ok = callingDaysFilter.some(f => {
          if (f === "today") return dl.includes("today");
          if (f === "overdue") return dl.includes("overdue");
          if (f === "upcoming") return dl.includes("upcoming");
          return false;
        });
        if (!ok) return false;
      }
    }
    return true;
  });

  const filteredPending = applyFilters(mergedPending, "pending");
  const filteredHistory = applyFilters(historyData || [], "history");

  // ─── Pagination ───────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchTerm, callingDaysFilter, enquiryNoFilter, currentStageFilter]);

  const currentData = activeTab === "pending" ? filteredPending : filteredHistory;
  const totalPages = Math.max(1, Math.ceil(currentData.length / itemsPerPage));
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);




  // ─── Column visibility for pending (using visiblePendingColumns) ──────────
  const handleSelectAllPending = () => {
    const all = Object.values(visiblePendingColumns).every(Boolean);
    setVisiblePendingColumns(Object.fromEntries(Object.keys(visiblePendingColumns).map(k => [k, !all])));
  };
  const handleColumnTogglePending = (key) => {
    setVisiblePendingColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Row render helpers ───────────────────────────────────────────────────
  const renderRowCells = (tracker, visibleState, isEditing = false, config = columnsConfig) => {
    return config.map(opt => {
      if (!visibleState[opt.key]) return null;
      if (opt.key === "salespersonName" && !isAdmin()) return null;

      const val = tracker[opt.key] ??
        tracker[opt.key.replace(/([A-Z])/g, '_$1').toLowerCase()] ??
        (opt.key.startsWith("itemQty") && opt.key.length === 8 ? (tracker[`quantity${opt.key.slice(-1)}`] || tracker[`Quantity${opt.key.slice(-1)}`]) : null) ??
        (opt.key === "leadId" ? (tracker.leadNo || tracker.lead_no || tracker.enquiryNo || tracker.enquiry_no || tracker.leadId) : null) ??
        (opt.key === "phoneNumber" ? (tracker.phoneNo || tracker.Phone_Number || tracker.phoneNumber) : null) ??
        (opt.key === "companyName" ? (tracker.Company_Name || tracker.company_name || tracker.companyName) : null) ??
        (opt.key === "salespersonName" ? (tracker.salesperson_Name || tracker.sales_co_ordinator_name || tracker.salespersonName || tracker.sales_coordinator || tracker.sc_name) : null) ??
        (opt.key === "customerFeedback" ? (tracker.customerSay || tracker.What_Did_The_Customer_say || tracker.customerFeedback) : null) ??
        (opt.key === "nextCallDate" ? (tracker.nextCallDate1 || tracker.Calling_Days || tracker.nextCallDate) : null) ??
        (opt.key === "nextCallTime" ? (tracker.nextCallTime1 || tracker.nextCallTime) : null) ??
        (opt.key === "leadSource" ? (tracker.Lead_Source || tracker.lead_source || tracker.leadSource) : null) ??
        (opt.key === "currentStage" ? (tracker.Current_Stage || tracker.current_stage || tracker.currentStage) : null) ??
        "—";

      let cellContent = val !== undefined && val !== null ? String(val) : "—";

      if (isEditing && opt.key === "currentStage") {
        const currentVal = editedData.Current_Stage || editedData.currentStage || val || "";
        cellContent = (
          <select
            value={currentVal}
            onChange={(e) => {
              handleFieldChange("Current_Stage", e.target.value);
              handleFieldChange("currentStage", e.target.value);
            }}
            className="p-1 border border-slate-300 rounded text-xs font-medium bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">Select Stage</option>
            <option value="make-quotation">make-quotation</option>
            <option value="quotation-validation">quotation-validation</option>
            <option value="order-expected">order-expected</option>
            <option value="order-status">order-status</option>
          </select>
        );
      } else if (opt.key === "companyName") {
        cellContent = (
          <div className="flex items-center">
            <BuildingIcon className="h-4 w-4 mr-2 text-slate-400 shrink-0" />
            <span className="truncate">{val || "—"}</span>
          </div>
        );
      } else if (opt.key === "leadSource" || opt.key === "enquiryStatus") {
        cellContent = val && val !== "—" ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {val}
          </span>
        ) : "—";
      } else if (opt.key === "shippingAddress") {
        cellContent = (
          <div className="max-w-[200px] truncate" title={val}>
            {val || "—"}
          </div>
        );
      } else if (opt.key === "itemQty") {
        cellContent = (
          <div className="min-w-[300px] break-words whitespace-normal" title={formatItemQty(val)}>
            {formatItemQty(val) || "—"}
          </div>
        );
      } else if (opt.key === "quotationUpload" || opt.key === "acceptanceFile" || opt.key === "apologyVideo") {
        cellContent = val && val !== "—" ? (
          <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {opt.key === "apologyVideo" ? "View Video" : "View File"}
          </a>
        ) : "—";
      } else if (opt.key === "customerFeedback" || opt.key === "quotationRemarks" || opt.key === "validationRemark" || opt.key === "reasonRemark" || opt.key === "holdRemark") {
        cellContent = (
          <div className="max-w-[200px] truncate" title={val}>
            {val || "—"}
          </div>
        );
      }

      return (
        <td key={opt.key} className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
          {cellContent}
        </td>
      );
    });
  };

  const renderPendingRow = (tracker, index) => (
    <tr key={tracker.id || index} className="hover:bg-slate-50 transition-colors group">
      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[1px_0_0_0_#e5e7eb] border-r border-gray-200">
        <div className="flex gap-2">
          <Link
            to={`/enquiry-tracker/form?leadId=${tracker.leadNo || tracker.lead_no || tracker.leadId || tracker.enquiryNo || tracker.enquiry_no}`}
            state={{ activeTab: "pending", sc_name: tracker.sc_name }}
          >
            <button className="px-2 py-1 text-xs border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md">
              Process <ArrowRightIcon className="ml-1 h-3 w-3 inline" />
            </button>
          </Link>
          {editingRowId === index ? (
            <div className="flex gap-1">
              <button onClick={() => handleSaveClick(index)} className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">Save</button>
              <button onClick={() => setEditingRowId(null)} className="px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500">Cancel</button>
            </div>
          ) : (
            <button onClick={() => handleEditClick(tracker, index)} className="px-2 py-1 text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md">Edit</button>
          )}
        </div>
      </td>
      {renderRowCells(tracker, visiblePendingColumns, editingRowId === index)}
    </tr>
  );

  const renderHistoryRow = (tracker, index) => (
    <tr key={tracker.id || index} className="hover:bg-slate-50 transition-colors">
      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
        <button onClick={() => { setSelectedTracker(tracker); setShowPopup(true); }} className="px-3 py-1 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md">
          View
        </button>
      </td>
      {renderRowCells(tracker, visibleColumns, false, historyColumnsConfig)}
    </tr>
  );

  const renderPendingCard = (tracker, index) => (
    <div key={tracker.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="text-xs font-semibold text-gray-500">{tracker.timestamp}</span>
          <h3 className="font-bold text-gray-900 mt-1">{tracker.companyName}</h3>
          <p className="text-xs text-blue-600 font-medium">{tracker.leadNo || tracker.lead_no}</p>
        </div>
        <div className="text-right">
          <span className="block text-xs text-gray-400">Person</span>
          <span className="text-sm font-medium">{tracker.salespersonName}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div><span className="block text-xs text-gray-400">Phone</span><p className="font-medium">{tracker.phoneNo}</p></div>
        <div><span className="block text-xs text-gray-400">Stage</span><p className="text-sky-600 font-medium">{tracker.currentStage || "Pending"}</p></div>
      </div>
      <div className="pt-2 border-t border-gray-100 flex justify-end">
        <Link
          to={`/enquiry-tracker/form?leadId=${tracker.leadNo || tracker.lead_no}`}
          state={{ activeTab: "pending", sc_name: tracker.sc_name }}
          className="w-full"
        >
          <button className="flex items-center justify-center w-full px-3 py-2 text-sm border border-sky-200 text-sky-600 hover:bg-sky-50 rounded-md font-medium">
            Process <ArrowRightIcon className="ml-1 h-3 w-3" />
          </button>
        </Link>
      </div>
    </div>
  );

  const renderHistoryCard = (tracker, index) => (
    <div key={tracker.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-gray-500">{tracker.timestamp}</span>
          <h3 className="font-bold text-gray-900">{tracker.companyName}</h3>
          <p className="text-xs text-blue-600 font-medium">{tracker.enquiryNo}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <div><span className="block text-xs text-gray-400">Stage</span><p className="text-sky-600 font-medium">{tracker.currentStage}</p></div>
        <div><span className="block text-xs text-gray-400">Status</span><p>{tracker.enquiryStatus}</p></div>
      </div>
      <div className="pt-2 border-t border-gray-100">
        <button onClick={() => { setSelectedTracker(tracker); setShowPopup(true); }} className="w-full flex items-center justify-center px-3 py-2 text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-md font-medium">
          View
        </button>
      </div>
    </div>
  );

  // ─── Headers ─────────────────────────────────────────────────────────────
  const getHeaders = () => {
    if (activeTab === "pending") {
      const baseHeaders = [
        { label: "Actions", className: "sticky left-0 bg-gray-50 z-30 shadow-[1px_0_0_0_#e5e7eb] border-r border-gray-200" }
      ];
      columnsConfig.forEach(opt => {
        if (visiblePendingColumns[opt.key]) {
          if (opt.key === "salespersonName") {
            if (isAdmin()) baseHeaders.push(opt.label);
          } else {
            baseHeaders.push(opt.label);
          }
        }
      });
      return baseHeaders;
    }

    const historyHeaders = [
      "Actions",
      ...historyColumnsConfig
        .filter(opt => visibleColumns[opt.key])
        .filter(opt => opt.key !== "salespersonName" || isAdmin())
        .map(opt => opt.label)
    ];
    return historyHeaders;
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 w-full p-1 md:p-1.5">
      <EnquiryTrackerFilter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        callingDaysFilter={callingDaysFilter}
        setCallingDaysFilter={setCallingDaysFilter}
        enquiryNoFilter={enquiryNoFilter}
        setEnquiryNoFilter={setEnquiryNoFilter}
        currentStageFilter={currentStageFilter}
        setCurrentStageFilter={setCurrentStageFilter}
        filterCounts={filterCounts}
        showColumnDropdown={showColumnDropdown}
        setShowColumnDropdown={setShowColumnDropdown}
        visibleColumns={visibleColumns}
        handleSelectAll={handleSelectAll}
        handleColumnToggle={handleColumnToggle}
        columnOptions={columnOptions}
        visiblePendingColumns={visiblePendingColumns}
        handleSelectAllPending={handleSelectAllPending}
        handleColumnTogglePending={handleColumnTogglePending}
        pendingColumnOptions={pendingColumnOptions}
        setShowNewCallTrackerForm={setShowNewCallTrackerForm}
        pendingCallTrackers={mergedPending}
        historyCallTrackers={historyData}
      />

      <div className="flex-1 flex flex-col min-h-0 mt-1">
        {isLoading ? (
          <div className="p-8 text-center flex-1 flex flex-col justify-center items-center bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-4"></div>
            <p className="text-slate-500">Loading Enquiry tracker data...</p>
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
            minWidth="min-w-[1200px]"
          />
        )}
      </div>

      {/* New Enquiry Form Modal */}
      {showNewCallTrackerForm && (
        <DirectEnquiryForm
          onClose={(shouldRefresh) => {
            setShowNewCallTrackerForm(false);
            if (shouldRefresh) {
              const dateFilters = getDateFiltersFromCallingDays();
              fetchPendingData(1, searchTerm, false, dateFilters);
              fetchDirectEnquiryData(1, searchTerm, false, dateFilters);
            }
          }}
        />
      )}

      {/* View Popup Modal */}
      {showPopup && selectedTracker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPopup(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "pending" ? `Enquiry Details: ${selectedTracker?.leadNo || selectedTracker?.lead_no}` : `Enquiry History: ${selectedTracker?.enquiryNo}`}
              </h3>
              <button onClick={() => setShowPopup(false)} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {columnOptions.filter(o => visibleColumns[o.key]).map(o => (
                  <div key={o.key} className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">{o.label}</p>
                    <p className="text-base">{selectedTracker[o.key] ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t p-4 flex justify-end gap-3">
              <button onClick={() => setShowPopup(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Close</button>
              {activeTab === "pending" && (
                <Link
                  to={`/enquiry-tracker/form?leadId=${selectedTracker?.leadNo || selectedTracker?.lead_no}`}
                  state={{ activeTab: "pending", sc_name: selectedTracker?.sc_name }}
                >
                  <button className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-medium rounded-md">
                    Process <ArrowRightIcon className="ml-1 h-4 w-4 inline" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnquiryTracker;
