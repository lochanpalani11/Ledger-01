import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus,
  X,
  Flame,
  Target,
  Sun,
  Check,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Bell,
  Smartphone,
  MoreHorizontal,
  Archive,
  Palette,
  Download,
  BarChart3,
  Pencil,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Eye,
  EyeOff,
  Upload,
  AlertCircle,
  GripVertical,
  History,
} from "lucide-react";

/* ---------------------------------------------------------
   THEME TOKENS
--------------------------------------------------------- */
const ACCENT_PRESETS = [
  { name: "Amber", hex: "#D9A356" },
  { name: "Teal", hex: "#5FA8A0" },
  { name: "Coral", hex: "#C56B5C" },
  { name: "Periwinkle", hex: "#8B9EDB" },
  { name: "Sage", hex: "#7FB88A" },
  { name: "Rose", hex: "#D98099" },
  { name: "Sky", hex: "#6FA8DC" },
  { name: "Plain white", hex: "#FFFFFF" },
];

const C = {
  bg: "#0B0D10",
  surface: "#15181C",
  surfaceRaised: "#1C2025",
  border: "#262B31",
  borderSoft: "#1E2227",
  text: "#EDEEF0",
  textDim: "#8B9299",
  textFaint: "#565C63",
  accent: ACCENT_PRESETS[0].hex,
  teal: "#5FA8A0",
  green: "#7FB88A",
  coral: "#C56B5C",
  periwinkle: "#8B9EDB",
};

const HABIT_PALETTE = [C.teal, "#D9A356", C.green, C.coral, C.periwinkle];

const FONT_DISPLAY = "'Aldrich', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function accentTint(alpha) {
  return hexToRgba(C.accent, alpha);
}

/* ---------------------------------------------------------
   DATE / PERIOD HELPERS
--------------------------------------------------------- */
function fmtDate(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}
function dateKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return fmtDate(d);
}
function shiftDateKey(dateStr, offsetDays) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  return fmtDate(dt);
}
function last14Keys() {
  const arr = [];
  for (let i = 13; i >= 0; i--) arr.push(dateKey(-i));
  return arr;
}
function last7Keys() {
  const arr = [];
  for (let i = 6; i >= 0; i--) arr.push(dateKey(-i));
  return arr;
}
function last30Keys() {
  const arr = [];
  for (let i = 29; i >= 0; i--) arr.push(dateKey(-i));
  return arr;
}
function weekdayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return ["S", "M", "T", "W", "T", "F", "S"][dt.getDay()];
}
function calcStreak(completions) {
  let streak = 0;
  let i = 0;
  while (completions[dateKey(-i)]) {
    streak++;
    i++;
  }
  return streak;
}
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
function prettyDate() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
function minutesToHM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function minutesToTimeLabel(totalMins) {
  const h24 = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")}${ampm}`;
}
function reminderOccurrences(r) {
  if (r.mode !== "repeat") return [r.time];
  const start = timeToMinutes(r.startTime);
  const end = timeToMinutes(r.endTime);
  const step = r.intervalHours * 60;
  if (step <= 0 || end < start) return [];
  const out = [];
  for (let t = start; t <= end; t += step) out.push(t);
  return out.map(minutesToTimeLabel);
}
function reminderSummary(r) {
  if (r.mode !== "repeat") return `${r.time} · daily`;
  return `every ${r.intervalHours}h · ${minutesToTimeLabel(timeToMinutes(r.startTime))}–${minutesToTimeLabel(
    timeToMinutes(r.endTime)
  )}`;
}
function weekKeysContaining(dateStr) {
  const [y, m, dd] = dateStr.split("-").map(Number);
  const d = new Date(y, m - 1, dd);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const out = [];
  for (let i = 0; i < 7; i++) {
    out.push(fmtDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}
function countHabitInCurrentWeek(habit) {
  const keys = weekKeysContaining(dateKey(0));
  return keys.filter((k) => habit.completions[k]).length;
}
function currentPeriodKey(period) {
  const d = new Date();
  if (period === "monthly") return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  const q = Math.floor(d.getMonth() / 3) + 1;
  return d.getFullYear() + "-Q" + q;
}
function daysInMonthKeys(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const out = [];
  const lastDay = new Date(y, m, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    out.push(y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"));
  }
  return out;
}
function quarterKeyForMonth(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const q = Math.floor((m - 1) / 3) + 1;
  return y + "-Q" + q;
}

/* ---------------------------------------------------------
   STORAGE HELPERS
--------------------------------------------------------- */
const STORAGE_PREFIX = "ledger:";
async function loadKey(key, fallback) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Ledger storage read failed for", key, e);
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error("Ledger storage write failed for", key, e);
  }
}
async function deleteKey(key) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch (e) {
    console.error("Ledger storage delete failed for", key, e);
  }
}
let idCounter = 1;
function uid() {
  idCounter += 1;
  return Date.now().toString(36) + "-" + idCounter.toString(36);
}

/* ---------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------- */
function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: FONT_MONO,
        fontSize: 11,
        letterSpacing: "0.12em",
        color: C.textFaint,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.borderSoft}`,
        borderRadius: 16,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function IconButton({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        color: C.textFaint,
        cursor: "pointer",
        padding: 6,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        width: 40,
        height: 22,
        borderRadius: 12,
        background: checked ? C.accent : C.borderSoft,
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#0B0D10",
          transition: "left 0.15s",
        }}
      />
    </div>
  );
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            flex: 1,
            padding: "9px 0",
            borderRadius: 8,
            border: `1px solid ${value === o.key ? C.accent : C.border}`,
            background: value === o.key ? accentTint(0.15) : "transparent",
            color: value === o.key ? C.accent : C.textFaint,
            fontFamily: FONT_BODY,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Stepper({ value, onChange, min = 1, max = 99, suffix = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: "transparent",
          color: C.textDim,
          cursor: "pointer",
        }}
      >
        −
      </button>
      <div style={{ fontFamily: FONT_MONO, fontSize: 14, color: C.text, minWidth: 46, textAlign: "center" }}>
        {value}
        {suffix}
      </div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: "transparent",
          color: C.textDim,
          cursor: "pointer",
        }}
      >
        +
      </button>
    </div>
  );
}

function DotGrid({ completions, color, days = 14, size = 9 }) {
  const keys = days === 14 ? last14Keys() : last7Keys();
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {keys.map((k) => {
        const done = !!completions[k];
        return (
          <div
            key={k}
            title={k}
            style={{
              width: size,
              height: size,
              borderRadius: 3,
              background: done ? color : "transparent",
              border: `1px solid ${done ? color : C.border}`,
              opacity: done ? 1 : 0.6,
            }}
          />
        );
      })}
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 70,
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          background: C.surfaceRaised,
          borderTop: `1px solid ${C.border}`,
          borderRadius: "20px 20px 0 0",
          padding: "18px 18px calc(24px + env(safe-area-inset-bottom))",
          maxHeight: "86vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: C.text, letterSpacing: "0.03em" }}>
            {title}
          </div>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

function FullScreenPage({ title, onBack, right, children }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: C.bg,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "calc(18px + env(safe-area-inset-top)) 14px 14px",
          borderBottom: `1px solid ${C.borderSoft}`,
          flexShrink: 0,
        }}
      >
        <IconButton onClick={onBack}>
          <ChevronLeft size={22} color={C.textDim} />
        </IconButton>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.text, flex: 1, letterSpacing: "0.03em" }}>
          {title}
        </div>
        {right}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px calc(40px + env(safe-area-inset-bottom))" }}>
        {children}
      </div>
    </div>
  );
}

function TextField({ value, onChange, placeholder, autoFocus }) {
  return (
    <input
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "12px 14px",
        color: C.text,
        fontFamily: FONT_BODY,
        fontSize: 15,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function TextArea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      style={{
        width: "100%",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "12px 14px",
        color: C.text,
        fontFamily: FONT_BODY,
        fontSize: 14,
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
      }}
    />
  );
}

function TimeField({ value, onChange, type = "time", max }) {
  return (
    <input
      type={type}
      value={value}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: "12px 14px",
        color: C.text,
        fontFamily: FONT_MONO,
        fontSize: 14,
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  );
}

function PrimaryButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? C.borderSoft : C.accent,
        color: disabled ? C.textFaint : "#181206",
        border: "none",
        borderRadius: 10,
        padding: "13px 16px",
        fontFamily: FONT_BODY,
        fontWeight: 600,
        fontSize: 15,
        cursor: disabled ? "not-allowed" : "pointer",
        marginTop: 16,
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: `1px solid ${color || C.border}`,
        color: color || C.textDim,
        borderRadius: 8,
        padding: "7px 12px",
        fontFamily: FONT_BODY,
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: C.textFaint }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: C.textDim, letterSpacing: "0.03em" }}>{title}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, marginTop: 6 }}>{subtitle}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   LOADING SCREEN
--------------------------------------------------------- */
function LoadingScreen() {
  const dotCount = 7;
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Aldrich&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
        @keyframes ledgerDotPulse {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes ledgerScan {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes ledgerGlow {
          0%, 100% { text-shadow: 0 0 8px ${accentTint(0.35)}; }
          50% { text-shadow: 0 0 20px ${accentTint(0.65)}; }
        }
        @keyframes ledgerRingSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ledgerFade {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: `1px solid ${accentTint(0.18)}`,
          borderTopColor: accentTint(0.7),
          animation: "ledgerRingSpin 3.2s linear infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 190,
          height: 190,
          borderRadius: "50%",
          border: `1px solid ${accentTint(0.12)}`,
          borderBottomColor: accentTint(0.5),
          animation: "ledgerRingSpin 2.2s linear infinite reverse",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, zIndex: 1 }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 26,
            color: C.accent,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            paddingLeft: "0.35em",
            animation: "ledgerGlow 2.4s ease-in-out infinite",
          }}
        >
          Ledger
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 2,
                background: C.accent,
                animation: `ledgerDotPulse 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>

        <div
          style={{
            width: 160,
            height: 2,
            background: C.borderSoft,
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "35%",
              height: "100%",
              background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)`,
              animation: "ledgerScan 1.6s ease-in-out infinite",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.textFaint,
            animation: "ledgerFade 1.8s ease-in-out infinite",
          }}
        >
          Loading your data
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   DASHBOARD (customizable widgets)
--------------------------------------------------------- */
const DASHBOARD_WIDGETS = [
  { key: "stats", label: "Quick stats" },
  { key: "moodEnergy", label: "Mood & energy" },
  { key: "weekOverview", label: "Week overview" },
  { key: "habitsChecklist", label: "Today's habits" },
  { key: "goalsProgress", label: "Goals progress" },
  { key: "screenTime", label: "Screen time" },
  { key: "reminders", label: "Upcoming reminders" },
];

function DashboardView({
  habits,
  goals,
  screenTime,
  screenLimit,
  moodLog,
  reminders,
  dashboardConfig,
  toggleHabitToday,
  setMoodToday,
  setEnergyToday,
  openScreen,
}) {
  const today = dateKey(0);
  const activeHabits = habits.filter((h) => !h.archived);
  const activeGoals = goals.filter((g) => !g.archived);
  const dailyHabits = activeHabits.filter((h) => h.frequency !== "weekly");
  const doneCount = dailyHabits.filter((h) => h.completions[today]).length;
  const todayMood = moodLog[today] || {};
  const weekKeys = last7Keys();
  const weekRates = weekKeys.map((k) => {
    if (activeHabits.length === 0) return 0;
    const n = activeHabits.filter((h) => h.completions[k]).length;
    return n / activeHabits.length;
  });

  const order = dashboardConfig.order.filter((k) => !dashboardConfig.hidden.includes(k));

  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = [];
  reminders.forEach((r) => {
    reminderOccurrences(r).forEach((label) => {
      const [hm, ampm] = [label.slice(0, -2), label.slice(-2)];
      let [hh, mm] = hm.split(":").map(Number);
      if (ampm === "PM" && hh !== 12) hh += 12;
      if (ampm === "AM" && hh === 12) hh = 0;
      const mins = hh * 60 + mm;
      if (mins >= nowMins) upcoming.push({ text: r.text, mins, label });
    });
  });
  upcoming.sort((a, b) => a.mins - b.mins);

  function widget(key) {
    if (key === "stats") {
      return (
        <div style={{ display: "flex", gap: 10 }} key={key}>
          <Card style={{ flex: 1, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.accent }}>
              {doneCount}/{dailyHabits.length}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>habits today</div>
          </Card>
          <Card style={{ flex: 1, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.teal }}>{activeGoals.length}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>active goals</div>
          </Card>
          <Card style={{ flex: 1, padding: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.periwinkle }}>
              {todayMood.mood ? todayMood.mood : "—"}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>mood today</div>
          </Card>
        </div>
      );
    }
    if (key === "moodEnergy") {
      return (
        <div key={key}>
          <Eyebrow>Mood & energy</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 6 }}>Mood</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMoodToday(n)}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${n === todayMood.mood ? C.accent : C.border}`,
                    background: n === todayMood.mood ? accentTint(0.15) : "transparent",
                    color: n === todayMood.mood ? C.accent : C.textFaint,
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 6 }}>Energy</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergyToday(n)}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${n === todayMood.energy ? C.teal : C.border}`,
                    background: n === todayMood.energy ? hexToRgba(C.teal, 0.15) : "transparent",
                    color: n === todayMood.energy ? C.teal : C.textFaint,
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </Card>
        </div>
      );
    }
    if (key === "weekOverview") {
      return (
        <div key={key}>
          <Eyebrow>This week</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {weekKeys.map((k, idx) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 46,
                      borderRadius: 6,
                      background: C.borderSoft,
                      display: "flex",
                      flexDirection: "column-reverse",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(weekRates[idx] * 100, weekRates[idx] > 0 ? 10 : 0)}%`,
                        background: k === today ? C.accent : accentTint(0.5),
                      }}
                    />
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint }}>{weekdayLabel(k)}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );
    }
    if (key === "habitsChecklist") {
      return (
        <div key={key}>
          <Eyebrow>Today's habits</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {dailyHabits.length === 0 && (
              <Card>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textFaint }}>
                  No daily habits yet — add one from the Habits tab.
                </div>
              </Card>
            )}
            {dailyHabits.map((h) => {
              const done = !!h.completions[today];
              return (
                <Card
                  key={h.id}
                  onClick={() => toggleHabitToday(h.id)}
                  style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: 14 }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      border: `1.5px solid ${done ? h.color : C.border}`,
                      background: done ? h.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {done && <Check size={13} color="#111" strokeWidth={3} />}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 15,
                      color: done ? C.textDim : C.text,
                      textDecoration: done ? "line-through" : "none",
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.name}
                  </div>
                  {calcStreak(h.completions) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, color: C.textFaint }}>
                      <Flame size={12} />
                      <span style={{ fontFamily: FONT_MONO, fontSize: 12 }}>{calcStreak(h.completions)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      );
    }
    if (key === "goalsProgress") {
      if (activeGoals.length === 0) return null;
      return (
        <div key={key}>
          <Eyebrow>Goals progress</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {activeGoals.map((g) => {
              let pct = 0;
              if (g.type === "recurring") {
                const count = (g.recurring.log && g.recurring.log[currentPeriodKey(g.recurring.period)]) || 0;
                pct = Math.min((count / g.recurring.target) * 100, 100);
              } else {
                const total = g.milestones.length;
                const done = g.milestones.filter((m) => m.done).length;
                pct = total > 0 ? (done / total) * 100 : 0;
              }
              return (
                <Card key={g.id} style={{ padding: 14 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.text, marginBottom: 8 }}>{g.title}</div>
                  <div style={{ height: 5, borderRadius: 4, background: C.borderSoft, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: C.teal }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      );
    }
    if (key === "screenTime") {
      const todayMins = screenTime[today] || 0;
      const over = todayMins > screenLimit;
      return (
        <div key={key}>
          <Eyebrow>Screen time</Eyebrow>
          <Card
            onClick={openScreen}
            style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, color: over ? C.coral : C.text }}>
                {minutesToHM(todayMins)}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>
                today · limit {minutesToHM(screenLimit)}
              </div>
            </div>
            <ChevronRight size={18} color={C.textFaint} />
          </Card>
        </div>
      );
    }
    if (key === "reminders") {
      if (upcoming.length === 0) return null;
      return (
        <div key={key}>
          <Eyebrow>Up next</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {upcoming.slice(0, 3).map((u, i) => (
              <Card
                key={i}
                onClick={openScreen}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, cursor: "pointer" }}
              >
                <Bell size={14} color={C.accent} />
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.text, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.text}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>{u.label}</div>
              </Card>
            ))}
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Eyebrow>{prettyDate()}</Eyebrow>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, color: C.text, marginTop: 4 }}>{greeting()}</div>
      </div>
      {order.map((k) => widget(k))}
    </div>
  );
}

/* ---------------------------------------------------------
   HABITS VIEW
--------------------------------------------------------- */
function HabitsView({ habits, toggleHabitToday, onEdit, onArchive }) {
  const today = dateKey(0);
  const visible = habits.filter((h) => !h.archived);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Eyebrow>{visible.length} active</Eyebrow>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.text, marginTop: 4 }}>Habits</div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Target size={32} />} title="No habits yet" subtitle="Tap + to start tracking something." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((h) => {
            const done = !!h.completions[today];
            const weekly = h.frequency === "weekly";
            const weekCount = weekly ? countHabitInCurrentWeek(h) : 0;
            return (
              <Card key={h.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    onClick={() => toggleHabitToday(h.id)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: `1.5px solid ${done ? h.color : C.border}`,
                      background: done ? h.color : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    {done && <Check size={14} color="#111" strokeWidth={3} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.text, fontWeight: 500 }}>{h.name}</div>
                    {weekly ? (
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 2 }}>
                        {weekCount}/{h.timesPerWeek} this week
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Flame size={11} color={C.textFaint} />
                        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>
                          {calcStreak(h.completions)} day streak
                        </span>
                      </div>
                    )}
                    {h.notes && (
                      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, marginTop: 4, fontStyle: "italic" }}>
                        {h.notes}
                      </div>
                    )}
                  </div>
                  <IconButton onClick={() => onEdit(h)}>
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton onClick={() => onArchive(h.id)}>
                    <Archive size={14} />
                  </IconButton>
                </div>
                <div style={{ marginTop: 12 }}>
                  <DotGrid completions={h.completions} color={h.color} days={14} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   GOALS VIEW
--------------------------------------------------------- */
function GoalsView({ goals, toggleMilestone, addMilestone, onEdit, onArchive, bumpRecurring }) {
  const [milestoneDrafts, setMilestoneDrafts] = useState({});
  const visible = goals.filter((g) => !g.archived);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Eyebrow>{visible.length} in progress</Eyebrow>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.text, marginTop: 4 }}>Goals</div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Target size={32} />} title="No goals yet" subtitle="Tap + to set your first goal." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {visible.map((g) => {
            const isRecurring = g.type === "recurring";
            const total = !isRecurring ? g.milestones.length : 0;
            const done = !isRecurring ? g.milestones.filter((m) => m.done).length : 0;
            const pct = !isRecurring ? (total > 0 ? Math.round((done / total) * 100) : 0) : 0;
            const draft = milestoneDrafts[g.id] || "";
            const periodK = isRecurring ? currentPeriodKey(g.recurring.period) : null;
            const count = isRecurring ? (g.recurring.log && g.recurring.log[periodK]) || 0 : 0;
            const recurPct = isRecurring ? Math.min((count / g.recurring.target) * 100, 100) : 0;

            return (
              <Card key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 17, color: C.text }}>{g.title}</div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <IconButton onClick={() => onEdit(g)}>
                      <Pencil size={14} />
                    </IconButton>
                    <IconButton onClick={() => onArchive(g.id)}>
                      <Archive size={14} />
                    </IconButton>
                  </div>
                </div>

                {g.notes && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, marginTop: 4, fontStyle: "italic" }}>
                    {g.notes}
                  </div>
                )}

                {isRecurring ? (
                  <>
                    <div style={{ height: 6, borderRadius: 4, background: C.borderSoft, marginTop: 12, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${recurPct}%`, background: C.teal }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>
                        {count}/{g.recurring.target} this {g.recurring.period === "monthly" ? "month" : "quarter"}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => bumpRecurring(g.id, -1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: `1px solid ${C.border}`,
                            background: "transparent",
                            color: C.textDim,
                            cursor: "pointer",
                          }}
                        >
                          −
                        </button>
                        <button
                          onClick={() => bumpRecurring(g.id, 1)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: `1px solid ${C.accent}`,
                            background: accentTint(0.15),
                            color: C.accent,
                            cursor: "pointer",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ height: 6, borderRadius: 4, background: C.borderSoft, marginTop: 12, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: C.teal, transition: "width 0.3s ease" }} />
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 6 }}>
                      {total > 0 ? `${done}/${total} milestones · ${pct}%` : "no milestones yet"}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                      {g.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => toggleMilestone(g.id, m.id)}
                          style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              border: `1.5px solid ${m.done ? C.teal : C.border}`,
                              background: m.done ? C.teal : "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {m.done && <Check size={10} color="#111" strokeWidth={3} />}
                          </div>
                          <div
                            style={{
                              fontFamily: FONT_BODY,
                              fontSize: 13,
                              color: m.done ? C.textFaint : C.textDim,
                              textDecoration: m.done ? "line-through" : "none",
                            }}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                      <input
                        value={draft}
                        onChange={(e) => setMilestoneDrafts((prev) => ({ ...prev, [g.id]: e.target.value }))}
                        placeholder="Add milestone"
                        style={{
                          flex: 1,
                          background: C.surfaceRaised,
                          border: `1px solid ${C.border}`,
                          borderRadius: 8,
                          padding: "8px 10px",
                          color: C.text,
                          fontFamily: FONT_BODY,
                          fontSize: 13,
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        onClick={() => {
                          if (draft.trim()) {
                            addMilestone(g.id, draft.trim());
                            setMilestoneDrafts((prev) => ({ ...prev, [g.id]: "" }));
                          }
                        }}
                        style={{
                          background: C.borderSoft,
                          border: "none",
                          borderRadius: 8,
                          padding: "0 12px",
                          color: C.textDim,
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   MORE - menu list
--------------------------------------------------------- */
function MoreList({ onOpen, reminderCount, screenToday, screenLimit, archivedCount, accentName, backupCount }) {
  const items = [
    { key: "reminders", icon: Bell, label: "Reminders", subtitle: reminderCount > 0 ? `${reminderCount} active` : "Nothing set" },
    { key: "pastDay", icon: History, label: "Edit past day", subtitle: "Fill in a day you missed" },
    { key: "screen", icon: Smartphone, label: "Screen time", subtitle: `${minutesToHM(screenToday)} today · limit ${minutesToHM(screenLimit)}` },
    { key: "review", icon: BarChart3, label: "Review stats", subtitle: "Trends, plus any past month" },
    { key: "dashboard", icon: LayoutGrid, label: "Customize dashboard", subtitle: "Reorder & show/hide widgets" },
    { key: "theme", icon: Palette, label: "Theme", subtitle: accentName },
    { key: "archived", icon: Archive, label: "Archived", subtitle: `${archivedCount} item${archivedCount === 1 ? "" : "s"}` },
    { key: "backup", icon: Download, label: "Backup", subtitle: backupCount > 0 ? `${backupCount} saved` : "Save a snapshot now" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <Eyebrow>Extras</Eyebrow>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: C.text, marginTop: 4 }}>More</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Card key={it.key} onClick={() => onOpen(it.key)} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer", padding: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: C.surfaceRaised, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={17} color={C.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.text, fontWeight: 500 }}>{it.label}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 2 }}>{it.subtitle}</div>
              </div>
              <ChevronRight size={18} color={C.textFaint} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   REMINDERS - full-screen page
--------------------------------------------------------- */
function RemindersPage({ onBack, reminders, addReminder, deleteReminder }) {
  const [formOpen, setFormOpen] = useState(reminders.length === 0);
  const [text, setText] = useState("");
  const [repeat, setRepeat] = useState(false);
  const [time, setTime] = useState("09:00");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("21:00");
  const [interval, setIntervalHours] = useState(2);

  function reset() {
    setText("");
    setRepeat(false);
    setTime("09:00");
    setStart("09:00");
    setEnd("21:00");
    setIntervalHours(2);
  }
  function submit() {
    if (!text.trim()) return;
    if (repeat) addReminder({ text: text.trim(), mode: "repeat", startTime: start, endTime: end, intervalHours: interval });
    else addReminder({ text: text.trim(), mode: "once", time });
    reset();
    setFormOpen(false);
  }

  return (
    <FullScreenPage
      title="Reminders"
      onBack={onBack}
      right={
        <IconButton onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? <X size={20} color={C.textDim} /> : <Plus size={20} color={C.accent} />}
        </IconButton>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {formOpen && (
          <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <TextField value={text} onChange={setText} placeholder="e.g. Drink water" autoFocus />
            <div onClick={() => setRepeat((v) => !v)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 2px", cursor: "pointer" }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>Repeat through the day</div>
              <ToggleSwitch checked={repeat} onChange={setRepeat} />
            </div>
            {!repeat && <TimeField value={time} onChange={setTime} />}
            {repeat && (
              <>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginBottom: 5 }}>FROM</div>
                    <TimeField value={start} onChange={setStart} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginBottom: 5 }}>TO</div>
                    <TimeField value={end} onChange={setEnd} />
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginBottom: 5 }}>EVERY</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 6].map((h) => (
                      <button
                        key={h}
                        onClick={() => setIntervalHours(h)}
                        style={{
                          flex: 1,
                          padding: "9px 0",
                          borderRadius: 8,
                          border: `1px solid ${interval === h ? C.accent : C.border}`,
                          background: interval === h ? accentTint(0.15) : "transparent",
                          color: interval === h ? C.accent : C.textFaint,
                          fontFamily: FONT_MONO,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <PrimaryButton onClick={submit} disabled={!text.trim()}>Add reminder</PrimaryButton>
          </Card>
        )}

        {reminders.length === 0 ? (
          !formOpen && <EmptyState icon={<Bell size={32} />} title="No reminders yet" subtitle="Tap + to add one." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.map((r) => (
              <Card key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: C.surfaceRaised, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bell size={15} color={C.accent} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.text }}>{r.text}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 2 }}>{reminderSummary(r)}</div>
                </div>
                <IconButton onClick={() => deleteReminder(r.id)}>
                  <Trash2 size={15} />
                </IconButton>
              </Card>
            ))}
          </div>
        )}

        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>
          These are kept here for reference. Ask Claude in chat to set the matching phone alarm so you actually get notified when the app is closed.
        </div>
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   SCREEN TIME - full-screen page
--------------------------------------------------------- */
function ScreenTimePage({ onBack, screenTime, screenLimit, setScreenLimit, addScreenMinutes, setScreenMinutesToday }) {
  const [manualDraft, setManualDraft] = useState("");
  const today = dateKey(0);
  const todayMins = screenTime[today] || 0;
  const overLimit = todayMins > screenLimit;
  const weekKeys = last7Keys();
  const maxWeekVal = Math.max(screenLimit, ...weekKeys.map((k) => screenTime[k] || 0), 1);

  return (
    <FullScreenPage title="Screen time" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 28, color: overLimit ? C.coral : C.text }}>{minutesToHM(todayMins)}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>today · limit {minutesToHM(screenLimit)}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => addScreenMinutes(15)} style={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, fontFamily: FONT_MONO, fontSize: 12, padding: "6px 10px", cursor: "pointer" }}>+15m</button>
              <button onClick={() => addScreenMinutes(30)} style={{ background: C.surfaceRaised, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textDim, fontFamily: FONT_MONO, fontSize: 12, padding: "6px 10px", cursor: "pointer" }}>+30m</button>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {weekKeys.map((k) => {
                const v = screenTime[k] || 0;
                const isToday = k === today;
                const over = v > screenLimit;
                return (
                  <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 22, height: 46, borderRadius: 6, background: C.borderSoft, display: "flex", flexDirection: "column-reverse", overflow: "hidden" }}>
                      <div style={{ width: "100%", height: `${Math.min((v / maxWeekVal) * 100, 100)}%`, background: over ? C.coral : isToday ? C.teal : accentTint(0.5) }} />
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint }}>{weekdayLabel(k)}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, flex: 1 }}>Daily limit</div>
            <button onClick={() => setScreenLimit(Math.max(15, screenLimit - 15))} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, cursor: "pointer" }}>−</button>
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.text, minWidth: 56, textAlign: "center" }}>{minutesToHM(screenLimit)}</div>
            <button onClick={() => setScreenLimit(screenLimit + 15)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, cursor: "pointer" }}>+</button>
          </div>
        </Card>

        <div>
          <Eyebrow>Set exact minutes for today</Eyebrow>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <TextField value={manualDraft} onChange={(v) => setManualDraft(v.replace(/[^0-9]/g, ""))} placeholder="e.g. 145" />
            <button
              onClick={() => {
                if (manualDraft.trim()) {
                  setScreenMinutesToday(Math.max(0, parseInt(manualDraft, 10) || 0));
                  setManualDraft("");
                }
              }}
              style={{ background: C.accent, border: "none", borderRadius: 10, padding: "0 18px", color: "#181206", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   REVIEW - weekly / monthly insights
--------------------------------------------------------- */
function ReviewPage({ onBack, habits, goals, screenTime, screenLimit, moodLog }) {
  const [period, setPeriod] = useState("week");
  const [selectedYM, setSelectedYM] = useState(null);

  const monthSet = new Set();
  habits.forEach((h) => Object.keys(h.completions || {}).forEach((k) => monthSet.add(k.slice(0, 7))));
  Object.keys(screenTime).forEach((k) => monthSet.add(k.slice(0, 7)));
  Object.keys(moodLog).forEach((k) => monthSet.add(k.slice(0, 7)));
  const availableMonths = [...monthSet].sort().reverse();
  const availableYears = [...new Set(availableMonths.map((m) => m.slice(0, 4)))];
  const effectiveYM = selectedYM || availableMonths[0] || null;
  const selectedYear = effectiveYM ? effectiveYM.slice(0, 4) : null;
  const monthsForYear = availableMonths.filter((m) => m.startsWith(selectedYear));

  const keys = period === "week" ? last7Keys() : period === "month" ? last30Keys() : effectiveYM ? daysInMonthKeys(effectiveYM) : [];
  const activeHabits = habits.filter((h) => !h.archived);
  const activeGoals = goals.filter((g) => !g.archived);

  let totalSlots = 0;
  let totalDone = 0;
  keys.forEach((k) => {
    activeHabits.forEach((h) => {
      totalSlots += 1;
      if (h.completions[k]) totalDone += 1;
    });
  });
  const habitPct = totalSlots > 0 ? Math.round((totalDone / totalSlots) * 100) : 0;

  const onceGoals = activeGoals.filter((g) => g.type !== "recurring");
  const completedOnce = onceGoals.filter((g) => g.milestones.length > 0 && g.milestones.every((m) => m.done)).length;
  const avgOnceProgress =
    onceGoals.length > 0
      ? Math.round(
          onceGoals.reduce((sum, g) => {
            const t = g.milestones.length;
            const d = g.milestones.filter((m) => m.done).length;
            return sum + (t > 0 ? d / t : 0);
          }, 0) / onceGoals.length * 100
        )
      : 0;
  const recurringGoals = activeGoals.filter((g) => g.type === "recurring");

  const screenVals = keys.map((k) => screenTime[k] || 0).filter((v) => v > 0);
  const screenAvg = screenVals.length > 0 ? Math.round(screenVals.reduce((a, b) => a + b, 0) / screenVals.length) : 0;
  const overDays = keys.filter((k) => (screenTime[k] || 0) > screenLimit).length;

  const moodDays = keys.filter((k) => moodLog[k] && moodLog[k].mood);
  const moodAvg = moodDays.length > 0 ? (moodDays.reduce((s, k) => s + moodLog[k].mood, 0) / moodDays.length).toFixed(1) : null;

  const habitDayMoods = [];
  const restDayMoods = [];
  keys.forEach((k) => {
    if (!moodLog[k] || !moodLog[k].mood) return;
    const anyHabitDone = activeHabits.some((h) => h.completions[k]);
    if (anyHabitDone) habitDayMoods.push(moodLog[k].mood);
    else restDayMoods.push(moodLog[k].mood);
  });
  let correlationText = "Log a few more mood check-ins alongside your habits to see this insight.";
  if (habitDayMoods.length >= 2 && restDayMoods.length >= 2) {
    const avgHabit = (habitDayMoods.reduce((a, b) => a + b, 0) / habitDayMoods.length).toFixed(1);
    const avgRest = (restDayMoods.reduce((a, b) => a + b, 0) / restDayMoods.length).toFixed(1);
    correlationText = `Your mood averages ${avgHabit} on days you complete at least one habit, versus ${avgRest} on days you don't.`;
  }

  return (
    <FullScreenPage title="Review" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <SegmentedControl
          options={[
            { key: "week", label: "Past week" },
            { key: "month", label: "Past month" },
            { key: "custom", label: "Choose month" },
          ]}
          value={period}
          onChange={setPeriod}
        />

        {period === "custom" && (
          availableMonths.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textFaint }}>
              No dated data yet — start logging habits, screen time, or mood to build up history here.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <select
                value={selectedYear}
                onChange={(e) => {
                  const firstMonthInYear = availableMonths.find((m) => m.startsWith(e.target.value));
                  setSelectedYM(firstMonthInYear);
                }}
                style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontFamily: FONT_MONO, fontSize: 14 }}
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={effectiveYM}
                onChange={(e) => setSelectedYM(e.target.value)}
                style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontFamily: FONT_MONO, fontSize: 14 }}
              >
                {monthsForYear.map((m) => (
                  <option key={m} value={m}>
                    {new Date(m + "-01").toLocaleDateString(undefined, { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          )
        )}

        <div>
          <Eyebrow>Habits</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 26, color: C.accent }}>{habitPct}%</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>
              overall completion across {activeHabits.length} habit{activeHabits.length === 1 ? "" : "s"}
            </div>
          </Card>
        </div>

        <div>
          <Eyebrow>Goals</Eyebrow>
          <Card style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>
              <span style={{ fontFamily: FONT_MONO, color: C.text }}>{completedOnce}/{onceGoals.length}</span> one-time goals completed
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>
              average progress: <span style={{ fontFamily: FONT_MONO, color: C.text }}>{avgOnceProgress}%</span>
            </div>
            {recurringGoals.map((g) => {
              const pk =
                period === "custom" && effectiveYM
                  ? g.recurring.period === "monthly"
                    ? effectiveYM
                    : quarterKeyForMonth(effectiveYM)
                  : currentPeriodKey(g.recurring.period);
              const count = (g.recurring.log && g.recurring.log[pk]) || 0;
              return (
                <div key={g.id} style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>
                  {g.title}: <span style={{ fontFamily: FONT_MONO, color: C.text }}>{count}/{g.recurring.target}</span> that {g.recurring.period === "monthly" ? "month" : "quarter"}
                </div>
              );
            })}
          </Card>
        </div>

        <div>
          <Eyebrow>Screen time</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.text }}>{minutesToHM(screenAvg)}/day avg</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>
              over limit on {overDays} of {keys.length} days
            </div>
          </Card>
        </div>

        <div>
          <Eyebrow>Mood</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: C.periwinkle }}>{moodAvg || "—"}</div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginTop: 2 }}>average mood ({moodDays.length} check-ins)</div>
          </Card>
        </div>

        <div>
          <Eyebrow>Correlation</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim, lineHeight: 1.5 }}>{correlationText}</div>
          </Card>
        </div>
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   EDIT PAST DAY
--------------------------------------------------------- */
function buildDayDraft(dateStr, habits, screenTime, moodLog) {
  const dm = moodLog[dateStr] || {};
  return {
    habits: Object.fromEntries(habits.map((h) => [h.id, !!h.completions[dateStr]])),
    screenMinutes: String(screenTime[dateStr] || ""),
    mood: dm.mood,
    energy: dm.energy,
  };
}

function EditPastDayPage({ onBack, habits, moodLog, screenTime, persistHabits, persistScreenTime, persistMoodLog }) {
  const [selectedDate, setSelectedDate] = useState(dateKey(-1));
  const [drafts, setDrafts] = useState({});
  const [saved, setSaved] = useState(false);

  const today = dateKey(0);
  const activeHabits = habits.filter((h) => !h.archived);
  const isToday = selectedDate === today;

  const draft = drafts[selectedDate] || buildDayDraft(selectedDate, activeHabits, screenTime, moodLog);

  function updateDraft(patch) {
    setSaved(false);
    setDrafts((prev) => ({
      ...prev,
      [selectedDate]: { ...draft, ...patch },
    }));
  }

  function toggleDraftHabit(habitId) {
    updateDraft({ habits: { ...draft.habits, [habitId]: !draft.habits[habitId] } });
  }

  const hasUnsavedChanges = Object.keys(drafts).length > 0;

  function handleSave(closeAfter) {
    const dates = Object.keys(drafts);
    if (dates.length === 0) {
      if (closeAfter) onBack();
      return;
    }

    const nextHabits = habits.map((h) => {
      let touched = false;
      const completions = { ...h.completions };
      dates.forEach((dateStr) => {
        const d = drafts[dateStr];
        if (d.habits && Object.prototype.hasOwnProperty.call(d.habits, h.id)) {
          touched = true;
          if (d.habits[h.id]) completions[dateStr] = true;
          else delete completions[dateStr];
        }
      });
      return touched ? { ...h, completions } : h;
    });

    const nextScreenTime = { ...screenTime };
    dates.forEach((dateStr) => {
      const d = drafts[dateStr];
      if (d.screenMinutes !== undefined && String(d.screenMinutes).trim() !== "") {
        nextScreenTime[dateStr] = Math.max(0, parseInt(d.screenMinutes, 10) || 0);
      }
    });

    const nextMoodLog = { ...moodLog };
    dates.forEach((dateStr) => {
      const d = drafts[dateStr];
      if (d.mood !== undefined || d.energy !== undefined) {
        nextMoodLog[dateStr] = {
          ...(nextMoodLog[dateStr] || {}),
          ...(d.mood !== undefined ? { mood: d.mood } : {}),
          ...(d.energy !== undefined ? { energy: d.energy } : {}),
        };
      }
    });

    persistHabits(nextHabits);
    persistScreenTime(nextScreenTime);
    persistMoodLog(nextMoodLog);

    if (closeAfter) {
      onBack();
    } else {
      setDrafts({});
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  }

  const [y, m, d] = selectedDate.split("-").map(Number);
  const friendlyDate = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <FullScreenPage
      title="Edit past day"
      onBack={onBack}
      right={
        <SecondaryButton onClick={() => handleSave(false)} color={hasUnsavedChanges ? C.accent : saved ? C.teal : undefined}>
          <Check size={13} /> {saved ? "Saved" : "Save"}
        </SecondaryButton>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>
          Fill in or correct any day. Nothing is saved until you tap "Save" — you can switch between dates freely
          first and your changes for each one will be kept.
        </div>

        <div>
          <Eyebrow>Date</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <IconButton
              onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}
            >
              <ChevronLeft size={18} />
            </IconButton>
            <div style={{ flex: 1 }}>
              <TimeField type="date" value={selectedDate} max={today} onChange={setSelectedDate} />
            </div>
            <IconButton
              onClick={() => !isToday && setSelectedDate(shiftDateKey(selectedDate, 1))}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, opacity: isToday ? 0.35 : 1 }}
            >
              <ChevronRight size={18} />
            </IconButton>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>{friendlyDate}</div>
            {drafts[selectedDate] && (
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Unsaved
              </div>
            )}
          </div>
        </div>

        <div>
          <Eyebrow>Habits</Eyebrow>
          {activeHabits.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textFaint, marginTop: 8 }}>No habits yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {activeHabits.map((h) => {
                const done = !!draft.habits[h.id];
                return (
                  <Card
                    key={h.id}
                    onClick={() => toggleDraftHabit(h.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: 14 }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: `1.5px solid ${done ? h.color : C.border}`,
                        background: done ? h.color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {done && <Check size={13} color="#111" strokeWidth={3} />}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT_BODY,
                        fontSize: 15,
                        color: done ? C.textDim : C.text,
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.name}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <Eyebrow>Screen time</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <TextField
              value={draft.screenMinutes}
              onChange={(v) => updateDraft({ screenMinutes: v.replace(/[^0-9]/g, "") })}
              placeholder="Minutes, e.g. 145"
            />
          </Card>
        </div>

        <div>
          <Eyebrow>Mood & energy</Eyebrow>
          <Card style={{ marginTop: 8 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 6 }}>Mood</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => updateDraft({ mood: n })}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${n === draft.mood ? C.accent : C.border}`,
                    background: n === draft.mood ? accentTint(0.15) : "transparent",
                    color: n === draft.mood ? C.accent : C.textFaint,
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textDim, marginBottom: 6 }}>Energy</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => updateDraft({ energy: n })}
                  style={{
                    flex: 1,
                    height: 34,
                    borderRadius: 8,
                    border: `1px solid ${n === draft.energy ? C.teal : C.border}`,
                    background: n === draft.energy ? hexToRgba(C.teal, 0.15) : "transparent",
                    color: n === draft.energy ? C.teal : C.textFaint,
                    fontFamily: FONT_MONO,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <PrimaryButton onClick={() => handleSave(true)}>Save & close</PrimaryButton>
      </div>
    </FullScreenPage>
  );
}


/* ---------------------------------------------------------
   ARCHIVED
--------------------------------------------------------- */
function ArchivedPage({ onBack, habits, goals, restoreHabit, deleteHabitForever, restoreGoal, deleteGoalForever }) {
  const archivedHabits = habits.filter((h) => h.archived);
  const archivedGoals = goals.filter((g) => g.archived);

  return (
    <FullScreenPage title="Archived" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <Eyebrow>Habits ({archivedHabits.length})</Eyebrow>
          {archivedHabits.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textFaint, marginTop: 8 }}>Nothing archived.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {archivedHabits.map((h) => (
                <Card key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 14 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textDim, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                  <SecondaryButton onClick={() => restoreHabit(h.id)}>
                    <RotateCcw size={12} /> Restore
                  </SecondaryButton>
                  <IconButton onClick={() => deleteHabitForever(h.id)}>
                    <Trash2 size={14} color={C.coral} />
                  </IconButton>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <Eyebrow>Goals ({archivedGoals.length})</Eyebrow>
          {archivedGoals.length === 0 ? (
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textFaint, marginTop: 8 }}>Nothing archived.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {archivedGoals.map((g) => (
                <Card key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 14 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.textDim, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
                  <SecondaryButton onClick={() => restoreGoal(g.id)}>
                    <RotateCcw size={12} /> Restore
                  </SecondaryButton>
                  <IconButton onClick={() => deleteGoalForever(g.id)}>
                    <Trash2 size={14} color={C.coral} />
                  </IconButton>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   CUSTOMIZE DASHBOARD
--------------------------------------------------------- */
function CustomizeDashboardPage({ onBack, config, setConfig }) {
  const [order, setOrder] = useState(config.order);
  const [draggingKey, setDraggingKey] = useState(null);
  const containerRef = useRef(null);
  const dragInfo = useRef(null);

  useEffect(() => {
    setOrder(config.order);
  }, [config.order]);

  function toggleVisible(key) {
    const hidden = config.hidden.includes(key) ? config.hidden.filter((k) => k !== key) : [...config.hidden, key];
    setConfig({ ...config, hidden });
  }

  function onGripPointerDown(e, key) {
    e.preventDefault();
    dragInfo.current = { key };
    setDraggingKey(key);
    if (e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore if capture isn't supported
      }
    }
  }

  function onGripPointerMove(e) {
    if (!dragInfo.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const rowHeight = rect.height / order.length;
    let targetIndex = Math.floor(relativeY / rowHeight);
    targetIndex = Math.max(0, Math.min(order.length - 1, targetIndex));
    const currentIndex = order.indexOf(dragInfo.current.key);
    if (targetIndex !== currentIndex) {
      const next = [...order];
      next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, dragInfo.current.key);
      setOrder(next);
    }
  }

  function onGripPointerUp() {
    if (!dragInfo.current) return;
    dragInfo.current = null;
    setDraggingKey(null);
    setConfig({ ...config, order });
  }

  return (
    <FullScreenPage title="Customize dashboard" onBack={onBack}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, marginBottom: 16, lineHeight: 1.5 }}>
        Drag a widget by its handle to reorder it, or hide it with the switch.
      </div>
      <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {order.map((key) => {
          const widget = DASHBOARD_WIDGETS.find((w) => w.key === key);
          const visible = !config.hidden.includes(key);
          const isDragging = draggingKey === key;
          return (
            <Card
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                opacity: isDragging ? 0.6 : 1,
                border: `1px solid ${isDragging ? C.accent : C.borderSoft}`,
              }}
            >
              <div
                onPointerDown={(e) => onGripPointerDown(e, key)}
                onPointerMove={onGripPointerMove}
                onPointerUp={onGripPointerUp}
                onPointerCancel={onGripPointerUp}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isDragging ? C.accent : C.textFaint,
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                  padding: "4px 2px",
                  flexShrink: 0,
                }}
              >
                <GripVertical size={16} />
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: visible ? C.text : C.textFaint, flex: 1 }}>
                {widget ? widget.label : key}
              </div>
              {visible ? <Eye size={15} color={C.textFaint} /> : <EyeOff size={15} color={C.textFaint} />}
              <ToggleSwitch checked={visible} onChange={() => toggleVisible(key)} />
            </Card>
          );
        })}
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   BACKUP
--------------------------------------------------------- */
function BackupPage({ onBack, backupIndex, createBackup, deleteBackup, retrieveBackup }) {
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  async function handleBackupNow() {
    setBusy(true);
    await createBackup();
    setBusy(false);
  }

  async function handleCopy(id) {
    const data = await retrieveBackup(id);
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      // clipboard unavailable
    }
  }

  async function handleDownload(id, createdAt) {
    const data = await retrieveBackup(id);
    if (!data) return;
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date(createdAt);
      a.href = url;
      a.download = `ledger-backup-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // download blocked in this environment
    }
  }

  const sorted = [...backupIndex].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <FullScreenPage title="Backup" onBack={onBack}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>
          A backup saves a full snapshot inside the app's own storage, organized by when it was taken — the closest
          thing to a real folder a browser-based app can offer. "Review stats" doesn't need these to work; they're
          purely a safety copy you can also copy or download as a real file.
        </div>

        <PrimaryButton onClick={handleBackupNow} disabled={busy}>
          {busy ? "Backing up…" : "Back up now"}
        </PrimaryButton>

        {sorted.length === 0 ? (
          <EmptyState icon={<Download size={32} />} title="No backups yet" subtitle="Tap the button above to create your first one." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((b) => {
              const d = new Date(b.createdAt);
              return (
                <Card key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: C.text }}>
                      {d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint, marginTop: 2 }}>
                      {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <SecondaryButton onClick={() => handleCopy(b.id)}>{copiedId === b.id ? "Copied ✓" : "Copy"}</SecondaryButton>
                  <IconButton onClick={() => handleDownload(b.id, b.createdAt)}>
                    <Download size={15} />
                  </IconButton>
                  <IconButton onClick={() => deleteBackup(b.id)}>
                    <Trash2 size={15} color={C.coral} />
                  </IconButton>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   THEME
--------------------------------------------------------- */
function ThemePage({ onBack, accentColor, setAccentColor }) {
  return (
    <FullScreenPage title="Theme" onBack={onBack}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textFaint, marginBottom: 16, lineHeight: 1.5 }}>
        Pick an accent color for buttons, highlights, and progress bars across the app.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ACCENT_PRESETS.map((p) => {
          const active = p.hex === accentColor;
          return (
            <Card
              key={p.hex}
              onClick={() => setAccentColor(p.hex)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                padding: 14,
                border: `1px solid ${active ? p.hex : C.borderSoft}`,
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: p.hex, flexShrink: 0 }} />
              <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: C.text, flex: 1 }}>{p.name}</div>
              {active && <Check size={18} color={p.hex} />}
            </Card>
          );
        })}
      </div>
    </FullScreenPage>
  );
}

/* ---------------------------------------------------------
   MAIN APP
--------------------------------------------------------- */
const TABS = [
  { key: "today", label: "Dashboard", icon: Sun },
  { key: "habits", label: "Habits", icon: Flame },
  { key: "goals", label: "Goals", icon: Target },
  { key: "more", label: "More", icon: MoreHorizontal },
];

const DEFAULT_DASHBOARD_CONFIG = {
  order: DASHBOARD_WIDGETS.map((w) => w.key),
  hidden: [],
};

export default function App() {
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(true);
  const [themeTick, setThemeTick] = useState(0);

  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [screenTime, setScreenTime] = useState({});
  const [screenLimit, setScreenLimitState] = useState(120);
  const [moodLog, setMoodLog] = useState({});
  const [dashboardConfig, setDashboardConfigState] = useState(DEFAULT_DASHBOARD_CONFIG);
  const [backupIndex, setBackupIndex] = useState([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [moreScreen, setMoreScreen] = useState(null);

  const [editingHabitId, setEditingHabitId] = useState(null);
  const [habitNameDraft, setHabitNameDraft] = useState("");
  const [habitNotesDraft, setHabitNotesDraft] = useState("");
  const [habitFreqDraft, setHabitFreqDraft] = useState("daily");
  const [habitTimesPerWeekDraft, setHabitTimesPerWeekDraft] = useState(3);

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalTitleDraft, setGoalTitleDraft] = useState("");
  const [goalNotesDraft, setGoalNotesDraft] = useState("");
  const [goalTypeDraft, setGoalTypeDraft] = useState("once");
  const [goalPeriodDraft, setGoalPeriodDraft] = useState("monthly");
  const [goalTargetDraft, setGoalTargetDraft] = useState(1);

  useEffect(() => {
    (async () => {
      const startedAt = Date.now();
      const MIN_LOADING_MS = 5000;
      const [h, g, r, st, sl, ml, dc, ac, bi] = await Promise.all([
        loadKey("habits", []),
        loadKey("goals", []),
        loadKey("reminders", []),
        loadKey("screenTime", {}),
        loadKey("screenLimit", 120),
        loadKey("moodLog", {}),
        loadKey("dashboardConfig", DEFAULT_DASHBOARD_CONFIG),
        loadKey("accentColor", ACCENT_PRESETS[0].hex),
        loadKey("backupIndex", []),
      ]);
      setHabits(h);
      setGoals(g);
      setReminders(r);
      setScreenTime(st);
      setScreenLimitState(sl);
      setMoodLog(ml);
      setDashboardConfigState(dc);
      C.accent = ac;
      setBackupIndex(bi);
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      setTimeout(() => setLoading(false), remaining);
    })();
  }, []);

  const persistHabits = useCallback((next) => {
    setHabits(next);
    saveKey("habits", next);
  }, []);
  const persistGoals = useCallback((next) => {
    setGoals(next);
    saveKey("goals", next);
  }, []);
  const persistReminders = useCallback((next) => {
    setReminders(next);
    saveKey("reminders", next);
  }, []);
  const persistScreenTime = useCallback((next) => {
    setScreenTime(next);
    saveKey("screenTime", next);
  }, []);
  const persistScreenLimit = useCallback((next) => {
    setScreenLimitState(next);
    saveKey("screenLimit", next);
  }, []);
  const persistMoodLog = useCallback((next) => {
    setMoodLog(next);
    saveKey("moodLog", next);
  }, []);
  const persistDashboardConfig = useCallback((next) => {
    setDashboardConfigState(next);
    saveKey("dashboardConfig", next);
  }, []);
  const setAccentColor = useCallback((hex) => {
    C.accent = hex;
    saveKey("accentColor", hex);
    setThemeTick((t) => t + 1);
  }, []);

  function toggleHabitOnDate(id, dateStr) {
    const next = habits.map((h) => {
      if (h.id !== id) return h;
      const completions = { ...h.completions };
      if (completions[dateStr]) delete completions[dateStr];
      else completions[dateStr] = true;
      return { ...h, completions };
    });
    persistHabits(next);
  }
  function toggleHabitToday(id) {
    toggleHabitOnDate(id, dateKey(0));
  }
  function archiveHabit(id) {
    persistHabits(habits.map((h) => (h.id === id ? { ...h, archived: true } : h)));
  }
  function restoreHabit(id) {
    persistHabits(habits.map((h) => (h.id === id ? { ...h, archived: false } : h)));
  }
  function deleteHabitForever(id) {
    persistHabits(habits.filter((h) => h.id !== id));
  }

  function archiveGoal(id) {
    persistGoals(goals.map((g) => (g.id === id ? { ...g, archived: true } : g)));
  }
  function restoreGoal(id) {
    persistGoals(goals.map((g) => (g.id === id ? { ...g, archived: false } : g)));
  }
  function deleteGoalForever(id) {
    persistGoals(goals.filter((g) => g.id !== id));
  }
  function toggleMilestone(goalId, milestoneId) {
    persistGoals(
      goals.map((g) =>
        g.id !== goalId
          ? g
          : { ...g, milestones: g.milestones.map((m) => (m.id === milestoneId ? { ...m, done: !m.done } : m)) }
      )
    );
  }
  function addMilestone(goalId, text) {
    persistGoals(
      goals.map((g) => (g.id !== goalId ? g : { ...g, milestones: [...g.milestones, { id: uid(), text, done: false }] }))
    );
  }
  function bumpRecurring(goalId, delta) {
    persistGoals(
      goals.map((g) => {
        if (g.id !== goalId || g.type !== "recurring") return g;
        const pk = currentPeriodKey(g.recurring.period);
        const log = { ...(g.recurring.log || {}) };
        log[pk] = Math.max(0, (log[pk] || 0) + delta);
        return { ...g, recurring: { ...g.recurring, log } };
      })
    );
  }

  function addReminder(reminder) {
    persistReminders([...reminders, { id: uid(), ...reminder }]);
  }
  function deleteReminder(id) {
    persistReminders(reminders.filter((r) => r.id !== id));
  }
  function addScreenMinutes(delta) {
    const today = dateKey(0);
    persistScreenTime({ ...screenTime, [today]: (screenTime[today] || 0) + delta });
  }
  function setScreenMinutesForDate(dateStr, mins) {
    persistScreenTime({ ...screenTime, [dateStr]: mins });
  }
  function setScreenMinutesToday(mins) {
    setScreenMinutesForDate(dateKey(0), mins);
  }
  function setMoodForDate(dateStr, n) {
    persistMoodLog({ ...moodLog, [dateStr]: { ...(moodLog[dateStr] || {}), mood: n } });
  }
  function setMoodToday(n) {
    setMoodForDate(dateKey(0), n);
  }
  function setEnergyForDate(dateStr, n) {
    persistMoodLog({ ...moodLog, [dateStr]: { ...(moodLog[dateStr] || {}), energy: n } });
  }
  function setEnergyToday(n) {
    setEnergyForDate(dateKey(0), n);
  }

  function openHabitSheet(habit) {
    if (habit) {
      setEditingHabitId(habit.id);
      setHabitNameDraft(habit.name);
      setHabitNotesDraft(habit.notes || "");
      setHabitFreqDraft(habit.frequency || "daily");
      setHabitTimesPerWeekDraft(habit.timesPerWeek || 3);
    } else {
      setEditingHabitId(null);
      setHabitNameDraft("");
      setHabitNotesDraft("");
      setHabitFreqDraft("daily");
      setHabitTimesPerWeekDraft(3);
    }
    setSheetOpen(true);
  }
  function submitHabitSheet() {
    if (!habitNameDraft.trim()) return;
    if (editingHabitId) {
      persistHabits(
        habits.map((h) =>
          h.id === editingHabitId
            ? {
                ...h,
                name: habitNameDraft.trim(),
                notes: habitNotesDraft.trim(),
                frequency: habitFreqDraft,
                timesPerWeek: habitTimesPerWeekDraft,
              }
            : h
        )
      );
    } else {
      const color = HABIT_PALETTE[habits.length % HABIT_PALETTE.length];
      persistHabits([
        ...habits,
        {
          id: uid(),
          name: habitNameDraft.trim(),
          notes: habitNotesDraft.trim(),
          frequency: habitFreqDraft,
          timesPerWeek: habitTimesPerWeekDraft,
          color,
          completions: {},
          archived: false,
        },
      ]);
    }
    setSheetOpen(false);
  }

  function openGoalSheet(goal) {
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalTitleDraft(goal.title);
      setGoalNotesDraft(goal.notes || "");
      setGoalTypeDraft(goal.type || "once");
      setGoalPeriodDraft(goal.recurring ? goal.recurring.period : "monthly");
      setGoalTargetDraft(goal.recurring ? goal.recurring.target : 1);
    } else {
      setEditingGoalId(null);
      setGoalTitleDraft("");
      setGoalNotesDraft("");
      setGoalTypeDraft("once");
      setGoalPeriodDraft("monthly");
      setGoalTargetDraft(1);
    }
    setSheetOpen(true);
  }
  function submitGoalSheet() {
    if (!goalTitleDraft.trim()) return;
    if (editingGoalId) {
      persistGoals(
        goals.map((g) =>
          g.id === editingGoalId
            ? {
                ...g,
                title: goalTitleDraft.trim(),
                notes: goalNotesDraft.trim(),
                type: goalTypeDraft,
                recurring:
                  goalTypeDraft === "recurring"
                    ? { period: goalPeriodDraft, target: goalTargetDraft, log: (g.recurring && g.recurring.log) || {} }
                    : null,
              }
            : g
        )
      );
    } else {
      persistGoals([
        ...goals,
        {
          id: uid(),
          title: goalTitleDraft.trim(),
          notes: goalNotesDraft.trim(),
          type: goalTypeDraft,
          milestones: [],
          recurring: goalTypeDraft === "recurring" ? { period: goalPeriodDraft, target: goalTargetDraft, log: {} } : null,
          archived: false,
        },
      ]);
    }
    setSheetOpen(false);
  }

  async function createBackup() {
    const id = uid();
    const createdAt = new Date().toISOString();
    const payload = {
      habits,
      goals,
      reminders,
      screenTime,
      screenLimit,
      moodLog,
      dashboardConfig,
      accentColor: C.accent,
      createdAt,
    };
    await saveKey(`backupData:${id}`, payload);
    const nextIndex = [...backupIndex, { id, createdAt }];
    setBackupIndex(nextIndex);
    await saveKey("backupIndex", nextIndex);
  }

  async function deleteBackup(id) {
    const nextIndex = backupIndex.filter((b) => b.id !== id);
    setBackupIndex(nextIndex);
    await saveKey("backupIndex", nextIndex);
    await deleteKey(`backupData:${id}`);
  }

  async function retrieveBackup(id) {
    return loadKey(`backupData:${id}`, null);
  }

  function handleMoreOpen(key) {
    setMoreScreen(key);
  }

  const showFab = tab === "habits" || tab === "goals";
  const archivedCount = habits.filter((h) => h.archived).length + goals.filter((g) => g.archived).length;
  const accentName = ACCENT_PRESETS.find((p) => p.hex === C.accent)?.name || "Custom";

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div style={{ height: "100vh", background: C.bg, fontFamily: FONT_BODY, display: "flex", justifyContent: "center", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Aldrich&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; height: 100%; overscroll-behavior: none; -webkit-user-select: none; user-select: none; }
        button, input, textarea, select { font-family: inherit; }
        button:focus, input:focus, textarea:focus, select:focus { outline: none; }
        button:focus-visible, select:focus-visible {
          outline: 2px solid ${C.accent};
          outline-offset: 2px;
        }
        input, textarea { -webkit-user-select: text; user-select: text; }
        select {
          -webkit-appearance: none;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23565C63'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 34px !important;
        }
      `}</style>

      <div style={{ width: "100%", maxWidth: 480, height: "100%", overflowY: "auto", WebkitOverflowScrolling: "touch", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(20px + env(safe-area-inset-top)) 20px 8px" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Ledger
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textFaint }}>{dateKey(0)}</div>
        </div>

        <div style={{ padding: "12px 20px 110px" }}>
          {tab === "today" && (
            <DashboardView
              habits={habits}
              goals={goals}
              screenTime={screenTime}
              screenLimit={screenLimit}
              moodLog={moodLog}
              reminders={reminders}
              dashboardConfig={dashboardConfig}
              toggleHabitToday={toggleHabitToday}
              setMoodToday={setMoodToday}
              setEnergyToday={setEnergyToday}
              openScreen={() => setMoreScreen("screen")}
            />
          )}
          {tab === "habits" && (
            <HabitsView habits={habits} toggleHabitToday={toggleHabitToday} onEdit={openHabitSheet} onArchive={archiveHabit} />
          )}
          {tab === "goals" && (
            <GoalsView
              goals={goals}
              toggleMilestone={toggleMilestone}
              addMilestone={addMilestone}
              onEdit={openGoalSheet}
              onArchive={archiveGoal}
              bumpRecurring={bumpRecurring}
            />
          )}
          {tab === "more" && (
            <MoreList
              onOpen={handleMoreOpen}
              reminderCount={reminders.length}
              screenToday={screenTime[dateKey(0)] || 0}
              screenLimit={screenLimit}
              archivedCount={archivedCount}
              accentName={accentName}
              backupCount={backupIndex.length}
            />
          )}
        </div>

        {showFab && (
          <button
            onClick={() => (tab === "habits" ? openHabitSheet(null) : openGoalSheet(null))}
            style={{
              position: "fixed",
              bottom: 84,
              right: "max(20px, calc(50% - 240px + 20px))",
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: C.accent,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 6px 20px ${accentTint(0.35)}`,
              cursor: "pointer",
              zIndex: 40,
            }}
          >
            <Plus size={24} color="#181206" strokeWidth={2.5} />
          </button>
        )}

        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            background: C.surface,
            borderTop: `1px solid ${C.borderSoft}`,
            paddingBottom: "env(safe-area-inset-bottom)",
            zIndex: 30,
          }}
        >
          <div style={{ width: "100%", maxWidth: 480, display: "flex" }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "12px 0 10px",
                    cursor: "pointer",
                  }}
                >
                  <Icon size={19} color={active ? C.accent : C.textFaint} strokeWidth={active ? 2.3 : 1.8} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, letterSpacing: "0.04em", color: active ? C.accent : C.textFaint }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {sheetOpen && tab === "habits" && (
          <Sheet title={editingHabitId ? "Edit habit" : "New habit"} onClose={() => setSheetOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <TextField value={habitNameDraft} onChange={setHabitNameDraft} placeholder="e.g. Drink 2L of water" autoFocus />
              <TextArea value={habitNotesDraft} onChange={setHabitNotesDraft} placeholder="Notes (optional)" />
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginBottom: 6 }}>FREQUENCY</div>
                <SegmentedControl
                  options={[{ key: "daily", label: "Daily" }, { key: "weekly", label: "X times/week" }]}
                  value={habitFreqDraft}
                  onChange={setHabitFreqDraft}
                />
              </div>
              {habitFreqDraft === "weekly" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>Times per week</div>
                  <Stepper value={habitTimesPerWeekDraft} onChange={setHabitTimesPerWeekDraft} min={1} max={7} />
                </div>
              )}
              <PrimaryButton onClick={submitHabitSheet} disabled={!habitNameDraft.trim()}>
                {editingHabitId ? "Save changes" : "Add habit"}
              </PrimaryButton>
            </div>
          </Sheet>
        )}

        {sheetOpen && tab === "goals" && (
          <Sheet title={editingGoalId ? "Edit goal" : "New goal"} onClose={() => setSheetOpen(false)}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <TextField value={goalTitleDraft} onChange={setGoalTitleDraft} placeholder="e.g. Run a half marathon" autoFocus />
              <TextArea value={goalNotesDraft} onChange={setGoalNotesDraft} placeholder="Notes (optional)" />
              <div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginBottom: 6 }}>TYPE</div>
                <SegmentedControl
                  options={[{ key: "once", label: "One-time" }, { key: "recurring", label: "Recurring" }]}
                  value={goalTypeDraft}
                  onChange={setGoalTypeDraft}
                />
              </div>
              {goalTypeDraft === "recurring" && (
                <>
                  <div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.textFaint, marginBottom: 6 }}>PERIOD</div>
                    <SegmentedControl
                      options={[{ key: "monthly", label: "Monthly" }, { key: "quarterly", label: "Quarterly" }]}
                      value={goalPeriodDraft}
                      onChange={setGoalPeriodDraft}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textDim }}>Target count</div>
                    <Stepper value={goalTargetDraft} onChange={setGoalTargetDraft} min={1} max={100} />
                  </div>
                </>
              )}
              <PrimaryButton onClick={submitGoalSheet} disabled={!goalTitleDraft.trim()}>
                {editingGoalId ? "Save changes" : "Add goal"}
              </PrimaryButton>
            </div>
          </Sheet>
        )}

        {moreScreen === "reminders" && (
          <RemindersPage onBack={() => setMoreScreen(null)} reminders={reminders} addReminder={addReminder} deleteReminder={deleteReminder} />
        )}
        {moreScreen === "pastDay" && (
          <EditPastDayPage
            onBack={() => setMoreScreen(null)}
            habits={habits}
            moodLog={moodLog}
            screenTime={screenTime}
            persistHabits={persistHabits}
            persistScreenTime={persistScreenTime}
            persistMoodLog={persistMoodLog}
          />
        )}
        {moreScreen === "screen" && (
          <ScreenTimePage
            onBack={() => setMoreScreen(null)}
            screenTime={screenTime}
            screenLimit={screenLimit}
            setScreenLimit={persistScreenLimit}
            addScreenMinutes={addScreenMinutes}
            setScreenMinutesToday={setScreenMinutesToday}
          />
        )}
        {moreScreen === "review" && (
          <ReviewPage onBack={() => setMoreScreen(null)} habits={habits} goals={goals} screenTime={screenTime} screenLimit={screenLimit} moodLog={moodLog} />
        )}
        {moreScreen === "archived" && (
          <ArchivedPage
            onBack={() => setMoreScreen(null)}
            habits={habits}
            goals={goals}
            restoreHabit={restoreHabit}
            deleteHabitForever={deleteHabitForever}
            restoreGoal={restoreGoal}
            deleteGoalForever={deleteGoalForever}
          />
        )}
        {moreScreen === "dashboard" && (
          <CustomizeDashboardPage onBack={() => setMoreScreen(null)} config={dashboardConfig} setConfig={persistDashboardConfig} />
        )}
        {moreScreen === "backup" && (
          <BackupPage
            onBack={() => setMoreScreen(null)}
            backupIndex={backupIndex}
            createBackup={createBackup}
            deleteBackup={deleteBackup}
            retrieveBackup={retrieveBackup}
          />
        )}
        {moreScreen === "theme" && (
          <ThemePage onBack={() => setMoreScreen(null)} accentColor={C.accent} setAccentColor={setAccentColor} />
        )}
      </div>
    </div>
  );
}
