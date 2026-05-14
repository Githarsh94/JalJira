"use client";

import { useState, useRef } from "react";
import { X, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { apiFetch } from "../lib/api";

interface AssignMembersModalProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addedMembers: number) => void;
}

interface AssignMembersResponse {
  success: boolean;
  message?: string;
  addedMembers: number;
  error?: string;
}

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export default function AssignMembersModal({
  teamId,
  isOpen,
  onClose,
  onSuccess,
}: AssignMembersModalProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      setError(`Invalid email format: ${trimmedEmail}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (emails.includes(trimmedEmail)) {
      setError(`Email already added: ${trimmedEmail}`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setInputValue("");
    setError(null);
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Handle comma-separated emails
    if (value.includes(",")) {
      const emailsToAdd = value.split(",");
      const lastEmail = emailsToAdd[emailsToAdd.length - 1];
      
      // Add all emails except the last one (which might be incomplete)
      for (let i = 0; i < emailsToAdd.length - 1; i++) {
        addEmail(emailsToAdd[i]);
      }
      
      // Keep the last email in the input for user to complete
      setInputValue(lastEmail);
    } else {
      setInputValue(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (emails.length === 0) {
      setError("Please add at least one email address");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch<AssignMembersResponse>(
        `/api/teams/${teamId}/assign-members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ emails }),
        }
      );

      if (response.success) {
        setSuccess(
          `Successfully invited ${response.addedMembers} member(s) to the team!`
        );
        setEmails([]);
        setInputValue("");
        
        setTimeout(() => {
          setSuccess(null);
          onSuccess(response.addedMembers);
          onClose();
        }, 2000);
      } else {
        setError(response.error || "Failed to assign members");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign members");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-lg max-w-md w-full p-6 animate-in fade-in-50 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Assign Members
              </h2>
              <p className="text-sm text-muted-foreground">
                Invite team members by email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-md flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              {success}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Addresses
            </label>
            <input
              ref={inputRef}
              type="email"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter email or paste comma-separated emails..."
              disabled={loading}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or use commas to add multiple emails
            </p>
          </div>

          {/* Email Chips */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Added Emails ({emails.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md border border-border">
                {emails.map((email) => (
                  <div
                    key={email}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-foreground"
                  >
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      disabled={loading}
                      className="text-primary/70 hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || emails.length === 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Invites
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Members will receive an email invitation to join the team
        </p>
      </div>
    </div>
  );
}
