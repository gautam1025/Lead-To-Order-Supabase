import { useState, useEffect, useCallback } from "react"
import supabase from "../../utils/supabase"

function OrderStatusForm({ formData, onFieldChange, enquiryNo,activeTab }) {
  const [orderStatus, setOrderStatus] = useState(formData.orderStatus || "")
  const [acceptanceViaOptions, setAcceptanceViaOptions] = useState([])
  const [paymentModeOptions, setPaymentModeOptions] = useState([])
  const [reasonStatusOptions, setReasonStatusOptions] = useState([])
  const [holdReasonOptions, setHoldReasonOptions] = useState([])
  const [paymentTermsOptions, setPaymentTermsOptions] = useState([])
  const [conveyedOptions, setConveyedOptions] = useState([])
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false)
  const [orderVideoError, setOrderVideoError] = useState("")
  const [transportModeOptions, setTransportModeOptions] = useState([])
  const [quotationNumbers, setQuotationNumbers] = useState([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false)
  const [creditDaysOptions, setCreditDaysOptions] = useState([])
  const [creditLimitOptions, setCreditLimitOptions] = useState([])
  
  // State for items fetched from Make_Quotation table
  const [quotationItems, setQuotationItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Fetch dropdown options from DROPDOWN sheet
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        setIsLoadingDropdowns(true)

        // ✅ Fetch all needed columns from Supabase
        const { data, error } = await supabase
          .from("dropdown")
          .select(
            `
              acceptance_via,
              payment_mode,
              payment_terms_in_days,
              transport_mode,
              credit_days,
              credit_limit,
              conveyd_for_registration_form,
              customer_order_hold_reason_category,
              if_no_then_get_relavant_status
            `
          )

        if (error) throw error

     if (data) {
  // helper fn to get unique, non-null, non-empty values
  const extractOptions = (key) =>
    [...new Set(data.map((row) => row[key]).filter((val) => val !== null && val !== ""))]

  const acceptance = extractOptions("acceptance_via")
  const paymentModes = extractOptions("payment_mode")
  const paymentTerms = extractOptions("payment_terms_in_days")
  console.log(paymentTerms);
  
  const transport = extractOptions("transport_mode")
  const creditDays = extractOptions("credit_days")
  const creditLimit = extractOptions("credit_limit")   // ⬅️ numeric now

  // ✅ If no credit limit data, fallback to [10, 20]


  const conveyed = extractOptions("conveyd_for_registration_form")
  const holdReasons = extractOptions("customer_order_hold_reason_category")
  const reasonStatus = extractOptions("if_no_then_get_relavant_status")

  // set states
  setAcceptanceViaOptions(acceptance)
  setPaymentModeOptions(paymentModes)
  setPaymentTermsOptions(paymentTerms)
  setTransportModeOptions(transport)
  setCreditDaysOptions(creditDays)
  setCreditLimitOptions(creditLimit)  // ⬅️ safe now
  setConveyedOptions(conveyed)
  setHoldReasonOptions(holdReasons)
  setReasonStatusOptions(reasonStatus)
}

      } catch (error) {
        console.error("Error fetching dropdown options:", error)

        // fallback values
        setAcceptanceViaOptions(["email", "phone", "in-person", "other"])
        setPaymentModeOptions(["cash", "check", "bank-transfer", "credit-card"])
        setReasonStatusOptions(["price", "competitor", "timeline", "specifications", "other"])
        setHoldReasonOptions(["budget", "approval", "project-delay", "reconsideration", "other"])
        setPaymentTermsOptions(["30", "45", "60", "90"])
        setConveyedOptions(["Yes", "No"])
        setTransportModeOptions(["Road", "Air", "Sea", "Rail"])
        setCreditDaysOptions(["30", "45", "60", "90"])
        setCreditLimitOptions(["10000", "25000", "50000", "100000"])
      } finally {
        setIsLoadingDropdowns(false)
      }
    }

    fetchDropdownOptions()
  }, [])

  // Fetch quotation numbers for the given enquiry number
 useEffect(() => {
  const fetchQuotationNumbers = async () => {
  if (!enquiryNo) return;
  
  try {
    setIsLoadingQuotations(true);
    
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
      return;
    }

    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .eq(filterColumn, enquiryNo);

    if (error) {
      console.error(`Supabase error fetching from ${tableName}:`, error);
      return;
    }

    if (data && data.length > 0) {
      const uniqueQuotations = [...new Set(data.map(item => item[columnName]).filter(item => item))];
      setQuotationNumbers(uniqueQuotations);
      
      // Auto-select only if we don't already have a value
      if (uniqueQuotations.length > 0 && !formData.orderStatusQuotationNumber) {
        onFieldChange('orderStatusQuotationNumber', uniqueQuotations[0]);
      }
    } else {
      setQuotationNumbers([]);
    }
  } catch (error) {
    console.error("Error fetching quotation numbers:", error);
  } finally {
    setIsLoadingQuotations(false);
  }
}
    
    fetchQuotationNumbers();
  }, [enquiryNo, formData.orderStatusQuotationNumber, onFieldChange, activeTab]);

   const stableOnFieldChange = useCallback(onFieldChange, [onFieldChange])


    //  useEffect(() => {
    //    if (quotationNumbers.length > 0 && !formData.orderStatusQuotationNumber) {
    //      stableOnFieldChange('orderStatusQuotationNumber', quotationNumbers[0]);
    //    }
    //  }, [quotationNumbers, formData.orderStatusQuotationNumber, stableOnFieldChange]);
   
  // Function to fetch items from Make_Quotation table based on quotation number
  const fetchItemsFromQuotation = async (quotationNumber) => {
    if (!quotationNumber) {
      setQuotationItems([])
      return
    }
    
    try {
      setIsLoadingItems(true)
      console.log("Fetching items for quotation number:", quotationNumber)
      
      const { data, error } = await supabase
        .from("Make_Quotation")
        .select("Items")
        .eq("Quotation_No", quotationNumber)
        .single()
      
      if (error) {
        console.error("Error fetching from Make_Quotation:", error)
        setQuotationItems([])
        return
      }
      
      if (data && data.Items) {
        // Parse Items JSON and extract name and qty
        let items = []
        try {
          items = typeof data.Items === 'string' ? JSON.parse(data.Items) : data.Items
        } catch (e) {
          console.error("Error parsing Items JSON:", e)
          items = []
        }
        
        // Extract only name and qty from items
        const extractedItems = items.map((item, index) => ({
          id: index + 1,
          name: item.name || "",
          qty: item.qty || 0
        }))
        
        console.log("Fetched items from Make_Quotation:", extractedItems)
        setQuotationItems(extractedItems)
        
        // Pass items to parent component
        onFieldChange('quotationItems', extractedItems)
      } else {
        console.log("No items found in Make_Quotation for:", quotationNumber)
        setQuotationItems([])
      }
    } catch (error) {
      console.error("Exception fetching items from Make_Quotation:", error)
      setQuotationItems([])
    } finally {
      setIsLoadingItems(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    onFieldChange(name, value)
  }

  const handleFileChange = (e) => {
    const { name } = e.target
    const file = e.target.files[0]
    
    if (name === "orderVideo" && !file) {
      setOrderVideoError("Order Video is mandatory")
    } else {
      setOrderVideoError("")
    }
    
    if (file) {
      onFieldChange(name, file)
    }
  }

  const handleStatusChange = (status) => {
    setOrderStatus(status)
    onFieldChange('orderStatus', status)
    
    // When "yes" is selected, fetch items from Make_Quotation table
    if (status === "yes" && formData.orderStatusQuotationNumber) {
      fetchItemsFromQuotation(formData.orderStatusQuotationNumber)
    } else {
      setQuotationItems([])
      onFieldChange('quotationItems', [])
    }
  }

  return (
    <div className="space-y-6 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Order Status</h3>
      <hr className="border-gray-200" />

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="orderStatusQuotationNumber" className="block text-sm font-medium text-gray-700">
            Quotation Number
          </label>
          {isLoadingQuotations ? (
            <div className="flex items-center space-x-2">
              <input
                id="orderStatusQuotationNumber"
                name="orderStatusQuotationNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Loading quotation numbers..."
                value={formData.orderStatusQuotationNumber || ""}
                onChange={handleChange}
                disabled
                required
              />
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          ) : quotationNumbers.length > 0 ? (
            <select
              id="orderStatusQuotationNumber"
              name="orderStatusQuotationNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.orderStatusQuotationNumber || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select quotation number</option>
              {quotationNumbers.map((quotation, index) => (
                <option key={index} value={quotation}>{quotation}</option>
              ))}
            </select>
          ) : (
            <input
              id="orderStatusQuotationNumber"
              name="orderStatusQuotationNumber"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter quotation number"
              value={formData.orderStatusQuotationNumber || ""}
              onChange={handleChange}
              required
            />
          )}
          {enquiryNo && quotationNumbers.length > 0 && !isLoadingQuotations && (
            <div className="text-xs text-green-600 mt-1">
              {quotationNumbers.length === 1 
                ? "Found matching quotation" 
                : `Found ${quotationNumbers.length} matching quotations`}
            </div>
          )}
          {enquiryNo && quotationNumbers.length === 0 && !isLoadingQuotations && (
            <div className="text-xs text-orange-500 mt-1">No matching quotations found for enquiry #{enquiryNo}</div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Is Order Received? Status</label>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-yes"
              name="orderStatus"
              value="yes"
              checked={orderStatus === "yes"}
              onChange={() => handleStatusChange("yes")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-yes" className="text-sm text-gray-700">
              YES
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-no"
              name="orderStatus"
              value="no"
              checked={orderStatus === "no"}
              onChange={() => handleStatusChange("no")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-no" className="text-sm text-gray-700">
              NO
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="order-hold"
              name="orderStatus"
              value="hold"
              checked={orderStatus === "hold"}
              onChange={() => handleStatusChange("hold")}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="order-hold" className="text-sm text-gray-700">
              HOLD
            </label>
          </div>
        </div>
      </div>

      {orderStatus === "yes" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Received Details</h4>

          {/* Items Display Section */}
          {isLoadingItems ? (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">Loading items from quotation...</p>
            </div>
          ) : quotationItems.length > 0 ? (
            <div className="space-y-3 p-4 bg-blue-50 rounded-md border border-blue-200">
              <h5 className="font-medium text-blue-800">Items from Quotation</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-md overflow-hidden">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-800">#</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-800">Item Name</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-blue-800">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotationItems.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Total Items: {quotationItems.length} | 
                Total Qty: {quotationItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-700">No items found in quotation. Please ensure the quotation number is correct.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="acceptanceVia" className="block text-sm font-medium text-gray-700">
                Acceptance Via
              </label>
              <select
                id="acceptanceVia"
                name="acceptanceVia"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.acceptanceVia || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select method</option>
                {acceptanceViaOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentMode" className="block text-sm font-medium text-gray-700">
                Payment Mode
              </label>
              <select
                id="paymentMode"
                name="paymentMode"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.paymentMode || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select mode</option>
                {paymentModeOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <input
                id="destination"
                name="destination"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter destination"
                value={formData.destination || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="poNumber" className="block text-sm font-medium text-gray-700">
                PO Number
              </label>
              <input
                id="poNumber"
                name="poNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter PO number"
                value={formData.poNumber || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">
                Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.paymentTerms || ""}
                onChange={handleChange}
                required
              >
                <option value="">Select payment terms</option>
                {paymentTermsOptions.map((option, index) => (
                  <option key={index} value={option}>{option} days</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
  <label htmlFor="transportMode" className="block text-sm font-medium text-gray-700">
    Transport Mode
  </label>
  <select
    id="transportMode"
    name="transportMode"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={formData.transportMode || ""}
    onChange={handleChange}
  >
    <option value="">Select transport mode</option>
    {transportModeOptions.map((option, index) => (
      <option key={index} value={option.toLowerCase()}>{option}</option>
    ))}
  </select>
</div>

<div className="space-y-2">
  <label htmlFor="creditDays" className="block text-sm font-medium text-gray-700">
    Credit Days
  </label>
  <select
    id="creditDays"
    name="creditDays"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    value={formData.creditDays || ""}
    onChange={handleChange}
  >
    <option value="">Select credit days</option>
    {creditDaysOptions.map((option, index) => (
      <option key={index} value={option}>{option}</option>
    ))}
  </select>
</div>

   <div className="space-y-2">
              <label htmlFor="creditLimit" className="block text-sm font-medium text-gray-700">
                Credit Limit
              </label>
              <select
                id="creditLimit"
                name="creditLimit"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.creditLimit || ""}
                onChange={handleChange}
              >
                <option value="">Select credit limit</option>
                {creditLimitOptions.map((option, index) => (
                  <option key={index} value={option}>{option.toLocaleString()}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="conveyedForRegistration" className="block text-sm font-medium text-gray-700">
                CONVEYED FOR REGISTRATION FORM
              </label>
              <select
                id="conveyedForRegistration"
                name="conveyedForRegistration"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.conveyedForRegistration || ""}
                onChange={handleChange}
              >
                <option value="">Select option</option>
                {conveyedOptions.map((option, index) => (
                  <option key={index} value={option.toLowerCase()}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
  <label htmlFor="orderVideo" className="block text-sm font-medium text-gray-700">
    Offer No.
  </label>
  <select
    id="orderVideo"
    name="orderVideo"
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
    onChange={handleChange}
  >
    <option value="">Select an option</option>
    <option value="yes">Yes</option>
    <option value="no">No</option>
  </select>
</div>

          <div className="space-y-2">
            <label htmlFor="acceptanceFile" className="block text-sm font-medium text-gray-700">
              Acceptance File Upload
            </label>
            <input
              id="acceptanceFile"
              name="acceptanceFile"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="orderRemark" className="block text-sm font-medium text-gray-700">
              REMARK
            </label>
            <textarea
              id="orderRemark"
              name="orderRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter remarks"
              value={formData.orderRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {orderStatus === "no" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Lost Details</h4>

          <div className="space-y-2">
            <label htmlFor="apologyVideo" className="block text-sm font-medium text-gray-700">
              Order Lost Apology Video
            </label>
            <input
              id="apologyVideo"
              name="apologyVideo"
              type="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonStatus" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Status
            </label>
            <select
              id="reasonStatus"
              name="reasonStatus"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.reasonStatus || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select reason</option>
              {reasonStatusOptions.map((option, index) => (
                <option key={index} value={option.toLowerCase()}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="reasonRemark" className="block text-sm font-medium text-gray-700">
              If No then get relevant reason Remark
            </label>
            <textarea
              id="reasonRemark"
              name="reasonRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter reason remarks"
              value={formData.reasonRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {orderStatus === "hold" && (
        <div className="space-y-4 border p-4 rounded-md">
          <h4 className="font-medium">Order Hold Details</h4>

          <div className="space-y-2">
            <label htmlFor="holdReason" className="block text-sm font-medium text-gray-700">
              CUSTOMER ORDER HOLD REASON CATEGORY
            </label>
            <select
              id="holdReason"
              name="holdReason"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.holdReason || ""}
              onChange={handleChange}
              required
            >
              <option value="">Select reason</option>
              {holdReasonOptions.map((option, index) => (
                <option key={index} value={option.toLowerCase()}>{option}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="holdingDate" className="block text-sm font-medium text-gray-700">
              HOLDING DATE
            </label>
            <input
              id="holdingDate"
              name="holdingDate"
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.holdingDate || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="holdRemark" className="block text-sm font-medium text-gray-700">
              HOLD REMARK
            </label>
            <textarea
              id="holdRemark"
              name="holdRemark"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter hold remarks"
              value={formData.holdRemark || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderStatusForm