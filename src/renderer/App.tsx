import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import { ConnectionBridge } from "../main/bridges/ConnectionBridge";

interface SocketStatus {
  initialized: boolean;
  connected: boolean;
  error?: string;
}

const bridge = new ConnectionBridge();

const App: React.FC = () => {
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
  const [socketError, setSocketError] = useState<string | undefined>(undefined);
  const [hasStoredConnection, setHasStoredConnection] =
    useState<boolean>(false);
  const [connectionCode, setConnectionCode] = useState<string>("");

  useEffect(() => {
    // Check for stored connection
    const storedConnection = bridge.getStoredConnection();
    setHasStoredConnection(!!storedConnection);

    setConnectionCode(JSON.stringify(storedConnection?.data.connectionCode));
    // Socket status handling
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
          {/* Connection Status */}
          <div>
            Connection:{" "}
            {hasStoredConnection ? (
              <span style={{ color: "#4CAF50" }}>OK</span>
            ) : (
              <span style={{ color: "#FFA500" }}>Not Found</span>
            )}
          </div>
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
        {!hasStoredConnection && <LoginForm />}
        {hasStoredConnection && (
          <div
            style={{
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#4CAF50", marginBottom: "10px" }}>
              Connection Established
            </h2>
            <p>You are already connected to the service.</p>
            <div>{connectionCode}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
