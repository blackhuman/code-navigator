import storage, { selectAllNodes, selectAllNodesFunc, Storage } from "./storage";

export function serviceSelectAllNodes() {
  return selectAllNodes();
}

export class Service {
  storage = new Storage();

  serviceSelectAllNodesMethod() {
    this.storage.selectAllNodesMethod();
  }
}

function invokeFunc(func) {
  func();
}

invokeFunc(selectAllNodesFunc);

class InvokeFuncClazz {
  invokeFuncMethod(func) {
    func();
  }
}

const clazz = new InvokeFuncClazz();
clazz.invokeFuncMethod(selectAllNodesFunc);
clazz.invokeFuncMethod(storage.selectAllNodesFunc);