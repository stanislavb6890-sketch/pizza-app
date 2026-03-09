import type { DeliveryZone } from '../entities/delivery-zone.entity';

export interface DeliveryZoneRepository {
  findById(id: string): Promise<DeliveryZone | null>;
  findAll(): Promise<DeliveryZone[]>;
  findActive(): Promise<DeliveryZone[]>;
  save(zone: DeliveryZone): Promise<DeliveryZone>;
  update(zone: DeliveryZone): Promise<DeliveryZone>;
  delete(id: string): Promise<void>;
}
