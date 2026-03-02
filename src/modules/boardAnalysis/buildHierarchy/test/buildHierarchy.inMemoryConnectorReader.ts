import type { RawConnector } from '../../rawTypes';
import type { BuildHierarchyConnectorReader } from '../buildHierarchy.connectorReader';

export class BuildHierarchyInMemoryConnectorReader
  implements BuildHierarchyConnectorReader
{
  private connectors: RawConnector[] = [];

  feedConnectors(connectors: RawConnector[]): void {
    this.connectors = connectors;
  }

  readAllConnectors(): RawConnector[] {
    return this.connectors;
  }
}
