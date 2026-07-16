"use client"

import { useState, useContext, useEffect, useCallback } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AuthContext } from "../App"
import MakeQuotationForm from "../components/call-tracker/MakeQuotationFrom"
import QuotationValidationForm from "../components/call-tracker/QuotationValidationForm"
import OrderExpectedForm from "../components/call-tracker/OrderExpectedForm"
import OrderStatusForm from "../components/call-tracker/OrderStatusFrom"
import supabase from "../utils/supabase"

function NewCallTracker() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get("leadId")
  const { showNotification } = useContext(AuthContext)
  const [customerFeedbackOptions, setCustomerFeedbackOptions] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStage, setCurrentStage] = useState("")
  const [formData, setFormData] = useState({
    enquiryNo: leadId || "",
    enquiryStatus: "",
    customerFeedback: "",
  })

  const location = useLocation();
const { activeTab, sc_name } = location.state || {}; // fallback to {} if undefined





  const [enquiryStatusOptions, setEnquiryStatusOptions] = useState([])
  const [isLoadingDropdown, setIsLoadingDropdown] = useState(false)
  
  // State for MakeQuotationForm data
  const [quotationData, setQuotationData] = useState({
    companyName: "",
    sendQuotationNo: "",
    quotationSharedBy: "",
    quotationNumber: "",
    valueWithoutTax: "",
    valueWithTax: "",
    remarks: "",
    quotationFile: null,
    quotationFileUrl: "",
  })

  // State for QuotationValidationForm data
  const [validationData, setValidationData] = useState({
    validationQuotationNumber: "",
    validatorName: "",
    sendStatus: "",
    validationRemark: "",
    faqVideo: "no",
    productVideo: "no",
    offerVideo: "no",
    productCatalog: "no",
    productImage: "no",
  })

  // State for OrderExpectedForm data
  const [orderExpectedData, setOrderExpectedData] = useState({
    nextCallDate: "",
    nextCallTime: "",
    followupStatus: "",
  })

  // State for OrderStatusForm data
  const [orderStatusData, setOrderStatusData] = useState({
    orderStatusQuotationNumber: "",
    orderStatus: "",
    acceptanceVia: "",
    paymentMode: "",
    paymentTerms: "",
    transportMode: "",
    creditDays: "",
    creditLimit: "",
    conveyedForRegistration: "",
    orderVideo: "",
    acceptanceFile: null,
    orderRemark: "",
    apologyVideo: null,
    reasonStatus: "",
    reasonRemark: "",
    holdReason: "",
    holdingDate: "",
    holdRemark: "",
    quotationItems: [], // Items fetched from Make_Quotation table
  })

  // Memoized function to prevent recreation on every render
  const fetchLatestQuotationNumber = useCallback(async (enquiryNo, activeTab) => {
    try {
      let tableName, columnName, filterColumn;

      if (activeTab === "pending") {
        tableName = "leads_to_order";
        columnName = "Quotation_Number";
        filterColumn = "LD-Lead-No";
      } else if (activeTab === "directEnquiry") {
        tableName = "enquiry_to_order";
        columnName = "quotation_number";
        filterColumn = "enquiry_no";
      } else {
        console.error("Invalid active tab:", activeTab);
        return "";
      }

      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .eq(filterColumn, enquiryNo)
        .limit(1);

      if (error) {
        console.error(`Supabase error fetching from ${tableName}:`, error);
        return "";
      }

      if (data && data.length > 0) {
        return data[0][columnName];
      }
      
      return "";
    } catch (error) {
      console.error("Error fetching quotation number:", error);
      return "";
    }
  }, [activeTab]);

  // Use useEffect to handle quotation fetching when stage changes
// Replace this useEffect with a more controlled approach
useEffect(() => {
  const fetchQuotationForStage = async () => {
    if ((currentStage === "order-status" || currentStage === "quotation-validation") && 
        formData.enquiryNo) {
      const quotationNumber = await fetchLatestQuotationNumber(formData.enquiryNo, activeTab);
      
      // Only update if we got a different quotation number
      if (quotationNumber) {
        if (currentStage === "order-status" && orderStatusData.orderStatusQuotationNumber !== quotationNumber) {
          setOrderStatusData(prev => ({
            ...prev,
            orderStatusQuotationNumber: quotationNumber
          }));
        } else if (currentStage === "quotation-validation" && validationData.validationQuotationNumber !== quotationNumber) {
          setValidationData(prev => ({
            ...prev,
            validationQuotationNumber: quotationNumber
          }));
        }
      }
    }
  };

  fetchQuotationForStage();
}, [currentStage, formData.enquiryNo, activeTab, fetchLatestQuotationNumber, orderStatusData.orderStatusQuotationNumber, validationData.validationQuotationNumber]);


 useEffect(() => {
    const handleStageChange = async () => {
      if ((currentStage === "order-status" || currentStage === "quotation-validation") && 
          formData.enquiryNo) {
        const quotationNumber = await fetchLatestQuotationNumber(formData.enquiryNo, activeTab);
        if (quotationNumber) {
          if (currentStage === "order-status") {
            setOrderStatusData(prev => ({
              ...prev,
              orderStatusQuotationNumber: quotationNumber
            }));
          } else if (currentStage === "quotation-validation") {
            setValidationData(prev => ({
              ...prev,
              validationQuotationNumber: quotationNumber
            }));
          }
        }
      }
    };

    handleStageChange();
  }, [currentStage, formData.enquiryNo, activeTab, fetchLatestQuotationNumber]);
  // Add this function inside the NewCallTracker component
// const fetchLatestQuotationNumber = async (enquiryNo, activeTab) => {
//   try {
//     let tableName, columnName, filterColumn;

//     // Determine table and column based on active tab
//     if (activeTab === "pending") {
//       tableName = "leads_to_order";
//       columnName = "Quotation_Number";
//       filterColumn = "LD-Lead-No"; // Column name for lead ID in leads_to_order table
//     } else if (activeTab === "directEnquiry") {
//       tableName = "enquiry_to_order";
//       columnName = "quotation_number";
//       filterColumn = "enquiry_no"; // Column name for enquiry number in enquiry_to_order table
//     } else {
//       console.error("Invalid active tab:", activeTab);
//       return "";
//     }

//     // Fetch data from Supabase
//     const { data, error } = await supabase
//       .from(tableName)
//       .select(columnName)
//       .eq(filterColumn, enquiryNo)
//       .limit(1);

//     if (error) {
//       console.error(`Supabase error fetching from ${tableName}:`, error);
//       return "";
//     }

//     if (data && data.length > 0) {
//       return data[0][columnName];
//     }
    
//     return "";
//   } catch (error) {
//     console.error("Error fetching quotation number:", error);
//     return "";
//   }
// };
  // Fetch dropdown options from DROPDOWN sheet column G
 useEffect(() => {
  const fetchDropdownOptions = async () => {
    try {
      setIsLoadingDropdown(true)

      // Fetch non-null values from supabase table
      const { data, error } = await supabase
        .from("dropdown")
        .select("enquiry_status, what_did_customer_say")
        .not("enquiry_status", "is", null)
        .not("what_did_customer_say", "is", null)

      if (error) throw error

      if (data) {
        // Extract unique + clean values
        const statusOptions = [
          ...new Set(
            data
              .map((row) => row.enquiry_status)
              .filter((val) => val && val.trim() !== "")
          ),
        ]

        const feedbackOptions = [
          ...new Set(
            data
              .map((row) => row.what_did_customer_say)
              .filter((val) => val && val.trim() !== "")
          ),
        ]

        console.log("Status Options:", statusOptions)
        console.log("Feedback Options:", feedbackOptions)

        setEnquiryStatusOptions(statusOptions)
        setCustomerFeedbackOptions(feedbackOptions)
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error)
      // fallback values
      setEnquiryStatusOptions(["hot", "warm", "cold"])
      setCustomerFeedbackOptions(["Feedback 1", "Feedback 2", "Feedback 3"])
    } finally {
      setIsLoadingDropdown(false)
    }
  }

  fetchDropdownOptions()
}, [])


// Add this function to fetch all existing order numbers
// Fix the column name escaping
const fetchExistingOrderNumbers = async () => {
  try {
    // 🔍 Fetch from ALL 3 tables with their specific correct date columns
    const [trackerRes, leadsRes, directRes] = await Promise.all([
      // 1. enquiry_tracker uses "Timestamp" (Capital T)
      supabase
        .from("enquiry_tracker")
        .select('"Order No."')
        .not('"Order No."', 'is', null)
        .order('Timestamp', { ascending: false }) 
        .limit(1000),

      // 2. leads_to_order uses "Timestamp" (Capital T)
      supabase
        .from("leads_to_order")
        .select('Order_No')
        .not('Order_No', 'is', null)
        .order('Timestamp', { ascending: false })
        .limit(1000),

      // 3. enquiry_to_order uses "created_at" (Lowercase)
      supabase
        .from("enquiry_to_order")
        .select('order_no')
        .not('order_no', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1000)
    ]);

    const allNumbers = [
      ...(trackerRes.data || []).map(item => item["Order No."]),
      ...(leadsRes.data || []).map(item => item.Order_No),
      ...(directRes.data || []).map(item => item.order_no)
    ];

    return allNumbers.filter(no => no && typeof no === 'string' && no.trim() !== "");
  } catch (error) {
    console.error("Exception fetching order numbers:", error);
    return [];
  }
};

// Add this function to generate the next order number
const generateNextOrderNumber = async () => {
  try {
    const existingOrderNumbers = await fetchExistingOrderNumbers();
    
    // Extract numeric parts using regex that handles any digits after "DO-"
    const orderNumbers = existingOrderNumbers
      .map(orderNo => {
        const match = orderNo.match(/DO-(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num) && num > 0);
    
    // Find absolute maximum among all fetched records
    const maxOrderNumber = orderNumbers.length > 0 ? Math.max(...orderNumbers) : 0;
    
    const nextNumber = maxOrderNumber + 1;
    // Padding to at least 2 digits, but handles 1000+ naturally
    const paddedNumber = String(nextNumber).padStart(2, "0");
    
    console.log(`📊 Order Number Calc: Max Found=${maxOrderNumber}, Next=${nextNumber}`);
    return `DO-${paddedNumber}`;
  } catch (error) {
    console.error("Error generating order number:", error);
    const timestamp = Date.now().toString().slice(-4);
    return `DO-${timestamp}`;
  }
};

// useEffect(() => {
//   const generateOrderNumber = async () => {
//     try {
//       const orderNumber = await generateNextOrderNumber();
//       console.log("Generated order number:", orderNumber);
//       // If you need to store this order number in state, do it here:
//       // setGeneratedOrderNumber(orderNumber);
//     } catch (error) {
//       console.error("Error generating order number:", error);
//     }
//   };

//   generateOrderNumber();
// }, []); // Empty dependency array means this runs once on mount

  // Update form data when leadId changes
  useEffect(() => {
    if (leadId) {
      setFormData(prevData => ({
        ...prevData,
        enquiryNo: leadId
      }))
    }
  }, [leadId])

  const handleInputChange = (e) => {
    const { id, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }))
  }

  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    onFieldChange('quotationFile', file);
  }
};

  // Handler for quotation form data updates
const handleQuotationChange = async (field, value) => {
  if (field === "quotationFile" && value) {
    // If it's a file upload, handle the upload first
    try {
      setIsSubmitting(true);
      const fileUrl = await uploadFileToSupabase(value, "make_quotation");
      
      setQuotationData(prev => ({
        ...prev,
        quotationFile: value,
        quotationFileUrl: fileUrl
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      showNotification("Error uploading file: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  } else {
    // For other fields, update normally
    setQuotationData(prev => ({
      ...prev,
      [field]: value
    }));
  }
}

  

  // Handler for validation form data updates
  const handleValidationChange = (field, value) => {
    setValidationData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handler for order expected form data updates
  const handleOrderExpectedChange = (field, value) => {
    setOrderExpectedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handler for order status form data updates
// Handler for order status form data updates
// Handler for order status form data updates
// const handleOrderStatusChange = (field, value) => {
//   // For all fields including creditLimit, store as string (text)
//   setOrderStatusData(prev => ({
//     ...prev,
//     [field]: value // Keep all values as strings
//   }));
// }

  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Function to upload image/video to Google Drive
  const uploadFileToDrive = async (file, fileType = "image") => {
    try {
      // Convert file to base64
      const reader = new FileReader()
      
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64Data = reader.result.split(',')[1] // Remove the data:image/...;base64, prefix
            
            const scriptUrl = "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec"
            
            const params = {
              action: fileType === "pdf" ? "uploadPDF" : "uploadImage",
              fileName: file.name,
              mimeType: file.type
            }
            
            // Add the appropriate data parameter based on file type
            if (fileType === "pdf") {
              params.pdfData = base64Data;
            } else {
              params.imageData = base64Data;
            }

            const urlParams = new URLSearchParams()
            for (const key in params) {
              urlParams.append(key, params[key])
            }
            
            const response = await fetch(scriptUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
              },
              body: urlParams
            })

            const result = await response.json()
            
            if (result.success) {
              resolve(result.fileUrl)
            } else {
              reject(new Error(result.error || "Failed to upload file"))
            }
          } catch (error) {
            reject(error)
          }
        }
        
        reader.onerror = () => {
          reject(new Error("Failed to read file"))
        }
        
        reader.readAsDataURL(file)
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  }

 

// Function to upload file to Supabase storage
const uploadFileToSupabase = async (file, bucketName) => {
  try {
    // Generate a unique file name to avoid conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    
    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      throw error;
    }

    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading to Supabase storage:", error);
    throw error;
  }
};

const handleOrderStatusChange = async (field, value) => {


    if (field === "orderStatus" && value === "yes") {
    // Pre-generate order number for display
    const orderNumber = await generateNextOrderNumber();
    setOrderStatusData(prev => ({
      ...prev,
      generatedOrderNumber: orderNumber
    }));
  }
  
  // Handle file upload for acceptance file
  if (field === "acceptanceFile" && value) {
    try {
      setIsSubmitting(true);
      const fileUrl = await uploadFileToSupabase(value, "acceptance_file_upload");
      
      setOrderStatusData(prev => ({
        ...prev,
        acceptanceFile: fileUrl // Store the URL directly in acceptanceFile
      }));
    } catch (error) {
      console.error("Error uploading acceptance file:", error);
      showNotification("Error uploading acceptance file: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  } else if (field === "apologyVideo" && value) {
    try {
      setIsSubmitting(true);
      const fileUrl = await uploadFileToSupabase(value, "order_lost_apology");
      
      setOrderStatusData(prev => ({
        ...prev,
        apologyVideo: fileUrl // Store the URL directly in apologyVideo
      }));
    } catch (error) {
      console.error("Error uploading apology video:", error);
      showNotification("Error uploading apology video: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  } else {
    // For other fields, update normally
    setOrderStatusData(prev => ({
      ...prev,
      [field]: value
    }));
  }
}


//  const updateLeadToOrderTable = async (enquiryNo, formData, currentStage, orderStatusData = {}) => {

  
//   try {
//     // ✅ Helper: safely convert any value to boolean
//     const toBoolean = (value) => {
//       if (value === null || value === undefined || value === "") return false;
//       if (typeof value === "boolean") return value;
//       if (typeof value === "string") {
//         return value.toLowerCase() === "true" || value === "1";
//       }
//       return Boolean(value);
//     };

//     // ✅ Base fields
//     let updateData = {
//       "LD-Lead-No": formData.leadId,
//       Enquiry_Status: formData.enquiryStatus,
//       What_Did_Customer_Say: formData.customerFeedback,
//       Current_Stage: currentStage,
//     };

//     switch (currentStage) {
//       case "make-quotation":
//         Object.assign(updateData, {
//           "Send_Quotation_No.": formData.sendQuotationNo,
//           Quotation_Shared_By: formData.quotationSharedBy,
//           Quotation_Number: formData.quotationNumber,
//           Quotation_Value_Without_Tax: formData.valueWithoutTax,
//           Quotation_Value_With_Tax: formData.valueWithTax,
//           Quotation_Upload: formData.quotationFileUrl,
//           Quotation_Remarks: formData.remarks,

//           // reset followup + order fields
//           // "Next Call Date_1": null,
//           // "Next Call Time_1": null,
//           // "Is_Order_Received?_Status": null,
//           // Acceptance_Via: null,
//           // Payment_Mode: null,
//           // "Payment_Terms _In_Days": null,
//           // Transport_Mode: null,
//         });
//         break;

//       case "order-expected":
//         Object.assign(updateData, {
//           "Next Call Date_1": formData.nextCallDate,
//           "Next Call Time_1": formData.nextCallTime,

//           // reset quotation + order fields
//           // "Send_Quotation_No.": null,
//           // Quotation_Shared_By: null,
//           // Quotation_Number: null,
//           // Quotation_Value_Without_Tax: null,
//           // Quotation_Value_With_Tax: null,
//           // Quotation_Upload: null,
//           // Quotation_Remarks: null,
//           // "Is_Order_Received?_Status": null,
//           // Acceptance_Via: null,
//           // Payment_Mode: null,
//           // "Payment_Terms _In_Days": null,
//           // Transport_Mode: null,
//         });
//         break;

//      case "order-status":
//   // ✅ FIXED: Use orderStatusData instead of formData
//   updateData.Quotation_Number = orderStatusData.orderStatusQuotationNumber || null;
//   updateData["Is_Order_Received?_Status"] = orderStatusData.orderStatus; // Changed from formData to orderStatusData

//   if (orderStatusData.orderStatus?.toLowerCase() === "yes") {
//     Object.assign(updateData, {
//       Actual1: new Date().toISOString().slice(0, 10),
//       Acceptance_Via: orderStatusData.acceptanceVia,
//       Payment_Mode: orderStatusData.paymentMode,
//       Destination: orderStatusData.destination,
//       "Po Number": orderStatusData.poNumber,
//       "Payment_Terms _In_Days": orderStatusData.paymentTerms,
//       Transport_Mode: orderStatusData.transportMode,
//       "Credit_Limit": orderStatusData.creditLimit,
//       "Credit_Days": orderStatusData.creditDays,
//       CONVEYED_FOR_REGISTRATION_FORM: toBoolean(orderStatusData.conveyedForRegistration),
//       Offer: orderStatusData.orderVideo,
//       Acceptance_File_Upload: typeof orderStatusData.acceptanceFile === "string" 
//         ? orderStatusData.acceptanceFile 
//         : "",
//       REMARK: orderStatusData.orderRemark,
//     });
//   } else if (orderStatusData.orderStatus?.toLowerCase() === "no") {
//     Object.assign(updateData, {
//       Actual1: new Date().toISOString().slice(0, 10),
//       Order_Lost_Apology_Video: typeof orderStatusData.apologyVideo === "string" 
//         ? orderStatusData.apologyVideo 
//         : "",
//       If_No_Then_Get_Relevant_Reason_Status: orderStatusData.reasonStatus || null,
//       If_No_Then_Get_Relevant_Reason_Remark: orderStatusData.reasonRemark || null,
//       CUSTOMER_ORDER_HOLD_REASON_CATEGORY: null,
//     });
//   } else if (orderStatusData.orderStatus?.toLowerCase() === "hold") {
//     Object.assign(updateData, {
//       HOLDING_DATE: orderStatusData.holdingDate,
//       HOLD_REMARK: orderStatusData.holdRemark,
//       CUSTOMER_ORDER_HOLD_REASON_CATEGORY: orderStatusData.holdReason || null,
//     });
//   }
//   break;

//       default:
//         console.warn("Unknown stage:", currentStage);
//     }

//     // ✅ Use enquiryNo (not undefined leadId)
//     const { data, error } = await supabase
//       .from("leads_to_order")
//       .update(updateData)
//       .eq("LD-Lead-No", enquiryNo)
//       .select()
//       .single();

//     if (error) {
//       console.error("Error updating leads_to_order:", error);
//       return false;
//     }

//     console.log("✅ Successfully updated leads_to_order:", data);
//     return true;
//   } catch (error) {
//     console.error("❌ Exception updating leads_to_order:", error);
//     return false;
//   }
// };



const updateLeadToOrderTable = async (enquiryNo, allFormData, currentStage, orderStatusData = {}) => {
  try {
    // ✅ Helper: safely convert any value to boolean
    const toBoolean = (value) => {
      if (value === null || value === undefined || value === "") return false;
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
      }
      return Boolean(value);
    };

    // ✅ Base fields
    let updateData = {
      "LD-Lead-No": enquiryNo,
      Enquiry_Status: allFormData.enquiryStatus,
      What_Did_Customer_Say: allFormData.customerFeedback,
      Current_Stage: currentStage,
    };

    // ✅ Add Order Number if status is "yes"
    if (currentStage === "order-status" && orderStatusData.orderStatus?.toLowerCase() === "yes") {
      // Generate order number if not already in orderStatusData
      let orderNumber = orderStatusData.generatedOrderNumber;
      if (!orderNumber) {
        orderNumber = await generateNextOrderNumber();
      }
      
      updateData.Order_No = orderNumber;
      console.log("🔄 Setting Order_No in leads_to_order:", orderNumber);
    }

    switch (currentStage) {
      case "make-quotation":
        Object.assign(updateData, {
          "Send_Quotation_No.": allFormData.sendQuotationNo,
          Quotation_Shared_By: allFormData.quotationSharedBy,
          Quotation_Number: allFormData.quotationNumber,
          Quotation_Value_Without_Tax: allFormData.valueWithoutTax,
          Quotation_Value_With_Tax: allFormData.valueWithTax,
          Quotation_Upload: allFormData.quotationFileUrl,
          Quotation_Remarks: allFormData.remarks,
        });
        break;

      case "order-status":
        // ✅ FIXED: Use orderStatusData for quotation number
        updateData.Quotation_Number = orderStatusData.orderStatusQuotationNumber || null;
        updateData["Is_Order_Received?_Status"] = orderStatusData.orderStatus;

        if (orderStatusData.orderStatus?.toLowerCase() === "yes") {
          // Build item columns from quotationItems
          const items = orderStatusData.quotationItems || [];
          const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
          
          // Prepare items data for first 5 columns if items are present
          const itemUpdates = {};
          if (items.length > 0) {
            for (let i = 0; i < 5; i++) {
              const itemNum = i + 1;
              if (i < items.length) {
                itemUpdates[`Item_Name${itemNum}`] = items[i].name || "";
                itemUpdates[`Quantity${itemNum}`] = String(items[i].qty || 0);
              } else {
                itemUpdates[`Item_Name${itemNum}`] = null;
                itemUpdates[`Quantity${itemNum}`] = null;
              }
            }
          }
          
          // If more than 5 items, store remaining in Item/qty JSON column
          let itemQtyJson = null;
          if (items.length > 5) {
            const remainingItems = items.slice(5).map(item => ({
              name: item.name,
              quantity: item.qty
            }));
            itemQtyJson = JSON.stringify(remainingItems);
          }
          
          Object.assign(updateData, {
            Actual1: new Date().toISOString().slice(0, 10),
            Acceptance_Via: orderStatusData.acceptanceVia,
            Payment_Mode: orderStatusData.paymentMode,
            Destination: orderStatusData.destination,
            "Po Number": orderStatusData.poNumber,
            "Payment_Terms _In_Days": orderStatusData.paymentTerms,
            Transport_Mode: orderStatusData.transportMode,
            "Credit_Limit": orderStatusData.creditLimit,
            "Credit_Days": orderStatusData.creditDays,
            CONVEYED_FOR_REGISTRATION_FORM: toBoolean(orderStatusData.conveyedForRegistration),
            Offer: orderStatusData.orderVideo,
            Acceptance_File_Upload: typeof orderStatusData.acceptanceFile === "string" 
              ? orderStatusData.acceptanceFile 
              : "",
            REMARK: orderStatusData.orderRemark,
            // Add item columns only if they were calculated
            ...itemUpdates,
            ...(items.length > 0 ? {
              "Total Order Qty": String(totalQty),
              "Item/qty": itemQtyJson,
            } : {}),
            
            // ✅ Ensure Order_No is set (already set above, but ensure it's included)
            Order_No: updateData.Order_No || await generateNextOrderNumber(),
          });
        } else if (orderStatusData.orderStatus?.toLowerCase() === "no") {
          Object.assign(updateData, {
            Actual1: new Date().toISOString().slice(0, 10),
            Order_Lost_Apology_Video: typeof orderStatusData.apologyVideo === "string" 
              ? orderStatusData.apologyVideo 
              : "",
            If_No_Then_Get_Relevant_Reason_Status: orderStatusData.reasonStatus || null,
            If_No_Then_Get_Relevant_Reason_Remark: orderStatusData.reasonRemark || null,
            CUSTOMER_ORDER_HOLD_REASON_CATEGORY: null,
          });
        } else if (orderStatusData.orderStatus?.toLowerCase() === "hold") {
          Object.assign(updateData, {
            HOLDING_DATE: orderStatusData.holdingDate,
            HOLD_REMARK: orderStatusData.holdRemark,
            CUSTOMER_ORDER_HOLD_REASON_CATEGORY: orderStatusData.holdReason || null,
          });
        }
        break;

      default:
        console.warn("Unknown stage:", currentStage);
    }

    // ✅ Add detailed logging
    console.log("📋 Update Data for leads_to_order:");
    console.log("- Enquiry No:", enquiryNo);
    console.log("- Order No:", updateData.Order_No);
    console.log("- Item columns to update:", 
      updateData.Item_Name1, updateData.Quantity1,
      updateData.Item_Name2, updateData.Quantity2,
      updateData.Item_Name3, updateData.Quantity3,
      updateData.Item_Name4, updateData.Quantity4,
      updateData.Item_Name5, updateData.Quantity5
    );
    console.log("- Total Order Qty:", updateData["Total Order Qty"]);

    // ✅ Perform the update
    const { data, error } = await supabase
      .from("leads_to_order")
      .update(updateData)
      .eq("LD-Lead-No", enquiryNo)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating leads_to_order:", error);
      return false;
    }

    console.log("✅ Successfully updated leads_to_order:", data);
    
    // ✅ Wait a moment for triggers to fire
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  } catch (error) {
    console.error("❌ Exception updating leads_to_order:", error);
    return false;
  }
};


const triggerWebhookManually = async (enquiryNo, tableName) => {
  try {
    // Fetch the latest record from the database
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(tableName === 'leads_to_order' ? 'LD-Lead-No' : 'enquiry_no', enquiryNo)
      .single();

    if (error) {
      console.error("Error fetching updated record:", error);
      return false;
    }

    // Simulate a webhook call
    const webhookUrl = "https://script.google.com/macros/s/AKfycbx-gZV0X8BYm3J8QIG9FfJXmi5mptDxqaCazGA2t7earQoYzUOkcfOIHlSb83ILTZoz2w/exec";
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: tableName,
        type: 'UPDATE',
        record: data,
        old_record: {} // You might want to store old record for comparison
      })
    });

    const result = await response.json();
    console.log("Manual webhook triggered:", result);
    return result.success;
    
  } catch (error) {
    console.error("Error triggering webhook:", error);
    return false;
  }
};


const checkItemFieldsPopulated = (data) => {
  const itemFields = [
    'Item_Name1', 'Quantity1', 'Item_Name2', 'Quantity2',
    'Item_Name3', 'Quantity3', 'Item_Name4', 'Quantity4',
    'Item_Name5', 'Quantity5', 'Total Order Qty'
  ];
  
  for (const field of itemFields) {
    if (data[field] && data[field] !== '' && data[field] !== null) {
      console.log(`✅ ${field} has data: ${data[field]}`);
      return true;
    }
  }
  
  return false;
};
// const updateEnquiryToOrderTable = async (enquiryNo, formData, currentStage) => {
//   try {
//     // Helper function to safely convert to boolean
//     const toBoolean = (value) => {
//       if (value === null || value === undefined || value === '') return false;
//       if (typeof value === 'boolean') return value;
//       if (typeof value === 'string') {
//         return value.toLowerCase() === 'true' || value === '1';
//       }
//       return Boolean(value);
//     };

//     // Base fields always updated
//     let updateData = {
//       enquiry_no: formData.enquiryNo,
//       enquiry_status: formData.enquiryStatus,
//       customer_feedback: formData.customerFeedback,
//       current_stage: currentStage,
//     };

//     switch (currentStage) {
//       case "make-quotation":
//         Object.assign(updateData, {
//           // fill quotation fields
//           send_quotation_no: formData.sendQuotationNo,
//           quotation_shared_by: formData.quotationSharedBy,
//           quotation_number: formData.quotationNumber,
//           quotation_value_without_tax: formData.valueWithoutTax,
//           quotation_value_with_tax: formData.valueWithTax,
//           quotation_upload: formData.quotationFileUrl,
//           quotation_remarks: formData.remarks,

//           // reset followup + order fields
//           // next_call_date: null,
//           // next_call_time: null,
//           // is_order_received_status: null,
//           // acceptance_via: null,
//           // payment_mode: null,
//           // payment_terms_days: null,
//           // transport_mode: null,
//         });
//         break;

//       case "order-expected":
//         Object.assign(updateData, {
//           // fill followup fields
//           next_call_date: formData.nextCallDate,
//           next_call_time: formData.nextCallTime,

//           // reset quotation + order fields
//           // send_quotation_no: null,
//           // quotation_shared_by: null,
//           // quotation_number: null,
//           // quotation_value_without_tax: null,
//           // quotation_value_with_tax: null,
//           // quotation_upload: null,
//           // quotation_remarks: null,
//           // is_order_received_status: null,
//           // acceptance_via: null,
//           // payment_mode: null,
//           // payment_terms_days: null,
//           // transport_mode: null,
//         });
//         break;

//       case "order-status":
//         // Always set the status
//         updateData.quotation_number = orderStatusData.orderStatusQuotationNumber;
//         updateData.is_order_received_status = formData.orderStatus;

//         if (formData.orderStatus?.toLowerCase() === "yes") {
//           Object.assign(updateData, {
//             actual1: new Date().toISOString(),
//             acceptance_via: formData.acceptanceVia,
//             payment_mode: formData.paymentMode,
//             destination: formData.destination,
//             po_number: formData.poNumber,
//             payment_terms_days: formData.paymentTerms,
//             transport_mode: formData.transportMode,
//             // if_no_reason_status: null,
//             // if_no_reason_remark: null,
//             // customer_order_hold_reason_category: null,

//             // ✅ Use the helper function for boolean conversion
//             conveyed_for_registration_form: toBoolean(formData.conveyedForRegistration),

//             offer: formData.orderVideo,
//             acceptance_file_upload:  typeof formData.acceptanceFile === "string" 
//       ? formData.acceptanceFile 
//       : "", // handle upload later
//             remark: formData.orderRemark,

//             // // reset "no" + "hold" fields
//             // order_lost_apology_video: null,
//             // holding_date: null,
//             // hold_remark: null,
//           });
//         } else if (formData.orderStatus?.toLowerCase() === "no") {
//           Object.assign(updateData, {
//              actual1: new Date().toISOString(),
//             order_lost_apology_video:typeof formData.apologyVideo === "string" 
//       ? formData.apologyVideo 
//       : "", // handle upload later
//             if_no_reason_status: orderStatusData.reasonStatus,
//             if_no_reason_remark: orderStatusData.reasonRemark,
//             // customer_order_hold_reason_category: null,
//             // // reset "yes" + "hold" fields
//             // acceptance_via: null,
//             // payment_mode: null,
//             // destination: null,
//             // po_number: null,
//             // payment_terms_days: null,
//             // transport_mode: null,
          
//             // ✅ Use the helper function for boolean conversion
//            // conveyed_for_registration_form: toBoolean(formData.conveyedForRegistration),

//             // offer: null,
//             // acceptance_file_upload: null,
           
//             // holding_date: null,
//             // hold_remark: null,
//           });
//         } else if (formData.orderStatus?.toLowerCase() === "hold") {
//           Object.assign(updateData, {
//             holding_date: formData.holdingDate,
//             hold_remark: formData.holdRemark,
//             // if_no_reason_status: null,
//             // if_no_reason_remark: null,
//             customer_order_hold_reason_category: orderStatusData.holdReason,
//             // reset "yes" + "no" fields
//             // acceptance_via: null,
//             // payment_mode: null,
//             // destination: null,
//             // po_number: null,
//             // payment_terms_days: null,
//             // transport_mode: null,
           
//             // ✅ Use the helper function for boolean conversion
//             //conveyed_for_registration_form: toBoolean(formData.conveyedForRegistration),

//             // offer: null,
//             // acceptance_file_upload: null,
//             // order_lost_apology_video: null,
//           });
//         }

//         // reset quotation + followup fields (like in your original code)
//         Object.assign(updateData, {
//           // send_quotation_no: null,
//           // quotation_shared_by: null,
//           // quotation_number: null,
//           // quotation_value_without_tax: null,
//           // quotation_value_with_tax: null,
//           // quotation_upload: null,
//           // quotation_remarks: null,
//           // next_call_date: null,
//           // next_call_time: null,
//         });

//         break;

//       default:
//         console.warn("Unknown stage:", currentStage);
//     }

//     const { data, error } = await supabase
//       .from("enquiry_to_order")
//       .update(updateData)
//       .eq("enquiry_no", enquiryNo)
//       .select()
//       .single();

//     if (error) {
//       console.error("Error updating enquiry_to_order:", error);
//       return false;
//     }

//     console.log("Successfully updated enquiry_to_order:", data);
//     return true;
//   } catch (error) {
//     console.error("Exception updating enquiry_to_order:", error);
//     return false;
//   }
// };
  // Add this function to your NewCallTracker component



  const updateEnquiryToOrderTable = async (enquiryNo, allFormData, currentStage) => {
  try {
    // Helper function to safely convert to boolean
    const toBoolean = (value) => {
      if (value === null || value === undefined || value === '') return false;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1';
      }
      return Boolean(value);
    };

    // Base fields always updated
    let updateData = {
      enquiry_no: enquiryNo,
      enquiry_status: allFormData.enquiryStatus,
      customer_feedback: allFormData.customerFeedback,
      current_stage: currentStage,
    };

    switch (currentStage) {
      case "make-quotation":
        // Only update quotation fields, don't reset others
        Object.assign(updateData, {
          send_quotation_no: allFormData.sendQuotationNo,
          quotation_shared_by: allFormData.quotationSharedBy,
          quotation_number: allFormData.quotationNumber,
          quotation_value_without_tax: allFormData.valueWithoutTax,
          quotation_value_with_tax: allFormData.valueWithTax,
          quotation_upload: allFormData.quotationFileUrl,
          quotation_remarks: allFormData.remarks,
        });
        // DON'T reset followup + order fields - keep existing data
        break;

      case "order-expected":
        // Only update followup fields, don't reset others
        Object.assign(updateData, {
          next_call_date: allFormData.nextCallDate,
          next_call_time: allFormData.nextCallTime,
        });
        // DON'T reset quotation + order fields - keep existing data
        break;

      case "order-status":
        // Always set the status and quotation number
        updateData.quotation_number = orderStatusData.orderStatusQuotationNumber;
        updateData.is_order_received_status = allFormData.orderStatus;

        if (allFormData.orderStatus?.toLowerCase() === "yes") {
          // Build item columns from quotationItems
          const items = orderStatusData.quotationItems || [];
          const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
          
          // Prepare items data for first 10 columns if items are present
          const itemUpdates = {};
          if (items.length > 0) {
            for (let i = 0; i < 10; i++) {
              const itemNum = i + 1;
              if (i < items.length) {
                itemUpdates[`item_name${itemNum}`] = items[i].name || "";
                itemUpdates[`quantity${itemNum}`] = Number(items[i].qty) || 0;
              } else {
                itemUpdates[`item_name${itemNum}`] = null;
                itemUpdates[`quantity${itemNum}`] = null;
              }
            }
          }
          
          // If more than 10 items, store remaining in item_qty JSON column
          let itemQtyJson = null;
          if (items.length > 10) {
            const remainingItems = items.slice(10).map(item => ({
              name: item.name,
              quantity: item.qty
            }));
            itemQtyJson = JSON.stringify(remainingItems);
          }
          
          Object.assign(updateData, {
            actual1: new Date().toISOString(),
            acceptance_via: allFormData.acceptanceVia,
            payment_mode: allFormData.paymentMode,
            destination: allFormData.destination,
            po_number: allFormData.poNumber,
            payment_terms_days: allFormData.paymentTerms,
            transport_mode: allFormData.transportMode,
            conveyed_for_registration_form: toBoolean(allFormData.conveyedForRegistration),
            offer: allFormData.orderVideo,
            acceptance_file_upload: typeof allFormData.acceptanceFile === "string" 
              ? allFormData.acceptanceFile 
              : "",
            remark: allFormData.orderRemark,
            // ✅ Fix: Submit order number to master table
            order_no: allFormData.generatedOrderNumber || "",
            // Add item columns only if they were calculated
            ...itemUpdates,
            ...(items.length > 0 ? {
              total_qty: String(totalQty),
              item_qty: itemQtyJson,
            } : {}),
          });
          // DON'T reset "no" + "hold" fields - they might contain important data
        } else if (allFormData.orderStatus?.toLowerCase() === "no") {
          Object.assign(updateData, {
            actual1: new Date().toISOString(),
            order_lost_apology_video: typeof allFormData.apologyVideo === "string" 
              ? allFormData.apologyVideo 
              : "",
            if_no_reason_status: orderStatusData.reasonStatus,
            if_no_reason_remark: orderStatusData.reasonRemark,
          });
          // DON'T reset "yes" + "hold" fields
        } else if (allFormData.orderStatus?.toLowerCase() === "hold") {
          Object.assign(updateData, {
            holding_date: allFormData.holdingDate,
            hold_remark: allFormData.holdRemark,
            customer_order_hold_reason_category: orderStatusData.holdReason,
          });
          // DON'T reset "yes" + "no" fields
        }

        // DON'T reset quotation + followup fields - keep existing data
        break;

      default:
        console.warn("Unknown stage:", currentStage);
    }

    const { data, error } = await supabase
      .from("enquiry_to_order")
      .update(updateData)
      .eq("enquiry_no", enquiryNo)
      .select()
      .single();

    if (error) {
      console.error("Error updating enquiry_to_order:", error);
      return false;
    }

    console.log("Successfully updated enquiry_to_order:", data);
    return true;
  } catch (error) {
    console.error("Exception updating enquiry_to_order:", error);
    return false;
  }
};
const validateNumericFields = (data) => {
  const numericFields = [
    'valueWithoutTax', 'valueWithTax', 'paymentTerms', 
    'creditDays'
  ];
  
  for (const field of numericFields) {
    if (data[field] !== null && data[field] !== undefined && data[field] !== "") {
      const numValue = Number(data[field]);
      if (isNaN(numValue)) {
        return `Invalid numeric value for ${field}: ${data[field]}`;
      }
    }
  }
  return null;
};

// Use it in your handleSubmit function
const validationError = validateNumericFields({
  ...quotationData,
  ...orderStatusData
});

if (validationError) {
  showNotification(validationError, "error");
  setIsSubmitting(false);
  return;
}

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {

      let orderNumber = "";
    if (currentStage === "order-status" && orderStatusData.orderStatus === "yes") {
      orderNumber = await generateNextOrderNumber();
      console.log("Generated order number:", orderNumber);
    }

    if (currentStage === "order-status" && 
        orderStatusData.orderStatus === "yes" && 
        orderStatusData.acceptanceFile && 
        typeof orderStatusData.acceptanceFile !== "string") {
      showNotification("Uploading acceptance file...", "info");
      const fileUrl = await uploadFileToSupabase(orderStatusData.acceptanceFile, "acceptance_file_upload");
      
      setOrderStatusData(prev => ({
        ...prev,
        acceptanceFile: fileUrl
      }));
      
      showNotification("Acceptance file uploaded successfully", "success");
    }
    
    // Handle apology video upload if needed
    if (currentStage === "order-status" && 
        orderStatusData.orderStatus === "no" && 
        orderStatusData.apologyVideo && 
        typeof orderStatusData.apologyVideo !== "string") {
      showNotification("Uploading apology video...", "info");
      const fileUrl = await uploadFileToSupabase(orderStatusData.apologyVideo, "order_lost_apology");
      
      setOrderStatusData(prev => ({
        ...prev,
        apologyVideo: fileUrl
      }));
      
      showNotification("Apology video uploaded successfully", "success");
    }

    
  if (currentStage === "make-quotation" && quotationData.quotationFile && !quotationData.quotationFileUrl) {
      showNotification("Uploading quotation file...", "info");
      const fileUrl = await uploadFileToSupabase(quotationData.quotationFile, "make_quotation");
      
      // Update the quotation data with the file URL
      setQuotationData(prev => ({
        ...prev,
        quotationFileUrl: fileUrl
      }));
      
      showNotification("Quotation file uploaded successfully", "success");
    }


     const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    // Prepare the data object for Supabase
    const supabaseData = {
      "Enquiry No.": formData.enquiryNo,
      "Enquiry Status": formData.enquiryStatus,
      "What Did Customer Say": formData.customerFeedback,
      "Current Stage": currentStage,
      "Sales Cordinator":sc_name,
    };

    // Add stage-specific data with proper numeric handling
       if (currentStage === "make-quotation") {
      Object.assign(supabaseData, {
        "Send Quotation No.": quotationData.sendQuotationNo,
        "Quotation Shared By": quotationData.quotationSharedBy,
        "Quotation Number": quotationData.quotationNumber,
        "Quotation Value Without Tax": quotationData.valueWithoutTax,
        "Quotation Value With Tax": quotationData.valueWithTax,
        "Quotation Remarks": quotationData.remarks,
          "Quotation Upload": quotationData.quotationFileUrl || "",
      });
    } 
    else if (currentStage === "order-expected") {
      Object.assign(supabaseData, {
        "Followup Status": orderExpectedData.followupStatus, // Current date as followup start
        "Next Call Date": orderExpectedData.nextCallDate,
        "Next Call Time": orderExpectedData.nextCallTime,
      });
    } 
    else if (currentStage === "order-status") {
      Object.assign(supabaseData, {
        "Quotation Number": orderStatusData.orderStatusQuotationNumber,
        "Is Order Received? Status": orderStatusData.orderStatus,
      });

      // Add additional fields based on order status
      if (orderStatusData.orderStatus === "yes") {
        Object.assign(supabaseData, {
          "Acceptance Via": orderStatusData.acceptanceVia,
          "Payment Mode": orderStatusData.paymentMode,
          "Destination": orderStatusData.destination,
          "PO Number":orderStatusData.poNumber, 
          "Payment Terms (In Days)": orderStatusData.paymentTerms,
          "Transport Mode": orderStatusData.transportMode,
          "Credit Days":orderStatusData.creditDays,
          "Credit Limit":orderStatusData.creditLimit,
          "CONVEYED FOR REGISTRATION FORM": orderStatusData.conveyedForRegistration,
          "Offer": orderStatusData.orderVideo,
          "Acceptance File Upload": typeof orderStatusData.acceptanceFile === "string" 
            ? orderStatusData.acceptanceFile 
            : "",// You can add file upload logic here
          "Remark": orderStatusData.orderRemark,
          "Order No.":orderNumber,
        });
      } 
      else if (orderStatusData.orderStatus === "no") {
        Object.assign(supabaseData, {
          "Order Lost Apology Video": typeof orderStatusData.apologyVideo === "string" 
            ? orderStatusData.apologyVideo 
            : "", // You can add file upload logic here
          "If No Then Get Relevant Reason Status": orderStatusData.reasonStatus,
          "If No Then Get Relevant Reason Remark": orderStatusData.reasonRemark,
        });
      } 
      else if (orderStatusData.orderStatus === "hold") {
        Object.assign(supabaseData, {
          "Customer Order Hold Reason Category": orderStatusData.holdReason,
          "Holding Date": orderStatusData.holdingDate,
          "Hold Remark": orderStatusData.holdRemark,
        });
      }
    }
    

    console.log("Supabase Data to be inserted:", supabaseData);

    // Insert into Supabase
  const { data, error } = await supabase
      .from("enquiry_tracker")
      .insert([supabaseData]);

    if (error) {
      console.error("Error inserting data:", error.message);
      showNotification("Error saving data: " + error.message, "error");
    } else {
      console.log("Inserted successfully:", data);
      
      // Update the appropriate table based on activeTab
      if (activeTab === "directEnquiry") { 
        const updateSuccess = await updateEnquiryToOrderTable(
          formData.enquiryNo, 
          {
            ...formData,
            ...quotationData,
            ...orderExpectedData,
            ...orderStatusData,
            generatedOrderNumber: orderNumber // Ensure the number is passed for sync
          },
          currentStage
        );
        
        if (updateSuccess) {
          showNotification("Call tracker updated successfully and enquiry record updated", "success");
          
          // ✅ Wait for database to settle
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // ✅ Manually trigger webhook to ensure Google Sheets gets updated
          const webhookSuccess = await triggerWebhookManually(
            formData.enquiryNo, 
            "enquiry_to_order"
          );
          
          if (webhookSuccess) {
            showNotification("Data synced to Google Sheets", "success");
          } else {
            showNotification("Database updated but Google Sheets sync may be delayed", "warning");
          }
        } else {
          showNotification("Call tracker updated but enquiry record could not be updated", "warning");
        }
      }
      
      if (activeTab === "pending") { 
        // Pass the correct data structure
        const updateSuccess = await updateLeadToOrderTable(
          formData.enquiryNo,
          {
            ...formData,
            ...quotationData,
            ...orderExpectedData,
            ...orderStatusData
          },
          currentStage,
          orderStatusData // Pass orderStatusData as the 4th parameter
        );
        
        if (updateSuccess) {
          showNotification("Call tracker updated successfully and lead record updated", "success");
          
          // ✅ Wait for database to settle
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // ✅ Manually trigger webhook to ensure Google Sheets gets updated
          const webhookSuccess = await triggerWebhookManually(
            formData.enquiryNo, 
            "leads_to_order"
          );
          
          if (webhookSuccess) {
            showNotification("Data synced to Google Sheets", "success");
          } else {
            showNotification("Database updated but Google Sheets sync may be delayed", "warning");
          }
        } else {
          showNotification("Call tracker updated but lead record could not be updated", "warning");
        }
      }
      
      navigate("/call-tracker");
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    showNotification("Error saving data: " + err.message, "error");
  } finally {
    setIsSubmitting(false);
  }
};
  

   const handleStageChange = (stage) => {
    setCurrentStage(stage);
  };

  // Helper function to get the latest order number from the sheet
  const getLatestOrderNumber = async () => {
    try {
      const scriptUrl =
        "https://script.google.com/macros/s/AKfycbzTPj_x_0Sh6uCNnMDi-KlwVzkGV3nC4tRF6kGUNA1vXG0Ykx4Lq6ccR9kYv6Cst108aQ/exec";
      const params = {
        action: "getLatestOrderNumber",
        sheetName: "Enquiry Tracker",
      };
  
      const urlParams = new URLSearchParams();
      for (const key in params) {
        urlParams.append(key, params[key]);
      }
  
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams,
      });
  
      const result = await response.json();
      if (result.success) {
        return result.latestOrderNumber || "DO-00"; // Return default if none exists
      }
      return "DO-00"; // Fallback
    } catch (error) {
      console.error("Error fetching latest order number:", error);
      return "DO-00"; // Fallback
    }
  };
  
  // Helper function to generate the next order number
  // const generateNextOrderNumber = (latestOrderNumber) => {
  //   // Extract the numeric part
  //   const match = latestOrderNumber.match(/DO-(\d+)/);
  //   let nextNumber = 1;
  
  //   if (match && match[1]) {
  //     nextNumber = parseInt(match[1], 10) + 1;
  //   }
  
  //   // Format with leading zeros
  //   const paddedNumber = String(nextNumber).padStart(2, "0");
  //   return `DO-${paddedNumber}`;
  // };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Call Tracker</h2>
          <p className="text-sm text-slate-500">
            Track the progress of the enquiry
            {formData.enquiryNo && <span className="font-medium"> for Enquiry #{formData.enquiryNo}</span>}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="enquiryNo" className="block text-sm font-medium text-gray-700">
                Enquiry No.
              </label>
              <input
                id="enquiryNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="En-01"
                value={formData.enquiryNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryStatus" className="block text-sm font-medium text-gray-700">
                Enquiry Status
              </label>
              <select
                id="enquiryStatus"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.enquiryStatus}
                onChange={handleInputChange}
                required
              >
                <option value="">Select status</option>
                {enquiryStatusOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
  <label htmlFor="customerFeedback" className="block text-sm font-medium text-gray-700">
    What Did Customer Say
  </label>
  <input
    list="customer-feedback-options"
    id="customerFeedback"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    placeholder="Select or type customer feedback"
    value={formData.customerFeedback}
    onChange={handleInputChange}
    required
  />
  <datalist id="customer-feedback-options">
    {customerFeedbackOptions.map((feedback, index) => (
      <option key={index} value={feedback} />
    ))}
  </datalist>
</div>


<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">Current Stage</label>
  <div className="space-y-1">
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="make-quotation"
        name="currentStage"
        value="make-quotation"
        checked={currentStage === "make-quotation"}
        onChange={async (e) => {
          setCurrentStage(e.target.value)
        }}
        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
      />
      <label htmlFor="make-quotation" className="text-sm text-gray-700">
        Make Quotation
      </label>
    </div>
    {/* <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="quotation-validation"
        name="currentStage"
        value="quotation-validation"
        checked={currentStage === "quotation-validation"}
        onChange={async (e) => {
          const stage = e.target.value
          setCurrentStage(stage)
          
          if (formData.enquiryNo) {
            // Fetch the latest quotation number for this enquiry
            const quotationNumber = await fetchLatestQuotationNumber(formData.enquiryNo)
            if (quotationNumber) {
              setValidationData(prev => ({
                ...prev,
                validationQuotationNumber: quotationNumber
              }))
            }
          }
        }}
        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
      />
      <label htmlFor="quotation-validation" className="text-sm text-gray-700">
        Quotation Validation
      </label>
    </div> */}
    <div className="flex items-center space-x-2">
      <input
        type="radio"
        id="order-expected"
        name="currentStage"
        value="order-expected"
        checked={currentStage === "order-expected"}
        onChange={async (e) => {
          setCurrentStage(e.target.value)
        }}
        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
      />
      <label htmlFor="order-expected" className="text-sm text-gray-700">
        Order Expected
      </label>
    </div>
  <div className="flex items-center space-x-2">
  <input
    type="radio"
    id="order-status"
    name="currentStage"
    value="order-status"
    checked={currentStage === "order-status"}
  onChange={(e) => {
  const stage = e.target.value;
  setCurrentStage(stage);
  
  // Use useEffect to handle the side effect instead
}}
    className="h-4 w-4 text-purple-600 focus:ring-purple-500"
  />
  <label htmlFor="order-status" className="text-sm text-gray-700">
    Order Status
  </label>
</div>
  </div>
</div>

            {currentStage === "make-quotation" && (
              <MakeQuotationForm 
                enquiryNo={formData.enquiryNo}
                formData={quotationData}
                onFieldChange={handleQuotationChange}
              />
            )}
            {currentStage === "quotation-validation" && (
              <QuotationValidationForm 
                enquiryNo={formData.enquiryNo}
                formData={validationData}
                onFieldChange={handleValidationChange}
              />
            )}
            {currentStage === "order-expected" && (
              <OrderExpectedForm 
                enquiryNo={formData.enquiryNo}
                formData={orderExpectedData}
                onFieldChange={handleOrderExpectedChange}
              />
            )}
            {currentStage === "order-status" && (
              <OrderStatusForm 
                enquiryNo={formData.enquiryNo}
                formData={orderStatusData}
                onFieldChange={handleOrderStatusChange}
                activeTab={activeTab}
              />
            )}
          </div>
          <div className="p-6 border-t flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewCallTracker