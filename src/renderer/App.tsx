import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";

interface SocketStatus {
  initialized: boolean;
  connected: boolean;
  error?: string;
}

const App: React.FC = () => {
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
  const [socketError, setSocketError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleSocketStatus = (status: SocketStatus) => {
      setSocketInitialized(status.initialized);
      setSocketError(status.error);
    };

    window.api.receive("socket:status", handleSocketStatus);

    return () => {
      window.api.send("socket:disconnect");
    };
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Socket Status Bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "10px",
          backgroundColor: "#333",
          color: "white",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            Status:{" "}
            {socketInitialized ? (
              <span style={{ color: "#4CAF50" }}>Connected</span>
            ) : (
              <span style={{ color: "#FFA500" }}>Disconnected</span>
            )}
          </div>
          {socketError && (
            <div style={{ color: "#FF6B6B" }}>Error: {socketError}</div>
          )}
        </div>
      </div>

      {/* Main Content with Login Form */}
      <div
        style={{
          paddingTop: "60px", // Space for the status bar
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 60px)", // Adjust for status bar
        }}
      >
        <LoginForm />
      </div>
    </div>
  );
};

export default App;
