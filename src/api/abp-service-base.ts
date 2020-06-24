import { AxiosResponse } from 'axios'
import service from "../utils/request"

export class AbpServiceBase {
  protected ajax = service;
  protected transformResult(url: string, response: AxiosResponse, processor: (response: AxiosResponse) => Promise<any>): Promise<any> {
    // if(response.data.result){
    //     response.data=response.data.result;
    // }
    console.log(response)
    return processor(response)
  }
}
