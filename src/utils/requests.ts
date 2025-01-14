import axios, { AxiosError, AxiosRequestConfig } from "axios";

import { BASE_DOMAIN, BASE_URL } from "../../env";

export async function getRequest(url: string) {
  try {
    const connectionCode = null;
    if (!connectionCode) {
      return;
    }
    const options = {
      headers: {
        Authorization: `Bearer ${connectionCode}`,
      },
    };

    console.log("GET " + BASE_URL + url);
    const response = await axios.get(BASE_URL + url, options);
    return response.data;
  } catch (error) {
    // handleAxiosError(error as AxiosError);
    console.log(error);
  }
}

export async function getConnectionCode(email: string, password: string) {
  const url = "/printerapp/connect";
  console.log("POST " + BASE_URL + url);
  const response = await axios.post(BASE_URL + url, { email, password });
  console.log(response.data);

  return response.data;
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
