import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import { doc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";

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
  const [removeMode, setRemoveMode] = useState(false);

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

  const toggleCell = async (dayKey, timeKey) => {
    if (!name) return;
    const userKey = name.trim().toLowerCase();
    const userData = participants[userKey] || {};
    const cellKey = `${dayKey}-${timeKey}`;
    const updated = { ...userData, [cellKey]: !userData[cellKey] };
    await updateDoc(doc(db, "events", eventId), {
      [`participants.${userKey}`]: updated,
    });
  };

  const removeUser = async (userKey) => {
    if (!window.confirm(`Remove ${userKey}?`)) return;
    await updateDoc(doc(db, "events", eventId), { [`participants.${userKey}`]: deleteField() });
    if (name.trim().toLowerCase() === userKey) {
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
      dates.forEach((d, c) => {
        if (obj[`${d.iso}-${times[r].key}`]) {
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
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-emerald-700 mb-4">{meta.title}</h1>

      <div className="mb-4">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            localStorage.setItem("username", e.target.value);
          }}
          placeholder="Enter your name"
          className="border rounded px-2 py-1 text-sm"
        />
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-xs">Time</th>
              {dates.map((d) => (
                <th key={d.iso} className="border px-2 py-1 text-xs">
                  {d.label}<br /><span className="font-semibold">{d.day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {times.map((t, r) => (
              <tr key={t.key}>
                <td className="border px-2 py-1 text-xs">{t.label}</td>
                {dates.map((d, c) => {
                  const cellKey = `${d.iso}-${t.key}`;
                  const count = availabilityCount[r][c];
                  const isSelected =
                    name && participants[name.trim().toLowerCase()]?.[cellKey];
                  return (
                    <td
                      key={cellKey}
                      onClick={() => toggleCell(d.iso, t.key)}
                      className={`border w-12 h-6 cursor-pointer text-xs text-center ${
                        isSelected ? "bg-red-400" : heatmapColor(count)
                      }`}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-center">
        <h2 className="font-semibold mb-2">Participants</h2>
        <ul className="text-sm space-y-1">
          {participantKeys.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
        <div className="mt-2">
          <button
            onClick={() => setRemoveMode(!removeMode)}
            className="text-xs text-rose-600 hover:underline"
          >
            {removeMode ? "Cancel Remove" : "Remove a Participant"}
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
