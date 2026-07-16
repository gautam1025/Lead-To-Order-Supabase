"use client"

import { useState, useContext, useEffect } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { AuthContext } from "../App"
import supabase from "../utils/supabase"

function NewFollowUp() {
  const navigate = useNavigate()
   const location = useLocation();
    const scName = location.state;
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
    enquiryApproach: "", // Add this new field
  })
console.log(scName);

  const [leadStatus, setLeadStatus] = useState("")

  // New state for dropdown options
  const [enquiryStates, setEnquiryStates] = useState([])
  const [salesTypes, setSalesTypes] = useState([])
  const [productCategories, setProductCategories] = useState([]) // New state for product categories
  const [nobOptions, setNobOptions] = useState([])
  const [enquiryApproachOptions, setEnquiryApproachOptions] = useState([])

  // Function to fetch dropdown data from DROPDOWNSHEET
 const fetchDropdownData = async () => {
    try {
      // Fetch states
      const { data: statesData, error: statesError } = await supabase
        .from('dropdown')
        .select('state')
        .not('state', 'is', null)
      
      if (statesError) throw statesError
      
      // Fetch sales types
      const { data: salesTypesData, error: salesTypesError } = await supabase
        .from('dropdown')
        .select('sales_type')
        .not('sales_type', 'is', null)
      
      if (salesTypesError) throw salesTypesError
      
      // Fetch product categories (item_name)
      const { data: productCategoriesData, error: productCategoriesError } = await supabase
        .from('dropdown')
        .select('item_name')
        .not('item_name', 'is', null)
      
      if (productCategoriesError) throw productCategoriesError
      
      // Fetch NOB options
      const { data: nobData, error: nobError } = await supabase
        .from('dropdown')
        .select('nob')
        .not('nob', 'is', null)
      
      if (nobError) throw nobError
      
      // Fetch enquiry approach options
      const { data: enquiryApproachData, error: enquiryApproachError } = await supabase
        .from('dropdown')
        .select('enquiry_approach')
        .not('enquiry_approach', 'is', null)
      
      if (enquiryApproachError) throw enquiryApproachError
      
      // Fetch customer feedback options
      const { data: customerFeedbackData, error: customerFeedbackError } = await supabase
        .from('dropdown')
        .select('what_did_customer_say')
        .not('what_did_customer_say', 'is', null)
      
      if (customerFeedbackError) throw customerFeedbackError

      // Process and set states
      if (statesData) {
        const uniqueStates = [...new Set(statesData.map(item => item.state))].filter(Boolean)
        setEnquiryStates(uniqueStates)
      }

      // Process and set sales types
      if (salesTypesData) {
        const uniqueSalesTypes = [...new Set(salesTypesData.map(item => item.sales_type))].filter(Boolean)
        setSalesTypes(uniqueSalesTypes)
      }

      // Process and set product categories
      if (productCategoriesData) {
        const uniqueProductCategories = [...new Set(productCategoriesData.map(item => item.item_name))].filter(Boolean)
        setProductCategories(uniqueProductCategories)
      }

      // Process and set NOB options
      if (nobData) {
        const uniqueNobOptions = [...new Set(nobData.map(item => item.nob))].filter(Boolean)
        setNobOptions(uniqueNobOptions)
      }

      // Process and set enquiry approach options
      if (enquiryApproachData) {
        const uniqueEnquiryApproachOptions = [...new Set(enquiryApproachData.map(item => item.enquiry_approach))].filter(Boolean)
        setEnquiryApproachOptions(uniqueEnquiryApproachOptions)
      }

      // Process and set customer feedback options
      if (customerFeedbackData) {
        const uniqueCustomerFeedbackOptions = [...new Set(customerFeedbackData.map(item => item.what_did_customer_say))].filter(Boolean)
        setCustomerFeedbackOptions(uniqueCustomerFeedbackOptions)
      }

    } catch (error) {
      console.error("Error fetching dropdown values:", error)
      // Fallback values
      setEnquiryStates(["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi"])
      setSalesTypes(["NBD", "CRR", "NBD_CRR"])
      setProductCategories(["Product 1", "Product 2", "Product 3"])
      setNobOptions(["NOB 1", "NOB 2", "NOB 3"])
      setEnquiryApproachOptions(["Approach 1", "Approach 2", "Approach 3"])
      setCustomerFeedbackOptions(["Feedback 1", "Feedback 2", "Feedback 3"])
    }
  }

  useEffect(() => {
    // Fetch dropdown data when component mounts
    fetchDropdownData()

    // Prepopulate lead number if available
    if (leadNo) {
      setFormData((prevData) => ({
        ...prevData,
        leadNo: leadNo,
      }))
    }
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
      "Timestamp": new Date().toISOString().split('T')[0], // Add this line
      "LD-Lead-No": formData.leadNo,
      "What_Did_The_Customer_say?": document.getElementById("customerFeedback").value,
      "SC_Name":scName,
      "Enquiry_Received_Status": enquiryStatus === "yes" ? "Yes" : 
                                enquiryStatus === "expected" ? "Expected" : 
                                enquiryStatus === "not-interested" ? "Not Interested" : enquiryStatus,
    }

    // Handle different scenarios based on enquiry status
   if (enquiryStatus === "expected") {
  insertData["Next_Action"] = document.getElementById("nextAction").value

  const nextCallDateInput = document.getElementById("nextCallDate").value
  insertData["Next_Call_Date"] = nextCallDateInput 
    ? new Date(nextCallDateInput).toISOString().split("T")[0] // "YYYY-MM-DD"
    : null

  const nextCallTimeInput = document.getElementById("nextCallTime").value
  insertData["Next_Call_Time"] = nextCallTimeInput || null // "HH:mm"
}

    else if (enquiryStatus === "yes") {
      // For confirmed enquiries, add all enquiry details
      const enquiryDateInput = document.getElementById("enquiryDate").value;
      insertData["Enquiry_Received_Date"] = enquiryDateInput ? new Date(enquiryDateInput).toISOString().split('T')[0] : null;
      
      insertData["Enquiry_for_State"] = document.getElementById("enquiryState").value
      insertData["Project_Name"] = document.getElementById("projectName").value
      insertData["Enquiry_Type"] = document.getElementById("salesType").value
      insertData["Enquiry_Approach"] = formData.enquiryApproach
      insertData["Leads_Tracking_Status"] = document.getElementById("leadsTrackingStatus").value
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

      // NEW: Store remaining items (after first 5) in JSON format
      const remainingItems = items.slice(5)
      if (remainingItems.length > 0) {
        // Create an array of objects with name and quantity
        const itemsJson = remainingItems.map(item => ({
          name: item.name || "",
          quantity: item.quantity || "0"
        }))
        insertData["Item_Qty"] = JSON.stringify(itemsJson)
      } else {
        insertData["Item_Qty"] = null // or "[]" if you prefer empty array
      }

      // Calculate total quantity for project approximate value
      const totalQuantity = calculateTotalQuantity()
      insertData["Total_Qty"] = totalQuantity.toString()
    }
    console.log("Data to be inserted:", insertData)

    // Insert data into Supabase leads_tracker table
    const { data, error } = await supabase
      .from('leads_tracker')
      .insert([insertData])
      .select()

    if (error) {
      throw error
    }

    console.log("Successfully inserted into leads_tracker:", data)

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
      console.log("Successfully cleared specified columns in leads_to_order")
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
    pad(now.getMonth() + 1) + "/" +   // months are 0-based
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
    }

      // NEW: Update the JSON field for remaining items
      updateData["Item/qty"] = insertData["Item_Qty"] || null
        updateData["Total Order Qty"] = insertData["Total_Qty"] || null
  


    // Update the leads_to_order table with new data
    const { data: updateResult, error: updateError } = await supabase
      .from('leads_to_order')
      .update(updateData)
      .eq('LD-Lead-No', formData.leadNo)
      .select()

    if (updateError) {
      console.error("Error updating leads_to_order:", updateError)
      // Don't throw error here, as the main insert was successful
      showNotification("Follow-up recorded successfully, but there was an issue updating the order table", "warning")
    } else {
      console.log("Successfully updated leads_to_order:", updateResult)
      showNotification("Follow-up recorded successfully", "success")
    }

    navigate("/follow-up")

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
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Lead Follow-Up</h2>
          <p className="text-sm text-slate-500">
            Record details of the follow-up call
            {leadId && <span className="font-medium"> for Lead #{leadId}</span>}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
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
                {/* <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cold"
                    name="leadStatus"
                    value="cold"
                    checked={leadStatus === "cold"}
                    onChange={() => setLeadStatus("cold")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="cold" className="text-sm text-gray-700">
                    Cold
                  </label>
                </div> */}
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
                    <label htmlFor="enquiryDate" className="block text-sm font-medium text-gray-700">
                      Enquiry Received Date
                    </label>
                    <input
                      id="enquiryDate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      value={formData.enquiryApproach}
                      onChange={handleChange}
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
          required
        >
          <option value="">Select status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

                  {/* <div className="space-y-2">
                    <label htmlFor="requiredDate" className="block text-sm font-medium text-gray-700">
                      Required Product Date
                    </label>
                    <input
                      id="requiredDate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="projectValue" className="block text-sm font-medium text-gray-700">
                      Project Approximate Value
                    </label>
                    <input
                      id="projectValue"
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter value"
                      required
                    />
                  </div> */}
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
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {isSubmitting ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewFollowUp
