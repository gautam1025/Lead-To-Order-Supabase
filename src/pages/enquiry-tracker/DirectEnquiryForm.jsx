"use client"

import { useState, useEffect } from "react"
import supabase from "../../utils/supabase"
import { TABLES, COLUMNS } from "../../constants/dbSchema"

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
    nob: "",
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

  useEffect(() => {
    fetchDropdownData()
    fetchCompanyData()
    generateEnquiryNumber()
  }, [])

  const generateEnquiryNumber = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ENQUIRY_TO_ORDER)
        .select("enquiry_no")
        .not("enquiry_no", "is", null);

      if (error) {
        console.error("Error fetching enquiry numbers:", error);
        setNewCallTrackerData(prev => ({ ...prev, enquiryNo: "En-001" }));
        return;
      }

      let maxNumber = 0;
      data.forEach(item => {
        if (item.enquiry_no && item.enquiry_no.startsWith("En-")) {
          const numStr = item.enquiry_no.substring(3);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      const nextNumber = maxNumber + 1;
      const formattedEnquiryNo = `En-${nextNumber.toString().padStart(3, '0')}`;
      setNewCallTrackerData(prev => ({ ...prev, enquiryNo: formattedEnquiryNo }));
    } catch (err) {
      console.error("Exception generating enquiry number:", err);
      setNewCallTrackerData(prev => ({ ...prev, enquiryNo: "En-001" }));
    }
  };

  const fetchLastEnquiryNumber = async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.ENQUIRY_TO_ORDER)
        .select("enquiry_no")
        .not("enquiry_no", "is", null);

      if (error) {
        console.error("Error fetching latest enquiry number:", error);
        return "En-001";
      }

      let maxNumber = 0;
      data.forEach(item => {
        if (item.enquiry_no && item.enquiry_no.startsWith("En-")) {
          const numStr = item.enquiry_no.substring(3);
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      });

      const nextNumber = maxNumber + 1;
      return `En-${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error("Error generating latest enquiry number:", err);
      return "En-001";
    }
  };

  const fetchDropdownData = async () => {
    // Helper: fetch all values for a given category from the normalized dropdown table
    const fetchCategory = (category) =>
      supabase.from(TABLES.DROPDOWN).select("value").eq("category", category);

    // Fetch items from public.items table (handling more than 1000 items)
    const fetchItems = async () => {
      let allItems = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
          .from("items")
          .select("item_name")
          .range(from, from + step - 1);

        if (error) return { data: null, error };
        
        if (data && data.length > 0) {
          allItems = [...allItems, ...data];
          from += step;
          if (data.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }
      return { data: allItems, error: null };
    };

    try {
      const [
        { data: leadSourcesData, error: leadSourcesError },
        { data: scNamesData, error: scNamesError },
        { data: statesData, error: statesError },
        { data: nobData, error: nobError },
        { data: salesTypeData, error: salesTypeError },
        { data: approachData, error: approachError },
        { data: receiversData, error: receiversError },
        { data: assignToData, error: assignToError },
        { data: itemsData, error: itemsError }
      ] = await Promise.all([
        fetchCategory("lead_source"),
        fetchCategory("sc_name"),
        fetchCategory("state"),
        fetchCategory("nob"),
        fetchCategory("sales_type"),
        fetchCategory("enquiry_approach"),
        fetchCategory("lead_receiver_name"),
        fetchCategory("lead_assign_to"),
        fetchItems()
      ]);

      const errors = [
        leadSourcesError, scNamesError, statesError, nobError,
        salesTypeError, approachError, receiversError, assignToError, itemsError
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error("Failed to fetch some dropdown data");
      }

      const toValues = (arr) => (arr || []).map(item => item.value).filter(Boolean);
      const toItemValues = (arr) => [...new Set((arr || []).map(item => item.item_name).filter(Boolean))].sort();

      setLeadSources([...new Set(toValues(leadSourcesData))]);
      setScNameOptions([...new Set(toValues(scNamesData))]);
      setEnquiryStates([...new Set(toValues(statesData))]);
      setNobOptions([...new Set(toValues(nobData))]);
      setSalesTypes([...new Set(toValues(salesTypeData))]);
      setEnquiryApproachOptions([...new Set(toValues(approachData))]);
      setReceiverOptions([...new Set(toValues(receiversData))]);
      setAssignToProjectOptions([...new Set(toValues(assignToData))]);
      setProductCategories(toItemValues(itemsData));

    } catch (error) {
      console.error("Error fetching dropdown values:", error);
      setLeadSources(["Website", "Justdial", "Sulekha", "Indiamart", "Referral", "Other"]);
      setScNameOptions(["SC 1", "SC 2", "SC 3"]);
      setCompanyOptions([]);
      setEnquiryStates(["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi"]);
      setNobOptions(["NOB 1", "NOB 2", "NOB 3"]);
      setSalesTypes(["NBD", "CRR", "NBD_CRR"]);
      setEnquiryApproachOptions(["Approach 1", "Approach 2", "Approach 3"]);
      setReceiverOptions(["Receiver 1", "Receiver 2", "Receiver 3"]);
      setAssignToProjectOptions(["Project 1", "Project 2", "Project 3"]);
    }
  }

  // Function to fetch company data
  const fetchCompanyData = async () => {
    try {
      let allData = [];
      let from = 0;
      const step = 1000;
      let fetchMore = true;

      while (fetchMore) {
        const { data, error } = await supabase
          .from("client_master")
          .select("*")
          .range(from, from + step - 1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += step;
          if (data.length < step) fetchMore = false;
        } else {
          fetchMore = false;
        }
      }

      const relevantRecords = allData.filter((c) => c.isRelevant !== false);
      
      if (relevantRecords && relevantRecords.length > 0) {
        const companies = [];
        const detailsMap = {};

        relevantRecords.forEach(company => {
          if (company.company_name) {
            companies.push(company.company_name);

            detailsMap[company.company_name] = {
              phoneNumber: company.client_mobile_number || "",
              salesPersonName: company.client_name || "",
              location: company.billing_address || "",
              gstNumber: company.gst_number || "",
              enquiryState: company.state || ""
            };
          }
        });

        const uniqueCompanies = [...new Set(companies)].sort();
        setCompanyOptions(uniqueCompanies);
        setFilteredCompanies(uniqueCompanies);
        setCompanyDetailsMap(detailsMap);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      setCompanyOptions([]);
      setFilteredCompanies([]);
      setCompanyDetailsMap({});
    }
  };

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
      // Fetch TAT config for stage_name = "Enquiry Tracker for Enquiries"
      let tatHours = 1;
      let tatMinutes = 0;

      try {
        const { data: tatData } = await supabase
          .from("tat_config")
          .select("tat_hours, tat_minutes")
          .eq("stage_name", "Enquiry Tracker for Enquiries")
          .maybeSingle();

        if (tatData) {
          if (tatData.tat_hours !== null && tatData.tat_hours !== undefined) {
            tatHours = parseInt(tatData.tat_hours, 10) || 0;
          }
          if (tatData.tat_minutes !== null && tatData.tat_minutes !== undefined) {
            tatMinutes = parseInt(tatData.tat_minutes, 10) || 0;
          }
          if (tatHours === 0 && tatMinutes === 0) {
            tatHours = 1;
          }
        }
      } catch (err) {
        console.warn("Could not fetch TAT config for Enquiry Tracker for Enquiries, defaulting to 1 hour:", err);
      }

      const createdAtDate = new Date();
      const plannedAtTime = new Date(createdAtDate.getTime() + (tatHours * 60 + tatMinutes) * 60 * 1000);

      // Check existing client in client_master
      let existingClient = null;
      if (newCallTrackerData.companyName) {
        try {
          const { data: clientRes } = await supabase
            .from("client_master")
            .select("uuid, client_code, sc_name, crm_name, company_group_name")
            .ilike("company_name", newCallTrackerData.companyName.trim())
            .maybeSingle();
          existingClient = clientRes;
        } catch (err) {
          console.warn("Could not fetch client from client_master:", err);
        }
      }

      // 1. Auto-assign SC Name (sc_distribution rules with Round-Robin)
      let assignedScName = existingClient?.sc_name || newCallTrackerData.scName || null;
      if (!assignedScName) {
        try {
          const { data: activeRules } = await supabase
            .from("sc_distribution")
            .select("*")
            .eq("is_active", true)
            .order("sequence_order", { ascending: true })
            .order("created_at", { ascending: true });

          if (activeRules && activeRules.length > 0) {
            const currentNob = (enquiryFormData.nob || "").trim().toUpperCase();
            const currentSource = (newCallTrackerData.leadSource || "").trim().toUpperCase();
            const currentType = (enquiryFormData.salesType || "").trim().toUpperCase();

            const matchedRules = activeRules.filter((rule) => {
              const types = (rule.sales_types || []).map((t) => t.toUpperCase());
              const sources = (rule.lead_sources || []).map((s) => s.toUpperCase());
              const nobs = (rule.nobs || []).map((n) => n.toUpperCase());

              const typeMatch = types.length === 0 || types.includes(currentType);
              const sourceMatch = sources.length === 0 || sources.includes("ALL SOURCES") || sources.includes(currentSource);
              const nobMatch = nobs.some((n) => {
                if (n === "ALL NOBS") return true;
                if (n === "ALL NOBS (EXCEPT RESELLER)") return currentNob !== "RESELLER";
                return n === currentNob;
              });

              return typeMatch && sourceMatch && nobMatch;
            });

            if (matchedRules.length > 0) {
              const candidate = matchedRules.find((r) => r.is_next_in_line) || matchedRules[0];
              if (candidate && candidate.sc_name) {
                assignedScName = candidate.sc_name;
              }

              if (matchedRules.length > 1 && candidate?.id) {
                const currentIndex = matchedRules.findIndex((item) => item.id === candidate.id);
                const nextIndex = (currentIndex + 1) % matchedRules.length;
                const nextItem = matchedRules[nextIndex];

                if (candidate.id !== nextItem.id) {
                  await supabase.from("sc_distribution").update({ is_next_in_line: false }).eq("id", candidate.id);
                }
                await supabase.from("sc_distribution").update({ is_next_in_line: true, updated_at: new Date().toISOString() }).eq("id", nextItem.id);
              }
            }
          }
        } catch (scErr) {
          console.error("Error evaluating SC auto-assignment rules:", scErr);
        }
      }

      // 2. Auto-assign CRE / CRM Name (crm_distribution Group -> State -> NOB Hierarchy)
      let assignedCrmName = existingClient?.crm_name || null;
      if (!existingClient || !assignedCrmName) {
        const targetGroup = existingClient?.company_group_name || "";
        const targetState = enquiryFormData.enquiryState || "";
        const targetNob = enquiryFormData.nob || "";

        try {
          const { data: crmRules, error: rulesErr } = await supabase
            .from("crm_distribution")
            .select("key, value, category");

          if (!rulesErr && crmRules && crmRules.length > 0) {
            const groupMap = new Map();
            const stateMap = new Map();
            const nobMap = new Map();

            crmRules.forEach(rule => {
              if (!rule.key || !rule.value) return;
              const normKey = rule.key.trim().toLowerCase();
              const cat = (rule.category || "").trim().toLowerCase();
              if (cat === "group") groupMap.set(normKey, rule.value);
              else if (cat === "state") stateMap.set(normKey, rule.value);
              else if (cat === "nob") nobMap.set(normKey, rule.value);
            });

            // Priority 1: Group
            if (targetGroup && groupMap.has(targetGroup.trim().toLowerCase())) {
              assignedCrmName = groupMap.get(targetGroup.trim().toLowerCase());
            } 
            // Priority 2: State
            else if (targetState && stateMap.has(targetState.trim().toLowerCase())) {
              assignedCrmName = stateMap.get(targetState.trim().toLowerCase());
            } 
            // Priority 3: NOB
            else if (targetNob && nobMap.has(targetNob.trim().toLowerCase())) {
              assignedCrmName = nobMap.get(targetNob.trim().toLowerCase());
            }
          }
        } catch (crmErr) {
          console.error("Error evaluating CRM distribution rules:", crmErr);
        }
      }

      const rowData = {
        created_at: createdAtDate.toISOString(),
        planned_at: plannedAtTime.toISOString(),
        enquiry_status: "New",
        lead_source: newCallTrackerData.leadSource,
        sales_coordinator_name: assignedScName,
        crm_name: assignedCrmName,
        company_name: newCallTrackerData.companyName,
        phone_number: newCallTrackerData.phoneNumber,
        sales_person_name: newCallTrackerData.salesPersonName,
        location: newCallTrackerData.location,
        email: newCallTrackerData.emailAddress,
        shipping_address: newCallTrackerData.shippingAddress,
        enquiry_receiver_name: newCallTrackerData.enquiryReceiverName,
        enquiry_assign_to_project: newCallTrackerData.enquiryAssignToProject,
        gst_number: newCallTrackerData.gstNumber,
        enquiry_date: enquiryFormData.enquiryDate ? formatDateToISO(enquiryFormData.enquiryDate) : null,
        enquiry_for_state: enquiryFormData.enquiryState,
        nob: enquiryFormData.nob,
        sales_type: enquiryFormData.salesType,
        enquiry_approach: enquiryFormData.enquiryApproach,
      };

      // 1. Insert header into enquiries table
      const { data: insertedEnquiry, error: enquiryError } = await supabase
        .from("enquiries")
        .insert([rowData])
        .select()
        .single();

      if (enquiryError) {
        console.error("Error inserting enquiry:", enquiryError.message);
        alert("Error saving enquiry: " + enquiryError.message);
        return;
      }

      const newEnquiryId = insertedEnquiry.id;
      const assignedEnquiryNo = insertedEnquiry.enquiry_no;

      // 2. Insert items into enquiry_items table
      const itemRows = items.map(item => ({
        enquiry_id: newEnquiryId,
        item_name: item.name,
        quantity: parseInt(item.quantity, 10) || 1,
      }));

      const { error: itemsError } = await supabase
        .from("enquiry_items")
        .insert(itemRows);

      if (itemsError) {
        console.error("Error inserting enquiry items:", itemsError.message);
      }

      if (newCallTrackerData.companyName) {
        try {
          if (!existingClient) {
            await supabase.from("client_master").insert([{
              company_name: newCallTrackerData.companyName.trim(),
              client_name: newCallTrackerData.salesPersonName || null,
              client_mobile_number: newCallTrackerData.phoneNumber || null,
              billing_address: newCallTrackerData.location || null,
              gst_number: newCallTrackerData.gstNumber || null,
              sc_name: assignedScName || null,
              crm_name: assignedCrmName || null,
              sales_type: enquiryFormData.salesType || null,
              isRelevant: true,
              already_in_tracker: `Enquiry Tracker (${assignedEnquiryNo || 'New'})`
            }]);
          } else {
            const updatePayload = {
              already_in_tracker: `Enquiry Tracker (${assignedEnquiryNo || 'New'})`,
              updated_at: new Date().toISOString()
            };
            if (!existingClient.sc_name && assignedScName) {
              updatePayload.sc_name = assignedScName;
            }
            if (!existingClient.crm_name && assignedCrmName) {
              updatePayload.crm_name = assignedCrmName;
            }
            await supabase
              .from("client_master")
              .update(updatePayload)
              .eq("uuid", existingClient.uuid);
          }
        } catch (cmErr) {
          console.error("Error updating client_master tracking status:", cmErr);
        }
      }

      alert(`Call tracker updated successfully. Enquiry No: ${assignedEnquiryNo || 'Generated'}`);
      onClose(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Error saving data: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
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
                Enquiry Source
               <span className="text-red-500">*</span></label>
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

            {/* Searchable Company Name dropdown */}
            <div className="space-y-2 relative">
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company Name
               <span className="text-red-500">*</span></label>
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
               <span className="text-red-500">*</span></label>
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
               <span className="text-red-500">*</span></label>
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
               <span className="text-red-500">*</span></label>
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
               <span className="text-red-500">*</span></label>
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
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="enquiryReceiverName" className="block text-sm font-medium text-gray-700">
                Enquiry Receiver Name
               <span className="text-red-500">*</span></label>
              <select
                id="enquiryReceiverName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.enquiryReceiverName}
                onChange={(e) => setNewCallTrackerData(prev => ({
                  ...prev,
                  enquiryReceiverName: e.target.value,
                  isCompanyAutoFilled: false
                }))}
                required
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
               <span className="text-red-500">*</span></label>
              <select
                id="enquiryAssignToProject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newCallTrackerData.enquiryAssignToProject}
                onChange={(e) => setNewCallTrackerData(prev => ({
                  ...prev,
                  enquiryAssignToProject: e.target.value,
                  isCompanyAutoFilled: false
                }))}
                required
              >
                <option value="">Select person</option>
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
               <span className="text-red-500">*</span></label>
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
                required
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
                 <span className="text-red-500">*</span></label>
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
                 <span className="text-red-500">*</span></label>
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
                <label htmlFor="nob" className="block text-sm font-medium text-gray-700">
                  NOB
                 <span className="text-red-500">*</span></label>
                <select
                  id="nob"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={enquiryFormData.nob}
                  onChange={(e) => setEnquiryFormData({ ...enquiryFormData, nob: e.target.value })}
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
                 <span className="text-red-500">*</span></label>
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
                 <span className="text-red-500">*</span></label>
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
