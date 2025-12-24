import { useState, useEffect } from "react";

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error("API Error:", err));
  }, []);

  return (
    <div className="min-h-screen bg-red-500 p-8">
      <h1 className="text-4xl font-bold text-white mb-4">Tailwind Test Bala</h1>
      <div className="bg-blue-500 p-4 rounded-lg">
        <p className="text-white">
          If you see red background and blue box, Tailwind is working!
        </p>
        <div className="mt-4">
          <span className="text-green-300">
            API Status: {health?.success ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
