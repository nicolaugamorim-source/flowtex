"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Trash2, Edit2, Mail, Calendar, FileText, Users, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: "active" | "lead" | "inactive";
  notes?: string;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

interface Meeting {
  id: string;
  title: string;
  start: string;
  end: string;
  attendees: number;
}

const AVATAR_COLORS = ["#00D4A4", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#22C55E"];
const STATUS_OPTIONS: Array<"active" | "lead" | "inactive"> = ["active", "lead", "inactive"];

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return { bg: "var(--color-accent-subtle)", text: "var(--color-accent-pressed)" };
    case "lead":
      return { bg: "#FEF3C7", text: "#B45309" };
    case "inactive":
      return { bg: "var(--color-bg-card)", text: "var(--color-text-disabled)" };
    default:
      return { bg: "var(--color-bg-card)", text: "var(--color-text-disabled)" };
  }
};

const ClientSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="p-4 border-l-4 border-transparent rounded-lg animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--color-bg-card)]" />
          <div className="flex-1">
            <div className="h-4 bg-[var(--color-bg-card)] rounded w-32 mb-2" />
            <div className="h-3 bg-[var(--color-bg-elevated)] rounded w-24" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const AddClientModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
}) => {
  const [form, setForm] = useState<{
    name: string;
    company: string;
    email: string;
    phone: string;
    website: string;
    status: "active" | "lead" | "inactive";
    notes: string;
    avatar_color: string;
  }>({
    name: "",
    company: "",
    email: "",
    phone: "",
    website: "",
    status: "active",
    notes: "",
    avatar_color: "#00D4A4",
  });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    onAdd(form);
    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      website: "",
      status: "active",
      notes: "",
      avatar_color: "#00D4A4",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-lg p-6 max-w-md w-full border border-[var(--color-border-default)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Add Client</h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="text"
            placeholder="Company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <input
            type="url"
            placeholder="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)]"
          />

          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] block mb-2">Status</label>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => setForm({ ...form, status })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.status === status
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-text-muted)] block mb-2">Avatar Color</label>
            <div className="flex gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm({ ...form, avatar_color: color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.avatar_color === color
                      ? "border-[var(--color-accent)] scale-110"
                      : "border-[var(--color-border-default)]"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] resize-none h-20"
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-bg-base)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!form.name.trim()}
            className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
          >
            Add Client
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientCard = ({
  client,
  isSelected,
  onClick,
  onDelete,
}: {
  client: Client;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const initials = getInitials(client.name);
  const statusColors = getStatusColor(client.status);

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all mb-2 ${
        isSelected
          ? "border-l-[var(--color-accent)] bg-[var(--color-accent-subtle)]"
          : "border-l-transparent hover:bg-[var(--color-bg-secondary)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ backgroundColor: client.avatar_color }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)] truncate">{client.name}</p>
          {client.company && (
            <p className="text-sm text-[var(--color-text-muted)] truncate">{client.company}</p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
            >
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </span>
          </div>

          <p className="text-xs text-[var(--color-text-disabled)] mt-1">
            Last contact {Math.floor((Date.now() - new Date(client.updated_at).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>

        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(!showDeleteConfirm);
            }}
            className="text-[var(--color-text-disabled)] hover:text-[var(--color-error)] flex-shrink-0"
          >
            <Trash2 size={16} />
          </button>
        )}

        {showDeleteConfirm && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(client.id);
              setShowDeleteConfirm(false);
            }}
            className="text-xs font-medium text-[var(--color-error)] hover:underline"
          >
            Confirm?
          </button>
        )}
      </div>
    </div>
  );
};

const ClientDetailTabs = ({ client }: { client: Client }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [emails, setEmails] = useState<Email[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notes, setNotes] = useState(client.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);

  const saveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
    } catch (err) {
      console.error("Failed to save notes:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const fetchEmails = async () => {
    if (emails.length > 0) return;
    setLoadingEmails(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/emails`);
      const data = await response.json();
      setEmails(data.emails || []);
    } catch (err) {
      console.error("Failed to fetch emails:", err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const fetchMeetings = async () => {
    if (meetings.length > 0) return;
    setLoadingMeetings(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/meetings`);
      const data = await response.json();
      setMeetings(data.meetings || []);
    } catch (err) {
      console.error("Failed to fetch meetings:", err);
    } finally {
      setLoadingMeetings(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "emails", label: "Emails", icon: Mail, onClick: fetchEmails },
    { id: "meetings", label: "Meetings", icon: Calendar, onClick: fetchMeetings },
    { id: "notes", label: "Notes", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-[var(--color-border-default)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              tab.onClick?.();
            }}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Total Emails</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">0</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Upcoming Meetings</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">0</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">
              <p className="text-xs text-[var(--color-text-muted)] mb-1">Days Since Contact</p>
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {Math.floor((Date.now() - new Date(client.updated_at).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "emails" && (
        <div className="space-y-3">
          {loadingEmails ? (
            <ClientSkeleton />
          ) : emails.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-disabled)]">No emails found for this client</p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-secondary)] cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-sm ${email.isUnread ? "font-bold" : ""} text-[var(--color-text-primary)]`}>
                      {email.subject}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">{email.from}</p>
                    <p className="text-xs text-[var(--color-text-disabled)] mt-1 line-clamp-2">{email.snippet}</p>
                  </div>
                  <p className="text-xs text-[var(--color-text-disabled)] whitespace-nowrap ml-2">
                    {new Date(email.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "meetings" && (
        <div className="space-y-3">
          {loadingMeetings ? (
            <ClientSkeleton />
          ) : meetings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-disabled)]">No meetings found for this client</p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-base)]"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)]">{meeting.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {new Date(meeting.start).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Write anything about this client — context, preferences, history..."
            className="w-full h-64 p-4 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
          />
          {isSavingNotes && <p className="text-xs text-[var(--color-text-disabled)] mt-2">Saving...</p>}
        </div>
      )}
    </div>
  );
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "lead" | "inactive">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients");
      const data = await response.json();
      setClients(data.clients || []);
      if (data.clients?.length > 0) {
        setSelectedClient(data.clients[0]);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (formData: any) => {
    setIsAddingClient(true);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.client) {
        setClients([data.client, ...clients]);
        setSelectedClient(data.client);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to add client:", err);
    } finally {
      setIsAddingClient(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setClients(clients.filter((c) => c.id !== id));
      if (selectedClient?.id === id) {
        setSelectedClient(clients.find((c) => c.id !== id) || null);
      }
    } catch (err) {
      console.error("Failed to delete client:", err);
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[var(--color-bg-card)] border-b border-[var(--color-border-default)]">
        <div className="px-8 py-6 space-y-4">
          <div className="flex items-start justify-between gap-8">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Clients</h1>
              <p className="text-sm text-[var(--color-text-muted)]">Your client relationships, in context.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors flex items-center gap-2 flex-shrink-0"
            >
              <Plus size={18} /> Add Client
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 text-[var(--color-text-disabled)]" size={16} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs border border-[var(--color-border-default)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="lead">Lead</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Left Panel: Client List */}
        <div className="w-[35%] border-r border-[var(--color-border-default)] overflow-y-auto bg-[var(--color-bg-base)]">
          <div className="p-4">
            {isLoading ? (
              <ClientSkeleton />
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-[var(--color-text-disabled)] mx-auto mb-3 opacity-50" />
                <p className="text-[var(--color-text-primary)] font-medium">No clients yet</p>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                  Add your first client to start tracking relationships.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Add Client
                </button>
              </div>
            ) : (
              filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  isSelected={selectedClient?.id === client.id}
                  onClick={() => setSelectedClient(client)}
                  onDelete={handleDeleteClient}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Client Detail */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg-base)]">
          {selectedClient ? (
            <div className="p-8">
              <div className="flex items-start gap-6 mb-8 pb-6 border-b border-[var(--color-border-default)]">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl flex-shrink-0"
                  style={{ backgroundColor: selectedClient.avatar_color }}
                >
                  {getInitials(selectedClient.name)}
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{selectedClient.name}</h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-muted)]">
                    {selectedClient.company && <span>{selectedClient.company}</span>}
                    {selectedClient.email && <span>{selectedClient.email}</span>}
                    {selectedClient.phone && <span>{selectedClient.phone}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 text-[var(--color-text-disabled)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteClient(selectedClient.id)}
                    className="p-2 text-[var(--color-text-disabled)] hover:text-[var(--color-error)] hover:bg-[var(--color-bg-card)] rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <ClientDetailTabs client={selectedClient} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users className="w-16 h-16 text-[var(--color-text-disabled)] mb-4 opacity-30" />
              <p className="text-[var(--color-text-primary)] font-medium">Select a client to see their details</p>
            </div>
          )}
        </div>
      </div>

      <AddClientModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddClient} />
    </div>
  );
}
