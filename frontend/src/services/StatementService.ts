import { composerApi } from "./apis";


export async function retrieveStatement(id:number): Promise<any> {
    const response = await composerApi.composerConnectivityStatementRetrieve(id)
        return response.data
}

