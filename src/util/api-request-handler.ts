import { HttpClient, configHandler } from "@contentstack/cli-utilities";
import { formatErrors } from "./error-helper";

interface RequestParams {
  orgUid: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  queryParams?: Record<string, any>;
  payload?: any;
  url: string;
}

export async function apiRequestHandler(params: RequestParams): Promise<any> {
  const { orgUid, method, queryParams, payload, url } = params;
  const authtoken = configHandler.get("authtoken");

  const headers = {
    organization_uid: orgUid,
    authtoken,
  };

  const httpClient = new HttpClient();
  httpClient.headers(headers);

  if (queryParams) {
    httpClient.queryParams(queryParams);
  }

  try {
    let response;
    switch (method) {
      case "GET":
        response = await httpClient.get(url);
        break;
      case "POST":
        response = await httpClient.post(url, payload);
        break;
      case "PUT":
        response = await httpClient.put(url, payload);
        break;
      case "DELETE":
        response = await httpClient.delete(url);
        break;
      case "PATCH":
        response = await httpClient.patch(url, payload);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const { status, data } = response;
    if (status >= 200 && status < 300) {
      return data;
    }
    const errorMessage = data?.error
      ? formatErrors(data)
      : data?.error_message || "Something went wrong";
    throw errorMessage;
  } catch (error) {
    throw error;
  }
}
