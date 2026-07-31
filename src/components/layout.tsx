import { useState } from "react";

import { radius } from "../theme";
import { NAV_PRIMARY, NAV_SECONDARY } from "../constants";
import { Icon, NavButton, LogoMark } from "./ui";

export const MobileDrawer = ({ currentView, onNavigate, darkMode, onToggleDark, currentUser, onLogout, onClose }) => (
  <>
    <div className="mp-drawer-backdrop" onClick={onClose} />
    <div className="mp-drawer">
      <div className="mp-drawer-handle" />

      {/* Items secondaires */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginBottom: "0.5rem" }}>
        {NAV_SECONDARY.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={(id) => { onNavigate(id); onClose(); }}
          />
        ))}
      </div>

      <hr className="mp-divider" style={{ margin: "0.4rem 0" }} />

      {/* Mode clair/sombre */}
      <button
        type="button"
        onClick={() => { onToggleDark(); onClose(); }}
        className="mp-btn"
        style={{ justifyContent: "flex-start", background: "transparent", color: "var(--ink-soft)", border: "none", width: "100%", marginTop: "0.2rem" }}
      >
        <Icon name={darkMode ? "sun" : "moon"} />
        {darkMode ? "Mode clair" : "Mode sombre"}
      </button>

      {/* Déconnexion */}
      {currentUser && (
        <>
          <hr className="mp-divider" style={{ margin: "0.4rem 0" }} />
          <div style={{ padding: "0.35rem 0.6rem 0.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: "1.5rem", height: "1.5rem", borderRadius: "50%",
              background: "var(--clay-wash)", border: "1px solid var(--clay-soft)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--clay)" }}>
                {currentUser.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="mp-small" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {currentUser.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mp-btn"
            style={{ justifyContent: "flex-start", background: "transparent", color: "var(--berry)", border: "none", width: "100%", marginTop: "0.1rem" }}
            onClick={() => { onLogout(); onClose(); }}
          >
            <Icon name="x" size={14} /> Se déconnecter
          </button>
        </>
      )}
      <p className="mp-micro mp-text-faint" title={__BUILD_TIME__} style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: 0 }}>v{__APP_VERSION__}</p>
    </div>
  </>
);

export const FamilySelector = ({ families, activeFamily, onSetActiveFamily, onNavigate }) => {
  const [open, setOpen] = useState(false);
  const hasMultiple = families.length > 1;
  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => hasMultiple && setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: "0.4rem", width: "100%", background: "var(--sage-wash)", border: "1px solid var(--sage-soft)", borderRadius: radius.sm, padding: "0.35rem 0.6rem", cursor: hasMultiple ? "pointer" : "default", fontFamily: "inherit" }}>
        <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "var(--sage)", flexShrink: 0 }} />
        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--sage)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "left" }}>
          {activeFamily?.name || "Aucune famille"}
        </span>
        {hasMultiple && (
          <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth={2.5} strokeLinecap="round" style={{ flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>
      {open && hasMultiple && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 399 }} onClick={() => setOpen(false)} />
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--paper-raised)", border: "1px solid var(--line)", borderRadius: radius.md, boxShadow: "0 8px 24px rgba(0,0,0,0.14)", zIndex: 400, overflow: "hidden", minWidth: "160px" }}>
            {families.map((f) => {
              const isActive = f.id === activeFamily?.id;
              return (
                <button key={f.id} type="button" onClick={() => { onSetActiveFamily(f.id); setOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "0.55rem", width: "100%", padding: "0.6rem 0.75rem", background: isActive ? "var(--sage-wash)" : "transparent", border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = "var(--paper-sunken)")}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = "transparent")}>
                  <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: isActive ? "var(--sage)" : "var(--line)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: isActive ? 700 : 400, color: isActive ? "var(--sage)" : "var(--ink)", flex: 1 }}>{f.name}</span>
                  {isActive && <Icon name="check" size={13} color="var(--sage)" />}
                </button>
              );
            })}
            <button type="button" onClick={() => { onNavigate("family"); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.55rem 0.75rem", background: "var(--paper-sunken)", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: "0.78rem", color: "var(--clay)", fontWeight: 600 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--clay-wash)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "var(--paper-sunken)"}>
              <Icon name="plus" size={12} /> Gérer les familles
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const Sidebar = ({ currentView, onNavigate, darkMode, onToggleDark, currentUser, onLogout, families = [], activeFamily, onSetActiveFamily }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const secondaryActive = NAV_SECONDARY.some((i) => i.id === currentView);
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="mp-hide-mobile" style={{ width: "210px", flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 0, height: "100vh", overflowY: "auto", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", background: "var(--paper-raised)" }}>
        <div style={{ padding: "1.1rem 1rem 0.85rem", borderBottom: "1px solid var(--line)" }}>
          <div style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: activeFamily ? "0.75rem" : 0 }} onClick={() => onNavigate("calendar")}>
            <LogoMark />
            <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "1rem", color: "var(--sage)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Keskon'm</span>
          </div>
          {activeFamily && <FamilySelector families={families} activeFamily={activeFamily} onSetActiveFamily={onSetActiveFamily} onNavigate={onNavigate} />}
        </div>
        <div style={{ padding: "0.75rem 0.75rem 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            {NAV_PRIMARY.map((item) => <NavButton key={item.id} item={item} active={currentView === item.id} onClick={onNavigate} />)}
          </div>
          <div style={{ marginTop: "1.25rem" }}>
            <p className="mp-micro mp-text-faint" style={{ textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, padding: "0 0.5rem", marginBottom: "0.35rem" }}>Paramètres</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
              {NAV_SECONDARY.map((item) => <NavButton key={item.id} item={item} active={currentView === item.id} onClick={onNavigate} size="sm" />)}
            </div>
          </div>
          <div style={{ flex: 1 }} />
        </div>
        <div style={{ padding: "0.75rem", borderTop: "1px solid var(--line)" }}>
          <button type="button" onClick={onToggleDark} className="mp-btn mp-btn-ghost" style={{ justifyContent: "flex-start", width: "100%", marginBottom: "0.5rem" }}>
            <Icon name={darkMode ? "sun" : "moon"} size={15} /> {darkMode ? "Mode clair" : "Mode sombre"}
          </button>
          {currentUser && (
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "0.6rem" }}>
              <button type="button" onClick={() => onNavigate("account")}
                style={{ display: "flex", alignItems: "center", gap: "0.55rem", width: "100%", background: currentView === "account" ? "var(--clay-wash)" : "transparent", border: "none", borderRadius: radius.sm, padding: "0.45rem 0.5rem", cursor: "pointer", textAlign: "left", transition: "background 100ms" }}>
                <div style={{ width: "1.8rem", height: "1.8rem", borderRadius: "50%", background: "var(--clay-wash)", border: "1.5px solid var(--clay-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--clay)" }}>{currentUser.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p className="mp-small" style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.name}</p>
                  <p className="mp-micro mp-text-faint" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentUser.email}</p>
                </div>
              </button>
              <button type="button" className="mp-btn mp-btn-ghost" style={{ justifyContent: "flex-start", width: "100%", color: "var(--berry)", marginTop: "0.15rem" }} onClick={onLogout}>
                <Icon name="x" size={13} /> Se déconnecter
              </button>
            </div>
          )}
          <p className="mp-micro mp-text-faint" title={__BUILD_TIME__} style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: 0 }}>v{__APP_VERSION__}</p>
        </div>
      </nav>
      {/* Mobile topbar */}
      <header className="mp-hide-desktop" style={{ position: "fixed", top: 0, left: 0, right: 0, height: "52px", background: "var(--paper-raised)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", padding: "0 0.75rem", zIndex: 900, gap: "0.5rem" }}>
        <div onClick={() => onNavigate("calendar")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <LogoMark />
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 700, fontSize: "0.85rem", color: "var(--sage)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Keskon'm</span>
        </div>
        {activeFamily && (
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ maxWidth: "160px", width: "100%" }}>
              <FamilySelector families={families} activeFamily={activeFamily} onSetActiveFamily={onSetActiveFamily} onNavigate={onNavigate} />
            </div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <button type="button" onClick={() => setDrawerOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", display: "flex", padding: "0.2rem" }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          </button>
          {currentUser && (
            <button type="button" onClick={() => onNavigate("account")}
              style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: currentView === "account" ? "var(--clay)" : "var(--clay-wash)", border: "1.5px solid var(--clay-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: currentView === "account" ? "#fff" : "var(--clay)" }}>{currentUser.name?.charAt(0).toUpperCase()}</span>
            </button>
          )}
        </div>
      </header>
      {/* Bottom nav mobile */}
      <nav className="mp-hide-desktop" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--paper-raised)", borderTop: "1px solid var(--line)", display: "flex", zIndex: 900, padding: "0.2rem 0" }}>
        {NAV_PRIMARY.map((item) => {
          const active = currentView === item.id;
          return (
            <button key={item.id} type="button" onClick={() => onNavigate(item.id)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "0.45rem 0.1rem", background: "transparent", border: "none", color: active ? "var(--clay)" : "var(--ink-faint)", cursor: "pointer", transition: "color 100ms" }}>
              <Icon name={item.icon} size={20} />
              <span style={{ fontSize: "0.65rem", fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => setDrawerOpen(true)}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "0.45rem 0.1rem", background: "transparent", border: "none", color: secondaryActive ? "var(--clay)" : "var(--ink-faint)", cursor: "pointer" }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
          <span style={{ fontSize: "0.65rem", fontWeight: secondaryActive ? 600 : 400 }}>Plus</span>
        </button>
      </nav>
      {drawerOpen && <MobileDrawer currentView={currentView} onNavigate={onNavigate} darkMode={darkMode} onToggleDark={onToggleDark} currentUser={currentUser} onLogout={onLogout} onClose={() => setDrawerOpen(false)} />}
    </>
  );
};
