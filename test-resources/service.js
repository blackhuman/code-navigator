import { selectAllNodes, Storage } from "./storage";

export function serviceSelectAllNodes() {
  return selectAllNodes();
}

export class Service {
  storage = new Storage();

  serviceSelectAllNodesMethod() {
    this.storage.selectAllNodesMethod();
  }
}
