import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreateEvent from "./CreateEvent";
import EventPage from "./EventPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreateEvent />} />
        <Route path="/event/:eventId" element={<EventPage />} />
      </Routes>
    </Router>
  );
}
