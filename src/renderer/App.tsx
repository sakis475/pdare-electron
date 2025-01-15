import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import { ConnectionBridge } from "../main/bridges/ConnectionBridge";
import { socketService } from "../main/utils/socket";

const bridge = new ConnectionBridge();

const App: React.FC = () => {
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
  const [socketError, setSocketError] = useState<string | undefined>(undefined);
  const [hasStoredConnection, setHasStoredConnection] =
    useState<boolean>(false);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = () => {
    const storedConnection = bridge.getStoredConnection();
    console.log("Checking connection status:", storedConnection);
    const hasConnection = !!storedConnection;
    setHasStoredConnection(hasConnection);

    if (hasConnection) {
      socketService.reconnect();
    }
  };

  const handleLoginSuccess = () => {
    console.log("Login success called");
    checkConnectionStatus();
  };

  const handleLogout = () => {
    console.log("Logging out...");
    socketService.disconnect();
    bridge.clearConnection();
    checkConnectionStatus();
  };

  const handleSendHello = () => {
    socketService.sendHello();
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* Status Bar */}
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
            alignItems: "center",
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {hasStoredConnection && (
              <button
                onClick={handleSendHello}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Send Hello
              </button>
            )}
            {hasStoredConnection && (
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: "#FF6B6B",
                  color: "white",
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          paddingTop: "60px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 60px)",
        }}
      >
        {!hasStoredConnection ? (
          <LoginForm onLoginSuccess={handleLoginSuccess} />
        ) : (
          <div
            style={{
              padding: "20px",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            <h2 style={{ color: "#4CAF50", marginBottom: "20px" }}>
              Connection Established
            </h2>
            <p>You are connected to the service.</p>
            <button
              onClick={handleSendHello}
              style={{
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                marginTop: "20px",
                width: "100%",
              }}
            >
              Send Hello Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
