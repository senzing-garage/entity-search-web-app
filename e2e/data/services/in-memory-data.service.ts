import { InMemoryDbService } from 'angular-in-memory-web-api';
import { e2eSearchSpecData } from '../mock/search';

export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    return e2eSearchSpecData;
  }
}
