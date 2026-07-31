"use client";

import { useState, useEffect } from "react";
import QuotationDetails from "./quotation-details";
import ConsignorDetails from "./consignor-details";
import ConsigneeDetails from "./consignee-details";
import ItemsTable from "./items-table";
import TermsAndConditions from "./terms and conditions";
import BankDetails from "./bank-details";
import NotesSection from "./notes-section";
import SpecialOfferSection from "./special-offer-section";
import { getCompanyPrefix, getNextQuotationNumber } from "./quotation-service";
import supabase from "../../utils/supabase";

const QuotationForm = ({
  quotationData,
  handleInputChange,
  handleItemChange,
  handleAddItem,
  handleNoteChange,
  addNote,
  removeNote,
  hiddenFields,
  toggleFieldVisibility,
  isRevising,
  existingQuotations,
  selectedQuotation,
  handleSpecialDiscountChange,
  handleQuotationSelect,
  isLoadingQuotation,
  specialDiscount,
  setSpecialDiscount,
  selectedReferences,
  setSelectedReferences,
  imageform,
  addSpecialOffer,
  removeSpecialOffer,
  handleSpecialOfferChange,
  setQuotationData,
  hiddenColumns,
  setHiddenColumns,
  onQuotationSearch,
  onLoadMoreQuotations,
  hasMoreQuotations,
  isFetchingMore,
}) => {
  const [dropdownData, setDropdownData] = useState({});
  const [stateOptions, setStateOptions] = useState(["Select State"]);
  const [companyOptions, setCompanyOptions] = useState(["Select Company"]);
  const [referenceOptions, setReferenceOptions] = useState([
    "Select Reference",
  ]);
  const [preparedByOptions, setPreparedByOptions] = useState([""]);
  const [productCodes, setProductCodes] = useState([]);
  const [productNames, setProductNames] = useState([]);
  const [productData, setProductData] = useState({});
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  // Lead number states
  const [showLeadNoDropdown, setShowLeadNoDropdown] = useState(false);
  const [leadNoOptions, setLeadNoOptions] = useState(["Select Lead No."]);
  const [leadNoData, setLeadNoData] = useState({});

  // ─── HARDCODED REFERENCE PHONE NUMBER ────────────────────────────────────────
  // TODO: Replace this value when the actual number is confirmed
  const REFERENCE_PHONE_NO = "";
  // ─────────────────────────────────────────────────────────────────────────────

  // Fetch data from dedicated tables:
  // - consignor_details → state/consignor info
  // - client_master     → consignee companies
  // - items             → product codes, names, rates
  // - dropdown          → prepared_by names + reference (sp) info
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // 1. Fetch consignor details from consignor_details table
        const { data: consignorData, error: consignorError } = await supabase
          .from("consignor_details")
          .select("state, state_code, data, address, gstin, msme_num, pan_num, reference_name, contact_num");

        // 2. Fetch consignee companies from client_master table
        const { data: clientMasterData, error: clientMasterError } = await supabase
          .from("client_master")
          .select("company_name, billing_address, state, client_name, client_mobile_number, gst_number, state_code")
          .eq("isRelevant", true);

        // 3. Fetch items from items table in chunks
        const fetchItems = async () => {
          let allItems = [];
          let from = 0;
          const step = 500;
          let fetchMore = true;

          while (fetchMore) {
            const { data, error } = await supabase
              .from("items")
              .select("item_code, item_name, description, rate")
              .range(from, from + step - 1);

            if (error) throw error;
            
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
        const { data: itemsData, error: itemsError } = await fetchItems();

        // 4. Fetch prepared_by from dropdown table (category/value schema)
        const { data: preparedByData, error: preparedByError } = await supabase
          .from("dropdown")
          .select("value")
          .eq("category", "prepared_by");

        const dropdownError = preparedByError;
        const dropdownData = null; // replaced by separate queries above


        if (consignorError) console.error("Error fetching consignor_details:", consignorError);
        if (clientMasterError) console.error("Error fetching client_master:", clientMasterError);
        if (itemsError) console.error("Error fetching items:", itemsError);
        if (dropdownError) console.error("Error fetching dropdown (prepared_by):", dropdownError);

        // ── Build state options from consignor_details ──────────────────────────
        const stateOptionsData = ["Select State"];
        const stateDetailsMap = {};

        if (consignorData && consignorData.length > 0) {
          consignorData.forEach((row) => {
            if (row.state && !stateOptionsData.includes(row.state)) {
              stateOptionsData.push(row.state);
              stateDetailsMap[row.state] = {
                bankDetails: (row.data && typeof row.data === "object"
                  ? Object.entries(row.data).map(([k, v]) => `${k}: ${v}`).join("\n")
                  : row.data) || "",
                consignerAddress: row.address || "",
                stateCode: row.state_code || "",
                gstin: row.gstin || "",
                pan: row.pan_num || "",
                msmeNumber: row.msme_num || "",
              };
            }
          });
        }

        // ── Build company options from client_master ────────────────────────────
        const companyOptionsData = ["Select Company"];
        const companyDetailsMap = {};

        if (clientMasterData && clientMasterData.length > 0) {
          clientMasterData.forEach((row) => {
            if (row.company_name && !companyOptionsData.includes(row.company_name)) {
              companyOptionsData.push(row.company_name);
              companyDetailsMap[row.company_name] = {
                address: row.billing_address || "",
                state: row.state || "",
                contactName: row.client_name || "",
                contactNo: row.client_mobile_number || "",
                gstin: row.gst_number || "",
                stateCode: row.state_code || "",
              };
            }
          });
        }

        // ── Build reference options from dropdown (sp_details) ──────────────────
        const referenceOptionsData = ["Select Reference"];
        const referenceDetailsMap = {};
        const preparedByOptionsData = [""];

        // Build prepared_by options from category/value query
        if (preparedByData && preparedByData.length > 0) {
          preparedByData.forEach((row) => {
            if (row.value && !preparedByOptionsData.includes(row.value)) {
              preparedByOptionsData.push(row.value);
            }
          });
        }

        // Build reference options from consignor_details
        if (consignorData && consignorData.length > 0) {
          consignorData.forEach((row) => {
            if (row.reference_name && !referenceOptionsData.includes(row.reference_name)) {
              referenceOptionsData.push(row.reference_name);
              referenceDetailsMap[row.reference_name] = {
                mobile: row.contact_num ? String(row.contact_num) : "",
                // reference_phone_no is hardcoded (see REFERENCE_PHONE_NO constant above)
                phone: REFERENCE_PHONE_NO,
              };
            }
          });
        }

        // ── Build product codes/names from items table ──────────────────────────
        const codes = ["Select Code"];
        const names = ["Select Product"];
        const productDataMap = {};

        if (itemsData && itemsData.length > 0) {
          itemsData.forEach((row) => {
            const code = row.item_code;
            const name = row.item_name;
            const description = row.description || "";
            const rate = parseFloat(row.rate) || 0;

            if (code && !codes.includes(code)) codes.push(code);
            if (name && !names.includes(name)) names.push(name);

            if (code) {
              productDataMap[code] = { name, description, rate };
            }
            if (name) {
              productDataMap[name] = { code, description, rate };
            }
          });
        }

        // ── Apply all state updates ─────────────────────────────────────────────
        setStateOptions(stateOptionsData);
        setCompanyOptions(companyOptionsData);
        setReferenceOptions(referenceOptionsData);
        setPreparedByOptions(preparedByOptionsData);
        setProductCodes(codes);
        setProductNames(names);
        setProductData(productDataMap);

        setDropdownData({
          states: stateDetailsMap,
          companies: companyDetailsMap,
          references: referenceDetailsMap,
        });

      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        // Fallback to empty options on catastrophic failure
        setStateOptions([""]);
        setCompanyOptions([""]);
        setReferenceOptions([""]);
        setPreparedByOptions([""]);
        setProductCodes(["Select Code"]);
        setProductNames(["Select Product"]);
      }
    };

    fetchDropdownData();
  }, []);


  // Fetch lead numbers from Supabase tables
  useEffect(() => {
    const fetchLeadNumbers = async () => {
      try {
        const leadNoOptionsData = ["Select Lead No."];
        const leadNoDataMap = {};

        // Fetch from leads_to_order table
        const leadsColumns = [
          "\"LD-Lead-No\"",
          "Company_Name",
          "Address",
          "State",
          "Salesperson_Name",
          "Phone_Number",
          "GST_Number",
          "Item_Name1",
          "Quantity1",
          "Item_Name2",
          "Quantity2",
          "Item_Name3",
          "Quantity3",
          "Item_Name4",
          "Quantity4",
          "Item_Name5",
          "Quantity5",
          "\"Item/qty\"",
          "Enquiry_Type",
        ].join(",");

        const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select("*");

        if (!leadsError && leadsData) {
          leadsData.forEach((row) => {
            const leadNo = row["LD-Lead-No"];

            if (leadNo && !leadNoOptionsData.includes(leadNo)) {
              leadNoOptionsData.push(leadNo);

              leadNoDataMap[leadNo] = {
                sheet: "LEADS",
                companyName: row["Company_Name"] || "",
                address: row["Address"] || "",
                state: row["State"] || "",
                contactName: row["Salesperson_Name"] || "",
                contactNo: row["Phone_Number"] || "",
                gstin: row["GST_Number"] || "",
                rowData: row,
              };
            }
          });
        }

        // Fetch from enquiry_to_order table
        const enquiryColumns = [
          "enquiry_no",
          "company_name",
          "location",
          "enquiry_for_state",
          "sales_person_name",
          "phone_number",
          "gst_number",
          "shipping_address",
          "item_name1",
          "quantity1",
          "item_name2",
          "quantity2",
          "item_name3",
          "quantity3",
          "item_name4",
          "quantity4",
          "item_name5",
          "quantity5",
          "item_name6",
          "quantity6",
          "item_name7",
          "quantity7",
          "item_name8",
          "quantity8",
          "item_name9",
          "quantity9",
          "item_name10",
          "quantity10",
          "item_qty",
          "sales_type",
        ].join(",");

        const { data: enquiryData, error: enquiryError } = await supabase
          .from("enquiries")
          .select("*");

        if (!enquiryError && enquiryData) {
          enquiryData.forEach((row) => {
            const leadNo = row.enquiry_no;

            if (leadNo && !leadNoOptionsData.includes(leadNo)) {
              leadNoOptionsData.push(leadNo);

              leadNoDataMap[leadNo] = {
                sheet: "ENQUIRY",
                companyName: row.company_name || "",
                address: row.location || "",
                state: row.enquiry_for_state || "",
                contactName: row.sales_person_name || "",
                contactNo: row.phone_number || "",
                gstin: row.gst_number || "",
                shipTo: row.shipping_address || "",
                rowData: row,
              };
            }
          });
        }

        setLeadNoOptions(leadNoOptionsData);
        setLeadNoData(leadNoDataMap);
      } catch (error) {
        console.error("Error fetching lead numbers:", error);
      }
    };

    fetchLeadNumbers();
  }, []);

  const handleSpecialDiscountChangeWrapper = (value) => {
    const discount = Number(value) || 0;
    setSpecialDiscount(discount);
    handleSpecialDiscountChange(discount);
  };


  // Function to handle quotation number updates
  const handleQuotationNumberUpdate = (newQuotationNumber) => {
    handleInputChange("quotationNo", newQuotationNumber);
  };

  // Helper function to safely convert value to string
  const safeToString = (value) => {
    if (value === null || value === undefined) return "";
    return String(value);
  };

  // Handle lead number selection and autofill
  // Handle lead number selection and autofill
  const handleLeadNoSelect = async (selectedLeadNo) => {
    if (
      !selectedLeadNo ||
      selectedLeadNo === "Select Lead No." ||
      !leadNoData[selectedLeadNo]
    ) {
      return;
    }

    setIsItemsLoading(true);

    const leadData = leadNoData[selectedLeadNo];

    // Fill consignee details
    const companyName = leadData.companyName;
    handleInputChange("consigneeName", companyName);
    handleInputChange("consigneeAddress", leadData.address);
    handleInputChange("consigneeState", leadData.state);
    handleInputChange("consigneeContactName", leadData.contactName);
    handleInputChange("consigneeContactNo", leadData.contactNo);
    handleInputChange("consigneeGSTIN", leadData.gstin);

    if (leadData.shipTo) {
      handleInputChange("shipTo", leadData.shipTo);
    }


    // Get prefix from Enquiry_Type column and update quotation number
    try {
      let companyPrefix = "";

      // Get Enquiry_Type from the lead data
      if (leadData.sheet === "LEADS") {
        companyPrefix = leadData.rowData.Enquiry_Type || "";
      } else if (leadData.sheet === "ENQUIRY") {
        companyPrefix = leadData.rowData.sales_type || "";
      }

      // If Enquiry_Type is found, use it; otherwise fallback to company-based prefix
      if (companyPrefix) {
        const newQuotationNumber = await getNextQuotationNumber(companyPrefix);
        handleInputChange("quotationNo", newQuotationNumber);
        console.log(
          "Updated quotation number to:",
          newQuotationNumber,
          "with Enquiry_Type prefix:",
          companyPrefix
        );
      } else {
        // Fallback to original company-based prefix if Enquiry_Type is not available
        const fallbackPrefix = await getCompanyPrefix(companyName);
        const newQuotationNumber = await getNextQuotationNumber(fallbackPrefix);
        handleInputChange("quotationNo", newQuotationNumber);
        console.log(
          "Updated quotation number to:",
          newQuotationNumber,
          "with fallback company prefix:",
          fallbackPrefix
        );
      }
    } catch (error) {
      console.error(
        "Error updating quotation number from lead selection:",
        error
      );
    }

    // Auto-fill items based on lead data
    const autoItems = [];

    if (leadData.sheet === "LEADS") {
      const row = leadData.rowData;

      // Extract items from leads_to_order table
      const itemColumns = [
        { nameCol: "Item_Name1", qtyCol: "Quantity1" },
        { nameCol: "Item_Name2", qtyCol: "Quantity2" },
        { nameCol: "Item_Name3", qtyCol: "Quantity3" },
        { nameCol: "Item_Name4", qtyCol: "Quantity4" },
        { nameCol: "Item_Name5", qtyCol: "Quantity5" },
      ];

      for (const { nameCol, qtyCol } of itemColumns) {
        const itemName = row[nameCol] ? safeToString(row[nameCol]).trim() : "";
        const itemQty = row[qtyCol] ? safeToString(row[qtyCol]) : "";

        if (itemName !== "" && itemQty !== "") {
          const qty = isNaN(Number(itemQty)) ? 1 : Number(itemQty);
          autoItems.push({
            name: itemName,
            qty: qty,
          });
        }
      }

      // Also check for JSON data in Item/qty field
      const itemQtyJson = row["Item/qty"];
      if (itemQtyJson) {
        try {
          const jsonData = JSON.parse(itemQtyJson);
          if (Array.isArray(jsonData)) {
            jsonData.forEach((item) => {
              if (
                item.name &&
                item.quantity !== undefined &&
                item.quantity !== null
              ) {
                const qty = isNaN(Number(item.quantity))
                  ? 1
                  : Number(item.quantity);
                autoItems.push({
                  name: item.name,
                  qty: qty,
                });
              }
            });
          }
        } catch (error) {
          console.error("Error parsing JSON data from leads_to_order:", error);
        }
      }
    } else if (leadData.sheet === "ENQUIRY") {
      const row = leadData.rowData;

      // Extract items from enquiry_to_order table
      const itemColumns = [
        { nameCol: "item_name1", qtyCol: "quantity1" },
        { nameCol: "item_name2", qtyCol: "quantity2" },
        { nameCol: "item_name3", qtyCol: "quantity3" },
        { nameCol: "item_name4", qtyCol: "quantity4" },
        { nameCol: "item_name5", qtyCol: "quantity5" },
        { nameCol: "item_name6", qtyCol: "quantity6" },
        { nameCol: "item_name7", qtyCol: "quantity7" },
        { nameCol: "item_name8", qtyCol: "quantity8" },
        { nameCol: "item_name9", qtyCol: "quantity9" },
        { nameCol: "item_name10", qtyCol: "quantity10" },
      ];

      for (const { nameCol, qtyCol } of itemColumns) {
        const itemName = row[nameCol] ? safeToString(row[nameCol]).trim() : "";
        const itemQty = row[qtyCol] ? safeToString(row[qtyCol]) : "";

        if (itemName !== "" && itemQty !== "") {
          const qty = isNaN(Number(itemQty)) ? 1 : Number(itemQty);
          autoItems.push({
            name: itemName,
            qty: qty,
          });
        }
      }

      // Also check for JSON data in item_qty field
      const itemQtyJson = row.item_qty;
      if (itemQtyJson) {
        try {
          const jsonData = JSON.parse(itemQtyJson);
          if (Array.isArray(jsonData)) {
            jsonData.forEach((item) => {
              if (
                item.name &&
                item.quantity !== undefined &&
                item.quantity !== null
              ) {
                const qty = isNaN(Number(item.quantity))
                  ? 1
                  : Number(item.quantity);
                autoItems.push({
                  name: item.name,
                  qty: qty,
                });
              }
            });
          }
        } catch (error) {
          console.error(
            "Error parsing JSON data from enquiry_to_order:",
            error
          );
        }
      }
    }

    // Update items if found from lead data
    if (autoItems.length > 0) {

      const newItems = autoItems.map((item, index) => {
        // Auto-fill product code from productData
        let productInfo = null;
        let productCode = "";
        let productDescription = "";
        let productRate = 0;

        // Try exact match first
        if (productData[item.name]) {
          productInfo = productData[item.name];
        } else {
          // Try case-insensitive match
          const matchingKey = Object.keys(productData).find(
            (key) => key.toLowerCase().trim() === item.name.toLowerCase().trim()
          );
          if (matchingKey) {
            productInfo = productData[matchingKey];
          }
        }

        if (productInfo) {
          productCode = productInfo.code || "";
          productDescription = item.name === "Freight" ? "" : (productInfo.description || "");
          productRate = productInfo.rate || 0;
        }

        return {
          id: index + 1,
          code: productCode,
          name: item.name,
          description: productDescription,
          gst: item.name === "Freight" ? 0 : 18,
          qty: item.qty,
          units: "Nos",
          rate: productRate,
          discount: 0,
          flatDiscount: 0,
          amount: item.qty * productRate,
          isFreight: item.name === "Freight",
        };
      });

      handleInputChange("items", newItems);
    }

    setIsItemsLoading(false);
  };

  // Function to auto-fill items based on company selection
  const handleAutoFillItems = async (companyName) => {
    if (!companyName || companyName === "Select Company") return;

    setIsItemsLoading(true);

    try {

      let itemsFound = false;
      const autoItems = [];

      const leadsColumns = [
        "Item_Name1", "Quantity1",
        "Item_Name2", "Quantity2",
        "Item_Name3", "Quantity3",
        "Item_Name4", "Quantity4",
        "Item_Name5", "Quantity5",
        "\"Item/qty\"",
      ].join(",");

      // Check leads table first
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_name", companyName)
        .limit(1);

      if (!leadsError && leadsData && leadsData.length > 0) {
        const row = leadsData[0];

        // Extract items from regular columns
        const itemColumns = [
          { nameCol: "Item_Name1", qtyCol: "Quantity1" },
          { nameCol: "Item_Name2", qtyCol: "Quantity2" },
          { nameCol: "Item_Name3", qtyCol: "Quantity3" },
          { nameCol: "Item_Name4", qtyCol: "Quantity4" },
          { nameCol: "Item_Name5", qtyCol: "Quantity5" },
        ];

        for (const { nameCol, qtyCol } of itemColumns) {
          const itemName = row[nameCol]
            ? safeToString(row[nameCol]).trim()
            : "";
          const itemQty = row[qtyCol] ? safeToString(row[qtyCol]) : "";

          if (itemName !== "" && itemQty !== "") {
            const qty = isNaN(Number(itemQty)) ? 1 : Number(itemQty);
            autoItems.push({
              name: itemName,
              qty: qty,
            });
          }
        }

        // Also check for JSON data
        const itemQtyJson = row["Item/qty"];
        if (itemQtyJson) {
          try {
            const jsonData = JSON.parse(itemQtyJson);
            if (Array.isArray(jsonData)) {
              jsonData.forEach((item) => {
                if (
                  item.name &&
                  item.quantity !== undefined &&
                  item.quantity !== null
                ) {
                  const qty = isNaN(Number(item.quantity))
                    ? 1
                    : Number(item.quantity);
                  autoItems.push({
                    name: item.name,
                    qty: qty,
                  });
                }
              });
            }
          } catch (error) {
            console.error("Error parsing JSON from leads_to_order:", error);
          }
        }

        itemsFound = true;
      }

      // If not found in leads_to_order, try enquiry_to_order
      if (!itemsFound) {
        const enquiryColumns = [
          "item_name1", "quantity1",
          "item_name2", "quantity2",
          "item_name3", "quantity3",
          "item_name4", "quantity4",
          "item_name5", "quantity5",
          "item_name6", "quantity6",
          "item_name7", "quantity7",
          "item_name8", "quantity8",
          "item_name9", "quantity9",
          "item_name10", "quantity10",
          "item_qty",
        ].join(",");

        const { data: enquiryData, error: enquiryError } = await supabase
          .from("enquiries")
          .select("*")
          .eq("company_name", companyName)
          .limit(1);

        if (!enquiryError && enquiryData && enquiryData.length > 0) {
          const row = enquiryData[0];

          // Extract items from columns
          const itemColumns = [
            { nameCol: "item_name1", qtyCol: "quantity1" },
            { nameCol: "item_name2", qtyCol: "quantity2" },
            { nameCol: "item_name3", qtyCol: "quantity3" },
            { nameCol: "item_name4", qtyCol: "quantity4" },
            { nameCol: "item_name5", qtyCol: "quantity5" },
            { nameCol: "item_name6", qtyCol: "quantity6" },
            { nameCol: "item_name7", qtyCol: "quantity7" },
            { nameCol: "item_name8", qtyCol: "quantity8" },
            { nameCol: "item_name9", qtyCol: "quantity9" },
            { nameCol: "item_name10", qtyCol: "quantity10" },
          ];

          for (const { nameCol, qtyCol } of itemColumns) {
            const itemName = row[nameCol]
              ? safeToString(row[nameCol]).trim()
              : "";
            const itemQty = row[qtyCol] ? safeToString(row[qtyCol]) : "";

            if (itemName !== "" && itemQty !== "") {
              const qty = isNaN(Number(itemQty)) ? 1 : Number(itemQty);
              autoItems.push({
                name: itemName,
                qty: qty,
              });
            }
          }

          // Also check for JSON data
          const itemQtyJson = row.item_qty;
          if (itemQtyJson) {
            try {
              const jsonData = JSON.parse(itemQtyJson);
              if (Array.isArray(jsonData)) {
                jsonData.forEach((item) => {
                  if (
                    item.name &&
                    item.quantity !== undefined &&
                    item.quantity !== null
                  ) {
                    const qty = isNaN(Number(item.quantity))
                      ? 1
                      : Number(item.quantity);
                    autoItems.push({
                      name: item.name,
                      qty: qty,
                    });
                  }
                });
              }
            } catch (error) {
              console.error("Error parsing JSON from enquiry_to_order:", error);
            }
          }

          itemsFound = true;
        }
      }

      // If items found, auto-fill the quotation table only if no items exist or only default item exists
      if (itemsFound && autoItems.length > 0) {
        // Check if there are only default/empty items
        const hasOnlyDefaultItems = quotationData.items.length === 1 &&
          (!quotationData.items[0].name || quotationData.items[0].name.trim() === "") &&
          quotationData.items[0].qty === 1;

        if (hasOnlyDefaultItems || quotationData.items.length === 0) {

          // Clear existing items and add new ones
          const newItems = autoItems.map((item, index) => {
            // Look up the product code from productData
            const productInfo = productData[item.name];
            const productCode = productInfo ? productInfo.code : "";
            const productDescription = (item.name === "Freight" || !productInfo) ? "" : (productInfo.description || "");
            const productRate = productInfo ? productInfo.rate : 0;

            return {
              id: index + 1,
              code: productCode,
              name: item.name,
              description: productDescription,
              gst: item.name === "Freight" ? 0 : 18,
              qty: item.qty,
              units: "Nos",
              rate: productRate,
              discount: 0,
              flatDiscount: 0,
              amount: item.qty * productRate,
              isFreight: item.name === "Freight",
            };
          });

          // Update quotation data with new items
          handleInputChange("items", newItems);
        } else {
        }
      } else {
      }
    } catch (error) {
      console.error("Error auto-filling items:", error);
    } finally {
      setIsItemsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <QuotationDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            isRevising={isRevising}
            existingQuotations={existingQuotations}
            selectedQuotation={selectedQuotation}
            handleQuotationSelect={handleQuotationSelect}
            isLoadingQuotation={isLoadingQuotation}
            preparedByOptions={preparedByOptions}
            stateOptions={stateOptions}
            dropdownData={dropdownData}
            onQuotationSearch={onQuotationSearch}
            onLoadMoreQuotations={onLoadMoreQuotations}
            hasMoreQuotations={hasMoreQuotations}
            isFetchingMore={isFetchingMore}
          />

          <ConsignorDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            referenceOptions={referenceOptions}
            selectedReferences={selectedReferences}
            setSelectedReferences={setSelectedReferences}
            dropdownData={dropdownData}
          />
        </div>

        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <ConsigneeDetails
            quotationData={quotationData}
            handleInputChange={handleInputChange}
            companyOptions={companyOptions}
            dropdownData={dropdownData}
            onQuotationNumberUpdate={handleQuotationNumberUpdate}
            onAutoFillItems={handleAutoFillItems}
            showLeadNoDropdown={showLeadNoDropdown}
            setShowLeadNoDropdown={setShowLeadNoDropdown}
            leadNoOptions={leadNoOptions}
            handleLeadNoSelect={handleLeadNoSelect}
          />
        </div>
      </div>

      <ItemsTable
        quotationData={quotationData}
        handleItemChange={handleItemChange}
        handleAddItem={handleAddItem}
        handleSpecialDiscountChange={handleSpecialDiscountChangeWrapper}
        specialDiscount={specialDiscount}
        setSpecialDiscount={setSpecialDiscount}
        productCodes={productCodes}
        productNames={productNames}
        productData={productData}
        setQuotationData={setQuotationData}
        isLoading={isItemsLoading}
        hiddenColumns={hiddenColumns}
        setHiddenColumns={setHiddenColumns}
      />

      <TermsAndConditions
        quotationData={quotationData}
        handleInputChange={handleInputChange}
        hiddenFields={hiddenFields}
        toggleFieldVisibility={toggleFieldVisibility}
      />

      <SpecialOfferSection
        quotationData={quotationData}
        handleInputChange={handleInputChange}
        addSpecialOffer={addSpecialOffer}
        removeSpecialOffer={removeSpecialOffer}
        handleSpecialOfferChange={handleSpecialOfferChange}
      />

      <NotesSection
        quotationData={quotationData}
        handleNoteChange={handleNoteChange}
        addNote={addNote}
        removeNote={removeNote}
      />

      <BankDetails
        quotationData={quotationData}
        handleInputChange={handleInputChange}
        imageform={imageform}
      />
    </div>
  );
};

export default QuotationForm;
