import { composerApi } from "./apis";


export async function retrieveStatement(id:number): Promise<any> {
    try{
        const response = await composerApi.composerConnectivityStatementRetrieve(id)
        return response.data
    } catch (error){
        return error
    }
}