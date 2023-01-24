import { composerApi } from "./apis";
import { ConnectivityStatement } from "../apiclient/backend";


export async function retrieveStatement(id:number): Promise<any> {
    const response = await composerApi.composerConnectivityStatementRetrieve(id)
        return response.data
}

export async function createStatement(formStatement:any, sentenceId:any): Promise<any> {
    const statement = mapFormDataToStatement(formStatement, sentenceId)
    const response = await composerApi.composerConnectivityStatementCreate(statement, {xsrfCookieName: 'csrftoken', xsrfHeaderName:'X-CSRFToken'})
    return response.data
}

function mapFormDataToStatement(formData:any, sentenceId:any): ConnectivityStatement{
    const statement = {
        knowledge_statement: formData.knowledgeStatement, 
        sentence: Number(sentenceId),
        id:0,
        available_transitions:[],
        path:[],
        state:'',
        owner: null,
    }
    return statement
}