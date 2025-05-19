export abstract class AbstractService {

  abstract getObject(id: string): any;
  abstract save(object: any): any;
}
