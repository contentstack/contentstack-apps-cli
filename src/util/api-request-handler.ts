import { HttpClient, configHandler } from "@contentstack/cli-utilities";
import { formatErrors } from "./error-helper";

interface RequestParams {
  orgUid: string;
  queryParams?: Record<string, any>;
  payload?: any;
  url: string;
}

export async function apiRequestHandler(params: RequestParams): Promise<any> {
  const { orgUid, queryParams, payload, url } = params;
  const authtoken = configHandler.get('authtoken');
  
  const headers = {
    organization_uid: orgUid,
    authtoken
  }
  const httpClient = new HttpClient()
  httpClient.headers(headers)
  if (queryParams) 
    httpClient.queryParams(queryParams);

  try {
    const response = await httpClient.put(url, payload)
    const { status, data } = response;
    if (status >= 200 && status < 300) {
      return data;
    }
    data?.error
      ? formatErrors(data.error)
      : data?.error_message || 'Something went wrong';
    throw data;
    
  } catch (error) {
    throw error;
  }
}
