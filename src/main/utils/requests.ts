import axios from "axios";

import { BASE_URL } from "../../../env";

export async function getHealthCheck(connectionCode: string) {
  const url = BASE_URL + "/health-check-printer";
  if (!connectionCode) {
    throw new Error("No connection code available for request");
  }

  try {
    const options = {
      headers: {
        Authorization: `${connectionCode}`,
      },
    };

    console.log("GET " + url);
    const response = await axios.get(url, options);
    return response.data;
  } catch (error) {
    console.error("Request failed:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

export async function getConnectionCode(email: string, password: string) {
  const url = "/printerapp/connect";
  console.log("POST " + BASE_URL + url);
  const response = await axios.post(BASE_URL + url, { email, password });
  console.log(response.data);

  return response.data;
}

export async function postPrinterAppDiscovered(
  printers: Printer[],
  connectionCode: string
) {
  const url = "/printerapp/discovered";
  if (!connectionCode) {
    throw new Error("No connection code available for request");
  }

  const options = {
    headers: {
      Authorization: `${connectionCode}`,
    },
  };
  console.log("POST " + BASE_URL + url, printers);
  const response = await axios.post(BASE_URL + url, { printers }, options);
}
