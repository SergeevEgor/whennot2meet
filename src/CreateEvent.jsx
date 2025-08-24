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
      participants: {},
    });

    localStorage.removeItem("username");
    navigate(`/event/${eventId}`);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-6 rounded shadow w-[480px] border border-gray-200">
        <h1 className="text-2xl font-bold text-emerald-700 mb-4 text-center">whennot2meet</h1>
        <form onSubmit={createEvent} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border rounded px-2 py-2"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="flex-1 border rounded px-2 py-2"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="flex-1 border rounded px-2 py-2"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="flex-1 border rounded px-2 py-2"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="flex-1 border rounded px-2 py-2"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-500 text-white py-2 rounded hover:bg-emerald-600"
          >
            Create Event
          </button>
        </form>
      </div>
    </div>
  );
}
