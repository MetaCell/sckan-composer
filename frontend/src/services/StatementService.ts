import { composerApi } from "./apis";

export async function statementRetrieve(id: number): Promise<any> {
  return composerApi.composerConnectivityStatementRetrieve(id).then((response: any) => {
    if (response.status === 200) {
      return response.data
    } else {
      console.log("Error")
    }
  })
}

export async function getStatementJsonSchema(): Promise<any> {
  return composerApi.composerConnectivityStatementJsonschemaRetrieve().then((response: any) => {
    if (response.status === 200) {
      return response.data
    } else {
      console.log("Error")
    }
  })
}
