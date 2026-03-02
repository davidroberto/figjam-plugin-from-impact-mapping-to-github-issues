import type { RawConnector } from '../rawTypes';
import type { BuildHierarchyConnectorReader } from './buildHierarchy.connectorReader';

export class BuildHierarchyFigmaConnectorReader
  implements BuildHierarchyConnectorReader
{
  readAllConnectors(): RawConnector[] {
    const connectors = figma.currentPage.findAll(
      (node) => node.type === 'CONNECTOR',
    ) as ConnectorNode[];

    const result: RawConnector[] = [];

    for (const connector of connectors) {
      const startId = this.getEndpointNodeId(connector.connectorStart);
      const endId = this.getEndpointNodeId(connector.connectorEnd);
      if (!startId || !endId) continue;

      result.push({
        startNodeId: startId,
        endNodeId: endId,
      });
    }

    return result;
  }

  private getEndpointNodeId(
    endpoint: ConnectorEndpoint,
  ): string | undefined {
    if ('endpointNodeId' in endpoint) {
      return endpoint.endpointNodeId;
    }
    return undefined;
  }
}
