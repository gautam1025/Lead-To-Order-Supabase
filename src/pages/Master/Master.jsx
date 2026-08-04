import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Users, UserCheck, Layers, MapPin, Package, Clock, Database, ChevronRight } from "lucide-react";
import supabase from "../../utils/supabase";

// Sub-master Components
import ClientMaster from "./ClientMaster";
import ScDistributionMaster from "./ScDistributionMaster";
import CREMgmt from "./CREMgmt";
import Dropdowns from "./Dropdowns";
import Consignors from "./Consignors";
import Items from "./Items";
import TatConfig from "./tatConfig";

const masterNavItems = [
  {
    id: "client",
    label: "Client Master",
    icon: Building2,
    table: "client_master",
    description: "Manage client details and assigned managers"
  },
  {
    id: "sc-distribution",
    label: "SC Distribution",
    icon: Users,
    table: "sc_distribution",
    description: "Configure sales coordinator round-robin pools"
  },
  {
    id: "crm-distribution",
    label: "CRM Distribution",
    icon: UserCheck,
    table: "crm_distribution",
    description: "Set CRM assignment rules by Group, State or NOB"
  },
  {
    id: "dropdowns",
    label: "Dropdowns",
    icon: Layers,
    table: "dropdown",
    description: "Manage lead sources, NOBs, and drop down lists"
  },
  {
    id: "consignors",
    label: "Consignor Details",
    icon: MapPin,
    table: "consignor_details",
    description: "Manage shipping consignors and billing entities"
  },
  {
    id: "items",
    label: "Items & Catalog",
    icon: Package,
    table: "items",
    description: "Product database and pricing catalog"
  },
  {
    id: "tat-config",
    label: "TAT Configuration",
    icon: Clock,
    table: "tat_config",
    description: "Turnaround time SLAs and alerts setup"
  },
];

export default function Master() {
  const { substage } = useParams();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  // Resolve current tab (default to 'client' or alias 'tat')
  const currentTab = !substage ? "client" : substage === "tat" ? "tat-config" : substage;

  useEffect(() => {
    // Proactively redirect to default substage if root /master is visited directly
    if (!substage) {
      navigate("/master/client", { replace: true });
    }
  }, [substage, navigate]);

  useEffect(() => {
    const fetchCounts = async () => {
      const fetchTableCount = async (tableName) => {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });
          if (!error && count !== null) {
            return count;
          }
          return 0;
        } catch (err) {
          return 0;
        }
      };

      const results = await Promise.all(
        masterNavItems.map(async (item) => ({
          id: item.id,
          count: await fetchTableCount(item.table),
        }))
      );

      const newCounts = {};
      results.forEach((r) => {
        newCounts[r.id] = r.count;
      });
      setCounts(newCounts);
    };

    fetchCounts();
  }, [currentTab]);

  const renderActiveComponent = () => {
    switch (currentTab) {
      case "client":
        return <ClientMaster />;
      case "sc-distribution":
        return <ScDistributionMaster />;
      case "crm-distribution":
        return <CREMgmt />;
      case "dropdowns":
        return <Dropdowns />;
      case "consignors":
        return <Consignors />;
      case "items":
        return <Items />;
      case "tat":
      case "tat-config":
        return <TatConfig />;
      default:
        return <ClientMaster />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-3.5rem)] bg-slate-50/50">
      {/* Master Data Vertical Sub-Sidebar */}
      <div className="w-full md:w-48 lg:w-52 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-1 shrink-0 shadow-sm z-10">
        <div className="mb-1.5 px-2 py-1">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-sky-500" />
            Master Data
          </h2>
        </div>

        <nav className="space-y-1">
          {masterNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (currentTab === "tat-config" && item.id === "tat-config" && substage === "tat");
            const count = counts[item.id];

            return (
              <button
                key={item.id}
                onClick={() => navigate(`/master/${item.id}`)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group ${
                  isActive
                    ? "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-700 font-bold border border-sky-100/75 shadow-sm"
                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-600 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-1">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-sky-600" : "text-slate-400 group-hover:text-sky-600"
                  }`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {count !== undefined ? (
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                      isActive
                        ? "bg-sky-500 text-white shadow-sm"
                        : "text-slate-600 bg-slate-100 group-hover:bg-sky-100 group-hover:text-sky-700"
                    }`}>
                      {count}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-300 animate-pulse">...</span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isActive ? "text-sky-500 translate-x-0.5" : "text-slate-300 group-hover:text-sky-500"
                  }`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Right Area Renders Sub-Master Component */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        <div className="w-full">
          {renderActiveComponent()}
        </div>
      </div>
    </div>
  );
}
