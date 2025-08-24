import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, setDoc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";

function timeSlots(startTime, endTime) {
  const slots = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  let cur = new Date(0, 0, 0, sh, sm);
  const end = new Date(0, 0, 0, eh, em);

  while (cur <= end) {
    const h = cur.getHours();
    const m = cur.getMinutes();
    const label = `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
    slots.push({ label, key: `${h}:${m.toString().padStart(2, "0")}` });
    cur.setMinutes(cur.getMinutes() + 15);
  }
  return slots;
}

function dateRange(startDate, endDate) {
  const dates = [];
  let cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    dates.push({
      iso: cur.toISOString().split("T")[0],
      label: cur.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      day: cur.toLocaleDateString("en-US", { weekday: "short" }),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default function EventPage() {
  const { eventId } = useParams();
  const [meta, setMeta] = useState(null);
  const [participants, setParticipants] = useState({});
  const [name, setName] = useState(localStorage.getItem("username") || "");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [removeMode, setRemoveMode] = useState(false);

  const isDragging = useRef(false);
  const dragValue = useRef(null);

  const normalizeName = (raw) => raw.trim().toLowerCase();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", eventId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMeta(data.meta);
        setParticipants(data.participants || {});
      }
    });
    return () => unsub();
  }, [eventId]);

  const toggleCell = async (r, c) => {
    if (!name) return;
    const key = normalizeName(name);
    const userData = participants[key] || {};
    const cellKey = `r${r}_c${c}`;
    const updated = { ...userData, [cellKey]: !userData[cellKey] };
    await updateDoc(doc(db, "events", eventId), { [`participants.${key}`]: updated });
  };

  const removeUser = async (userKey) => {
    if (!window.confirm(`Remove ${userKey}?`)) return;
    await updateDoc(doc(db, "events", eventId), { [`participants.${userKey}`]: deleteField() });
    if (normalizeName(name) === userKey) {
      setName("");
      localStorage.removeItem("username");
    }
  };

  if (!meta) return <div className="p-4 text-center">Loading...</div>;

  const times = timeSlots(meta.startTime, meta.endTime);
  const dates = dateRange(meta.startDate, meta.endDate);

  const participantKeys = Object.keys(participants || {});
  const totalUsers = participantKeys.length;

  const availabilityCount = Array(times.length).fill(null).map(() => Array(dates.length).fill(0));
  participantKeys.forEach((u) => {
    const obj = participants[u];
    times.forEach((_, r) => {
      dates.forEach((_, c) => {
        if (obj[`r${r}_c${c}`] === false) {
          availabilityCount[r][c] += 1;
        }
      });
    });
  });

  const heatmapColor = (count) => {
    if (totalUsers === 0) return "bg-gray-100";
    const ratio = count / totalUsers;
    if (ratio === 0) return "bg-rose-100";
    if (ratio <= 0.25) return "bg-emerald-100";
    if (ratio <= 0.5) return "bg-emerald-300";
    if (ratio <= 0.75) return "bg-emerald-400";
    if (ratio < 1) return "bg-emerald-500 text-white";
    return "bg-emerald-700 text-white";
  };

  return (
    <div className="flex flex-col items-center p-4 select-none">
      <h1 className="text-3xl font-bold text-emerald-700 mb-2">{meta.title}</h1>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm text-gray-500">Share this link: {window.location.href}</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
          }}
          className="px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
        >
          Copy Link
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="px-2 py-1 bg-emerald-500 text-white rounded text-xs hover:bg-emerald-600"
        >
          + New Event
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            localStorage.setItem("username", e.target.value);
          }}
          placeholder="Enter your name"
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="overflow-x-auto max-w-[90vw]">
        <h2 className="text-lg font-semibold mb-2">Group's Availability</h2>
        <div
          className="grid border border-gray-300 rounded-md"
          style={{ gridTemplateColumns: `80px repeat(${dates.length}, minmax(56px,1fr))` }}
        >
          <div className="bg-white border border-gray-200 p-1"></div>
          {dates.map((d, idx) => (
            <div key={idx} className="text-center border border-gray-200 p-1">
              <div className="text-xs">{d.label}</div>
              <div className="text-sm font-semibold">{d.day}</div>
            </div>
          ))}
          {times.map((time, r) => (
            <>
              <div
                key={time.key}
                className="flex items-center justify-end pr-1 text-[10px] border border-gray-200 font-medium bg-gray-50"
                style={{ height: "22px" }}
              >
                {time.label}
              </div>
              {dates.map((_, c) => {
                const count = availabilityCount[r][c];
                return (
                  <div
                    key={time.key + c}
                    className={`w-14 border border-gray-200 ${heatmapColor(count)}`}
                    style={{ height: "22px" }}
                  ></div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <div className="mt-8 w-64 text-center">
        <h2 className="font-semibold mb-2">Participants</h2>
        <ul className="space-y-1">
          {participantKeys.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
        <div className="mt-3">
          <button
            onClick={() => setRemoveMode(!removeMode)}
            className="text-xs text-rose-600 hover:underline"
          >
            {removeMode ? "Cancel Remove Mode" : "Remove a Participant"}
          </button>
          {removeMode && (
            <div className="mt-2 space-y-1">
              {participantKeys.map((u) => (
                <button
                  key={u}
                  onClick={() => removeUser(u)}
                  className="block w-full text-xs text-rose-600 hover:bg-rose-50 border rounded px-1 py-0.5"
                >
                  ❌ {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
