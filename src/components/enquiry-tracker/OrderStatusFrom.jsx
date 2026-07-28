import { useState, useEffect, useCallback } from "react"
import supabase from "../../utils/supabase"

function OrderStatusForm({ formData, onFieldChange, enquiryNo, activeTab }) {
  const [orderStatus, setOrderStatus] = useState(formData.orderStatus || "")
  const [acceptanceViaOptions, setAcceptanceViaOptions] = useState(["email", "phone", "in-person", "other"])
  const [paymentModeOptions, setPaymentModeOptions] = useState(["cash", "check", "bank-transfer", "credit-card"])
  const [reasonStatusOptions, setReasonStatusOptions] = useState(["price", "competitor", "timeline", "specifications", "other"])
  const [holdReasonOptions, setHoldReasonOptions] = useState(["budget", "approval", "project-delay", "reconsideration", "other"])
  const [paymentTermsOptions, setPaymentTermsOptions] = useState(["30", "45", "60", "90"])
  const [conveyedOptions, setConveyedOptions] = useState(["Yes", "No"])
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false)
  const [orderVideoError, setOrderVideoError] = useState("")
  const [transportModeOptions, setTransportModeOptions] = useState(["Road", "Air", "Sea", "Rail"])
  const [quotationNumbers, setQuotationNumbers] = useState([])
  const [isLoadingQuotations, setIsLoadingQuotations] = useState(false)
  const [creditDaysOptions, setCreditDaysOptions] = useState(["30", "45", "60", "90"])
  const [creditLimitOptions, setCreditLimitOptions] = useState(["10000", "25000", "50000", "100000"])
  const [approvedByOptions, setApprovedByOptions] = useState([])

  // State for items fetched from Make_Quotation table
  const [quotationItems, setQuotationItems] = useState([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  // Helper for normalized dropdown table: fetch values for a given category
  const fetchCategory = (category) =>
    supabase.from("dropdown").select("value").eq("category", category);

  // Fetch approved_by options from dropdown table
  useEffect(() => {
    const fetchApprovedBy = async () => {
      try {
        const { data, error } = await fetchCategory("approved_by");
        if (!error && data) {
          setApprovedByOptions([...new Set(data.map(item => item.value).filter(Boolean))].sort());
        }
      } catch (err) {
        console.error("Error fetching approved_by dropdown:", err);
      }
    };
    fetchApprovedBy();
  }, []);

  // Fetch dynamic dropdown options from dropdown table (normalized category/value schema)
  // conveyd_for_registration_form stays hardcoded Yes/No per task.txt
  useEffect(() => {
    setConveyedOptions(["Yes", "No"]); // hardcoded per task.txt

    const fetchOrderStatusDropdowns = async () => {
      try {
        const [
          { data: avData, error: avErr },
          { data: pmData, error: pmErr },
          { data: rsData, error: rsErr },
          { data: hrData, error: hrErr },
          { data: ptData, error: ptErr },
          { data: tmData, error: tmErr },
          { data: cdData, error: cdErr },
          { data: clData, error: clErr },
        ] = await Promise.all([
          fetchCategory("acceptance_via"),
          fetchCategory("payment_mode"),
          fetchCategory("if_no_then_get_relavant_status"),
          fetchCategory("customer_order_hold_reason_category"),
          fetchCategory("payment_terms"),
          fetchCategory("transport_mode"),
          fetchCategory("credit_days"),
          fetchCategory("credit_limit"),
        ]);

        const toValues = (arr) =>
          [...new Set((arr || []).map(r => r.value).filter(Boolean))].sort();

        if (avData?.length) setAcceptanceViaOptions(toValues(avData));
        if (pmData?.length) setPaymentModeOptions(toValues(pmData));
        if (rsData?.length) setReasonStatusOptions(toValues(rsData));
        if (hrData?.length) setHoldReasonOptions(toValues(hrData));
        if (ptData?.length) setPaymentTermsOptions(toValues(ptData));
        if (tmData?.length) setTransportModeOptions(toValues(tmData));
        if (cdData?.length) setCreditDaysOptions(toValues(cdData));
        if (clData?.length) setCreditLimitOptions(toValues(clData));

      } catch (err) {
        console.error("Error fetching order status dropdowns:", err);
        setAcceptanceViaOptions(["email", "phone", "in-person", "other"]);
        setPaymentModeOptions(["cash", "check", "bank-transfer", "credit-card"]);
        setReasonStatusOptions(["price", "competitor", "timeline", "specifications", "other"]);
        setHoldReasonOptions(["budget", "approval", "project-delay", "reconsideration", "other"]);
        setPaymentTermsOptions(["30", "45", "60", "90"]);
        setTransportModeOptions(["Road", "Air", "Sea", "Rail"]);
        setCreditDaysOptions(["30", "45", "60", "90"]);
        setCreditLimitOptions(["10000", "25000", "50000", "100000"]);
      }
    };

    fetchOrderStatusDropdowns();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiryNo, activeTab]);

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
        .maybeSingle()

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
           <span className="text-red-500">*</span></label>
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
              <label htmlFor="approvedBy" className="block text-sm font-medium text-gray-700">
                Approve By
              </label>
              <select
                id="approvedBy"
                name="approvedBy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.approvedBy || ""}
                onChange={handleChange}
              >
                <option value="">Select approver</option>
                {approvedByOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="acceptanceVia" className="block text-sm font-medium text-gray-700">
                Acceptance Via
               <span className="text-red-500">*</span></label>
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
               <span className="text-red-500">*</span></label>
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
               <span className="text-red-500">*</span></label>
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
                  <option key={index} value={option}>{option}</option>
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
             <span className="text-red-500">*</span></label>
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
             <span className="text-red-500">*</span></label>
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
             <span className="text-red-500">*</span></label>
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