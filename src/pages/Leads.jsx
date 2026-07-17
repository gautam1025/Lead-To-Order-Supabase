"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../App";
import supabase from "../utils/supabase";
import * as XLSX from "xlsx";

// Helper function to format date as dd/mm/yyyy
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Generate next sequential lead numbers for bulk import
const generateNextImportLeadNumbers = async (count) => {
  try {
    const { data, error } = await supabase
      .from("leads_to_order")
      .select('"LD-Lead-No"')
      .order("id", { ascending: false })
      .limit(1);

    let startNum = 1;
    if (!error && data && data.length > 0) {
      const lastLeadNumber = data[0]["LD-Lead-No"];
      if (lastLeadNumber && lastLeadNumber.startsWith("LD-")) {
        const match = lastLeadNumber.match(/LD-(\d+)/);
        if (match) {
          startNum = Number.parseInt(match[1], 10) + 1;
        }
      }
    }

    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(`LD-${String(startNum + i).padStart(3, "0")}`);
    }
    return numbers;
  } catch (e) {
    console.error(e);
    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(`LD-IMPORT-${Date.now()}-${i}`);
    }
    return numbers;
  }
};

// ─── Excel Import Modal ───────────────────────────────────────────────────────
function ExcelImportModal({ onClose, onSaved }) {
  const [step, setStep] = useState("groupName"); // "groupName" | "preview"
  const [groupName, setGroupName] = useState("");
  const [groupNameError, setGroupNameError] = useState("");
  const [importedRows, setImportedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef(null);
  const { showNotification } = useContext(AuthContext);

  // Column mapping: Excel header → internal key
  const COLUMN_MAP_RAW = {
    "Lead Receiver Name": "receiverName",
    "Lead Source*": "source",
    "Lead Source": "source",
    "SC Name": "scName",
    "Company Name": "companyName",
    "Person Name": "personName",
    "Person Number": "phoneNumber",
    Location: "location",
    "Email Address": "email",
    State: "state",
    Address: "address",
    "Person 1 Name": "person1Name",
    "Person 1 Designation": "person1Designation",
    "Person 1 Phone": "person1Phone",
    "Person 2 Name": "person2Name",
    "Person 2 Designation": "person2Designation",
    "Person 2 Phone": "person2Phone",
    "Person 3 Name": "person3Name",
    "Person 3 Designation": "person3Designation",
    "Person 3 Phone": "person3Phone",
    "Nature of Business(NOB)": "nob",
    "Nature of Business (NOB)": "nob",
    NOB: "nob",
    "Sales Type": "salesType",
    "Handle Person": "handlePerson",
    "Handle Person*": "handlePerson",
    "GST Number": "gstNumber",
    "GST No": "gstNumber",
    "Additional Notes": "additionalNotes",
    "Additional Note": "additionalNotes",
  };

  const normalizeCol = (str) =>
    String(str).toLowerCase().replace(/\*/g, "").replace(/\s+/g, " ").trim();

  const COLUMN_MAP = Object.fromEntries(
    Object.entries(COLUMN_MAP_RAW).map(([k, v]) => [normalizeCol(k), v])
  );

  const DISPLAY_COLUMNS = [
    { key: "receiverName", label: "Lead Receiver Name" },
    { key: "source", label: "Lead Source*" },
    { key: "scName", label: "SC Name" },
    { key: "companyName", label: "Company Name" },
    { key: "personName", label: "Person Name" },
    { key: "phoneNumber", label: "Person Number" },
    { key: "location", label: "Location" },
    { key: "email", label: "Email Address" },
    { key: "state", label: "State" },
    { key: "address", label: "Address" },
    { key: "person1Name", label: "Person 1 Name" },
    { key: "person1Designation", label: "Person 1 Designation" },
    { key: "person1Phone", label: "Person 1 Phone" },
    { key: "person2Name", label: "Person 2 Name" },
    { key: "person2Designation", label: "Person 2 Designation" },
    { key: "person2Phone", label: "Person 2 Phone" },
    { key: "person3Name", label: "Person 3 Name" },
    { key: "person3Designation", label: "Person 3 Designation" },
    { key: "person3Phone", label: "Person 3 Phone" },
    { key: "nob", label: "Nature of Business(NOB)" },
    { key: "salesType", label: "Sales Type" },
    { key: "gstNumber", label: "GST Number" },
    { key: "additionalNotes", label: "Additional Notes" },
    { key: "groupName", label: "Group Name" },
  ];

  const handleGroupNameNext = () => {
    if (!groupName.trim()) {
      setGroupNameError("Group Name is required");
      return;
    }
    setGroupNameError("");
    setStep("preview");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const mapped = rawRows.map((row) => {
          const obj = { groupName: groupName.trim() };
          Object.keys(row).forEach((rawHeader) => {
            const normHeader = normalizeCol(rawHeader);
            if (COLUMN_MAP[normHeader] !== undefined) {
              const internalKey = COLUMN_MAP[normHeader];
              if (!obj[internalKey]) {
                obj[internalKey] =
                  row[rawHeader] !== undefined && row[rawHeader] !== null
                    ? String(row[rawHeader]).trim()
                    : "";
              }
            }
          });
          return obj;
        });

        setImportedRows(mapped);
      } catch (err) {
        console.error("Excel parse error:", err);
        setSaveError("Failed to parse Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSave = async () => {
    if (importedRows.length === 0) {
      setSaveError("No data to save. Please upload an Excel file first.");
      return;
    }
    setIsSaving(true);
    setSaveError("");
    try {
      const leadNumbers = await generateNextImportLeadNumbers(importedRows.length);
      const rowsToInsert = importedRows.map((row, idx) => ({
        Timestamp: formatDate(new Date()),
        "LD-Lead-No": leadNumbers[idx],
        Lead_Receiver_Name: row.receiverName || "",
        Lead_Source: row.source || "",
        Company_Name: row.companyName || "",
        Phone_Number: row.phoneNumber || "",
        Salesperson_Name: row.personName || "",
        SC_Name: row.scName || "",
        Location: row.location || "",
        Email_Address: row.email || "",
        State: row.state || "",
        Address: row.address || "",
        Person_name_1: row.person1Name || "",
        Designation_1: row.person1Designation || "",
        Phone_Number_1: row.person1Phone || "",
        Person_Name_2: row.person2Name || "",
        Designation_2: row.person2Designation || "",
        Phone_Number_2: row.person2Phone || "",
        Person_Name_3: row.person3Name || "",
        Designation_3: row.person3Designation || "",
        Phone_Number_3: row.person3Phone || "",
        NOB: row.nob || "",
        GST_Number: row.gstNumber || "",
        Sales_Type: row.salesType || "",
        Group_Name: row.groupName || "",
        Additional_Notes: row.additionalNotes || "",
        "Customer_Registration Form": "",
        "Credit _Access": "",
        Credit_Days: "",
        Credit_Limit: "",
        handle_person: row.handlePerson || "",
      }));

      const { error } = await supabase.from("leads_to_order").insert(rowsToInsert);
      if (error) throw error;

      showNotification(`${importedRows.length} lead(s) imported successfully!`, "success");
      onSaved(groupName);
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError("An error occurred: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full mx-4"
        style={{
          maxWidth: step === "preview" ? "95vw" : "480px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Import Leads from Excel</h3>
                {step === "preview" && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Group: <span className="font-semibold text-emerald-600">{groupName}</span>
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-0 px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className={`flex items-center gap-2 text-xs font-medium ${step === "groupName" ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === "groupName" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"}`}>1</span>
            Group Name
          </div>
          <div className="w-8 h-px bg-gray-200 mx-2" />
          <div className={`flex items-center gap-2 text-xs font-medium ${step === "preview" ? "text-emerald-600" : "text-gray-400"}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${step === "preview" ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-500"}`}>2</span>
            Preview & Save
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[180px]">
          {step === "groupName" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Group Name *</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-gray-400 text-sm font-medium"
                  placeholder="e.g. Indiamart Group 1"
                />
                {groupNameError && <p className="text-xs font-medium text-red-600">{groupNameError}</p>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed bg-amber-50 border border-amber-100 p-3 rounded-xl">
                ⚠️ Every imported row will be associated with this Group Name.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors shadow-sm"
                  >
                    Select File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="text-xs text-gray-500 truncate max-w-[200px]" title={fileName}>
                    {fileName || "No file chosen"}
                  </span>
                </div>
              </div>

              {importedRows.length > 0 && (
                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-inner bg-gray-50/50">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100/80 text-gray-600 font-semibold border-b border-gray-200">
                          <th className="px-3 py-2 text-gray-400 font-bold w-10">#</th>
                          {DISPLAY_COLUMNS.map((col) => (
                            <th key={col.key} className="px-3 py-2 font-bold whitespace-nowrap">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importedRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"} hover:bg-emerald-50/30 transition-colors`}
                          >
                            <td className="px-3 py-2 text-gray-400 font-medium">{idx + 1}</td>
                            {DISPLAY_COLUMNS.map((col) => (
                              <td
                                key={col.key}
                                className={`px-3 py-2 whitespace-nowrap max-w-[140px] truncate ${col.key === "groupName" ? "text-emerald-700 font-semibold bg-emerald-50/30" : "text-gray-700"}`}
                                title={row[col.key] || ""}
                              >
                                {row[col.key] || <span className="text-gray-300">—</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
          {step === "groupName" ? (
            <button
              onClick={handleGroupNameNext}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Next →
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("groupName")}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || importedRows.length === 0}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? "Saving..." : `Save ${importedRows.length > 0 ? `(${importedRows.length})` : ""} Leads`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Leads Component ─────────────────────────────────────────────────────
function Leads() {
  const [searchParams] = useSearchParams();
  const initialCompanyName = searchParams.get("companyName") || "";
  const initialPhoneNumber = searchParams.get("phoneNumber") || "";
  const initialPersonName = searchParams.get("personName") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialEmail = searchParams.get("email") || "";
  const initialState = searchParams.get("state") || "";
  const initialGroupName = searchParams.get("groupName") || "";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [formData, setFormData] = useState({
    receiverName: "",
    source: "",
    companyName: initialCompanyName,
    phoneNumber: initialPhoneNumber,
    salespersonName: initialPersonName,
    location: initialLocation,
    email: initialEmail,
    contactPersons: [{ name: "", designation: "", number: "" }],
    state: initialState,
    address: "",
    nob: "",
    salesType: "",
    gst: "",
    notes: "",
    scName: "",
    groupName: initialGroupName,
    customerRegistrationForm: "",
    creditAccess: "",
    creditDays: "",
    creditLimit: "",
  });

  const [receiverNames, setReceiverNames] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [scNames, setScNames] = useState([]);
  const [searchScName, setSearchScName] = useState("");
  const [showScNameDropdown, setShowScNameDropdown] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [companyDetailsMap, setCompanyDetailsMap] = useState({});
  const [nextLeadNumber, setNextLeadNumber] = useState("");
  const [creditDaysOptions, setCreditDaysOptions] = useState([]);
  const [creditLimitOptions, setCreditLimitOptions] = useState([]);
  const { showNotification } = useContext(AuthContext);
  const [designationOptions, setDesignationOptions] = useState([]);
  const [nobOptions, setNobOptions] = useState([]);
  const [stateOptions, setStateOptions] = useState([]);
  const [salesTypeOptions] = useState(["NBD", "CRR", "NBD_CRR"]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await fetchDropdownData();
        await fetchCompanyData();
        await generateNextLeadNumber();
      } catch (error) {
        console.error("Error during initial data fetch:", error);
      }
    };

    fetchInitialData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const { data, error } = await supabase.from("dropdown").select("*");
      if (error) throw error;

      if (data && data.length > 0) {
        const receivers = [...new Set(data.map((row) => row.lead_receiver_name).filter(Boolean))];
        const sources = [...new Set(data.map((row) => row.lead_source).filter(Boolean))];
        const scs = [...new Set(data.map((row) => row.sales_co_ordinator_name).filter(Boolean))];
        const states = [...new Set(data.map((row) => row.state).filter(Boolean))];
        const creditDays = [...new Set(data.map((row) => row.credit_days).filter(Boolean))];
        const creditLimits = [...new Set(data.map((row) => row.credit_limit).filter(Boolean))];
        const designations = [...new Set(data.map((row) => row.designation).filter(Boolean))];
        const nobs = [...new Set(data.map((row) => row.nob).filter(Boolean))];

        setReceiverNames(receivers.filter((item) => item && item.trim() !== "").sort());
        setLeadSources(sources.filter((item) => item && item.trim() !== "").sort());
        setScNames(scs.filter((item) => item && item.trim() !== "").sort());
        setStateOptions(states.filter((item) => item && item.trim() !== "").sort());
        setCreditDaysOptions(creditDays.filter((item) => item && item.trim() !== "").sort());
        setCreditLimitOptions(creditLimits.filter((item) => item && item.trim() !== "").sort());
        setDesignationOptions(designations.filter((item) => item && item.trim() !== "").sort());
        setNobOptions(nobs.filter((item) => item && item.trim() !== "").sort());
      }
    } catch (error) {
      console.error("Error fetching dropdown values:", error);
      setReceiverNames(["John Smith", "Sarah Johnson", "Michael Brown"]);
      setLeadSources(["Indiamart", "Justdial", "Social Media", "Website", "Referral", "Other"]);
      setScNames(["SC Person 1", "SC Person 2", "SC Person 3"]);
      setStateOptions(["Maharashtra", "Delhi", "Gujarat", "Karnataka", "Tamil Nadu"]);
      setDesignationOptions(["Manager", "Director", "Proprietor"]);
      setNobOptions(["Manufacturing", "Trading", "Service", "Retail"]);
    }
  };

  const fetchCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from("dropdown")
        .select("lead_form_company_name, lead_form_person_name, lead_form_mobile_no, lead_form_email, lead_form_address")
        .not("lead_form_company_name", "is", null);

      if (error) throw error;

      if (data && data.length > 0) {
        const companies = [];
        const detailsMap = {};

        data.forEach((row) => {
          if (row.lead_form_company_name) {
            companies.push(row.lead_form_company_name);
            detailsMap[row.lead_form_company_name] = {
              salesPerson: row.lead_form_person_name || "",
              phoneNumber: row.lead_form_mobile_no || "",
              email: row.lead_form_email || "",
              location: "",
              address: row.lead_form_address || "",
            };
          }
        });

        setCompanyOptions([...new Set(companies)]);
        setCompanyDetailsMap(detailsMap);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
    }
  };

  const generateNextLeadNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("leads_to_order")
        .select('"LD-Lead-No"')
        .order("id", { ascending: false })
        .limit(1);

      if (error) {
        setNextLeadNumber("LD-001");
        return;
      }

      if (!data || data.length === 0) {
        setNextLeadNumber("LD-001");
        return;
      }

      const lastLeadNumber = data[0]["LD-Lead-No"];
      if (lastLeadNumber && lastLeadNumber.startsWith("LD-")) {
        const match = lastLeadNumber.match(/LD-(\d+)/);
        if (match) {
          const lastNumber = Number.parseInt(match[1], 10);
          setNextLeadNumber(`LD-${String(lastNumber + 1).padStart(3, "0")}`);
        } else {
          setNextLeadNumber("LD-001");
        }
      } else {
        setNextLeadNumber("LD-001");
      }
    } catch (error) {
      setNextLeadNumber("LD-001");
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));

    if (id === "companyName" && value) {
      const companyDetails = companyDetailsMap[value] || {};
      setFormData((prevData) => ({
        ...prevData,
        companyName: value,
        phoneNumber: companyDetails.phoneNumber || "",
        salespersonName: companyDetails.salesPerson || "",
        location: companyDetails.location || "",
        email: companyDetails.email || "",
        address: companyDetails.address || prevData.address,
      }));
    }
  };

  const handleScNameChange = (name) => {
    setFormData((prev) => ({ ...prev, scName: name }));
    setSearchScName(name);
    setShowScNameDropdown(false);
  };

  const handleContactPersonChange = (index, field, value) => {
    const updatedContactPersons = [...formData.contactPersons];
    updatedContactPersons[index] = {
      ...updatedContactPersons[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons,
    });
  };

  const addContactPerson = () => {
    if (formData.contactPersons.length < 3) {
      setFormData({
        ...formData,
        contactPersons: [...formData.contactPersons, { name: "", designation: "", number: "" }],
      });
    }
  };

  const removeContactPerson = (index) => {
    const updatedContactPersons = [...formData.contactPersons];
    updatedContactPersons.splice(index, 1);
    setFormData({
      ...formData,
      contactPersons: updatedContactPersons,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const leadData = {
        Timestamp: formatDate(new Date()),
        "LD-Lead-No": nextLeadNumber,
        Lead_Receiver_Name: formData.receiverName,
        Lead_Source: formData.source,
        Company_Name: formData.companyName,
        Phone_Number: formData.phoneNumber,
        Salesperson_Name: formData.salespersonName,
        SC_Name: formData.scName,
        Location: formData.location,
        Email_Address: formData.email,
        State: formData.state,
        Address: formData.address,
        Person_name_1: formData.contactPersons[0]?.name || "",
        Designation_1: formData.contactPersons[0]?.designation || "",
        Phone_Number_1: formData.contactPersons[0]?.number || "",
        Person_Name_2: formData.contactPersons[1]?.name || "",
        Designation_2: formData.contactPersons[1]?.designation || "",
        Phone_Number_2: formData.contactPersons[1]?.number || "",
        Person_Name_3: formData.contactPersons[2]?.name || "",
        Designation_3: formData.contactPersons[2]?.designation || "",
        Phone_Number_3: formData.contactPersons[2]?.number || "",
        NOB: formData.nob,
        GST_Number: formData.gst,
        Sales_Type: formData.salesType,
        Group_Name: formData.groupName,
        Additional_Notes: formData.notes,
        "Customer_Registration Form": formData.customerRegistrationForm,
        "Credit _Access": formData.creditAccess,
        Credit_Days: formData.creditDays,
        Credit_Limit: formData.creditLimit,
      };

      const { error } = await supabase.from("leads_to_order").insert([leadData]);
      if (error) throw error;

      showNotification("Lead created successfully", "success");
      setFormData({
        receiverName: "",
        source: "",
        companyName: "",
        phoneNumber: "",
        salespersonName: "",
        location: "",
        email: "",
        contactPersons: [{ name: "", designation: "", number: "" }],
        state: "",
        address: "",
        customerRegistrationForm: "",
        creditAccess: "",
        creditDays: "",
        creditLimit: "",
        nob: "",
        salesType: "",
        gst: "",
        notes: "",
        scName: "",
        groupName: "",
      });
      setSearchScName("");

      await generateNextLeadNumber();
    } catch (error) {
      console.error("Error submitting lead:", error);
      showNotification("Error creating lead: " + error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredScNames = scNames.filter((name) =>
    name.toLowerCase().includes(searchScName.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10 px-4">
      {showImportModal && (
        <ExcelImportModal
          onClose={() => setShowImportModal(false)}
          onSaved={(gName) => {
            if (gName) {
              setFormData((prev) => ({ ...prev, groupName: gName }));
            }
          }}
        />
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-slate-100">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">New Lead</h2>
            <p className="text-sm text-slate-500">Fill in the lead information below</p>
            {nextLeadNumber && (
              <p className="text-sm font-semibold text-sky-600 mt-1">
                Next Lead Number: {nextLeadNumber}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const wb = XLSX.utils.book_new();
                const HEADERS = [
                  "Lead Receiver Name",
                  "Lead Source*",
                  "SC Name",
                  "Company Name",
                  "Person Name",
                  "Person Number",
                  "Location",
                  "Email Address",
                  "State",
                  "Address",
                  "Person 1 Name",
                  "Person 1 Designation",
                  "Person 1 Phone",
                  "Person 2 Name",
                  "Person 2 Designation",
                  "Person 2 Phone",
                  "Person 3 Name",
                  "Person 3 Designation",
                  "Person 3 Phone",
                  "Nature of Business(NOB)",
                  "Sales Type",
                  "GST Number",
                  "Additional Notes",
                ];
                const ws = XLSX.utils.aoa_to_sheet([HEADERS]);
                ws["!cols"] = HEADERS.map(() => ({ wch: 24 }));
                XLSX.utils.book_append_sheet(wb, ws, "Lead Import Template");
                XLSX.writeFile(wb, "Lead_Import_Template.xlsx");
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-white border-2 border-emerald-400 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </button>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import Excel
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="receiverName" className="block text-sm font-semibold text-gray-700">
                  Lead Receiver Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="receiverName"
                  value={formData.receiverName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  required
                >
                  <option value="">Select receiver</option>
                  {receiverNames.map((name, index) => (
                    <option key={index} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="source" className="block text-sm font-semibold text-gray-700">
                  Lead Source <span className="text-red-500">*</span>
                </label>
                <select
                  id="source"
                  value={formData.source}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

              <div className="space-y-2 relative">
                <label htmlFor="scName" className="block text-sm font-semibold text-gray-700">
                  SC Name
                </label>
                <input
                  type="text"
                  id="scName"
                  value={searchScName}
                  onChange={(e) => {
                    setSearchScName(e.target.value);
                    setShowScNameDropdown(true);
                  }}
                  onFocus={() => setShowScNameDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Type to search SC Name"
                />
                {showScNameDropdown && filteredScNames.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredScNames.map((name, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 cursor-pointer hover:bg-slate-100 text-sm"
                        onClick={() => handleScNameChange(name)}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  list="companyOptions"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Enter or select Company Name"
                  required
                />
                <datalist id="companyOptions">
                  {companyOptions.map((company, index) => (
                    <option key={index} value={company} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700">
                  Person Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Enter phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="salespersonName" className="block text-sm font-semibold text-gray-700">
                  Person Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="salespersonName"
                  value={formData.salespersonName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Enter person name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700">
                  Location
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Enter location"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address <span className="text-xs text-gray-400">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Enter email address"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700">
                  State
                </label>
                <select
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">Select state</option>
                  {stateOptions.map((state, index) => (
                    <option key={index} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="groupName" className="block text-sm font-semibold text-gray-700">
                  Group Name
                </label>
                <input
                  id="groupName"
                  value={formData.groupName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="Enter group name (optional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white resize-none"
                placeholder="Enter complete address"
                rows="2"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-md font-semibold text-slate-800">Contact Person Details</h3>
                {formData.contactPersons.length < 3 && (
                  <button
                    type="button"
                    onClick={addContactPerson}
                    className="px-3 py-1.5 bg-sky-500 text-white rounded-md text-xs font-semibold hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  >
                    Add Person
                  </button>
                )}
              </div>

              {formData.contactPersons.map((person, index) => (
                <div key={index} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-slate-700">Person {index + 1}</h4>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeContactPerson(index)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">Name</label>
                      <input
                        value={person.name}
                        onChange={(e) => handleContactPersonChange(index, "name", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                        placeholder="Contact name"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">Designation</label>
                      <select
                        value={person.designation}
                        onChange={(e) => handleContactPersonChange(index, "designation", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                      >
                        <option value="">Select designation</option>
                        {designationOptions.map((designation, idx) => (
                          <option key={idx} value={designation}>
                            {designation}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">Phone Number</label>
                      <input
                        value={person.number}
                        onChange={(e) => handleContactPersonChange(index, "number", e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                        placeholder="Contact number"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="nob" className="block text-sm font-semibold text-gray-700">
                  Nature of Business (NOB) <span className="text-red-500">*</span>
                </label>
                <select
                  id="nob"
                  value={formData.nob}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  required
                >
                  <option value="">Select nature of business</option>
                  {nobOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="salesType" className="block text-sm font-semibold text-gray-700">
                  Sales Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="salesType"
                  value={formData.salesType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  required
                >
                  <option value="">Select sales type</option>
                  {salesTypeOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="gst" className="block text-sm font-semibold text-gray-700">
                  GST Number
                </label>
                <input
                  id="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  placeholder="GST number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">
                Additional Notes
              </label>
              <input
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                placeholder="Enter any additional information"
              />
            </div>
          </div>
          <div className="p-6 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all shadow-md hover:shadow-lg"
            >
              {isSubmitting ? "Saving..." : "Save Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Leads;
