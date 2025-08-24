import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("21:00");
  const navigate = useNavigate();
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const createEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate || !startTime || !endTime) return;

    const eventId = Math.random().toString(36).substring(2, 10);

    await setDoc(doc(db, "events", eventId), {
      meta: {
        title,
        createdAt: new Date().toISOString(),
        startDate,
        endDate,
        startTime,
        endTime,
      },
      participants: {}
    });

    localStorage.removeItem("username");
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      {/* Lock width explicitly */}
      <div className="bg-white p-8 rounded-md shadow-md w-[480px] mx-auto border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">whennot2meet</h1>
        <form onSubmit={createEvent} className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Event title</label>
            <input
              type="text"
              placeholder="Project kickoff..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>          </div>

          {/* Date range */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Date range</label>
            <div className="flex gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>            </div>
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>          </div>

          {/* Time range */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Time range</label>
            <div className="flex gap-3">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="flex-1 border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>            </div>
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>          </div>

          {/* Submit */}
          <button
            type="submit"
            className="mt-2 bg-emerald-500 text-white w-full py-3 rounded-md text-lg font-semibold hover:bg-emerald-600 transition"
          >
            Create Event
          </button>
        </form>
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>      </div>
          {/* Timezone */}
          <div>
            <label className="text-base font-medium text-gray-700 block mb-2">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {Intl.supportedValuesOf("timeZone").map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>    </div>
  );
}
