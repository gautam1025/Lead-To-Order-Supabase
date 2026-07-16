"use client"

import { useState, useEffect } from "react"
import supabase from "../utils/supabase"

const CallTrackerForm = ({ onClose = () => window.history.back() }) => {
  const [leadSources, setLeadSources] = useState([])
  const [scNameOptions, setScNameOptions] = useState([])
  const [enquiryStates, setEnquiryStates] = useState([])
  const [nobOptions, setNobOptions] = useState([])
  const [salesTypes, setSalesTypes] = useState([])
  const [enquiryApproachOptions, setEnquiryApproachOptions] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [companyDetailsMap, setCompanyDetailsMap] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [receiverOptions, setReceiverOptions] = useState([])
  const [assignToProjectOptions, setAssignToProjectOptions] = useState([])
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [filteredCompanies, setFilteredCompanies] = useState([])

  const [newCallTrackerData, setNewCallTrackerData] = useState({
    enquiryNo: "",
    leadSource: "",
    scName: "",
    companyName: "",
    phoneNumber: "",
    salesPersonName: "",
    location: "",
    emailAddress: "",
    shippingAddress: "",
    enquiryReceiverName: "",
    enquiryAssignToProject: "",
    gstNumber: "",
    isCompanyAutoFilled: false
  })

  const [enquiryFormData, setEnquiryFormData] = useState({
    enquiryDate: "",
    enquiryState: "",
    projectName: "",
    salesType: "",
    enquiryApproach: "",
  })

  const [items, setItems] = useState([{ id: "1", name: "", quantity: "" }])


  // Filter companies based on search input
  useEffect(() => {
    if (newCallTrackerData.companyName) {
      const filtered = companyOptions.filter(company =>
        company.toLowerCase().includes(newCallTrackerData.companyName.toLowerCase())
      )
      setFilteredCompanies(filtered)
    } else {
      setFilteredCompanies(companyOptions)
    }
  }, [newCallTrackerData.companyName, companyOptions])

  // Fetch dropdown data, company data, and last enquiry number when component mounts
  useEffect(() => {
    fetchDropdownData()
    fetchCompanyData()
    fetchLastEnquiryNumber()
  }, [])

  // Function to fetch the last enquiry number from Supabase (Used for initial display only)
  const fetchLastEnquiryNumber = async () => {
    try {
      const { data, error } = await supabase
        .from('enquiry_to_order')
        .select('enquiry_no')
        .not('enquiry_no', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching enquiry numbers:", error);
        if (error.code === '42P01') {
          setNewCallTrackerData(prev => ({ ...prev, enquiryNo: "En-01" }));
          return "En-01";
        }
      }

      let maxNumber = 0;
      if (data && data.length > 0) {
        data.forEach(row => {
          if (row.enquiry_no) {
            const match = row.enquiry_no.match(/En-(\d+)/i);
            if (match) {
              const num = parseInt(match[1], 10);
              if (!isNaN(num) && num > maxNumber) {
                maxNumber = num;
              }
            }
          }
        });
      }

      const nextNumber = maxNumber + 1;
      const nextEnquiryNo = `En-${nextNumber.toString().padStart(2, "0")}`;

      setNewCallTrackerData(prev => ({
        ...prev,
        enquiryNo: nextEnquiryNo
      }));
      
      return nextEnquiryNo;
    } catch (error) {
      console.error("Error generating next enquiry number:", error);
      const fallback = "En-01";
      setNewCallTrackerData(prev => ({
        ...prev,
        enquiryNo: fallback
      }));
      return fallback;
    }
  }

  const fetchDropdownData = async () => {
    try {
      const [
        { data: leadSourcesData, error: leadSourcesError },
        { data: scNamesData, error: scNamesError },
        { data: statesData, error: statesError },
        { data: nobData, error: nobError },
        { data: salesTypeData, error: salesTypeError },
        { data: approachData, error: approachError },
        { data: productData, error: productError },
        { data: receiversData, error: receiversError },
        { data: assignToData, error: assignToError }
      ] = await Promise.all([
        supabase.from("dropdown").select("lead_source").not("lead_source", "is", null),
        supabase.from("dropdown").select("sales_co_ordinator_name").not("sales_co_ordinator_name", "is", null),
        supabase.from("dropdown").select("direct_enquiry_state").not("direct_enquiry_state", "is", null),
        supabase.from("dropdown").select("nob").not("nob", "is", null),
        supabase.from("dropdown").select("sales_type").not("sales_type", "is", null),
        supabase.from("dropdown").select("enquiry_approach").not("enquiry_approach", "is", null),
        supabase.from("dropdown").select("item_name").not("item_name", "is", null),
        supabase.from("dropdown").select("enquiry_receiver_name").not("enquiry_receiver_name", "is", null),
        supabase.from("dropdown").select("enquiry_assign_to").not("enquiry_assign_to", "is", null)
      ]);

      const errors = [
        leadSourcesError, scNamesError, statesError, nobError,
        salesTypeError, approachError, productError, receiversError, assignToError
      ].filter(error => error !== null);

      if (errors.length > 0) {
        console.log("Errors fetching dropdown data:", errors);
        throw new Error("Failed to fetch some dropdown data");
      }

      const sources = leadSourcesData.map(item => item.lead_source);
      const scNames = scNamesData.map(item => item.sales_co_ordinator_name);
      const states = statesData.map(item => item.direct_enquiry_state);
      const nobItems = nobData.map(item => item.nob);
      const salesTypeOptions = salesTypeData.map(item => item.sales_type);
      const approachOptions = approachData.map(item => item.enquiry_approach);
      const productItems = productData.map(item => item.item_name);
      const receivers = receiversData.map(item => item.enquiry_receiver_name);
      const assignToProjects = assignToData.map(item => item.enquiry_assign_to);

      setLeadSources([...new Set(sources)]);
      setScNameOptions([...new Set(scNames)]);
      setEnquiryStates([...new Set(states)]);
      setNobOptions([...new Set(nobItems)]);
      setSalesTypes([...new Set(salesTypeOptions)]);
      setEnquiryApproachOptions([...new Set(approachOptions)]);
      setProductCategories([...new Set(productItems)]);
      setReceiverOptions([...new Set(receivers)]);
      setAssignToProjectOptions([...new Set(assignToProjects)]);

      console.log("Dropdown data fetched successfully");

    } catch (error) {
      console.error("Error fetching dropdown values:", error);
      setLeadSources(["Website", "Justdial", "Sulekha", "Indiamart", "Referral", "Other"]);
      setScNameOptions(["SC 1", "SC 2", "SC 3"]);
      setCompanyOptions([]);
      setEnquiryStates(["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi"]);
      setNobOptions(["NOB 1", "NOB 2", "NOB 3"]);
      setSalesTypes(["NBD", "CRR", "NBD_CRR"]);
      setEnquiryApproachOptions(["Approach 1", "Approach 2", "Approach 3"]);
      setProductCategories(["Product 1", "Product 2", "Product 3"]);
      setReceiverOptions(["Receiver 1", "Receiver 2", "Receiver 3"]);
      setAssignToProjectOptions(["Project 1", "Project 2", "Project 3"]);
    }
  }

  // Function to fetch company data
  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from("dropdown")
        .select("direct_enquiry_company_name, direct_enquiry_client_name, direct_enquiry_client_contact_no, direct_enquiry_state, direct_enquiry_gstin_uin, direct_enquiry_billing_address")
        .order("direct_enquiry_company_name", { ascending: true });

      if (error) {
        console.error("Error fetching company data:", error);
        return;
      }

      if (data) {
        const companies = [];
        const detailsMap = {};

        data.forEach(company => {
          if (company.direct_enquiry_company_name) {
            companies.push(company.direct_enquiry_company_name);

            detailsMap[company.direct_enquiry_company_name] = {
              phoneNumber: company.direct_enquiry_client_contact_no || "",
              salesPersonName: company.direct_enquiry_client_name || "",
              location: company.direct_enquiry_billing_address || "",
              gstNumber: company.direct_enquiry_gstin_uin || "",
              enquiryState: company.direct_enquiry_state || ""
            };
          }
        });

        setCompanyOptions(companies);
        setFilteredCompanies(companies);
        setCompanyDetailsMap(detailsMap);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      setCompanyOptions([]);
      setFilteredCompanies([]);
      setCompanyDetailsMap({});
    }
  }

  // Handle company name change and auto-fill other fields
  const handleCompanyChange = (companyName) => {
    setNewCallTrackerData(prev => ({
      ...prev,
      companyName: companyName,
      isCompanyAutoFilled: true
    }));

    // Auto-fill related fields if company is selected
    if (companyName) {
      const companyDetails = companyDetailsMap[companyName] || {};
      setNewCallTrackerData(prev => ({
        ...prev,
        // Omit phoneNumber and salesPersonName from auto-fill as per user request
        phoneNumber: "",
        salesPersonName: "",
        location: companyDetails.location || "",
        gstNumber: companyDetails.gstNumber || "",
        isCompanyAutoFilled: true
      }));

      // Also update the enquiry state if available
      if (companyDetails.enquiryState) {
        setEnquiryFormData(prev => ({
          ...prev,
          enquiryState: companyDetails.enquiryState
        }));
      }
    }

    setShowCompanyDropdown(false);
  }

  // Function to handle adding a new item
  const addItem = () => {
    if (items.length < 300) {
      const newId = (items.length + 1).toString()
      setItems([...items, { id: newId, name: "", quantity: "" }])
    }
  }

  // Function to handle removing an item
  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  // Function to update an item
  const updateItem = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const formatDateToISO = (dateValue) => {
    if (!dateValue) return "";

    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return dateValue;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateValue;
    }
  }

  const calculateTotalQuantity = () => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 0
      return total + quantity
    }, 0)
  }

  // Function to handle form submission
  const handleSubmit = async () => {
    // Validate that all items have a name and quantity
    for (const item of items) {
      if (!item.name || !item.name.trim()) {
        alert("Item Name is mandatory for all items.");
        return;
      }
      if (!item.quantity || !item.quantity.toString().trim()) {
        alert("Quantity is mandatory for all items.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // ✅ STEP 1: Fetch the ACTUAL latest enquiry number right before submitting
      // This minimizes the chance of duplicates compared to fetching on form load
      const latestEnquiryNo = await fetchLastEnquiryNumber();
      console.log("Using latest generated enquiry number:", latestEnquiryNo);

      // Prepare the first 10 items in individual columns
      const itemColumns = {};
      const first10Items = items.slice(0, 10);

      first10Items.forEach((item, index) => {
        itemColumns[`item_name${index + 1}`] = item.name || "";
        itemColumns[`quantity${index + 1}`] = item.quantity || "0";
      });

      // Prepare additional items beyond 10 as JSON
      const additionalItems = items.length > 10
        ? items.slice(10).map(item => ({
          name: item.name || "",
          quantity: item.quantity || "0"
        }))
        : [];

      const rowData = {
        timestamp: new Date().toISOString(),
        enquiry_no: latestEnquiryNo, // Use the freshly fetched number
        lead_source: newCallTrackerData.leadSource,
        sales_coordinator_name: newCallTrackerData.scName,
        company_name: newCallTrackerData.companyName,
        phone_number: newCallTrackerData.phoneNumber,
        sales_person_name: newCallTrackerData.salesPersonName,
        location: newCallTrackerData.location,
        email: newCallTrackerData.emailAddress,
        shipping_address: newCallTrackerData.shippingAddress,
        enquiry_receiver_name: newCallTrackerData.enquiryReceiverName,
        enquiry_assign_to_project: newCallTrackerData.enquiryAssignToProject,
        gst_number: newCallTrackerData.gstNumber,
        enquiry_date: enquiryFormData.enquiryDate ? formatDateToISO(enquiryFormData.enquiryDate) : "",
        enquiry_for_state: enquiryFormData.enquiryState,
        project_name: enquiryFormData.projectName,
        sales_type: enquiryFormData.salesType,
        enquiry_approach: enquiryFormData.enquiryApproach,
        ...itemColumns,
        item_qty: additionalItems.length > 0 ? JSON.stringify(additionalItems) : null,
        total_qty: calculateTotalQuantity(),
      };

      console.log("Data to be submitted to Supabase:", rowData);

      // Insert data into Supabase directly
      const { data, error } = await supabase
        .from("enquiry_to_order")
        .insert([rowData]);

      if (error) {
        console.error("Error inserting data:", error.message);
        alert("Error saving data: " + error.message);
      } else {
        console.log("Inserted successfully:", data);
        alert(`Call tracker updated successfully. Enquiry No: ${latestEnquiryNo}`);
        onClose();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Error saving data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">New Call Tracker</h2>
            <button
              type="button"
              onClick={() => {
                try {
                  onClose();
                } catch (error) {
                  console.error("Error closing form:", error);
                  const modal = document.querySelector('.fixed.inset-0');
                  if (modal) {
                    modal.style.display = 'none';
                  }
                }
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="leadSource" className="block text-sm font-medium text-gray-700">
                Lead Source
              </label>
              <select
                id="leadSource"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.leadSource}
                onChange={(e) => setNewCallTrackerData(prev => ({ ...prev, leadSource: e.target.value }))}
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
              <select
                id="scName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.scName}
                onChange={(e) => setNewCallTrackerData(prev => ({ ...prev, scName: e.target.value }))}
                required
              >
                <option value="">Select SC Name</option>
                {scNameOptions.map((scName, index) => (
                  <option key={index} value={scName}>
                    {scName}
                  </option>
                ))}
              </select>
            </div>

            {/* Searchable Company Name dropdown */}
            <div className="space-y-2 relative">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="companyName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newCallTrackerData.companyName}
                  onChange={(e) => {
                    setNewCallTrackerData(prev => ({
                      ...prev,
                      companyName: e.target.value,
                      isCompanyAutoFilled: false
                    }));
                    setShowCompanyDropdown(true);
                  }}
                  onFocus={() => setShowCompanyDropdown(true)}
                  placeholder="Type to search companies"
                  required
                />
                {showCompanyDropdown && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCompanies.map((company, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleCompanyChange(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter phone number"
                value={newCallTrackerData.phoneNumber}
                onChange={(e) => setNewCallTrackerData(prev => ({ ...prev, phoneNumber: e.target.value, isCompanyAutoFilled: false }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="salesPersonName" className="block text-sm font-medium text-gray-700">
                Person Name
              </label>
              <input
                id="salesPersonName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter person name"
                value={newCallTrackerData.salesPersonName}
                onChange={(e) => setNewCallTrackerData(prev => ({ ...prev, salesPersonName: e.target.value, isCompanyAutoFilled: false }))}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Billing Address
              </label>
              <input
                id="location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter billing address"
                value={newCallTrackerData.location}
                onChange={(e) => setNewCallTrackerData(prev => ({ ...prev, location: e.target.value, isCompanyAutoFilled: false }))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter email address"
                value={newCallTrackerData.emailAddress}
                onChange={(e) => setNewCallTrackerData(prev => ({ ...prev, emailAddress: e.target.value, isCompanyAutoFilled: false }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700">
                Shipping Address
              </label>
              <input
                id="shippingAddress"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter shipping address"
                value={newCallTrackerData.shippingAddress}
                onChange={(e) => setNewCallTrackerData(prev => ({
                  ...prev,
                  shippingAddress: e.target.value,
                  isCompanyAutoFilled: false
                }))}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryReceiverName" className="block text-sm font-medium text-gray-700">
                Enquiry Receiver Name
              </label>
              <select
                id="enquiryReceiverName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.enquiryReceiverName}
                onChange={(e) => setNewCallTrackerData(prev => ({
                  ...prev,
                  enquiryReceiverName: e.target.value,
                  isCompanyAutoFilled: false
                }))}
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
                Enquiry Assign to Project
              </label>
              <select
                id="enquiryAssignToProject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.enquiryAssignToProject}
                onChange={(e) => setNewCallTrackerData(prev => ({
                  ...prev,
                  enquiryAssignToProject: e.target.value,
                  isCompanyAutoFilled: false
                }))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter GST number"
                value={newCallTrackerData.gstNumber}
                onChange={(e) => setNewCallTrackerData(prev => ({
                  ...prev,
                  gstNumber: e.target.value,
                  isCompanyAutoFilled: false
                }))}
              />
            </div>

          </div>

          {/* Enquiry Details section */}
          <div className="space-y-6 border p-4 rounded-md mt-4">
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
                  value={enquiryFormData.enquiryDate}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, enquiryDate: e.target.value })}
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
                  value={enquiryFormData.enquiryState}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, enquiryState: e.target.value })}
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
                  value={enquiryFormData.projectName}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, projectName: e.target.value })}
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
                  value={enquiryFormData.salesType}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, salesType: e.target.value })}
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
                  value={enquiryFormData.enquiryApproach}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, enquiryApproach: e.target.value })}
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Items</h4>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={items.length >= 300}
                  className={`px-3 py-1 text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 rounded-md ${items.length >= 300 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  + Add Item {items.length >= 300 ? '(Max reached)' : ''}
                </button>
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5 space-y-2">
                    <label htmlFor={`itemName-${item.id}`} className="block text-sm font-medium text-gray-700">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      list={`item-options-${item.id}`}
                      id={`itemName-${item.id}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      required
                    />
                    <datalist id={`item-options-${item.id}`}>
                      {productCategories.map((category, index) => (
                        <option key={index} value={category} />
                      ))}
                    </datalist>
                  </div>

                  <div className="md:col-span-5 space-y-2">
                    <label htmlFor={`quantity-${item.id}`} className="block text-sm font-medium text-gray-700">
                      Quantity <span className="text-red-500">*</span>
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
        </div>

        <div className="p-6 border-t flex justify-between">
          <button
            type="button"
            onClick={() => {
              try {
                onClose();
              } catch (error) {
                console.error("Error closing form:", error);
                const modal = document.querySelector('.fixed.inset-0');
                if (modal) {
                  modal.style.display = 'none';
                }
              }
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CallTrackerForm