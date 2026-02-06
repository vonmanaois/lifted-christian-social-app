"use client";

import { useState } from "react";
import Modal from "@/components/layout/Modal";
import ProfileSettings from "@/components/profile/ProfileSettings";

type ProfileUpdateModalProps = {
  currentUsername?: string | null;
  currentName?: string | null;
  currentBio?: string | null;
  onUpdated?: () => void;
};

export default function ProfileUpdateModal({
  currentUsername,
  currentName,
  currentBio,
  onUpdated,
}: ProfileUpdateModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="pill-button border border-slate-200 text-[color:var(--ink)] cursor-pointer"
      >
        Update profile
      </button>
      <Modal title="Update profile" isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ProfileSettings
          currentUsername={currentUsername}
          currentName={currentName}
          currentBio={currentBio}
          onUpdated={() => {
            setIsOpen(false);
            onUpdated?.();
          }}
        />
      </Modal>
    </div>
  );
}
