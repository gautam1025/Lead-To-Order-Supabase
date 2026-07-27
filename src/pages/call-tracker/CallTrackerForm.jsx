"use client"

import { useState, useContext, useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AuthContext } from "../../App"
import supabase from "../../utils/supabase"

function NewCallTracker() {
  const navigate = useNavigate()
   const location = useLocation();
  const [searchParams] = useSearchParams()
  const leadId = searchParams.get("leadId")
  const leadNo = searchParams.get("leadNo")
  const { showNotification } = useContext(AuthContext)
  const [customerFeedbackOptions, setCustomerFeedbackOptions] = useState([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [enquiryStatus, setEnquiryStatus] = useState("")
  const [items, setItems] = useState([{ id: "1", name: "", quantity: "" }])
  const [formData, setFormData] = useState({
    leadNo: "",
    nextAction: "",
    nextCallDate: "",
    nextCallTime: "",
    customerFeedback: "",
    otherRemarks: "",
    enquiryApproach: "",
  })

  const [leadStatus, setLeadStatus] = useState("")

  // Form fields states
  const [leadSource, setLeadSource] = useState("")
  const [scName, setScName] = useState(location.state || "")
  const [companyName, setCompanyName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [salesPersonName, setSalesPersonName] = useState("")
  const [billingLocation, setBillingLocation] = useState("")
  const [emailAddress, setEmailAddress] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [enquiryReceiverName, setEnquiryReceiverName] = useState("")
  const [enquiryAssignToProject, setEnquiryAssignToProject] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [enquiryDate, setEnquiryDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  })
  const [enquiryState, setEnquiryState] = useState("")
  const [projectName, setProjectName] = useState("")
  const [salesType, setSalesType] = useState("")
  const [enquiryApproach, setEnquiryApproach] = useState("")
  const [leadsTrackingStatus, setLeadsTrackingStatus] = useState("Pending")

  // New state for dropdown options
  const [enquiryStates, setEnquiryStates] = useState([])
  const [salesTypes, setSalesTypes] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [nobOptions, setNobOptions] = useState([])
  const [enquiryApproachOptions, setEnquiryApproachOptions] = useState([])
  const [leadSources, setLeadSources] = useState([])
  const [receiverOptions, setReceiverOptions] = useState([])
  const [assignToProjectOptions, setAssignToProjectOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyDetailsMap, setCompanyDetailsMap] = useState({})

  // Function to fetch dropdown data from Supabase (normalized category/value schema)
  const fetchDropdownData = async () => {
    // Helper: fetch all values for a given category
    const fetchCategory = (category) =>
      supabase.from('dropdown').select('value').eq('category', category);

    try {
      const [
        { data: statesData, error: statesError },
        { data: salesTypesData, error: salesTypesError },
        { data: productCatData, error: productCatError },
        { data: nobData, error: nobError },
        { data: approachData, error: approachError },
        { data: feedbackData, error: feedbackError },
        { data: sourcesData, error: sourcesError },
        { data: receiversData, error: receiversError },
        { data: scData, error: scError },
      ] = await Promise.all([
        fetchCategory('state'),
        fetchCategory('sales_type'),
        fetchCategory('item_name'),
        fetchCategory('nob'),
        fetchCategory('enquiry_approach'),
        fetchCategory('what_did_customer_say'),
        fetchCategory('lead_source'),
        fetchCategory('lead_receiver_name'),
        fetchCategory('sc_name'),
      ]);

      const toValues = (arr) => [...new Set((arr || []).map(i => i.value).filter(Boolean))].sort();

      setEnquiryStates(toValues(statesData))
      setSalesTypes(toValues(salesTypesData))
      setProductCategories(toValues(productCatData))
      setNobOptions(toValues(nobData))
      setEnquiryApproachOptions(toValues(approachData).length > 0 ? toValues(approachData) : ['Incoming', 'Outgoing'])
      setCustomerFeedbackOptions(toValues(feedbackData))
      setLeadSources(toValues(sourcesData))
      setReceiverOptions(toValues(receiversData))
      setAssignToProjectOptions(toValues(scData))

    } catch (error) {
      console.error('Error fetching dropdown values:', error)
      setEnquiryStates(['Maharashtra', 'Gujarat', 'Karnataka', 'Tamil Nadu', 'Delhi'])
      setSalesTypes(['NBD', 'CRR', 'NBD_CRR'])
      setProductCategories(['Product 1', 'Product 2', 'Product 3'])
      setNobOptions(['NOB 1', 'NOB 2', 'NOB 3'])
      setEnquiryApproachOptions(['Incoming', 'Outgoing'])
      setCustomerFeedbackOptions(['Feedback 1', 'Feedback 2', 'Feedback 3'])
      setLeadSources(['Indiamart', 'Justdial', 'Social Media', 'Website', 'Referral', 'Other'])
      setReceiverOptions(['Receiver 1', 'Receiver 2'])
      setAssignToProjectOptions(['Person 1', 'Person 2'])
    }
  }

  // Fetch company options and details
  const fetchCompanyData = async () => {
    try {
      let data = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data: pageData, error } = await supabase
          .from("dropdown")
          .select("lead_form_company_name, lead_form_person_name, lead_form_mobile_no, lead_form_email, lead_form_address")
          .not("lead_form_company_name", "is", null)
          .range(from, from + step - 1);

        if (error) throw error;

        if (pageData && pageData.length > 0) {
          data = [...data, ...pageData];
          from += step;
          if (pageData.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      if (data && data.length > 0) {
        const companies = []
        const detailsMap = {}

        data.forEach((row) => {
          if (row.lead_form_company_name) {
            companies.push(row.lead_form_company_name)
            detailsMap[row.lead_form_company_name] = {
              salesPerson: row.lead_form_person_name || "",
              phoneNumber: row.lead_form_mobile_no || "",
              email: row.lead_form_email || "",
              billingAddress: row.lead_form_address || "",
              shippingAddress: row.lead_form_address || "",
            }
          }
        })

        setCompanyOptions([...new Set(companies)].sort())
        setCompanyDetailsMap(detailsMap)
      }
    } catch (error) {
      console.error("Error fetching company data:", error)
    }
  }

  const handleCompanyChange = (companyNameValue) => {
    setCompanyName(companyNameValue)
    if (companyNameValue && companyDetailsMap[companyNameValue]) {
      const details = companyDetailsMap[companyNameValue]
      setPhoneNumber(details.phoneNumber || "")
      setSalesPersonName(details.salesPerson || "")
      setBillingLocation(details.billingAddress || "")
      setGstNumber(details.gstNumber || "")
      setShippingAddress(details.shippingAddress || "")
    }
  }

  const handleSourceChange = (sourceValue) => {
    setLeadSource(sourceValue)
  }

  useEffect(() => {
    fetchDropdownData()
    fetchCompanyData()

    if (leadNo) {
      setFormData((prevData) => ({
        ...prevData,
        leadNo: leadNo,
      }))
    }
  }, [leadNo])

  // Prefill lead details
  useEffect(() => {
    const loadLeadDetails = async () => {
      if (leadNo) {
        try {
          const { data, error } = await supabase
            .from("leads_to_order")
            .select("*")
            .eq("LD-Lead-No", leadNo)
            .maybeSingle()

          if (error) throw error
          if (data) {
            setLeadSource(data.Lead_Source || "")
            setScName(data.SC_Name || "")
            setCompanyName(data.Company_Name || "")
            setPhoneNumber(data.Phone_Number || "")
            setSalesPersonName(data.Salesperson_Name || "")
            setBillingLocation(data.Location || "")
            setEmailAddress(data.Email_Address || "")
            setShippingAddress(data.Address || "")
            setEnquiryReceiverName(data.Lead_Receiver_Name || "")
            setGstNumber(data.GST_Number || "")
            setEnquiryState(data.State || "")
            setProjectName(data.NOB || "")
            setSalesType(data.Sales_Type || "")
            setEnquiryApproach(data.Enquiry_Approach || "")
            setLeadsTrackingStatus(data.Leads_Tracking_Status || "Pending")
            setLeadStatus(data.Status || "")
            
            // Prefill items
            const loadedItems = []
            for (let i = 1; i <= 5; i++) {
              const name = data[`Item_Name${i}`]
              const quantity = data[`Quantity${i}`]
              if (name) {
                loadedItems.push({
                  id: i.toString(),
                  name: name,
                  quantity: quantity || ""
                })
              }
            }
            if (data["Item/qty"]) {
              try {
                const remaining = JSON.parse(data["Item/qty"])
                remaining.forEach((item, index) => {
                  loadedItems.push({
                    id: (loadedItems.length + 1).toString(),
                    name: item.name || "",
                    quantity: item.quantity || ""
                  })
                })
              } catch (e) {
                console.error("Error parsing Item/qty JSON:", e)
              }
            }
            if (loadedItems.length > 0) {
              setItems(loadedItems)
            } else {
              setItems([{ id: "1", name: "", quantity: "" }])
            }
          }
        } catch (error) {
          console.error("Error loading lead details:", error)
        }
      }
    }
    loadLeadDetails()
  }, [leadNo])


  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }))
  }

  const calculateTotalQuantity = () => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0
      return total + quantity
    }, 0)
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  setIsSubmitting(true)

  try {
    // Prepare the data object for Supabase insertion
    const insertData = {
      "Timestamp": new Date().toISOString().split('T')[0],
      "LD-Lead-No": formData.leadNo,
      "What_Did_The_Customer_say?": formData.customerFeedback,
      "other_remarks": formData.customerFeedback === "Other" ? formData.otherRemarks : null,
      "SC_Name": scName,
      "Company_Name": companyName,
      "Enquiry_Received_Status": enquiryStatus === "yes" ? "yes" : 
                                enquiryStatus === "expected" ? "expected" : 
                                enquiryStatus === "not-interested" ? "not-interested" : enquiryStatus,
    }

    // Handle different scenarios based on enquiry status
    if (enquiryStatus === "expected") {
      insertData["Next_Action"] = formData.nextAction
      insertData["Next_Call_Date"] = formData.nextCallDate ? new Date(formData.nextCallDate).toISOString().split("T")[0] : null
      insertData["Next_Call_Time"] = formData.nextCallTime || null
    }
    else if (enquiryStatus === "yes") {
      // For confirmed enquiries, add all enquiry details
      insertData["Enquiry_Received_Date"] = enquiryDate ? new Date(enquiryDate).toISOString().split('T')[0] : null
      insertData["Enquiry_for_State"] = enquiryState
      insertData["Project_Name"] = projectName
      insertData["Enquiry_Type"] = salesType
      insertData["Enquiry_Approach"] = enquiryApproach
      insertData["Leads_Tracking_Status"] = leadsTrackingStatus
      insertData["lead_status"] = leadStatus
      
      // Handle first 5 items
      const first5Items = items.slice(0, 5)
      first5Items.forEach((item, index) => {
        const itemNumber = index + 1
        insertData[`Item_Name${itemNumber}`] = item.name || ""
        insertData[`Quantity${itemNumber}`] = item.quantity || "0"
      })

      // Fill remaining item slots with empty values if less than 5 items
      for (let i = first5Items.length + 1; i <= 5; i++) {
        insertData[`Item_Name${i}`] = ""
        insertData[`Quantity${i}`] = "0"
      }

      // Store remaining items in JSON format
      const remainingItems = items.slice(5)
      if (remainingItems.length > 0) {
        const itemsJson = remainingItems.map(item => ({
          name: item.name || "",
          quantity: item.quantity || "0"
        }))
        insertData["Item_Qty"] = JSON.stringify(itemsJson)
      } else {
        insertData["Item_Qty"] = null
      }

      // Calculate total quantity
      const totalQuantity = calculateTotalQuantity()
      insertData["Total_Qty"] = totalQuantity.toString()
    }

    // Insert data into Supabase leads_tracker table
    const { data, error } = await supabase
      .from('leads_tracker')
      .insert([insertData])
      .select()

    if (error) {
      throw error
    }


    // First, clear all the specified columns in leads_to_order table
    const clearData = {
      "What_Did_The_Customer say?": null,
      "Enquiry_Received_Status": null,
      "Enquiry_Received_Date": null,
      "Enquiry_for_State": null,
      "Project_Name": null,
      "Enquiry_Type": null,
      "Enquiry_Approach": null,
      "Project_Approximate_Value": null,
      "Item_Name1": null,
      "Quantity1": null,
      "Item_Name2": null,
      "Quantity2": null,
      "Item_Name3": null,
      "Quantity3": null,
      "Item_Name4": null,
      "Quantity4": null,
      "Item_Name5": null,
      "Quantity5": null,
      "Next_Action": null,
      "Next_Call_Date": null,
      "Next_Call_Time": null
    }

    // Clear the columns first
    const { error: clearError } = await supabase
      .from('leads_to_order')
      .update(clearData)
      .eq('LD-Lead-No', formData.leadNo)

    if (clearError) {
      console.error("Error clearing leads_to_order columns:", clearError)
    } else {
    }

    // Prepare update data for leads_to_order table
    const updateData = {}
    
    // Map the fields that need to be updated
    updateData["What_Did_The_Customer say?"] = insertData["What_Did_The_Customer_say?"]
    updateData["Enquiry_Received_Status"] = insertData["Enquiry_Received_Status"]
    updateData["Status"] = insertData["lead_status"]
    if (leadStatus === "Not Relevant") {
      const now = new Date();
      const pad = (n) => n.toString().padStart(2, "0");
      const formatted =
        pad(now.getDate()) + "/" +
        pad(now.getMonth() + 1) + "/" +
        now.getFullYear() + " " +
        pad(now.getHours()) + ":" +
        pad(now.getMinutes()) + ":" +
        pad(now.getSeconds());

      updateData["Actual"] = formatted;
    }

    if (enquiryStatus === "expected") {
      updateData["Next_Action"] = insertData["Next_Action"]
      updateData["Next_Call_Date"] = insertData["Next_Call_Date"]
      updateData["Next_Call_Time"] = insertData["Next_Call_Time"]
    }
    
    if (enquiryStatus === "yes") {
      updateData["Enquiry_Received_Date"] = insertData["Enquiry_Received_Date"]
      updateData["Enquiry_for_State"] = insertData["Enquiry_for_State"]
      updateData["Project_Name"] = insertData["Project_Name"]
      updateData["Enquiry_Type"] = insertData["Enquiry_Type"]
      updateData["Enquiry_Approach"] = insertData["Enquiry_Approach"]
      updateData["Project_Approximate_Value"] = insertData["Project_Approximate_Value"]
      updateData["Leads_Tracking_Status"] = insertData["Leads_Tracking_Status"]
      
      // Update item fields
      for (let i = 1; i <= 5; i++) {
        updateData[`Item_Name${i}`] = insertData[`Item_Name${i}`] || ""
        updateData[`Quantity${i}`] = insertData[`Quantity${i}`] || "0"
      }

      // Update lead details in leads_to_order
      updateData["Lead_Source"] = leadSource
      updateData["SC_Name"] = scName
      updateData["Company_Name"] = companyName
      updateData["Phone_Number"] = phoneNumber
      updateData["Salesperson_Name"] = salesPersonName
      updateData["Location"] = billingLocation
      updateData["Email_Address"] = emailAddress
      updateData["Address"] = shippingAddress
      updateData["Lead_Receiver_Name"] = enquiryReceiverName
      updateData["GST_Number"] = gstNumber
    }

    updateData["Item/qty"] = insertData["Item_Qty"] || null
    updateData["Total Order Qty"] = insertData["Total_Qty"] || null

    // Update the leads_to_order table with new data
    const { data: updateResult, error: updateError } = await supabase
      .from('leads_to_order')
      .update(updateData)
      .eq('LD-Lead-No', formData.leadNo)
      .select()

    if (leadStatus === "Not Relevant" && companyName) {
      try {
        const { error: cmErr } = await supabase
          .from("client_master")
          .update({ "isRelevant": false, updated_at: new Date().toISOString() })
          .eq("company_name", companyName.trim());
        if (cmErr) {
          console.error("Error updating client_master relevance:", cmErr);
        }
      } catch (err) {
        console.error("Failed to mark company as not relevant:", err);
      }
    }

    if (updateError) {
      console.error("Error updating leads_to_order:", updateError)
      showNotification("Follow-up recorded successfully, but there was an issue updating the order table", "warning")
    } else {
      showNotification("Follow-up recorded successfully", "success")
    }

    navigate("/call-tracker")

  } catch (error) {
    console.error("Error submitting form:", error)
    showNotification("Error submitting form: " + error.message, "error")
  } finally {
    setIsSubmitting(false)
  }
}

  // Function to format date as dd/mm/yyyy
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const addItem = () => {
    // Define maximum number of items allowed
    const MAX_ITEMS = 300

    // Only add a new item if we haven't reached the maximum
    if (items.length < MAX_ITEMS) {
      const newId = (items.length + 1).toString()
      setItems([...items, { id: newId, name: "", quantity: "" }])
    }
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="container mx-auto py-1 px-2">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="px-3 py-2 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">Lead Follow-Up</h2>
          <p className="text-[11px] text-slate-500">
            Record details of the follow-up call
            {leadId && <span className="font-medium text-amber-600"> for Lead #{leadId}</span>}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-2 space-y-3">
            <div className="space-y-2">
              <label htmlFor="enquiryNo" className="block text-sm font-medium text-gray-700">
                Lead No.
              </label>
              <input
                id="enquiryNo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="LD-001"
                value={formData.leadNo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
  <label htmlFor="customerFeedback" className="block text-sm font-medium text-gray-700">
    What did the customer say?
  </label>
  <select
    id="customerFeedback"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
    value={formData.customerFeedback || ""}
    onChange={handleChange}
    required
  >
    <option value="">Select customer feedback</option>
    {customerFeedbackOptions.map((feedback, index) => (
      <option key={index} value={feedback}>
        {feedback}
      </option>
    ))}
  </select>
</div>

{formData.customerFeedback === "Other" && (
  <div className="space-y-2">
    <label htmlFor="otherRemarks" className="block text-sm font-medium text-gray-700">
      Other Remarks
    </label>
    <input
      type="text"
      id="otherRemarks"
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
      placeholder="Enter remarks for Other"
      value={formData.otherRemarks || ""}
      onChange={handleChange}
      required
    />
  </div>
)}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Lead Status</label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="hot"
                    name="leadStatus"
                    value="hot"
                    checked={leadStatus === "Relevant"}
                    onChange={() => setLeadStatus("Relevant")}
                    className="h-4 w-4 text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="hot" className="text-sm text-gray-700">
                    Relevant
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="warm"
                    name="leadStatus"
                    value="warm"
                    checked={leadStatus === "Not Relevant"}
                    onChange={() => setLeadStatus("Not Relevant")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="warm" className="text-sm text-gray-700">
                    Not Relevant
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Enquiry Received Status</label>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="yes"
                    name="enquiryStatus"
                    value="yes"
                    checked={enquiryStatus === "yes"}
                    onChange={() => setEnquiryStatus("yes")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="yes" className="text-sm text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="expected"
                    name="enquiryStatus"
                    value="expected"
                    checked={enquiryStatus === "expected"}
                    onChange={() => setEnquiryStatus("expected")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="expected" className="text-sm text-gray-700">
                    Expected
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="not-interested"
                    name="enquiryStatus"
                    value="not-interested"
                    checked={enquiryStatus === "not-interested"}
                    onChange={() => setEnquiryStatus("not-interested")}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="not-interested" className="text-sm text-gray-700">
                    Not Interested
                  </label>
                </div>
              </div>
            </div>

            {enquiryStatus === "expected" && (
              <div className="space-y-4 border p-4 rounded-md">
                <div className="space-y-2">
                  <label htmlFor="nextAction" className="block text-sm font-medium text-gray-700">
                    Next Action
                  </label>
                  <input
                    id="nextAction"
                    value={formData.nextAction || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter next action"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="nextCallDate" className="block text-sm font-medium text-gray-700">
                      Next Call Date
                    </label>
                    <input
                      id="nextCallDate"
                      type="date"
                      value={formData.nextCallDate || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="nextCallTime" className="block text-sm font-medium text-gray-700">
                      Next Call Time
                    </label>
                    <input
                      id="nextCallTime"
                      type="time"
                      value={formData.nextCallTime || ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {enquiryStatus === "yes" && (
              <div className="space-y-6 border p-4 rounded-md">
                <h3 className="text-lg font-medium">Enquiry Details</h3>
                <hr className="border-gray-200" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700">
                      Enquiry Source
                    </label>
                    <select
                      id="leadSource"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      value={leadSource}
                      onChange={(e) => handleSourceChange(e.target.value)}
                      required
                    >
                      <option value="">Select source</option>
                      {leadSources.map((source, index) => (
                        <option key={index} value={source}>
                          {source}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="scName" className="block text-sm font-medium text-gray-700">
                      SC Name
                    </label>
                    <input
                      id="scName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Auto-fills from Lead Source"
                      value={scName}
                      onChange={(e) => setScName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name
                    </label>
                    <input
                      list="companyOptions"
                      id="companyName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={companyName}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      required
                    />
                    <datalist id="companyOptions">
                      {companyOptions.map((company, index) => (
                        <option key={index} value={company} />
                      ))}
                    </datalist>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="salesPersonName" className="block text-sm font-medium text-gray-700">
                      Person Name
                    </label>
                    <input
                      id="salesPersonName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter person name"
                      value={salesPersonName}
                      onChange={(e) => setSalesPersonName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Billing Address
                    </label>
                    <input
                      id="location"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter billing address"
                      value={billingLocation}
                      onChange={(e) => setBillingLocation(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      id="emailAddress"
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter email address"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
                      Shipping Address
                    </label>
                    <input
                      id="shippingAddress"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter shipping address"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="enquiryReceiverName" className="block text-sm font-medium text-gray-700">
                      Enquiry Receiver Name
                    </label>
                    <select
                      id="enquiryReceiverName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      value={enquiryReceiverName}
                      onChange={(e) => setEnquiryReceiverName(e.target.value)}
                    >
                      <option value="">Select receiver</option>
                      {receiverOptions.map((receiver, index) => (
                        <option key={index} value={receiver}>
                          {receiver}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="enquiryAssignToProject" className="block text-sm font-medium text-gray-700">
                      Enquiry Assign to Person
                    </label>
                    <select
                      id="enquiryAssignToProject"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      value={enquiryAssignToProject}
                      onChange={(e) => setEnquiryAssignToProject(e.target.value)}
                    >
                      <option value="">Select project</option>
                      {assignToProjectOptions.map((project, index) => (
                        <option key={index} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                      GST Number
                    </label>
                    <input
                      id="gstNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter GST number"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="enquiryDate" className="block text-sm font-medium text-gray-700">
                      Enquiry Received Date
                    </label>
                    <input
                      id="enquiryDate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={enquiryDate}
                      onChange={(e) => setEnquiryDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="enquiryState" className="block text-sm font-medium text-gray-700">
                      Enquiry for State
                    </label>
                    <select
                      id="enquiryState"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={enquiryState}
                      onChange={(e) => setEnquiryState(e.target.value)}
                      required
                    >
                      <option value="">Select state</option>
                      {enquiryStates.map((state, index) => (
                        <option key={index} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                      NOB
                    </label>
                    <select
                      id="projectName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                    >
                      <option value="">Select NOB</option>
                      {nobOptions.map((nob, index) => (
                        <option key={index} value={nob}>
                          {nob}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="salesType" className="block text-sm font-medium text-gray-700">
                      Enquiry Type
                    </label>
                    <select
                      id="salesType"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={salesType}
                      onChange={(e) => setSalesType(e.target.value)}
                      required
                    >
                      <option value="">Select type</option>
                      {salesTypes.map((type, index) => (
                        <option key={index} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="enquiryApproach" className="block text-sm font-medium text-gray-700">
                      Enquiry Approach
                    </label>
                    <select
                      id="enquiryApproach"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={enquiryApproach}
                      onChange={(e) => setEnquiryApproach(e.target.value)}
                      required
                    >
                      <option value="">Select approach</option>
                      {enquiryApproachOptions.map((approach, index) => (
                        <option key={index} value={approach}>
                          {approach}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
        <label htmlFor="leadsTrackingStatus" className="block text-sm font-medium text-gray-700">
          Leads Tracking Status
        </label>
        <select
          id="leadsTrackingStatus"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          value={leadsTrackingStatus}
          onChange={(e) => setLeadsTrackingStatus(e.target.value)}
          required
        >
          <option value="">Select status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
    </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Items</h4>
                    <button
                      type="button"
                      onClick={addItem}
                      className="px-3 py-1 text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md"
                      disabled={items.length >= 300}
                    >
                      + Add Item ({items.length}/300)
                    </button>
                  </div>

                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                      <div className="md:col-span-5 space-y-2">
  <label htmlFor={`itemName-${item.id}`} className="block text-sm font-medium text-gray-700">
    Item Name 1
  </label>
  <input
    list={`item-options-${item.id}`}
    id={`itemName-${item.id}`}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
    value={item.name}
    onChange={(e) => updateItem(item.id, "name", e.target.value)}
    required
    placeholder="Select or type item name"
  />
  <datalist id={`item-options-${item.id}`}>
    {productCategories.map((category, index) => (
      <option key={index} value={category} />
    ))}
  </datalist>
</div>


                      <div className="md:col-span-5 space-y-2">
                        <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700">
                          Quantity
                        </label>
                        <input
                          id={`quantity-${item.id}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                          placeholder="Enter quantity"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t flex justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
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
