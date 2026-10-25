// ============================================================
// SHIKSHA SAHAYAK OS - ENTERPRISE BASE DOMAIN SERVICE ABSTRACTION
// ============================================================

import { IBaseService } from "../../../src/types/backend-architecture";
import { BaseRepository } from "../repositories/baseRepository";
import { Env } from "../contentEngine";

export abstract class BaseService<T extends { id: string }> implements IBaseService<T> {
  protected env: Env;
  protected repository: BaseRepository<T>;
  protected serviceName: string;

  constructor(env: Env, repository: BaseRepository<T>, serviceName: string) {
    this.env = env;
    this.repository = repository;
    this.serviceName = serviceName;
  }

  /** Business rule validation hook before entity creation/modification */
  protected abstract validate(entity: Partial<T>): { isValid: boolean; errors: string[] };

  async getById(id: string): Promise<T | null> {
    if (!id || !id.trim()) return null;
    return this.repository.findById(id);
  }

  async list(params: Record<string, unknown> = {}): Promise<T[]> {
    const limit = params.limit ? Number(params.limit) : 50;
    const offset = params.offset ? Number(params.offset) : 0;
    delete params.limit;
    delete params.offset;
    return this.repository.findAll(params, limit, offset);
  }

  async save(entity: Partial<T>): Promise<T> {
    const validation = this.validate(entity);
    if (!validation.isValid) {
      throw new Error(`[BaseService:${this.serviceName}] Business Validation Error: ${validation.errors.join(", ")}`);
    }

    if (entity.id) {
      const existing = await this.repository.findById(entity.id);
      if (existing) {
        await this.repository.update(entity.id, entity);
        return { ...existing, ...entity } as T;
      }
    }

    return this.repository.create(entity);
  }

  async remove(id: string): Promise<boolean> {
    if (!id) return false;
    return this.repository.delete(id);
  }
}
