"use client";

import { useState, useEffect } from "react";
import { DownloadIcon, SaveIcon, ShareIcon } from "../../components/Icons";
import image1 from "../../assests/WhatsApp Image 2025-05-14 at 4.11.43 PM.jpeg";
import imageform from "../../assests/banner.jpeg";
import QuotationHeader from "./quotation-header";
import QuotationForm from "./quotation-form";
import QuotationPreview from "./quotation-preview";
import { generatePDFFromData } from "./pdf-generator";
import { useQuotationData } from "./use-quotation-data";
import supabase from "../../utils/supabase";

// export const getNextQuotationNumber = async (companyPrefix = "NBD") => {
//   try {
//     // Get the latest quotation number with the given prefix
//     const { data, error } = await supabase
//       .from('Make_Quotation')
//       .select('Quotation_No')
//       .ilike('Quotation_No', `${companyPrefix}-%`)
//       .order('Timestamp', { ascending: false })
//       .limit(1)

//     if (error) {
//       console.error('Error fetching quotation numbers:', error)
//       return `${companyPrefix}-001`
//     }

//     if (!data || data.length === 0) {
//       return `${companyPrefix}-001`
//     }

//     const lastQuotationNo = data[0].Quotation_No
//     const parts = lastQuotationNo.split('-')

//     if (parts.length >= 2) {
//       const lastNumber = parseInt(parts[parts.length - 1]) || 0
//       const newNumber = (lastNumber + 1).toString().padStart(3, '0')
//       return `${companyPrefix}-${newNumber}`
//     }

//     return `${companyPrefix}-001`
//   } catch (error) {
//     console.error("Error getting next quotation number:", error)
//     return `${companyPrefix}-001`
//   }
// }

export const getCurrentFinancialYear = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // January is 0

  let financialYearStart, financialYearEnd;

  if (currentMonth >= 4) {
    // April to March - current year to next year
    financialYearStart = currentYear;
    financialYearEnd = currentYear + 1;
  } else {
    // January to March - previous year to current year
    financialYearStart = currentYear - 1;
    financialYearEnd = currentYear;
  }

  // Return last two digits of years
  return {
    start: financialYearStart.toString().slice(-2),
    end: financialYearEnd.toString().slice(-2),
  };
};

// Update the getNextQuotationNumber function
export const getNextQuotationNumber = async (prefix = "NBD") => {
  try {
    const financialYear = getCurrentFinancialYear();
    const yearPrefix = `${prefix}-${financialYear.start}-${financialYear.end}`;

    // Fetch all quotations matching the prefix and current year
    const { data, error } = await supabase
      .from("Make_Quotation")
      .select("Quotation_No")
      .like("Quotation_No", `${yearPrefix}-%`);

    if (error) {
      console.error("Error fetching latest quotations:", error);
      return `${yearPrefix}-001`; // Start from 001
    }

    let maxNumber = 0; // Default to 0 if no records found

    if (data && data.length > 0) {
      console.log(`Found ${data.length} quotations with prefix: "${yearPrefix}"`);

      data.forEach((item) => {
        const quotationNo = item.Quotation_No;
        const parts = quotationNo.split("-");

        // The serial number should be the 4th part (index 3)
        // Format: NBD-25-26-001 -> ["NBD", "25", "26", "001"]
        // Format: NBD-25-26-001-01 (Revision) -> ["NBD", "25", "26", "001", "01"]
        if (parts.length >= 4) {
          const serialPart = parts[3];
          const serialNumber = parseInt(serialPart, 10);
          if (!isNaN(serialNumber) && serialNumber > maxNumber) {
            maxNumber = serialNumber;
          }
        }
      });
      console.log(`Highest numeric serial found for "${yearPrefix}": ${maxNumber}`);
    }

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    const result = `${yearPrefix}-${nextNumber}`;
    console.log(`Generated next Quotation No: ${result}`);
    return result;

  } catch (error) {
    console.error("Error generating quotation number:", error);
    const financialYear = getCurrentFinancialYear();
    return `${prefix}-${financialYear.start}-${financialYear.end}-001`;
  }
};

// Function to get company prefix from leads_to_order or enquiry_to_order tables
export const getCompanyPrefix = async (companyName) => {
  try {
    // First try leads_to_order table
    const { data: leadsData, error: leadsError } = await supabase
      .from("leads_to_order")
      .select("Company_Name")
      .eq("Company_Name", companyName)
      .limit(1);

    if (!leadsError && leadsData && leadsData.length > 0) {
      // Generate prefix from company name (first 3 letters uppercase)
      const prefix = companyName
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
      return "NBD";
    }

    // If not found, try enquiry_to_order table
    const { data: enquiryData, error: enquiryError } = await supabase
      .from("enquiry_to_order")
      .select("company_name")
      .eq("company_name", companyName)
      .limit(1);

    if (!enquiryError && enquiryData && enquiryData.length > 0) {
      // Generate prefix from company name (first 3 letters uppercase)
      const prefix = companyName
        .substring(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, "");
      return "NBD";
    }

    console.log("No company found, using default NBD prefix");
    return "NBD"; // Default fallback
  } catch (error) {
    console.error("Error getting company prefix:", error);
    return "NBD"; // Default fallback
  }
};

