import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Header({ summaryHandler }) {
  const { logout } = useAuth();
  const [profileMenuHandler, setProfileMenuHandler] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileMenuHandler &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuHandler(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileMenuHandler]);

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-surface-container-low backdrop-blur-xl z-40 flex items-center justify-end px-inset-md gap-4 bottom-border border-outline-variant">
      <button
        className="flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all"
        onClick={summaryHandler}
      >
        <span className="material-symbols-outlined text-[20px]">
          auto_awesome
        </span>
        <span className="font-body-sm text-body-sm">AI Summary</span>
      </button>
      <button className="flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">
        <span className="material-symbols-outlined text-[20px]">share</span>
        <span className="font-body-sm text-body-sm">Share</span>
      </button>
      <div className="w-px h-6 bg-outline-variant mx-2"></div>
      <div
        ref={profileMenuRef}
        className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low p-1 rounded-full pr-3"
      >
        <img
          alt="Profile"
          className="w-8 h-8 rounded-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeGhTP32n_PxPiK_PQZ2xhTsh5ShL91_MqPq6l-b1GCb2pUhtuIK59hVT9kAwb6oUqIEzGLIsu8AW_f49uqB2qrnqHHC5beqXwTLm30TVQcB6uxf9bQuz22GD6oU6r8z4paKHcjeGEQmNHR-FnPwCKIhLMJ6ELxSK4UDT8XjTIvD6OGSfo5vwEyM8WWIyqlkJBydgemquxxmeR8qSvKMRtwTylXe8kstnGBpBXzuPeoZivEEFtPaE"
        />
        <button
          className="material-symbols-outlined text-on-surface-variant text-[20px] transition-transform group-hover:rotate-180"
          onClick={() => setProfileMenuHandler(!profileMenuHandler)}
          title="Profile View"
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            expand_more
          </span>
        </button>
        {profileMenuHandler && (
          <div className="absolute top-16 right-4 w-48 bg-surface rounded-lg shadow-lg p-2 z-50">
            <Link to="/profile">
              <button className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-all">
                Profile
              </button>
            </Link>
            <Link to="/settings">
              <button className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-all">
                Settings
              </button>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="w-full text-left px-4 py-2 text-on-surface hover:bg-surface-container-high rounded-lg transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
