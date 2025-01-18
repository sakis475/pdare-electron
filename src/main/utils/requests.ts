import axios, { AxiosError, AxiosRequestConfig } from "axios";

import { BASE_DOMAIN, BASE_URL } from "../../../env";
import { Printer } from "../../main/printers/PrinterScan/SearchPrinters";

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
// function handleAxiosError(error: any) {
//   if (axios.isAxiosError(error)) {
//     if (error?.response?.data?.appcode) {
//       switch (error.response.data.appcode) {
//         case "DT10":
//           toast("error", "Table is occupied, choose other table", "", 2500);
//           break;

//         default:
//           toast("error", error.response.data.message, "", 2500);
//           break;
//       }
//     } else if (error.request) {
//       toast("error", "No Server Response", "", 2000);
//     } else {
//       toast("error", error?.message);
//     }
//   } else {
//     console.error("Unexpected error:", error);

//     toast("error", "An error occurred while processing your request");
//   }

//   if (error?.response?.status === 401) {
//     navigate(ScreenNames.LoginScreen);
//   }
// }
