import { serviceSelectAllNodes, Service } from "./service";

function handlerSelectAllNodes() {
  return serviceSelectAllNodes();
}

class Controller {
  service = new Service();

  handlerSelectAllNodesMethod() {
    this.service.serviceSelectAllNodesMethod();
  }
}
