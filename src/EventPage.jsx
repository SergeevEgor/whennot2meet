import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

function timeSlots(startTime, endTime, timezone) {
  const slots = [];
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  let cur = new Date(Date.UTC(1970, 0, 1, sh, sm));
  const end = new Date(Date.UTC(1970, 0, 1, eh, em));

  while (cur <= end) {
    const label = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    }).format(cur);

    const h = cur.getUTCHours();
    const m = cur.getUTCMinutes();
    slots.push({ label, key: `${h}:${m.toString().padStart(2, "0")}` });
    cur.setUTCMinutes(cur.getUTCMinutes() + 15);
  }

  return slots;
}

function dateRange(startDate, endDate) {
  const dates = [];
  let cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    dates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export default function EventPage() {
  const { id } = useParams();
  const [meta, setMeta] = useState(null);
  const [participants, setParticipants] = useState({});
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [userTimezone, setUserTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMeta(data.meta);
        setParticipants(data.participants || {});
      }
    });
    return () => unsub();
  }, [id]);

  if (!meta) return <div className="p-6">Loading...</div>;

  const times = timeSlots(meta.startTime, meta.endTime, userTimezone);
  const days = dateRange(meta.startDate, meta.endDate);

  const toggleCell = async (dayKey, timeKey) => {
    if (!username) return;
    const userData = participants[username] || {};
    const cellKey = `${dayKey}-${timeKey}`;
    const updated = { ...userData, [cellKey]: !userData[cellKey] };

    await updateDoc(doc(db, "events", id), {
      [`participants.${username}`]: updated,
    });
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    localStorage.setItem("username", username);
    if (!participants[username]) {
      await setDoc(
        doc(db, "events", id),
        { participants: { [username]: {} } },
        { merge: true }
      );
    }
  };

  return (
    <div className="p-6">
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
        <label className="text-sm font-medium text-gray-700 mr-2">Your Timezone:</label>
        <select
          value={userTimezone}
          onChange={(e) => setUserTimezone(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          {Intl.supportedValuesOf("timeZone").map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {!username ? (
        <form onSubmit={handleNameSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="ml-2 px-2 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600"
          >
            Join
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-gray-700">You are logged in as: <strong>{username}</strong></p>
      )}

      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-xs">Time</th>
              {days.map((day) => {
                const key = day.toISOString().split("T")[0];
                return (
                  <th key={key} className="border px-2 py-1 text-xs">
                    {day.toDateString()}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {times.map((t) => (
              <tr key={t.key}>
                <td className="border px-2 py-1 text-xs">{t.label}</td>
                {days.map((day) => {
                  const dayKey = day.toISOString().split("T")[0];
                  const cellKey = `${dayKey}-${t.key}`;
                  const count = Object.values(participants).filter(
                    (p) => p && p[cellKey]
                  ).length;
                  const isSelected =
                    username && participants[username] && participants[username][cellKey];

                  return (
                    <td
                      key={cellKey}
                      onClick={() => toggleCell(dayKey, t.key)}
                      className={`border w-12 h-6 cursor-pointer ${
                        isSelected ? "bg-red-400" : count > 0 ? "bg-emerald-200" : "bg-green-100"
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
    </div>
  );
}
