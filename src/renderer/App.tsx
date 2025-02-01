import React, { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import { bridge } from "./bridges/bridge";

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

const App: React.FC = () => {
  const [socketInitialized, setSocketInitialized] = useState<boolean>(false);
  const [hasStoredConnection, setHasStoredConnection] =
    useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    checkConnectionStatus();

    // Set up connection status check interval
    const intervalId = setInterval(async () => {
      try {
        const status = await bridge.getConnectionStatusSocket();
        const isConnected = status === true; // adjust based on your actual API response

        if (isConnected && connectionStatus !== "connected") {
          setConnectionStatus("connected");
          setErrorMessage("");
          setReconnectAttempts(0);
        } else if (!isConnected && connectionStatus === "connected") {
          setConnectionStatus("disconnected");
          handleConnectionLost();
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        setConnectionStatus("disconnected");
        handleConnectionLost();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [connectionStatus]);

  const handleConnectionLost = () => {
    setReconnectAttempts((prev) => prev + 1);

    // Different messages based on reconnection attempts
    if (reconnectAttempts < 3) {
      setErrorMessage("Connection lost. Attempting to reconnect...");
      bridge.reconnectSocket();
    } else if (reconnectAttempts < 5) {
      setErrorMessage(
        "Having trouble connecting. Please check your internet connection."
      );
    } else {
      setErrorMessage(
        "Connection issues persist. Try these steps:\n1. Check your internet connection\n2. Restart the app\n3. Log out and log back in"
      );
    }
  };

  const checkConnectionStatus = async () => {
    const storedConnection = await bridge.getStoredConnection();
    const hasConnection = !!storedConnection;
    setHasStoredConnection(hasConnection);
  };

  const handleLoginSuccess = async () => {
    console.log("Login success called");
    checkConnectionStatus();
    const storedConnection = await bridge.getStoredConnection();
    const restaurantId = storedConnection?.data?.user?.restaurant?.id;
    if (restaurantId) {
      console.log("[App Debug] Joining restaurant room:", restaurantId);
    }
    bridge.reconnectSocket();
    setConnectionStatus("connected");
    setErrorMessage("");
    setReconnectAttempts(0);
  };

  const handleLogout = async () => {
    console.log("Logging out...");
    bridge.disconnectSocket();
    await bridge.clearStoredConnection();
    checkConnectionStatus();
    setConnectionStatus("disconnected");
    setErrorMessage("");
    setReconnectAttempts(0);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "#4CAF50";
      case "reconnecting":
        return "#FFA500";
      case "disconnected":
        return "#FF6B6B";
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        backgroundColor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
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
            <span style={{ color: getStatusColor() }}>
              {connectionStatus.charAt(0).toUpperCase() +
                connectionStatus.slice(1)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 60px)",
          overflow: "hidden",
        }}
      >
        {errorMessage && (
          <div
            style={{
              backgroundColor: "#FFF3CD",
              color: "#856404",
              padding: "15px",
              borderRadius: "4px",
              marginBottom: "20px",
              maxWidth: "80%",
              textAlign: "center",
              whiteSpace: "pre-line",
            }}
          >
            {errorMessage}
          </div>
        )}

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
            <h2 style={{ color: getStatusColor(), marginBottom: "20px" }}>
              {connectionStatus === "connected"
                ? "Connection Established"
                : "Checking Connection..."}
            </h2>
            <p>
              {connectionStatus === "connected"
                ? "You are connected to the service."
                : "Attempting to establish connection..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
