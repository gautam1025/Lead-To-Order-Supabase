"use client";

import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PlusIcon,
  SearchIcon,
  ArrowRightIcon,
  BuildingIcon,
} from "../components/Icons";
import { AuthContext } from "../App";
import CallTrackerForm from "./Call-Tracker-Form";
import supabase from "../utils/supabase";

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

function CallTracker() {
  const isMobile = useIsMobile();
  const { currentUser, userType, isAdmin, getUsernamesToFilter } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [tenDaysSearchTerm, setTenDaysSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
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

  const [visibleColumns, setVisibleColumns] = useState({
    timestamp: true,
    enquiryNo: true,
    enquiryStatus: true,
    customerFeedback: true,
    currentStage: true,
    sendQuotationNo: true,
    quotationSharedBy: true,
    quotationNumber: true,
    valueWithoutTax: true,
    valueWithTax: true,
    quotationUpload: true,
    quotationRemarks: true,
    validatorName: true,
    sendStatus: true,
    validationRemark: true,
    faqVideo: true,
    productVideo: true,
    offerVideo: true,
    productCatalog: true,
    productImage: true,
    nextCallDate: true,
    nextCallTime: true,
    orderStatus: true,
    acceptanceVia: true,
    paymentMode: true,
    paymentTerms: true,
    transportMode: true,
    registrationFrom: true,
    orderVideo: true,
    acceptanceFile: true,
    orderRemark: true,
    apologyVideo: true,
    reasonStatus: true,
    reasonRemark: true,
    holdReason: true,
    holdingDate: true,
    holdRemark: true,
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Pending tab column visibility state
  const [visiblePendingColumns, setVisiblePendingColumns] = useState({
    actions: true,
    timestamp: true,
    leadNo: true,
    leadReceiverName: false,
    leadSource: true,
    phoneNo: true,
    salespersonName: true,
    companyName: true,
    currentStage: true,
    callingDate: true,
    assignedTo: true,
    itemQty: false,
    totalQty: true,
    customerSay: false,
    enquiryReceivedStatus: false,
    enquiryReceivedDate: false,
    enquiryForState: false,
    projectName: false,
    enquiryType: false,
    enquiryApproach: false,
    projectApproximateValue: false,
    itemName1: false,
    quantity1: false,
    itemName2: false,
    quantity2: false,
    itemName3: false,
    quantity3: false,
    itemName4: false,
    quantity4: false,
    itemName5: false,
    quantity5: false,
    nextAction: false,
    nextCallDate: false,
    nextCallTime: false,
  });
  const [showPendingColumnDropdown, setShowPendingColumnDropdown] = useState(false);

  // Direct Enquiry tab column visibility state
  const [visibleDirectEnquiryColumns, setVisibleDirectEnquiryColumns] = useState({
    actions: true,
    timestamp: true,
    enquiryNo: true,
    leadSource: true,
    companyName: true,
    phoneNo: true,
    salespersonName: true,
    currentStage: true,
    callingDate: true,
    assignedTo: true,
    itemQty: false,
    totalQty: true,
    shippingAddress: false,
    leadReceiverName: true,
    enquiryAssignToProject: false,
    gstNumber: false,
    enquiryDate: false,
    enquiryForState: false,
    projectName: false,
    salesType: false,
    enquiryApproach: false,
    itemName1: false,
    quantity1: false,
    itemName2: false,
    quantity2: false,
    itemName3: false,
    quantity3: false,
    itemName4: false,
    quantity4: false,
    itemName5: false,
    quantity5: false,
    itemName6: false,
    quantity6: false,
    itemName7: false,
    quantity7: false,
    itemName8: false,
    quantity8: false,
    itemName9: false,
    quantity9: false,
    itemName10: false,
    quantity10: false,
    enquiryStatus: false,
    customerFeedback: false,
    sendQuotationNo: false,
    quotationSharedBy: false,
    quotationNumber: false,
    quotationValueWithoutTax: false,
    quotationValueWithTax: false,
    quotationUpload: false,
    quotationRemarks: false,
    quotationValidatorName: false,
    quotationSendStatus: false,
    quotationValidationRemark: false,
    sendFaqVideo: false,
    sendProductVideo: false,
    sendOfferVideo: false,
    sendProductCatalog: false,
    sendProductImage: false,
    nextCallTime: false,
    isOrderReceivedStatus: false,
    ifNoReasonStatus: false,
    ifNoReasonRemark: false,
    customerOrderHoldReasonCategory: false,
    holdingDate: false,
    holdRemark: false,
    transportMode: false,
    conveyedForRegistrationForm: false,
    orderNo: false,
    amountWithGst: false,
    destination: false,
    poNumber: false,
  });
  const [showDirectEnquiryColumnDropdown, setShowDirectEnquiryColumnDropdown] = useState(false);

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

      const pendingUpdateData = {
        "LD-Lead-No": editedData.lead_no,
        "Lead_Receiver_Name": editedData.Lead_Receiver_Name,
        "Lead_Source": editedData.Lead_Source,
        "Phone_Number": editedData.Phone_Number,
        "Salesperson_Name": editedData.salesperson_Name,
        "Company_Name": editedData.Company_Name,
        "Current_Stage": editedData.Current_Stage,
        "Calling_Days": editedData.Calling_Days,
        "SC_Name": editedData.sc_name,
        "What_Did_The_Customer say?": editedData.What_Did_The_Customer_Say,
        "Enquiry_Received_Status": editedData.Enquiry_Received_Status,
        "Enquiry_Received_Date": convertDateToYYYYMMDD(editedData.Enquiry_Received_Date),
        "Enquiry_for_State": editedData.Enquiry_for_State,
        "Project_Name": editedData.Project_Name,
        "Enquiry_Type": editedData.Enquiry_Type,
        "Enquiry_Approach": editedData.Enquiry_Approach,
        "Project_Approximate_Value": editedData.Project_Approximate_Value,
        "Item_Name1": editedData.Item_Name1,
        "Quantity1": editedData.Quantity1,
        "Item_Name2": editedData.Item_Name2,
        "Quantity2": editedData.Quantity2,
        "Item_Name3": editedData.Item_Name3,
        "Quantity3": editedData.Quantity3,
        "Item_Name4": editedData.Item_Name4,
        "Quantity4": editedData.Quantity4,
        "Item_Name5": editedData.Item_Name5,
        "Quantity5": editedData.Quantity5,
        "Next_Action": editedData.Next_Action,
        "Next_Call_Date": convertDateToYYYYMMDD(editedData.Next_Call_Date_Field),
        "Next_Call_Time": convertTimeTo24Hour(editedData.Next_Call_Time),
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
        .from("leads_to_order")
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
        .from("enquiry_to_order")
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

    // Handle History tab - existing logic for enquiry_tracker
    const updateData = {
      "Enquiry Status": editedData.enquiryStatus,
      "What Did Customer Say": editedData.customerFeedback,
      "Current Stage": editedData.currentStage,
      "Send Quotation No.": editedData.sendQuotationNo,
      "Quotation Shared By": editedData.quotationSharedBy,
      "Quotation Number": editedData.quotationNumber,
      "Quotation Value Without Tax": editedData.valueWithoutTax,
      "Quotation Value With Tax": editedData.valueWithTax,
      "Quotation Upload": editedData.quotationUpload,
      "Quotation Remarks": editedData.quotationRemarks,
      "Quotation Validator Name": editedData.validatorName,
      "Quotation Send Status": editedData.sendStatus,
      "Quotation Validation Remark": editedData.validationRemark,
      "Send Faq Video": editedData.faqVideo,
      "Send Product Video": editedData.productVideo,
      "Send Offer Video": editedData.offerVideo,
      "Send Product Catalog": editedData.productCatalog,
      "Send Product Image": editedData.productImage,
      "Next Call Date": convertDateToYYYYMMDD(editedData.nextCallDate),
      "Next Call Time": convertTimeTo24Hour(editedData.nextCallTime),
      "Is Order Received? Status": editedData.orderStatus,
      "Acceptance Via": editedData.acceptanceVia,
      "Payment Mode": editedData.paymentMode,
      "Payment Terms (In Days)": editedData.paymentTerms,
      "Transport Mode": editedData.transportMode,
      "CONVEYED FOR REGISTRATION FORM": editedData.registrationFrom,
      "Acceptance File Upload": editedData.acceptanceFile,
      Remark: editedData.orderRemark,
      "Order Lost Apology Video": editedData.apologyVideo,
      "If No Then Get Relevant Reason Status": editedData.reasonStatus,
      "If No Then Get Relevant Reason Remark": editedData.reasonRemark,
      "Customer Order Hold Reason Category": editedData.holdReason,
      "Holding Date": convertDateToYYYYMMDD(editedData.holdingDate),
      "Hold Remark": editedData.holdRemark,
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

    // Always update enquiry_tracker
    const updatePromises = [
      supabase
        .from("enquiry_tracker")
        .update(updateData)
        .eq("id", editedData.id)
    ];

    let leadsOrderUpdate = null;
    let enquiryOrderUpdate = null;

    // If it's a lead number (LD-01), update leads_to_order
    if (isLeadNumber) {
      // Define the fields to update in leads_to_order table
      const leadsToOrderUpdateData = {
        "Enquiry_Status": editedData.enquiryStatus,
        "What_Did_Customer_Say": editedData.customerFeedback,
        "Current_Stage": editedData.currentStage,
        "Send_Quotation_No.": editedData.sendQuotationNo,
        "Quotation_Shared_By": editedData.quotationSharedBy,
        "Quotation_Number": editedData.quotationNumber,
        "Quotation_Value_With_Tax": editedData.valueWithTax,
        "Quotation_Upload": editedData.quotationUpload,
        "Quotation_Remarks": editedData.quotationRemarks,
        "Quotation_Validator_Name": editedData.validatorName,
        "Quotation_Send_Status": editedData.sendStatus,
        "Quotation_Validation_Remark": editedData.validationRemark,
        "Send_FAQ_Video": editedData.faqVideo,
        "Send_Product_Video": editedData.productVideo,
        "Send_Offer_Video": editedData.offerVideo,
        "Send_Product_Catalog": editedData.productCatalog,
        "Send_Product_Image": editedData.productImage,
        "Is_Order_Received?_Status": editedData.orderStatus,
        "Acceptance_Via": editedData.acceptanceVia,
        "Payment_Mode": editedData.paymentMode,
        "Payment_Terms _In_Days": editedData.paymentTerms,
        "Offer": editedData.offer || "",
        "Acceptance_File_Upload": editedData.acceptanceFile,
        "REMARK": editedData.orderRemark,
        "Order_Lost_Apology_Video": editedData.apologyVideo,
        "If_No_Then_Get_Relevant_Reason_Status": editedData.reasonStatus,
        "If_No_Then_Get_Relevant_Reason_Remark": editedData.reasonRemark,
        "CUSTOMER_ORDER_HOLD_REASON_CATEGORY": editedData.holdReason,
        "HOLDING_DATE": convertDateToYYYYMMDD(editedData.holdingDate),
        "HOLD_REMARK": editedData.holdRemark,
        "Leads_Tracking_Status": editedData.status || "",
        "Order_No": editedData.order_no || "",
        "Transport_Mode": editedData.transportMode,
        "CONVEYED_FOR_REGISTRATION_FORM": editedData.registrationFrom,
        "Quotation_Value_Without_Tax": editedData.valueWithoutTax,
        "Next Call Date_1": convertDateToYYYYMMDD(editedData.nextCallDate),
        "Next Call Time_1": convertTimeTo24Hour(editedData.nextCallTime),
      };

      // Remove undefined/null values
      Object.keys(leadsToOrderUpdateData).forEach((key) => {
        if (leadsToOrderUpdateData[key] === undefined || leadsToOrderUpdateData[key] === null) {
          delete leadsToOrderUpdateData[key];
        }
      });

      leadsOrderUpdate = supabase
        .from("leads_to_order")
        .update(leadsToOrderUpdateData)
        .eq('"LD-Lead-No"', identifier); // Exact match on LD-Lead-No
    }

    // If it's an enquiry number (EN-01), update enquiry_to_order
    if (isEnquiryNumber) {
      // Helper function to convert empty string to null for numeric fields
      const parseNumericField = (value) => {
        if (value === "" || value === undefined || value === null) return null;
        // Try to parse as number
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      };

      // Define the fields to update in enquiry_to_order table
      const enquiryToOrderUpdateData = {
        enquiry_status: editedData.enquiryStatus,
        customer_feedback: editedData.customerFeedback,
        current_stage: editedData.currentStage,
        send_quotation_no: editedData.sendQuotationNo,
        quotation_shared_by: editedData.quotationSharedBy,
        quotation_number: editedData.quotationNumber,
        // Fix: Convert numeric fields properly
        quotation_value_without_tax: parseNumericField(editedData.valueWithoutTax),
        quotation_value_with_tax: parseNumericField(editedData.valueWithTax),
        quotation_upload: editedData.quotationUpload,
        quotation_remarks: editedData.quotationRemarks,
        quotation_validator_name: editedData.validatorName,
        quotation_send_status: editedData.sendStatus,
        quotation_validation_remark: editedData.validationRemark,
        send_faq_video: editedData.faqVideo === "Yes" || editedData.faqVideo === "yes" || editedData.faqVideo === true,
        send_product_video: editedData.productVideo === "Yes" || editedData.productVideo === "yes" || editedData.productVideo === true,
        send_offer_video: editedData.offerVideo === "Yes" || editedData.offerVideo === "yes" || editedData.offerVideo === true,
        send_product_catalog: editedData.productCatalog === "Yes" || editedData.productCatalog === "yes" || editedData.productCatalog === true,
        send_product_image: editedData.productImage === "Yes" || editedData.productImage === "yes" || editedData.productImage === true,
        next_call_date: convertDateToYYYYMMDD(editedData.nextCallDate),
        next_call_time: convertTimeTo24Hour(editedData.nextCallTime),
        is_order_received_status: editedData.orderStatus,
        acceptance_via: editedData.acceptanceVia,
        payment_mode: editedData.paymentMode,
        // Fix: Convert numeric field properly
        payment_terms_days: parseNumericField(editedData.paymentTerms),
        acceptance_file_upload: editedData.acceptanceFile,
        remark: editedData.orderRemark,
        order_lost_apology_video: editedData.apologyVideo,
        if_no_reason_status: editedData.reasonStatus,
        if_no_reason_remark: editedData.reasonRemark,
        customer_order_hold_reason_category: editedData.holdReason,
        holding_date: convertDateToYYYYMMDD(editedData.holdingDate),
        hold_remark: editedData.holdRemark,
        transport_mode: editedData.transportMode,
        conveyed_for_registration_form: editedData.registrationFrom === "Yes" || editedData.registrationFrom === "yes" || editedData.registrationFrom === true,
        order_no: editedData.order_no || "",
        // Fix: Convert numeric field properly
        amount_with_gst: parseNumericField(editedData.valueWithTax),
        destination: editedData.destination || "",
        po_number: editedData.po_number || "",
      };

      // Remove undefined/null values
      Object.keys(enquiryToOrderUpdateData).forEach((key) => {
        if (enquiryToOrderUpdateData[key] === undefined || enquiryToOrderUpdateData[key] === null) {
          delete enquiryToOrderUpdateData[key];
        }
      });

      // FIX: Use ilike for case-insensitive matching
      const normalizedIdentifier = identifier.trim().toUpperCase();
      
      // Debug: Check if record exists
      console.log("Looking for enquiry_no:", normalizedIdentifier);
      
      // First check if the record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from("enquiry_to_order")
        .select("enquiry_no")
        .ilike("enquiry_no", `%${normalizedIdentifier}%`)
        .limit(1);
        
      if (checkError) {
        console.error("Error checking record existence:", checkError);
      }
      
      if (!existingRecord || existingRecord.length === 0) {
        console.log(`Record ${normalizedIdentifier} not found in enquiry_to_order`);
        // Set a flag to indicate record doesn't exist
        enquiryOrderSuccess = false;
        successMessage += " Note: enquiry_to_order record not found.";
      } else {
        console.log(`Found record: ${existingRecord[0].enquiry_no}`);
        enquiryOrderUpdate = supabase
          .from("enquiry_to_order")
          .update(enquiryToOrderUpdateData)
          .ilike("enquiry_no", normalizedIdentifier);
      }
    }

    // Add conditional updates to promises array
    if (leadsOrderUpdate) updatePromises.push(leadsOrderUpdate);
    if (enquiryOrderUpdate) updatePromises.push(enquiryOrderUpdate);

    // Execute all relevant updates
    const results = await Promise.allSettled(updatePromises);

    // Check results
    let successMessage = "Updated successfully in enquiry_tracker";
    let enquiryTrackerSuccess = false;
    let leadsOrderSuccess = false;
    let enquiryOrderSuccess = false;

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled' && !result.value.error) {
        if (idx === 0) {
          enquiryTrackerSuccess = true;
        } else if (isLeadNumber && idx === 1) {
          leadsOrderSuccess = true;
          successMessage += " and leads_to_order";
        } else if (isEnquiryNumber && idx === 1) {
          enquiryOrderSuccess = true;
          successMessage += " and enquiry_to_order";
        }
      } else if (result.status === 'fulfilled' && result.value.error) {
        console.error(`Update ${idx} error:`, result.value.error);
        if (idx === 1 && isEnquiryNumber) {
          if (result.value.error.message && result.value.error.message.includes("invalid input syntax for type numeric")) {
            alert(`Error: Invalid numeric value. Please check quotation values and payment terms. They should be numbers only.`);
          }
        }
      }
    });

    successMessage += "!";

    // Add warnings if some updates failed
    if (!enquiryTrackerSuccess) {
      alert("Error: Failed to update enquiry_tracker");
      return;
    }

    if (isLeadNumber && !leadsOrderSuccess) {
      successMessage += " Note: leads_to_order was not updated (record may not exist).";
    }

    if (isEnquiryNumber && !enquiryOrderSuccess) {
      successMessage += " Note: enquiry_to_order was not updated (record may not exist or had invalid data).";
    }

    alert(successMessage);

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

  const columnOptions = [
    { key: "timestamp", label: "Timestamp" },
    { key: "enquiryNo", label: "Enquiry No." },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "customerFeedback", label: "What Did Customer Say" },
    { key: "currentStage", label: "Current Stage" },
    { key: "sendQuotationNo", label: "Send Quotation No." },
    { key: "quotationSharedBy", label: "Quotation Shared By" },
    { key: "quotationNumber", label: "Quotation Number" },
    { key: "valueWithoutTax", label: "Value Without Tax" },
    { key: "valueWithTax", label: "Value With Tax" },
    { key: "quotationUpload", label: "Quotation Upload" },
    { key: "quotationRemarks", label: "Quotation Remarks" },
    { key: "validatorName", label: "Validator Name" },
    { key: "sendStatus", label: "Send Status" },
    { key: "validationRemark", label: "Validation Remark" },
    { key: "faqVideo", label: "FAQ Video" },
    { key: "productVideo", label: "Product Video" },
    { key: "offerVideo", label: "Offer Video" },
    { key: "productCatalog", label: "Product Catalog" },
    { key: "productImage", label: "Product Image" },
    { key: "nextCallDate", label: "Next Call Date" },
    { key: "nextCallTime", label: "Next Call Time" },
    { key: "orderStatus", label: "Order Status" },
    { key: "acceptanceVia", label: "Acceptance Via" },
    { key: "paymentMode", label: "Payment Mode" },
    { key: "paymentTerms", label: "Payment Terms" },
    { key: "transportMode", label: "Transport Mode" },
    { key: "registrationFrom", label: "Registration From" },
    { key: "orderVideo", label: "Order Video" },
    { key: "acceptanceFile", label: "Acceptance File" },
    { key: "orderRemark", label: "Remark" },
    { key: "apologyVideo", label: "Apology Video" },
    { key: "reasonStatus", label: "Reason Status" },
    { key: "reasonRemark", label: "Reason Remark" },
    { key: "holdReason", label: "Hold Reason" },
    { key: "holdingDate", label: "Holding Date" },
    { key: "holdRemark", label: "Hold Remark" },
  ];

  // Pending tab column options
  const pendingColumnOptions = [
    { key: "actions", label: "Actions" },
    { key: "timestamp", label: "Timestamp" },
    { key: "leadNo", label: "Lead No." },
    { key: "leadReceiverName", label: "Lead Receiver Name" },
    { key: "leadSource", label: "Lead Source" },
    { key: "phoneNo", label: "Phone No." },
    { key: "salespersonName", label: "Salesperson Name" },
    { key: "companyName", label: "Company Name" },
    { key: "currentStage", label: "Current Stage" },
    { key: "callingDate", label: "Calling Date" },
    { key: "assignedTo", label: "Assigned To" },
    { key: "itemQty", label: "Item/Qty" },
    { key: "totalQty", label: "Total Qty" },
    { key: "customerSay", label: "What Did Customer Say" },
    { key: "enquiryReceivedStatus", label: "Enquiry Received Status" },
    { key: "enquiryReceivedDate", label: "Enquiry Received Date" },
    { key: "enquiryForState", label: "Enquiry for State" },
    { key: "projectName", label: "Project Name" },
    { key: "enquiryType", label: "Enquiry Type" },
    { key: "enquiryApproach", label: "Enquiry Approach" },
    { key: "projectApproximateValue", label: "Project Approximate Value" },
    { key: "itemName1", label: "Item Name 1" },
    { key: "quantity1", label: "Quantity 1" },
    { key: "itemName2", label: "Item Name 2" },
    { key: "quantity2", label: "Quantity 2" },
    { key: "itemName3", label: "Item Name 3" },
    { key: "quantity3", label: "Quantity 3" },
    { key: "itemName4", label: "Item Name 4" },
    { key: "quantity4", label: "Quantity 4" },
    { key: "itemName5", label: "Item Name 5" },
    { key: "quantity5", label: "Quantity 5" },
    { key: "nextAction", label: "Next Action" },
    { key: "nextCallDate", label: "Next Call Date" },
    { key: "nextCallTime", label: "Next Call Time" },
  ];

  // Direct Enquiry tab column options
  const directEnquiryColumnOptions = [
    { key: "actions", label: "Actions" },
    { key: "timestamp", label: "Timestamp" },
    { key: "enquiryNo", label: "Lead No." },
    { key: "leadSource", label: "Lead Source" },
    { key: "companyName", label: "Company Name" },
    { key: "phoneNo", label: "Phone Number" },
    { key: "salespersonName", label: "Salesperson Name" },
    { key: "currentStage", label: "Current Stage" },
    { key: "callingDate", label: "Calling Date" },
    { key: "itemQty", label: "Item/Qty" },
    { key: "totalQty", label: "Total Qty" },
    { key: "shippingAddress", label: "Shipping Address" },
    { key: "leadReceiverName", label: "Enquiry Receiver Name" },
    { key: "enquiryAssignToProject", label: "Enquiry Assign to Project" },
    { key: "gstNumber", label: "GST Number" },
    { key: "enquiryDate", label: "Enquiry Date" },
    { key: "enquiryForState", label: "Enquiry for State" },
    { key: "projectName", label: "Project Name" },
    { key: "salesType", label: "Sales Type" },
    { key: "enquiryApproach", label: "Enquiry Approach" },
    { key: "itemName1", label: "Item Name 1" },
    { key: "quantity1", label: "Quantity 1" },
    { key: "itemName2", label: "Item Name 2" },
    { key: "quantity2", label: "Quantity 2" },
    { key: "itemName3", label: "Item Name 3" },
    { key: "quantity3", label: "Quantity 3" },
    { key: "itemName4", label: "Item Name 4" },
    { key: "quantity4", label: "Quantity 4" },
    { key: "itemName5", label: "Item Name 5" },
    { key: "quantity5", label: "Quantity 5" },
    { key: "itemName6", label: "Item Name 6" },
    { key: "quantity6", label: "Quantity 6" },
    { key: "itemName7", label: "Item Name 7" },
    { key: "quantity7", label: "Quantity 7" },
    { key: "itemName8", label: "Item Name 8" },
    { key: "quantity8", label: "Quantity 8" },
    { key: "itemName9", label: "Item Name 9" },
    { key: "quantity9", label: "Quantity 9" },
    { key: "itemName10", label: "Item Name 10" },
    { key: "quantity10", label: "Quantity 10" },
    { key: "enquiryStatus", label: "Enquiry Status" },
    { key: "customerFeedback", label: "Customer Feedback" },
    { key: "sendQuotationNo", label: "Send Quotation No." },
    { key: "quotationSharedBy", label: "Quotation Shared By" },
    { key: "quotationNumber", label: "Quotation Number" },
    { key: "quotationValueWithoutTax", label: "Quotation Value Without Tax" },
    { key: "quotationValueWithTax", label: "Quotation Value With Tax" },
    { key: "quotationUpload", label: "Quotation Upload" },
    { key: "quotationRemarks", label: "Quotation Remarks" },
    { key: "quotationValidatorName", label: "Quotation Validator Name" },
    { key: "quotationSendStatus", label: "Quotation Send Status" },
    { key: "quotationValidationRemark", label: "Quotation Validation Remark" },
    { key: "sendFaqVideo", label: "Send FAQ Video" },
    { key: "sendProductVideo", label: "Send Product Video" },
    { key: "sendOfferVideo", label: "Send Offer Video" },
    { key: "sendProductCatalog", label: "Send Product Catalog" },
    { key: "sendProductImage", label: "Send Product Image" },
    { key: "nextCallTime", label: "Next Call Time" },
    { key: "isOrderReceivedStatus", label: "Order Received Status" },
    { key: "ifNoReasonStatus", label: "If No Reason Status" },
    { key: "ifNoReasonRemark", label: "If No Reason Remark" },
    { key: "customerOrderHoldReasonCategory", label: "Customer Order Hold Reason Category" },
    { key: "holdingDate", label: "Holding Date" },
    { key: "holdRemark", label: "Hold Remark" },
    { key: "transportMode", label: "Transport Mode" },
    { key: "conveyedForRegistrationForm", label: "Conveyed For Registration Form" },
    { key: "orderNo", label: "Order No" },
    { key: "amountWithGst", label: "Amount With GST" },
    { key: "destination", label: "Destination" },
    { key: "poNumber", label: "PO Number" },
  ];

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

  // 1. Update the fetchPendingData function to accept date filters
  const fetchPendingData = async (
    page = 1,
    searchTerm = "",
    isLoadMore = false,
    dateFilters = {}
  ) => {
    if (isLoadMore && !hasMorePending) return;

    setIsLoading(true);
    const itemsPerPage = 50;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from("leads_to_order")
      .select("*", { count: "exact" })
      .not("Planned1", "is", null)
      .is("Actual1", null)
      .order("LD-Lead-No", { ascending: true })
      .range(from, to);

    // Add date filtering for pending data
    if (dateFilters.today) {
      const today = new Date().toISOString().split("T")[0];
      query = query
        .gte("Next Call Date_1", today)
        .lt(
          "Next Call Date_1",
          new Date(Date.now() + 86400000).toISOString().split("T")[0]
        );
    } else if (dateFilters.overdue) {
      const today = new Date().toISOString().split("T")[0];
      query = query.lt("Next Call Date_1", today);
    } else if (dateFilters.upcoming) {
      const today = new Date().toISOString().split("T")[0];
      query = query.gt("Next Call Date_1", today);
    }

    if (searchTerm) {
      query = query.or(
        `LD-Lead-No.ilike.%${searchTerm}%,Lead_Receiver_Name.ilike.%${searchTerm}%,Company_Name.ilike.%${searchTerm}%,Phone_Number.ilike.%${searchTerm}%`
      );
    }

    if (!isAdmin() && currentUser && currentUser.username) {
      const usernamesToFilter = getUsernamesToFilter();
      query = query.in("SC_Name", usernamesToFilter);
    }

    // Apply SC name filter for admin
    if (isAdmin() && scNameFilter !== "all") {
      query = query.eq("SC_Name", scNameFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching leads:", error.message);
      setIsLoading(false);
      return [];
    } else {
      const transformedData = data.map((item, index) => ({
        id: item.id, // Use actual database ID
        dbId: item.id, // Store database ID separately for clarity
        serialNo: from + index + 1,
        Timestamp: formatDateToDDMMYYYY(item.Timestamp) || "",
        lead_no: item["LD-Lead-No"] || "",
        Lead_Receiver_Name: item["Lead_Receiver_Name"] || "",
        Lead_Source: item["Lead_Source"] || "",
        Phone_Number: item["Phone_Number"] || "",
        salesperson_Name: item["Salesperson_Name"] || "",
        Company_Name: item["Company_Name"] || "",
        Current_Stage: item["Current_Stage"] || "",
        Calling_Days: item["Calling_Days"] || "",
        priority: determinePriority(item["Lead_Source"] || ""),
        itemQty: aggregateItemsForSummary(item, "Item_Name", "Quantity", "Item/qty") || "",
        sc_name: item["SC_Name"] || "",
        nextCallDate: item["Next_Call_Date"] || "",
        nextCallDate1: item["Next Call Date_1"] || "",
        // New columns added
        What_Did_The_Customer_Say: item["What_Did_The_Customer say?"] || "",
        Enquiry_Received_Status: item["Enquiry_Received_Status"] || "",
        Enquiry_Received_Date: formatDateToDDMMYYYY(item["Enquiry_Received_Date"]) || "",
        Enquiry_for_State: item["Enquiry_for_State"] || "",
        Project_Name: item["Project_Name"] || "",
        Enquiry_Type: item["Enquiry_Type"] || "",
        Enquiry_Approach: item["Enquiry_Approach"] || "",
        Project_Approximate_Value: item["Project_Approximate_Value"] || "",
        Item_Name1: item["Item_Name1"] || "",
        Quantity1: item["Quantity1"] || "",
        Item_Name2: item["Item_Name2"] || "",
        Quantity2: item["Quantity2"] || "",
        Item_Name3: item["Item_Name3"] || "",
        Quantity3: item["Quantity3"] || "",
        Item_Name4: item["Item_Name4"] || "",
        Quantity4: item["Quantity4"] || "",
        Item_Name5: item["Item_Name5"] || "",
        Quantity5: item["Quantity5"] || "",
        Next_Action: item["Next_Action"] || "",
        Next_Call_Date_Field: formatDateToDDMMYYYY(item["Next_Call_Date"]) || "",
        Next_Call_Time: formatTimeTo12Hour(item["Next_Call_Time"]) || "",
      }));

      if (isLoadMore) {
        setPendingData((prev) => {
          return [...prev, ...transformedData];
        });
      } else {
        setPendingData(transformedData);
      }

      // Check if there's more data - fixed logic
      const hasMore =
        transformedData.length === itemsPerPage &&
        from + transformedData.length < (count || 0);
      setHasMorePending(hasMore);

      setIsLoading(false);
      return transformedData;
    }
  };

  // Replace your existing fetchHistoryData function with this:
  // 1. Fix the column name issue in fetchHistoryData
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

    let query = supabase
      .from("enquiry_tracker")
      .select("*", { count: "exact" })
      .order('"Enquiry No."', { ascending: true })
      .range(from, to);

    // Add date filtering for history data
    if (dateFilters.today) {
      const today = new Date().toISOString().split("T")[0];
      query = query
        .gte('"Next Call Date"', today)
        .lt(
          '"Next Call Date"',
          new Date(Date.now() + 86400000).toISOString().split("T")[0]
        );
    } else if (dateFilters.older) {
      const today = new Date().toISOString().split("T")[0];
      query = query.lt('"Next Call Date"', today);
    }

    // Replace the search functionality in your fetchHistoryData function
    if (searchTerm) {
      query = query.or(
        `"Enquiry No.".ilike.%${searchTerm}%,"What Did Customer Say".ilike.%${searchTerm}%,"Current Stage".ilike.%${searchTerm}%,"Quotation Number".ilike.%${searchTerm}%,"Quotation Shared By".ilike.%${searchTerm}%,"Quotation Remarks".ilike.%${searchTerm}%,"Quotation Validator Name".ilike.%${searchTerm}%,"Quotation Send Status".ilike.%${searchTerm}%,"Quotation Validation Remark".ilike.%${searchTerm}%,"Is Order Received? Status".ilike.%${searchTerm}%,"Acceptance Via".ilike.%${searchTerm}%,"Payment Mode".ilike.%${searchTerm}%,"Payment Terms (In Days)".ilike.%${searchTerm}%,"Transport Mode".ilike.%${searchTerm}%,"CONVEYED FOR REGISTRATION FORM".ilike.%${searchTerm}%,"Remark".ilike.%${searchTerm}%,"If No Then Get Relevant Reason Status".ilike.%${searchTerm}%,"If No Then Get Relevant Reason Remark".ilike.%${searchTerm}%,"Customer Order Hold Reason Category".ilike.%${searchTerm}%,"Hold Remark".ilike.%${searchTerm}%`
      );
    }

    if (!isAdmin() && currentUser && currentUser.username) {
      const usernamesToFilter = getUsernamesToFilter();
      query = query.in("Sales Cordinator", usernamesToFilter);
    }

    // Apply SC name filter for admin
    if (isAdmin() && scNameFilter !== "all") {
      query = query.eq("Sales Cordinator", scNameFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching enquiry tracker:", error.message);
      setIsLoading(false);
      return [];
    } else {
      const transformedData = data.map((item, index) => ({
        // id: from + index + 1,
        id: item.id,
        uuid: item.id,
        serialNo: from + index + 1,
        Timestamp: formatDateToDDMMYYYY(item.Timestamp) || "",
        enquiryNo: item["Enquiry No."] || "",
        enquiryStatus: item["Enquiry Status"] || "",
        customerFeedback: item["What Did Customer Say"] || "",
        currentStage: item["Current Stage"] || "",
        sendQuotationNo: item["Send Quotation No."] || "",
        quotationSharedBy: item["Quotation Shared By"] || "",
        quotationNumber: item["Quotation Number"] || "",
        valueWithoutTax: item["Quotation Value Without Tax"] || "",
        valueWithTax: item["Quotation Value With Tax"] || "",
        quotationUpload: item["Quotation Upload"] || "",
        quotationRemarks: item["Quotation Remarks"] || "",
        validatorName: item["Quotation Validator Name"] || "",
        sendStatus: item["Quotation Send Status"] || "",
        validationRemark: item["Quotation Validation Remark"] || "",
        faqVideo: item["Send Faq Video"] || "",
        productVideo: item["Send Product Video"] || "",
        offerVideo: item["Send Offer Video"] || "",
        productCatalog: item["Send Product Catalog"] || "",
        productImage: item["Send Product Image"] || "",
        nextCallDate: formatDateToDDMMYYYY(item["Next Call Date"]) || "",
        nextCallTime: formatTimeTo12Hour(item["Next Call Time"]) || "",
        orderStatus: item["Is Order Received? Status"] || "",
        acceptanceVia: item["Acceptance Via"] || "",
        paymentMode: item["Payment Mode"] || "",
        paymentTerms: item["Payment Terms (In Days)"] || "",
        transportMode: item["Transport Mode"] || "",
        registrationFrom: item["CONVEYED FOR REGISTRATION FORM"] || "",
        offer: item["Offer"] || "",
        acceptanceFile: item["Acceptance File Upload"] || "",
        orderRemark: item["Remark"] || "",
        apologyVideo: item["Order Lost Apology Video"] || "",
        reasonStatus: item["If No Then Get Relevant Reason Status"] || "",
        reasonRemark: item["If No Then Get Relevant Reason Remark"] || "",
        holdReason: item["Customer Order Hold Reason Category"] || "",
        holdingDate: formatDateToDDMMYYYY(item["Holding Date"]) || "",
        holdRemark: item["Hold Remark"] || "",
        sales_coordinator: item["Sales Cordinator"] || "",
        followup_status: item["Followup Status"] || "",
        credit_days: item["Credit Days"] || "",
        credit_limit: item["Credit Limit"] || "",
        calling_days: item["Calling Days"] || "",
        order_no: item["Order No."] || "",
        sc_name: item["Sales Cordinator"] || "",
        destination: item["Destination"] || "",
        po_number: item["PO Number"] || "",
        priority: determinePriority(item["Enquiry Status"] || ""),
      }));

      if (isLoadMore) {
        setHistoryData((prev) => {
          return [...prev, ...transformedData];
        });
      } else {
        setHistoryData(transformedData);
      }

      // Check if there's more data - fixed logic
      const hasMore =
        transformedData.length === itemsPerPage &&
        from + transformedData.length < (count || 0);
      setHasMoreHistory(hasMore);

      setIsLoading(false);
      return transformedData;
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
      .from("enquiry_to_order")
      .select("*", { count: "exact" })
      .not("planned1", "is", null)
      .is("actual1", null)
      .order("enquiry_no", { ascending: true })
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
      // Fetch unique SC names from leads_to_order for pending tab
      const { data: pendingScNames, error: pendingError } = await supabase
        .from("leads_to_order")
        .select("SC_Name")
        .not("SC_Name", "is", null)
        .not("SC_Name", "eq", "");

      if (pendingError) {
        console.error("Error fetching pending SC names:", pendingError);
      }

      // Fetch unique SC names from enquiry_to_order for direct enquiry tab
      const { data: directEnquiryScNames, error: directEnquiryError } = await supabase
        .from("enquiry_to_order")
        .select("sales_coordinator_name")
        .not("sales_coordinator_name", "is", null)
        .not("sales_coordinator_name", "eq", "");

      if (directEnquiryError) {
        console.error("Error fetching direct enquiry SC names:", directEnquiryError);
      }

      // Fetch unique SC names from enquiry_tracker for history tab
      const { data: historyScNames, error: historyError } = await supabase
        .from("enquiry_tracker")
        .select(`"Sales Cordinator"`)
        .not('"Sales Cordinator"', "is", null)
        .not('"Sales Cordinator"', "eq", "");

      if (historyError) {
        console.error("Error fetching history SC names:", historyError);
      }

      // Extract and deduplicate SC names for each tab
      const uniquePendingNames = Array.from(
        new Set((pendingScNames || []).map(item => item.SC_Name).filter(Boolean))
      ).sort();

      const uniqueDirectEnquiryNames = Array.from(
        new Set((directEnquiryScNames || []).map(item => item.sales_coordinator_name).filter(Boolean))
      ).sort();

      const uniqueHistoryNames = Array.from(
        new Set((historyScNames || []).map(item => item["Sales Cordinator"]).filter(Boolean))
      ).sort();

      setUniqueScNames({
        pending: uniquePendingNames,
        directEnquiry: uniqueDirectEnquiryNames,
        history: uniqueHistoryNames
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
        if (role === "user" && currentUser?.username) {
          const usernamesToFilter = getUsernamesToFilter();
          return query.in("sales_coordinator_name", usernamesToFilter);
        }
        return query;
      };

      // Leads to Order
      const { count: pendingToday } = await withRoleFilter("leads_to_order")
        .eq("Next Call Date_1", today)
        .is("Actual1", null);

      const { count: pendingOverdue } = await withRoleFilter("leads_to_order")
        .not("Planned1", "is", null)
        .is("Actual1", null)
        .lt("Next Call Date_1", today);

      const { count: pendingUpcoming } = await withRoleFilter("leads_to_order")
        .not("Planned1", "is", null)
        .is("Actual1", null)
        .gt("Next Call Date_1", today);

      // Enquiry to Order
      const { count: directToday } = await withRoleFilter("enquiry_to_order")
        .not("planned1", "is", null)
        .is("actual1", null)
        .gte("next_call_date", today)
        .lt("next_call_date", tomorrow);

      const { count: directOverdue } = await withRoleFilter("enquiry_to_order")
        .not("planned1", "is", null)
        .is("actual1", null)
        .lt("next_call_date", today);

      const { count: directUpcoming } = await withRoleFilter("enquiry_to_order")
        .not("planned1", "is", null)
        .is("actual1", null)
        .gt("next_call_date", today);

      // Enquiry Tracker
      const { count: historyToday } = await withRoleFilter("enquiry_tracker")
        .gte('"Next Call Date"', today)
        .lt('"Next Call Date"', tomorrow);

      const { count: historyOlder } = await withRoleFilter(
        "enquiry_tracker"
      ).lt('"Next Call Date"', today);

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
                  to={`/call-tracker/new?leadId=${tracker.lead_no}`}
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
                  to={`/call-tracker/new?leadId=${tracker.enquiry_no}`}
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

  return (
    <div className="container px-4 py-10 mx-auto">
      <div className="flex flex-col gap-4 justify-between items-start mb-6 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            Enquiry Tracker
          </h1>
          <p className="mt-1 text-slate-600">
            Track the progress of enquiries through the sales pipeline
          </p>
          {isAdmin() && (
            <p className="mt-1 font-semibold text-green-600">
              Admin View: Showing all data
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="search"
              placeholder="Search Enquiry trackers..."
              className="pl-8 w-[200px] md:w-[300px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Calling Days Filter */}
          {/* Calling Days Filter */}
          <div className="relative dropdown-container">
            <button
              className="flex items-center px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={toggleCallingDaysDropdown}
            >
              <span>
                Calling Date{" "}
                {callingDaysFilter.length > 0 &&
                  `(${callingDaysFilter.length})`}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-2 transition-transform ${
                  showCallingDaysDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showCallingDaysDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-full bg-white rounded-md border border-gray-300 shadow-lg">
                <div className="p-2">
                  {activeTab === "history" ? (
                    <>
                      <label className="flex justify-between items-center p-2 w-full cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={callingDaysFilter.includes("today")}
                            onChange={() => handleCallingDaysChange("today")}
                          />
                          <span>Today's Calls</span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          ({callingDaysCounts.historyToday})
                        </span>
                      </label>
                      <label className="flex justify-between items-center p-2 w-full cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={callingDaysFilter.includes("older")}
                            onChange={() => handleCallingDaysChange("older")}
                          />
                          <span>Older Calls</span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          ({callingDaysCounts.historyOlder})
                        </span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="flex justify-between items-center p-2 w-full cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={callingDaysFilter.includes("today")}
                            onChange={() => handleCallingDaysChange("today")}
                          />
                          <span>Today</span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          (
                          {activeTab === "pending"
                            ? callingDaysCounts.pendingToday
                            : callingDaysCounts.directToday}
                          )
                        </span>
                      </label>
                      <label className="flex justify-between items-center p-2 w-full cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={callingDaysFilter.includes("overdue")}
                            onChange={() => handleCallingDaysChange("overdue")}
                          />
                          <span>Overdue</span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          (
                          {activeTab === "pending"
                            ? callingDaysCounts.pendingOverdue
                            : callingDaysCounts.directOverdue}
                          )
                        </span>
                      </label>
                      <label className="flex justify-between items-center p-2 w-full cursor-pointer hover:bg-gray-50">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={callingDaysFilter.includes("upcoming")}
                            onChange={() => handleCallingDaysChange("upcoming")}
                          />
                          <span>Upcoming</span>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">
                          (
                          {activeTab === "pending"
                            ? callingDaysCounts.pendingUpcoming
                            : callingDaysCounts.directUpcoming}
                          )
                        </span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            )}
            {callingDaysFilter.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {callingDaysFilter.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded"
                  >
                    {filter}
                    <button
                      onClick={() =>
                        setCallingDaysFilter(
                          callingDaysFilter.filter((item) => item !== filter)
                        )
                      }
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Enquiry No Filter */}
          {/* Enquiry No Filter */}
          <div className="relative dropdown-container">
            <button
              className="flex items-center px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={toggleEnquiryNoDropdown}
            >
              <span>
                Enquiry No.{" "}
                {enquiryNoFilter.length > 0 && `(${enquiryNoFilter.length})`}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-2 transition-transform ${
                  showEnquiryNoDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showEnquiryNoDropdown && (
              <div className="overflow-y-auto absolute left-0 top-full z-10 mt-1 min-w-full max-h-60 bg-white rounded-md border border-gray-300 shadow-lg">
                <div className="p-2">
                  {/* Search input for enquiry numbers */}
                  <input
                    type="text"
                    placeholder="Search enquiry numbers..."
                    className="px-2 py-1 mb-2 w-full text-sm rounded border border-gray-300"
                    onChange={(e) => {
                      // You can implement search functionality here if needed
                    }}
                  />

                  {/* Select all option */}
                  <label className="flex items-center p-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={
                        enquiryNoFilter.length === availableEnquiryNos.length &&
                        availableEnquiryNos.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEnquiryNoFilter([...availableEnquiryNos]);
                        } else {
                          setEnquiryNoFilter([]);
                        }
                      }}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </label>

                  <div className="overflow-y-auto max-h-40">
                    {availableEnquiryNos.map((enquiryNo) => (
                      <label
                        key={enquiryNo}
                        className="flex items-center p-2 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={enquiryNoFilter.includes(enquiryNo)}
                          onChange={() => handleEnquiryNoChange(enquiryNo)}
                        />
                        <span className="text-sm">{enquiryNo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {enquiryNoFilter.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {enquiryNoFilter.slice(0, 3).map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded"
                  >
                    {filter}
                    <button
                      onClick={() =>
                        setEnquiryNoFilter(
                          enquiryNoFilter.filter((item) => item !== filter)
                        )
                      }
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {enquiryNoFilter.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded">
                    +{enquiryNoFilter.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Current Stage Filter */}
          <div className="relative dropdown-container">
            <button
              className="flex items-center px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={toggleCurrentStageDropdown}
            >
              <span>
                Current Stage{" "}
                {currentStageFilter.length > 0 &&
                  `(${currentStageFilter.length})`}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 ml-2 transition-transform ${
                  showCurrentStageDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showCurrentStageDropdown && (
              <div className="absolute left-0 top-full z-10 mt-1 min-w-full bg-white rounded-md border border-gray-300 shadow-lg">
                <div className="p-2">
                  <label className="flex items-center p-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("make-quotation")}
                      onChange={() =>
                        handleCurrentStageChange("make-quotation")
                      }
                    />
                    <span>Make Quotation</span>
                  </label>
                  <label className="flex items-center p-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes(
                        "quotation-validation"
                      )}
                      onChange={() =>
                        handleCurrentStageChange("quotation-validation")
                      }
                    />
                    <span>Quotation Validation</span>
                  </label>
                  <label className="flex items-center p-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("order-status")}
                      onChange={() => handleCurrentStageChange("order-status")}
                    />
                    <span>Order Status</span>
                  </label>
                  <label className="flex items-center p-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={currentStageFilter.includes("order-expected")}
                      onChange={() =>
                        handleCurrentStageChange("order-expected")
                      }
                    />
                    <span>Order Expected</span>
                  </label>
                </div>
              </div>
            )}
            {currentStageFilter.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {currentStageFilter.map((filter) => (
                  <span
                    key={filter}
                    className="inline-flex items-center px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded"
                  >
                    {filter
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    <button
                      onClick={() =>
                        setCurrentStageFilter(
                          currentStageFilter.filter((item) => item !== filter)
                        )
                      }
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SC Name Filter - Only show for admin */}
          {isAdmin() && (
            <div className="relative">
              <input
                list="sc-name-filter-options"
                value={scNameFilter === "all" ? "" : scNameFilter}
                onChange={(e) => setScNameFilter(e.target.value || "all")}
                placeholder="Select SC Name"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              <datalist id="sc-name-filter-options">
                <option value="all">All SC Names</option>
                {activeTab === "pending" && (
                  uniqueScNames.pending.map((scName) => (
                    <option key={scName} value={scName} />
                  ))
                )}
                {activeTab === "directEnquiry" && (
                  uniqueScNames.directEnquiry.map((scName) => (
                    <option key={scName} value={scName} />
                  ))
                )}
                {activeTab === "history" && (
                  uniqueScNames.history.map((scName) => (
                    <option key={scName} value={scName} />
                  ))
                )}
              </datalist>
            </div>
          )}

          {/* Column Selection Dropdown - Show for pending, direct enquiry, and history tabs */}
          {activeTab === "pending" && (
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowPendingColumnDropdown(!showPendingColumnDropdown)}
                className="flex items-center px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <span>Select Columns</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showPendingColumnDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showPendingColumnDropdown && (
                <div className="overflow-y-auto absolute left-0 top-full z-50 mt-1 w-64 max-h-80 bg-white rounded-md border border-gray-300 shadow-lg">
                  <div className="p-2">
                    {/* Select All Option */}
                    <div className="flex items-center p-2 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="select-all-pending"
                        checked={Object.values(visiblePendingColumns).every(Boolean)}
                        onChange={handlePendingSelectAll}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="select-all-pending"
                        className="ml-2 text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        All Columns
                      </label>
                    </div>

                    <hr className="my-2" />

                    {/* Individual Column Options */}
                    {pendingColumnOptions.map((option) => (
                      <div
                        key={option.key}
                        className="flex items-center p-2 rounded hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`pending-column-${option.key}`}
                          checked={visiblePendingColumns[option.key]}
                          onChange={() => handlePendingColumnToggle(option.key)}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`pending-column-${option.key}`}
                          className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer"
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

          {activeTab === "directEnquiry" && (
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowDirectEnquiryColumnDropdown(!showDirectEnquiryColumnDropdown)}
                className="flex items-center px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <span>Select Columns</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showDirectEnquiryColumnDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showDirectEnquiryColumnDropdown && (
                <div className="overflow-y-auto absolute left-0 top-full z-50 mt-1 w-64 max-h-80 bg-white rounded-md border border-gray-300 shadow-lg">
                  <div className="p-2">
                    {/* Select All Option */}
                    <div className="flex items-center p-2 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="select-all-direct-enquiry"
                        checked={Object.values(visibleDirectEnquiryColumns).every(Boolean)}
                        onChange={handleDirectEnquirySelectAll}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="select-all-direct-enquiry"
                        className="ml-2 text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        All Columns
                      </label>
                    </div>

                    <hr className="my-2" />

                    {/* Individual Column Options */}
                    {directEnquiryColumnOptions.map((option) => (
                      <div
                        key={option.key}
                        className="flex items-center p-2 rounded hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`direct-enquiry-column-${option.key}`}
                          checked={visibleDirectEnquiryColumns[option.key]}
                          onChange={() => handleDirectEnquiryColumnToggle(option.key)}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`direct-enquiry-column-${option.key}`}
                          className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer"
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

          {activeTab === "history" && (
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                className="flex items-center px-3 py-2 bg-white rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <span>Select Columns</span>
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showColumnDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showColumnDropdown && (
                <div className="overflow-y-auto absolute left-0 top-full z-50 mt-1 w-64 max-h-80 bg-white rounded-md border border-gray-300 shadow-lg">
                  <div className="p-2">
                    {/* Select All Option */}
                    <div className="flex items-center p-2 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        id="select-all-history"
                        checked={Object.values(visibleColumns).every(Boolean)}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <label
                        htmlFor="select-all-history"
                        className="ml-2 text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        All Columns
                      </label>
                    </div>

                    <hr className="my-2" />

                    {/* Individual Column Options */}
                    {columnOptions.map((option) => (
                      <div
                        key={option.key}
                        className="flex items-center p-2 rounded hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`column-${option.key}`}
                          checked={visibleColumns[option.key]}
                          onChange={() => handleColumnToggle(option.key)}
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`column-${option.key}`}
                          className="flex-1 ml-2 text-sm text-gray-700 cursor-pointer"
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
          {(callingDaysFilter.length > 0 ||
            enquiryNoFilter.length > 0 ||
            currentStageFilter.length > 0) && (
            <button
              className="px-3 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={() => {
                setCallingDaysFilter([]);
                setEnquiryNoFilter([]);
                setCurrentStageFilter([]);
              }}
            >
              Clear Filters
            </button>
          )}

          <button
            className="px-4 py-2 font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            onClick={() => setShowNewCallTrackerForm(true)}
          >
            <PlusIcon className="inline-block mr-2 w-4 h-4" /> Direct Enquiry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">All Enquiry Trackers</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "pending"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setActiveTab("directEnquiry")}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "directEnquiry"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Direct Enquiry Pending
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  activeTab === "history"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab("tenDays")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  activeTab === "tenDays"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                10 Days
              </button>
            </div>
          </div>

          {/* {loading ? (
            <div className="p-8 text-center">
              <p className="text-slate-500">Loading Enquiry tracker data...</p>
            </div>
          ) : */}

          <>
            {activeTab === "pending" && (
              <>
                {/* Mobile Card View */}
                <MobileCardView
                  data={filteredPendingCallTrackers}
                  type="pending"
                  onProcess={(tracker) => {
                    // Handle process action if needed
                  }}
                />
                <div className="hidden overflow-x-auto rounded-md border md:block">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-slate-50">
                        <tr>
                          {visiblePendingColumns.actions && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Actions
                            </th>
                          )}
                          {visiblePendingColumns.timestamp && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Timestamp
                            </th>
                          )}
                          {visiblePendingColumns.leadNo && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Lead No.
                            </th>
                          )}
                          {visiblePendingColumns.leadReceiverName && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Lead Receiver Name
                            </th>
                          )}
                          {visiblePendingColumns.leadSource && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Lead Source
                            </th>
                          )}
                          {visiblePendingColumns.phoneNo && (
                            <th
                              scope="col"
                              className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Phone No.
                            </th>
                          )}
                          {visiblePendingColumns.salespersonName && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Salesperson Name
                            </th>
                          )}
                          {visiblePendingColumns.companyName && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Company Name
                            </th>
                          )}
                          {visiblePendingColumns.currentStage && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Current Stage
                            </th>
                          )}
                          {visiblePendingColumns.callingDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Calling Date
                            </th>
                          )}
                          {visiblePendingColumns.assignedTo && isAdmin() && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Assigned To
                            </th>
                          )}
                          {visiblePendingColumns.itemQty && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Item/Qty
                            </th>
                          )}
                          {visiblePendingColumns.totalQty && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Total Qty
                            </th>
                          )}
                          {visiblePendingColumns.customerSay && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              What Did Customer Say
                            </th>
                          )}
                          {visiblePendingColumns.enquiryReceivedStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Received Status
                            </th>
                          )}
                          {visiblePendingColumns.enquiryReceivedDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Received Date
                            </th>
                          )}
                          {visiblePendingColumns.enquiryForState && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry for State
                            </th>
                          )}
                          {visiblePendingColumns.projectName && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Project Name
                            </th>
                          )}
                          {visiblePendingColumns.enquiryType && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Type
                            </th>
                          )}
                          {visiblePendingColumns.enquiryApproach && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Approach
                            </th>
                          )}
                          {visiblePendingColumns.projectApproximateValue && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Project Approximate Value
                            </th>
                          )}
                          {visiblePendingColumns.itemName1 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 1
                            </th>
                          )}
                          {visiblePendingColumns.quantity1 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 1
                            </th>
                          )}
                          {visiblePendingColumns.itemName2 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 2
                            </th>
                          )}
                          {visiblePendingColumns.quantity2 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 2
                            </th>
                          )}
                          {visiblePendingColumns.itemName3 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 3
                            </th>
                          )}
                          {visiblePendingColumns.quantity3 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 3
                            </th>
                          )}
                          {visiblePendingColumns.itemName4 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 4
                            </th>
                          )}
                          {visiblePendingColumns.quantity4 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 4
                            </th>
                          )}
                          {visiblePendingColumns.itemName5 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 5
                            </th>
                          )}
                          {visiblePendingColumns.quantity5 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 5
                            </th>
                          )}
                          {visiblePendingColumns.nextAction && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Next Action
                            </th>
                          )}
                          {visiblePendingColumns.nextCallDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Next Call Date
                            </th>
                          )}
                          {visiblePendingColumns.nextCallTime && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Next Call Time
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPendingCallTrackers.length > 0 ? (
                          filteredPendingCallTrackers.map((tracker, index) => (
                            <tr
                              key={tracker.id}
                              className="hover:bg-slate-50"
                              ref={
                                index === filteredPendingCallTrackers.length - 1
                                  ? lastElementRef
                                  : null
                              }
                            >
                              {visiblePendingColumns.actions && (
                                <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
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
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleEditClick(tracker, index)}
                                        className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
                                      >
                                        Edit
                                      </button>
                                      <Link
                                        state={{
                                          activeTab: activeTab,
                                          sc_name: tracker.sc_name,
                                        }}
                                        to={`/call-tracker/new?leadId=${tracker.lead_no}`}
                                      >
                                        <button className="px-3 py-1 text-xs text-purple-600 rounded-md border border-purple-200 hover:bg-purple-50">
                                          Process{" "}
                                          <ArrowRightIcon className="inline ml-1 w-3 h-3" />
                                        </button>
                                      </Link>
                                    </div>
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.timestamp && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.Timestamp}
                                </td>
                              )}
                              {visiblePendingColumns.leadNo && (
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                  {tracker.lead_no}
                                </td>
                              )}
                              {visiblePendingColumns.leadReceiverName && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Lead_Receiver_Name || ""}
                                      onChange={(e) => handleFieldChange("Lead_Receiver_Name", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Lead_Receiver_Name
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.leadSource && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Lead_Source || ""}
                                      onChange={(e) => handleFieldChange("Lead_Source", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        tracker.priority === "High"
                                          ? "bg-red-100 text-red-800"
                                          : tracker.priority === "Medium"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-800"
                                      }`}
                                    >
                                      {tracker.Lead_Source}
                                    </span>
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.phoneNo && (
                                <td className="px-4 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Phone_Number || ""}
                                      onChange={(e) => handleFieldChange("Phone_Number", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Phone_Number
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.salespersonName && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.salesperson_Name || ""}
                                      onChange={(e) => handleFieldChange("salesperson_Name", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.salesperson_Name
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.companyName && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Company_Name || ""}
                                      onChange={(e) => handleFieldChange("Company_Name", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    <div className="flex items-center">
                                      <BuildingIcon className="mr-2 w-4 h-4 text-slate-400" />
                                      {tracker.Company_Name}
                                    </div>
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.currentStage && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Current_Stage || ""}
                                      onChange={(e) => handleFieldChange("Current_Stage", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Current_Stage
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.callingDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {formatDateToDDMMYYYY(tracker.nextCallDate1)}
                                </td>
                              )}
                              {visiblePendingColumns.assignedTo && isAdmin() && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.sc_name}
                                </td>
                              )}
                              {visiblePendingColumns.itemQty && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  <div
                                    className="min-w-[100px] break-words whitespace-normal"
                                    title={tracker.itemQty}
                                  >
                                    {tracker.itemQty}
                                  </div>
                                </td>
                              )}
                              {visiblePendingColumns.totalQty && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.totalQty}
                                </td>
                              )}
                              {visiblePendingColumns.customerSay && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.What_Did_The_Customer_Say || ""}
                                      onChange={(e) => handleFieldChange("What_Did_The_Customer_Say", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div className="max-w-[200px] truncate" title={tracker.What_Did_The_Customer_Say}>
                                      {tracker.What_Did_The_Customer_Say}
                                    </div>
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.enquiryReceivedStatus && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Enquiry_Received_Status || ""}
                                      onChange={(e) => handleFieldChange("Enquiry_Received_Status", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Enquiry_Received_Status
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.enquiryReceivedDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="date"
                                      value={convertDateToYYYYMMDD(editedData.Enquiry_Received_Date) || ""}
                                      onChange={(e) => handleFieldChange("Enquiry_Received_Date", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Enquiry_Received_Date
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.enquiryForState && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Enquiry_for_State || ""}
                                      onChange={(e) => handleFieldChange("Enquiry_for_State", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Enquiry_for_State
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.projectName && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Project_Name || ""}
                                      onChange={(e) => handleFieldChange("Project_Name", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Project_Name
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.enquiryType && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Enquiry_Type || ""}
                                      onChange={(e) => handleFieldChange("Enquiry_Type", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Enquiry_Type
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.enquiryApproach && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Enquiry_Approach || ""}
                                      onChange={(e) => handleFieldChange("Enquiry_Approach", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Enquiry_Approach
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.projectApproximateValue && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Project_Approximate_Value || ""}
                                      onChange={(e) => handleFieldChange("Project_Approximate_Value", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Project_Approximate_Value
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.itemName1 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Item_Name1 || ""}
                                      onChange={(e) => handleFieldChange("Item_Name1", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Item_Name1
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.quantity1 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Quantity1 || ""}
                                      onChange={(e) => handleFieldChange("Quantity1", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Quantity1
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.itemName2 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Item_Name2 || ""}
                                      onChange={(e) => handleFieldChange("Item_Name2", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Item_Name2
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.quantity2 && (                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Quantity2 || ""}
                                      onChange={(e) => handleFieldChange("Quantity2", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Quantity2
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.itemName3 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Item_Name3 || ""}
                                      onChange={(e) => handleFieldChange("Item_Name3", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Item_Name3
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.quantity3 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Quantity3 || ""}
                                      onChange={(e) => handleFieldChange("Quantity3", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Quantity3
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.itemName4 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Item_Name4 || ""}
                                      onChange={(e) => handleFieldChange("Item_Name4", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Item_Name4
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.quantity4 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Quantity4 || ""}
                                      onChange={(e) => handleFieldChange("Quantity4", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Quantity4
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.itemName5 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Item_Name5 || ""}
                                      onChange={(e) => handleFieldChange("Item_Name5", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Item_Name5
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.quantity5 && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Quantity5 || ""}
                                      onChange={(e) => handleFieldChange("Quantity5", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Quantity5
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.nextAction && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.Next_Action || ""}
                                      onChange={(e) => handleFieldChange("Next_Action", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Next_Action
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.nextCallDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="date"
                                      value={convertDateToYYYYMMDD(editedData.Next_Call_Date_Field) || ""}
                                      onChange={(e) => handleFieldChange("Next_Call_Date_Field", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Next_Call_Date_Field
                                  )}
                                </td>
                              )}
                              {visiblePendingColumns.nextCallTime && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="time"
                                      value={editedData.Next_Call_Time || ""}
                                      onChange={(e) => handleFieldChange("Next_Call_Time", e.target.value)}
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.Next_Call_Time
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                            colSpan={isAdmin() ? 34 : 33} // Fixed: 12 base columns + 1 for admin column
                              className="px-6 py-4 text-sm text-center text-slate-500"
                            >
                              No pending call trackers found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>{" "}
                    {isLoading && activeTab === "pending" && (
                      <div className="flex justify-center py-4">
                        <div className="text-sm text-gray-500">
                          Loading more data...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "history" && (
              <>
                {/* Mobile Card View */}
                <MobileCardView
                  data={filteredHistoryCallTrackers}
                  type="history"
                />
                <div className="hidden overflow-x-auto rounded-md border md:block">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="sticky left-0 z-10 bg-slate-50 px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase border-r border-gray-200">
                            Actions
                          </th>

                          {visibleColumns.timestamp && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Timestamp
                            </th>
                          )}
                          {visibleColumns.enquiryNo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Enquiry No.
                            </th>
                          )}
                          {visibleColumns.enquiryStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Enquiry Status
                            </th>
                          )}
                          {visibleColumns.customerFeedback && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              What Did Customer Say
                            </th>
                          )}
                          {visibleColumns.currentStage && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Current Stage
                            </th>
                          )}
                          {visibleColumns.sendQuotationNo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Send Quotation No.
                            </th>
                          )}
                          {visibleColumns.quotationSharedBy && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Shared By
                            </th>
                          )}
                          {visibleColumns.quotationNumber && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Number
                            </th>
                          )}
                          {visibleColumns.valueWithoutTax && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Value Without Tax
                            </th>
                          )}
                          {visibleColumns.valueWithTax && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Value With Tax
                            </th>
                          )}
                          {visibleColumns.quotationUpload && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Upload
                            </th>
                          )}
                          {visibleColumns.quotationRemarks && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Remarks
                            </th>
                          )}
                          {visibleColumns.validatorName && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Validator Name
                            </th>
                          )}
                          {visibleColumns.sendStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Send Status
                            </th>
                          )}
                          {visibleColumns.validationRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Quotation Validation Remark
                            </th>
                          )}
                          {visibleColumns.faqVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Send FAQ Video
                            </th>
                          )}
                          {visibleColumns.productVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Send Product Video
                            </th>
                          )}
                          {visibleColumns.offerVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Send Offer Video
                            </th>
                          )}
                          {visibleColumns.productCatalog && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Send Product Catalog
                            </th>
                          )}
                          {visibleColumns.productImage && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Send Product Image
                            </th>
                          )}
                          {visibleColumns.nextCallDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Next Call Date
                            </th>
                          )}
                          {visibleColumns.nextCallTime && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Next Call Time
                            </th>
                          )}
                          {visibleColumns.orderStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Is Order Received? Status
                            </th>
                          )}
                          {visibleColumns.acceptanceVia && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Acceptance Via
                            </th>
                          )}
                          {visibleColumns.paymentMode && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Payment Mode
                            </th>
                          )}
                          {visibleColumns.paymentTerms && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Payment Terms (In Days)
                            </th>
                          )}
                          {visibleColumns.transportMode && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Transport Mode
                            </th>
                          )}
                          {visibleColumns.registrationFrom && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              CONVEYED FOR REGISTRATION FORM
                            </th>
                          )}
                          {visibleColumns.orderVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Order Video
                            </th>
                          )}
                          {visibleColumns.acceptanceFile && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Acceptance File Upload
                            </th>
                          )}
                          {visibleColumns.orderRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Remark
                            </th>
                          )}
                          {visibleColumns.apologyVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Order Lost Apology Video
                            </th>
                          )}
                          {visibleColumns.reasonStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              If No Then Get Relevant Reason Status
                            </th>
                          )}
                          {visibleColumns.reasonRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              If No Then Get Relevant Reason Remark
                            </th>
                          )}
                          {visibleColumns.holdReason && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Customer Order Hold Reason Category
                            </th>
                          )}
                          {visibleColumns.holdingDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Holding Date
                            </th>
                          )}
                          {visibleColumns.holdRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                              Hold Remark
                            </th>
                          )}
                        </tr>
                      </thead>
                      {/* <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHistoryCallTrackers.length > 0 ? (
                          filteredHistoryCallTrackers.map((tracker, index) => (
                            <tr
                              key={tracker.id}
                              className="hover:bg-slate-50"
                              ref={
                                index === filteredHistoryCallTrackers.length - 1
                                  ? lastElementRef
                                  : null
                              }
                            >
                              <td className="sticky left-0 z-10 bg-white px-6 py-4 text-sm font-medium border-r border-gray-200">
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
                                    onClick={() =>
                                      handleEditClick(tracker, index)
                                    }
                                    className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>

                              {visibleColumns.timestamp && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.Timestamp}
                                </td>
                              )}
                              {visibleColumns.enquiryNo && (
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                  {tracker.enquiryNo}
                                </td>
                              )}
                              {visibleColumns.enquiryStatus && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      tracker.priority === "High"
                                        ? "bg-red-100 text-red-800"
                                        : tracker.priority === "Medium"
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-slate-100 text-slate-800"
                                    }`}
                                  >
                                    {tracker.enquiryStatus}
                                  </span>
                                </td>
                              )}
                              {visibleColumns.customerFeedback && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.customerFeedback}
                                >
                                  {tracker.customerFeedback}
                                </td>
                              )}
                              {visibleColumns.currentStage && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.currentStage}
                                </td>
                              )}
                              {visibleColumns.sendQuotationNo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.sendQuotationNo}
                                </td>
                              )}
                              {visibleColumns.quotationSharedBy && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.quotationSharedBy}
                                </td>
                              )}
                              {visibleColumns.quotationNumber && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.quotationNumber}
                                </td>
                              )}
                              {visibleColumns.valueWithoutTax && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.valueWithoutTax}
                                </td>
                              )}
                              {visibleColumns.valueWithTax && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.valueWithTax}
                                </td>
                              )}
                              {visibleColumns.quotationUpload && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.quotationUpload && (
                                    <a
                                      href={tracker.quotationUpload}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      View File
                                    </a>
                                  )}
                                </td>
                              )}
                              {visibleColumns.quotationRemarks && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.quotationRemarks}
                                >
                                  {tracker.quotationRemarks}
                                </td>
                              )}
                              {visibleColumns.validatorName && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.validatorName}
                                </td>
                              )}
                              {visibleColumns.sendStatus && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.sendStatus}
                                </td>
                              )}
                              {visibleColumns.validationRemark && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.validationRemark}
                                >
                                  {tracker.validationRemark}
                                </td>
                              )}
                              {visibleColumns.faqVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.faqVideo}
                                </td>
                              )}
                              {visibleColumns.productVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.productVideo}
                                </td>
                              )}
                              {visibleColumns.offerVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.offerVideo}
                                </td>
                              )}
                              {visibleColumns.productCatalog && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.productCatalog}
                                </td>
                              )}
                              {visibleColumns.productImage && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.productImage}
                                </td>
                              )}
                              {visibleColumns.nextCallDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {formatDateToDDMMYYYY(tracker.nextCallDate)}
                                </td>
                              )}
                              {visibleColumns.nextCallTime && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.nextCallTime}
                                </td>
                              )}
                              {visibleColumns.orderStatus && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.orderStatus}
                                </td>
                              )}
                              {visibleColumns.acceptanceVia && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.acceptanceVia}
                                </td>
                              )}
                              {visibleColumns.paymentMode && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.paymentMode}
                                </td>
                              )}
                              {visibleColumns.paymentTerms && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.paymentTerms}
                                </td>
                              )}
                              {visibleColumns.transportMode && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.transportMode}
                                </td>
                              )}
                              {visibleColumns.registrationFrom && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.registrationFrom}
                                </td>
                              )}
                              {visibleColumns.orderVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.orderVideo}
                                </td>
                              )}
                              {visibleColumns.acceptanceFile && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.acceptanceFile && (
                                    <a
                                      href={tracker.acceptanceFile}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      View File
                                    </a>
                                  )}
                                </td>
                              )}
                              {visibleColumns.orderRemark && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.orderRemark}
                                >
                                  {tracker.orderRemark}
                                </td>
                              )}
                              {visibleColumns.apologyVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.apologyVideo && (
                                    <a
                                      href={tracker.apologyVideo}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      View Video
                                    </a>
                                  )}
                                </td>
                              )}
                              {visibleColumns.reasonStatus && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.reasonStatus}
                                >
                                  {tracker.reasonStatus}
                                </td>
                              )}
                              {visibleColumns.reasonRemark && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.reasonRemark}
                                >
                                  {tracker.reasonRemark}
                                </td>
                              )}
                              {visibleColumns.holdReason && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.holdReason}
                                >
                                  {tracker.holdReason}
                                </td>
                              )}
                              {visibleColumns.holdingDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.holdingDate}
                                </td>
                              )}
                              {visibleColumns.holdRemark && (
                                <td
                                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                  title={tracker.holdRemark}
                                >
                                  {tracker.holdRemark}
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={
                                Object.values(visibleColumns).filter(Boolean)
                                  .length
                              }
                              className="px-6 py-4 text-sm text-center text-slate-500"
                            >
                              No history found
                            </td>
                          </tr>
                        )}
                      </tbody> */}

                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHistoryCallTrackers.length > 0 ? (
                          filteredHistoryCallTrackers.map((tracker, index) => (
                            <tr
                              key={tracker.id}
                              className="hover:bg-slate-50"
                              ref={
                                index === filteredHistoryCallTrackers.length - 1
                                  ? lastElementRef
                                  : null
                              }
                            >
                              {/* Actions Column - First Column */}
                              <td className="sticky left-0 z-10 bg-white px-6 py-4 text-sm font-medium border-r border-gray-200">
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
                                    onClick={() =>
                                      handleEditClick(tracker, index)
                                    }
                                    className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>

                              {/* Timestamp - NOT Editable */}
                              {visibleColumns.timestamp && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {tracker.Timestamp}
                                </td>
                              )}

                              {/* Enquiry No - NOT Editable */}
                              {visibleColumns.enquiryNo && (
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                  {tracker.enquiryNo}
                                </td>
                              )}

                              {/* Enquiry Status - Editable */}
                              {visibleColumns.enquiryStatus && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.enquiryStatus || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "enquiryStatus",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        tracker.priority === "High"
                                          ? "bg-red-100 text-red-800"
                                          : tracker.priority === "Medium"
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-slate-100 text-slate-800"
                                      }`}
                                    >
                                      {tracker.enquiryStatus}
                                    </span>
                                  )}
                                </td>
                              )}

                              {/* Customer Feedback - Editable */}
                              {visibleColumns.customerFeedback && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.customerFeedback || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "customerFeedback",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.customerFeedback}
                                    >
                                      {tracker.customerFeedback}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Current Stage - Editable */}
                              {visibleColumns.currentStage && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.currentStage || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "currentStage",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.currentStage
                                  )}
                                </td>
                              )}

                              {/* Send Quotation No - Editable */}
                              {visibleColumns.sendQuotationNo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.sendQuotationNo || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "sendQuotationNo",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.sendQuotationNo
                                  )}
                                </td>
                              )}

                              {/* Quotation Shared By - Editable */}
                              {visibleColumns.quotationSharedBy && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.quotationSharedBy || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "quotationSharedBy",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.quotationSharedBy
                                  )}
                                </td>
                              )}

                              {/* Quotation Number - Editable */}
                              {visibleColumns.quotationNumber && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.quotationNumber || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "quotationNumber",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.quotationNumber
                                  )}
                                </td>
                              )}

                              {/* Value Without Tax - Editable */}
                              {visibleColumns.valueWithoutTax && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.valueWithoutTax || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "valueWithoutTax",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.valueWithoutTax
                                  )}
                                </td>
                              )}

                              {/* Value With Tax - Editable */}
                              {visibleColumns.valueWithTax && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.valueWithTax || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "valueWithTax",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.valueWithTax
                                  )}
                                </td>
                              )}

                              {/* Quotation Upload - Editable */}
                              {visibleColumns.quotationUpload && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.quotationUpload || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "quotationUpload",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      placeholder="Enter URL"
                                    />
                                  ) : (
                                    tracker.quotationUpload && (
                                      <a
                                        href={tracker.quotationUpload}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View File
                                      </a>
                                    )
                                  )}
                                </td>
                              )}

                              {/* Quotation Remarks - Editable */}
                              {visibleColumns.quotationRemarks && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.quotationRemarks || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "quotationRemarks",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.quotationRemarks}
                                    >
                                      {tracker.quotationRemarks}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Validator Name - Editable */}
                              {visibleColumns.validatorName && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.validatorName || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "validatorName",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.validatorName
                                  )}
                                </td>
                              )}

                              {/* Send Status - Editable */}
                              {visibleColumns.sendStatus && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.sendStatus || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "sendStatus",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.sendStatus
                                  )}
                                </td>
                              )}

                              {/* Validation Remark - Editable */}
                              {visibleColumns.validationRemark && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.validationRemark || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "validationRemark",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.validationRemark}
                                    >
                                      {tracker.validationRemark}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* FAQ Video - Editable */}
                              {visibleColumns.faqVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.faqVideo || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "faqVideo",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.faqVideo
                                  )}
                                </td>
                              )}

                              {/* Product Video - Editable */}
                              {visibleColumns.productVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.productVideo || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "productVideo",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.productVideo
                                  )}
                                </td>
                              )}

                              {/* Offer Video - Editable */}
                              {visibleColumns.offerVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.offerVideo || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "offerVideo",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.offerVideo
                                  )}
                                </td>
                              )}

                              {/* Product Catalog - Editable */}
                              {visibleColumns.productCatalog && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.productCatalog || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "productCatalog",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.productCatalog
                                  )}
                                </td>
                              )}

                              {/* Product Image - Editable */}
                              {visibleColumns.productImage && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.productImage || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "productImage",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.productImage
                                  )}
                                </td>
                              )}

                              {/* Next Call Date - Editable */}
                              {visibleColumns.nextCallDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.nextCallDate || ""}
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
                                    formatDateToDDMMYYYY(tracker.nextCallDate)
                                  )}
                                </td>
                              )}

                              {/* Next Call Time - Editable */}
                              {visibleColumns.nextCallTime && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.nextCallTime || ""}
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
                                    tracker.nextCallTime
                                  )}
                                </td>
                              )}

                              {/* Order Status - Editable */}
                              {visibleColumns.orderStatus && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.orderStatus || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "orderStatus",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.orderStatus
                                  )}
                                </td>
                              )}

                              {/* Acceptance Via - Editable */}
                              {visibleColumns.acceptanceVia && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.acceptanceVia || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "acceptanceVia",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.acceptanceVia
                                  )}
                                </td>
                              )}

                              {/* Payment Mode - Editable */}
                              {visibleColumns.paymentMode && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.paymentMode || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "paymentMode",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.paymentMode
                                  )}
                                </td>
                              )}

                              {/* Payment Terms - Editable */}
                              {visibleColumns.paymentTerms && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.paymentTerms || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "paymentTerms",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.paymentTerms
                                  )}
                                </td>
                              )}

                              {/* Transport Mode - Editable */}
                              {visibleColumns.transportMode && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.transportMode || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "transportMode",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.transportMode
                                  )}
                                </td>
                              )}

                              {/* Registration From - Editable */}
                              {visibleColumns.registrationFrom && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.registrationFrom || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "registrationFrom",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.registrationFrom
                                  )}
                                </td>
                              )}

                              {/* Order Video - Editable */}
                              {visibleColumns.orderVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.orderVideo || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "orderVideo",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                    />
                                  ) : (
                                    tracker.orderVideo
                                  )}
                                </td>
                              )}

                              {/* Acceptance File - Editable */}
                              {visibleColumns.acceptanceFile && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.acceptanceFile || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "acceptanceFile",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      placeholder="Enter URL"
                                    />
                                  ) : (
                                    tracker.acceptanceFile && (
                                      <a
                                        href={tracker.acceptanceFile}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View File
                                      </a>
                                    )
                                  )}
                                </td>
                              )}

                              {/* Order Remark - Editable */}
                              {visibleColumns.orderRemark && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.orderRemark || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "orderRemark",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.orderRemark}
                                    >
                                      {tracker.orderRemark}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Apology Video - Editable */}
                              {visibleColumns.apologyVideo && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.apologyVideo || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "apologyVideo",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      placeholder="Enter URL"
                                    />
                                  ) : (
                                    tracker.apologyVideo && (
                                      <a
                                        href={tracker.apologyVideo}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View Video
                                      </a>
                                    )
                                  )}
                                </td>
                              )}

                              {/* Reason Status - Editable */}
                              {visibleColumns.reasonStatus && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.reasonStatus || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "reasonStatus",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.reasonStatus}
                                    >
                                      {tracker.reasonStatus}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Reason Remark - Editable */}
                              {visibleColumns.reasonRemark && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.reasonRemark || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "reasonRemark",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.reasonRemark}
                                    >
                                      {tracker.reasonRemark}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Hold Reason - Editable */}
                              {visibleColumns.holdReason && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.holdReason || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "holdReason",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.holdReason}
                                    >
                                      {tracker.holdReason}
                                    </div>
                                  )}
                                </td>
                              )}

                              {/* Holding Date - Editable */}
                              {visibleColumns.holdingDate && (
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                  {editingRowId === index ? (
                                    <input
                                      type="text"
                                      value={editedData.holdingDate || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "holdingDate",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      placeholder="DD/MM/YYYY"
                                    />
                                  ) : (
                                    tracker.holdingDate
                                  )}
                                </td>
                              )}

                              {/* Hold Remark - Editable */}
                              {visibleColumns.holdRemark && (
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {editingRowId === index ? (
                                    <textarea
                                      value={editedData.holdRemark || ""}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "holdRemark",
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-2 py-1 border rounded"
                                      rows="2"
                                    />
                                  ) : (
                                    <div
                                      className="max-w-[200px] truncate"
                                      title={tracker.holdRemark}
                                    >
                                      {tracker.holdRemark}
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={
                                Object.values(visibleColumns).filter(Boolean)
                                  .length + 1
                              }
                              className="px-6 py-4 text-sm text-center text-slate-500"
                            >
                              No history found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>{" "}
                    {isLoading && activeTab === "history" && (
                      <div className="flex justify-center py-4">
                        <div className="text-sm text-gray-500">
                          Loading more data...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "directEnquiry" && (
              <>
                {/* Mobile Card View */}
                <MobileCardView
                  data={filteredDirectEnquiryPendingTrackers}
                  type="directEnquiry"
                  onProcess={(tracker) => {
                    // Handle process action if needed
                  }}
                  onView={(tracker) => {
                    setSelectedTracker(tracker);
                    setShowPopup(true);
                  }}
                />
                <div className="hidden overflow-x-auto rounded-md border md:block">
                  <div className="overflow-x-auto rounded-md border">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-slate-50">
                        <tr>
                          {visibleDirectEnquiryColumns.actions && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Actions
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.timestamp && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Timestamp
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.enquiryNo && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Lead No.
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.leadSource && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Lead Source
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.companyName && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Company Name
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.phoneNo && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Phone Number
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.salespersonName && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Salesperson Name
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.currentStage && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Current Stage
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.callingDate && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Calling Date
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemQty && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Item/Qty
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.totalQty && (
                            <th
                              scope="col"
                              className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                            >
                              Total Qty
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.shippingAddress && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Shipping Address
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.leadReceiverName && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Receiver Name
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.enquiryAssignToProject && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Assign to Project
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.gstNumber && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              GST Number
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.enquiryDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Date
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.enquiryForState && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry for State
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.projectName && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Project Name
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.salesType && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Sales Type
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.enquiryApproach && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Approach
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName1 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 1
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity1 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 1
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName2 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 2
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity2 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 2
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName3 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 3
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity3 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 3
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName4 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 4
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity4 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 4
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName5 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 5
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity5 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 5
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName6 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 6
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity6 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 6
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName7 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 7
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity7 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 7
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName8 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 8
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity8 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 8
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName9 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 9
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity9 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 9
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.itemName10 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Item Name 10
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quantity10 && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quantity 10
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.enquiryStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Enquiry Status
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.customerFeedback && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Customer Feedback
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.sendQuotationNo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Send Quotation No.
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationSharedBy && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Shared By
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationNumber && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Number
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationValueWithoutTax && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Value Without Tax
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationValueWithTax && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Value With Tax
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationUpload && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Upload
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationRemarks && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Remarks
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationValidatorName && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Validator Name
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationSendStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Send Status
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.quotationValidationRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Quotation Validation Remark
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.sendFaqVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Send FAQ Video
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.sendProductVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Send Product Video
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.sendOfferVideo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Send Offer Video
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.sendProductCatalog && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Send Product Catalog
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.sendProductImage && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Send Product Image
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.nextCallTime && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Next Call Time
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.isOrderReceivedStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Order Received Status
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.ifNoReasonStatus && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              If No Reason Status
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.ifNoReasonRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              If No Reason Remark
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.customerOrderHoldReasonCategory && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Customer Order Hold Reason Category
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.holdingDate && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Holding Date
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.holdRemark && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Hold Remark
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.transportMode && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Transport Mode
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.conveyedForRegistrationForm && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Conveyed For Registration Form
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.orderNo && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Order No
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.amountWithGst && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Amount With GST
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.destination && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              Destination
                            </th>
                          )}
                          {visibleDirectEnquiryColumns.poNumber && (
                            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase whitespace-nowrap">
                              PO Number
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDirectEnquiryPendingTrackers.length > 0 ? (
                          filteredDirectEnquiryPendingTrackers.map(
                            (tracker, index) => (
                              <tr
                                key={tracker.id}
                                className="hover:bg-slate-50"
                                ref={
                                  index ===
                                  filteredDirectEnquiryPendingTrackers.length -
                                    1
                                    ? lastElementRef
                                    : null
                                }
                              >
                                {visibleDirectEnquiryColumns.actions && (
                                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
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
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleEditClick(tracker, index)}
                                          className="px-3 py-1 text-xs border border-blue-600 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                          Edit
                                        </button>
                                        <Link
                                          state={{
                                            activeTab: activeTab,
                                            sc_name: tracker.sc_name,
                                          }}
                                          to={`/call-tracker/new?leadId=${tracker.enquiry_no}`}
                                        >
                                          <button className="px-3 py-1 text-xs text-purple-600 rounded-md border border-purple-200 hover:bg-purple-50">
                                            Process{" "}
                                            <ArrowRightIcon className="inline ml-1 w-3 h-3" />
                                          </button>
                                        </Link>
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.timestamp && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.timestamp}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.enquiryNo && (
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                    {tracker.enquiry_no}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.leadSource && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.lead_source || ""}
                                        onChange={(e) => handleFieldChange("lead_source", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.lead_source
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.companyName && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.company_name || ""}
                                        onChange={(e) => handleFieldChange("company_name", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.company_name
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.phoneNo && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.phone_number || ""}
                                        onChange={(e) => handleFieldChange("phone_number", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.phone_number
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.salespersonName && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.salesperson_name || ""}
                                        onChange={(e) => handleFieldChange("salesperson_name", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.salesperson_name
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.currentStage && (
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.current_stage || ""}
                                        onChange={(e) => handleFieldChange("current_stage", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      <span
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                          tracker.priority === "High"
                                            ? "bg-red-100 text-red-800"
                                            : tracker.priority === "Medium"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-slate-100 text-slate-800"
                                        }`}
                                      >
                                        {tracker.current_stage}
                                      </span>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.callingDate && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {formatDateToDDMMYYYY(tracker.nextCallDate)}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemQty && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    <div
                                      className="min-w-[100px] break-words whitespace-normal"
                                      title={tracker.item_qty}
                                    >
                                      {tracker.item_qty}
                                    </div>
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.totalQty && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.total_qty}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.shippingAddress && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <textarea
                                        value={editedData.shipping_address || ""}
                                        onChange={(e) => handleFieldChange("shipping_address", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                        rows="2"
                                      />
                                    ) : (
                                      <div className="max-w-[200px] truncate" title={tracker.shipping_address}>
                                        {tracker.shipping_address}
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.leadReceiverName && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.enquiry_receiver_name || ""}
                                        onChange={(e) => handleFieldChange("enquiry_receiver_name", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.enquiry_receiver_name
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.enquiryAssignToProject && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.enquiry_assign_to_project || ""}
                                        onChange={(e) => handleFieldChange("enquiry_assign_to_project", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.enquiry_assign_to_project
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.gstNumber && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.gst_number || ""}
                                        onChange={(e) => handleFieldChange("gst_number", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.gst_number
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.enquiryDate && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="date"
                                        value={editedData.enquiry_date || ""}
                                        onChange={(e) => handleFieldChange("enquiry_date", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.enquiry_date
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.enquiryForState && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.enquiry_for_state || ""}
                                        onChange={(e) => handleFieldChange("enquiry_for_state", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.enquiry_for_state
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.projectName && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.project_name || ""}
                                        onChange={(e) => handleFieldChange("project_name", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.project_name
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.salesType && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.sales_type || ""}
                                        onChange={(e) => handleFieldChange("sales_type", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.sales_type
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.enquiryApproach && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.enquiry_approach || ""}
                                        onChange={(e) => handleFieldChange("enquiry_approach", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.enquiry_approach
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName1 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name1 || ""}
                                        onChange={(e) => handleFieldChange("item_name1", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name1
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity1 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity1 || ""}
                                        onChange={(e) => handleFieldChange("quantity1", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity1
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName2 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name2 || ""}
                                        onChange={(e) => handleFieldChange("item_name2", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name2
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity2 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity2 || ""}
                                        onChange={(e) => handleFieldChange("quantity2", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity2
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName3 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name3 || ""}
                                        onChange={(e) => handleFieldChange("item_name3", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name3
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity3 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity3 || ""}
                                        onChange={(e) => handleFieldChange("quantity3", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity3
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName4 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name4 || ""}
                                        onChange={(e) => handleFieldChange("item_name4", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name4
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity4 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity4 || ""}
                                        onChange={(e) => handleFieldChange("quantity4", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity4
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName5 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name5 || ""}
                                        onChange={(e) => handleFieldChange("item_name5", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name5
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity5 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity5 || ""}
                                        onChange={(e) => handleFieldChange("quantity5", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity5
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName6 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name6 || ""}
                                        onChange={(e) => handleFieldChange("item_name6", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name6
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity6 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity6 || ""}
                                        onChange={(e) => handleFieldChange("quantity6", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity6
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName7 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name7 || ""}
                                        onChange={(e) => handleFieldChange("item_name7", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name7
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity7 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity7 || ""}
                                        onChange={(e) => handleFieldChange("quantity7", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity7
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName8 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name8 || ""}
                                        onChange={(e) => handleFieldChange("item_name8", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name8
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity8 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity8 || ""}
                                        onChange={(e) => handleFieldChange("quantity8", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity8
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName9 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name9 || ""}
                                        onChange={(e) => handleFieldChange("item_name9", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name9
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity9 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity9 || ""}
                                        onChange={(e) => handleFieldChange("quantity9", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity9
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.itemName10 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.item_name10 || ""}
                                        onChange={(e) => handleFieldChange("item_name10", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.item_name10
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quantity10 && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="number"
                                        value={editedData.quantity10 || ""}
                                        onChange={(e) => handleFieldChange("quantity10", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quantity10
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.enquiryStatus && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.enquiry_status || ""}
                                        onChange={(e) => handleFieldChange("enquiry_status", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.enquiry_status
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.customerFeedback && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <textarea
                                        value={editedData.customer_feedback || ""}
                                        onChange={(e) => handleFieldChange("customer_feedback", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                        rows="2"
                                      />
                                    ) : (
                                      <div className="max-w-[200px] truncate" title={tracker.customer_feedback}>
                                        {tracker.customer_feedback}
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.sendQuotationNo && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.send_quotation_no || ""}
                                        onChange={(e) => handleFieldChange("send_quotation_no", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.send_quotation_no
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationSharedBy && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.quotation_shared_by || ""}
                                        onChange={(e) => handleFieldChange("quotation_shared_by", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quotation_shared_by
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationNumber && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.quotation_number || ""}
                                        onChange={(e) => handleFieldChange("quotation_number", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quotation_number
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationValueWithoutTax && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.quotation_value_without_tax || ""}
                                        onChange={(e) => handleFieldChange("quotation_value_without_tax", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quotation_value_without_tax
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationValueWithTax && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.quotation_value_with_tax || ""}
                                        onChange={(e) => handleFieldChange("quotation_value_with_tax", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quotation_value_with_tax
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationUpload && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.quotation_upload && (
                                      <a
                                        href={tracker.quotation_upload}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        View File
                                      </a>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationRemarks && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <textarea
                                        value={editedData.quotation_remarks || ""}
                                        onChange={(e) => handleFieldChange("quotation_remarks", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                        rows="2"
                                      />
                                    ) : (
                                      <div className="max-w-[200px] truncate" title={tracker.quotation_remarks}>
                                        {tracker.quotation_remarks}
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationValidatorName && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.quotation_validator_name || ""}
                                        onChange={(e) => handleFieldChange("quotation_validator_name", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quotation_validator_name
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationSendStatus && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.quotation_send_status || ""}
                                        onChange={(e) => handleFieldChange("quotation_send_status", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.quotation_send_status
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.quotationValidationRemark && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <textarea
                                        value={editedData.quotation_validation_remark || ""}
                                        onChange={(e) => handleFieldChange("quotation_validation_remark", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                        rows="2"
                                      />
                                    ) : (
                                      <div className="max-w-[200px] truncate" title={tracker.quotation_validation_remark}>
                                        {tracker.quotation_validation_remark}
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.sendFaqVideo && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.send_faq_video ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.sendProductVideo && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.send_product_video ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.sendOfferVideo && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.send_offer_video ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.sendProductCatalog && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.send_product_catalog ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.sendProductImage && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.send_product_image ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.nextCallTime && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="time"
                                        value={editedData.next_call_time || ""}
                                        onChange={(e) => handleFieldChange("next_call_time", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.next_call_time
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.isOrderReceivedStatus && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.is_order_received_status || ""}
                                        onChange={(e) => handleFieldChange("is_order_received_status", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.is_order_received_status
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.ifNoReasonStatus && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.if_no_reason_status || ""}
                                        onChange={(e) => handleFieldChange("if_no_reason_status", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.if_no_reason_status
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.ifNoReasonRemark && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <textarea
                                        value={editedData.if_no_reason_remark || ""}
                                        onChange={(e) => handleFieldChange("if_no_reason_remark", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                        rows="2"
                                      />
                                    ) : (
                                      <div className="max-w-[200px] truncate" title={tracker.if_no_reason_remark}>
                                        {tracker.if_no_reason_remark}
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.customerOrderHoldReasonCategory && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.customer_order_hold_reason_category || ""}
                                        onChange={(e) => handleFieldChange("customer_order_hold_reason_category", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.customer_order_hold_reason_category
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.holdingDate && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="date"
                                        value={convertDateToYYYYMMDD(editedData.holding_date) || ""}
                                        onChange={(e) => handleFieldChange("holding_date", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.holding_date
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.holdRemark && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <textarea
                                        value={editedData.hold_remark || ""}
                                        onChange={(e) => handleFieldChange("hold_remark", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                        rows="2"
                                      />
                                    ) : (
                                      <div className="max-w-[200px] truncate" title={tracker.hold_remark}>
                                        {tracker.hold_remark}
                                      </div>
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.transportMode && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {editingRowId === index ? (
                                      <input
                                        type="text"
                                        value={editedData.transport_mode || ""}
                                        onChange={(e) => handleFieldChange("transport_mode", e.target.value)}
                                        className="w-full px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      tracker.transport_mode
                                    )}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.conveyedForRegistrationForm && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.conveyed_for_registration_form ? 'Yes' : 'No'}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.orderNo && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.order_no}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.amountWithGst && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.amount_with_gst}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.destination && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.destination}
                                  </td>
                                )}
                                {visibleDirectEnquiryColumns.poNumber && (
                                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {tracker.po_number}
                                  </td>
                                )}
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={71}
                              className="px-6 py-4 text-sm text-center text-slate-500"
                            >
                              No direct enquiry pending trackers found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>{" "}
                    {isLoading && activeTab === "directEnquiry" && (
                      <div className="flex justify-center py-4">
                        <div className="text-sm text-gray-500">
                          Loading more data...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {activeTab === "tenDays" && (
              <>
                {/* Search Input for 10 Days - Top Right */}
                <div className="flex justify-end mb-2">
                  <div className="relative max-w-md">
                    <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="search"
                      placeholder="Search orders..."
                      className="px-3 py-2 pl-8 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={tenDaysSearchTerm}
                      onChange={(e) => setTenDaysSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit Button - Show when orders are selected */}
                {selectedOrders.length > 0 && (
                  <div className="p-4 mb-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700">
                        {selectedOrders.length} order(s) selected
                      </span>
                      <button
                        onClick={handleSubmitSelected}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Selected"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto rounded-md border">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          <input
                            type="checkbox"
                            checked={
                              selectedOrders.length === tenDaysData.length &&
                              tenDaysData.length > 0
                            }
                            onChange={(e) =>
                              handleSelectAllOrders(e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                        </th>
                        {/* Add Status column */}
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                        {/* Add Date column */}
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Date
                        </th>
                        {/* Add Remarks column */}
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Remarks
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Order No.
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Quotation No.
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Company Name
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Contact Person
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Contact Number
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Payment Mode
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Payment Terms
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Transport Mode
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Destination
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Item/Qty
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          PO Number
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Total Order Qty
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Amount Total
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Dispatch Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          CF Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenDaysData.length > 0 ? (
                        tenDaysData
                          .filter(
                            (order) =>
                              !tenDaysSearchTerm ||
                              order.orderNo
                                .toLowerCase()
                                .includes(tenDaysSearchTerm.toLowerCase()) ||
                              order.companyName
                                .toLowerCase()
                                .includes(tenDaysSearchTerm.toLowerCase()) ||
                              order.contactPersonName
                                .toLowerCase()
                                .includes(tenDaysSearchTerm.toLowerCase()) ||
                              (order.quotationNo &&
                                order.quotationNo
                                  .toLowerCase()
                                  .includes(tenDaysSearchTerm.toLowerCase())) ||
                              (order.contactNumber &&
                                String(order.contactNumber)
                                  .toLowerCase()
                                  .includes(tenDaysSearchTerm.toLowerCase()))
                          )
                          .map((order, index) => (
                            <tr key={order.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.includes(
                                    order.orderNo
                                  )}
                                  onChange={(e) =>
                                    handleOrderSelect(
                                      order.orderNo,
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                              </td>
                              {/* Status dropdown */}
                              {/* Status cell */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedOrders.includes(order.orderNo) ? (
                                  <select
                                    value={
                                      orderStatuses[order.orderNo] ||
                                      order.existingStatus ||
                                      "pending"
                                    }
                                    onChange={(e) =>
                                      handleStatusChange(
                                        order.orderNo,
                                        e.target.value
                                      )
                                    }
                                    className="block px-3 py-2 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="done">Done</option>
                                  </select>
                                ) : (
                                  <span className="text-sm text-gray-900">
                                    {order.existingStatus || "pending"}
                                  </span>
                                )}
                              </td>

                              {/* Date cell */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedOrders.includes(order.orderNo) ? (
                                  (orderStatuses[order.orderNo] ||
                                    order.existingStatus ||
                                    "pending") === "pending" ? (
                                    <input
                                      type="date"
                                      value={
                                        orderDates[order.orderNo] ||
                                        order.existingDate ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleDateChange(
                                          order.orderNo,
                                          e.target.value
                                        )
                                      }
                                      className="block px-3 py-2 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )
                                ) : (
                                  <span className="text-sm text-gray-900">
                                    {order.existingDate || "-"}
                                  </span>
                                )}
                              </td>

                              {/* Remarks cell */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {selectedOrders.includes(order.orderNo) ? (
                                  <input
                                    type="text"
                                    value={
                                      orderRemarks[order.orderNo] ||
                                      order.existingRemarks ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleRemarkChange(
                                        order.orderNo,
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter remarks"
                                    className="block px-3 py-2 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  />
                                ) : (
                                  <span className="text-sm text-gray-900">
                                    {order.existingRemarks || "-"}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.timestamp}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                {order.orderNo}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.quotationNo}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.companyName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.contactPersonName}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.contactNumber}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.paymentMode}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.paymentTerms}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.transportMode}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.destination}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                                title={order.itemQty}
                              >
                                {order.itemQty}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.poNumber}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.totalOrderQty}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.amountTotal}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.dispatchStatus}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                {order.cfDate}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={20}
                            className="px-6 py-4 text-sm text-center text-slate-500"
                          >
                            {isLoading
                              ? "Loading 10 days data..."
                              : "No orders found for 10 days criteria"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        </div>
      </div>

      {/* New Call Tracker Form Modal */}
      {showNewCallTrackerForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">New Call Tracker</h2>
                <button
                  onClick={() => setShowNewCallTrackerForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <CallTrackerForm />
          </div>
        </div>
      )}

      {/* View Popup Modal */}
      {showPopup && (
        <div className="flex fixed inset-0 z-50 justify-center items-center">
          <div
            className={`absolute inset-0 backdrop-blur-sm bg-black/50 ${fadeIn}`}
            onClick={() => setShowPopup(false)}
          ></div>
          <div
            className={`overflow-auto relative w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[90vh] ${slideIn}`}
          >
            <div className="flex sticky top-0 justify-between items-center p-4 bg-white border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {activeTab === "pending" || activeTab === "directEnquiry"
                  ? `Call Tracker Details: ${selectedTracker?.leadId}`
                  : `Call Tracker History: ${selectedTracker?.enquiryNo}`}
              </h3>
              <button
                onClick={() => setShowPopup(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {activeTab === "pending" || activeTab === "directEnquiry" ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Column B - Lead ID */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Lead Number
                    </p>
                    <p className="text-base font-semibold">
                      {selectedTracker?.leadId}
                    </p>
                  </div>

                  {/* Column C - Receiver Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Lead Receiver Name
                    </p>
                    <p className="text-base">{selectedTracker?.receiverName}</p>
                  </div>

                  {/* Column D - Lead Source */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Lead Source
                    </p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTracker?.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedTracker?.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {selectedTracker?.leadSource}
                      </span>
                    </p>
                  </div>

                  {/* Column E - Salesperson Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Salesperson Name
                    </p>
                    <p className="text-base">
                      {selectedTracker?.salespersonName}
                    </p>
                  </div>

                  {/* Column G - Company Name */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Company Name
                    </p>
                    <p className="text-base">{selectedTracker?.companyName}</p>
                  </div>

                  {/* Created Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Created Date
                    </p>
                    <p className="text-base">{selectedTracker?.createdAt}</p>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-base">{selectedTracker?.status}</p>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Priority
                    </p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTracker?.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedTracker?.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {selectedTracker?.priority}
                      </span>
                    </p>
                  </div>

                  {/* Stage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">Stage</p>
                    <p className="text-base">{selectedTracker?.stage}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Enquiry No */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Enquiry No.
                    </p>
                    <p className="text-base font-semibold">
                      {selectedTracker?.enquiryNo}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Timestamp
                    </p>
                    <p className="text-base">{selectedTracker?.timestamp}</p>
                  </div>

                  {/* Enquiry Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Enquiry Status
                    </p>
                    <p className="text-base">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedTracker?.priority === "High"
                            ? "bg-red-100 text-red-800"
                            : selectedTracker?.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {selectedTracker?.enquiryStatus}
                      </span>
                    </p>
                  </div>

                  {/* Current Stage */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Current Stage
                    </p>
                    <p className="text-base">{selectedTracker?.currentStage}</p>
                  </div>

                  {/* Next Call Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Next Call Date
                    </p>
                    <p className="text-base">{selectedTracker?.nextCallDate}</p>
                  </div>

                  {/* Next Call Time */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Next Call Time
                    </p>
                    <p className="text-base">{selectedTracker?.nextCallTime}</p>
                  </div>

                  {/* Holding Date */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Holding Date
                    </p>
                    <p className="text-base">{selectedTracker?.holdingDate}</p>
                  </div>

                  {/* Order Status */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Order Status
                    </p>
                    <p className="text-base">{selectedTracker?.orderStatus}</p>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Payment Mode
                    </p>
                    <p className="text-base">{selectedTracker?.paymentMode}</p>
                  </div>

                  {/* Payment Terms */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      Payment Terms
                    </p>
                    <p className="text-base">{selectedTracker?.paymentTerms}</p>
                  </div>
                </div>
              )}

              {/* Customer Feedback - Full width */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">
                  What Did Customer Say
                </p>
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="text-base">
                    {activeTab === "pending" || activeTab === "directEnquiry"
                      ? "No feedback yet"
                      : selectedTracker?.customerFeedback}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end p-4 space-x-3 border-t">
              <button
                onClick={() => setShowPopup(false)}
                className="px-4 py-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Close
              </button>
              {(activeTab === "pending" || activeTab === "directEnquiry") && (
                <Link
                  to={`/call-tracker/new?leadId=${selectedTracker?.leadId}`}
                >
                  <button className="px-4 py-2 font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    Process <ArrowRightIcon className="inline ml-1 w-4 h-4" />
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

export default CallTracker;
