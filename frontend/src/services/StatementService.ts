import { composerApi } from "./apis";
import { ConnectivityStatement } from "../apiclient/backend";


export async function retrieveStatement(id:number): Promise<any> {
    const response = await composerApi.composerConnectivityStatementRetrieve(id)
        return response.data
}

export async function createStatement(formStatement:any, sentenceId:any): Promise<any> {
    const response = await composerApi.composerConnectivityStatementCreate(formStatement, {xsrfCookieName: 'csrftoken', xsrfHeaderName:'X-CSRFToken'})
    return response.data
}
