import type { RawConnector } from '../rawTypes';

export interface BuildHierarchyConnectorReader {
  readAllConnectors(): RawConnector[];
}
