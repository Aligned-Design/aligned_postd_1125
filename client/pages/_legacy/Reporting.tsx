// LEGACY PAGE (archived)
// This file is not routed or imported anywhere.
// Canonical implementation lives under client/app/(postd)/...
// Safe to delete after one or two stable releases.

import { AppShell } from "@postd/layout/AppShell";
import { ReportSettingsModal } from "@/components/dashboard/ReportSettingsModal";
import { EmailReportDialog } from "@/components/dashboard/EmailReportDialog";
import { ReportSettings } from "@/types/user";
import { Plus, Mail, Trash2, Edit2, Send, Calendar, Users, Clock } from "lucide-react";
import { useState } from "react";

// Mock saved reports data
const MOCK_REPORTS: ReportSettings[] = [
  {
    id: "report-1",
    accountId: "agency-1",
    brandId: "brand-1",
    name: "Aligned Analytics Report",
    frequency: "weekly",
    dayOfWeek: 1,
    recipients: ["manager@agency.com", "client@brand.com"],
    includeMetrics: ["reach", "engagement", "followers"],
    includePlatforms: ["facebook", "instagram", "linkedin"],
    isActive: true,
    createdDate: "2024-10-15",
    lastSent: "2024-11-07",
  },
  {
    id: "report-2",
    accountId: "agency-1",
    brandId: "brand-2",
    name: "Engagement Insights Report",
    frequency: "weekly",
    dayOfWeek: 3,
    recipients: ["team@agency.com"],
    includeMetrics: ["engagement", "engagement-rate", "google-business"],
    includePlatforms: ["tiktok", "youtube"],
    isActive: true,
    createdDate: "2024-11-01",
    lastSent: "2024-11-07",
  },
  {
    id: "report-3",
    accountId: "agency-1",
    name: "Monthly Campaign Analysis",
    frequency: "monthly",
    monthlyType: "specific-day",
    dayOfMonth: 1,
    recipients: ["director@agency.com", "cmo@client.com"],
    includeMetrics: ["reach", "engagement", "seo-ranking"],
    includePlatforms: ["facebook", "instagram", "linkedin", "tiktok"],
    isActive: true,
    createdDate: "2024-09-20",
    lastSent: "2024-11-01",
  },
  {
    id: "report-4",
    accountId: "agency-1",
    name: "Quarterly Insights",
    frequency: "quarterly",
    quarterlyMonth: 0,
    recipients: ["leadership@agency.com"],
    includeMetrics: ["reach", "engagement", "followers", "google-business", "seo-ranking"],
    includePlatforms: ["facebook", "instagram", "linkedin", "tiktok", "youtube"],
    isActive: true,
    createdDate: "2024-08-10",
    lastSent: "2024-10-01",
  },
  {
    id: "report-5",
    accountId: "agency-1",
    name: "Inactive Report",
    frequency: "weekly",
    dayOfWeek: 5,
    recipients: ["old@email.com"],
    includeMetrics: [],
    includePlatforms: [],
    isActive: false,
    createdDate: "2024-08-10",
  },
];

export default function Reporting() {
  const [reports, setReports] = useState<ReportSettings[]>(MOCK_REPORTS);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportSettings | null>(null);
  const [editingReport, setEditingReport] = useState<Partial<ReportSettings> | null>(null);

  const getFrequencyLabel = (
    freq: string,
    dayOfWeek?: number,
    dayOfMonth?: number,
    monthlyType?: string,
    ordinalDay?: { ordinal: string; dayOfWeek: number },
    quarterlyMonth?: number
  ) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    if (freq === "weekly") {
      return `Weekly on ${days[dayOfWeek || 0]}`;
    }
    if (freq === "monthly") {
      if (monthlyType === "ordinal" && ordinalDay) {
        return `Monthly on ${ordinalDay.ordinal} ${days[ordinalDay.dayOfWeek]}`;
      }
      return `Monthly on day ${dayOfMonth || 1}`;
    }
    if (freq === "quarterly") {
      const quarters = ["Q1 (Jan)", "Q2 (Apr)", "Q3 (Jul)", "Q4 (Oct)"];
      return `Quarterly - ${quarters[quarterlyMonth || 0]}`;
    }
    return freq;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const handleCreateNew = () => {
    setEditingReport({});
    setShowSettingsModal(true);
  };

  const handleEditReport = (report: ReportSettings) => {
    setEditingReport(report);
    setShowSettingsModal(true);
  };

  const handleDeleteReport = (id: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      setReports(reports.filter((r) => r.id !== id));
    }
  };

  const handleSaveReport = (settings: Partial<ReportSettings>) => {
    if (editingReport?.id) {
      // Update existing
      setReports(
        reports.map((r) =>
          r.id === editingReport.id ? { ...r, ...settings, lastUpdated: new Date().toISOString() } : r
        )
      );
    } else {
      // Create new
      // Handle auto-schedule all quarters (-1 means all quarters)
      if (settings.frequency === "quarterly" && settings.quarterlyMonth === -1) {
        // Create 4 reports, one for each quarter
        const quarters = [
          { month: 0, label: "Q1" },
          { month: 3, label: "Q2" },
          { month: 6, label: "Q3" },
          { month: 9, label: "Q4" },
        ];

        const newReports = quarters.map((q, idx) => ({
          id: `report-${Date.now()}-q${idx + 1}`,
          accountId: "agency-1",
          name: `${settings.name || "Quarterly Report"} - ${q.label}`,
          frequency: "quarterly" as const,
          quarterlyMonth: q.month,
          recipients: settings.recipients || [],
          includeMetrics: settings.includeMetrics || [],
          includePlatforms: settings.includePlatforms || [],
          isActive: true,
          createdDate: new Date().toISOString().split("T")[0],
        }));

        setReports([...newReports, ...reports]);
      } else {
        const newReport: ReportSettings = {
          id: `report-${Date.now()}`,
          accountId: "agency-1",
          name: settings.name || "New Report",
          frequency: settings.frequency || "weekly",
          dayOfWeek: settings.dayOfWeek,
          monthlyType: settings.monthlyType,
          dayOfMonth: settings.dayOfMonth,
          ordinalDay: settings.ordinalDay,
          quarterlyMonth: settings.quarterlyMonth,
          recipients: settings.recipients || [],
          includeMetrics: settings.includeMetrics || [],
          includePlatforms: settings.includePlatforms || [],
          isActive: true,
          createdDate: new Date().toISOString().split("T")[0],
        };
        setReports([newReport, ...reports]);
      }
    }
    setShowSettingsModal(false);
    setEditingReport(null);
  };

  const handleSendTestEmail = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (report) {
      setSelectedReport(report);
      setShowEmailDialog(true);
    }
  };

  const handleSendEmail = (emails: string[]) => {
    console.log(`Sending test report to: ${emails.join(", ")}`);
    alert(`Test email sent to ${emails.length} recipient(s)`);
    setShowEmailDialog(false);
  };

  const activeReports = reports.filter((r) => r.isActive);
  const inactiveReports = reports.filter((r) => !r.isActive);

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8">
          {/* Page Header */}
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Reports</h1>
              <p className="text-slate-600 text-xs sm:text-sm font-medium">
                Create and manage automated performance reports for your brands
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-base sm:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
              Create Report
            </button>
          </div>

          {/* Active Reports Section */}
          {activeReports.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Active Reports ({activeReports.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeReports.map((report) => (
                  <div
                    key={report.id}
                    className="group bg-white/50 backdrop-blur-xl rounded-xl border border-white/60 hover:bg-white/70 hover:shadow-md hover:border-white/80 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header accent */}
                    <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500"></div>

                    <div className="p-5 space-y-4">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-slate-900 line-clamp-2">
                          {report.name}
                        </h3>
                        <div className="px-2 py-1 rounded-full bg-green-100 border border-green-300 text-xs font-bold text-green-700 flex-shrink-0">
                          Active
                        </div>
                      </div>

                      {/* Schedule Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Calendar className="w-4 h-4" />
                          {getFrequencyLabel(
                            report.frequency,
                            report.dayOfWeek,
                            report.dayOfMonth,
                            report.monthlyType,
                            report.ordinalDay,
                            report.quarterlyMonth
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Users className="w-4 h-4" />
                          {report.recipients.length} recipient{report.recipients.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Recipients preview */}
                      {report.recipients.length > 0 && (
                        <div className="text-xs text-slate-600 line-clamp-2">
                          <p className="font-bold mb-1">Sends to:</p>
                          <p>{report.recipients.join(", ")}</p>
                        </div>
                      )}

                      {/* Last sent info */}
                      {report.lastSent && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-2 border-t border-slate-200">
                          <Clock className="w-3 h-3" />
                          Last sent: {formatDate(report.lastSent)}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleSendTestEmail(report.id)}
                          className="flex-1 px-3 py-2 rounded-lg bg-blue-100/50 border border-blue-300/50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-all duration-200 flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3 h-3" />
                          Test Email
                        </button>
                        <button
                          onClick={() => handleEditReport(report)}
                          className="flex-1 px-3 py-2 rounded-lg bg-indigo-100/50 border border-indigo-300/50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-all duration-200 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="px-3 py-2 rounded-lg bg-red-100/50 border border-red-300/50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Reports Section */}
          {inactiveReports.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Inactive Reports ({inactiveReports.length})
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inactiveReports.map((report) => (
                  <div
                    key={report.id}
                    className="group bg-white/30 backdrop-blur-xl rounded-xl border border-white/40 hover:bg-white/50 transition-all duration-300 overflow-hidden opacity-70"
                  >
                    {/* Header accent */}
                    <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-500"></div>

                    <div className="p-5 space-y-4">
                      {/* Title */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-slate-700 line-clamp-2">
                          {report.name}
                        </h3>
                        <div className="px-2 py-1 rounded-full bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 flex-shrink-0">
                          Inactive
                        </div>
                      </div>

                      {/* Schedule Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Calendar className="w-4 h-4" />
                          {getFrequencyLabel(
                            report.frequency,
                            report.dayOfWeek,
                            report.dayOfMonth,
                            report.monthlyType,
                            report.ordinalDay,
                            report.quarterlyMonth
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Users className="w-4 h-4" />
                          {report.recipients.length} recipient{report.recipients.length !== 1 ? "s" : ""}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-slate-200">
                        <button
                          onClick={() => handleEditReport(report)}
                          className="flex-1 px-3 py-2 rounded-lg bg-slate-100/50 border border-slate-300/50 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-all duration-200 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="px-3 py-2 rounded-lg bg-red-100/50 border border-red-300/50 text-red-700 font-bold text-xs hover:bg-red-100 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {reports.length === 0 && (
            <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/60">
              <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900 mb-2">No reports yet</h3>
              <p className="text-slate-600 font-medium mb-6">
                Set up your first automated report to send analytics to your team or clients
              </p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                Create Your First Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ReportSettingsModal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setEditingReport(null);
        }}
        onSave={handleSaveReport}
        initialSettings={editingReport}
      />

      <EmailReportDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSend={handleSendEmail}
        defaultRecipients={selectedReport?.recipients}
      />
    </AppShell>
  );
}
