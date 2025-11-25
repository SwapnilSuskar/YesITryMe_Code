import {
  Calendar,
  Download,
  Loader2,
  Package,
  UserPlus,
  Users,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api, { API_ENDPOINTS } from "../../config/api";

const formatDateInput = (date) => date.toISOString().split("T")[0];
const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "—";
const formatCurrency = (value) =>
  typeof value === "number"
    ? `₹${value.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })}`
    : "₹0";

const getDateNDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const sanitizeCsvValue = (value) => {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

const AdminActivationTracker = () => {
  const defaultEnd = new Date();
  const defaultStart = getDateNDaysAgo(6);
  const [filters, setFilters] = useState({
    startDate: formatDateInput(defaultStart),
    endDate: formatDateInput(defaultEnd)
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [report, setReport] = useState({
    packages: [],
    superPackages: [],
    registrations: [],
    counts: {
      packages: 0,
      superPackages: 0,
      registrations: 0
    },
    range: {
      start: defaultStart.toISOString(),
      end: defaultEnd.toISOString()
    }
  });
  const [activeTab, setActiveTab] = useState("packages");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({
          startDate: appliedFilters.startDate,
          endDate: appliedFilters.endDate
        });
        const response = await api.get(
          `${API_ENDPOINTS.admin.activationReport}?${params.toString()}`
        );

        if (response.data?.success) {
          setReport(response.data.data);
        } else {
          setError("Failed to fetch activation data");
        }
      } catch (err) {
        console.error("Activation report fetch error:", err);
        setError(
          err.response?.data?.message || "Failed to fetch activation data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [appliedFilters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (new Date(filters.startDate) > new Date(filters.endDate)) {
      setError("Start date cannot be after end date");
      return;
    }

    setAppliedFilters(filters);
  };

  const tableConfig = useMemo(
    () => ({
      packages: {
        title: "Package Activations",
        icon: Package,
        data: report.packages || [],
        columns: [
          { label: "Purchase ID", value: (item) => item.purchaseId },
          { label: "Transaction ID", value: (item) => item.transactionId || "—" },
          {
            label: "User",
            value: (item) =>
              `${item.purchaserName || "N/A"} (${item.purchaserId || "—"})`
          },
          {
            label: "Contact",
            value: (item) =>
              `${item.contact?.mobile || "—"} ${
                item.contact?.email ? `• ${item.contact.email}` : ""
              }`
          },
          {
            label: "Package",
            value: (item) => item.packageName || "—"
          },
          {
            label: "Amount",
            value: (item) => formatCurrency(item.amount)
          },
          {
            label: "Payment",
            value: (item) => item.paymentMethod || "—"
          },
          {
            label: "Activation Date",
            value: (item) => formatDateTime(item.activationDate)
          }
        ]
      },
      superPackages: {
        title: "Super Package Activations",
        icon: Zap,
        data: report.superPackages || [],
        columns: [
          { label: "Purchase ID", value: (item) => item.purchaseId },
          { label: "Transaction ID", value: (item) => item.transactionId || "—" },
          {
            label: "User",
            value: (item) =>
              `${item.purchaserName || "N/A"} (${item.purchaserId || "—"})`
          },
          {
            label: "Contact",
            value: (item) =>
              `${item.contact?.mobile || "—"} ${
                item.contact?.email ? `• ${item.contact.email}` : ""
              }`
          },
          {
            label: "Super Package",
            value: (item) => item.packageName || "—"
          },
          {
            label: "Amount",
            value: (item) => formatCurrency(item.amount)
          },
          {
            label: "Payment",
            value: (item) => item.paymentMethod || "—"
          },
          {
            label: "Activation Date",
            value: (item) => formatDateTime(item.activationDate)
          }
        ]
      },
      registrations: {
        title: "User Registrations",
        icon: Users,
        data: report.registrations || [],
        columns: [
          { label: "User ID", value: (item) => item.userId },
          {
            label: "User",
            value: (item) => `${item.firstName} ${item.lastName}`.trim()
          },
          {
            label: "Contact",
            value: (item) =>
              `${item.mobile || "—"} ${item.email ? `• ${item.email}` : ""}`
          },
          {
            label: "Sponsor",
            value: (item) =>
              `${item.sponsorName || "—"} (${item.sponsorId || "—"})`
          },
          {
            label: "Registered On",
            value: (item) => formatDateTime(item.createdAt)
          },
          {
            label: "Activation Date",
            value: (item) => formatDateTime(item.activationDate)
          },
          {
            label: "Status",
            value: (item) => item.status || "free"
          }
        ]
      }
    }),
    [report]
  );

  const activeConfig = tableConfig[activeTab];
  const currentData = activeConfig?.data || [];

  const handleExport = () => {
    if (!activeConfig || currentData.length === 0) return;
    const headerRow = activeConfig.columns.map((col) => sanitizeCsvValue(col.label));
    const dataRows = currentData.map((item) =>
      activeConfig.columns
        .map((col) => sanitizeCsvValue(col.value(item)))
        .join(",")
    );

    const csvContent = [headerRow.join(","), ...dataRows].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const filename = `activation-${activeTab}-${appliedFilters.startDate}-${appliedFilters.endDate}.csv`;
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">Loading activation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 pt-20 pb-12">
      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white py-8 px-4 sm:px-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Activation Tracker</h1>
          <p className="text-orange-50">
            Monitor package activations, super package upgrades, and user
            registrations by date.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: "Package Activations",
              value: report.counts?.packages || 0,
              icon: Package,
              accent: "from-purple-500 to-indigo-500"
            },
            {
              label: "Super Package Activations",
              value: report.counts?.superPackages || 0,
              icon: Zap,
              accent: "from-orange-500 to-pink-500"
            },
            {
              label: "New Registrations",
              value: report.counts?.registrations || 0,
              icon: UserPlus,
              accent: "from-emerald-500 to-teal-500"
            }
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center gap-4"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-white`}
              >
                <card.icon size={26} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-800">
                  {card.value.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Calendar size={16} />
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                max={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Calendar size={16} />
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                min={filters.startDate}
                max={formatDateInput(new Date())}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold shadow"
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  const resetStart = formatDateInput(getDateNDaysAgo(6));
                  const resetEnd = formatDateInput(new Date());
                  setFilters({
                    startDate: resetStart,
                    endDate: resetEnd
                  });
                  setAppliedFilters({
                    startDate: resetStart,
                    endDate: resetEnd
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
          <p className="text-sm text-gray-500">
            Showing records from{" "}
            <span className="font-semibold text-gray-700">
              {formatDateTime(report.range?.start)}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700">
              {formatDateTime(report.range?.end)}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="border-b border-gray-100 flex flex-wrap gap-2 px-6 pt-4">
            {Object.entries(tableConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-xl font-semibold transition ${
                  activeTab === key
                    ? "bg-orange-50 text-orange-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <config.icon size={16} />
                {config.title}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === key
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {(config.data?.length || 0).toLocaleString("en-IN")}
                </span>
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {activeConfig?.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentData.length.toLocaleString("en-IN")} records in the
                  selected range
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={!currentData.length}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border ${
                  currentData.length
                    ? "border-orange-200 text-orange-600 hover:bg-orange-50"
                    : "border-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {activeConfig?.columns.map((column) => (
                      <th
                        key={column.label}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {currentData.length === 0 && (
                    <tr>
                      <td
                        colSpan={activeConfig?.columns.length || 1}
                        className="px-4 py-10 text-center text-gray-500"
                      >
                        No records found for this selection
                      </td>
                    </tr>
                  )}
                  {currentData.map((item) => (
                    <tr
                      key={
                        item.purchaseId ||
                        item.transactionId ||
                        item.userId ||
                        `${item.purchaserId}-${item.purchaseDate}`
                      }
                      className="hover:bg-orange-50/40"
                    >
                      {activeConfig?.columns.map((column) => (
                        <td
                          key={column.label}
                          className="px-4 py-3 text-sm text-gray-700"
                        >
                          {column.value(item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivationTracker;

