import { authApi } from "./apis";

export async function login(): Promise<any> {
   const response = await authApi.metacellAuthLoginRetrieve()
   if (response.data.status_code === 302) {
    return response.data.redirect_url
   }
   return response
}
