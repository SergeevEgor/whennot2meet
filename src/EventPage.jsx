import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { db } from "./firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteField,
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
}}}}}}}

function dateRange(startDate, endDate) {
  const dates = [];
  let cur = new Date(startDate);
  const end = new Date(endDate);

  while (cur <= end) {
    dates.push({
      iso: cur.toISOString().split("T")[0],
      label: cur.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
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
  const [grid, setGrid] = useState([]);
  const [name, setName] = useState(localStorage.getItem("username") || "");
  const [hoverInfo, setHoverInfo] = useState(null);
  const [removeMode, setRemoveMode] = useState(false);
  const [userTimezone, setUserTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const isDragging = useRef(false);
  const dragValue = useRef(null);

  const normalizeName = (raw) => raw.trim().toLowerCase();

  const objectToGrid = (obj, rows, cols) => {
    const newGrid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));
    if (!obj) return newGrid;
    Object.keys(obj).forEach((key) => {
      const [r, c] = key.split("_").map((x) => parseInt(x.replace(/\D/g, "")));
      if (r < rows && c < cols) newGrid[r][c] = obj[key];
    });
    return newGrid;
  };

  const gridToObject = (grid) => {
    const obj = {};
    grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        obj[`r${r}_c${c}`] = cell;
      });
    });
    return obj;
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "events", eventId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMeta(data.meta);
        setParticipants(data.participants || {});

        if (data.meta) {
          const times = timeSlots(data.meta.startTime, data.meta.endTime);
          const dates = dateRange(data.meta.startDate, data.meta.endDate);
          const rows = times.length;
          const cols = dates.length;

          const key = normalizeName(name);
          if (key && data.participants?.[key]) {
            setGrid(objectToGrid(data.participants[key], rows, cols));
          } else {
            setGrid(
              Array(rows)
                .fill(null)
                .map(() => Array(cols).fill(false))
            );
          }
        }
      }
    });
    return () => unsub();
  }, [name, eventId]);

  const saveGrid = (newGrid) => {
    if (!name || !meta) return;
    const key = normalizeName(name);
    setDoc(
      doc(db, "events", eventId),
      { participants: { ...participants, [key]: gridToObject(newGrid) } },
      { merge: true }
    );
  };

  const toggleCell = (r, c, value = null) => {
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[r][c] = value !== null ? value : !newGrid[r][c];
      saveGrid(newGrid);
      return newGrid;
    });
  };

  const handleMouseDown = (r, c) => {
    if (!name) return;
    isDragging.current = true;
    dragValue.current = !grid[r][c];
    toggleCell(r, c, dragValue.current);
  };

  const handleMouseEnter = (r, c) => {
    if (isDragging.current) toggleCell(r, c, dragValue.current);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragValue.current = null;
  };

  const removeUser = async (userKey) => {
    if (!window.confirm(`Remove ${userKey}?`)) return;
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, { [`participants.${userKey}`]: deleteField() });
      if (normalizeName(name) === userKey) {
        setName("");
        localStorage.removeItem("username");
      }
    } catch (err) {
      console.error("Error removing participant:", err);
    }
  };

  if (!meta) return <div className="p-4 text-center">Loading...</div>;

  const times = timeSlots(meta.startTime, meta.endTime, userTimezone);
  const dates = dateRange(meta.startDate, meta.endDate);

  const participantKeys = Object.keys(participants || {});
  const totalUsers = participantKeys.length;

  const availabilityCount = Array(times.length)
    .fill(null)
    .map(() => Array(dates.length).fill(0));

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
    <div className="flex flex-col items-center p-4 select-none" onMouseUp={handleMouseUp}>
      <h1 className="text-3xl font-bold text-emerald-700 mb-2">{meta.title}</h1>
      <p className="text-sm text-gray-500 mb-4">Share this link: {window.location.href}</p>
<div className="flex items-center gap-3 mb-4">
  <p className="text-sm text-gray-500">Share this link: {window.location.href}</p>
  <button
    onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Link copied!"); }}
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

      {/* Name input */}
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
      </div>      <div className="flex gap-8 w-full justify-center">
        {name && (
          <>
            {/* Personal availability */}
            <div className="overflow-x-auto max-w-[90vw]">
              <h2 className="text-lg font-semibold mb-2">{name}'s Availability</h2>
              <Grid
                grid={grid}
                toggleCell={toggleCell}
                handleMouseDown={handleMouseDown}
                handleMouseEnter={handleMouseEnter}
                TIMES={times}
                DAYS={dates}
              />
            </div>

            {/* Group availability */}
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
                      const availableUsers = participantKeys.filter(
                        (u) => participants[u][`r${r}_c${c}`] === false
                      );
                      const unavailableUsers = participantKeys.filter(
                        (u) => participants[u][`r${r}_c${c}`] === true
                      );
                      return (
                        <div
                          key={time.key + c}
                          className={`w-14 border border-gray-200 ${heatmapColor(count)}`}
                          style={{ height: "22px" }}
                          onMouseEnter={() =>
                            setHoverInfo({
                              time: time.label,
                              day: dates[c].day,
                              date: dates[c].label,
                              availableUsers,
                              unavailableUsers,
                            })
                          }
                          onMouseLeave={() => setHoverInfo(null)}
                        ></div>
                      );
                    })}
                  </>
                ))}
              </div>
            </div>

            {/* Hover details */}
            <div className="w-56 border rounded p-2 bg-gray-50">
              <h2 className="text-sm font-semibold mb-1">Details</h2>
              {hoverInfo ? (
                <>
                  <p className="text-xs mb-1">
                    {hoverInfo.day} {hoverInfo.date} at {hoverInfo.time}
                  </p>
                  <p className="text-xs text-green-700">
                    ✅ Available: {hoverInfo.availableUsers.join(", ") || "None"}
                  </p>
                  <p className="text-xs text-rose-700">
                    ❌ Unavailable: {hoverInfo.unavailableUsers.join(", ") || "None"}
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-500">Hover a cell to see details</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Participants list */}
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

function Grid({ grid, toggleCell, handleMouseDown, handleMouseEnter, TIMES, DAYS }) {
  return (
    <div
      className="grid border border-gray-300 rounded-md"
      style={{ gridTemplateColumns: `80px repeat(${DAYS.length}, minmax(56px,1fr))` }}
    >
      <div className="bg-white border border-gray-200 p-1"></div>
      {DAYS.map((d, idx) => (
        <div key={idx} className="text-center border border-gray-200 p-1">
          <div className="text-xs">{d.label}</div>
          <div className="text-sm font-semibold">{d.day}</div>
        </div>
      ))}
      {TIMES.map((time, r) => (
        <>
          <div
            key={time.key}
            className="flex items-center justify-end pr-1 text-[10px] border border-gray-200 font-medium bg-gray-50"
            style={{ height: "22px" }}
          >
            {time.label}
          </div>
          {DAYS.map((_, c) => (
            <div
              key={time.key + c}
              className={`w-14 border border-gray-200 cursor-pointer transition-colors duration-150 ${
                grid[r][c]
                  ? "bg-rose-300 hover:bg-rose-400"
                  : "bg-emerald-50 hover:bg-emerald-100"
              }`}
              style={{ height: "22px" }}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
            ></div>
          ))}
        </>
      ))}
    </div>
  );
}
